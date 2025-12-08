"use client";

import React, { useState, FormEvent, useEffect } from "react";

type MenuItem = {
  id: number;
  label: string;
};

type WidgetType =
  | "auto"
  | "stats"
  | "text"
  | "list"
  | "raw"
  | "weather"
  | "stocks"
  | "exchangeRates"
  | "movies"
  | "books"
  | "aiModels"
  | "news"
  | "sports"
  | "gaming"
  | "editable";

type Widget = {
  id: number;
  title: string;
  type: WidgetType;
  apiUrl?: string;
};

type Shape = "array" | "object" | "string" | "number" | "boolean" | "null" | "unknown";
type Presentation = "stats" | "list" | "text" | "raw";

type WidgetStatus =
  | { state: "idle" }
  | { state: "loading" }
  | {
      state: "success";
      shape: Shape;
      presentation: Presentation;
      message: string;
    }
  | { state: "error"; message: string };

// ─────────────────────────────────────────────────────────
// Helpers: shape & presentation
// ─────────────────────────────────────────────────────────

function getShape(value: any): Shape {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  const t = typeof value;
  if (t === "object" || t === "string" || t === "number" || t === "boolean") return t;
  return "unknown";
}

function inferPresentation(data: any): Presentation {
  const shape = getShape(data);

  if (shape === "array") {
    const arr = data as any[];
    if (arr.length === 0) return "raw";
    const first = arr[0];
    if (typeof first === "object" && first !== null) return "list";
    return "list";
  }

  if (shape === "object") {
    const obj = data as Record<string, any>;
    const entries = Object.entries(obj);
    const numericCount = entries.filter(([, v]) => typeof v === "number").length;

    if (numericCount >= 1 && numericCount >= entries.length / 2) {
      return "stats";
    }

    const hasNested = entries.some(([, v]) => typeof v === "object" && v !== null);
    if (hasNested) return "list";

    return "text";
  }

  if (shape === "string") return "text";
  if (shape === "number") return "stats";

  return "raw";
}

function labelForType(type: WidgetType): string {
  switch (type) {
    case "auto":
      return "Auto";
    case "stats":
      return "Stats";
    case "text":
      return "Text";
    case "list":
      return "List";
    case "raw":
      return "Raw JSON";
    case "weather":
      return "Weather";
    case "stocks":
      return "Stocks";
    case "exchangeRates":
      return "Exchange rates";
    case "movies":
      return "Movies";
    case "books":
      return "Books";
    case "aiModels":
      return "AI models";
    case "news":
      return "News";
    case "sports":
      return "Sports";
    case "gaming":
      return "Gaming";
    case "editable":
      return "Editable";
    default:
      return type;
  }
}

function placeholderForType(type: WidgetType): string {
  switch (type) {
    case "weather":
      return "e.g. https://api.example.com/weather?city=London";
    case "stocks":
      return "e.g. https://api.example.com/stocks?symbol=AAPL";
    case "exchangeRates":
      return "e.g. https://api.example.com/exchange-rates?base=USD";
    case "movies":
      return "e.g. https://api.example.com/movies/popular";
    case "books":
      return "e.g. https://api.example.com/books/search?q=react";
    case "aiModels":
      return "e.g. https://api.example.com/models";
    case "news":
      return "e.g. https://api.example.com/news/latest";
    case "sports":
      return "e.g. https://api.example.com/sports/scores";
    case "gaming":
      return "e.g. https://api.example.com/games/top";
    case "stats":
    case "list":
    case "text":
    case "raw":
    case "auto":
      return "e.g. https://jsonplaceholder.typicode.com/posts";
    case "editable":
      return "(not used for editable widgets)";
    default:
      return "https://api.example.com/your-endpoint";
  }
}

// ─────────────────────────────────────────────────────────
// WidgetCard
// ─────────────────────────────────────────────────────────

function WidgetCard({ widget, onRemove }: { widget: Widget; onRemove: (id: number) => void }) {
  const [status, setStatus] = useState<WidgetStatus>({ state: "idle" });
  const [data, setData] = useState<any>(null);
  const [editableContent, setEditableContent] = useState<string>("");

  const shouldUseApi = widget.type !== "editable";

  const testApi = async () => {
    if (!shouldUseApi) {
      setStatus({ state: "idle" });
      return;
    }

    if (!widget.apiUrl) {
      setStatus({ state: "error", message: "No API URL set for this widget." });
      setData(null);
      return;
    }

    setStatus({ state: "loading" });

    try {
      const res = await fetch(widget.apiUrl);

      if (!res.ok) {
        setStatus({
          state: "error",
          message: `API responded with status ${res.status} ${res.statusText}`,
        });
        setData(null);
        return;
      }

      let json: any;
      try {
        json = await res.json();
      } catch {
        setStatus({ state: "error", message: "Response is not valid JSON." });
        setData(null);
        return;
      }

      const shape = getShape(json);

      const presentation: Presentation =
        widget.type === "auto" ||
        [
          "weather",
          "stocks",
          "exchangeRates",
          "movies",
          "books",
          "aiModels",
          "news",
          "sports",
          "gaming",
        ].includes(widget.type)
          ? inferPresentation(json)
          : ((
              widget.type === "stats"
                ? "stats"
                : widget.type === "text"
                ? "text"
                : widget.type === "list"
                ? "list"
                : "raw"
            ) as Presentation);

      setData(json);
      setStatus({
        state: "success",
        shape,
        presentation,
        message: `Detected ${shape} data, displaying as "${presentation}".`,
      });
    } catch {
      setStatus({
        state: "error",
        message:
          "Cannot reach API (network/CORS). Make sure the URL is correct and allows browser requests.",
      });
      setData(null);
    }
  };

  useEffect(() => {
    if (shouldUseApi && widget.apiUrl) {
      testApi();
    } else {
      setStatus({ state: "idle" });
      setData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widget.apiUrl, widget.type]);

  // ─────────────────────────────────────────────────────
  // Generic renderers
  // ─────────────────────────────────────────────────────

  const renderRaw = (value: any) => (
    <pre className="mt-2 border border-dashed border-neutral-300 rounded-lg p-3 text-[10px] text-neutral-600 max-h-40 overflow-auto">
      {JSON.stringify(value, null, 2)}
    </pre>
  );

  const renderStats = (value: any) => {
    const obj =
      Array.isArray(value) && value.length > 0 && typeof value[0] === "object"
        ? value[0]
        : value;

    if (typeof obj !== "object" || obj === null) {
      return renderRaw(value);
    }

    const entries = Object.entries(obj)
      .filter(([, v]) => typeof v === "number")
      .slice(0, 3);

    if (entries.length === 0) return renderRaw(value);

    return (
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
        {entries.map(([key, val]) => (
          <div
            key={key}
            className="border border-dashed border-neutral-300 rounded-lg p-2"
          >
            <p className="text-[10px] text-neutral-500">
              {key.replace(/[_-]/g, " ")}
            </p>
            <p className="text-sm font-semibold">{String(val)}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderList = (value: any) => {
    if (Array.isArray(value)) {
      return (
        <ul className="mt-2 border border-dashed border-neutral-300 rounded-lg p-3 space-y-1 max-h-40 overflow-auto text-[11px]">
          {value.slice(0, 10).map((item, idx) => {
            if (typeof item === "object" && item !== null) {
              const title =
                (item.title as string) ||
                (item.name as string) ||
                (item.id && String(item.id)) ||
                `Item ${idx + 1}`;
              const subtitle =
                (item.description as string) ||
                (item.body as string) ||
                (item.summary as string) ||
                "";
              return (
                <li key={idx} className="flex flex-col">
                  <span className="font-medium truncate">{title}</span>
                  {subtitle && (
                    <span className="text-neutral-500 truncate">
                      {subtitle}
                    </span>
                  )}
                </li>
              );
            }
            return (
              <li key={idx} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                <span>{String(item)}</span>
              </li>
            );
          })}
        </ul>
      );
    }

    if (typeof value === "object" && value !== null) {
      const entries = Object.entries(value).slice(0, 10);
      return (
        <ul className="mt-2 border border-dashed border-neutral-300 rounded-lg p-3 space-y-1 text-[11px]">
          {entries.map(([k, v]) => (
            <li key={k} className="flex justify-between gap-2">
              <span className="font-medium">{k}</span>
              <span className="text-neutral-500 truncate max-w-[60%]">
                {typeof v === "object" ? JSON.stringify(v) : String(v)}
              </span>
            </li>
          ))}
        </ul>
      );
    }

    return renderRaw(value);
  };

  const renderText = (value: any) => {
    if (typeof value === "string") {
      return (
        <div className="mt-2 border border-dashed border-neutral-300 rounded-lg p-3 text-xs text-neutral-700">
          {value}
        </div>
      );
    }

    if (typeof value === "object" && value !== null) {
      const candidate =
        (value.content as string) ||
        (value.message as string) ||
        (value.title as string) ||
        (value.text as string);

      if (candidate) {
        return (
          <div className="mt-2 border border-dashed border-neutral-300 rounded-lg p-3 text-xs text-neutral-700">
            {candidate}
          </div>
        );
      }
    }

    return renderRaw(value);
  };

  // ─────────────────────────────────────────────────────
  // Domain-specific renderers (weather, stocks, etc.)
  // ─────────────────────────────────────────────────────

  const renderWeather = (value: any) => {
    if (Array.isArray(value)) return renderWeather(value[0]);

    if (typeof value !== "object" || value === null) return renderRaw(value);

    const name = (value.name as string) || "Weather";
    const main = (value as any).main || {};
    const weatherArr = (value as any).weather || [];
    const firstWeather = Array.isArray(weatherArr) ? weatherArr[0] : null;

    const temp = main.temp;
    const feels = main.feels_like;
    const humidity = main.humidity;
    const desc =
      (firstWeather && firstWeather.description) ||
      (value.description as string) ||
      "";

    return (
      <div className="mt-2 border border-dashed border-neutral-300 rounded-lg p-3 text-xs">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-neutral-500">Location</p>
            <p className="text-sm font-semibold">{name}</p>
          </div>
          {typeof temp === "number" && (
            <div className="text-right">
              <p className="text-2xl font-semibold">{Math.round(temp)}°</p>
              {typeof feels === "number" && (
                <p className="text-[11px] text-neutral-500">
                  Feels like {Math.round(feels)}°
                </p>
              )}
            </div>
          )}
        </div>
        {desc && (
          <p className="mt-2 text-[11px] text-neutral-600 capitalize">
            {desc}
          </p>
        )}
        {typeof humidity === "number" && (
          <p className="mt-1 text-[11px] text-neutral-500">
            Humidity: {humidity}%
          </p>
        )}
      </div>
    );
  };

  const renderStocks = (value: any) => {
    if (Array.isArray(value)) {
      return (
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          {value.slice(0, 4).map((item, idx) => {
            if (typeof item !== "object" || item === null) return null;
            const symbol =
              (item.symbol as string) ||
              (item.ticker as string) ||
              String(item.id || `Stock ${idx + 1}`);
            const price =
              (item.price as number) ||
              (item.last as number) ||
              (item.close as number);
            const change =
              (item.change as number) ||
              (item.percent_change as number) ||
              (item.changePercent as number);

            return (
              <div
                key={symbol + idx}
                className="border border-dashed border-neutral-300 rounded-lg p-2"
              >
                <p className="text-[11px] font-semibold">{symbol}</p>
                {typeof price === "number" && (
                  <p className="text-sm font-semibold">{price.toFixed(2)}</p>
                )}
                {typeof change === "number" && (
                  <p
                    className={`text-[11px] ${
                      change >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {change >= 0 ? "+" : ""}
                    {change.toFixed(2)}%
                  </p>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (typeof value === "object" && value !== null) {
      // maybe { symbol: { price: ... } } like coingecko style
      const entries = Object.entries(value).slice(0, 4);

      return (
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          {entries.map(([symbol, v]) => {
            const inner = v as any;
            const price =
              inner?.usd ??
              inner?.price ??
              inner?.last ??
              inner?.close ??
              undefined;
            return (
              <div
                key={symbol}
                className="border border-dashed border-neutral-300 rounded-lg p-2"
              >
                <p className="text-[11px] font-semibold uppercase">
                  {symbol}
                </p>
                {typeof price === "number" && (
                  <p className="text-sm font-semibold">{price.toFixed(2)}</p>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return renderRaw(value);
  };

  const renderExchangeRates = (value: any) => {
    if (typeof value === "object" && value !== null) {
      const base =
        (value.base as string) ||
        (value.base_currency as string) ||
        "Base";
      const rates =
        (value.rates as Record<string, number>) ||
        (value.data as Record<string, number>) ||
        value;
      const entries = Object.entries(rates)
        .filter(([, v]) => typeof v === "number")
        .slice(0, 6);

      return (
        <div className="mt-2 border border-dashed border-neutral-300 rounded-lg p-3 text-xs">
          <p className="text-[11px] text-neutral-500 mb-1">
            Base currency: <span className="font-semibold">{base}</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {entries.map(([code, rate]) => (
              <div
                key={code}
                className="border border-neutral-200 rounded-lg px-2 py-1"
              >
                <p className="text-[11px] font-semibold">{code}</p>
                <p className="text-xs text-neutral-700">
                  {(rate as number).toFixed(3)}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return renderRaw(value);
  };

  const renderMediaList = (value: any, kind: "movie" | "book" | "game" | "news" | "model" | "sport") => {
    let items: any[] = [];

    if (Array.isArray(value)) {
      items = value;
    } else if (typeof value === "object" && value !== null) {
      // common API patterns
      items =
        (value.results as any[]) ||
        (value.items as any[]) ||
        (value.articles as any[]) ||
        [];
    }

    if (!items.length) return renderList(value);

    return (
      <div className="mt-2 border border-dashed border-neutral-300 rounded-lg p-3 text-[11px] space-y-2 max-h-48 overflow-auto">
        {items.slice(0, 8).map((item, idx) => {
          if (typeof item !== "object" || item === null) return null;

          const title =
            (item.title as string) ||
            (item.name as string) ||
            (item.headline as string) ||
            (item.id && String(item.id)) ||
            `Item ${idx + 1}`;

          const subtitle =
            (item.overview as string) ||
            (item.description as string) ||
            (item.summary as string) ||
            (item.snippet as string) ||
            "";

          let meta = "";
          if (kind === "movie") {
            meta =
              (item.release_date as string) ||
              (item.year && String(item.year)) ||
              "";
          } else if (kind === "book") {
            meta =
              (item.author as string) ||
              (item.authors && (item.authors as string[]).join(", ")) ||
              "";
          } else if (kind === "news") {
            meta =
              (item.source?.name as string) ||
              (item.source as string) ||
              (item.publishedAt as string) ||
              "";
          } else if (kind === "game") {
            meta =
              (item.platform as string) ||
              (item.platforms && (item.platforms as string[]).join(", ")) ||
              "";
          } else if (kind === "model") {
            meta =
              (item.provider as string) ||
              (item.owner as string) ||
              "";
          } else if (kind === "sport") {
            meta =
              (item.league as string) ||
              (item.competition as string) ||
              "";
          }

          return (
            <div key={idx} className="flex flex-col gap-0.5 border-b last:border-b-0 border-neutral-200 pb-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-neutral-900 truncate">
                  {title}
                </span>
                {meta && (
                  <span className="text-[10px] text-neutral-500 truncate max-w-[40%] text-right">
                    {meta}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-[10px] text-neutral-600 line-clamp-2">
                  {subtitle}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────
  // Main content chooser
  // ─────────────────────────────────────────────────────

  const renderContent = () => {
    if (widget.type === "editable") {
      return (
        <div className="mt-2 border border-dashed border-neutral-300 rounded-lg p-3">
          <textarea
            rows={5}
            className="w-full text-xs text-neutral-800 outline-none resize-none"
            placeholder="Write anything here…"
            value={editableContent}
            onChange={(e) => setEditableContent(e.target.value)}
          />
        </div>
      );
    }

    if (status.state === "loading") {
      return (
        <div className="mt-2 text-[11px] text-neutral-500">
          Fetching data…
        </div>
      );
    }

    if (status.state === "error" || !data) {
      return (
        <div className="mt-2 border border-dashed border-neutral-300 rounded-lg p-3 text-[11px] text-neutral-500">
          {status.state === "error"
            ? status.message
            : "No data yet. Add an API source and we’ll render it nicely."}
        </div>
      );
    }

    // Domain-specific first
    if (widget.type === "weather") return renderWeather(data);
    if (widget.type === "stocks") return renderStocks(data);
    if (widget.type === "exchangeRates") return renderExchangeRates(data);
    if (widget.type === "movies") return renderMediaList(data, "movie");
    if (widget.type === "books") return renderMediaList(data, "book");
    if (widget.type === "aiModels") return renderMediaList(data, "model");
    if (widget.type === "news") return renderMediaList(data, "news");
    if (widget.type === "sports") return renderMediaList(data, "sport");
    if (widget.type === "gaming") return renderMediaList(data, "game");

    // Generic display based on presentation
    if (status.state === "success") {
      const { presentation } = status;
      if (presentation === "stats") return renderStats(data);
      if (presentation === "list") return renderList(data);
      if (presentation === "text") return renderText(data);
      return renderRaw(data);
    }

    return renderRaw(data);
  };

  const renderStatusBadge = () => {
    if (widget.type === "editable") {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-neutral-300 text-neutral-500">
          Local
        </span>
      );
    }

    if (status.state === "idle") {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-neutral-300 text-neutral-500">
          No source
        </span>
      );
    }
    if (status.state === "loading") {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-blue-300 text-blue-600">
          Checking…
        </span>
      );
    }
    if (status.state === "error") {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-red-300 text-red-600">
          Invalid
        </span>
      );
    }
    if (status.state === "success") {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-300 text-emerald-700">
          {status.presentation.toUpperCase()}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="border border-neutral-200 rounded-xl p-4 flex flex-col gap-2 bg-white">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-medium">{widget.title}</h2>
          <p className="text-[11px] text-neutral-500 uppercase tracking-[0.14em]">
            {labelForType(widget.type)}
          </p>
        </div>
        <button
          onClick={() => onRemove(widget.id)}
          className="text-[11px] text-neutral-400 hover:text-black"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px] mt-1">
        <div className="flex items-center gap-2">
          {renderStatusBadge()}
          {status.state === "success" && (
            <span className="text-neutral-500">Shape: {status.shape}</span>
          )}
        </div>
        {shouldUseApi && (
          <button
            type="button"
            onClick={testApi}
            className="border border-neutral-300 rounded-full px-2 py-0.5 text-[10px] hover:bg-neutral-100"
          >
            Retry
          </button>
        )}
      </div>

      {status.state === "error" && widget.type !== "editable" && (
        <p className="mt-1 text-[11px] text-red-600">{status.message}</p>
      )}
      {status.state === "success" && (
        <p className="mt-1 text-[11px] text-neutral-500">{status.message}</p>
      )}

      {renderContent()}

      {widget.apiUrl && widget.type !== "editable" && (
        <p className="mt-1 text-[10px] text-neutral-400 break-all">
          Source: <span className="font-mono">{widget.apiUrl}</span>
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Dashboard component
// ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: 1, label: "Overview" },
    { id: 2, label: "Analytics" },
    { id: 3, label: "Settings" },
  ]);

  const [widgets, setWidgets] = useState<Widget[]>([
    { id: 1, title: "Traffic (auto)", type: "auto" },
    { id: 2, title: "Notes (editable)", type: "editable" },
  ]);

  const [newMenuLabel, setNewMenuLabel] = useState("");
  const [newWidgetTitle, setNewWidgetTitle] = useState("");
  const [newWidgetType, setNewWidgetType] = useState<WidgetType>("auto");
  const [newWidgetApiUrl, setNewWidgetApiUrl] = useState("");

  const handleAddMenuItem = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newMenuLabel.trim();
    if (!trimmed) return;

    setMenuItems((prev) => [...prev, { id: Date.now(), label: trimmed }]);
    setNewMenuLabel("");
  };

  const handleAddWidget = (e: FormEvent) => {
    e.preventDefault();
    const title = newWidgetTitle.trim();
    if (!title) return;

    setWidgets((prev) => [
      ...prev,
      {
        id: Date.now(),
        title,
        type: newWidgetType,
        apiUrl:
          newWidgetType === "editable"
            ? undefined
            : newWidgetApiUrl.trim() || undefined,
      },
    ]);

    setNewWidgetTitle("");
    setNewWidgetApiUrl("");
  };

  const handleRemoveWidget = (id: number) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const typeGroups: { label: string; types: WidgetType[] }[] = [
    {
      label: "Display mode",
      types: ["auto", "stats", "text", "list", "raw"],
    },
    {
      label: "Domain-specific",
      types: [
        "weather",
        "stocks",
        "exchangeRates",
        "movies",
        "books",
        "aiModels",
        "news",
        "sports",
        "gaming",
      ],
    },
    {
      label: "Other",
      types: ["editable"],
    },
  ];

  return (
    <div className="h-screen w-screen bg-white text-black flex overflow-hidden">
      {/* Sidebar */}
      <aside className="h-full w-64 border-r border-neutral-200 flex flex-col">
        <div className="px-4 py-4 border-b border-neutral-200 flex items-center gap-2">
          <div className="h-7 w-7 rounded-md border border-black flex items-center justify-center text-xs font-semibold">
            DB
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium tracking-[0.16em] uppercase text-neutral-500">
              Dashboard
            </span>
            <span className="text-xs text-neutral-500">Headless admin</span>
          </div>
        </div>

        {/* Menu list */}
        <div className="flex-1 overflow-y-auto">
          <nav className="px-3 py-4 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className="w-full flex items-center justify-between text-left text-sm px-3 py-2 rounded-lg hover:bg-neutral-100"
              >
                <span>{item.label}</span>
                <span className="text-[10px] text-neutral-400">•••</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Add menu form */}
        <div className="border-t border-neutral-200 p-3">
          <form onSubmit={handleAddMenuItem} className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
              Add menu item
            </p>
            <input
              type="text"
              value={newMenuLabel}
              onChange={(e) => setNewMenuLabel(e.target.value)}
              placeholder="Label"
              className="w-full border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-black"
            />
            <button
              type="submit"
              className="w-full text-xs border border-black rounded-full py-1.5 hover:bg-black hover:text-white transition-colors"
            >
              Add
            </button>
          </form>
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-14 border-b border-neutral-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-medium">Admin dashboard</h1>
            <span className="text-[11px] text-neutral-400 border border-dashed border-neutral-300 rounded-full px-2 py-0.5">
              Headless
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <button className="border border-neutral-300 rounded-full px-3 py-1 hover:bg-neutral-100">
              Save layout (hook to persistence later)
            </button>
            <div className="h-7 w-7 rounded-full border border-neutral-300 flex items-center justify-center text-[11px]">
              U
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="flex-1 flex overflow-hidden">
          {/* Widgets area */}
          <div className="flex-1 h-full overflow-y-auto px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                  Widgets
                </p>
                <p className="text-xs text-neutral-500">
                  Add widgets, connect APIs, and the dashboard will try to format the data nicely.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {widgets.map((widget) => (
                <WidgetCard key={widget.id} widget={widget} onRemove={handleRemoveWidget} />
              ))}
            </div>
          </div>

          {/* Add widget panel */}
          <aside className="w-80 border-l border-neutral-200 h-full flex flex-col">
            <div className="px-4 py-4 border-b border-neutral-200">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                Add widget
              </p>
              <p className="text-xs text-neutral-500">
                Choose a type and (optionally) connect it to an API.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <form onSubmit={handleAddWidget} className="space-y-3">
                <div className="space-y-1">
                  <label
                    htmlFor="widget-title"
                    className="text-[11px] font-medium text-neutral-700"
                  >
                    Widget title
                  </label>
                  <input
                    id="widget-title"
                    type="text"
                    value={newWidgetTitle}
                    onChange={(e) => setNewWidgetTitle(e.target.value)}
                    placeholder="e.g. Weather, Top news, My notes"
                    className="w-full border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-medium text-neutral-700">Type</p>
                  {typeGroups.map((group) => (
                    <div key={group.label} className="space-y-1">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                        {group.label}
                      </p>
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        {group.types.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setNewWidgetType(type)}
                            className={`border rounded-full px-2.5 py-1 ${
                              newWidgetType === type
                                ? "border-black bg-black text-white"
                                : "border-neutral-300 text-neutral-600 hover:bg-neutral-100"
                            }`}
                          >
                            {labelForType(type)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="widget-api"
                    className="text-[11px] font-medium text-neutral-700"
                  >
                    API source {newWidgetType === "editable" && "(ignored for editable)"}
                  </label>
                  <input
                    id="widget-api"
                    type="url"
                    value={newWidgetApiUrl}
                    onChange={(e) => setNewWidgetApiUrl(e.target.value)}
                    placeholder={placeholderForType(newWidgetType)}
                    disabled={newWidgetType === "editable"}
                    className={`w-full border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-black ${
                      newWidgetType === "editable" ? "bg-neutral-100 text-neutral-400" : ""
                    }`}
                  />
                  <p className="text-[10px] text-neutral-500">
                    Must return JSON. The dashboard will try to format it as cards, stats, or lists
                    instead of raw arrays.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full text-xs border border-black rounded-full py-1.5 mt-1 hover:bg-black hover:text-white transition-colors"
                >
                  Add widget
                </button>
              </form>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
