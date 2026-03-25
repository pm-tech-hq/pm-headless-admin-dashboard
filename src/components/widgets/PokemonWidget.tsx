"use client";

import React, { useEffect, useState } from "react";

interface PokemonEntry {
  name: string;
  url: string;
}

interface PokemonResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonEntry[];
}

const PAGE_SIZE = 20;

function extractId(url: string): number {
  const match = url.match(/\/pokemon\/(\d+)\//);
  return match ? parseInt(match[1], 10) : 0;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function PokemonWidget() {
  const [offset, setOffset] = useState(0);
  const [pokemon, setPokemon] = useState<PokemonEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPokemon = async (newOffset: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://pokeapi.co/api/v2/pokemon?limit=${PAGE_SIZE}&offset=${newOffset}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: PokemonResponse = await res.json();
      setPokemon(json.results);
      setTotal(json.count);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch Pokémon");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPokemon(offset);
  }, [offset]);

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex flex-col gap-2 p-3 h-full">
      {/* Pagination controls */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">
          Pokédex
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            disabled={offset === 0 || loading}
            className="text-[10px] px-2 py-1 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            ‹ Prev
          </button>
          <span className="text-[10px] text-neutral-500 font-mono px-1">
            {currentPage}/{totalPages}
          </span>
          <button
            onClick={() => setOffset(offset + PAGE_SIZE)}
            disabled={offset + PAGE_SIZE >= total || loading}
            className="text-[10px] px-2 py-1 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next ›
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-neutral-400 animate-pulse">Loading Pokémon...</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-4 gap-1.5 flex-1 overflow-auto content-start">
          {pokemon.map((p) => {
            const id = extractId(p.url);
            const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
            return (
              <div
                key={p.name}
                className="group border border-neutral-100 rounded-xl p-1.5 hover:border-neutral-300 hover:shadow-sm transition-all bg-neutral-50 hover:bg-white flex flex-col items-center text-center cursor-default"
              >
                <img
                  src={spriteUrl}
                  alt={p.name}
                  className="w-10 h-10 object-contain"
                  loading="lazy"
                />
                <p className="text-[9px] text-neutral-600 font-medium truncate w-full group-hover:text-neutral-900 transition-colors leading-tight">
                  {capitalize(p.name)}
                </p>
                <p className="text-[9px] text-neutral-300 font-mono">#{id}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
