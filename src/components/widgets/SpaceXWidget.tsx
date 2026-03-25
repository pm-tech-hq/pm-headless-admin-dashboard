"use client";

import React, { useEffect, useState } from "react";

interface SpaceXLaunch {
  name: string;
  date_utc: string;
  success: boolean | null;
  flight_number: number;
  details: string | null;
  upcoming: boolean;
  links: {
    patch: { small: string | null };
    webcast: string | null;
    wikipedia: string | null;
  };
  cores: Array<{
    landing_success: boolean | null;
    landing_type: string | null;
    reused: boolean | null;
  }>;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default function SpaceXWidget() {
  const [launch, setLaunch] = useState<SpaceXLaunch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLatestLaunch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://api.spacexdata.com/v4/launches/latest");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: SpaceXLaunch = await res.json();
      setLaunch(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch SpaceX data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestLaunch();
  }, []);

  return (
    <div className="flex flex-col gap-2.5 p-3 h-full">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">
          SpaceX Latest Launch
        </p>
        <button
          onClick={fetchLatestLaunch}
          className="text-[10px] px-2 py-1 rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-100 transition-all"
        >
          ↻ Reload
        </button>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-neutral-400 animate-pulse">Loading launch data...</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {!loading && !error && launch && (
        <div className="flex flex-col gap-2.5 flex-1 overflow-auto">
          {/* Patch + title */}
          <div className="flex items-start gap-3">
            {launch.links.patch.small ? (
              <img
                src={launch.links.patch.small}
                alt="Mission patch"
                className="w-16 h-16 object-contain flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 flex items-center justify-center text-3xl bg-neutral-100 rounded-xl flex-shrink-0">
                🚀
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-900">{launch.name}</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Flight #{launch.flight_number} · {formatDate(launch.date_utc)}
              </p>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {launch.upcoming && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                    Upcoming
                  </span>
                )}
                {!launch.upcoming && launch.success !== null && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      launch.success
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {launch.success ? "✓ Success" : "✗ Failed"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          {launch.details && (
            <p className="text-[11px] text-neutral-600 leading-relaxed line-clamp-3">
              {launch.details}
            </p>
          )}

          {/* Core info */}
          {launch.cores.length > 0 && (
            <div className="bg-neutral-50 rounded-xl p-2 border border-neutral-100">
              <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1.5 font-medium">
                Core Info
              </p>
              <div className="flex flex-wrap gap-2">
                {launch.cores.map((core, i) => (
                  <div key={i} className="flex gap-2 text-[10px] text-neutral-600">
                    {core.reused !== null && (
                      <span className={`px-1.5 py-0.5 rounded ${core.reused ? "bg-amber-50 text-amber-700" : "bg-neutral-100"}`}>
                        {core.reused ? "♻ Reused" : "New core"}
                      </span>
                    )}
                    {core.landing_type && (
                      <span className="px-1.5 py-0.5 rounded bg-neutral-100">
                        {core.landing_type}
                      </span>
                    )}
                    {core.landing_success !== null && (
                      <span className={`px-1.5 py-0.5 rounded font-medium ${core.landing_success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        {core.landing_success ? "Landed ✓" : "Landing ✗"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="flex gap-2 mt-auto flex-wrap">
            {launch.links.webcast && (
              <a
                href={launch.links.webcast}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] px-3 py-1.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                ▶ Watch
              </a>
            )}
            {launch.links.wikipedia && (
              <a
                href={launch.links.wikipedia}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] px-3 py-1.5 border border-neutral-300 text-neutral-600 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
              >
                Wikipedia
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
