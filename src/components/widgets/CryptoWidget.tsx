"use client";

import React, { useEffect, useState } from "react";

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  ath: number;
  atl: number;
}

type Currency = "usd" | "eur" | "gbp" | "btc";

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  usd: "$",
  eur: "€",
  gbp: "£",
  btc: "₿",
};

function formatMarketCap(n: number, currency: Currency): string {
  if (currency === "btc") {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(2) + "K";
    return n.toFixed(4);
  }
  if (n >= 1_000_000_000_000) return (n / 1_000_000_000_000).toFixed(2) + "T";
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  return n.toLocaleString();
}

function formatPrice(price: number, currency: Currency): string {
  const sym = CURRENCY_SYMBOLS[currency];
  if (currency === "btc") return `${sym}${price.toFixed(6)}`;
  if (price < 0.01) return `${sym}${price.toFixed(6)}`;
  if (price < 1) return `${sym}${price.toFixed(4)}`;
  if (price < 1000) return `${sym}${price.toFixed(2)}`;
  return `${sym}${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function CryptoWidget() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [currency, setCurrency] = useState<Currency>("usd");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoins = async (cur: Currency) => {
    setLoading(true);
    setError(null);
    try {
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${cur}&order=market_cap_desc&per_page=10&page=1&sparkline=false`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setCoins(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch crypto data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoins(currency);
  }, [currency]);

  return (
    <div className="flex flex-col gap-2 p-3 h-full">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">
          Top 10 Cryptocurrencies
        </p>
        <div className="flex items-center gap-1">
          <div className="flex gap-0.5 bg-neutral-100 rounded-lg p-0.5">
            {(["usd", "eur", "gbp", "btc"] as Currency[]).map((cur) => (
              <button
                key={cur}
                onClick={() => setCurrency(cur)}
                className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-all ${
                  currency === cur
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {cur.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={() => fetchCoins(currency)}
            className="text-[10px] px-2 py-1 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-100 transition-all"
            title="Refresh"
          >
            ↻
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-neutral-400 animate-pulse">Loading crypto data...</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {!loading && !error && coins.length > 0 && (
        <div className="overflow-auto flex-1">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] text-neutral-400 uppercase tracking-wider border-b border-neutral-100">
                <th className="text-left pb-1.5 font-medium">#</th>
                <th className="text-left pb-1.5 font-medium">Coin</th>
                <th className="text-right pb-1.5 font-medium">Price</th>
                <th className="text-right pb-1.5 font-medium">24h</th>
                <th className="text-right pb-1.5 font-medium hidden sm:table-cell">Mkt Cap</th>
              </tr>
            </thead>
            <tbody>
              {coins.map((coin) => {
                const change = coin.price_change_percentage_24h;
                const isPos = change >= 0;
                return (
                  <tr key={coin.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                    <td className="py-1.5 text-neutral-400 pr-2">{coin.market_cap_rank}</td>
                    <td className="py-1.5">
                      <div className="flex items-center gap-1.5">
                        <img src={coin.image} alt={coin.name} className="w-4 h-4 rounded-full flex-shrink-0" />
                        <span className="font-medium text-neutral-800 truncate max-w-[80px]">{coin.name}</span>
                        <span className="text-neutral-400 uppercase text-[9px]">{coin.symbol}</span>
                      </div>
                    </td>
                    <td className="py-1.5 text-right font-mono text-neutral-700">
                      {formatPrice(coin.current_price, currency)}
                    </td>
                    <td className="py-1.5 text-right">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          isPos
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {isPos ? "+" : ""}{change?.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-1.5 text-right text-neutral-500 hidden sm:table-cell">
                      {formatMarketCap(coin.market_cap, currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
