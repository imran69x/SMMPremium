"use client";

import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, CheckCircle2, ArrowRight, ShieldCheck, Loader } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import GlowingButton from '@/components/ui/GlowingButton';
import PixelButton from '@/components/ui/PixelButton';
export default function AddFunds() {
  const { user, userData } = useAuth();
  const { rate } = useCurrency(); // 1 USD = rate BDT

  const [bdtAmount, setBdtAmount] = useState<string>('20');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);

  // Load user transactions
  useEffect(() => {
    if (!user) {
      setLoadingTx(false);
      return;
    }
    
    const q = query(
      collection(db, 'antipay_transactions'),
      where('uid', '==', user.uid),
      where('status', '==', 'completed')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const list: any[] = [];
      querySnapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt || 0).getTime());
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt || 0).getTime());
        return timeB - timeA;
      });
      setTransactions(list);
      setLoadingTx(false);
    }, (err) => {
      console.error("Failed to load transactions", err);
      setLoadingTx(false);
    });

    return () => unsubscribe();
  }, [user]);

  const parsedBdt = parseFloat(bdtAmount) || 0;
  const convertedUsd = rate > 0 ? (parsedBdt / rate) : 0;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!user) {
      setErrorMsg('You must be logged in to add funds.');
      return;
    }

    if (parsedBdt < 20) {
      setErrorMsg('Minimum deposit is 20 BDT.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/add-funds/antipay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          amount: parsedBdt,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      if (data.success && data.antiPayResponse && data.antiPayResponse.payment_url) {
        setSuccessMsg('Redirecting to secure payment gateway...');
        window.location.href = data.antiPayResponse.payment_url;
      } else if (data.success && data.antiPayResponse && data.antiPayResponse.paymentUrl) {
        setSuccessMsg('Redirecting to secure payment gateway...');
        window.location.href = data.antiPayResponse.paymentUrl;
      } else {
        throw new Error('Invalid response from payment gateway. Missing payment URL.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment initialization failed');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Add Funds</h1>
        <p className="text-slate-500 font-medium text-sm mt-1">Deposit funds in BDT — automatically converted & stored safely in USD</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* bKash / Nagad Auto Payment */}
        <div className="bg-white rounded-2xl p-6 border-2 border-[#FF6B00] shadow-md relative flex flex-col justify-between">
          <div className="absolute top-4 right-4 bg-[#FF6B00] text-white text-xs px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
            Auto Deposit
          </div>

          <div>
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-4 text-[#FF6B00]">
              <Smartphone className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-1">bKash / Nagad / Rocket</h3>
            <p className="text-slate-500 text-sm mb-4">Instant deposit. Minimum 20 BDT.</p>

            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Amount in BDT</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">BDT</span>
                  <input
                    type="number"
                    min="20"
                    placeholder="20"
                    value={bdtAmount}
                    onChange={(e) => setBdtAmount(e.target.value)}
                    className="w-full pl-14 pr-4 py-3 border border-slate-200 rounded-xl font-bold text-lg text-slate-800 outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-orange-100 transition"
                  />
                </div>
              </div>

              {/* Conversion Calculation Display */}
              <div className="bg-orange-50/80 rounded-xl p-4 border border-orange-100 space-y-1 text-sm">
                <div className="flex justify-between items-center text-slate-700 font-medium">
                  <span>Exchange Rate:</span>
                  <span className="font-bold">1 USD = {rate} BDT</span>
                </div>
                <div className="flex justify-between items-center text-slate-900 font-extrabold text-base pt-1 border-t border-orange-200/60">
                  <span>Credited USD Balance:</span>
                  <span className="text-[#FF6B00]">${convertedUsd.toFixed(4)} USD</span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 font-medium text-xs">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-green-700 font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> {successMsg}
                </div>
              )}

              <PixelButton type="submit" disabled={loading} className="w-full h-[56px] bg-[#FF6B00] text-white text-base font-extrabold rounded-2xl">
                <span className="flex items-center justify-center gap-2 w-full h-full">
                  {loading ? 'Processing Deposit...' : `Pay ${parsedBdt > 0 ? parsedBdt + ' BDT' : ''}`} <ArrowRight className="h-4 w-4" />
                </span>
              </PixelButton>
            </form>
          </div>
        </div>

        {/* Card / SSLCommerz */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between opacity-80">
          <div>
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 text-purple-600">
              <CreditCard className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-1">Card / SSLCommerz</h3>
            <p className="text-slate-500 text-sm mb-4">Visa, Mastercard, AMEX. Minimum 100 BDT.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Amount in BDT</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-300 text-sm">BDT</span>
                  <input
                    type="number"
                    placeholder="1000"
                    disabled
                    className="w-full pl-14 pr-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-400 bg-slate-50 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-500 text-xs font-medium">
                Card gateway currently undergoing maintenance. Please use bKash / Nagad auto deposit.
              </div>

              <button disabled className="w-full py-3 rounded-xl bg-slate-100 text-slate-400 font-bold text-sm cursor-not-allowed">
                Payment Disabled
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Rate Guarantee Notice */}
      {/* Exchange Rate Guarantee Notice */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-sm text-slate-600 space-y-3">
        <h3 className="text-slate-800 font-black text-base flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#FF6B00]" /> Currency & Exchange Rate Rules
        </h3>
        <ul className="space-y-2 list-disc pl-5">
          <li><strong>BDT to USD Conversion:</strong> All deposits are made in BDT and immediately converted to USD using the active exchange rate (<strong>1 USD = {rate} BDT</strong>).</li>
          <li><strong>Fixed Account Balance:</strong> Once credited, your account balance is stored safely in <strong>USD</strong>. Future changes to the exchange rate will <strong>NEVER reduce or alter your stored USD balance</strong>.</li>
          <li><strong>Automatic Deposit:</strong> bKash and Nagad payments are automatically verified and credited to your account balance instantly.</li>
        </ul>
      </div>

      {/* Payment Gateway Information */}
      <div className="bg-[#D85700] rounded-t-xl p-6 text-white shadow-md mt-6">
        <h2 className="text-xl font-bold">Payment Gateway Information</h2>
        <p className="text-orange-100 text-sm">You can get more information about gateways</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-b-xl shadow-sm overflow-hidden -mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <tbody className="divide-y divide-slate-100">
              {loadingTx ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center"><Loader className="h-6 w-6 animate-spin mx-auto mb-2 text-[#FF6B00]" />Loading...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500 font-medium">No transactions found.</td></tr>
              ) : (
                transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-500 font-bold uppercase">ID</div>
                      <div className="font-bold text-slate-800">#{t.trxId || t.id.substring(0,6)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-500 font-bold uppercase">Method</div>
                      <div className="font-bold text-slate-800 capitalize">💰 {t.method || 'Auto Gateway'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-500 font-bold uppercase">Amount</div>
                      <div className="font-black text-green-600">
                        {t.creditedUsd ? `$${t.creditedUsd.toFixed(2)}` : '$0.00'} / {t.amount ? `৳${t.amount}` : '৳0'}
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
