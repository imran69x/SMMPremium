"use client";

import React, { useState, useEffect } from 'react';
import { Search, UserCheck, DollarSign, ChevronLeft, ChevronRight, Loader, RefreshCw, Copy, MinusCircle } from 'lucide-react';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useCurrency } from '@/lib/contexts/CurrencyContext';

const getShortUid = (uid: string) => {
  if (!uid) return '000000';
  let hash = 5381;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 33) ^ uid.charCodeAt(i);
  }
  return Math.abs(hash).toString().substring(0, 6).padStart(6, '0');
};

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [addBalanceUser, setAddBalanceUser] = useState<any | null>(null);
  const [editBalanceUser, setEditBalanceUser] = useState<any | null>(null);
  const [removeBalanceUser, setRemoveBalanceUser] = useState<any | null>(null);
  const [addAmount, setAddAmount] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [removeAmount, setRemoveAmount] = useState('');
  const [addCurrency, setAddCurrency] = useState<'USD' | 'BDT'>('BDT');
  const [removeCurrency, setRemoveCurrency] = useState<'USD' | 'BDT'>('BDT');
  const [activeCurrencies, setActiveCurrencies] = useState<string[]>(['USD', 'BDT']);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [displayCurrency, setDisplayCurrency] = useState<'BDT' | 'USD'>('BDT');
  const [totalSpentMap, setTotalSpentMap] = useState<Record<string, number>>({});
  const { rate } = useCurrency();
  const PER_PAGE = 15;

  // Load active currencies from settings to set smart default
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        const active: string[] = data.activeCurrencies || ['USD', 'BDT'];
        setActiveCurrencies(active);
        // If BDT is active, default to BDT; otherwise USD
        if (active.includes('BDT')) {
          setAddCurrency('BDT');
          setRemoveCurrency('BDT');
          setDisplayCurrency('BDT');
        } else {
          setAddCurrency('USD');
          setRemoveCurrency('USD');
          setDisplayCurrency('USD');
        }
      })
      .catch(() => {});
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const list: any[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setUsers(list);

      // Load total spent from orders per user (charge field, USD)
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const spentMap: Record<string, number> = {};
      ordersSnap.forEach((docSnap) => {
        const o = docSnap.data();
        const uid = o.uid;
        if (!uid) return;
        const charge = parseFloat(o.charge || o.totalCharge || 0);
        if (!isNaN(charge) && charge > 0) {
          spentMap[uid] = (spentMap[uid] || 0) + charge;
        }
      });
      setTotalSpentMap(spentMap);
    } catch (err: any) {
      console.error("Error loading users:", err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  const filtered = users.filter(u => {
    const shortUid = getShortUid(u.uid || u.id);
    return (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    shortUid.includes(search);
  }).sort((a, b) => (parseFloat(b.balance || 0) - parseFloat(a.balance || 0)));

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleAddBalance = async () => {
    if (!addBalanceUser || !addAmount) return;
    
    let finalAmount = parseFloat(addAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) return;
    
    const originalBdt = addCurrency === 'BDT' ? finalAmount : null;
    if (addCurrency === 'BDT') {
      finalAmount = finalAmount / rate;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/add-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: addBalanceUser.id,
          amountToAdd: finalAmount,
          currency: addCurrency,          // pass currency for transaction log
          bdtAmount: originalBdt,         // raw BDT if entered in BDT
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update balance');

      setUsers(prev => prev.map(u => u.id === addBalanceUser.id ? { ...u, balance: data.newBalance } : u));
      setAddBalanceUser(null);
      setAddAmount('');
    } catch (err: any) {
      alert(err.message || 'Error updating balance');
    } finally {
      setSaving(false);
    }
  };

  const handleEditBalance = async () => {
    if (!editBalanceUser || !editAmount) return;
    
    let finalAmount = parseFloat(editAmount);
    if (isNaN(finalAmount) || finalAmount < 0) return;

    const originalBdt = addCurrency === 'BDT' ? finalAmount : null;
    if (addCurrency === 'BDT') {
      finalAmount = finalAmount / rate;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/edit-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editBalanceUser.id,
          newBalance: finalAmount,
          currency: addCurrency,
          bdtAmount: originalBdt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to edit balance');

      setUsers(prev => prev.map(u => u.id === editBalanceUser.id ? { ...u, balance: data.newBalance } : u));
      setEditBalanceUser(null);
    } catch (err: any) {
      alert(err.message || 'Error editing balance');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveBalance = async () => {
    if (!removeBalanceUser || !removeAmount) return;
    
    let rawAmount = parseFloat(removeAmount);
    if (isNaN(rawAmount) || rawAmount <= 0) return;
    
    const finalAmountUsd = removeCurrency === 'BDT' ? rawAmount / rate : rawAmount;
    const originalBdt = removeCurrency === 'BDT' ? rawAmount : rawAmount * rate;

    const currentBalUsd = parseFloat(removeBalanceUser.balance || 0);
    if (finalAmountUsd > currentBalUsd + 0.0001) {
      alert(`User balance is not enough to deduct this amount. Current balance: ${removeCurrency === 'BDT' ? (currentBalUsd * rate).toFixed(2) + ' BDT' : '$' + currentBalUsd.toFixed(4)}`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/remove-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: removeBalanceUser.id,
          amountToRemove: finalAmountUsd,
          currency: removeCurrency,
          bdtAmount: originalBdt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove balance');

      setUsers(prev => prev.map(u => u.id === removeBalanceUser.id ? { ...u, balance: data.newBalance } : u));
      setRemoveBalanceUser(null);
      setRemoveAmount('');
    } catch (err: any) {
      alert(err.message || 'Error removing balance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">User Management</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">{users.length} registered users</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setDisplayCurrency('BDT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                displayCurrency === 'BDT'
                  ? 'bg-white text-[#FF6B00] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              BDT
            </button>
            <button
              onClick={() => setDisplayCurrency('USD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                displayCurrency === 'USD'
                  ? 'bg-white text-[#FF6B00] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              USD
            </button>
          </div>
          <button
            onClick={loadUsers}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF6B00] text-white font-bold rounded-xl text-sm shadow hover:bg-orange-600 transition"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email or UID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#FF6B00] transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader className="h-8 w-8 text-[#FF6B00] animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 font-bold">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 font-medium">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-4 font-bold text-slate-500 uppercase text-xs tracking-wide">User</th>
                  <th className="text-left px-5 py-4 font-bold text-slate-500 uppercase text-xs tracking-wide">Role</th>
                  <th className="text-left px-5 py-4 font-bold text-slate-500 uppercase text-xs tracking-wide">Balance</th>
                  <th className="text-left px-5 py-4 font-bold text-slate-500 uppercase text-xs tracking-wide">Total Spent</th>
                  <th className="text-left px-5 py-4 font-bold text-slate-500 uppercase text-xs tracking-wide">Joined</th>
                  <th className="text-left px-5 py-4 font-bold text-slate-500 uppercase text-xs tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.map(user => {
                  const shortUid = getShortUid(user.uid || user.id);
                  return (
                  <tr key={user.id} className="hover:bg-orange-50/30 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#FF6B00] to-orange-400 flex items-center justify-center text-white font-black text-sm shadow shrink-0">
                          {(user.name || user.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{user.name || '—'}</p>
                          <p className="text-slate-400 text-xs truncate">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-slate-400 text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded inline-block">ID: {shortUid}</p>
                            <button 
                              onClick={() => navigator.clipboard.writeText(shortUid)} 
                              className="text-slate-400 hover:text-[#FF6B00] transition"
                              title="Copy User ID"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${user.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                          {user.role || 'customer'}
                        </span>
                        {user.level && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-orange-100 text-[#FF6B00]">
                            🏆 {user.level}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-700">
                      {displayCurrency === 'USD' 
                        ? `$${parseFloat(user.balance || 0).toFixed(2)}`
                        : `${(parseFloat(user.balance || 0) * rate).toFixed(2)} BDT`}
                    </td>
                    <td className="px-5 py-4 font-bold text-purple-700">
                      {(() => {
                        const spentUsd = totalSpentMap[user.uid || user.id] || 0;
                        if (spentUsd === 0) return <span className="text-slate-300 font-medium">—</span>;
                        return displayCurrency === 'USD'
                          ? `$${spentUsd.toFixed(2)}`
                          : `${(spentUsd * rate).toFixed(2)} BDT`;
                      })()}
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-xs font-medium">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { 
                            const defaultCurr = activeCurrencies.includes('BDT') ? 'BDT' : 'USD';
                            setAddCurrency(defaultCurr);
                            setAddBalanceUser(user); 
                            setAddAmount(''); 
                          }}
                          title="Add Balance"
                          className="flex items-center justify-center p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition text-xs font-bold"
                        >
                          <DollarSign className="h-4 w-4" /> <span className="ml-1 hidden sm:inline">Add</span>
                        </button>
                        <button
                          onClick={() => { 
                            const defaultCurr = activeCurrencies.includes('BDT') ? 'BDT' : 'USD';
                            setRemoveCurrency(defaultCurr);
                            setRemoveBalanceUser(user); 
                            setRemoveAmount(''); 
                          }}
                          title="Remove Balance"
                          className="flex items-center justify-center p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition text-xs font-bold"
                        >
                          <MinusCircle className="h-4 w-4" /> <span className="ml-1 hidden sm:inline">Remove</span>
                        </button>
                        <button
                          onClick={() => { 
                            const defaultCurr = activeCurrencies.includes('BDT') ? 'BDT' : 'USD';
                            setAddCurrency(defaultCurr);
                            setEditBalanceUser(user); 
                            if (defaultCurr === 'BDT') {
                              setEditAmount((parseFloat(user.balance || 0) * rate).toFixed(2));
                            } else {
                              setEditAmount(parseFloat(user.balance || 0).toFixed(4));
                            }
                          }}
                          title="Edit Balance"
                          className="flex items-center justify-center p-2 rounded-lg bg-orange-50 text-[#FF6B00] hover:bg-orange-100 transition text-xs font-bold"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> <span className="ml-1 hidden sm:inline">Edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between">
            <p className="text-sm text-slate-500 font-medium">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-slate-600 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-bold transition ${p === page ? 'bg-[#FF6B00] text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{p}</button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-slate-600 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Add Balance Modal */}
      {addBalanceUser && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-orange-100">
            <h3 className="text-lg font-black text-slate-800 mb-1">Add Balance</h3>
            <p className="text-sm text-slate-500 mb-1">Adding to <strong>{addBalanceUser.name || addBalanceUser.email}</strong></p>
            <p className="text-xs text-slate-400 mb-4">Current balance: <strong>{(parseFloat(addBalanceUser.balance || 0) * rate).toFixed(2)} BDT / ${parseFloat(addBalanceUser.balance || 0).toFixed(4)}</strong></p>
            <div className="flex gap-2 mb-4">
              <select 
                value={addCurrency} 
                onChange={e => setAddCurrency(e.target.value as 'USD' | 'BDT')}
                className="px-3 py-3 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#FF6B00] transition bg-white"
              >
                {activeCurrencies.includes('BDT') && <option value="BDT">BDT</option>}
                {activeCurrencies.includes('USD') && <option value="USD">USD ($)</option>}
              </select>
              <input
                type="number"
                placeholder={`Amount in ${addCurrency}`}
                value={addAmount}
                onChange={e => setAddAmount(e.target.value)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#FF6B00] transition"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setAddBalanceUser(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition text-sm">Cancel</button>
              <button onClick={handleAddBalance} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#FF6B00] text-white font-black text-sm hover:bg-orange-600 transition shadow disabled:opacity-50">
                {saving ? 'Saving...' : addCurrency === 'USD' ? `Add $${addAmount || '0'}` : `Add ${addAmount || '0'} BDT`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Balance Modal */}
      {editBalanceUser && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-orange-100">
            <h3 className="text-lg font-black text-slate-800 mb-1">Edit Balance</h3>
            <p className="text-sm text-slate-500 mb-1">Editing for <strong>{editBalanceUser.name || editBalanceUser.email}</strong></p>
            <p className="text-xs text-slate-400 mb-4">Current balance: <strong>{(parseFloat(editBalanceUser.balance || 0) * rate).toFixed(2)} BDT / ${parseFloat(editBalanceUser.balance || 0).toFixed(4)}</strong></p>
            <div className="flex gap-2 mb-4">
              <select 
                value={addCurrency} 
                onChange={e => {
                  const newCurr = e.target.value as 'USD' | 'BDT';
                  setAddCurrency(newCurr);
                  if (editAmount) {
                    const currentAmt = parseFloat(editAmount);
                    if (!isNaN(currentAmt)) {
                      setEditAmount(newCurr === 'BDT' ? (currentAmt * rate).toFixed(2) : (currentAmt / rate).toFixed(4));
                    }
                  }
                }}
                className="px-3 py-3 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#FF6B00] transition bg-white"
              >
                {activeCurrencies.includes('BDT') && <option value="BDT">BDT</option>}
                {activeCurrencies.includes('USD') && <option value="USD">USD ($)</option>}
              </select>
              <input
                type="number"
                placeholder={`Set Amount in ${addCurrency}`}
                value={editAmount}
                onChange={e => setEditAmount(e.target.value)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-[#FF6B00] transition"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditBalanceUser(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition text-sm">Cancel</button>
              <button onClick={handleEditBalance} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#FF6B00] text-white font-black text-sm hover:bg-orange-600 transition shadow disabled:opacity-50">
                {saving ? 'Saving...' : addCurrency === 'USD' ? `Set $${editAmount || '0'}` : `Set ${editAmount || '0'} BDT`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Balance Modal */}
      {removeBalanceUser && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-red-100">
            <h3 className="text-lg font-black text-red-600 mb-1">Remove Balance</h3>
            <p className="text-sm text-slate-500 mb-1">Deducting from <strong>{removeBalanceUser.name || removeBalanceUser.email}</strong></p>
            <p className="text-xs text-slate-400 mb-4">
              Current balance: <strong>{(parseFloat(removeBalanceUser.balance || 0) * rate).toFixed(2)} BDT / ${parseFloat(removeBalanceUser.balance || 0).toFixed(4)}</strong>
            </p>
            <div className="flex gap-2 mb-4">
              <select 
                value={removeCurrency} 
                onChange={e => setRemoveCurrency(e.target.value as 'USD' | 'BDT')}
                className="px-3 py-3 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-red-500 transition bg-white"
              >
                {activeCurrencies.includes('BDT') && <option value="BDT">BDT</option>}
                {activeCurrencies.includes('USD') && <option value="USD">USD ($)</option>}
              </select>
              <input
                type="number"
                placeholder={`Amount to remove in ${removeCurrency}`}
                value={removeAmount}
                onChange={e => setRemoveAmount(e.target.value)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-red-500 transition"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRemoveBalanceUser(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition text-sm">Cancel</button>
              <button onClick={handleRemoveBalance} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-black text-sm hover:bg-red-700 transition shadow disabled:opacity-50">
                {saving ? 'Removing...' : removeCurrency === 'USD' ? `Remove $${removeAmount || '0'}` : `Remove ${removeAmount || '0'} BDT`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
