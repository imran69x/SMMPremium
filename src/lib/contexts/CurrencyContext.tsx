"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type CurrencyType = 'USD' | 'BDT';

interface CurrencyContextType {
  currency: CurrencyType;
  rate: number;
  toggleCurrency: () => void;
  formatPrice: (usdAmount: number | string) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'USD',
  rate: 120,
  toggleCurrency: () => {},
  formatPrice: () => '',
});

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const [currency, setCurrency] = useState<CurrencyType>('USD');
  const [rate, setRate] = useState(120); // 1 USD = X BDT

  useEffect(() => {
    // Load currency preference
    const savedCurrency = localStorage.getItem('smm_currency') as CurrencyType;
    if (savedCurrency && (savedCurrency === 'USD' || savedCurrency === 'BDT')) {
      setCurrency(savedCurrency);
    }

    // Load USD→BDT rate from settings
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data?.usdToBdtRate && data.usdToBdtRate > 0) {
          setRate(data.usdToBdtRate);
        }
      })
      .catch(() => {});
  }, []);

  const toggleCurrency = () => {
    const newCurrency = currency === 'USD' ? 'BDT' : 'USD';
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
    <CurrencyContext.Provider value={{ currency, rate, toggleCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};
