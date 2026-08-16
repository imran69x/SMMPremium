"use client";

import React, { useState, useEffect } from 'react';
import { Save, DollarSign, TrendingUp, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import GlowingButton from '@/components/ui/GlowingButton';

export default function AdminSettings() {
  const [profitRatio, setProfitRatio] = useState('1');
  const [usdToBdtRate, setUsdToBdtRate] = useState('120');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        setProfitRatio(String(data.profitRatio ?? 1));
        setUsdToBdtRate(String(data.usdToBdtRate ?? 120));
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    const ratio = parseFloat(profitRatio);
    const rate = parseFloat(usdToBdtRate);

    if (isNaN(ratio) || ratio <= 0) {
      setStatus('error');
      setStatusMsg('Profit ratio must be a positive number.');
      return;
    }
    if (isNaN(rate) || rate <= 0) {
      setStatus('error');
      setStatusMsg('USD to BDT rate must be a positive number.');
      return;
    }

    setSaving(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profitRatio: ratio, usdToBdtRate: rate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setStatus('success');
      setStatusMsg('Settings saved! New rates apply on next service load.');
    } catch (err: any) {
      setStatus('error');
      setStatusMsg(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const exampleRate = parseFloat(profitRatio) || 1;
  const bdtRate = parseFloat(usdToBdtRate) || 120;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800">Pricing Settings</h1>
        <p className="text-slate-500 font-medium text-sm mt-1">Configure profit margin and currency rates</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-b-2 border-[#FF6B00] rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Profit Ratio Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
              <div className="h-9 w-9 bg-orange-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-[#FF6B00]" />
              </div>
              <div>
                <h2 className="font-black text-slate-800">Profit Ratio (Multiplier)</h2>
                <p className="text-xs text-slate-500">Multiply all provider rates by this number</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Ratio Value</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={profitRatio}
                    onChange={e => setProfitRatio(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-2xl text-slate-800 outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-orange-100 transition text-center"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">×</span>
                </div>
              </div>

              {/* Live Preview */}
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Live Preview</p>
                <div className="space-y-2">
                  {[0.5, 1, 2, 5].map(base => (
                    <div key={base} className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">Provider: <strong className="text-slate-700">${base.toFixed(2)}/1K</strong></span>
                      <span className="text-[#FF6B00] font-black">→ ${(base * exampleRate).toFixed(2)}/1K</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2">Quick Presets</p>
                <div className="flex gap-2 flex-wrap">
                  {[1, 1.5, 2, 2.5, 3].map(r => (
                    <button
                      key={r}
                      onClick={() => setProfitRatio(String(r))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-black transition border ${parseFloat(profitRatio) === r ? 'bg-[#FF6B00] text-white border-[#FF6B00]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#FF6B00] hover:text-[#FF6B00]'}`}
                    >
                      {r}×
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* USD → BDT Rate Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
              <div className="h-9 w-9 bg-green-50 rounded-xl flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-black text-slate-800">USD → BDT Rate</h2>
                <p className="text-xs text-slate-500">1 USD = how many BDT for customer display</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">BDT per 1 USD</label>
                <div className="flex gap-2 items-center">
                  <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 font-black text-green-700 text-lg whitespace-nowrap">
                    $1 =
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={usdToBdtRate}
                      onChange={e => setUsdToBdtRate(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-2xl text-slate-800 outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-orange-100 transition text-center"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">BDT</span>
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Price Preview (at {exampleRate}× ratio)</p>
                <div className="space-y-2">
                  {[0.5, 1, 2, 5].map(base => {
                    const marked = base * exampleRate;
                    return (
                      <div key={base} className="flex justify-between items-center text-sm">
                        <span className="text-slate-500"><strong>${marked.toFixed(2)}</strong> USD</span>
                        <span className="text-green-700 font-black">BDT {(marked * bdtRate).toFixed(0)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Rate Presets */}
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2">Common Rates</p>
                <div className="flex gap-2 flex-wrap">
                  {[110, 120, 125, 130, 135].map(r => (
                    <button
                      key={r}
                      onClick={() => setUsdToBdtRate(String(r))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-black transition border ${parseFloat(usdToBdtRate) === r ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-600 border-slate-200 hover:border-green-500 hover:text-green-600'}`}
                    >
                      {r} BDT
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Save Section */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            {status === 'success' && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl mb-4">
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                <p className="text-sm font-bold text-green-700">{statusMsg}</p>
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl mb-4">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                <p className="text-sm font-bold text-red-600">{statusMsg}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-black text-slate-800">Summary</p>
                <p className="text-sm text-slate-500 mt-1">
                  All rates will be <strong className="text-[#FF6B00]">{profitRatio}×</strong> provider cost &nbsp;|&nbsp; 
                  1 USD = <strong className="text-green-600">{usdToBdtRate} BDT</strong>
                </p>
              </div>
              <GlowingButton onClick={handleSave} disabled={saving} className="!w-auto !px-8">
                <span className="flex items-center gap-2">
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? 'Saving...' : 'Save Settings'}
                </span>
              </GlowingButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
