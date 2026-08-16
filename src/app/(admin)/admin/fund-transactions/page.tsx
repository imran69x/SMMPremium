"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Eye, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, Loader, DollarSign, X } from 'lucide-react';

import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const statusColors: Record<string, string> = {
  completed: 'bg-green-50 text-green-700 border border-green-200',
  pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  failed: 'bg-red-50 text-red-700 border border-red-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
};

export default function FundTransactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const PER_PAGE = 20;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Load Users
      const usersSnap = await getDocs(collection(db, 'users'));
      const uMap: Record<string, any> = {};
      usersSnap.forEach(doc => {
        uMap[doc.id] = doc.data();
      });
      setUsersMap(uMap);

      // Load Transactions
      const txSnap = await getDocs(collection(db, 'antipay_transactions'));
      const list: any[] = [];
      txSnap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setTransactions(list);
    } catch (err: any) {
      console.error("Error loading fund transactions:", err);
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = transactions.filter(t => {
    const user = usersMap[t.uid] || {};
    const matchSearch = !search ||
      (t.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.trxId || '').toLowerCase().includes(search.toLowerCase()) ||
      (user.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = filterStatus === 'all' || (t.status || '').toLowerCase() === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-[#FF6B00]" />
            Fund Transactions
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage and view all user balance deposits</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition shadow-sm font-bold text-sm">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Transaction ID, Name, or Email..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 focus:border-[#FF6B00] transition"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {['all', 'completed', 'pending', 'failed'].map(s => (
              <button 
                key={s} 
                onClick={() => { setFilterStatus(s); setPage(1); }} 
                className={`px-4 py-2.5 rounded-xl font-bold text-sm capitalize whitespace-nowrap transition ${filterStatus === s ? 'bg-[#FF6B00] text-white shadow-md' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-xs font-black tracking-wider">
              <tr>
                <th className="px-5 py-4">Transaction ID</th>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500"><Loader className="h-6 w-6 animate-spin mx-auto mb-2 text-[#FF6B00]" />Loading transactions...</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-red-500 font-medium">{error}</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500 font-medium">No transactions found.</td></tr>
              ) : (
                paginated.map((t) => {
                  const user = usersMap[t.uid] || { name: 'Unknown', email: 'N/A' };
                  const statusClass = statusColors[t.status?.toLowerCase()] || 'bg-slate-100 text-slate-700';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-5 py-4 font-bold text-slate-700">{t.trxId || t.id.substring(0,8)}</td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800">{user.name || 'User'}</div>
                        <div className="text-xs text-slate-500">{user.email || t.uid}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-black text-slate-800">৳{t.amount || 0}</div>
                        {t.creditedUsd && <div className="text-xs text-green-600 font-bold">+${t.creditedUsd.toFixed(4)}</div>}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${statusClass}`}>
                          {t.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs font-medium">
                        {t.createdAt ? new Date(t.createdAt).toLocaleString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '') : 'N/A'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button 
                          onClick={() => setSelectedTx({ ...t, user })}
                          className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between px-2">
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

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-black text-slate-800">Transaction Details</h3>
              <button onClick={() => setSelectedTx(null)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Status</p>
                    <span className={`px-2.5 py-1 inline-block rounded-md text-xs font-bold uppercase tracking-wider ${statusColors[selectedTx.status?.toLowerCase()] || 'bg-slate-200 text-slate-800'}`}>
                      {selectedTx.status || 'Pending'}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Amount</p>
                    <p className="text-lg font-black text-slate-800">৳{selectedTx.amount || 0}</p>
                    {selectedTx.creditedUsd && <p className="text-sm font-bold text-green-600">+${selectedTx.creditedUsd.toFixed(4)}</p>}
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl overflow-hidden text-sm">
                  <div className="flex border-b border-slate-100">
                    <div className="w-1/3 bg-slate-50 p-3 font-bold text-slate-600 border-r border-slate-100">Transaction ID</div>
                    <div className="w-2/3 p-3 font-medium text-slate-800 break-all">{selectedTx.trxId || selectedTx.id}</div>
                  </div>
                  <div className="flex border-b border-slate-100">
                    <div className="w-1/3 bg-slate-50 p-3 font-bold text-slate-600 border-r border-slate-100">User Name</div>
                    <div className="w-2/3 p-3 font-medium text-slate-800">{selectedTx.user?.name || 'Unknown'}</div>
                  </div>
                  <div className="flex border-b border-slate-100">
                    <div className="w-1/3 bg-slate-50 p-3 font-bold text-slate-600 border-r border-slate-100">Email</div>
                    <div className="w-2/3 p-3 font-medium text-slate-800">{selectedTx.user?.email || 'N/A'}</div>
                  </div>
                  <div className="flex border-b border-slate-100">
                    <div className="w-1/3 bg-slate-50 p-3 font-bold text-slate-600 border-r border-slate-100">Method</div>
                    <div className="w-2/3 p-3 font-medium text-slate-800 capitalize">{selectedTx.method || 'AntiPay Gateway'}</div>
                  </div>
                  <div className="flex border-b border-slate-100">
                    <div className="w-1/3 bg-slate-50 p-3 font-bold text-slate-600 border-r border-slate-100">Session ID</div>
                    <div className="w-2/3 p-3 font-medium text-slate-800 break-all text-xs">{selectedTx.sessionId || 'N/A'}</div>
                  </div>
                  <div className="flex border-b border-slate-100">
                    <div className="w-1/3 bg-slate-50 p-3 font-bold text-slate-600 border-r border-slate-100">Created At</div>
                    <div className="w-2/3 p-3 font-medium text-slate-800">
                      {selectedTx.createdAt ? new Date(selectedTx.createdAt).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-1/3 bg-slate-50 p-3 font-bold text-slate-600 border-r border-slate-100">Completed At</div>
                    <div className="w-2/3 p-3 font-medium text-slate-800">
                      {selectedTx.completedAt ? new Date(selectedTx.completedAt).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 text-right">
              <button onClick={() => setSelectedTx(null)} className="px-5 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
