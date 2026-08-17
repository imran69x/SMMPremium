import React from 'react';
import { Shield } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-12 px-4 sm:px-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">Privacy Policy</h1>
        <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
          Your privacy is important to us. Learn how we collect, use, and protect your data.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10 space-y-8 text-slate-600 leading-relaxed">
          
          <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
            <div className="mt-1 h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 text-slate-700">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg">
                This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make a purchase from our website.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">1. Personal Information We Collect</h2>
            <p>
              When you visit the Site, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device.
            </p>
            <p>
              Additionally, as you browse the Site, we collect information about the individual web pages or products that you view, what websites or search terms referred you to the Site, and information about how you interact with the Site.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">2. How Do We Use Your Personal Information?</h2>
            <p>
              We use the Order Information that we collect generally to fulfill any orders placed through the Site (including processing your payment information, and providing you with invoices and/or order confirmations).
            </p>
            <p>
              Additionally, we use this Order Information to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Communicate with you;</li>
              <li>Screen our orders for potential risk or fraud; and</li>
              <li>When in line with the preferences you have shared with us, provide you with information or advertising relating to our products or services.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">3. Data Retention</h2>
            <p>
              When you place an order through the Site, we will maintain your Order Information for our records unless and until you ask us to delete this information.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">4. Changes</h2>
            <p>
              We may update this privacy policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal or regulatory reasons.
            </p>
          </div>
          
          <p className="text-sm text-slate-400 pt-6">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>
    </div>
  );
}
