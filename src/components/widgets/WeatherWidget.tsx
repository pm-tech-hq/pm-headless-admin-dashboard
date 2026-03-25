"use client";

import React, { useEffect, useState } from "react";

interface WeatherData {
  timezone: string;
  current_weather: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    is_day: number;
    weathercode: number;
    time: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
  };
}

const CITIES = [
  { name: "London", flag: "🇬🇧", lat: 51.5074, lon: -0.1278 },
  { name: "New York", flag: "🇺🇸", lat: 40.7128, lon: -74.006 },
  { name: "Tokyo", flag: "🇯🇵", lat: 35.6762, lon: 139.6503 },
  { name: "Paris", flag: "🇫🇷", lat: 48.8566, lon: 2.3522 },
  { name: "Sydney", flag: "🇦🇺", lat: -33.8688, lon: 151.2093 },
  { name: "Dubai", flag: "🇦🇪", lat: 25.2048, lon: 55.2708 },
  { name: "Singapore", flag: "🇸🇬", lat: 1.3521, lon: 103.8198 },
  { name: "Mumbai", flag: "🇮🇳", lat: 19.076, lon: 72.8777 },
];

function getWeatherInfo(code: number, isDay: boolean): { emoji: string; desc: string } {
  if (code === 0) return { emoji: isDay ? "☀️" : "🌙", desc: "Clear sky" };
  if (code === 1) return { emoji: "🌤️", desc: "Mainly clear" };
  if (code === 2) return { emoji: "⛅", desc: "Partly cloudy" };
  if (code === 3) return { emoji: "☁️", desc: "Overcast" };
  if (code === 45 || code === 48) return { emoji: "🌫️", desc: "Foggy" };
  if (code >= 51 && code <= 55) return { emoji: "🌦️", desc: "Drizzle" };
  if (code >= 61 && code <= 65) return { emoji: "🌧️", desc: "Rain" };
  if (code >= 71 && code <= 75) return { emoji: "❄️", desc: "Snow" };
  if (code >= 80 && code <= 81) return { emoji: "🌦️", desc: "Showers" };
  if (code === 82) return { emoji: "⛈️", desc: "Heavy showers" };
  if (code >= 95 && code <= 99) return { emoji: "⛈️", desc: "Thunderstorm" };
  return { emoji: "🌡️", desc: "Unknown" };
}

function getSkyGradient(code: number, isDay: boolean): string {
  if (!isDay) return "from-slate-900 via-slate-800 to-indigo-900";
  if (code === 0) return "from-sky-400 via-blue-400 to-blue-500";
  if (code <= 2) return "from-sky-300 via-sky-400 to-blue-400";
  if (code === 3) return "from-slate-400 via-slate-500 to-slate-600";
  if (code >= 61 && code <= 65) return "from-slate-500 via-slate-600 to-slate-700";
  if (code >= 71 && code <= 75) return "from-slate-200 via-blue-200 to-slate-300";
  if (code >= 95) return "from-slate-700 via-slate-800 to-slate-900";
  return "from-sky-300 via-blue-400 to-sky-500";
}

export default function WeatherWidget() {
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async (city: typeof CITIES[0]) => {
    setLoading(true);
    setError(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true&hourly=temperature_2m,precipitation_probability&timezone=auto&forecast_days=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch weather");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(selectedCity);
  }, [selectedCity]);

  const handleCitySelect = (city: typeof CITIES[0]) => {
    setSelectedCity(city);
  };

  const getHourlySlice = () => {
    if (!data) return [];
    const now = new Date();
    const currentHour = now.getHours();
    const temps = data.hourly.temperature_2m;
    return temps.slice(currentHour, currentHour + 8);
  };

  const hourlyTemps = getHourlySlice();
  const minTemp = hourlyTemps.length ? Math.min(...hourlyTemps) : 0;
  const maxTemp = hourlyTemps.length ? Math.max(...hourlyTemps) : 1;
  const range = maxTemp - minTemp || 1;

  const weatherInfo = data
    ? getWeatherInfo(data.current_weather.weathercode, data.current_weather.is_day === 1)
    : null;

  const skyGradient = data
    ? getSkyGradient(data.current_weather.weathercode, data.current_weather.is_day === 1)
    : "from-sky-400 via-blue-400 to-blue-500";

  const currentPrecip = data
    ? (data.hourly.precipitation_probability[new Date().getHours()] ?? 0)
    : 0;

  return (
    <div className="flex flex-col gap-2 p-3 h-full">
      {/* City pills */}
      <div className="flex flex-wrap gap-1">
        {CITIES.map((city) => (
          <button
            key={city.name}
            onClick={() => handleCitySelect(city)}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-all font-medium ${
              selectedCity.name === city.name
                ? "bg-neutral-900 text-white border-neutral-900"
                : "border-neutral-300 text-neutral-500 hover:border-neutral-500 hover:text-neutral-700"
            }`}
          >
            {city.flag} {city.name}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-neutral-400 animate-pulse">Loading weather...</p>
        </div>
      )}

      {error && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-red-500">{error}</p>
        </div>
      )}

      {!loading && !error && data && weatherInfo && (
        <>
          {/* Sky gradient card */}
          <div className={`rounded-xl bg-gradient-to-br ${skyGradient} p-3 text-white`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium opacity-80">
                  {selectedCity.flag} {selectedCity.name}
                </p>
                <div className="flex items-end gap-2 mt-1">
                  <span className="text-3xl font-bold leading-none">
                    {Math.round(data.current_weather.temperature)}°C
                  </span>
                  <span className="text-xl leading-none mb-0.5">{weatherInfo.emoji}</span>
                </div>
                <p className="text-[11px] opacity-80 mt-1">{weatherInfo.desc}</p>
              </div>
              <div className="text-right text-[11px] opacity-80 space-y-1">
                <p>💨 {Math.round(data.current_weather.windspeed)} km/h</p>
                {currentPrecip > 20 && (
                  <p>🌧️ {currentPrecip}% precip</p>
                )}
              </div>
            </div>
          </div>

          {/* 8-hour bar chart */}
          {hourlyTemps.length > 0 && (
            <div>
              <p className="text-[10px] text-neutral-500 mb-1.5 font-medium uppercase tracking-wider">
                Next 8 hours
              </p>
              <div className="flex items-end gap-1 h-12">
                {hourlyTemps.map((temp, i) => {
                  const heightPct = ((temp - minTemp) / range) * 70 + 30;
                  const hour = (new Date().getHours() + i) % 24;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <span className="text-[9px] text-neutral-500">{Math.round(temp)}°</span>
                      <div
                        className="w-full rounded-t bg-sky-400 opacity-80 min-h-[4px]"
                        style={{ height: `${heightPct}%` }}
                        title={`${hour}:00 — ${Math.round(temp)}°C`}
                      />
                      <span className="text-[9px] text-neutral-400">{hour}h</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
