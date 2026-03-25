"use client";

import React, { useEffect, useState } from "react";

interface GitHubRepo {
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  subscribers_count: number;
  language: string;
  topics: string[];
  owner: { avatar_url: string; login: string };
  pushed_at: string;
  created_at: string;
  license: { name: string } | null;
  default_branch: string;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "bg-blue-100 text-blue-700",
  JavaScript: "bg-yellow-100 text-yellow-700",
  Python: "bg-green-100 text-green-700",
  Rust: "bg-orange-100 text-orange-700",
  Go: "bg-cyan-100 text-cyan-700",
  Java: "bg-red-100 text-red-700",
  "C++": "bg-pink-100 text-pink-700",
  Ruby: "bg-rose-100 text-rose-700",
  Swift: "bg-orange-100 text-orange-700",
  Kotlin: "bg-purple-100 text-purple-700",
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}

export default function GitHubWidget() {
  const [repoInput, setRepoInput] = useState("vercel/next.js");
  const [repo, setRepo] = useState<GitHubRepo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRepo = async (fullName: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://api.github.com/repos/${fullName}`);
      if (!res.ok) throw new Error(res.status === 404 ? "Repository not found" : `HTTP ${res.status}`);
      const json: GitHubRepo = await res.json();
      setRepo(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch repo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepo("vercel/next.js");
  }, []);

  const handleLoad = () => {
    const trimmed = repoInput.trim();
    if (trimmed) fetchRepo(trimmed);
  };

  const langColor = repo?.language
    ? (LANGUAGE_COLORS[repo.language] ?? "bg-neutral-100 text-neutral-600")
    : "";

  return (
    <div className="flex flex-col gap-2.5 p-3 h-full">
      {/* Repo input */}
      <div className="flex gap-1.5">
        <input
          type="text"
          value={repoInput}
          onChange={(e) => setRepoInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLoad()}
          placeholder="owner/repo"
          className="flex-1 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-black"
        />
        <button
          onClick={handleLoad}
          className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-700 transition-colors"
        >
          Load
        </button>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-neutral-400 animate-pulse">Loading repository...</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {!loading && !error && repo && (
        <div className="flex flex-col gap-2 flex-1 overflow-auto">
          {/* Owner + name */}
          <div className="flex items-center gap-2">
            <img
              src={repo.owner.avatar_url}
              alt={repo.owner.login}
              className="w-8 h-8 rounded-full border border-neutral-200 flex-shrink-0"
            />
            <div className="min-w-0">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-neutral-900 hover:text-blue-600 transition-colors"
              >
                {repo.full_name}
              </a>
              {repo.description && (
                <p className="text-[10px] text-neutral-500 mt-0.5 line-clamp-2">
                  {repo.description}
                </p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-3 flex-wrap">
            {[
              { icon: "⭐", label: "Stars", value: formatCount(repo.stargazers_count) },
              { icon: "🔀", label: "Forks", value: formatCount(repo.forks_count) },
              { icon: "🐛", label: "Issues", value: formatCount(repo.open_issues_count) },
              { icon: "👁", label: "Watchers", value: formatCount(repo.subscribers_count) },
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex flex-col items-center bg-neutral-50 rounded-xl px-3 py-1.5 border border-neutral-100">
                <span className="text-base leading-none">{icon}</span>
                <span className="text-[11px] font-semibold text-neutral-800 mt-0.5">{value}</span>
                <span className="text-[9px] text-neutral-400">{label}</span>
              </div>
            ))}
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {repo.language && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${langColor}`}>
                {repo.language}
              </span>
            )}
            {repo.license && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                {repo.license.name}
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-mono">
              {repo.default_branch}
            </span>
          </div>

          {/* Topics */}
          {repo.topics && repo.topics.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {repo.topics.slice(0, 5).map((topic) => (
                <span
                  key={topic}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <p className="text-[10px] text-neutral-400 mt-auto">
            Last pushed {timeAgo(repo.pushed_at)}
          </p>
        </div>
      )}
    </div>
  );
}
