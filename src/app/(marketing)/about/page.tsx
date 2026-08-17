import React from 'react';
import { Info } from 'lucide-react';

export const metadata = {
  title: 'About Us',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-12 px-4 sm:px-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">About Us</h1>
        <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
          Learn more about our mission, vision, and the team behind the best SMM panel.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6B00]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FF6B00]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 space-y-8 text-slate-600 leading-relaxed text-lg">
          
          <div className="flex items-start gap-4">
            <div className="mt-1 h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0 text-[#FF6B00]">
              <Info className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Our Mission</h2>
              <p>
                We are dedicated to providing the highest quality social media marketing services at the most competitive prices. Our mission is to help businesses, influencers, and individuals grow their online presence organically and effectively.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800">Why Choose Us?</h2>
            <ul className="space-y-3 list-disc pl-5">
              <li><strong>High Quality Services:</strong> We use the best networks to deliver top-tier results.</li>
              <li><strong>Fast Delivery:</strong> Our automated systems ensure your orders start processing immediately.</li>
              <li><strong>24/7 Support:</strong> Our dedicated support team is always ready to assist you with any questions.</li>
              <li><strong>Secure Payments:</strong> We use industry-standard encryption and trusted payment gateways to keep your data safe.</li>
            </ul>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800">Our Vision</h2>
            <p>
              To become the world's leading platform for digital growth, empowering everyone to reach their full potential on social media without breaking the bank.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
