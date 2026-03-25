"use client";

import React, { useEffect, useState } from "react";

interface FactData {
  id: string;
  text: string;
  source: string;
  source_url: string;
  permalink: string;
}

export default function FactWidget() {
  const [fact, setFact] = useState<FactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFact = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://uselessfacts.jsph.pl/api/v2/facts/random?language=en");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: FactData = await res.json();
      setFact(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch fact");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFact();
  }, []);

  return (
    <div className="flex flex-col gap-3 p-3 h-full">
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-neutral-400 animate-pulse">Loading fact...</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {!loading && !error && fact && (
        <div className="flex flex-col gap-2 flex-1">
          {/* Icon + label */}
          <div className="flex items-center gap-1.5">
            <span className="text-lg">💡</span>
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">
              Useless Fact
            </span>
          </div>

          {/* Fact text */}
          <div className="flex-1 bg-yellow-50 border border-yellow-100 rounded-xl p-3">
            <p className="text-[12px] text-neutral-800 leading-relaxed">{fact.text}</p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            {fact.source_url ? (
              <a
                href={fact.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-blue-500 hover:text-blue-700 transition-colors underline truncate max-w-[60%]"
              >
                {fact.source || "Source"}
              </a>
            ) : (
              <span className="text-[10px] text-neutral-400">{fact.source}</span>
            )}
            <button
              onClick={fetchFact}
              className="text-[10px] px-2.5 py-1 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-100 transition-all font-medium"
            >
              Another fact 💡
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
