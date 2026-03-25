"use client";

import React, { useEffect, useState } from "react";

interface AdviceData {
  slip: { id: number; advice: string };
}

export default function AdviceWidget() {
  const [data, setData] = useState<AdviceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdvice = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://api.adviceslip.com/advice", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: AdviceData = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch advice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, []);

  return (
    <div className="flex flex-col gap-3 p-3 h-full justify-between">
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-neutral-400 animate-pulse">Loading advice...</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {!loading && !error && data && (
        <>
          <div className="flex-1 flex flex-col justify-center">
            <span className="text-5xl leading-none text-neutral-200 font-serif select-none">
              &ldquo;
            </span>
            <p className="text-sm font-medium text-neutral-800 leading-relaxed -mt-2 px-1">
              {data.slip.advice}
            </p>
            <span className="text-5xl leading-none text-neutral-200 font-serif self-end select-none -mt-2">
              &rdquo;
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400 font-mono">
              Advice #{data.slip.id}
            </span>
            <button
              onClick={fetchAdvice}
              className="text-[10px] px-2.5 py-1 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-100 transition-all font-medium"
            >
              New advice ✨
            </button>
          </div>
        </>
      )}
    </div>
  );
}
