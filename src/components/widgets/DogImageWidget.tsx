"use client";

import React, { useEffect, useState } from "react";

interface DogResponse {
  message: string;
  status: string;
}

function extractBreed(url: string): string {
  const match = url.match(/breeds\/([^/]+)\//);
  if (!match) return "Unknown";
  const breed = match[1].replace("-", " ");
  return breed.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default function DogImageWidget() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [breed, setBreed] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDog = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://dog.ceo/api/breeds/image/random");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: DogResponse = await res.json();
      setImageUrl(json.message);
      setBreed(extractBreed(json.message));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch dog image");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDog();
  }, []);

  return (
    <div className="flex flex-col gap-2 p-3 h-full">
      {loading && (
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex-1 bg-neutral-100 rounded-xl animate-pulse" style={{ minHeight: "160px" }} />
          <div className="h-4 bg-neutral-100 rounded animate-pulse w-1/2" />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {!loading && !error && imageUrl && (
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex-1 overflow-hidden rounded-xl border border-neutral-100">
            <img
              src={imageUrl}
              alt={breed}
              className="w-full max-h-48 object-cover"
              onError={() => setError("Failed to load image")}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-semibold text-neutral-800">{breed}</p>
              <p className="text-[10px] text-neutral-400">via dog.ceo</p>
            </div>
            <button
              onClick={fetchDog}
              className="text-[10px] px-3 py-1.5 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
            >
              New dog 🐕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
