"use client";

import React, { useState, useEffect } from 'react';
import { Trophy, Save, Loader2, AlertCircle, Check, Info } from 'lucide-react';
import GlowingButton from '@/components/ui/GlowingButton';

const LEVEL_ORDER = ['BEGINNER', 'GOLD', 'DIAMOND', 'VIP', 'MASTER', 'LEGEND'] as const;
type LevelName = typeof LEVEL_ORDER[number];

const LEVEL_COLORS: Record<LevelName, { bg: string; text: string; border: string; emoji: string }> = {
  BEGINNER: { bg: 'bg-slate-50',   text: 'text-slate-700',  border: 'border-slate-200', emoji: '🌱' },
  GOLD:     { bg: 'bg-yellow-50',  text: 'text-yellow-700', border: 'border-yellow-200', emoji: '🥇' },
  DIAMOND:  { bg: 'bg-cyan-50',    text: 'text-cyan-700',   border: 'border-cyan-200',   emoji: '💎' },
  VIP:      { bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-purple-200', emoji: '👑' },
  MASTER:   { bg: 'bg-orange-50',  text: 'text-orange-700', border: 'border-orange-200', emoji: '⚡' },
  LEGEND:   { bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200',    emoji: '🔥' },
};

interface LevelConfig {
  minBdt: number;
  maxBdt: number | null;
  discount: number; // used as depositBonus %
  chatSupport: boolean;
}

type LevelSettings = Record<LevelName, LevelConfig>;

const DEFAULT_SETTINGS: LevelSettings = {
  BEGINNER: { minBdt: 0,     maxBdt: 1000,  discount: 0,  chatSupport: false },
  GOLD:     { minBdt: 1000,  maxBdt: 5000,  discount: 2,  chatSupport: false },
  DIAMOND:  { minBdt: 5000,  maxBdt: 10000, discount: 4,  chatSupport: false },
  VIP:      { minBdt: 10000, maxBdt: 25000, discount: 6,  chatSupport: true  },
  MASTER:   { minBdt: 25000, maxBdt: 50000, discount: 8,  chatSupport: true  },
  LEGEND:   { minBdt: 50000, maxBdt: null,  discount: 10, chatSupport: true  },
};

export default function LevelsSettingsPage() {
  const [levelSettings, setLevelSettings] = useState<LevelSettings>(DEFAULT_SETTINGS);
  const [levelNote, setLevelNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data.levelSettings) {
          setLevelSettings({ ...DEFAULT_SETTINGS, ...data.levelSettings });
        }
        if (data.levelNote !== undefined) {
          setLevelNote(data.levelNote);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (level: LevelName, field: keyof LevelConfig, value: number | boolean | null) => {
    setLevelSettings(prev => ({
      ...prev,
      [level]: { ...prev[level], [field]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levelSettings, levelNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setSuccess('Level settings saved! Users will see the updated level thresholds immediately.');
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-[#D85700] rounded-t-xl p-6 text-white shadow-md">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6" />
          <h2 className="text-xl font-bold">User Level Settings</h2>
        </div>
        <p className="text-orange-100 text-sm mt-2">
          Customize BDT thresholds, deposit bonus percentages, and chat support for each user level.
          Levels are based on Net Balance Added (deposits + transfers received + admin balance added minus balance transferred out and admin balance removed).
        </p>
      </div>

      <div className="bg-white border border-slate-100 rounded-b-xl shadow-sm p-6 -mt-6 space-y-6">

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle className="h-5 w-5 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2 font-bold">
            <Check className="h-5 w-5 shrink-0" /> {success}
          </div>
        )}

        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
          <Info className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <strong>How levels work:</strong> Each user&apos;s level is determined by their <strong>Net Balance Added</strong> (Deposits + Transfers Received + Admin Credits minus Transfers Sent Out and Admin Debits).
            When a user deposits, receives a transfer, or admin adds balance, their level increases. If they transfer balance to another user, that credit is deducted. The &quot;Min BDT&quot; of each level is the threshold to reach it. LEGEND has no max.
            <br /><br />
            <strong>Deposit Bonus:</strong> When a user makes a deposit, they automatically receive a bonus equal to the &quot;Deposit Bonus %&quot; of their current level. For example, a 10% bonus on ৳100 deposit = ৳10 extra credited automatically.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LEVEL_ORDER.map((level) => {
            const cfg = levelSettings[level];
            const colors = LEVEL_COLORS[level];
            const isLegend = level === 'LEGEND';
            return (
              <div key={level} className={`rounded-2xl border-2 p-5 ${colors.border} ${colors.bg} space-y-4`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{colors.emoji}</span>
                  <h3 className={`text-lg font-black ${colors.text}`}>{level}</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Min Balance Added (BDT)</label>
                    <input
                      type="number"
                      min={0}
                      value={cfg.minBdt}
                      onChange={e => updateField(level, 'minBdt', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-orange-100 transition bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      Max Balance Added (BDT) {isLegend && <span className="text-slate-400 font-normal">(no limit)</span>}
                    </label>
                    {isLegend ? (
                      <div className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-400 bg-slate-100 cursor-not-allowed">
                        No Limit ∞
                      </div>
                    ) : (
                      <input
                        type="number"
                        min={cfg.minBdt + 1}
                        value={cfg.maxBdt ?? ''}
                        onChange={e => updateField(level, 'maxBdt', parseFloat(e.target.value) || null)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-orange-100 transition bg-white"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Deposit Bonus (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={cfg.discount}
                      onChange={e => updateField(level, 'discount', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-orange-100 transition bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Chat Support</label>
                    <button
                      type="button"
                      onClick={() => updateField(level, 'chatSupport', !cfg.chatSupport)}
                      className={`w-full py-2 px-3 rounded-xl text-sm font-bold transition border-2 ${
                        cfg.chatSupport
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white text-slate-500 border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {cfg.chatSupport ? '✅ Enabled' : '❌ Disabled'}
                    </button>
                  </div>
                </div>

                <div className={`text-xs font-medium ${colors.text} border-t ${colors.border} pt-3`}>
                  Add <strong>{cfg.minBdt.toLocaleString()} BDT</strong> balance
                  {!isLegend && cfg.maxBdt ? ` – ${cfg.maxBdt.toLocaleString()} BDT` : '+'} to reach {level}
                  {cfg.discount > 0 && <> · <strong>{cfg.discount}% deposit bonus</strong></>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Admin Note */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            Custom Note (shown to users in the Level popup)
          </h3>
          <textarea
            rows={3}
            value={levelNote}
            onChange={e => setLevelNote(e.target.value)}
            placeholder="e.g. Your level increases whenever you add balance to your account (deposit, transfer, or admin credit). Transferred-out balance is deducted. Higher levels unlock discounts and priority support!"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-orange-100 transition bg-white resize-none"
          />
          <p className="text-xs text-slate-400 mt-1">Leave blank to use the default note. This text appears in the 💡 Note box inside the user&apos;s level modal.</p>
        </div>

        {/* Preview Table */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 mb-3">Preview (as seen by users)</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">Balance Added (BDT)</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">Deposit Bonus</th>
                  <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">Chat Support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {LEVEL_ORDER.map((level) => {
                  const cfg = levelSettings[level];
                  const colors = LEVEL_COLORS[level];
                  return (
                    <tr key={level} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 font-black text-sm ${colors.text}`}>
                          {LEVEL_COLORS[level].emoji} {level}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 text-xs">
                        {cfg.minBdt.toLocaleString()} BDT – {cfg.maxBdt ? `${cfg.maxBdt.toLocaleString()} BDT` : '∞'}
                      </td>
                      <td className="px-4 py-3 font-bold text-green-700">+{cfg.discount}%</td>
                      <td className="px-4 py-3">
                        {cfg.chatSupport
                          ? <span className="text-green-600 font-bold">✅ Yes</span>
                          : <span className="text-red-400 font-bold">❌ No</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <GlowingButton onClick={handleSave} disabled={saving} color="#FF6B00">
            {saving ? (
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving...</span>
            ) : (
              <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Save Level Settings</span>
            )}
          </GlowingButton>
        </div>
      </div>
    </div>
  );
}

