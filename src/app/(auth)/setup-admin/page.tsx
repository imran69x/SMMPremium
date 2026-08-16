"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ShieldAlert, CheckCircle, Loader } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SetupAdminPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [secretKey, setSecretKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const SETUP_KEY = 'smmfast-setup-2026';

  const handleSetAdmin = async () => {
    if (!user) {
      setMessage('You must be logged in.');
      setStatus('error');
      return;
    }

    if (secretKey !== SETUP_KEY) {
      setMessage('Wrong secret key.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      // Update directly via client SDK
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { role: 'admin' });
      setStatus('success');
      setMessage(`✅ ${user.email} is now an admin! Redirecting...`);
      setTimeout(() => {
        window.location.href = '/admin';
      }, 2000);
    } catch (err: any) {
      setStatus('error');
      setMessage(`Error: ${err.message}`);
    }
  };

  if (userData?.role === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0]">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-orange-100 text-center max-w-sm">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-black text-slate-800 mb-2">Already Admin!</h1>
          <p className="text-slate-500 mb-4">You already have admin access.</p>
          <button onClick={() => router.push('/admin')} className="px-6 py-3 bg-[#FF6B00] text-white font-black rounded-xl hover:bg-orange-600 transition">
            Go to Admin Panel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0] p-4">
      <div className="bg-white rounded-2xl p-8 shadow-xl border border-orange-100 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 bg-orange-50 rounded-xl flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 text-[#FF6B00]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">Admin Setup</h1>
            <p className="text-sm text-slate-500">One-time setup to grant admin access</p>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6">
          <p className="text-sm font-bold text-slate-700">Logged in as:</p>
          <p className="text-sm text-slate-500">{user?.email || 'Not logged in'}</p>
          <p className="text-xs text-slate-400 mt-1">UID: {user?.uid}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Secret Setup Key</label>
            <input
              type="password"
              placeholder="Enter setup key..."
              value={secretKey}
              onChange={e => setSecretKey(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl font-medium outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-orange-100 transition text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">Default key: <code className="bg-slate-100 px-1 rounded">smmfast-setup-2026</code></p>
          </div>

          {message && (
            <div className={`p-3 rounded-xl text-sm font-medium ${status === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {message}
            </div>
          )}

          <button
            onClick={handleSetAdmin}
            disabled={status === 'loading' || status === 'success'}
            className="w-full py-3 bg-[#FF6B00] text-white font-black rounded-xl hover:bg-orange-600 transition shadow flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {status === 'loading' ? (
              <><Loader className="h-5 w-5 animate-spin" /> Setting up...</>
            ) : (
              <><ShieldAlert className="h-5 w-5" /> Grant Admin Access</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
