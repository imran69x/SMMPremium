import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import GlowingButton from '@/components/ui/GlowingButton';

export default function AntiPaySuccessPage() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-500 shadow-xl shadow-green-500/20 mb-4 animate-bounce">
        <CheckCircle2 className="h-12 w-12" />
      </div>
      
      <h1 className="text-4xl font-black text-slate-800">Payment Successful!</h1>
      <p className="text-slate-500 text-lg max-w-lg">
        Thank you for your deposit. Your funds have been securely credited to your USD balance.
      </p>

      <div className="pt-8">
        <Link href="/add-funds">
          <GlowingButton className="px-8">
            <span className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5" /> Back to Add Funds
            </span>
          </GlowingButton>
        </Link>
      </div>
    </div>
  );
}
