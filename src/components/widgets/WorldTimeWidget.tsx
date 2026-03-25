"use client";

import React, { useEffect, useRef, useState } from "react";

interface WorldTimeData {
  timezone: string;
  datetime: string;
  utc_offset: string;
  day_of_week: number;
  day_of_year: number;
  week_number: number;
  dst: boolean;
  abbreviation: string;
  utc_datetime: string;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function padTwo(n: number): string {
  return String(n).padStart(2, "0");
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

export default function WorldTimeWidget() {
  const [apiData, setApiData] = useState<WorldTimeData | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedAtRef = useRef<number>(0);
  const baseDateRef = useRef<Date | null>(null);

  useEffect(() => {
    const fetchTime = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("https://worldtimeapi.org/api/ip");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: WorldTimeData = await res.json();
        setApiData(json);
        const base = new Date(json.datetime);
        baseDateRef.current = base;
        fetchedAtRef.current = Date.now();
        setCurrentTime(new Date(base));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch world time");
      } finally {
        setLoading(false);
      }
    };
    fetchTime();
  }, []);

  useEffect(() => {
    if (!apiData || !baseDateRef.current) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - fetchedAtRef.current;
      const newTime = new Date(baseDateRef.current!.getTime() + elapsed);
      setCurrentTime(newTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [apiData]);

  const timeString = currentTime
    ? `${padTwo(currentTime.getHours())}:${padTwo(currentTime.getMinutes())}:${padTwo(currentTime.getSeconds())}`
    : "--:--:--";

  const dateString = currentTime ? formatDisplayDate(currentTime) : "";

  return (
    <div className="flex flex-col gap-3 p-3 h-full">
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-neutral-400 animate-pulse">Fetching time...</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {!loading && !error && apiData && (
        <div className="flex flex-col gap-2.5 flex-1">
          {/* Clock */}
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl px-4 py-4 text-white text-center">
            <p className="text-4xl font-mono font-bold tracking-widest tabular-nums">
              {timeString}
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">{dateString}</p>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-1.5">
            <InfoCell label="Timezone" value={apiData.timezone} />
            <InfoCell label="UTC Offset" value={apiData.utc_offset} />
            <InfoCell label="Abbreviation" value={apiData.abbreviation} />
            <InfoCell
              label="DST"
              value={apiData.dst ? "Active" : "Inactive"}
              highlight={apiData.dst}
            />
            <InfoCell label="Day of Year" value={String(apiData.day_of_year)} />
            <InfoCell label="Week Number" value={`W${apiData.week_number}`} />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-neutral-50 border border-neutral-100 rounded-xl px-2.5 py-2">
      <p className="text-[9px] uppercase tracking-wider text-neutral-400 font-medium">{label}</p>
      <p
        className={`text-[11px] font-semibold mt-0.5 truncate ${
          highlight ? "text-emerald-600" : "text-neutral-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
