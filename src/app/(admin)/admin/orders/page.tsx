"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Eye, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, Loader, Copy } from 'lucide-react';

import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const statusColors: Record<string, string> = {
  completed: 'bg-green-50 text-green-700',
  pending: 'bg-yellow-50 text-yellow-700',
  processing: 'bg-blue-50 text-blue-700',
  inprogress: 'bg-blue-50 text-blue-700',
  cancelled: 'bg-red-50 text-red-700',
  partial: 'bg-purple-50 text-purple-700',
};

const getShortUid = (uid: string) => {
  if (!uid) return '000000';
  let hash = 5381;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 33) ^ uid.charCodeAt(i);
  }
  return Math.abs(hash).toString().substring(0, 6).padStart(6, '0');
};

const PER_PAGE = 20;

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const list: any[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setOrders(list);
    } catch (err: any) {
      console.error("Error loading orders:", err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const filtered = orders.filter(o => {
    const shortUid = getShortUid(o.uid);
    const displayOrderId = String(o.apiOrderId || o.id?.slice(0, 8) || '');
    const matchSearch = !search ||
      displayOrderId.toLowerCase().includes(search.toLowerCase()) ||
      shortUid.includes(search) ||
      (o.serviceId || '').toString().includes(search) ||
      (o.link || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || (o.status || '').toLowerCase() === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const statusCounts = {
    completed: orders.filter(o => o.status === 'completed').length,
    processing: orders.filter(o => o.status === 'processing' || o.status === 'inprogress').length,
    pending: orders.filter(o => o.status === 'pending').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const formatDate = (ts: string) => {
    if (!ts) return '—';
    try { return new Date(ts).toLocaleString(); } catch { return ts; }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Order Management</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">{orders.length} total orders in system</p>
        </div>
        <button
          onClick={loadOrders}
          className="flex items-center gap-2 px-4 py-2 bg-[#FF6B00] text-white font-bold rounded-xl text-sm shadow hover:bg-orange-600 transition"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Completed', count: statusCounts.completed, color: 'text-green-600 bg-green-50', icon: <CheckCircle className="h-4 w-4" /> },
          { label: 'Processing', count: statusCounts.processing, color: 'text-blue-600 bg-blue-50', icon: <Clock className="h-4 w-4" /> },
          { label: 'Pending', count: statusCounts.pending, color: 'text-yellow-600 bg-yellow-50', icon: <Clock className="h-4 w-4" /> },
          { label: 'Cancelled', count: statusCounts.cancelled, color: 'text-red-600 bg-red-50', icon: <XCircle className="h-4 w-4" /> },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-xl font-black text-slate-800">{s.count}</p>
              <p className="text-xs font-bold text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order ID, UID, service ID, or link..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#FF6B00] transition"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-[#FF6B00] transition bg-white"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
          <option value="partial">Partial</option>
        </select>
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
          <div className="p-8 text-center text-slate-400 font-medium">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-4 font-bold text-slate-500 uppercase text-xs tracking-wide">Order ID</th>
                  <th className="text-left px-4 py-4 font-bold text-slate-500 uppercase text-xs tracking-wide">User UID</th>
                  <th className="text-left px-4 py-4 font-bold text-slate-500 uppercase text-xs tracking-wide">Service</th>
                  <th className="text-left px-4 py-4 font-bold text-slate-500 uppercase text-xs tracking-wide">Link</th>
                  <th className="text-left px-4 py-4 font-bold text-slate-500 uppercase text-xs tracking-wide">Qty</th>
                  <th className="text-left px-4 py-4 font-bold text-slate-500 uppercase text-xs tracking-wide">Charge</th>
                  <th className="text-left px-4 py-4 font-bold text-slate-500 uppercase text-xs tracking-wide">Status</th>
                  <th className="text-left px-4 py-4 font-bold text-slate-500 uppercase text-xs tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.map(order => {
                  const shortUid = getShortUid(order.uid);
                  const displayOrderId = String(order.apiOrderId || order.id?.slice(0, 8) || '');
                  return (
                  <tr key={order.id} className="hover:bg-orange-50/30 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="font-black text-[#FF6B00] text-xs">#{displayOrderId}</div>
                        <button 
                          onClick={() => navigator.clipboard.writeText(displayOrderId)} 
                          className="text-slate-400 hover:text-[#FF6B00] transition"
                          title="Copy Order ID"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                      <div className="flex items-center gap-2">
                        <span>{shortUid}</span>
                        <button 
                          onClick={() => navigator.clipboard.writeText(shortUid)} 
                          className="text-slate-400 hover:text-[#FF6B00] transition"
                          title="Copy User ID"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-700">
                      <span className="bg-orange-50 text-[#FF6B00] text-xs font-black px-1.5 py-0.5 rounded">#{order.serviceId}</span>
                    </td>
                    <td className="px-4 py-3 max-w-[140px] truncate text-xs text-slate-500">
                      <a href={order.link} target="_blank" rel="noopener noreferrer" className="hover:text-[#FF6B00] transition">
                        {order.link || '—'}
                      </a>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-700">{parseInt(order.quantity || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-slate-700">${parseFloat(order.charge || 0).toFixed(4)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold capitalize ${statusColors[order.status?.toLowerCase()] || 'bg-slate-50 text-slate-600'}`}>
                        {order.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{formatDate(order.createdAt)}</td>
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
              <span className="px-3 py-1 rounded-lg bg-[#FF6B00] text-white text-sm font-bold">{page}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-slate-600 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
