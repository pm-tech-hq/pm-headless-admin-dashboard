"use client";

import React, { useEffect, useState } from "react";

interface BookDoc {
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
}

interface LibraryResponse {
  numFound: number;
  docs: BookDoc[];
}

const COVER_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-purple-100 text-purple-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

export default function OpenLibraryWidget() {
  const [query, setQuery] = useState("javascript");
  const [inputQuery, setInputQuery] = useState("javascript");
  const [data, setData] = useState<LibraryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const encoded = encodeURIComponent(q.trim());
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${encoded}&limit=10&fields=title,author_name,first_publish_year,cover_i`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: LibraryResponse = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to search books");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks(query);
  }, [query]);

  const handleSearch = () => {
    setQuery(inputQuery);
  };

  return (
    <div className="flex flex-col gap-2 p-3 h-full">
      {/* Search input */}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search books..."
          className="flex-1 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-black"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-700 transition-colors disabled:opacity-50"
        >
          Search
        </button>
      </div>

      {/* Result count */}
      {data && !loading && (
        <p className="text-[10px] text-neutral-400">
          {data.numFound.toLocaleString()} results for &ldquo;{query}&rdquo;
        </p>
      )}

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-neutral-400 animate-pulse">Searching books...</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {!loading && !error && data && (
        <div className="grid grid-cols-2 gap-2 flex-1 overflow-auto content-start">
          {data.docs.map((book, idx) => {
            const colorClass = COVER_COLORS[idx % COVER_COLORS.length];
            const authors = book.author_name?.slice(0, 2).join(", ") ?? "Unknown author";
            return (
              <div
                key={`${book.title}-${idx}`}
                className="border border-neutral-100 rounded-xl overflow-hidden hover:border-neutral-300 hover:shadow-sm transition-all bg-neutral-50 group"
              >
                {/* Cover */}
                {book.cover_i ? (
                  <img
                    src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`}
                    alt={book.title}
                    className="w-full h-24 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div
                    className={`w-full h-24 flex items-center justify-center text-3xl font-bold ${colorClass}`}
                  >
                    {book.title.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Info */}
                <div className="p-1.5">
                  <p className="text-[10px] font-semibold text-neutral-800 line-clamp-2 leading-snug">
                    {book.title}
                  </p>
                  <p className="text-[9px] text-neutral-500 mt-0.5 truncate">{authors}</p>
                  {book.first_publish_year && (
                    <p className="text-[9px] text-neutral-400">{book.first_publish_year}</p>
                  )}
                </div>
              </div>
            );
          })}
          {data.docs.length === 0 && (
            <p className="col-span-2 text-xs text-neutral-400 text-center py-6">
              No results found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
