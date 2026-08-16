"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Users, ShoppingCart, DollarSign, Activity, AlertCircle, TrendingUp, Clock, CheckCircle, Loader, RefreshCw } from 'lucide-react';
import Link from 'next/link';

import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function AdminDashboard() {
  const { userData } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [settings, setSettings] = useState({ profitRatio: 1, usdToBdtRate: 120 });
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [usersSnap, ordersSnap, settingsRes] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'orders')),
        fetch('/api/settings')
      ]);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings({
          profitRatio: Number(settingsData.profitRatio) || 1,
          usdToBdtRate: Number(settingsData.usdToBdtRate) || 120
        });
      }

      const usersList: any[] = [];
      usersSnap.forEach((docSnap) => {
        usersList.push({ id: docSnap.id, ...docSnap.data() });
      });

      const ordersList: any[] = [];
      ordersSnap.forEach((docSnap) => {
        ordersList.push({ id: docSnap.id, ...docSnap.data() });
      });

      ordersList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      setUsers(usersList);
      setOrders(ordersList);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const totalSales = orders.reduce((sum, o) => sum + parseFloat(o.charge || 0), 0);
  const profitPercentage = settings.profitRatio > 0 ? (settings.profitRatio - 1) / settings.profitRatio : 0;
  const totalRevenueUSD = totalSales * profitPercentage;
  const totalRevenueBDT = totalRevenueUSD * settings.usdToBdtRate;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const recentOrders = orders.slice(0, 8);
  const recentUsers = users.slice(0, 5);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader className="h-10 w-10 text-[#FF6B00] animate-spin mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome, {userData?.name || 'Admin'}! 👋</h1>
          <p className="text-slate-500 font-medium">Real-time overview of your platform</p>
        </div>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 bg-[#FF6B00] text-white font-bold rounded-xl text-sm shadow hover:bg-orange-600 transition">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `$${totalRevenueUSD.toFixed(2)} / ৳${Math.round(totalRevenueBDT)}`, icon: <DollarSign />, color: 'text-green-600 bg-green-50', trend: `${completedOrders} completed` },
          { label: 'Total Users', value: users.length, icon: <Users />, color: 'text-blue-600 bg-blue-50', trend: 'registered' },
          { label: 'Total Orders', value: orders.length, icon: <ShoppingCart />, color: 'text-purple-600 bg-purple-50', trend: `${pendingOrders} pending` },
          { label: 'Pending Orders', value: pendingOrders, icon: <AlertCircle />, color: 'text-orange-600 bg-orange-50', trend: 'need attention' },
        ].map(stat => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{stat.value}</h3>
              </div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${stat.color} [&>svg]:h-5 [&>svg]:w-5`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-xs font-bold text-slate-400">{stat.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-[#FF6B00]" /> Recent Orders
            </h3>
            <Link href="/admin/orders" className="text-xs font-bold text-[#FF6B00] hover:underline">View all →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-medium">No orders yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 font-bold text-slate-400 text-xs uppercase tracking-wide">Order</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-400 text-xs uppercase tracking-wide">Service</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-400 text-xs uppercase tracking-wide">Charge</th>
                    <th className="text-left px-4 py-3 font-bold text-slate-400 text-xs uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentOrders.map(order => (
                    <tr key={order.id} className="hover:bg-orange-50/20 transition">
                      <td className="px-4 py-3">
                        <div className="text-xs font-black text-[#FF6B00]">{order.id?.slice(0, 8)}…</div>
                        {order.apiOrderId && <div className="text-xs text-slate-400">API #{order.apiOrderId}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-orange-50 text-[#FF6B00] text-xs font-black px-1.5 py-0.5 rounded">#{order.serviceId}</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-700 text-sm">${parseFloat(order.charge || 0).toFixed(4)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold capitalize ${
                          order.status === 'completed' ? 'bg-green-50 text-green-700' :
                          order.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                          order.status === 'processing' ? 'bg-blue-50 text-blue-700' :
                          'bg-slate-50 text-slate-600'
                        }`}>
                          {order.status || 'unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" /> Recent Users
            </h3>
            <Link href="/admin/users" className="text-xs font-bold text-[#FF6B00] hover:underline">View all →</Link>
          </div>
          {recentUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-medium">No users yet.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentUsers.map(user => (
                <div key={user.id} className="px-5 py-3 flex items-center gap-3 hover:bg-orange-50/20 transition">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#FF6B00] to-orange-400 flex items-center justify-center text-white font-black text-sm shrink-0">
                    {(user.name || user.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 text-sm truncate">{user.name || 'Unnamed'}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                  <div className="text-xs font-black text-green-600">${parseFloat(user.balance || 0).toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
