"use client";

import React, { useEffect, useState } from "react";

interface HNStory {
  title: string;
  url: string;
  author: string;
  points: number;
  num_comments: number;
  created_at: string;
  objectID: string;
}

interface HNResponse {
  hits: HNStory[];
  nbHits: number;
  nbPages: number;
  page: number;
}

type Category = "front_page" | "ask_hn" | "show_hn" | "jobs";

const CATEGORIES: { label: string; tag: Category }[] = [
  { label: "Top", tag: "front_page" },
  { label: "Ask HN", tag: "ask_hn" },
  { label: "Show HN", tag: "show_hn" },
  { label: "Jobs", tag: "jobs" },
];

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getPointsColor(points: number): string {
  if (points > 500) return "text-emerald-700 bg-emerald-50";
  if (points > 100) return "text-blue-700 bg-blue-50";
  return "text-neutral-600 bg-neutral-100";
}

export default function HackerNewsWidget() {
  const [category, setCategory] = useState<Category>("front_page");
  const [stories, setStories] = useState<HNStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStories = async (tag: Category) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://hn.algolia.com/api/v1/search?tags=${tag}&hitsPerPage=8`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: HNResponse = await res.json();
      setStories(json.hits);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch Hacker News");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories(category);
  }, [category]);

  return (
    <div className="flex flex-col gap-2 p-3 h-full">
      {/* Category tabs */}
      <div className="flex gap-0.5 bg-neutral-100 rounded-lg p-0.5 w-fit">
        {CATEGORIES.map(({ label, tag }) => (
          <button
            key={tag}
            onClick={() => setCategory(tag)}
            className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-all ${
              category === tag
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-neutral-400 animate-pulse">Loading stories...</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {!loading && !error && (
        <div className="flex-1 overflow-auto space-y-1">
          {stories.map((story, idx) => (
            <div
              key={story.objectID}
              className="border border-neutral-100 rounded-xl p-2 hover:border-neutral-200 hover:bg-neutral-50 transition-all"
            >
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-neutral-300 font-mono w-4 flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  {story.url ? (
                    <a
                      href={story.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-medium text-neutral-800 hover:text-blue-600 transition-colors leading-snug line-clamp-2"
                    >
                      {story.title}
                    </a>
                  ) : (
                    <p className="text-[11px] font-medium text-neutral-800 leading-snug line-clamp-2">
                      {story.title}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${getPointsColor(story.points)}`}
                    >
                      ▲ {story.points ?? 0}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      💬 {story.num_comments ?? 0}
                    </span>
                    <span className="text-[10px] text-neutral-400 truncate">
                      {story.author}
                    </span>
                    <span className="text-[10px] text-neutral-300">
                      {timeAgo(story.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {stories.length === 0 && (
            <p className="text-xs text-neutral-400 text-center py-6">No stories found.</p>
          )}
        </div>
      )}
    </div>
  );
}
