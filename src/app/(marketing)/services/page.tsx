import React from 'react';
import { Search, Filter, Zap } from 'lucide-react';
import Link from 'next/link';

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Our <span className="text-blue-500">Services</span></h1>
          <p className="text-slate-400 max-w-2xl mx-auto">Browse our complete catalog of high-quality SMM services. Prices are per 1000 quantity.</p>
        </div>

        {/* Filters and Search */}
        <div className="glass-card p-4 rounded-xl mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
            <input type="text" placeholder="Search services (e.g., Instagram Followers)..." className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div className="flex gap-4">
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
              <select className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 appearance-none">
                <option value="all">All Categories</option>
                <option value="fb">Facebook Services</option>
                <option value="ig">Instagram Services</option>
                <option value="yt">YouTube Services</option>
              </select>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-300 uppercase bg-slate-800/80">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Service Name</th>
                  <th className="px-6 py-4">Rate per 1000</th>
                  <th className="px-6 py-4">Min / Max</th>
                  <th className="px-6 py-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                
                {/* Category Header */}
                <tr className="bg-slate-800/30">
                  <td colSpan={5} className="px-6 py-3 font-bold text-blue-400 flex items-center gap-2">
                    <Zap className="h-4 w-4" /> Instagram Followers [Guaranteed]
                  </td>
                </tr>

                {/* Service Rows */}
                <tr className="hover:bg-slate-800/20 transition">
                  <td className="px-6 py-4 font-medium text-slate-300">402</td>
                  <td className="px-6 py-4">Instagram Followers (Max: 50K) [Start: Instant] [30 Days Refill]</td>
                  <td className="px-6 py-4 text-green-400 font-bold">BDT 80.00</td>
                  <td className="px-6 py-4 text-slate-400">100 / 50000</td>
                  <td className="px-6 py-4">
                    <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs transition">View details</button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/20 transition">
                  <td className="px-6 py-4 font-medium text-slate-300">405</td>
                  <td className="px-6 py-4">Instagram Followers (Max: 100K) [Start: 0-1H] [60 Days Refill]</td>
                  <td className="px-6 py-4 text-green-400 font-bold">BDT 110.00</td>
                  <td className="px-6 py-4 text-slate-400">500 / 100000</td>
                  <td className="px-6 py-4">
                    <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs transition">View details</button>
                  </td>
                </tr>

                {/* Category Header */}
                <tr className="bg-slate-800/30">
                  <td colSpan={5} className="px-6 py-3 font-bold text-blue-400 flex items-center gap-2">
                    <Zap className="h-4 w-4" /> Facebook Page Likes
                  </td>
                </tr>

                {/* Service Rows */}
                <tr className="hover:bg-slate-800/20 transition">
                  <td className="px-6 py-4 font-medium text-slate-300">512</td>
                  <td className="px-6 py-4">Facebook Page Likes + Followers [Non Drop]</td>
                  <td className="px-6 py-4 text-green-400 font-bold">BDT 150.00</td>
                  <td className="px-6 py-4 text-slate-400">100 / 10000</td>
                  <td className="px-6 py-4">
                    <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs transition">View details</button>
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/signup" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            Create Account to Order
          </Link>
        </div>
      </div>
    </div>
  );
}
