"use client";

import React, { useEffect, useState } from "react";

interface Joke {
  type: string;
  setup: string;
  punchline: string;
  id: number;
}

export default function JokeWidget() {
  const [joke, setJoke] = useState<Joke | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJoke = async () => {
    setLoading(true);
    setError(null);
    setRevealed(false);
    try {
      const res = await fetch("https://official-joke-api.appspot.com/random_joke");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: Joke = await res.json();
      setJoke(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch joke");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJoke();
  }, []);

  const typeColors: Record<string, string> = {
    general: "bg-amber-100 text-amber-700",
    programming: "bg-blue-100 text-blue-700",
    knock_knock: "bg-purple-100 text-purple-700",
    dark: "bg-neutral-200 text-neutral-700",
  };

  const typeColor = joke ? (typeColors[joke.type] ?? "bg-neutral-100 text-neutral-600") : "";

  return (
    <div className="flex flex-col gap-3 p-3 h-full">
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-neutral-400 animate-pulse">Loading joke...</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {!loading && !error && joke && (
        <div className="flex flex-col gap-3 flex-1">
          {/* Category badge */}
          <div className="flex items-center justify-between">
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium capitalize ${typeColor}`}>
              {joke.type.replace("_", " ")}
            </span>
            <span className="text-[10px] text-neutral-400">#{joke.id}</span>
          </div>

          {/* Card */}
          <div className="flex-1 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-3 flex flex-col gap-2">
            <p className="text-[12px] font-medium text-neutral-800 leading-relaxed">
              {joke.setup}
            </p>

            {!revealed ? (
              <button
                onClick={() => setRevealed(true)}
                className="mt-auto self-start text-[11px] px-3 py-1.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
              >
                Reveal punchline 😄
              </button>
            ) : (
              <div className="mt-1 bg-white border border-amber-200 rounded-lg px-3 py-2">
                <p className="text-[12px] text-amber-800 font-medium leading-relaxed">
                  {joke.punchline}
                </p>
              </div>
            )}
          </div>

          {/* New joke button */}
          <button
            onClick={fetchJoke}
            className="text-[11px] px-3 py-1.5 border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50 transition-colors font-medium self-start"
          >
            🎲 New joke
          </button>
        </div>
      )}
    </div>
  );
}
