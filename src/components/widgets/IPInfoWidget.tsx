"use client";

import React, { useEffect, useState } from "react";

interface IPData {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  org: string;
  timezone: string;
  latitude: number;
  longitude: number;
  currency: string;
  currency_name: string;
  country_calling_code: string;
  languages: string;
  in_eu: boolean;
}

export default function IPInfoWidget() {
  const [data, setData] = useState<IPData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIPInfo = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: IPData = await res.json();
        setData(json);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch IP info");
      } finally {
        setLoading(false);
      }
    };
    fetchIPInfo();
  }, []);

  return (
    <div className="flex flex-col gap-2.5 p-3 h-full">
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-neutral-400 animate-pulse">Detecting IP...</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {!loading && !error && data && (
        <div className="flex flex-col gap-2 flex-1 overflow-auto">
          {/* IP Address hero */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-blue-400 font-medium mb-1">
              Your IP Address
            </p>
            <p className="text-xl font-mono font-bold text-blue-900 tracking-widest">
              {data.ip}
            </p>
            <p className="text-[11px] text-blue-600 mt-0.5">
              {data.city}, {data.region}, {data.country_name}
            </p>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-1.5">
            <InfoRow label="ISP / Org" value={data.org} />
            <InfoRow label="Timezone" value={data.timezone} />
            <InfoRow
              label="Location"
              value={`${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`}
            />
            <InfoRow label="Calling Code" value={data.country_calling_code} />
            <InfoRow label="Currency" value={`${data.currency} (${data.currency_name})`} />
            <InfoRow
              label="EU Member"
              value={data.in_eu ? "Yes" : "No"}
              highlight={data.in_eu}
            />
          </div>

          {/* Languages */}
          {data.languages && (
            <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-2">
              <p className="text-[9px] uppercase tracking-wider text-neutral-400 font-medium mb-1">
                Languages
              </p>
              <div className="flex flex-wrap gap-1">
                {data.languages.split(",").map((lang) => (
                  <span
                    key={lang}
                    className="text-[10px] px-1.5 py-0.5 bg-white border border-neutral-200 rounded font-mono"
                  >
                    {lang.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-neutral-50 border border-neutral-100 rounded-xl px-2.5 py-2 min-w-0">
      <p className="text-[9px] uppercase tracking-wider text-neutral-400 font-medium">{label}</p>
      <p
        className={`text-[11px] font-semibold mt-0.5 truncate ${
          highlight ? "text-emerald-600" : "text-neutral-800"
        }`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}
