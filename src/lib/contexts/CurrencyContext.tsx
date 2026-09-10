"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type CurrencyType = 'USD' | 'BDT';

interface CurrencyContextType {
  currency: CurrencyType;
  rate: number;
  activeCurrencies: CurrencyType[];
  toggleCurrency: () => void;
  formatPrice: (usdAmount: number | string) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'USD',
  rate: 120,
  activeCurrencies: ['USD', 'BDT'],
  toggleCurrency: () => {},
  formatPrice: () => '',
});

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const [currency, setCurrency] = useState<CurrencyType>('USD');
  const [rate, setRate] = useState(120); // 1 USD = X BDT
  const [activeCurrencies, setActiveCurrencies] = useState<CurrencyType[]>(['USD', 'BDT']);

  useEffect(() => {
    // Load USD→BDT rate and active currencies from settings first
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data?.usdToBdtRate && data.usdToBdtRate > 0) {
          setRate(data.usdToBdtRate);
        }
        if (data?.activeCurrencies && Array.isArray(data.activeCurrencies) && data.activeCurrencies.length > 0) {
          const active: CurrencyType[] = data.activeCurrencies;
          setActiveCurrencies(active);

          // If only one currency is active, always use that one
          if (active.length === 1) {
            setCurrency(active[0]);
            localStorage.setItem('smm_currency', active[0]);
          } else {
            // Multiple active: respect saved preference if valid
            const savedCurrency = localStorage.getItem('smm_currency') as CurrencyType;
            if (savedCurrency && active.includes(savedCurrency)) {
              setCurrency(savedCurrency);
            } else {
              // Default to first active currency
              setCurrency(active[0]);
              localStorage.setItem('smm_currency', active[0]);
            }
          }
        } else {
          // No settings yet: respect saved preference
          const savedCurrency = localStorage.getItem('smm_currency') as CurrencyType;
          if (savedCurrency && (savedCurrency === 'USD' || savedCurrency === 'BDT')) {
            setCurrency(savedCurrency);
          }
        }
      })
      .catch(() => {
        // On error, respect saved preference
        const savedCurrency = localStorage.getItem('smm_currency') as CurrencyType;
        if (savedCurrency && (savedCurrency === 'USD' || savedCurrency === 'BDT')) {
          setCurrency(savedCurrency);
        }
      });
  }, []);

  const toggleCurrency = () => {
    if (activeCurrencies.length <= 1) return; // Cannot toggle if only 1 active

    let newCurrency: CurrencyType = 'USD';
    if (activeCurrencies.includes('USD') && activeCurrencies.includes('BDT')) {
      newCurrency = currency === 'USD' ? 'BDT' : 'USD';
    } else if (activeCurrencies.length > 0) {
       newCurrency = activeCurrencies[0]; // fallback
    }

    setCurrency(newCurrency);
    localStorage.setItem('smm_currency', newCurrency);
  };

  const formatPrice = (usdAmount: number | string) => {
    const amount = typeof usdAmount === 'string' ? parseFloat(usdAmount) : usdAmount;
    if (isNaN(amount)) return currency === 'USD' ? '$0.00' : 'BDT 0.00';

    if (currency === 'USD') {
      return `$${amount.toFixed(4)}`;
    } else {
      return `BDT ${(amount * rate).toFixed(2)}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, rate, activeCurrencies, toggleCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};
