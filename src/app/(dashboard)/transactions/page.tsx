"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Loader } from 'lucide-react';

export default function TransactionsHistory() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    
    const q = query(
      collection(db, 'orders'), 
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const list: any[] = [];
      querySnapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setTransactions(list);
      setLoading(false);
    }, (err) => {
      console.error("Failed to load transactions", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-[#D85700] rounded-t-xl p-6 text-white shadow-md">
        <h2 className="text-xl font-bold">Transaction History</h2>
        <p className="text-orange-100 text-sm">View all your service expenditures and deductions</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-b-xl shadow-sm overflow-hidden -mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center"><Loader className="h-6 w-6 animate-spin mx-auto mb-2 text-[#FF6B00]" />Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500 font-medium">No transactions found.</td></tr>
              ) : (
                transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-500 font-bold uppercase">Order ID</div>
                      <div className="font-bold text-slate-800">#{t.apiOrderId || t.id.substring(0,8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-500 font-bold uppercase">Service</div>
                      <div className="font-bold text-slate-800">ID: {t.serviceId}</div>
                      <div className="text-xs text-slate-500 max-w-[200px] truncate">{t.serviceName || t.link || 'Service'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-500 font-bold uppercase">Amount Deducted</div>
                      <div className="font-black text-red-500">
                        -${t.charge !== undefined ? Number(t.charge).toFixed(4) : '0.0000'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-500 font-bold uppercase">Date</div>
                      <div className="font-medium text-slate-700">
                        {t.createdAt ? new Date(t.createdAt).toLocaleString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', '') : 'N/A'}
                      </div>
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
