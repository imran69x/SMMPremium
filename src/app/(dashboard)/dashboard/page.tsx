"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ShoppingCart, HelpCircle, AlertCircle, Music, Send, Globe, Gamepad2, Search, X, CreditCard } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useCurrency } from '@/lib/contexts/CurrencyContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GlowingButton from '@/components/ui/GlowingButton';
import TruckButton from '@/components/ui/TruckButton';
import PixelButton from '@/components/ui/PixelButton';

const YoutubeIcon = (props: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
const FacebookIcon = (props: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
const InstagramIcon = (props: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>;
const TwitterIcon = (props: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
const LinkedinIcon = (props: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
const TwitchIcon = (props: any) => <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.225 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>;
const TiktokIcon = (props: any) => <img src="https://storage.perfectcdn.com/kf2yrn/sdttzqr7sedm00kg.png" alt="TikTok" className={props.className} style={{ objectFit: 'contain' }} />;

export default function NewOrder() {
  const { user, userData, loading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();
  const router = useRouter();

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState('');
  
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  const platforms = [
    { id: 'youtube', name: 'YouTube', icon: YoutubeIcon, color: 'text-[#FF0000]' },
    { id: 'facebook', name: 'Facebook', icon: FacebookIcon, color: 'text-[#1877F2]' },
    { id: 'instagram', name: 'Instagram', icon: InstagramIcon, color: 'text-[#E4405F]' },
    { id: 'tiktok', name: 'TikTok', icon: TiktokIcon, color: 'text-black' },
    { id: 'telegram', name: 'Telegram', icon: Send, color: 'text-[#229ED9]' },
    { id: 'twitter', name: 'Twitter (X)', icon: TwitterIcon, color: 'text-black' },
    { id: 'linkedin', name: 'LinkedIn', icon: LinkedinIcon, color: 'text-[#0A66C2]' },
    { id: 'discord', name: 'Discord', icon: Gamepad2, color: 'text-[#5865F2]' },
    { id: 'spotify', name: 'Spotify', icon: Music, color: 'text-[#1DB954]' },
    { id: 'twitch', name: 'Twitch', icon: TwitchIcon, color: 'text-[#9146FF]' },
    { id: 'soundcloud', name: 'SoundCloud', icon: Globe, color: 'text-[#FF5500]' },
    { id: 'web traffic', name: 'Web Traffic', icon: Globe, color: 'text-slate-500' },
  ];

  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await fetch('/api/services');
        const data = await res.json();
        
        if (Array.isArray(data)) {
          setServices(data);
          
          if (data.length > 0) {
            const initialCategory = data[0].category;
            setSelectedCategory(initialCategory);
            
            const categoryServices = data.filter(s => s.category === initialCategory);
            if (categoryServices.length > 0) {
              setSelectedService(categoryServices[0].service);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch services", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchServices();
  }, []);

  const categories = useMemo(() => {
    let cats = Array.from(new Set(services.map(s => s.category)));
    
    if (selectedPlatform) {
      const platformSearch = selectedPlatform.toLowerCase().replace(' (x)', '');
      cats = cats.filter(cat => cat.toLowerCase().includes(platformSearch));
    }
    
    return cats;
  }, [services, selectedPlatform]);

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(selectedCategory)) {
      setSelectedCategory(categories[0]);
    } else if (categories.length === 0) {
      setSelectedCategory('');
    }
  }, [categories, selectedCategory]);

  const filteredServices = useMemo(() => {
    return services.filter(s => s.category === selectedCategory);
  }, [services, selectedCategory]);

  // Search across ALL services
  const searchedServices = useMemo(() => {
    if (!serviceSearch.trim()) return [];
    const q = serviceSearch.toLowerCase();
    return services.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q) ||
      s.service?.toString().includes(q)
    ).slice(0, 20);
  }, [services, serviceSearch]);

  useEffect(() => {
    if (filteredServices.length > 0) {
      const serviceExists = filteredServices.find(s => s.service === selectedService);
      if (!serviceExists) {
        setSelectedService(filteredServices[0].service);
      }
    } else {
      setSelectedService('');
    }
  }, [filteredServices, selectedService]);

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentServiceDetails = useMemo(() => {
    return services.find(s => s.service.toString() === selectedService.toString());
  }, [services, selectedService]);

  const totalCharge = useMemo(() => {
    if (!currentServiceDetails || !quantity) return 0;
    const rate = parseFloat(currentServiceDetails.rate);
    const q = parseInt(quantity);
    if (isNaN(q) || isNaN(rate)) return 0;
    return (rate / 1000) * q;
  }, [currentServiceDetails, quantity]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError('');
    setOrderSuccess('');

    if (!user || !userData) {
      setOrderError('You must be logged in to place an order.');
      return;
    }

    if (!currentServiceDetails) return;
    
    const min = parseInt(currentServiceDetails.min);
    const max = parseInt(currentServiceDetails.max);
    const q = parseInt(quantity);
    
    if (q < min || q > max) {
      setOrderError(`Quantity must be between ${min} and ${max}`);
      return;
    }

    if (userData.balance < totalCharge) {
      setOrderError('Insufficient balance. Please add funds to your account.');
      return;
    }

    setPlacingOrder(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          serviceId: selectedService,
          link,
          quantity: q,
          charge: totalCharge
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      setOrderSuccess(`Order placed successfully! ID: ${data.orderId}. New Balance: ${formatPrice(data.newBalance)}`);
      setLink('');
      setQuantity('');
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (err: any) {
      setOrderError(err.message);
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center py-20"><div className="animate-spin h-8 w-8 border-b-2 border-[#FF6B00] rounded-full"></div></div>;
  }

  return (
    <div className="space-y-6">


      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white border border-slate-100 rounded-xl p-3 md:p-5 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 md:gap-4 shadow-sm">
          <div className="h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-full bg-purple-50 flex items-center justify-center text-xl md:text-2xl border border-purple-100">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="Avatar" className="h-full w-full object-cover rounded-full" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">User Name</p>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl font-extrabold text-slate-800 truncate w-full">{userData?.name || 'User'}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-3 md:p-5 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 md:gap-4 shadow-sm">
          <div className="h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-full bg-blue-50 flex items-center justify-center text-xl md:text-2xl border border-blue-100">
            🛒
          </div>
          <div className="min-w-0">
            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">Panel Order</p>
            <p className="text-sm sm:text-base md:text-lg lg:text-2xl font-extrabold text-slate-800 truncate w-full">4381938</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-3 md:p-5 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 md:gap-4 shadow-sm">
          <div className="h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-full bg-orange-50 flex items-center justify-center text-xl md:text-2xl border border-orange-100">
            📱
          </div>
          <div className="min-w-0">
            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">All Services</p>
            <p className="text-sm sm:text-base md:text-lg lg:text-2xl font-extrabold text-slate-800 truncate w-full">{services.length || 0}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-3 md:p-5 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 md:gap-4 shadow-sm">
          <div className="h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-full bg-blue-50 flex items-center justify-center text-xl md:text-2xl border border-blue-100">
            💰
          </div>
          <div className="min-w-0">
            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">My Balance</p>
            <p className="text-sm sm:text-base md:text-lg lg:text-2xl font-extrabold text-[#FF6B00] truncate w-full">{formatPrice(userData?.balance || 0)}</p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="flex flex-wrap justify-center sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
        {platforms.map((platform) => {
          const isSelected = selectedPlatform === platform.name;
          return (
            <button
              key={platform.id}
              onClick={() => setSelectedPlatform(isSelected ? null : platform.name)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 w-[48px] h-[48px] sm:w-auto sm:h-auto sm:px-3 sm:py-3 rounded-xl border transition-all text-xs sm:text-sm font-bold shrink-0 ${
                isSelected 
                  ? 'bg-orange-50 border-orange-200 shadow-sm shadow-orange-100' 
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <platform.icon className={`h-6 w-6 sm:h-5 sm:w-5 ${isSelected ? 'text-[#FF6B00]' : platform.color}`} />
              <span className={`hidden sm:inline truncate ${isSelected ? 'text-[#FF6B00]' : 'text-slate-700'}`}>{platform.name}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Action Buttons (visible only on mobile) */}
      <div className="sm:hidden bg-[#D85700] p-3 rounded-xl flex items-center gap-3">
        <button 
          onClick={() => { document.getElementById('new-order-form')?.scrollIntoView({ behavior: 'smooth' }); }}
          className="flex-1 bg-white text-[#D85700] font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm shadow-sm"
        >
          <ShoppingCart className="h-4 w-4" /> New Order
        </button>
        <Link 
          href="/add-funds"
          className="flex-1 bg-[#6DAE43] text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm shadow-sm hover:bg-[#5C9438] transition"
        >
          <CreditCard className="h-4 w-4" /> Add Funds
        </Link>
      </div>
      
      <div id="new-order-form" className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">
        <div className="lg:col-span-2">
          <div className="premium-card p-4 sm:p-6 md:p-8">
            
            {orderError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm flex items-center gap-2 border border-red-100 font-medium">
                <AlertCircle className="h-5 w-5" /> {orderError}
              </div>
            )}

            {orderSuccess && (
              <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6 text-sm flex items-center gap-2 border border-green-100 font-medium">
                <AlertCircle className="h-5 w-5" /> {orderSuccess}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleOrder}>
              {/* Service Search */}
              <div ref={searchRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={serviceSearch}
                    onChange={e => {
                      setServiceSearch(e.target.value);
                      setSearchDropdownOpen(true);
                    }}
                    onFocus={() => serviceSearch && setSearchDropdownOpen(true)}
                    className="premium-input !pl-10 pr-10 text-sm"
                  />
                  {serviceSearch && (
                    <button
                      type="button"
                      onClick={() => { setServiceSearch(''); setSearchDropdownOpen(false); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {/* Dropdown results */}
                {searchDropdownOpen && searchedServices.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
                    {searchedServices.map(s => (
                      <button
                        key={s.service}
                        type="button"
                        onClick={() => {
                          setSelectedService(s.service.toString());
                          setSelectedCategory(s.category);
                          setServiceSearch(s.name);
                          setSearchDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-orange-50 transition border-b border-slate-50 last:border-0"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="inline-block bg-[#FF6B00] text-white text-xs font-black px-1.5 py-0.5 rounded mr-2">{s.service}</span>
                            <span className="text-sm font-bold text-slate-800 truncate">{s.name}</span>
                          </div>
                          <span className="text-xs font-black text-[#FF6B00] whitespace-nowrap">{formatPrice(s.rate)}/1k</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 ml-0 truncate">{s.category}</p>
                      </button>
                    ))}
                  </div>
                )}
                {searchDropdownOpen && serviceSearch && searchedServices.length === 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-center text-sm text-slate-500">
                    No services found for "{serviceSearch}"
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                <div className="relative">
                  <select 
                    value={selectedCategory} 
                    onChange={handleCategoryChange}
                    className="premium-input appearance-none font-medium"
                    disabled={categories.length === 0}
                  >
                    {categories.length > 0 ? (
                      categories.map((cat: any) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))
                    ) : (
                      <option value="">No categories found for this platform</option>
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Service</label>
                <div className="relative">
                  <select 
                    value={selectedService} 
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="premium-input appearance-none font-medium text-sm"
                    disabled={filteredServices.length === 0}
                  >
                    {filteredServices.length > 0 ? (
                      filteredServices.map(s => (
                        <option key={s.service} value={s.service}>
                          {s.service} - {s.name} - {formatPrice(s.rate)} / 1000
                        </option>
                      ))
                    ) : (
                      <option value="">No services found</option>
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Link</label>
                <input 
                  type="text" 
                  required
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://instagram.com/yourprofile" 
                  className="premium-input" 
                />
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  <HelpCircle className="h-3 w-3" /> Make sure the account is public.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Quantity</label>
                  <input 
                    type="number" 
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="1000" 
                    className="premium-input font-bold" 
                  />
                  {currentServiceDetails && (
                    <p className="text-xs text-slate-500 mt-2">Min: {currentServiceDetails.min} | Max: {currentServiceDetails.max}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Average Time</label>
                  <div className="premium-input bg-slate-100 text-slate-600 font-medium cursor-not-allowed">
                    Instant
                  </div>
                </div>
              </div>
              
              <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Charge</p>
                  <div className="text-3xl font-extrabold text-gradient-primary">
                    {formatPrice(totalCharge)}
                  </div>
                </div>
                <TruckButton 
                  type="submit" 
                  disabled={placingOrder || !currentServiceDetails || !link.trim() || !quantity}
                  isProcessing={placingOrder}
                  className="w-full sm:w-auto min-w-[200px]"
                />
              </div>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          <div className="premium-card p-6 bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              Service Description
            </h3>
            {currentServiceDetails ? (
              <div className="space-y-3">
                {/* Service stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-xl p-3 text-center border border-orange-100">
                    <p className="text-xs text-slate-400 font-bold uppercase">Rate/1K</p>
                    <p className="font-black text-[#FF6B00]">{formatPrice(parseFloat(currentServiceDetails.rate) * 1000)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center border border-orange-100">
                    <p className="text-xs text-slate-400 font-bold uppercase">Category</p>
                    <p className="font-black text-slate-700 text-xs truncate">{currentServiceDetails.category}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center border border-orange-100">
                    <p className="text-xs text-slate-400 font-bold uppercase">Min</p>
                    <p className="font-black text-slate-700">{currentServiceDetails.min}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center border border-orange-100">
                    <p className="text-xs text-slate-400 font-bold uppercase">Max</p>
                    <p className="font-black text-slate-700">{parseInt(currentServiceDetails.max).toLocaleString()}</p>
                  </div>
                </div>
                {/* Description from API */}
                {currentServiceDetails.desc && currentServiceDetails.desc.trim() ? (
                  <div className="prose prose-sm text-slate-700 whitespace-pre-line bg-white rounded-xl p-4 border border-orange-100 text-sm leading-relaxed">
                    {currentServiceDetails.desc}
                  </div>
                ) : (
                  <div className="space-y-2 text-sm text-slate-700">
                    <p>📌 <strong>Quality:</strong> Premium Real Looking Accounts</p>
                    <p>⏱️ <strong>Start Time:</strong> Instant - 5 Minutes</p>
                    <p>🚀 <strong>Speed:</strong> 10K - 20K / Day</p>
                    <p>♻️ <strong>Guarantee:</strong> 30 Days Auto Refill</p>
                    <p>💧 <strong>Drop Ratio:</strong> Non-Drop (0-5%)</p>
                  </div>
                )}
                <div className="p-4 bg-white rounded-xl border border-orange-200 text-xs text-slate-600">
                  <span className="font-bold text-red-500 mb-1 block">Warning:</span>
                  Do not put multiple orders for the same link at the same time.
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-sm font-medium">Select a service to see details.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
