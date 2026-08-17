import React from 'react';
import { FileText } from 'lucide-react';

export const metadata = {
  title: 'Terms and Conditions',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-12 px-4 sm:px-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">Terms & Conditions</h1>
        <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
          Please read these terms and conditions carefully before using our services.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10 space-y-8 text-slate-600 leading-relaxed">
          
          <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
            <div className="mt-1 h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 text-slate-700">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg">
                By accessing this website, we assume you accept these terms and conditions in full. Do not continue to use our website if you do not accept all of the terms and conditions stated on this page.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">1. General</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>By placing an order with us, you automatically accept all the below-listed terms of service whether you read them or not.</li>
              <li>We reserve the right to change these terms of service without notice. You are expected to read all terms of service before placing any order to ensure you are up to date with any changes or any future changes.</li>
              <li>You will only use our website in a manner which follows all agreements made with social media platforms on their individual Terms of Service page.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">2. Service Delivery</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>We do not guarantee a delivery time for any services. We offer our best estimation for when the order will be delivered. This is only an estimation and we will not refund orders that are processing if you feel they are taking too long.</li>
              <li>We try hard to deliver exactly what is expected from us by our resellers. In this case, we reserve the right to change a service type if we deem it necessary to complete an order.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">3. Refund Policy</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>No refunds will be made to your payment method. After a deposit has been completed, there is no way to reverse it. You must use your balance on orders from our services.</li>
              <li>You agree that once you complete a payment, you will not file a dispute or a chargeback against us for any reason.</li>
              <li>If you file a dispute or chargeback against us after a deposit, we reserve the right to terminate all future orders, ban you from our site, and take away any followers or likes we delivered to your or your clients' accounts.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800">4. Privacy</h2>
            <p>
              Your privacy is very important to us. We will not share or sell your information to any third parties. All your personal data is heavily encrypted and stored securely.
            </p>
          </div>
          
          <p className="text-sm text-slate-400 pt-6">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>
    </div>
  );
}
