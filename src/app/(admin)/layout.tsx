"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Users, Settings, ShieldAlert, ShoppingCart, TrendingUp, DollarSign, Globe, MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import InteractiveLogoutButton from '@/components/ui/InteractiveLogoutButton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user || userData?.role !== 'admin') {
        router.push('/');
      }
    }
  }, [user, userData, loading, router]);

  if (loading || !user || userData?.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B00]"></div></div>;
  }

  const handleSignOut = () => {
    signOut(auth);
  };

  const navLink = (href: string, icon: React.ReactNode, label: string) => {
    const isActive = pathname === href;
    return (
      <Link href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition text-sm ${isActive ? 'bg-orange-50 text-[#FF6B00]' : 'text-slate-600 hover:bg-orange-50 hover:text-[#FF6B00]'}`}>
        {icon} {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] text-slate-900 flex font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-orange-100 hidden md:flex flex-col shadow-sm">
        <Link href="/admin" className="p-6 flex items-center gap-2 border-b border-orange-100 bg-orange-50/50 hover:bg-orange-50 transition">
          <ShieldAlert className="h-6 w-6 text-[#FF6B00]" />
          <span className="font-bold text-xl tracking-tight text-slate-800">Admin<span className="text-[#FF6B00]">Panel</span></span>
        </Link>
        
        <nav className="flex-1 p-4 space-y-1">
          {navLink('/admin', <Home className="h-5 w-5" />, 'Dashboard')}
          {navLink('/admin/users', <Users className="h-5 w-5" />, 'Users')}
          {navLink('/admin/orders', <ShoppingCart className="h-5 w-5" />, 'Orders')}
          {navLink('/admin/fund-transactions', <DollarSign className="h-5 w-5" />, 'Funds')}
          {navLink('/admin/tickets', <MessageCircle className="h-5 w-5" />, 'Tickets')}
          {navLink('/admin/settings', <TrendingUp className="h-5 w-5" />, 'Pricing & Rates')}
        </nav>
        
        <div className="p-4 border-t border-orange-100 overflow-hidden bg-orange-50/30 flex flex-col gap-2">
          <Link href="/" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-600 hover:bg-slate-50 transition text-sm">
            <Globe className="h-4 w-4" /> Go to Homepage
          </Link>
          <InteractiveLogoutButton onLogout={handleSignOut} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-orange-100 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-[#FF6B00]" />
            <span className="font-bold text-lg text-slate-800">Admin<span className="text-[#FF6B00]">Panel</span></span>
          </div>
          <Link href="/" className="text-sm font-bold text-[#FF6B00]">Exit</Link>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
           {children}
        </div>
      </main>
    </div>
  );
}
