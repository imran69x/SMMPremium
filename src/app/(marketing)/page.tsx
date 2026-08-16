"use client";

import React, { useEffect } from 'react';
import { Zap, ArrowUpRight, Star, Shield, Smartphone, Headphones, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B00]"></div></div>;
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-hidden font-sans">
      
      {/* Navbar */}
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

      {/* Hero Section */}
      <main className="pt-28 pb-20 lg:pt-36 lg:pb-32 relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          
          {/* Left Content */}
          <div className="w-full lg:w-1/2 flex flex-col items-start text-left gap-6">
            
            {/* Rating Badge */}
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-full px-4 py-2 w-fit">
              <div className="flex gap-1 text-[#FFB800]">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">Excellent 4.7/5</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="font-bold text-sm text-gradient-primary">Trusted by 87,476+ Users</span>
              </div>
            </div>

            {/* Headers */}
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
                <span className="text-gradient-primary block pb-2">Best SMM Panel</span>
                Grow Faster, Pay Less
              </h1>
              <p className="text-base md:text-lg text-slate-600 max-w-xl font-medium leading-relaxed pt-2">
                SMMPremium is Bangladesh's leading SMM panel where you can buy real social media services for Facebook, Instagram, YouTube, TikTok, and more. We make social media growth simple, fast, and affordable.
              </p>
            </div>

            {/* Checkmarks */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
              <div className="flex items-center gap-2">
                <div className="bg-orange-100 rounded-full p-1 text-[#FF6B00]"><CheckCircle2 className="w-4 h-4" /></div>
                <span className="text-sm font-bold text-slate-800">Instant Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-orange-100 rounded-full p-1 text-[#FF6B00]"><CheckCircle2 className="w-4 h-4" /></div>
                <span className="text-sm font-bold text-slate-800">Pay With bKash & Nagad</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-orange-100 rounded-full p-1 text-[#FF6B00]"><CheckCircle2 className="w-4 h-4" /></div>
                <span className="text-sm font-bold text-slate-800">100% Safe & Secure</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link href="/login" className="group inline-flex items-center justify-center rounded-xl bg-gradient-primary text-white hover:shadow-lg hover:shadow-orange-300/50 px-8 py-4 font-semibold transition-all">
                Get Started Free
                <ArrowUpRight className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>
              <Link href="/services" className="group inline-flex items-center justify-center rounded-xl border-2 border-slate-200 text-slate-700 hover:border-[#FF6B00] hover:text-[#FF6B00] px-8 py-4 font-semibold transition-all">
                See All Services
                <ArrowUpRight className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>
            </div>

          </div>

          {/* Right Content / Hero Graphic Placeholder */}
          <div className="w-full lg:w-1/2 relative min-h-[400px] flex items-center justify-center">
             {/* Decorative Background for Hero Image */}
             <div className="absolute inset-0 bg-gradient-to-tr from-orange-100 to-orange-50 rounded-full blur-3xl opacity-60"></div>
             
             {/* Main Graphic Representation */}
             <div className="relative z-10 w-full max-w-md bg-white border border-slate-100 shadow-2xl rounded-3xl p-6 flex flex-col gap-4 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">f</div>
                     <div>
                       <div className="font-bold text-slate-800 text-sm">Facebook Followers</div>
                       <div className="text-xs text-slate-500">Processing...</div>
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="font-black text-[#FF6B00]">+5,000</div>
                     <div className="text-xs text-slate-500">Complete</div>
                   </div>
                </div>

                <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold">ig</div>
                     <div>
                       <div className="font-bold text-slate-800 text-sm">Instagram Likes</div>
                       <div className="text-xs text-slate-500">Pending...</div>
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="font-black text-[#FF6B00]">+10,000</div>
                     <div className="text-xs text-slate-500">In queue</div>
                   </div>
                </div>

                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">yt</div>
                     <div>
                       <div className="font-bold text-slate-800 text-sm">YouTube Views</div>
                       <div className="text-xs text-slate-500">Completed</div>
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="font-black text-slate-800">+50,000</div>
                     <div className="text-xs text-slate-500">Done</div>
                   </div>
                </div>
             </div>

             {/* Floating Badge */}
             <div className="absolute -bottom-6 -left-6 bg-white border border-slate-100 shadow-xl rounded-2xl p-4 flex items-center gap-3 animate-bounce">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600"><CheckCircle2 className="w-6 h-6" /></div>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</div>
                  <div className="font-black text-slate-800">All Systems Operational</div>
                </div>
             </div>
          </div>

        </div>
      </main>

      {/* Partners Marquee Section */}
      <section className="py-10 border-t border-slate-100 bg-slate-50 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 text-center mb-8">
           <div className="inline-flex rounded-full p-[1px] bg-gradient-to-r from-[#D87F16] via-[#FF6B00] to-[#82330C]">
             <div className="bg-orange-50 rounded-full px-6 py-2">
               <span className="text-sm font-bold text-gradient-primary">Trusted Partners</span>
             </div>
           </div>
        </div>

        {/* Marquee Track */}
        <div className="flex w-max items-center animate-[marquee_20s_linear_infinite] px-4 space-x-8">
           {/* Dummy text for partners since we don't have images */}
           {[1,2,3,4,5,6].map((i) => (
             <React.Fragment key={i}>
               <div className="text-2xl font-black text-slate-800">UPWORK</div>
               <div className="text-2xl font-black text-slate-800">FREELANCER</div>
               <div className="text-2xl font-black text-slate-800">FIVERR</div>
               <div className="text-2xl font-black text-slate-800">HUBSTAFF</div>
             </React.Fragment>
           ))}
        </div>
        
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
        `}} />
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Why Choose SMMPremium?</h2>
            <p className="text-slate-600 font-medium">We provide the highest quality SMM services in Bangladesh at the cheapest rates with local payment methods.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-orange-200 transition-colors">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#FF6B00] mb-6">
                <Smartphone className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Local Payments</h3>
              <p className="text-slate-600 leading-relaxed">Pay easily using bKash, Nagad, and Rocket. Your deposits are processed automatically and instantly converted to USD.</p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-orange-200 transition-colors">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#FF6B00] mb-6">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">High Quality & Safe</h3>
              <p className="text-slate-600 leading-relaxed">Our services are designed to be 100% safe for your social media accounts. We provide non-drop services with refill guarantees.</p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-orange-200 transition-colors">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#FF6B00] mb-6">
                <Headphones className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">24/7 Support</h3>
              <p className="text-slate-600 leading-relaxed">Need help? Our customer support team is available around the clock via tickets or WhatsApp to assist you with any issues.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
