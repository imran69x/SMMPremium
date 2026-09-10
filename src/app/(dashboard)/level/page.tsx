"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, CheckCircle2, XCircle, ShieldCheck, Sparkles, 
  ArrowRight, Crown, Zap, Flame, Gem, Medal, Sprout, 
  HelpCircle, Info, ShoppingCart, Wallet, Clock,
  ArrowDownLeft, ArrowUpRight, Plus, Minus
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Link from 'next/link';

const LEVEL_ORDER = ['BEGINNER', 'GOLD', 'DIAMOND', 'VIP', 'MASTER', 'LEGEND'] as const;
type LevelName = typeof LEVEL_ORDER[number];

const LEVEL_CONFIG: Record<LevelName, { 
  bg: string; 
  badgeBg: string; 
  text: string; 
  border: string; 
  glow: string;
  icon: any; 
  colorHex: string;
}> = {
  BEGINNER: { 
    bg: 'bg-emerald-50/50', 
    badgeBg: 'bg-emerald-100 text-emerald-800', 
    text: 'text-emerald-700', 
    border: 'border-emerald-200',
    glow: 'shadow-emerald-100',
    icon: Sprout,
    colorHex: '#10B981',
  },
  GOLD: { 
    bg: 'bg-amber-50/50', 
    badgeBg: 'bg-amber-100 text-amber-800', 
    text: 'text-amber-700', 
    border: 'border-amber-200',
    glow: 'shadow-amber-100',
    icon: Medal,
    colorHex: '#F59E0B',
  },
  DIAMOND: { 
    bg: 'bg-cyan-50/50', 
    badgeBg: 'bg-cyan-100 text-cyan-800', 
    text: 'text-cyan-700', 
    border: 'border-cyan-200',
    glow: 'shadow-cyan-100',
    icon: Gem,
    colorHex: '#06B6D4',
  },
  VIP: { 
    bg: 'bg-purple-50/50', 
    badgeBg: 'bg-purple-100 text-purple-800', 
    text: 'text-purple-700', 
    border: 'border-purple-200',
    glow: 'shadow-purple-100',
    icon: Crown,
    colorHex: '#8B5CF6',
  },
  MASTER: { 
    bg: 'bg-orange-50/50', 
    badgeBg: 'bg-orange-100 text-orange-800', 
    text: 'text-[#FF6B00]', 
    border: 'border-orange-200',
    glow: 'shadow-orange-100',
    icon: Zap,
    colorHex: '#FF6B00',
  },
  LEGEND: { 
    bg: 'bg-rose-50/50', 
    badgeBg: 'bg-rose-100 text-rose-800', 
    text: 'text-rose-700', 
    border: 'border-rose-200',
    glow: 'shadow-rose-100',
    icon: Flame,
    colorHex: '#F43F5E',
  },
};

interface LevelThreshold {
  minBdt: number;
  maxBdt: number | null;
  discount: number;
  chatSupport: boolean;
}

const DEFAULT_LEVEL_SETTINGS: Record<LevelName, LevelThreshold> = {
  BEGINNER: { minBdt: 0,     maxBdt: 1000,  discount: 0,  chatSupport: false },
  GOLD:     { minBdt: 1000,  maxBdt: 5000,  discount: 2,  chatSupport: false },
  DIAMOND:  { minBdt: 5000,  maxBdt: 10000, discount: 4,  chatSupport: false },
  VIP:      { minBdt: 10000, maxBdt: 25000, discount: 6,  chatSupport: true  },
  MASTER:   { minBdt: 25000, maxBdt: 50000, discount: 8,  chatSupport: true  },
  LEGEND:   { minBdt: 50000, maxBdt: null,  discount: 10, chatSupport: true  },
};

export default function UserLevelPage() {
  const { user, userData } = useAuth();
  const { formatPrice, rate } = useCurrency();
  const [levelSettings, setLevelSettings] = useState<Record<LevelName, LevelThreshold>>(DEFAULT_LEVEL_SETTINGS);
  const [levelNote, setLevelNote] = useState<string>('');
  
  // Realtime financial data for Level Credit computation
  const [deposits, setDeposits] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [adminAdj, setAdminAdj] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Admin Level Settings
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.levelSettings) {
          setLevelSettings({ ...DEFAULT_LEVEL_SETTINGS, ...data.levelSettings });
        }
        if (data.levelNote !== undefined) {
          setLevelNote(data.levelNote);
        }
      })
      .catch(err => console.error('Failed to load level settings:', err));
  }, []);

  // 2. Fetch user's financial activities to compute Level Credit
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // A. Completed payment deposits
    const qDeposits = query(
      collection(db, 'antipay_transactions'),
      where('uid', '==', user.uid),
      where('status', '==', 'completed')
    );
    const unsubDeposits = onSnapshot(qDeposits, (snap) => {
      const list: any[] = [];
      snap.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      setDeposits(list);
    }, (err) => console.error('Failed to load deposits for level:', err));

    // B. Balance transfers (both received and sent)
    const qTransfers = query(
      collection(db, 'balance_transfers'),
      where('participants', 'array-contains', user.uid)
    );
    const unsubTransfers = onSnapshot(qTransfers, (snap) => {
      const list: any[] = [];
      snap.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      setTransfers(list);
    }, (err) => console.error('Failed to load transfers for level:', err));

    // C. Admin adjustments (both credit and debit)
    const qAdminAdj = query(
      collection(db, 'admin_balance_adjustments'),
      where('uid', '==', user.uid)
    );
    const unsubAdminAdj = onSnapshot(qAdminAdj, (snap) => {
      const list: any[] = [];
      snap.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      setAdminAdj(list);
    }, (err) => console.error('Failed to load admin adjustments for level:', err));

    // D. Orders count
    const qOrders = query(
      collection(db, 'orders'),
      where('uid', '==', user.uid)
    );
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      const list: any[] = [];
      snap.forEach(docSnap => list.push({ id: docSnap.id, ...docSnap.data() }));
      setOrders(list);
      setLoading(false);
    }, (err) => {
      console.error('Failed to load orders for level:', err);
      setLoading(false);
    });

    return () => {
      unsubDeposits();
      unsubTransfers();
      unsubAdminAdj();
      unsubOrders();
    };
  }, [user]);

  // ──────────────────────────────────────────────────────────────────────────
  // LEVEL CALCULATION LOGIC:
  // Whenever balance is added to user (Deposit, Transfer Received, Admin Credit)
  // it is added to Level Credit.
  // When user transfers balance out, that credit is deducted.
  // Admin debits are also deducted.
  // ──────────────────────────────────────────────────────────────────────────

  // 1. Deposits in BDT
  const totalDepositsBdt = useMemo(() => {
    return deposits.reduce((sum, d) => {
      // In AntiPay transactions, d.amount is the BDT amount entered by the user
      const bdt = d.bdtAmount !== undefined && d.bdtAmount !== null
        ? Number(d.bdtAmount)
        : (d.amount !== undefined && d.amount !== null
            ? Number(d.amount)
            : Number(d.creditedUsd || 0) * (rate > 0 ? rate : 120));
      return sum + (isNaN(bdt) ? 0 : bdt);
    }, 0);
  }, [deposits, rate]);

  // 2. Transfers received in BDT (incoming -> adds to level)
  const totalTransfersReceivedBdt = useMemo(() => {
    if (!user) return 0;
    return transfers
      .filter(t => t.recipientUid === user.uid)
      .reduce((sum, t) => {
        const bdt = t.amountBdt !== undefined && t.amountBdt !== null
          ? Number(t.amountBdt)
          : Number(t.amount || 0) * (rate > 0 ? rate : 120);
        return sum + (isNaN(bdt) ? 0 : bdt);
      }, 0);
  }, [transfers, user, rate]);

  // 3. Admin balance added in BDT (incoming -> adds to level)
  const totalAdminCreditsBdt = useMemo(() => {
    return adminAdj
      .filter(a => a.type === 'admin_credit')
      .reduce((sum, a) => {
        const bdt = a.bdtAmount !== undefined && a.bdtAmount !== null
          ? Number(a.bdtAmount)
          : Number(a.amount || 0) * (rate > 0 ? rate : 120);
        return sum + (isNaN(bdt) ? 0 : bdt);
      }, 0);
  }, [adminAdj, rate]);

  // 4. Transfers sent in BDT (outgoing -> DEDUCTED from level!)
  const totalTransfersSentBdt = useMemo(() => {
    if (!user) return 0;
    return transfers
      .filter(t => t.senderUid === user.uid)
      .reduce((sum, t) => {
        const bdt = t.amountBdt !== undefined && t.amountBdt !== null
          ? Number(t.amountBdt)
          : Number(t.amount || 0) * (rate > 0 ? rate : 120);
        return sum + (isNaN(bdt) ? 0 : bdt);
      }, 0);
  }, [transfers, user, rate]);

  // 5. Admin balance removed in BDT (outgoing -> DEDUCTED from level!)
  const totalAdminDebitsBdt = useMemo(() => {
    return adminAdj
      .filter(a => a.type === 'admin_debit')
      .reduce((sum, a) => {
        const bdt = a.bdtAmount !== undefined && a.bdtAmount !== null
          ? Number(a.bdtAmount)
          : Number(a.amount || 0) * (rate > 0 ? rate : 120);
        return sum + (isNaN(bdt) ? 0 : bdt);
      }, 0);
  }, [adminAdj, rate]);

  // Net Level Qualifying Balance in BDT
  const totalIncomingBdt = totalDepositsBdt + totalTransfersReceivedBdt + totalAdminCreditsBdt;
  const totalOutgoingBdt = totalTransfersSentBdt + totalAdminDebitsBdt;
  const levelCreditBdt = Math.max(0, totalIncomingBdt - totalOutgoingBdt);

  // Determine current user level based on levelCreditBdt
  const currentLevel = useMemo((): LevelName => {
    for (let i = LEVEL_ORDER.length - 1; i >= 0; i--) {
      const lvl = LEVEL_ORDER[i];
      const cfg = levelSettings[lvl];
      if (levelCreditBdt >= cfg.minBdt) {
        return lvl;
      }
    }
    return 'BEGINNER';
  }, [levelCreditBdt, levelSettings]);

  // Sync computed level to user document in Firestore silently
  useEffect(() => {
    if (!user || !currentLevel) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      updateDoc(userRef, {
        level: currentLevel,
        levelCreditBdt: Math.round(levelCreditBdt * 100) / 100,
      }).catch(() => {});
    } catch {}
  }, [user, currentLevel, levelCreditBdt]);

  // Next level
  const nextLevel = useMemo((): LevelName | null => {
    const idx = LEVEL_ORDER.indexOf(currentLevel);
    return idx < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[idx + 1] : null;
  }, [currentLevel]);

  // Progress percentage
  const levelProgress = useMemo(() => {
    const currentCfg = levelSettings[currentLevel];
    if (!currentCfg.maxBdt) return 100;
    const range = currentCfg.maxBdt - currentCfg.minBdt;
    if (range <= 0) return 100;
    const progress = ((levelCreditBdt - currentCfg.minBdt) / range) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }, [currentLevel, levelCreditBdt, levelSettings]);

  const currentCfg = levelSettings[currentLevel];
  const nextCfg = nextLevel ? levelSettings[nextLevel] : null;
  const neededBdt = nextCfg ? Math.max(0, nextCfg.minBdt - levelCreditBdt) : 0;
  const CurrentIcon = LEVEL_CONFIG[currentLevel].icon;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin h-8 w-8 border-4 border-[#FF6B00] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner with User Greeting & Level Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome & Progress Card */}
        <div className="lg:col-span-2 bg-gradient-to-r from-[#D85700] to-[#FF8B33] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-end pr-6">
            <CurrentIcon className="w-64 h-64 text-white" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-full border-2 border-white/60 overflow-hidden bg-white/20 shadow-md shrink-0">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
                  alt="Avatar" 
                  className="h-full w-full object-cover" 
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black">
                  Welcome Back, {userData?.name || 'User'} 👋
                </h1>
                <p className="text-orange-100 text-xs sm:text-sm font-medium mt-0.5">
                  Email: {user?.email}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
                  <span>Your Status is</span>
                  <span className="text-white underline decoration-white/60 uppercase">{currentLevel}</span>
                </div>
              </div>
            </div>

            {/* User Progress Bar */}
            <div className="mt-6 bg-black/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10">
              <div className="flex items-center justify-between text-xs sm:text-sm font-black mb-2">
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <CurrentIcon className="w-4 h-4" /> {currentLevel}
                </span>
                {nextLevel ? (
                  <span className="flex items-center gap-1.5 text-orange-100 uppercase tracking-wider">
                    {nextLevel} <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="text-amber-200">MAX LEVEL REACHED</span>
                )}
              </div>

              {/* Bar */}
              <div className="w-full h-4 bg-black/25 rounded-full overflow-hidden p-0.5 relative">
                <div 
                  className="h-full bg-gradient-to-r from-amber-300 to-white rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-2.5 text-xs text-orange-100 font-medium">
                <span>{levelProgress.toFixed(1)}% Completed</span>
                {nextLevel ? (
                  <span>
                    Add <strong className="text-white font-black">{neededBdt.toFixed(2)} BDT</strong> more balance to reach <strong>{nextLevel}</strong> level
                  </span>
                ) : (
                  <span className="text-white font-bold">🎉 Congratulations! You have unlocked all VIP privileges</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Status Card: Tier Overview */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-[#FF6B00]">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">{userData?.name || 'User'}</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Status: <strong className="text-[#FF6B00] uppercase">{currentLevel}</strong></p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${LEVEL_CONFIG[currentLevel].badgeBg}`}>
                  {currentLevel}
                </span>
              </div>
            </div>

            {/* Quick mini table */}
            <div className="space-y-1.5 text-xs">
              <div className="grid grid-cols-3 font-bold text-slate-400 uppercase text-[10px] pb-1 px-2">
                <span>Status</span>
                <span className="text-center">Dep. Bonus</span>
                <span className="text-right">Support</span>
              </div>
              {LEVEL_ORDER.map(lvl => {
                const cfg = levelSettings[lvl];
                const isCurrent = lvl === currentLevel;
                return (
                  <div 
                    key={lvl}
                    className={`grid grid-cols-3 items-center px-2 py-1.5 rounded-lg transition text-xs ${
                      isCurrent ? 'bg-orange-50 font-black text-[#FF6B00]' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="capitalize">{lvl.toLowerCase()}</span>
                    <span className="text-center font-bold">+{cfg.discount.toString().padStart(2, '0')}%</span>
                    <span className="text-right">
                      {lvl !== 'BEGINNER' ? (
                        <span className="text-green-600 font-black">✔</span>
                      ) : (
                        <span className="text-rose-500 font-bold">✖</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Account Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Status</p>
            <p className={`text-xl font-black mt-1 ${LEVEL_CONFIG[currentLevel].text}`}>{currentLevel}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Tier Level</span>
            <span className="text-[#FF6B00]">Rank #{LEVEL_ORDER.indexOf(currentLevel) + 1}</span>
          </div>
        </div>

        {/* Card 2: Deposit Bonus */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deposit Bonus</p>
            <p className="text-xl font-black mt-1 text-green-600">+{currentCfg.discount}% Bonus</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>On Every Deposit</span>
            <span className={currentCfg.discount > 0 ? 'text-green-600 font-black' : 'text-slate-400'}>Active</span>
          </div>
        </div>

        {/* Card 3: Account Order */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Order</p>
            <p className="text-xl font-black mt-1 text-slate-800">{orders.length}</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
            <Link href="/orders" className="text-[#FF6B00] hover:underline flex items-center gap-1">
              Check Orders &raquo;
            </Link>
          </div>
        </div>

        {/* Card 4: Level Balance Credit */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Level Credit (BDT)</p>
            <p className="text-xl font-black mt-1 text-[#FF6B00]">{levelCreditBdt.toFixed(2)} BDT</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span title="Total Added minus Transferred Out">
              +{totalIncomingBdt.toFixed(0)} / -{totalTransfersSentBdt.toFixed(0)}
            </span>
            <Link href="/add-funds" className="text-[#8BC34A] font-bold hover:underline flex items-center gap-1">
              Add Funds &raquo;
            </Link>
          </div>
        </div>
      </div>

      {/* Level Balance Activity Breakdown Card */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-orange-200 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#FF6B00]" />
            <h4 className="font-black text-slate-800 text-sm">Level Credit Breakdown</h4>
          </div>
          <div className="text-xs font-bold text-[#FF6B00] bg-white px-3 py-1 rounded-full border border-orange-200">
            Qualifying Balance: {levelCreditBdt.toFixed(2)} BDT
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div className="bg-white p-3 rounded-xl border border-orange-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Deposits</span>
            <span className="font-black text-green-600 text-sm">+{totalDepositsBdt.toFixed(2)} BDT</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-orange-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Transfers Received</span>
            <span className="font-black text-green-600 text-sm">+{totalTransfersReceivedBdt.toFixed(2)} BDT</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-orange-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Admin Added</span>
            <span className="font-black text-green-600 text-sm">+{totalAdminCreditsBdt.toFixed(2)} BDT</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-orange-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Transfers Sent Out</span>
            <span className="font-black text-red-500 text-sm">-{totalTransfersSentBdt.toFixed(2)} BDT</span>
          </div>
          <div className="bg-white p-3 rounded-xl border border-orange-100">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Admin Removed</span>
            <span className="font-black text-red-500 text-sm">-{totalAdminDebitsBdt.toFixed(2)} BDT</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 mt-3 font-medium">
          💡 <strong>Level Rules:</strong> Whenever balance is added to your account via Deposit, Transfer Received, or Admin Credit, your Level increases. If you transfer balance out to another user, that credit is deducted.
        </p>
      </div>

      {/* Admin Custom Note Card (if configured) */}
      {levelNote && levelNote.trim() && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 shadow-sm flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-black text-amber-800 uppercase tracking-wider mb-1">Notice from Administration</h4>
            <p className="text-xs sm:text-sm font-medium leading-relaxed">{levelNote}</p>
          </div>
        </div>
      )}

      {/* Full Comparison Table of All Tiers */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-800 text-base">VIP Level Benefits & Balance Requirements</h3>
            <p className="text-xs text-slate-400 mt-0.5">Add BDT balance to automatically qualify for higher VIP tiers.</p>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-[#FF6B00]" /> 6 VIP Tiers
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-400 uppercase font-black tracking-wider">
              <tr>
                <th className="text-left px-6 py-4">Level</th>
                <th className="text-left px-6 py-4">Balance Added (BDT)</th>
                <th className="text-left px-6 py-4">Deposit Bonus</th>
                <th className="text-left px-6 py-4">Chat Support</th>
                <th className="text-right px-6 py-4">Current Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {LEVEL_ORDER.map((lvl) => {
                const cfg = levelSettings[lvl];
                const isCurrent = lvl === currentLevel;
                const Icon = LEVEL_CONFIG[lvl].icon;

                return (
                  <tr 
                    key={lvl} 
                    className={`transition ${isCurrent ? 'bg-orange-50/50 font-bold' : 'hover:bg-slate-50/50'}`}
                  >
                    {/* Level Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${LEVEL_CONFIG[lvl].border} ${LEVEL_CONFIG[lvl].bg}`}>
                          <Icon className={`w-5 h-5 ${LEVEL_CONFIG[lvl].text}`} />
                        </div>
                        <div>
                          <div className="font-black text-slate-800 flex items-center gap-2">
                            {lvl}
                            {isCurrent && (
                              <span className="bg-[#FF6B00] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                                CURRENT
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium">
                            Rank #{LEVEL_ORDER.indexOf(lvl) + 1}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* BDT Requirement */}
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-slate-700 text-xs">
                        {cfg.minBdt.toLocaleString()} BDT
                        {cfg.maxBdt ? ` – ${cfg.maxBdt.toLocaleString()} BDT` : '+'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {cfg.maxBdt 
                          ? `Qualifying balance between ${cfg.minBdt} and ${cfg.maxBdt} BDT` 
                          : `Qualifying balance over ${cfg.minBdt} BDT`}
                      </div>
                    </td>

                    {/* Deposit Bonus */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 font-black text-green-700">
                        🎁 +{cfg.discount}% Bonus
                      </span>
                    </td>

                    {/* Chat Support */}
                    <td className="px-6 py-4">
                      {lvl !== 'BEGINNER' ? (
                        <span className="inline-flex items-center gap-1 text-green-700 text-xs font-bold bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 24/7 Priority Support
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-medium bg-slate-100 px-2.5 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5" /> Standard Tickets
                        </span>
                      )}
                    </td>

                    {/* Action / Current Status */}
                    <td className="px-6 py-4 text-right">
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-[#FF6B00] font-black text-xs bg-orange-100/80 px-3 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active Tier
                        </span>
                      ) : levelCreditBdt >= cfg.minBdt ? (
                        <span className="text-slate-400 font-bold text-xs">
                          Unlocked
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs font-medium">
                          Locked ({Math.max(0, cfg.minBdt - levelCreditBdt).toFixed(0)} BDT balance needed)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
