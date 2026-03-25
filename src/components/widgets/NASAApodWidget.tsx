"use client";

import React, { useEffect, useState } from "react";

interface ApodData {
  title: string;
  date: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: "image" | "video";
  copyright?: string;
}

function getYouTubeEmbedId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/embed\/|youtu\.be\/|v=)([^&?/]+)/);
  return match ? match[1] : null;
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export default function NASAApodWidget() {
  const [date, setDate] = useState(getTodayDate());
  const [data, setData] = useState<ApodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchApod = async (selectedDate: string) => {
    setLoading(true);
    setError(null);
    setExpanded(false);
    try {
      const res = await fetch(
        `https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&date=${selectedDate}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApodData = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch APOD");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApod(date);
  }, [date]);

  const youtubeId = data?.media_type === "video" ? getYouTubeEmbedId(data.url) : null;

  return (
    <div className="flex flex-col gap-2 p-3 h-full">
      {/* Date input */}
      <div className="flex items-center gap-2">
        <label className="text-[10px] text-neutral-500 font-medium shrink-0">Date</label>
        <input
          type="date"
          value={date}
          max={getTodayDate()}
          onChange={(e) => setDate(e.target.value)}
          className="border border-neutral-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-neutral-400 animate-pulse">Loading APOD...</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {!loading && !error && data && (
        <div className="flex flex-col gap-2 flex-1 overflow-auto">
          {/* Media */}
          {data.media_type === "image" ? (
            <img
              src={data.url}
              alt={data.title}
              className="w-full max-h-40 object-cover rounded-xl border border-neutral-100"
            />
          ) : youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title={data.title}
              className="w-full aspect-video rounded-xl"
              allowFullScreen
            />
          ) : (
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-blue-600 underline"
            >
              View media →
            </a>
          )}

          {/* Title + copyright */}
          <div>
            <p className="text-[12px] font-semibold text-neutral-900">{data.title}</p>
            {data.copyright && (
              <p className="text-[10px] text-neutral-400 mt-0.5">
                © {data.copyright.trim()}
              </p>
            )}
          </div>

          {/* Explanation */}
          <div>
            <p
              className={`text-[11px] text-neutral-600 leading-relaxed ${
                expanded ? "" : "line-clamp-4"
              }`}
            >
              {data.explanation}
            </p>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-[10px] text-blue-600 hover:text-blue-800 mt-0.5 font-medium"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
