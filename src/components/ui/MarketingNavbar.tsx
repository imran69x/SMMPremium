"use client";

import React, { useEffect } from 'react';
import { Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function MarketingNavbar() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // We only redirect if we are strictly on the home page maybe? 
    // Or we leave redirection to the page itself. The Navbar shouldn't force redirect.
    // Let's remove redirect from navbar and leave it in the page.
  }, [user, loading, router]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-[72px] items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 relative z-50">
            <Zap className="h-8 w-8 text-[#FF6B00]" />
            <span className="font-bold text-2xl tracking-tight text-slate-900">SMM<span className="text-[#FF6B00]">Premium</span></span>
          </Link>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            {!loading && user ? (
              <Link href="/dashboard" className="inline-flex items-center justify-center rounded-xl bg-gradient-primary text-white hover:shadow-lg hover:shadow-orange-300/50 px-6 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-all">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="inline-flex items-center justify-center rounded-xl border border-[#FF6B00] text-[#FF6B00] hover:text-white hover:bg-gradient-primary px-4 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-all">
                  Sign In
                </Link>
                <Link href="/login" className="inline-flex items-center justify-center rounded-xl bg-gradient-primary text-white hover:shadow-lg hover:shadow-orange-300/50 px-4 sm:px-8 py-2 sm:py-3 text-xs sm:text-sm font-semibold transition-all">
                  Sign Up
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
