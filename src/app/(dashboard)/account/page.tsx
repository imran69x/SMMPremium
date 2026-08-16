"use client";

import React from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { User, Lock, Mail, Shield } from 'lucide-react';
import GlowingButton from '@/components/ui/GlowingButton';

export default function AccountPage() {
  const { user, userData } = useAuth();
  const { formatPrice } = useCurrency();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#D85700] to-[#FF8B33] rounded-2xl p-8 relative overflow-hidden text-white shadow-md">
        <div className="absolute top-0 right-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold mb-2">My Account</h2>
          <p className="text-orange-50 font-medium">Manage your profile and security settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="premium-card p-6 flex flex-col items-center">
            <div className="h-32 w-32 rounded-full border-4 border-[#FF6B00] shadow-lg overflow-hidden bg-white mb-4">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Avatar" className="h-full w-full object-cover" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">{userData?.name || 'User'}</h3>
            <p className="text-slate-500 mb-4">{user?.email}</p>
            
            <div className="w-full bg-orange-50 rounded-xl p-4 border border-orange-100 flex justify-between items-center">
              <span className="font-bold text-slate-700">Balance</span>
              <span className="text-lg font-black text-[#FF6B00]">{formatPrice(userData?.balance || 0)}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="premium-card p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-[#FF6B00]" /> Profile Information
            </h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                <input type="text" className="premium-input" defaultValue={userData?.name || ''} placeholder="Your Name" />
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
                <GlowingButton color="#FF6B00" type="button">
                  Save Changes
                </GlowingButton>
              </div>
            </form>
          </div>

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
