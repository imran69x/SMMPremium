"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { 
  User, Mail, Shield, Copy, Check, Send, AlertCircle, 
  CheckCircle2, Loader2, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Clock,
  Trophy
} from 'lucide-react';
import Link from 'next/link';
import GlowingButton from '@/components/ui/GlowingButton';
import { getShortUid } from '@/lib/utils/uid';
import { db } from '@/lib/firebase/config';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export default function AccountPage() {
  const { user, userData } = useAuth();
  const { formatPrice, currency, rate, activeCurrencies } = useCurrency();
  const isBdtMode = currency === 'BDT' || (activeCurrencies?.length === 1 && activeCurrencies[0] === 'BDT');

  // User ID copy state
  const [copied, setCopied] = useState(false);
  const userShortId = user ? getShortUid(user.uid) : '------';

  // Profile save state
  const [nameInput, setNameInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');

  // Transfer Balance state
  const [recipientId, setRecipientId] = useState('');
  const [lookupUser, setLookupUser] = useState<any | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  
  const [transferAmount, setTransferAmount] = useState('');
  const [transferCurrency, setTransferCurrency] = useState<'USD' | 'BDT'>('USD');

  // Set default transfer currency from active currencies
  useEffect(() => {
    if (activeCurrencies && activeCurrencies.length > 0) {
      setTransferCurrency(activeCurrencies[0] as 'USD' | 'BDT');
    }
  }, [activeCurrencies]);
  const [transferNote, setTransferNote] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  // Recent transfers
  const [recentTransfers, setRecentTransfers] = useState<any[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(true);

  useEffect(() => {
    if (userData?.name) {
      setNameInput(userData.name);
    }
  }, [userData?.name]);

  // Copy User ID
  const handleCopyId = () => {
    if (!userShortId) return;
    navigator.clipboard.writeText(userShortId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Real-time lookup recipient when typing 6 digits
  useEffect(() => {
    const trimmed = recipientId.trim();
    setLookupError('');
    setTransferError('');
    setTransferSuccess('');

    if (trimmed.length < 6) {
      setLookupUser(null);
      return;
    }

    if (!user) return;

    const timer = setTimeout(async () => {
      setLookupLoading(true);
      try {
        const res = await fetch(`/api/transfer/lookup?id=${encodeURIComponent(trimmed)}&senderUid=${encodeURIComponent(user.uid)}`);
        const data = await res.json();
        if (!res.ok) {
          setLookupUser(null);
          setLookupError(data.error || 'User not found');
        } else {
          setLookupUser(data.user);
          setLookupError('');
        }
      } catch (err: any) {
        setLookupUser(null);
        setLookupError('Failed to verify user ID');
      } finally {
        setLookupLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [recipientId, user]);

  // Load Recent Transfers for this user
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
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setRecentTransfers(list.slice(0, 5));
      setLoadingTransfers(false);
    }, (err) => {
      console.error('Error loading recent transfers:', err);
      setLoadingTransfers(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !nameInput.trim()) return;
    setSavingProfile(true);
    setProfileSuccess('');
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: nameInput.trim(),
        updatedAt: new Date().toISOString()
      });
      setProfileSuccess('Profile name updated successfully!');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  // Execute Transfer
  const handleTransferSubmit = async () => {
    if (!user || !lookupUser || !transferAmount) return;

    const amountNum = parseFloat(transferAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTransferError('Please enter a valid amount');
      return;
    }

    setTransferring(true);
    setTransferError('');
    setTransferSuccess('');

    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderUid: user.uid,
          recipientId: lookupUser.shortUid || lookupUser.uid,
          amount: amountNum,
          currency: transferCurrency,
          note: transferNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Transfer failed');
      }

      setTransferSuccess(data.message || 'Transfer completed successfully!');
      setShowConfirm(false);
      setRecipientId('');
      setLookupUser(null);
      setTransferAmount('');
      setTransferNote('');
    } catch (err: any) {
      setTransferError(err.message || 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  const userBalance = Number(userData?.balance || 0);
  const maxAvailableInSelectedCurrency = transferCurrency === 'BDT' ? (userBalance * rate) : userBalance;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#D85700] to-[#FF8B33] rounded-2xl p-8 relative overflow-hidden text-white shadow-md">
        <div className="absolute top-0 right-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold mb-2">My Account</h2>
          <p className="text-orange-50 font-medium">Manage your profile, view your ID, and transfer balance securely.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar, User ID & Balance */}
        <div className="lg:col-span-1 space-y-6">
          <div className="premium-card p-6 flex flex-col items-center text-center">
            <div className="h-32 w-32 rounded-full border-4 border-[#FF6B00] shadow-lg overflow-hidden bg-white mb-4">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'User'}`} 
                alt="Avatar" 
                className="h-full w-full object-cover" 
              />
            </div>
            <h3 className="text-xl font-bold text-slate-800">{userData?.name || 'User'}</h3>
            <p className="text-slate-500 text-sm mb-3">{user?.email}</p>
            
            <Link 
              href="/level" 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-orange-100 text-[#FF6B00] hover:bg-orange-200 transition mb-4 shadow-sm"
              title="View your VIP Level details"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Level: {userData?.level || 'BEGINNER'}</span>
            </Link>
            
            {/* User ID Box (Prominently Above Balance) */}
            <div className="w-full bg-gradient-to-br from-slate-50 to-orange-50/40 rounded-xl p-4 border border-slate-200/80 mb-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
                    My User ID
                  </span>
                  <div className="text-2xl font-black font-mono text-[#D85700] tracking-wider mt-0.5">
                    {userShortId}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#FF6B00] hover:border-[#FF6B00] hover:shadow transition active:scale-95"
                  title="Copy User ID"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-500 stroke-[3]" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-slate-500" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 text-left mt-2 border-t border-slate-200/60 pt-2">
                Share this 6-digit ID with other users to receive balance transfers.
              </p>
            </div>

            {/* Balance Box */}
            <div className="w-full bg-orange-50 rounded-xl p-4 border border-orange-100 flex justify-between items-center shadow-sm">
              <span className="font-bold text-slate-700">Available Balance</span>
              <span className="text-xl font-black text-[#FF6B00]">
                {formatPrice(userData?.balance || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Balance Transfer & Profile */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Balance Transfer Section */}
          <div className="premium-card p-6 border-2 border-orange-100/60 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center font-bold">
                  <ArrowRightLeft className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Transfer Balance</h3>
                  <p className="text-xs text-slate-500">Send funds instantly to any user using their 6-digit User ID</p>
                </div>
              </div>
            </div>

            {transferSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 text-sm font-medium rounded-xl flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <span>{transferSuccess}</span>
              </div>
            )}

            {transferError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-xl flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                <span>{transferError}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Recipient ID Input */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Recipient User ID (6 Digits)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={10}
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value.replace(/\s+/g, ''))}
                    placeholder="Enter 6-digit User ID (e.g. 937542)"
                    className="premium-input font-mono font-bold tracking-wider !pr-10"
                  />
                  <div className="absolute right-3 top-3">
                    {lookupLoading ? (
                      <Loader2 className="h-5 w-5 text-orange-500 animate-spin" />
                    ) : lookupUser ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : lookupError ? (
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    ) : null}
                  </div>
                </div>

                {/* Recipient Verification Feedback */}
                {lookupUser && (
                  <div className="mt-2 p-3 bg-green-50/80 border border-green-200 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xs">
                        {lookupUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-extrabold text-green-900">{lookupUser.name}</div>
                        <div className="text-green-700 font-mono">ID: #{lookupUser.shortUid} {lookupUser.email && `• ${lookupUser.email}`}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-green-200/70 text-green-800 font-bold rounded text-[10px]">
                      Verified User
                    </span>
                  </div>
                )}

                {lookupError && (
                  <p className="text-xs text-red-500 font-medium mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {lookupError}
                  </p>
                )}
              </div>

              {/* Amount & Currency Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-bold text-slate-700">Amount to Transfer</label>
                  {/* Show currency toggle only when both currencies are active */}
                  {activeCurrencies && activeCurrencies.length > 1 ? (
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                      {activeCurrencies.includes('USD') && (
                        <button
                          type="button"
                          onClick={() => setTransferCurrency('USD')}
                          className={`px-2.5 py-0.5 text-xs font-bold rounded-md transition ${transferCurrency === 'USD' ? 'bg-white text-[#FF6B00] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          USD ($)
                        </button>
                      )}
                      {activeCurrencies.includes('BDT') && (
                        <button
                          type="button"
                          onClick={() => setTransferCurrency('BDT')}
                          className={`px-2.5 py-0.5 text-xs font-bold rounded-md transition ${transferCurrency === 'BDT' ? 'bg-white text-[#FF6B00] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          BDT
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                      {activeCurrencies?.[0] === 'BDT' ? 'BDT' : 'USD ($)'}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-xs">
                    {transferCurrency === 'USD' ? '$' : 'BDT'}
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder={transferCurrency === 'USD' ? '0.00' : '0'}
                    className={`premium-input ${transferCurrency === 'BDT' ? '!pl-12' : '!pl-8'} !pr-16 font-bold text-slate-800`}
                  />
                  <button
                    type="button"
                    onClick={() => setTransferAmount(maxAvailableInSelectedCurrency.toFixed(2))}
                    className="absolute right-2.5 top-2.5 px-2 py-1 text-xs font-bold text-[#FF6B00] hover:bg-orange-50 rounded transition"
                  >
                    MAX
                  </button>
                </div>

                {/* Conversion display and helper — only show if both currencies are active */}
                <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
                  <span>
                    Available: <strong className="text-slate-700">{transferCurrency === 'USD' ? `$${userBalance.toFixed(4)}` : `${(userBalance * rate).toFixed(2)} BDT`}</strong>
                  </span>
                  {transferAmount && !isNaN(parseFloat(transferAmount)) && activeCurrencies && activeCurrencies.length > 1 && (
                    <span className="font-semibold text-orange-600">
                      ≈ {transferCurrency === 'USD' 
                          ? `${(parseFloat(transferAmount) * rate).toFixed(2)} BDT` 
                          : `$${(parseFloat(transferAmount) / rate).toFixed(4)} USD`}
                    </span>
                  )}
                </div>
              </div>

              {/* Note / Memo */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Note / Reference <span className="text-xs font-normal text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="e.g. Order payment, Friend gift"
                  className="premium-input"
                />
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {!showConfirm ? (
                  <button
                    type="button"
                    disabled={!lookupUser || !transferAmount || parseFloat(transferAmount) <= 0 || transferring}
                    onClick={() => setShowConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-600 hover:to-[#FF6B00] text-white font-bold rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-[0.99]"
                  >
                    <Send className="h-4 w-4" /> Transfer Now
                  </button>
                ) : (
                  <div className="p-4 bg-orange-50/70 border-2 border-[#FF6B00]/40 rounded-xl space-y-3 animate-in fade-in duration-150">
                    <div className="text-center">
                      <p className="text-xs font-bold uppercase tracking-wider text-orange-800">Please Confirm Transfer</p>
                      <p className="text-base font-black text-slate-800 mt-1">
                        Send {transferCurrency === 'USD' ? `$${parseFloat(transferAmount).toFixed(4)}` : `${parseFloat(transferAmount).toFixed(2)} BDT`}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        To: <strong className="text-slate-800">{lookupUser?.name}</strong> (ID: #{lookupUser?.shortUid})
                      </p>
                    </div>
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 text-center font-medium">
                      ⚠️ Note: Transferred balance will be deducted from your Level points.
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={transferring}
                        onClick={() => setShowConfirm(false)}
                        className="flex-1 py-2 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={transferring}
                        onClick={handleTransferSubmit}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-4 bg-[#FF6B00] hover:bg-orange-600 text-white font-bold rounded-lg shadow transition text-sm disabled:opacity-50"
                      >
                        {transferring ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" /> Confirm & Send
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Transfers Mini-Table */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" /> Recent Transfers
              </h4>

              {loadingTransfers ? (
                <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-orange-500" /> Loading transfers...
                </div>
              ) : recentTransfers.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                  No transfers yet. Transfers sent or received will appear here and in My Transactions.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentTransfers.map((tx) => {
                    const isSender = tx.senderUid === user?.uid;
                    return (
                      <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50/60 px-2 rounded-lg transition">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center ${isSender ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                            {isSender ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">
                              {isSender ? `To: ${tx.recipientName || 'User'} (#${tx.recipientShortId})` : `From: ${tx.senderName || 'User'} (#${tx.senderShortId})`}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ''} {tx.note && `• "${tx.note}"`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-black text-sm ${isSender ? 'text-red-500' : 'text-green-600'}`}>
                            {isBdtMode
                              ? `${isSender ? '-' : '+'}${tx.amountBdt !== undefined && tx.amountBdt !== null ? Number(tx.amountBdt).toFixed(2) : (Number(tx.amount || 0) * rate).toFixed(2)} BDT`
                              : `${isSender ? '-' : '+'}$${Number(tx.amount || 0).toFixed(2)}`}
                          </div>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">
                            {tx.id}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Profile Information */}
          <div className="premium-card p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-[#FF6B00]" /> Profile Information
            </h3>

            {profileSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> {profileSuccess}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                <input 
                  type="text" 
                  className="premium-input" 
                  value={nameInput} 
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Your Name" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <input type="email" className="premium-input !pl-10 bg-slate-50 cursor-not-allowed" defaultValue={user?.email || ''} disabled />
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed.</p>
              </div>
              <div className="pt-4 text-right">
                <GlowingButton color="#FF6B00" type="submit" disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </GlowingButton>
              </div>
            </form>
          </div>

          {/* Security Settings */}
          <div className="premium-card p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#8BC34A]" /> Security Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
                <div>
                  <h4 className="font-bold text-slate-800">Change Password</h4>
                  <p className="text-sm text-slate-500">Update your account password</p>
                </div>
                <GlowingButton color="#64748b" bgColor="#f8fafc" className="!py-2 !px-4 !text-sm">
                  Update
                </GlowingButton>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
                <div>
                  <h4 className="font-bold text-slate-800">Two-Factor Authentication</h4>
                  <p className="text-sm text-slate-500">Add an extra layer of security</p>
                </div>
                <GlowingButton color="#8BC34A" className="!py-2 !px-4 !text-sm">
                  Enable
                </GlowingButton>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
