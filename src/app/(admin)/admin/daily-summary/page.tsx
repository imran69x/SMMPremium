"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DollarSign, TrendingUp, Calendar, ShoppingCart, Users, Search, RefreshCw, CheckCircle, ChevronDown, ChevronUp, Copy, Loader, CalendarDays, CreditCard, Percent, Sparkles, Wallet } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const getShortUid = (uid: string) => {
  if (!uid) return '000000';
  let hash = 5381;
  for (let i = 0; i < uid.length; i++) { hash = (hash * 33) ^ uid.charCodeAt(i); }
  return Math.abs(hash).toString().substring(0, 6).padStart(6, '0');
};

const getLocalDateKey = (dateInput: any) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const statusColors: Record<string, string> = {
  completed: 'bg-green-50 text-green-700 border border-green-200',
  processing: 'bg-blue-50 text-blue-700 border border-blue-200',
  inprogress: 'bg-blue-50 text-blue-700 border border-blue-200',
  pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
  canceled: 'bg-red-50 text-red-700 border border-red-200',
  partial: 'bg-purple-50 text-purple-700 border border-purple-200',
};

const LAUNCH_DATE = '2026-09-05';
const BDT = '\u09F3';

export default function AdminDailySummary() {
  const [activeTab, setActiveTab] = useState<'deposits' | 'expenses'>('deposits');
  const [expenseSubView, setExpenseSubView] = useState<'orders' | 'users'>('orders');
  const [displayCurrency, setDisplayCurrency] = useState<'BDT' | 'USD'>('BDT');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [servicesMap, setServicesMap] = useState<Record<string, string>>({});
  const [transactions, setTransactions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [profitRatio, setProfitRatio] = useState<number>(1);
  const [usdToBdtRate, setUsdToBdtRate] = useState<number>(120);
  const [providerBalance, setProviderBalance] = useState<{ balance: number; currency: string; loading: boolean }>({ balance: 0, currency: 'USD', loading: true });
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleDateCollapse = (d: string) => setCollapsedDates(prev => ({ ...prev, [d]: !prev[d] }));

  const loadAllData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError('');
    try {
      try {
        const r = await fetch('/api/settings');
        if (r.ok) {
          const s = await r.json();
          setProfitRatio(typeof s.profitRatio === 'number' && s.profitRatio > 0 ? s.profitRatio : 1);
          setUsdToBdtRate(typeof s.usdToBdtRate === 'number' && s.usdToBdtRate > 0 ? s.usdToBdtRate : 120);
        }
      } catch (e) { /* ignore */ }
      try {
        const r = await fetch('/api/admin/provider-balance');
        if (r.ok) { const d = await r.json(); setProviderBalance({ balance: parseFloat(d.balance || 0), currency: d.currency || 'USD', loading: false }); }
      } catch (e) { /* ignore */ }
      try {
        const r = await fetch('/api/services');
        if (r.ok) {
          const l = await r.json();
          if (Array.isArray(l)) { const m: Record<string, string> = {}; l.forEach((s: any) => { if (s.service) m[String(s.service)] = s.name; }); setServicesMap(m); }
        }
      } catch (e) { /* ignore */ }
      const us = await getDocs(collection(db, 'users'));
      const um: Record<string, any> = {};
      us.forEach(d => { um[d.id] = { id: d.id, ...d.data() }; });
      setUsersMap(um);
      const ts = await getDocs(collection(db, 'antipay_transactions'));
      const tl: any[] = [];
      ts.forEach(d => { tl.push({ id: d.id, ...d.data() }); });
      tl.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setTransactions(tl);
      const os = await getDocs(collection(db, 'orders'));
      const ol: any[] = [];
      os.forEach(d => { ol.push({ id: d.id, ...d.data() }); });
      ol.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setOrders(ol);
    } catch (err: any) {
      if (!isSilent) setError(err.message || 'Failed to load');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData(false);
    const t = setInterval(() => loadAllData(true), 8000);
    return () => clearInterval(t);
  }, [loadAllData]);

  const fmt = (usd: number) => displayCurrency === 'USD' ? `$${usd.toFixed(2)}` : `${BDT}${(usd * usdToBdtRate).toFixed(2)}`;
  const fmtBdt = (bdt: number, usd?: number) => displayCurrency === 'USD' ? `$${(usd !== undefined ? usd : bdt / usdToBdtRate).toFixed(2)}` : `${BDT}${bdt.toFixed(2)}`;

  const completedDeposits = useMemo(() => transactions.filter(t => (t.status || '').toLowerCase() === 'completed' && getLocalDateKey(t.createdAt) >= LAUNCH_DATE), [transactions]);

  const depositsByDate = useMemo(() => {
    const g: Record<string, any> = {};
    completedDeposits.forEach(t => {
      const dt = t.createdAt ? new Date(t.createdAt) : new Date();
      const dk = getLocalDateKey(t.createdAt);
      if (!dk) return;
      const dp = dt.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
      const bdt = parseFloat(t.amount || 0);
      const usd = t.creditedUsd !== undefined ? parseFloat(t.creditedUsd) : bdt / usdToBdtRate;
      if (!g[dk]) g[dk] = { date: dk, displayDate: dp, items: [], totalBdt: 0, totalUsd: 0 };
      g[dk].items.push({ ...t, bdtAmount: bdt, usdAmount: usd, user: usersMap[t.uid] || { name: 'Unknown', email: 'N/A' } });
      g[dk].totalBdt += bdt; g[dk].totalUsd += usd;
    });
    return Object.values(g).sort((a, b) => b.date.localeCompare(a.date));
  }, [completedDeposits, usersMap, usdToBdtRate]);

  const filteredDepositsByDate = useMemo(() => {
    if (!search && selectedDate === 'all') return depositsByDate;
    return depositsByDate.filter(g => selectedDate === 'all' || g.date === selectedDate).map(g => {
      const items = g.items.filter((i: any) => {
        const q = search.toLowerCase();
        return !search || (i.trxId || '').toLowerCase().includes(q) || (i.id || '').toLowerCase().includes(q) || (i.user?.name || '').toLowerCase().includes(q) || (i.user?.email || '').toLowerCase().includes(q) || getShortUid(i.uid).includes(q);
      });
      return { ...g, items, totalBdt: items.reduce((s: number, i: any) => s + i.bdtAmount, 0), totalUsd: items.reduce((s: number, i: any) => s + i.usdAmount, 0) };
    }).filter(g => g.items.length > 0);
  }, [depositsByDate, search, selectedDate]);

  const calcOrder = (order: any, ratio: number) => {
    const chargeUsd = parseFloat(order.charge || 0);
    const isCancelled = ['cancelled', 'canceled'].includes((order.status || '').toLowerCase());
    const providerCostUsd = ratio > 0 ? chargeUsd / ratio : chargeUsd;
    const profitUsd = (!isCancelled && ratio > 1) ? chargeUsd * ((ratio - 1) / ratio) : 0;
    const user = usersMap[order.uid] || { name: 'Unknown', email: 'N/A' };
    const serviceName = order.serviceName || servicesMap[String(order.serviceId)] || `Service #${order.serviceId}`;
    return { ...order, user, serviceName, chargeUsd, chargeBdt: chargeUsd * usdToBdtRate, providerCostUsd, providerCostBdt: providerCostUsd * usdToBdtRate, profitUsd, profitBdt: profitUsd * usdToBdtRate, isCancelled };
  };

  const ordersWithProfit = useMemo(() => {
    const ratio = profitRatio > 0 ? profitRatio : 1;
    return orders.filter(o => getLocalDateKey(o.createdAt) >= LAUNCH_DATE).map(o => calcOrder(o, ratio));
  }, [orders, usersMap, servicesMap, profitRatio, usdToBdtRate]);

  const ordersByDate = useMemo(() => {
    const ratio = profitRatio > 0 ? profitRatio : 1;
    const g: Record<string, any> = {};
    orders.filter(o => getLocalDateKey(o.createdAt) >= LAUNCH_DATE).forEach(order => {
      const o = calcOrder(order, ratio);
      const dt = order.createdAt ? new Date(order.createdAt) : new Date();
      const dk = getLocalDateKey(order.createdAt);
      if (!dk) return;
      const dp = dt.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
      if (!g[dk]) g[dk] = { date: dk, displayDate: dp, items: [], totalChargeUsd: 0, totalProfitUsd: 0, totalProviderCostUsd: 0 };
      g[dk].items.push(o);
      if (!o.isCancelled) { g[dk].totalChargeUsd += o.chargeUsd; g[dk].totalProfitUsd += o.profitUsd; g[dk].totalProviderCostUsd += o.providerCostUsd; }
    });
    return Object.values(g).sort((a, b) => b.date.localeCompare(a.date));
  }, [orders, usersMap, servicesMap, profitRatio, usdToBdtRate]);

  const filteredOrdersByDate = useMemo(() => {
    if (!search && selectedDate === 'all' && statusFilter === 'all') return ordersByDate;
    return ordersByDate.filter(g => selectedDate === 'all' || g.date === selectedDate).map(g => {
      const items = g.items.filter((o: any) => {
        const q = search.toLowerCase();
        const oid = String(o.apiOrderId || o.id?.slice(0, 8) || '');
        const ms = !search || oid.toLowerCase().includes(q) || getShortUid(o.uid).includes(q) || (o.user?.name || '').toLowerCase().includes(q) || (o.user?.email || '').toLowerCase().includes(q) || (o.serviceName || '').toLowerCase().includes(q);
        return ms && (statusFilter === 'all' || (o.status || '').toLowerCase() === statusFilter);
      });
      const act = items.filter((o: any) => !o.isCancelled);
      return { ...g, items, totalChargeUsd: act.reduce((s: number, o: any) => s + o.chargeUsd, 0), totalProfitUsd: act.reduce((s: number, o: any) => s + o.profitUsd, 0), totalProviderCostUsd: act.reduce((s: number, o: any) => s + o.providerCostUsd, 0) };
    }).filter(g => g.items.length > 0);
  }, [ordersByDate, search, selectedDate, statusFilter]);

  const userExpensesSummary = useMemo(() => {
    const u: Record<string, any> = {};
    ordersWithProfit.forEach(o => {
      const uid = o.uid || 'unknown';
      if (!u[uid]) u[uid] = { uid, user: o.user, totalOrders: 0, totalSpentUsd: 0, totalSpentBdt: 0, totalProfitUsd: 0, totalProfitBdt: 0, servicesBought: new Set<string>() };
      u[uid].totalOrders++; u[uid].totalSpentUsd += o.chargeUsd; u[uid].totalSpentBdt += o.chargeBdt; u[uid].totalProfitUsd += o.profitUsd; u[uid].totalProfitBdt += o.profitBdt;
      if (o.serviceName) u[uid].servicesBought.add(o.serviceName);
    });
    return Object.values(u).map((i: any) => ({ ...i, servicesCount: i.servicesBought.size })).filter((i: any) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (i.user?.name || '').toLowerCase().includes(q) || (i.user?.email || '').toLowerCase().includes(q) || getShortUid(i.uid).includes(q);
    }).sort((a: any, b: any) => b.totalSpentUsd - a.totalSpentUsd);
  }, [ordersWithProfit, search]);

  const overallStats = useMemo(() => {
    const ts = getLocalDateKey(new Date());
    const td = completedDeposits.filter(t => getLocalDateKey(t.createdAt) === ts);
    const ao = ordersWithProfit.filter(o => !o.isCancelled);
    const tub = Object.values(usersMap).reduce((a, u: any) => { const b = parseFloat(u.balance || 0); return a + (isNaN(b) ? 0 : b); }, 0);
    return {
      todayDepBdt: td.reduce((a, t) => a + parseFloat(t.amount || 0), 0),
      todayDepUsd: td.reduce((a, t) => a + (t.creditedUsd !== undefined ? parseFloat(t.creditedUsd) : parseFloat(t.amount || 0) / usdToBdtRate), 0),
      todayDepCount: td.length,
      totalDepBdt: completedDeposits.reduce((a, t) => a + parseFloat(t.amount || 0), 0),
      totalDepUsd: completedDeposits.reduce((a, t) => a + (t.creditedUsd !== undefined ? parseFloat(t.creditedUsd) : parseFloat(t.amount || 0) / usdToBdtRate), 0),
      totalDepCount: completedDeposits.length,
      totalSpentUsd: ao.reduce((a, o) => a + o.chargeUsd, 0),
      totalProfitUsd: ao.reduce((a, o) => a + o.profitUsd, 0),
      totalOrders: orders.length, activeOrders: ao.length,
      totalUserBal: tub, totalUsers: Object.keys(usersMap).length,
    };
  }, [completedDeposits, ordersWithProfit, orders, usersMap, usdToBdtRate]);

  const allDates = useMemo(() => {
    const d = new Set<string>();
    completedDeposits.forEach(t => { const k = getLocalDateKey(t.createdAt); if (k) d.add(k); });
    orders.forEach(o => { const k = getLocalDateKey(o.createdAt); if (k && k >= LAUNCH_DATE) d.add(k); });
    return Array.from(d).sort((a, b) => b.localeCompare(a));
  }, [completedDeposits, orders]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#FF6B00] to-orange-500 flex items-center justify-center text-white shadow-md"><CalendarDays className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Daily Summary</h1>
            <p className="text-slate-500 font-medium text-xs sm:text-sm">Daily Deposit, Orders and Profit Report</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200/60 rounded-xl text-xs font-bold text-[#FF6B00]">
            <Percent className="h-3.5 w-3.5" /><span>Ratio: {profitRatio}x</span><span className="text-slate-400">|</span><span>$1={BDT}{usdToBdtRate}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200/60 rounded-xl text-xs font-bold text-blue-700">
            <Wallet className="h-3.5 w-3.5" /><span>API: {providerBalance.loading ? '...' : fmt(providerBalance.balance)}</span>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            <button onClick={() => setDisplayCurrency('BDT')} className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${displayCurrency === 'BDT' ? 'bg-white text-[#FF6B00] shadow-sm' : 'text-slate-500'}`}>{BDT} BDT</button>
            <button onClick={() => setDisplayCurrency('USD')} className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${displayCurrency === 'USD' ? 'bg-white text-[#FF6B00] shadow-sm' : 'text-slate-500'}`}>$ USD</button>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200/60">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /><span>Live</span>
          </div>
          <button onClick={() => loadAllData(false)} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-[#FF6B00] text-white font-bold rounded-xl text-sm shadow hover:bg-orange-600 transition disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold uppercase text-slate-400">Today Deposit</span><div className="h-8 w-8 rounded-xl bg-green-50 text-green-600 flex items-center justify-center"><CreditCard className="h-4 w-4" /></div></div>
          <div className="text-xl font-black text-slate-800">{fmtBdt(overallStats.todayDepBdt, overallStats.todayDepUsd)}</div>
          <p className="text-xs text-slate-500 mt-1">{overallStats.todayDepCount} completed</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold uppercase text-slate-400 truncate">Total Deposits</span><div className="h-8 w-8 rounded-xl bg-orange-50 text-[#FF6B00] flex items-center justify-center"><DollarSign className="h-4 w-4" /></div></div>
          <div className="text-xl font-black text-slate-800">{fmtBdt(overallStats.totalDepBdt, overallStats.totalDepUsd)}</div>
          <p className="text-xs text-slate-500 mt-1">{overallStats.totalDepCount} total</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold uppercase text-slate-400 truncate">User Spent</span><div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><ShoppingCart className="h-4 w-4" /></div></div>
          <div className="text-xl font-black text-slate-800">{fmt(overallStats.totalSpentUsd)}</div>
          <p className="text-xs text-slate-500 mt-1">{overallStats.activeOrders} orders</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-[#FF6B00] rounded-2xl p-4 shadow-lg text-white">
          <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold uppercase text-orange-100">Net Profit</span><div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center"><TrendingUp className="h-4 w-4" /></div></div>
          <div className="text-xl font-black">{fmt(overallStats.totalProfitUsd)}</div>
          <p className="text-xs text-orange-100/90 font-semibold mt-1 flex items-center gap-1"><Sparkles className="h-3 w-3" />{profitRatio > 1 ? `${(((profitRatio-1)/profitRatio)*100).toFixed(0)}% margin` : '0%'}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold uppercase text-slate-400 truncate">User Balance</span><div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Users className="h-4 w-4" /></div></div>
          <div className="text-xl font-black text-slate-800">{fmt(overallStats.totalUserBal)}</div>
          <p className="text-xs text-slate-500 mt-1">{overallStats.totalUsers} users</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold uppercase text-slate-400 truncate">API Balance</span><div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Wallet className="h-4 w-4" /></div></div>
          <div className="text-xl font-black text-slate-800">{providerBalance.loading ? <span className="text-sm text-slate-400">Loading...</span> : fmt(providerBalance.balance)}</div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => { setActiveTab('deposits'); setSearch(''); setStatusFilter('all'); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm transition ${activeTab === 'deposits' ? 'bg-[#FF6B00] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
            <CreditCard className="h-4 w-4" />Daily Deposits ({completedDeposits.length})
          </button>
          <button onClick={() => { setActiveTab('expenses'); setSearch(''); setStatusFilter('all'); }} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm transition ${activeTab === 'expenses' ? 'bg-[#FF6B00] text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
            <TrendingUp className="h-4 w-4" />User Expenses & Profit ({orders.length})
          </button>
        </div>
        {activeTab === 'expenses' && (
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setExpenseSubView('orders')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${expenseSubView === 'orders' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>Order Details</button>
            <button onClick={() => setExpenseSubView('users')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${expenseSubView === 'users' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>User Summary</button>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder={activeTab === 'deposits' ? 'Search user, email, UID, Trx ID...' : 'Search order ID, user, service...'} value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#FF6B00] transition" />
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#FF6B00]">
            <option value="all">All Dates</option>
            {allDates.map(d => {
              const parts = d.split('-');
              const localD = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
              return <option key={d} value={d}>{localD.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</option>;
            })}
          </select>
          {activeTab === 'expenses' && expenseSubView === 'orders' && (
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#FF6B00]">
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-16 flex flex-col items-center gap-3">
          <Loader className="h-8 w-8 text-[#FF6B00] animate-spin" />
          <p className="text-slate-500 font-bold text-sm">Loading data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center text-red-600 font-bold">{error}</div>
      ) : (
        <>
          {activeTab === 'deposits' && (
            <div className="space-y-4">
              {filteredDepositsByDate.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400">No completed deposits found.</div>
              ) : filteredDepositsByDate.map(group => {
                const collapsed = collapsedDates[group.date];
                return (
                  <div key={group.date} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    <div onClick={() => toggleDateCollapse(group.date)} className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-orange-50/20 to-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-orange-50/40 transition select-none">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center"><Calendar className="h-4 w-4" /></div>
                        <div><h3 className="font-black text-slate-800">{group.displayDate}</h3><p className="text-xs text-slate-500">{group.items.length} deposits</p></div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right"><div className="text-xs font-bold text-slate-400 uppercase">Day Total</div><div className="text-lg font-black text-[#FF6B00]">{fmtBdt(group.totalBdt, group.totalUsd)}</div></div>
                        <div className="text-slate-400">{collapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}</div>
                      </div>
                    </div>
                    {!collapsed && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50/60 border-b border-slate-100 text-slate-500 uppercase text-xs font-black">
                            <tr><th className="px-5 py-3 text-left">User</th><th className="px-5 py-3 text-left">Transaction ID</th><th className="px-5 py-3 text-left">Method</th><th className="px-5 py-3 text-left">Amount</th><th className="px-5 py-3 text-left">Status</th><th className="px-5 py-3 text-right">Time</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {group.items.map((tx: any) => (
                              <tr key={tx.id} className="hover:bg-orange-50/30 transition">
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#FF6B00] to-orange-400 flex items-center justify-center text-white font-black text-xs shrink-0">{(tx.user?.name || '?').charAt(0).toUpperCase()}</div>
                                    <div><div className="font-bold text-slate-800 text-sm truncate max-w-[140px]">{tx.user?.name || 'User'}</div><div className="text-slate-400 text-xs truncate max-w-[140px]">{tx.user?.email || tx.uid}</div><span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 rounded">UID:{getShortUid(tx.uid)}</span></div>
                                  </div>
                                </td>
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100/70 px-2 py-1 rounded-md">{tx.trxId || tx.id.substring(0, 10)}</span>
                                    <button onClick={() => handleCopy(tx.trxId || tx.id, tx.id)} className="text-slate-400 hover:text-[#FF6B00]"><Copy className="h-3.5 w-3.5" /></button>
                                    {copiedId === tx.id && <span className="text-[10px] text-green-600 font-bold">Copied!</span>}
                                  </div>
                                </td>
                                <td className="px-5 py-3.5"><span className="capitalize text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">{tx.method || 'AntiPay'}</span></td>
                                <td className="px-5 py-3.5">
                                  <div className="font-black text-slate-800 text-sm">{fmtBdt(tx.bdtAmount, tx.usdAmount)}</div>
                                  <div className="text-[11px] text-slate-400">{displayCurrency === 'BDT' ? `($${tx.usdAmount.toFixed(4)})` : `(${BDT}${tx.bdtAmount.toFixed(2)})`}</div>
                                </td>
                                <td className="px-5 py-3.5"><span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200"><CheckCircle className="h-3 w-3" /> Completed</span></td>
                                <td className="px-5 py-3.5 text-right text-xs text-slate-500 whitespace-nowrap">{tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#FF6B00] text-white rounded-xl"><TrendingUp className="h-4 w-4" /></div>
                  <div><span className="font-black text-slate-800 text-sm">Profit Formula:</span><p className="text-xs text-slate-600 mt-0.5">Ratio={profitRatio}x | {profitRatio===1 ? '0% profit' : `${(((profitRatio-1)/profitRatio)*100).toFixed(1)}% margin`}</p></div>
                </div>
                <div className="font-mono text-xs bg-white px-3 py-1.5 rounded-xl border border-orange-200 text-slate-600">Profit = Charge x ({profitRatio}-1) / {profitRatio}</div>
              </div>

              {expenseSubView === 'orders' && (
                <div className="space-y-4">
                  {filteredOrdersByDate.length === 0 ? (
                    <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400">No orders found.</div>
                  ) : filteredOrdersByDate.map(group => {
                    const collapsed = collapsedDates[`ord_${group.date}`];
                    return (
                      <div key={group.date} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                        <div onClick={() => toggleDateCollapse(`ord_${group.date}`)} className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-orange-50/20 to-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-orange-50/30 transition select-none">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center"><Calendar className="h-4 w-4" /></div>
                            <div>
                              <h3 className="font-black text-slate-800">{group.displayDate}</h3>
                              <p className="text-xs text-slate-500">{group.items.length} orders</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-5">
                            <div className="text-right">
                              <div className="text-xs font-bold text-slate-400 uppercase">User Spent</div>
                              <div className="text-lg font-black text-slate-800">{fmt(group.totalChargeUsd)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-bold text-slate-400 uppercase">Day Profit</div>
                              <div className="text-lg font-black text-green-600">+{fmt(group.totalProfitUsd)}</div>
                            </div>
                            <div className="text-slate-400">{collapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}</div>
                          </div>
                        </div>
                        {!collapsed && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-50/60 border-b border-slate-100 text-slate-500 uppercase text-xs font-black">
                                <tr>
                                  <th className="px-4 py-3 text-left">Order ID</th>
                                  <th className="px-4 py-3 text-left">User</th>
                                  <th className="px-4 py-3 text-left">Service</th>
                                  <th className="px-4 py-3 text-left">Qty</th>
                                  <th className="px-4 py-3 text-left">Spent</th>
                                  <th className="px-4 py-3 text-left">Cost</th>
                                  <th className="px-4 py-3 text-left" style={{color:'#FF6B00'}}>Profit</th>
                                  <th className="px-4 py-3 text-left">Status</th>
                                  <th className="px-4 py-3 text-right">Time</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {group.items.map((o: any) => {
                                  const oid = String(o.apiOrderId || o.id?.slice(0, 8) || '');
                                  return (
                                    <tr key={o.id} className="hover:bg-orange-50/20 transition">
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-mono text-xs font-black text-[#FF6B00]">#{oid}</span>
                                          <button onClick={(e) => { e.stopPropagation(); handleCopy(oid, `e_${o.id}`); }} className="text-slate-400 hover:text-[#FF6B00]"><Copy className="h-3 w-3" /></button>
                                          {copiedId === `e_${o.id}` && <span className="text-[10px] text-green-600 font-bold">Copied!</span>}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#FF6B00] to-orange-400 flex items-center justify-center text-white text-xs font-black shrink-0">{(o.user?.name||'?').charAt(0).toUpperCase()}</div>
                                          <div>
                                            <div className="font-bold text-slate-800 text-xs truncate max-w-[120px]">{o.user?.name||'User'}</div>
                                            <div className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 rounded inline-block">UID:{getShortUid(o.uid)}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 max-w-[200px]">
                                        <div className="flex items-start gap-1">
                                          <span className="bg-orange-100 text-[#FF6B00] text-[10px] font-black px-1.5 py-0.5 rounded shrink-0">#{o.serviceId}</span>
                                          <span className="text-xs font-bold text-slate-700 line-clamp-2">{o.serviceName}</span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 font-bold text-slate-700 text-xs">{parseInt(o.quantity||0).toLocaleString()}</td>
                                      <td className="px-4 py-3"><div className="font-black text-sm text-slate-800">{fmt(o.chargeUsd)}</div></td>
                                      <td className="px-4 py-3 text-xs text-slate-500">{fmt(o.providerCostUsd)}</td>
                                      <td className="px-4 py-3">{o.isCancelled ? <span className="text-xs text-slate-400">—</span> : <span className="inline-block px-2 py-0.5 rounded-md font-black text-xs bg-green-50 text-green-700 border border-green-200">+{fmt(o.profitUsd)}</span>}</td>
                                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-lg text-xs font-bold capitalize ${statusColors[o.status?.toLowerCase()]||'bg-slate-100 text-slate-600'}`}>{o.status||'unknown'}</span></td>
                                      <td className="px-4 py-3 text-right text-xs text-slate-500 whitespace-nowrap">{o.createdAt ? new Date(o.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',hour12:true}) : '—'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot className="bg-slate-50/80 border-t-2 border-slate-200">
                                <tr>
                                  <td colSpan={4} className="px-4 py-3 font-black text-slate-600 text-xs uppercase">Day Total ({group.items.filter((o:any)=>!o.isCancelled).length} active)</td>
                                  <td className="px-4 py-3 font-black text-slate-800 text-sm">{fmt(group.totalChargeUsd)}</td>
                                  <td className="px-4 py-3 font-bold text-slate-500 text-xs">{fmt(group.totalProviderCostUsd)}</td>
                                  <td className="px-4 py-3"><span className="font-black text-green-600 text-sm">+{fmt(group.totalProfitUsd)}</span></td>
                                  <td colSpan={2}></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {expenseSubView === 'users' && (
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <div><h3 className="font-black text-slate-800 text-sm">User Spending Leaderboard</h3><p className="text-slate-500 text-xs">Top spending users and profit generated</p></div>
                    <span className="text-xs font-bold bg-orange-100 text-[#FF6B00] px-2.5 py-1 rounded-lg">{userExpensesSummary.length} Buyers</span>
                  </div>
                  {userExpensesSummary.length === 0 ? <div className="p-12 text-center text-slate-400">No spending recorded.</div> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-xs font-black">
                          <tr><th className="px-5 py-3 text-left">Rank</th><th className="px-5 py-3 text-left">User</th><th className="px-5 py-3 text-left">Orders</th><th className="px-5 py-3 text-left">Services</th><th className="px-5 py-3 text-left">Total Spent</th><th className="px-5 py-3 text-right">Profit</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {userExpensesSummary.map((item: any, i: number) => (
                            <tr key={item.uid} className="hover:bg-orange-50/30 transition">
                              <td className="px-5 py-4 text-xs font-black text-slate-400">{i===0?<span className="h-6 w-6 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-black">1</span>:i===1?<span className="h-6 w-6 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-xs font-black">2</span>:i===2?<span className="h-6 w-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-black">3</span>:`#${i+1}`}</td>
                              <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#FF6B00] to-orange-400 flex items-center justify-center text-white font-black text-xs shrink-0">{(item.user?.name||'?').charAt(0).toUpperCase()}</div><div><div className="font-bold text-slate-800 text-sm">{item.user?.name||'User'}</div><div className="text-slate-400 text-xs">{item.user?.email||item.uid}</div><div className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 rounded mt-0.5">ID:{getShortUid(item.uid)}</div></div></div></td>
                              <td className="px-5 py-4"><span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-black">{item.totalOrders} orders</span></td>
                              <td className="px-5 py-4 text-xs text-slate-600">{item.servicesCount} types</td>
                              <td className="px-5 py-4"><div className="font-black text-slate-800 text-sm">{fmt(item.totalSpentUsd)}</div></td>
                              <td className="px-5 py-4 text-right"><div className="font-black text-green-600 text-sm">+{fmt(item.totalProfitUsd)}</div></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
