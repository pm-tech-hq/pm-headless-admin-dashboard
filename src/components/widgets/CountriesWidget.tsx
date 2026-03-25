"use client";

import React, { useEffect, useState, useMemo } from "react";

interface Country {
  name: { common: string; official: string };
  region: string;
  area: number;
  population: number;
}

const REGIONS = ["All", "Africa", "Americas", "Asia", "Europe", "Oceania", "Antarctic"];

function formatPopulation(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function formatArea(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M km²";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K km²";
  return n.toFixed(0) + " km²";
}

export default function CountriesWidget() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,region,area,population"
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: Country[] = await res.json();
        setCountries(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch countries");
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
  }, []);

  const filtered = useMemo(() => {
    return countries
      .filter((c) => {
        const matchesRegion = region === "All" || c.region === region;
        const matchesSearch =
          !search ||
          c.name.common.toLowerCase().includes(search.toLowerCase()) ||
          c.name.official.toLowerCase().includes(search.toLowerCase());
        return matchesRegion && matchesSearch;
      })
      .sort((a, b) => b.population - a.population)
      .slice(0, 15);
  }, [countries, search, region]);

  const totalCount = useMemo(() => {
    return countries.filter((c) => {
      const matchesRegion = region === "All" || c.region === region;
      const matchesSearch =
        !search ||
        c.name.common.toLowerCase().includes(search.toLowerCase());
      return matchesRegion && matchesSearch;
    }).length;
  }, [countries, search, region]);

  return (
    <div className="flex flex-col gap-2 p-3 h-full">
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search countries..."
        className="border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-black"
      />

      {/* Region filter pills */}
      <div className="flex flex-wrap gap-1">
        {REGIONS.map((r) => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            className={`text-[10px] px-2 py-0.5 rounded-full border font-medium transition-all ${
              region === r
                ? "bg-neutral-900 text-white border-neutral-900"
                : "border-neutral-300 text-neutral-500 hover:border-neutral-500"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-neutral-400 animate-pulse">Loading countries...</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {!loading && !error && (
        <>
          <p className="text-[10px] text-neutral-400">
            Showing {filtered.length} of {totalCount} countries
          </p>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 bg-white">
                <tr className="text-[10px] text-neutral-400 uppercase tracking-wider border-b border-neutral-100">
                  <th className="text-left pb-1.5 font-medium">Country</th>
                  <th className="text-left pb-1.5 font-medium">Region</th>
                  <th className="text-right pb-1.5 font-medium">Population</th>
                  <th className="text-right pb-1.5 font-medium hidden sm:table-cell">Area</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((country) => (
                  <tr
                    key={country.name.common}
                    className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors"
                  >
                    <td className="py-1.5 font-medium text-neutral-800 truncate max-w-[120px]">
                      {country.name.common}
                    </td>
                    <td className="py-1.5 text-neutral-500">{country.region}</td>
                    <td className="py-1.5 text-right text-neutral-700 font-mono">
                      {formatPopulation(country.population)}
                    </td>
                    <td className="py-1.5 text-right text-neutral-500 hidden sm:table-cell">
                      {country.area ? formatArea(country.area) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
