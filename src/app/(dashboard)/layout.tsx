"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, PlusCircle, CreditCard, ListOrdered, Settings, LogOut, 
  Zap, Menu, ChevronLeft, Bell, Sun, Moon, ChevronDown, User, 
  Volume2, Play, Pause, SkipForward, SkipBack, Lock, Calendar, MessageCircle, Layers, FileText
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { CurrencyProvider, useCurrency } from '@/lib/contexts/CurrencyContext';
import StarWarsToggle from '@/components/StarWarsToggle';
import PixelButton from '@/components/ui/PixelButton';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import InteractiveLogoutButton from '@/components/ui/InteractiveLogoutButton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useAuth();
  const { currency, toggleCurrency, formatPrice } = useCurrency();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FFF8F0]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B00]"></div></div>;
  }

  const handleSignOut = () => {
    signOut(auth);
  };

  const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#FFF8F0] text-slate-900 flex font-sans overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`bg-white border-r border-orange-100 flex flex-col shadow-[4px_0_24px_rgba(255,107,0,0.03)] transition-transform duration-300 z-30 fixed inset-y-0 left-0 md:relative ${sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0 md:w-20'}`}>
        
        {/* Logo */}
        <Link href="/dashboard" className="h-16 flex items-center px-6 border-b border-orange-100 shrink-0 hover:bg-orange-50/50 transition">
          <Zap className="h-6 w-6 text-[#FF6B00] shrink-0" />
          {sidebarOpen && <span className="ml-2 font-black text-xl tracking-tight text-[#FF6B00]">SMM<span className="text-slate-800">Premium</span></span>}
        </Link>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-6">
          
          {/* User Profile Card */}
          {sidebarOpen && (
            <div className="px-4 py-4">
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex flex-col items-center relative overflow-hidden">
                <div className="absolute top-2 right-2">
                  <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center border border-purple-200">
                    <Zap className="h-3 w-3 text-purple-600" />
                  </div>
                </div>
                
                <div className="h-16 w-16 rounded-full border-2 border-white shadow-md overflow-hidden bg-white mb-3">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="Avatar" className="h-full w-full object-cover" />
                </div>
                
                <h3 className="font-bold text-slate-800 text-sm mb-1">{userData?.name || 'User'}</h3>
                <div className="bg-[#FF6B00] text-white px-3 py-0.5 rounded-full text-xs font-bold shadow-sm mb-1">
                  {formatPrice(userData?.balance || 0)} <span className="text-orange-200 ml-1">+</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="mt-2">
            <div className="space-y-1 px-3">
              <NavLink href="/dashboard" icon={<PlusCircle className="h-5 w-5" />} label="New order" active={pathname === '/dashboard'} sidebarOpen={sidebarOpen} onClick={() => window.innerWidth < 768 && setSidebarOpen(false)} />
              <NavLink href="/add-funds" icon={<CreditCard className="h-5 w-5" />} label="ADD FUNDS" active={pathname === '/add-funds'} uppercase sidebarOpen={sidebarOpen} textGreen onClick={() => window.innerWidth < 768 && setSidebarOpen(false)} />
              <NavLink href="/orders" icon={<ListOrdered className="h-5 w-5" />} label="My Orders" active={pathname === '/orders'} sidebarOpen={sidebarOpen} onClick={() => window.innerWidth < 768 && setSidebarOpen(false)} />
              <NavLink href="/tickets" icon={<MessageCircle className="h-5 w-5" />} label="Support Tickets" active={pathname === '/tickets'} sidebarOpen={sidebarOpen} onClick={() => window.innerWidth < 768 && setSidebarOpen(false)} />
              <NavLink href="/transactions" icon={<FileText className="h-5 w-5" />} label="My Transactions" active={pathname === '/transactions'} sidebarOpen={sidebarOpen} onClick={() => window.innerWidth < 768 && setSidebarOpen(false)} />
            </div>
            {userData?.role === 'admin' && (
              <div className="mt-4 px-3">
                <NavLink href="/admin" icon={<Settings className="h-5 w-5" />} label="Admin Panel" active={pathname.startsWith('/admin')} sidebarOpen={sidebarOpen} />
              </div>
            )}
          </nav>
        </div>
        
        {/* Logout - sticky at bottom */}
        <div className="p-4 border-t border-orange-100 shrink-0 bg-orange-50/30 overflow-hidden mt-auto">
          <InteractiveLogoutButton onLogout={handleSignOut} sidebarOpen={sidebarOpen} />
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden bg-transparent relative">
        
        {/* Top Header */}
        <header className="h-14 md:h-16 bg-gradient-to-r from-[#D85700] to-[#FF6B00] md:bg-none md:bg-[#FFF8F0] md:border-b md:border-orange-100 flex items-center justify-between px-3 md:px-6 shrink-0 shadow-lg md:shadow-sm z-10 rounded-full mx-4 mt-4 md:rounded-none md:mx-0 md:mt-0">
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-9 w-9 bg-white/20 md:bg-[#FF6B00] text-white rounded-full md:rounded flex items-center justify-center hover:bg-white/30 md:hover:bg-[#E65C00] transition shadow-sm md:shadow-md shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex h-8 w-8 bg-[#FF6B00] text-white rounded items-center justify-center hover:bg-[#E65C00] transition shadow-md shrink-0"
            >
              <ChevronLeft className={`h-5 w-5 transition-transform ${!sidebarOpen && 'rotate-180'}`} />
            </button>
            
            <div className="hidden md:flex items-center gap-2 text-[#64748b] font-bold text-lg border-r border-orange-200 pr-4">
              <Lock className="h-5 w-5 text-[#8BC34A]" />
              New order
            </div>
            
            <div className="hidden md:flex items-center gap-2 text-slate-600 bg-white border border-orange-200 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
              <Calendar className="h-4 w-4 text-[#8BC34A]" />
              {currentDate}
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">

            
            <StarWarsToggle checked={theme === 'light'} onChange={toggleTheme} size={1.8} />
            
            <div 
              onClick={toggleCurrency}
              className="flex bg-white/20 md:bg-[#E65C00] rounded-full text-white px-2 py-1 md:px-3 md:py-1.5 items-center gap-1 md:gap-2 text-xs md:text-sm font-bold cursor-pointer hover:bg-white/30 md:hover:bg-[#D85700] shadow-sm md:shadow-md select-none transition-colors"
              title="Click to toggle currency"
            >
              <div className="h-4 w-4 md:h-5 md:px-1 bg-white/30 md:bg-orange-700 rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-black">
                {currency === 'USD' ? '$' : '৳'}
              </div>
              {currency} <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
            </div>
            
            <div className="relative">
              <div 
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex bg-transparent md:bg-[#8BC34A] rounded-full text-white md:p-1 md:pr-3 items-center gap-2 text-sm font-bold cursor-pointer hover:bg-white/10 md:hover:bg-[#7CB342] md:shadow-md"
              >
                <div className="h-8 w-8 rounded-full bg-white overflow-hidden border-2 border-white md:border-[#8BC34A] shadow-sm shrink-0">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Avatar" className="h-full w-full object-cover" />
                </div>
                <span className="hidden sm:block truncate max-w-[100px]">{userData?.name || 'User'}</span>
                <ChevronDown className={`hidden md:block h-4 w-4 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100 mb-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{userData?.name || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <Link href="/account" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-[#FF6B00] transition">
                    <User className="h-4 w-4" /> My Account
                  </Link>
                  <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-orange-50 hover:text-[#FF6B00] transition">
                    <Home className="h-4 w-4" /> Dashboard
                  </Link>
                  <div className="border-t border-slate-100 mt-1 pt-2 w-full flex justify-center">
                    <InteractiveLogoutButton onLogout={handleSignOut} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar relative z-0">
           <div className="max-w-[1400px] mx-auto w-full">
             {children}
           </div>
        </div>
      </main>
      
      {/* Global styles for custom scrollbar to match SMMSun */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #fbd38d;
          border-radius: 20px;
        }
      `}} />
    </div>
  );
}

// Helper component for Nav links
function NavLink({ href, icon, label, active, uppercase, textGreen, sidebarOpen, onClick }: any) {
  const isLogout = label.toLowerCase() === 'log out' || label.toLowerCase() === 'logout';
  
  if (isLogout) {
    return (
      <Link 
        href={href} 
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition font-bold text-sm border bg-transparent border-transparent text-slate-600 hover:bg-red-50/50 hover:text-red-500 ${!sidebarOpen && icon ? 'justify-center px-0' : ''}`}
        title={!sidebarOpen ? label : ''}
      >
        {icon && (
          <div className="shrink-0 text-red-400">
            {icon}
          </div>
        )}
        {sidebarOpen && (
          <span className={`truncate ${uppercase ? 'uppercase tracking-wider text-xs' : ''} text-red-500`}>
            {label}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link 
      href={href} 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition font-bold text-sm border ${
        active 
          ? 'bg-orange-50 border-orange-100 text-[#FF6B00] shadow-sm' 
          : 'bg-transparent border-transparent text-slate-600 hover:bg-orange-50/50 hover:text-[#FF6B00]'
      } ${!sidebarOpen && icon ? 'justify-center px-0' : ''}`}
      title={!sidebarOpen ? label : ''}
    >
      {icon && (
        <div className={`shrink-0 ${active ? 'text-[#FF6B00]' : 'text-slate-400'}`}>
          {icon}
        </div>
      )}
      {sidebarOpen && (
        <span className={`truncate ${uppercase ? 'uppercase tracking-wider text-xs' : ''} ${textGreen ? 'text-[#8BC34A]' : ''}`}>
          {label}
        </span>
      )}
    </Link>
  );
}

