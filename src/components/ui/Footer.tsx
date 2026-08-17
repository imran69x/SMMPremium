import React from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-4">
            <Zap className="h-6 w-6 text-[#FF6B00]" />
            <span className="font-bold text-xl tracking-tight text-white">SMM<span className="text-[#FF6B00]">Premium</span></span>
          </Link>
          <p className="text-sm text-slate-400 max-w-sm">
            Bangladesh's leading SMM panel where you can buy real social media services. Grow faster, pay less.
          </p>
        </div>
        <div>
          <h3 className="text-white text-lg font-bold mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-[#FF6B00] transition">About Us</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white text-lg font-bold mb-4">Legal</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/terms" className="hover:text-[#FF6B00] transition">Terms & Conditions</Link></li>
            <li><Link href="/privacy-policy" className="hover:text-[#FF6B00] transition">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-sm text-center text-slate-500">
        &copy; {new Date().getFullYear()} SMMPremium. All rights reserved.
      </div>
    </footer>
  );
}
