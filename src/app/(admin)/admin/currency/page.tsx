"use client";

import React, { useState, useEffect } from 'react';
import { Globe, Check, Save, Loader2, AlertCircle } from 'lucide-react';
import GlowingButton from '@/components/ui/GlowingButton';

export default function CurrencySettings() {
  const [activeCurrencies, setActiveCurrencies] = useState<string[]>(['USD', 'BDT']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.activeCurrencies && Array.isArray(data.activeCurrencies)) {
          setActiveCurrencies(data.activeCurrencies);
        } else {
          // Default if not set in DB
          setActiveCurrencies(['USD', 'BDT']);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (currency: string) => {
    setActiveCurrencies(prev => {
      if (prev.includes(currency)) {
        // Prevent disabling all currencies
        if (prev.length <= 1) {
          setError('At least one currency must be active.');
          return prev;
        }
        setError('');
        return prev.filter(c => c !== currency);
      } else {
        setError('');
        return [...prev, currency];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeCurrencies }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');

      setSuccess('Currency settings saved successfully. Users will now only see the active currencies.');
      // Optionally reload window to apply context changes immediately for admin
      setTimeout(() => window.location.reload(), 2000);
    } catch (err: any) {
      setError(err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B00]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-[#D85700] rounded-t-xl p-6 text-white shadow-md">
        <div className="flex items-center gap-3">
          <Globe className="h-6 w-6" />
          <h2 className="text-xl font-bold">Currency Settings</h2>
        </div>
        <p className="text-orange-100 text-sm mt-2">
          Select which currencies should be active on the website.
        </p>
      </div>

      <div className="bg-white border border-slate-100 rounded-b-xl shadow-sm p-6 -mt-6">
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle className="h-5 w-5" /> {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2 font-bold">
            <Check className="h-5 w-5" /> {success}
          </div>
        )}

        <div className="space-y-4 max-w-md">
          <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
            <div className={`h-6 w-6 rounded border flex items-center justify-center transition-colors ${activeCurrencies.includes('USD') ? 'bg-[#FF6B00] border-[#FF6B00]' : 'border-slate-300'}`}>
              {activeCurrencies.includes('USD') && <Check className="h-4 w-4 text-white" />}
            </div>
            <div>
              <div className="font-bold text-slate-800">USD ($)</div>
              <div className="text-sm text-slate-500">United States Dollar</div>
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={activeCurrencies.includes('USD')}
              onChange={() => handleToggle('USD')}
            />
          </label>

          <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
            <div className={`h-6 w-6 rounded border flex items-center justify-center transition-colors ${activeCurrencies.includes('BDT') ? 'bg-[#FF6B00] border-[#FF6B00]' : 'border-slate-300'}`}>
              {activeCurrencies.includes('BDT') && <Check className="h-4 w-4 text-white" />}
            </div>
            <div>
              <div className="font-bold text-slate-800">BDT</div>
              <div className="text-sm text-slate-500">Bangladeshi Taka</div>
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={activeCurrencies.includes('BDT')}
              onChange={() => handleToggle('BDT')}
            />
          </label>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
          <GlowingButton onClick={handleSave} disabled={saving} color="#FF6B00">
            {saving ? (
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</span>
            ) : (
              <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Save Currencies</span>
            )}
          </GlowingButton>
        </div>

      </div>
    </div>
  );
}
