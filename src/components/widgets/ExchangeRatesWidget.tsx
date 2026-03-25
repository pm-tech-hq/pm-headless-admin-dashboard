"use client";

import React, { useEffect, useState } from "react";

interface RatesData {
  result: string;
  base_code: string;
  rates: Record<string, number>;
  time_last_update_utc: string;
}

const COMMON_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "INR", "BRL"];
const DISPLAY_CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "INR", "BRL", "SGD", "HKD"];

const CURRENCY_FLAGS: Record<string, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵", AUD: "🇦🇺",
  CAD: "🇨🇦", CHF: "🇨🇭", CNY: "🇨🇳", INR: "🇮🇳", BRL: "🇧🇷",
  SGD: "🇸🇬", HKD: "🇭🇰",
};

export default function ExchangeRatesWidget() {
  const [data, setData] = useState<RatesData | null>(null);
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [inputBase, setInputBase] = useState("USD");
  const [amount, setAmount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = async (base: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: RatesData = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch rates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates(baseCurrency);
  }, [baseCurrency]);

  const handleBaseChange = () => {
    const upper = inputBase.toUpperCase().trim();
    if (upper.length >= 2 && upper.length <= 4) {
      setBaseCurrency(upper);
    }
  };

  const formatAmount = (rate: number): string => {
    const converted = rate * amount;
    if (converted >= 1000) return converted.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (converted >= 1) return converted.toFixed(4);
    return converted.toFixed(6);
  };

  const formatLastUpdated = (utc: string): string => {
    try {
      return new Date(utc).toLocaleString(undefined, {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return utc;
    }
  };

  const displayCurrencies = DISPLAY_CURRENCIES.filter((c) => c !== baseCurrency);

  return (
    <div className="flex flex-col gap-2 p-3 h-full">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] text-neutral-500 font-medium">Amount</label>
          <input
            type="number"
            value={amount}
            min={0}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 1)}
            className="w-20 border border-neutral-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] text-neutral-500 font-medium">Base currency</label>
          <div className="flex gap-1">
            <input
              type="text"
              value={inputBase}
              onChange={(e) => setInputBase(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleBaseChange()}
              maxLength={4}
              placeholder="USD"
              className="w-16 border border-neutral-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-black uppercase"
            />
            <select
              value={inputBase}
              onChange={(e) => {
                setInputBase(e.target.value);
                setBaseCurrency(e.target.value);
              }}
              className="border border-neutral-200 rounded-lg px-1 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-black bg-white"
            >
              {COMMON_CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={handleBaseChange}
              className="px-2 py-1 bg-neutral-900 text-white rounded-lg text-[10px] font-medium hover:bg-neutral-700 transition-colors"
            >
              Go
            </button>
          </div>
        </div>
      </div>

      {/* Last updated */}
      {data && (
        <p className="text-[10px] text-neutral-400">
          Updated: {formatLastUpdated(data.time_last_update_utc)}
        </p>
      )}

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-neutral-400 animate-pulse">Loading exchange rates...</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {!loading && !error && data && (
        <div className="grid grid-cols-3 gap-1 flex-1 overflow-auto content-start">
          {displayCurrencies.map((code) => {
            const rate = data.rates[code];
            if (!rate) return null;
            return (
              <div
                key={code}
                className="bg-neutral-50 border border-neutral-100 rounded-xl p-2 hover:border-neutral-300 transition-colors"
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-sm">{CURRENCY_FLAGS[code] ?? "💱"}</span>
                  <span className="text-[10px] font-semibold text-neutral-700">{code}</span>
                </div>
                <p className="text-[11px] font-mono text-neutral-800 font-medium truncate">
                  {formatAmount(rate)}
                </p>
                <p className="text-[9px] text-neutral-400">
                  1 {baseCurrency} = {rate.toFixed(4)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
