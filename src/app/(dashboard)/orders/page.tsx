"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ExternalLink, Loader } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function OrderHistory() {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');

    const q = query(collection(db, 'orders'), where('uid', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      let list: any[] = [];
      querySnapshot.forEach((docSnap) => list.push({ id: docSnap.id, ...docSnap.data() }));
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      
      setOrders(list);
      setLoading(false);

      // Async Syncing of active orders
      const activeOrders = list.filter(o => {
        const s = (o.status || '').toLowerCase();
        return o.apiOrderId && !['completed', 'canceled', 'cancelled', 'partial'].includes(s);
      });

      if (activeOrders.length > 0) {
        setSyncing(true);
        try {
          const apiOrderIds = activeOrders.map(o => o.apiOrderId);
          const syncRes = await fetch('/api/orders/sync-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiOrderIds })
          });
          const syncData = await syncRes.json();
          
          if (syncData.success && syncData.statuses) {
            for (const order of activeOrders) {
              const apiData = syncData.statuses[order.apiOrderId];
              if (apiData) {
                const newStatus = apiData.status ? apiData.status.toLowerCase() : (order.status || '').toLowerCase();
                const newStartCount = apiData.start_count !== undefined ? apiData.start_count : order.start_count;
                const newRemains = apiData.remains !== undefined ? apiData.remains : order.remains;
                const oldStatus = (order.status || '').toLowerCase();
                
                const hasChanges = newStatus !== oldStatus || 
                                   newStartCount !== order.start_count || 
                                   newRemains !== order.remains;
                
                if (hasChanges) {
                  // Update Firestore
                  const updates: any = {};
                  if (newStatus !== oldStatus) updates.status = newStatus;
                  if (newStartCount !== order.start_count) updates.start_count = newStartCount;
                  if (newRemains !== order.remains) updates.remains = newRemains;
                  
                  await updateDoc(doc(db, 'orders', order.id), updates);
                }
              }
            }
          }
        } catch (syncErr) {
          console.error("Failed to sync statuses:", syncErr);
        } finally {
          setSyncing(false);
        }
      }
    }, (err: any) => {
      console.error("Error loading orders:", err);
      setError(err.message || 'Failed to load orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.id?.toLowerCase().includes(search.toLowerCase()) || 
                          o.link?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s === 'completed') return <span className="px-3 py-1 bg-green-600 text-white rounded-md text-xs font-bold">Completed</span>;
    if (s === 'inprogress' || s === 'in progress' || s === 'processing') return <span className="px-3 py-1 bg-[#E65C00] text-white rounded-md text-xs font-bold">In progress</span>;
    if (s === 'pending') return <span className="px-3 py-1 bg-[#E65C00] text-white rounded-md text-xs font-bold">Pending</span>;
    if (s === 'canceled' || s === 'cancelled') return <span className="px-3 py-1 bg-red-600 text-white rounded-md text-xs font-bold">Canceled</span>;
    if (s === 'partial') return <span className="px-3 py-1 bg-purple-600 text-white rounded-md text-xs font-bold">Partial</span>;
    return <span className="px-3 py-1 bg-slate-500 text-white rounded-md text-xs font-bold capitalize">{status}</span>;
  };

  const getStatusFilterBadge = (status: string, label: string) => {
    const isActive = filterStatus === status;
    return (
      <button 
        onClick={() => setFilterStatus(status)} 
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold whitespace-nowrap transition border ${isActive ? 'bg-[#FF6B00]/10 border-[#FF6B00] text-[#FF6B00]' : 'bg-white border-orange-200 text-slate-600 hover:border-[#FF6B00] hover:text-[#FF6B00]'}`}
      >
        <div className={`h-4 w-4 rounded-full flex items-center justify-center ${isActive ? 'bg-[#FF6B00] text-white' : 'bg-orange-100 text-[#FF6B00]'}`}>
          {isActive && <div className="h-1.5 w-1.5 bg-white rounded-full"></div>}
        </div>
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#B94B00] to-[#D85700] rounded-2xl p-8 relative overflow-hidden text-white shadow-md flex items-center justify-between">
        <div className="absolute top-0 right-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-extrabold mb-1">My Orders</h2>
          <p className="text-orange-100 text-sm font-medium">Track your order status in real time.</p>
        </div>
        <div className="relative z-10 text-6xl drop-shadow-lg">
          🛒
        </div>
      </div>
      
      {/* Search */}
      <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex items-center gap-3">
        <Search className="h-5 w-5 text-slate-400 ml-2" />
        <input 
          type="text" 
          placeholder="Search" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent border-none focus:outline-none text-slate-700 font-medium" 
        />
      </div>

      {/* Filters */}
      <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
        {getStatusFilterBadge('all', 'All')}
        {getStatusFilterBadge('pending', 'Pending')}
        {getStatusFilterBadge('in progress', 'In progress')}
        {getStatusFilterBadge('completed', 'Completed')}
        {getStatusFilterBadge('partial', 'Partial')}
        {getStatusFilterBadge('processing', 'Processing')}
        {getStatusFilterBadge('canceled', 'Canceled')}
        {getStatusFilterBadge('refunds', 'Refunds')}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-white uppercase bg-[#E65C00]">
              <tr>
                <th className="px-4 py-4 font-bold flex items-center gap-2"><input type="checkbox" className="rounded" /> Order ID</th>
                <th className="px-4 py-4 font-bold">Date</th>
                <th className="px-4 py-4 font-bold">Link</th>
                <th className="px-4 py-4 font-bold">Charge</th>
                <th className="px-4 py-4 font-bold">Start count</th>
                <th className="px-4 py-4 font-bold">Quantity</th>
                <th className="px-4 py-4 font-bold">Service</th>
                <th className="px-4 py-4 font-bold">Remains</th>
                <th className="px-4 py-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-slate-400">
                    <Loader className="h-6 w-6 animate-spin mx-auto mb-2 text-[#FF6B00]" />
                    Loading orders...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-red-500 font-medium">
                    {error}
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-slate-400 font-medium">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-orange-50/50 transition">
                    <td className="px-4 py-4 font-bold text-[#FF6B00] whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="rounded border-slate-300" />
                        <span>{o.apiOrderId || o.id.substring(0, 8)}</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(o.apiOrderId || o.id.substring(0, 8));
                          }}
                          className="h-6 w-6 bg-green-500 text-white rounded flex items-center justify-center hover:bg-green-600 transition shadow-sm"
                          title="Copy Order ID"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600 font-medium text-xs whitespace-nowrap">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', '') : 'N/A'}
                    </td>
                    <td className="px-4 py-4">
                      <a href={o.link?.startsWith('http') ? o.link : `https://${o.link}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 hover:underline max-w-[150px] inline-block truncate text-xs font-medium">
                        {o.link}
                      </a>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-700">{formatPrice(o.charge)}</td>
                    <td className="px-4 py-4">
                      <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-bold">{o.start_count !== undefined ? o.start_count : (o.apiData?.start_count || 0)}</span>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-700">{o.quantity}</td>
                    <td className="px-4 py-4 text-slate-700 text-xs font-bold max-w-[200px]">
                      ID: {o.serviceId} {o.serviceName ? `- ${o.serviceName}` : ''}
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-700">{o.remains !== undefined ? o.remains : (o.apiData?.remains || 0)}</td>
                    <td className="px-4 py-4">
                      {getStatusBadge(o.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
