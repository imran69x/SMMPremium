import React from 'react';
import MarketingNavbar from '@/components/ui/MarketingNavbar';
import Footer from '@/components/ui/Footer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <MarketingNavbar />
      <div className="flex-grow pt-[72px]">
        {children}
      </div>
      <Footer />
    </div>
  );
}
