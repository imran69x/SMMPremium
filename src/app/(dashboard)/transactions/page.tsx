"use client";

import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { 
  Loader, ArrowUpRight, ArrowDownLeft, ShoppingCart, 
  Wallet, ArrowRightLeft, Search, Filter 
} from 'lucide-react';

export default function TransactionsHistory() {
  const { user } = useAuth();
  const { formatPrice, rate, currency, activeCurrencies } = useCurrency();
  const isBdtMode = currency === 'BDT' || (activeCurrencies?.length === 1 && activeCurrencies[0] === 'BDT');

  const formatTxAmount = (amountUsd: number, isPositive: boolean, rawBdt?: number | null) => {
    if (isBdtMode) {
      const bdt = rawBdt !== undefined && rawBdt !== null 
        ? Number(rawBdt) 
        : Number(amountUsd || 0) * rate;
      return `${isPositive ? '+' : '-'}${bdt.toFixed(2)} BDT`;
    }
    return `${isPositive ? '+' : '-'}$${Number(amountUsd || 0).toFixed(4)}`;
  };

  const [orders, setOrders] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [adminAdj, setAdminAdj] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingTransfers, setLoadingTransfers] = useState(true);
  const [loadingDeposits, setLoadingDeposits] = useState(true);
  const [loadingAdminAdj, setLoadingAdminAdj] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'transfer' | 'order' | 'deposit' | 'admin'>('all');
  const [search, setSearch] = useState('');

  // 1. Load Orders
  useEffect(() => {
    if (!user) return;
    setLoadingOrders(true);
    
    const q = query(
      collection(db, 'orders'), 
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ 
          id: docSnap.id, 
          itemType: 'order', 
          ...docSnap.data() 
        });
      });
      setOrders(list);
      setLoadingOrders(false);
    }, (err) => {
      console.error("Failed to load orders", err);
      setLoadingOrders(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Load Balance Transfers (Sent and Received)
  useEffect(() => {
    if (!user) return;
    setLoadingTransfers(true);

    const q = query(
      collection(db, 'balance_transfers'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ 
          id: docSnap.id, 
          itemType: 'transfer', 
          ...docSnap.data() 
        });
      });
      setTransfers(list);
      setLoadingTransfers(false);
    }, (err) => {
      console.error("Failed to load transfers", err);
      setLoadingTransfers(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 3. Load Deposits (Antipay completed transactions)
  useEffect(() => {
    if (!user) return;
    setLoadingDeposits(true);

    const q = query(
      collection(db, 'antipay_transactions'),
      where('uid', '==', user.uid),
      where('status', '==', 'completed')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ 
          id: docSnap.id, 
          itemType: 'deposit', 
          ...docSnap.data() 
        });
      });
      setDeposits(list);
      setLoadingDeposits(false);
    }, (err) => {
      console.error("Failed to load deposits", err);
      setLoadingDeposits(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 4. Load Admin Balance Adjustments
  useEffect(() => {
    if (!user) { setLoadingAdminAdj(false); return; }
    setLoadingAdminAdj(true);

    const q = query(
      collection(db, 'admin_balance_adjustments'),
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, itemType: 'admin', ...docSnap.data() });
      });
      setAdminAdj(list);
      setLoadingAdminAdj(false);
    }, (err) => {
      console.error('Failed to load admin adjustments', err);
      setLoadingAdminAdj(false);
    });

    return () => unsubscribe();
  }, [user]);

  const isLoading = loadingOrders && loadingTransfers && loadingDeposits && loadingAdminAdj;

  // Combine and sort chronologically
  const allTransactions = [...orders, ...transfers, ...deposits, ...adminAdj].sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  // Filter by tab and search keyword
  const filtered = allTransactions.filter(t => {
    if (filterType !== 'all' && t.itemType !== filterType) return false;
    
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = (t.id || '').toLowerCase().includes(q) || (t.apiOrderId || '').toString().toLowerCase().includes(q);
      const matchDesc = (t.serviceName || t.senderName || t.recipientName || t.trx_id || t.note || '').toLowerCase().includes(q);
      const matchShortId = (t.senderShortId || t.recipientShortId || '').toString().toLowerCase().includes(q);
      return matchId || matchDesc || matchShortId;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#D85700] to-[#FF8B33] rounded-2xl p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold mb-1">Transaction History</h2>
          <p className="text-orange-100 text-sm">
            View all your balance transfers, service expenditures, and deposits in one place.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${filterType === 'all' ? 'bg-[#FF6B00] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            All ({allTransactions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('transfer')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${filterType === 'transfer' ? 'bg-[#FF6B00] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <ArrowRightLeft className="h-3.5 w-3.5" /> Transfers ({transfers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('order')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${filterType === 'order' ? 'bg-[#FF6B00] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <ShoppingCart className="h-3.5 w-3.5" /> Orders ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('deposit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${filterType === 'deposit' ? 'bg-[#FF6B00] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <Wallet className="h-3.5 w-3.5" /> Deposits ({deposits.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('admin')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${filterType === 'admin' ? 'bg-[#FF6B00] text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <ArrowRightLeft className="h-3.5 w-3.5" /> Admin ({adminAdj.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#FF6B00] text-slate-700"
          />
          <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader className="h-7 w-7 animate-spin mx-auto mb-2 text-[#FF6B00]" />
                    <span className="text-slate-500 font-medium text-xs">Loading transaction history...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  if (t.itemType === 'transfer') {
                    const isSender = t.senderUid === user?.uid;
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        {/* Type Icon & Ref */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isSender ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                              {isSender ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                            </div>
                            <div>
                              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                {isSender ? 'Transfer Sent' : 'Transfer Received'}
                              </div>
                              <div className="font-mono font-bold text-slate-800 text-xs">
                                {t.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Details */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">
                            {isSender ? (
                              <span>Sent to <strong className="text-[#D85700]">{t.recipientName}</strong> (ID: #{t.recipientShortId})</span>
                            ) : (
                              <span>Received from <strong className="text-green-700">{t.senderName}</strong> (ID: #{t.senderShortId})</span>
                            )}
                          </div>
                          {t.note && (
                            <div className="text-xs text-slate-500 italic mt-0.5">
                              Note: &quot;{t.note}&quot;
                            </div>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-6 py-4">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Amount</div>
                          <div className={`text-base font-black font-mono ${isSender ? 'text-red-500' : 'text-green-600'}`}>
                            {formatTxAmount(t.amount, !isSender, t.amountBdt)}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-100 text-green-800">
                            Completed
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-right">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Date & Time</div>
                          <div className="font-medium text-slate-700 text-xs mt-0.5">
                            {t.createdAt ? new Date(t.createdAt).toLocaleString('en-CA', { 
                              year: 'numeric', month: 'short', day: '2-digit', 
                              hour: '2-digit', minute: '2-digit', hour12: true 
                            }) : 'N/A'}
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  if (t.itemType === 'order') {
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        {/* Type Icon & Ref */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-orange-50 text-[#FF6B00] flex items-center justify-center shrink-0">
                              <ShoppingCart className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                Order Expenditure
                              </div>
                              <div className="font-mono font-bold text-slate-800 text-xs">
                                #{t.apiOrderId || t.id.substring(0, 8)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Details */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">
                            Service ID: {t.serviceId}
                          </div>
                          <div className="text-xs text-slate-500 max-w-sm truncate mt-0.5">
                            {t.serviceName || t.link || 'Order Service'}
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-6 py-4">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Amount Deducted</div>
                          <div className="text-base font-black font-mono text-red-500">
                            {formatTxAmount(t.charge, false, t.chargeBdt)}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 capitalize">
                            {t.status || 'Completed'}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-right">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Date & Time</div>
                          <div className="font-medium text-slate-700 text-xs mt-0.5">
                            {t.createdAt ? new Date(t.createdAt).toLocaleString('en-CA', { 
                              year: 'numeric', month: 'short', day: '2-digit', 
                              hour: '2-digit', minute: '2-digit', hour12: true 
                            }) : 'N/A'}
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  if (t.itemType === 'deposit') {
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        {/* Type Icon & Ref */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              <Wallet className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                Deposit ({t.method || 'bKash/Nagad'})
                              </div>
                              <div className="font-mono font-bold text-slate-800 text-xs">
                                {t.val_id || t.id.substring(0, 10)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Details */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">
                            Payment Deposit
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            TrxID: <span className="font-mono font-bold">{t.bank_trx_id || t.trx_id || t.id}</span>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-6 py-4">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Amount Credited</div>
                          <div className="text-base font-black font-mono text-green-600">
                            {formatTxAmount(t.creditedUsd || (t.amount / (rate || 120)), true, t.bdtAmount || t.amount)}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-100 text-green-800">
                            Completed
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-right">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Date & Time</div>
                          <div className="font-medium text-slate-700 text-xs mt-0.5">
                            {t.createdAt ? new Date(t.createdAt).toLocaleString('en-CA', { 
                              year: 'numeric', month: 'short', day: '2-digit', 
                              hour: '2-digit', minute: '2-digit', hour12: true 
                            }) : 'N/A'}
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  if (t.itemType === 'admin') {
                    const isCredit = t.type === 'admin_credit';
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        {/* Type Icon & Ref */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isCredit ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                              {isCredit ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                            </div>
                            <div>
                              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                {isCredit ? 'Admin Credit' : 'Admin Debit'}
                              </div>
                              <div className="font-mono font-bold text-slate-800 text-xs">
                                {t.id.substring(0, 10)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Details */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">
                            {isCredit ? 'Balance Added by Admin' : 'Balance Removed by Admin'}
                          </div>
                          {t.note && (
                            <div className="text-xs text-slate-500 italic mt-0.5 max-w-xs truncate">
                              {isBdtMode
                                ? (t.bdtAmount !== undefined && t.bdtAmount !== null
                                    ? (isCredit 
                                        ? `Admin added ${Number(t.bdtAmount).toFixed(2)} BDT to account` 
                                        : `Admin removed balance: set to ${Number(t.bdtAmount).toFixed(2)} BDT`)
                                    : t.note?.startsWith('Admin added $')
                                    ? `Admin added ${(Number(t.amount || 0) * rate).toFixed(2)} BDT to account`
                                    : t.note)
                                : t.note}
                            </div>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-6 py-4">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{isCredit ? 'Amount Added' : 'Amount Removed'}</div>
                          <div className={`text-base font-black font-mono ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                            {formatTxAmount(t.amount, isCredit, t.bdtAmount)}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${isCredit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {isCredit ? 'Credited' : 'Debited'}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-right">
                          <div className="text-[10px] text-slate-400 font-bold uppercase">Date & Time</div>
                          <div className="font-medium text-slate-700 text-xs mt-0.5">
                            {t.createdAt ? new Date(t.createdAt).toLocaleString('en-CA', { 
                              year: 'numeric', month: 'short', day: '2-digit', 
                              hour: '2-digit', minute: '2-digit', hour12: true 
                            }) : 'N/A'}
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return null;
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
