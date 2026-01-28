import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { Widget, WidgetType } from "./types";

type Shape = "array" | "object" | "string" | "number" | "boolean" | "null" | "unknown";
type Presentation = "stats" | "list" | "text" | "raw" | "table" | "cards" | "timeline" | "progress" | "gauge" | "kpi" | "lineChart" | "barChart" | "pieChart" | "areaChart" | "donutChart";

// Chart color palette
const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
];

// ============================================================================
// VALUE FORMATTERS
// ============================================================================

const formatNumber = (value: number, options?: {
  style?: 'decimal' | 'currency' | 'percent' | 'compact';
  currency?: string;
  decimals?: number;
}): string => {
  const { style = 'decimal', currency = 'USD', decimals = 2 } = options || {};

  if (style === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  if (style === 'percent') {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  }

  if (style === 'compact') {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(value);
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
};

const formatDate = (value: string | Date, style: 'short' | 'medium' | 'long' | 'relative' = 'medium'): string => {
  const date = typeof value === 'string' ? new Date(value) : value;

  if (isNaN(date.getTime())) return String(value);

  if (style === 'relative') {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 30) return date.toLocaleDateString();
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  const options: Intl.DateTimeFormatOptions = style === 'short'
    ? { month: 'short', day: 'numeric' }
    : style === 'long'
    ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    : { year: 'numeric', month: 'short', day: 'numeric' };

  return date.toLocaleDateString('en-US', options);
};

const detectValueType = (value: unknown): 'currency' | 'percent' | 'date' | 'url' | 'email' | 'boolean' | 'number' | 'string' | 'object' | 'array' => {
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'array';
  if (value && typeof value === 'object') return 'object';
  if (typeof value === 'number') return 'number';
  if (typeof value !== 'string') return 'string';

  // String pattern detection
  if (/^https?:\/\//.test(value)) return 'url';
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'email';
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
  if (/^\$[\d,.]+/.test(value) || /^[\d,.]+\s*(USD|EUR|GBP)$/i.test(value)) return 'currency';
  if (/^\d+(\.\d+)?%$/.test(value)) return 'percent';

  return 'string';
};

// ============================================================================
// STYLED VALUE RENDERERS
// ============================================================================

const renderFormattedValue = (key: string, value: unknown, compact = false): React.ReactNode => {
  const keyLower = key.toLowerCase();

  // Boolean rendering
  if (typeof value === 'boolean') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
        value
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-neutral-100 text-neutral-500'
      }`}>
        {value ? (
          <>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {compact ? '' : 'Yes'}
          </>
        ) : (
          <>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {compact ? '' : 'No'}
          </>
        )}
      </span>
    );
  }

  // Number rendering with smart formatting
  if (typeof value === 'number') {
    // Currency detection
    if (keyLower.includes('price') || keyLower.includes('cost') || keyLower.includes('amount') ||
        keyLower.includes('revenue') || keyLower.includes('salary') || keyLower.includes('budget')) {
      return <span className="font-mono text-emerald-700">{formatNumber(value, { style: 'currency' })}</span>;
    }

    // Percentage detection
    if (keyLower.includes('percent') || keyLower.includes('rate') || keyLower.includes('ratio') ||
        keyLower.includes('growth') || keyLower.includes('change')) {
      const isPositive = value >= 0;
      return (
        <span className={`font-mono ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{value.toFixed(2)}%
        </span>
      );
    }

    // Large number formatting
    if (Math.abs(value) >= 1000000) {
      return <span className="font-mono">{formatNumber(value, { style: 'compact' })}</span>;
    }

    // Count/quantity
    if (keyLower.includes('count') || keyLower.includes('total') || keyLower.includes('quantity')) {
      return <span className="font-semibold">{formatNumber(value)}</span>;
    }

    return <span className="font-mono">{formatNumber(value)}</span>;
  }

  // String rendering
  if (typeof value === 'string') {
    // URL rendering
    if (/^https?:\/\//.test(value)) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline truncate inline-flex items-center gap-1"
        >
          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span className="truncate">{compact ? 'Link' : new URL(value).hostname}</span>
        </a>
      );
    }

    // Email rendering
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return (
        <a href={`mailto:${value}`} className="text-blue-600 hover:underline truncate">
          {value}
        </a>
      );
    }

    // Date rendering
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return <span className="text-neutral-600">{formatDate(value, compact ? 'short' : 'medium')}</span>;
    }

    // Status-like values
    const statusColors: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-700',
      inactive: 'bg-neutral-100 text-neutral-600',
      pending: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-blue-100 text-blue-700',
      success: 'bg-emerald-100 text-emerald-700',
      error: 'bg-red-100 text-red-700',
      failed: 'bg-red-100 text-red-700',
      warning: 'bg-orange-100 text-orange-700',
      processing: 'bg-purple-100 text-purple-700',
      draft: 'bg-neutral-100 text-neutral-600',
      published: 'bg-emerald-100 text-emerald-700',
      archived: 'bg-neutral-100 text-neutral-500',
      cancelled: 'bg-red-100 text-red-600',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      open: 'bg-blue-100 text-blue-700',
      closed: 'bg-neutral-100 text-neutral-600',
      new: 'bg-blue-100 text-blue-700',
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-emerald-100 text-emerald-700',
      critical: 'bg-red-100 text-red-700',
    };

    const statusClass = statusColors[value.toLowerCase()];
    if (statusClass && (keyLower.includes('status') || keyLower.includes('state') || keyLower.includes('priority') || keyLower.includes('level'))) {
      return (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${statusClass}`}>
          {value}
        </span>
      );
    }

    return <span className="truncate">{value}</span>;
  }

  // Array rendering
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-neutral-400 italic">Empty</span>;
    if (value.length <= 3 && value.every(v => typeof v === 'string' || typeof v === 'number')) {
      return (
        <span className="flex flex-wrap gap-1">
          {value.map((v, i) => (
            <span key={i} className="bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded text-[10px]">
              {String(v)}
            </span>
          ))}
        </span>
      );
    }
    return <span className="text-neutral-500">{value.length} items</span>;
  }

  // Object rendering
  if (value && typeof value === 'object') {
    return <span className="text-neutral-500">{Object.keys(value).length} fields</span>;
  }

  // Null/undefined
  if (value === null || value === undefined) {
    return <span className="text-neutral-400 italic">—</span>;
  }

  return <span>{String(value)}</span>;
};

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

const defaultWidgetTone = {
  container: "bg-white border-neutral-200",
  badge: "border-neutral-300 text-neutral-500",
  accent: "text-neutral-500",
};

const widgetTone: Partial<Record<WidgetType, typeof defaultWidgetTone>> = {
  auto: { container: "bg-white border-neutral-200", badge: "border-neutral-300 text-neutral-600", accent: "text-neutral-600" },
  stats: { container: "bg-amber-50 border-amber-200", badge: "border-amber-300 text-amber-700", accent: "text-amber-700" },
  kpi: { container: "bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200", badge: "border-indigo-300 text-indigo-700", accent: "text-indigo-700" },
  text: { container: "bg-indigo-50 border-indigo-200", badge: "border-indigo-300 text-indigo-700", accent: "text-indigo-700" },
  list: { container: "bg-blue-50 border-blue-200", badge: "border-blue-300 text-blue-700", accent: "text-blue-700" },
  table: { container: "bg-slate-50 border-slate-200", badge: "border-slate-300 text-slate-700", accent: "text-slate-700" },
  cards: { container: "bg-gradient-to-br from-rose-50 to-orange-50 border-rose-200", badge: "border-rose-300 text-rose-700", accent: "text-rose-700" },
  timeline: { container: "bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200", badge: "border-cyan-300 text-cyan-700", accent: "text-cyan-700" },
  progress: { container: "bg-emerald-50 border-emerald-200", badge: "border-emerald-300 text-emerald-700", accent: "text-emerald-700" },
  gauge: { container: "bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200", badge: "border-violet-300 text-violet-700", accent: "text-violet-700" },
  raw: { container: "bg-slate-50 border-slate-200", badge: "border-slate-300 text-slate-700", accent: "text-slate-700" },
  lineChart: { container: "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200", badge: "border-blue-300 text-blue-700", accent: "text-blue-700" },
  barChart: { container: "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200", badge: "border-emerald-300 text-emerald-700", accent: "text-emerald-700" },
  pieChart: { container: "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200", badge: "border-purple-300 text-purple-700", accent: "text-purple-700" },
  areaChart: { container: "bg-gradient-to-br from-cyan-50 to-sky-50 border-cyan-200", badge: "border-cyan-300 text-cyan-700", accent: "text-cyan-700" },
  donutChart: { container: "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200", badge: "border-amber-300 text-amber-700", accent: "text-amber-700" },
  map: { container: "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200", badge: "border-green-300 text-green-700", accent: "text-green-700" },
  kanban: { container: "bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200", badge: "border-slate-300 text-slate-700", accent: "text-slate-700" },
  weather: { container: "bg-sky-50 border-sky-200", badge: "border-sky-300 text-sky-700", accent: "text-sky-700" },
  stocks: { container: "bg-emerald-50 border-emerald-200", badge: "border-emerald-300 text-emerald-700", accent: "text-emerald-700" },
  exchangeRates: { container: "bg-teal-50 border-teal-200", badge: "border-teal-300 text-teal-700", accent: "text-teal-700" },
  movies: { container: "bg-rose-50 border-rose-200", badge: "border-rose-300 text-rose-700", accent: "text-rose-700" },
  books: { container: "bg-amber-50 border-amber-200", badge: "border-amber-300 text-amber-700", accent: "text-amber-700" },
  aiModels: { container: "bg-purple-50 border-purple-200", badge: "border-purple-300 text-purple-700", accent: "text-purple-700" },
  news: { container: "bg-orange-50 border-orange-200", badge: "border-orange-300 text-orange-700", accent: "text-orange-700" },
  sports: { container: "bg-lime-50 border-lime-200", badge: "border-lime-300 text-lime-700", accent: "text-lime-700" },
  gaming: { container: "bg-fuchsia-50 border-fuchsia-200", badge: "border-fuchsia-300 text-fuchsia-700", accent: "text-fuchsia-700" },
  editable: { container: "bg-neutral-50 border-neutral-200", badge: "border-neutral-300 text-neutral-700", accent: "text-neutral-700" },
};

const toneFor = (type: WidgetType) => widgetTone[type] ?? defaultWidgetTone;

const getShape = (value: any): Shape => {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  const t = typeof value;
  if (t === "object" || t === "string" || t === "number" || t === "boolean") return t;
  return "unknown";
};

const inferPresentation = (data: any): Presentation => {
  const shape = getShape(data);

  if (shape === "array") {
    const arr = data as any[];
    if (arr.length === 0) return "raw";
    const first = arr[0];

    if (typeof first === "object" && first !== null) {
      const keys = Object.keys(first);

      // Check for chart-suitable data (date/time + numeric values)
      const hasDateField = keys.some(k =>
        k.toLowerCase().includes('date') ||
        k.toLowerCase().includes('time') ||
        k.toLowerCase().includes('month') ||
        k.toLowerCase().includes('year') ||
        k.toLowerCase().includes('day') ||
        k.toLowerCase().includes('period')
      );
      const numericKeys = keys.filter(k => typeof first[k] === 'number');

      // Line chart: has date/time field with numeric values
      if (hasDateField && numericKeys.length >= 1 && arr.length >= 3) {
        return "lineChart";
      }

      // Bar chart: has categorical field with numeric value
      const hasCategoryField = keys.some(k =>
        k.toLowerCase().includes('name') ||
        k.toLowerCase().includes('category') ||
        k.toLowerCase().includes('label') ||
        k.toLowerCase().includes('type') ||
        k.toLowerCase().includes('group')
      );
      if (hasCategoryField && numericKeys.length >= 1 && arr.length >= 2 && arr.length <= 15) {
        return "barChart";
      }

      // Pie chart: small dataset with category + single value
      if (arr.length >= 2 && arr.length <= 8 && numericKeys.length === 1) {
        const hasLabel = keys.some(k =>
          k.toLowerCase().includes('name') ||
          k.toLowerCase().includes('label') ||
          k.toLowerCase().includes('category')
        );
        if (hasLabel) return "pieChart";
      }

      // Check if it looks like timeline data
      const hasEventField = keys.some(k =>
        k.toLowerCase().includes('event') ||
        k.toLowerCase().includes('title') ||
        k.toLowerCase().includes('action')
      );
      if (hasDateField && hasEventField && arr.length <= 10) return "timeline";

      // Check if it looks like table data (multiple columns, uniform structure)
      if (keys.length >= 3 && arr.length >= 3) return "table";

      // Check if it has images (card view)
      const hasImage = keys.some(k =>
        k.toLowerCase().includes('image') ||
        k.toLowerCase().includes('avatar') ||
        k.toLowerCase().includes('thumbnail') ||
        k.toLowerCase().includes('photo')
      );
      if (hasImage) return "cards";

      return "list";
    }
    return "list";
  }

  if (shape === "object") {
    const obj = data as Record<string, any>;
    const entries = Object.entries(obj);
    const numericCount = entries.filter(([, v]) => typeof v === "number").length;
    const numericEntries = entries.filter(([, v]) => typeof v === "number");

    // Check for nested array data that could be charted
    const arrayEntry = entries.find(([k, v]) =>
      Array.isArray(v) && v.length > 0 &&
      (k.toLowerCase().includes('data') ||
       k.toLowerCase().includes('results') ||
       k.toLowerCase().includes('items') ||
       k.toLowerCase().includes('series') ||
       k.toLowerCase().includes('values'))
    );
    if (arrayEntry) {
      const [, arrData] = arrayEntry;
      return inferPresentation(arrData);
    }

    // Pie/donut chart: object with multiple numeric values representing distribution
    if (numericCount >= 3 && numericCount <= 8 && numericCount === entries.length) {
      return "pieChart";
    }

    // Single percentage-like value - show gauge
    if (numericEntries.length === 1) {
      const [key, val] = numericEntries[0];
      if ((val as number) >= 0 && (val as number) <= 100 &&
          (key.toLowerCase().includes('percent') ||
           key.toLowerCase().includes('progress') ||
           key.toLowerCase().includes('completion') ||
           key.toLowerCase().includes('rate') ||
           key.toLowerCase().includes('score'))) {
        return "gauge";
      }
    }

    // Multiple numeric values - check for progress-like data
    if (numericCount >= 2 && numericCount <= 5 && numericCount === entries.length) {
      const allSmallish = numericEntries.every(([, v]) => (v as number) <= 1000);
      if (allSmallish) return "progress";
    }

    // KPI-style data with mixed types
    if (entries.length >= 2 && entries.length <= 6 && numericCount >= 1) {
      return "kpi";
    }

    // Mostly numeric - stats view
    if (numericCount >= 1 && numericCount >= entries.length / 2) {
      return "stats";
    }

    // Check for nested arrays (could be table data)
    const hasArrays = entries.some(([k, v]) =>
      Array.isArray(v) &&
      (k.toLowerCase().includes('data') ||
       k.toLowerCase().includes('results') ||
       k.toLowerCase().includes('items'))
    );
    if (hasArrays) return "table";

    const hasNested = entries.some(([, v]) => typeof v === "object" && v !== null);
    if (hasNested) return "list";

    return "text";
  }

  if (shape === "string") return "text";
  if (shape === "number") return "gauge";

  return "raw";
};

const labelForType = (type: WidgetType): string => {
  switch (type) {
    case "auto":
      return "Auto";
    case "stats":
      return "Stats";
    case "kpi":
      return "KPI";
    case "text":
      return "Text";
    case "list":
      return "List";
    case "table":
      return "Table";
    case "cards":
      return "Cards";
    case "timeline":
      return "Timeline";
    case "progress":
      return "Progress";
    case "gauge":
      return "Gauge";
    case "raw":
      return "Raw JSON";
    case "lineChart":
      return "Line Chart";
    case "barChart":
      return "Bar Chart";
    case "pieChart":
      return "Pie Chart";
    case "areaChart":
      return "Area Chart";
    case "donutChart":
      return "Donut Chart";
    case "map":
      return "Map";
    case "kanban":
      return "Kanban";
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
};

type WidgetCardProps = {
  widget: Widget;
  onRemove: (id: number) => void;
};

export default function WidgetCard({ widget, onRemove }: WidgetCardProps) {
  const [status, setStatus] = useState<WidgetStatus>({ state: "idle" });
  const [data, setData] = useState<any>(null);
  const [editableContent, setEditableContent] = useState<string>("");
  const tone = toneFor(widget.type);

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
          : ((widget.type === "stats"
              ? "stats"
              : widget.type === "text"
              ? "text"
              : widget.type === "list"
              ? "list"
              : "raw") as Presentation);

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

  const renderRaw = (value: any) => (
    <pre className="mt-2 border border-dashed border-neutral-300 rounded-lg p-3 text-[10px] text-neutral-600 max-h-40 overflow-auto bg-neutral-50/50">
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
      .slice(0, 6);

    if (entries.length === 0) return renderRaw(value);

    const colors = [
      { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: 'text-blue-600' },
      { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', accent: 'text-emerald-600' },
      { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', accent: 'text-amber-600' },
      { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', accent: 'text-purple-600' },
      { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', accent: 'text-rose-600' },
      { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', accent: 'text-cyan-600' },
    ];

    return (
      <div className={`mt-2 grid ${entries.length <= 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'} gap-2 text-xs`}>
        {entries.map(([key, val], idx) => {
          const color = colors[idx % colors.length];
          const numVal = val as number;
          const keyLower = key.toLowerCase();
          const isPercent = keyLower.includes('percent') || keyLower.includes('rate') || keyLower.includes('ratio');
          const isCurrency = keyLower.includes('price') || keyLower.includes('cost') || keyLower.includes('amount') || keyLower.includes('revenue');

          return (
            <div
              key={key}
              className={`${color.bg} ${color.border} border rounded-xl p-3 transition-all hover:shadow-md`}
            >
              <p className={`text-[10px] uppercase tracking-wide ${color.accent} font-medium`}>
                {key.replace(/[_-]/g, " ")}
              </p>
              <p className={`text-lg font-bold ${color.text} mt-1`}>
                {isCurrency
                  ? formatNumber(numVal, { style: 'currency' })
                  : isPercent
                  ? `${numVal.toFixed(1)}%`
                  : Math.abs(numVal) >= 1000
                  ? formatNumber(numVal, { style: 'compact' })
                  : formatNumber(numVal)}
              </p>
              {isPercent && (
                <div className="mt-2 h-1.5 bg-white/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${numVal >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(Math.abs(numVal), 100)}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // KPI Cards with trend indicators
  const renderKPI = (value: any) => {
    const obj = Array.isArray(value) && value.length > 0 ? value[0] : value;
    if (typeof obj !== "object" || obj === null) return renderStats(value);

    const entries = Object.entries(obj).slice(0, 4);

    return (
      <div className="mt-2 space-y-2">
        {entries.map(([key, val]) => {
          const isNumeric = typeof val === 'number';
          const trend = Math.random() > 0.5 ? 'up' : 'down'; // Simulated trend
          const trendValue = (Math.random() * 20 - 10).toFixed(1);

          return (
            <div key={key} className="flex items-center justify-between p-3 bg-gradient-to-r from-neutral-50 to-white border border-neutral-200 rounded-xl">
              <div>
                <p className="text-[10px] text-neutral-500 uppercase tracking-wide">
                  {key.replace(/[_-]/g, " ")}
                </p>
                <p className="text-xl font-bold text-neutral-800">
                  {isNumeric ? formatNumber(val as number, { style: 'compact' }) : String(val)}
                </p>
              </div>
              {isNumeric && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                  trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  <svg className={`w-4 h-4 ${trend === 'down' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span className="text-xs font-semibold">{trendValue}%</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Table view for structured data
  const renderTable = (value: any) => {
    let items: any[] = [];

    if (Array.isArray(value)) {
      items = value;
    } else if (typeof value === 'object' && value !== null) {
      items = (value.data as any[]) || (value.results as any[]) || (value.items as any[]) || [value];
    }

    if (items.length === 0 || typeof items[0] !== 'object') return renderList(value);

    const columns = Object.keys(items[0]).slice(0, 5);

    return (
      <div className="mt-2 border border-neutral-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                {columns.map((col) => (
                  <th key={col} className="text-left px-3 py-2 font-semibold text-neutral-600 uppercase tracking-wide text-[10px]">
                    {col.replace(/[_-]/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.slice(0, 8).map((item, idx) => (
                <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-2 text-neutral-700">
                      {renderFormattedValue(col, item[col], true)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {items.length > 8 && (
          <div className="px-3 py-2 text-[10px] text-neutral-500 bg-neutral-50 border-t border-neutral-200">
            Showing 8 of {items.length} items
          </div>
        )}
      </div>
    );
  };

  // Cards view for visual display
  const renderCards = (value: any) => {
    let items: any[] = [];

    if (Array.isArray(value)) {
      items = value;
    } else if (typeof value === 'object' && value !== null) {
      items = (value.data as any[]) || (value.results as any[]) || (value.items as any[]) || [];
    }

    if (items.length === 0) return renderRaw(value);

    const gradients = [
      'from-blue-500 to-blue-600',
      'from-emerald-500 to-emerald-600',
      'from-purple-500 to-purple-600',
      'from-amber-500 to-amber-600',
      'from-rose-500 to-rose-600',
      'from-cyan-500 to-cyan-600',
    ];

    return (
      <div className="mt-2 grid grid-cols-2 gap-2">
        {items.slice(0, 6).map((item, idx) => {
          if (typeof item !== 'object' || item === null) return null;

          const title = (item.title as string) || (item.name as string) || `Item ${idx + 1}`;
          const subtitle = (item.description as string) || (item.subtitle as string) || '';
          const image = (item.image as string) || (item.thumbnail as string) || (item.avatar as string);
          const badge = (item.status as string) || (item.type as string) || (item.category as string);

          return (
            <div key={idx} className="border border-neutral-200 rounded-xl overflow-hidden hover:shadow-lg transition-all">
              {image ? (
                <div className="h-20 bg-neutral-100 relative overflow-hidden">
                  <img src={image} alt={title} className="w-full h-full object-cover" onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }} />
                </div>
              ) : (
                <div className={`h-12 bg-gradient-to-r ${gradients[idx % gradients.length]}`} />
              )}
              <div className="p-2">
                <p className="font-semibold text-xs truncate text-neutral-800">{title}</p>
                {subtitle && <p className="text-[10px] text-neutral-500 truncate mt-0.5">{subtitle}</p>}
                {badge && (
                  <span className="inline-block mt-1 px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded text-[9px] capitalize">
                    {badge}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Timeline view for date-based data
  const renderTimeline = (value: any) => {
    let items: any[] = [];

    if (Array.isArray(value)) {
      items = value;
    } else if (typeof value === 'object' && value !== null) {
      items = (value.events as any[]) || (value.data as any[]) || (value.items as any[]) || [];
    }

    if (items.length === 0) return renderList(value);

    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'];

    return (
      <div className="mt-2 relative">
        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-neutral-200" />
        <div className="space-y-3 pl-6">
          {items.slice(0, 6).map((item, idx) => {
            if (typeof item !== 'object' || item === null) return null;

            const title = (item.title as string) || (item.event as string) || (item.name as string) || `Event ${idx + 1}`;
            const date = (item.date as string) || (item.timestamp as string) || (item.created_at as string) || (item.time as string);
            const desc = (item.description as string) || (item.content as string) || '';

            return (
              <div key={idx} className="relative">
                <div className={`absolute -left-6 w-4 h-4 rounded-full ${colors[idx % colors.length]} border-2 border-white shadow`} />
                <div className="bg-white border border-neutral-200 rounded-lg p-2 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-xs text-neutral-800">{title}</p>
                    {date && (
                      <span className="text-[10px] text-neutral-500 whitespace-nowrap">
                        {formatDate(date, 'relative')}
                      </span>
                    )}
                  </div>
                  {desc && <p className="text-[10px] text-neutral-600 mt-1 line-clamp-2">{desc}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Progress bars view
  const renderProgress = (value: any) => {
    const obj = Array.isArray(value) ? value[0] : value;
    if (typeof obj !== 'object' || obj === null) return renderStats(value);

    const entries = Object.entries(obj)
      .filter(([, v]) => typeof v === 'number')
      .slice(0, 5);

    if (entries.length === 0) return renderRaw(value);

    const colors = [
      { bar: 'bg-blue-500', track: 'bg-blue-100' },
      { bar: 'bg-emerald-500', track: 'bg-emerald-100' },
      { bar: 'bg-purple-500', track: 'bg-purple-100' },
      { bar: 'bg-amber-500', track: 'bg-amber-100' },
      { bar: 'bg-rose-500', track: 'bg-rose-100' },
    ];

    const maxValue = Math.max(...entries.map(([, v]) => v as number));

    return (
      <div className="mt-2 space-y-3">
        {entries.map(([key, val], idx) => {
          const numVal = val as number;
          const percentage = maxValue > 0 ? (numVal / maxValue) * 100 : 0;
          const color = colors[idx % colors.length];

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-neutral-700 capitalize">
                  {key.replace(/[_-]/g, ' ')}
                </span>
                <span className="text-[11px] font-semibold text-neutral-800">
                  {formatNumber(numVal)}
                </span>
              </div>
              <div className={`h-2 rounded-full ${color.track} overflow-hidden`}>
                <div
                  className={`h-full rounded-full ${color.bar} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Gauge/meter view for single values
  const renderGauge = (value: any) => {
    let numVal: number;
    let label = 'Value';

    if (typeof value === 'number') {
      numVal = value;
    } else if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value).filter(([, v]) => typeof v === 'number');
      if (entries.length === 0) return renderStats(value);
      [label, numVal] = entries[0] as [string, number];
    } else {
      return renderRaw(value);
    }

    const percentage = Math.min(Math.max(numVal, 0), 100);
    const rotation = (percentage / 100) * 180 - 90;

    const getColor = (val: number) => {
      if (val >= 75) return { text: 'text-emerald-600', bg: 'stroke-emerald-500' };
      if (val >= 50) return { text: 'text-amber-600', bg: 'stroke-amber-500' };
      if (val >= 25) return { text: 'text-orange-600', bg: 'stroke-orange-500' };
      return { text: 'text-red-600', bg: 'stroke-red-500' };
    };

    const color = getColor(percentage);

    return (
      <div className="mt-2 flex flex-col items-center">
        <div className="relative w-32 h-16 overflow-hidden">
          <svg className="w-32 h-32 -mt-0" viewBox="0 0 100 50">
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              className={color.bg}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(percentage / 100) * 126} 126`}
            />
          </svg>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
            <p className={`text-2xl font-bold ${color.text}`}>{Math.round(percentage)}%</p>
          </div>
        </div>
        <p className="text-[11px] text-neutral-500 mt-1 capitalize">{label.replace(/[_-]/g, ' ')}</p>
      </div>
    );
  };

  // Line Chart rendering
  const renderLineChart = (value: any) => {
    let items: any[] = [];

    if (Array.isArray(value)) {
      items = value;
    } else if (typeof value === 'object' && value !== null) {
      items = (value.data as any[]) || (value.results as any[]) || (value.items as any[]) || (value.series as any[]) || [];
    }

    if (items.length === 0 || typeof items[0] !== 'object') return renderRaw(value);

    const first = items[0];
    const keys = Object.keys(first);

    // Find date/label field
    const labelField = keys.find(k =>
      k.toLowerCase().includes('date') ||
      k.toLowerCase().includes('time') ||
      k.toLowerCase().includes('month') ||
      k.toLowerCase().includes('year') ||
      k.toLowerCase().includes('name') ||
      k.toLowerCase().includes('label') ||
      k.toLowerCase().includes('period')
    ) || keys[0];

    // Find numeric fields for lines
    const numericFields = keys.filter(k => typeof first[k] === 'number').slice(0, 4);

    if (numericFields.length === 0) return renderTable(value);

    return (
      <div className="mt-2 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={items} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={labelField}
              tick={{ fontSize: 10 }}
              tickFormatter={(val) => {
                if (typeof val === 'string' && val.match(/^\d{4}-\d{2}/)) {
                  return new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }
                return String(val).slice(0, 10);
              }}
            />
            <YAxis tick={{ fontSize: 10 }} width={40} />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8 }}
              labelFormatter={(val) => typeof val === 'string' && val.match(/^\d{4}/) ? formatDate(val) : val}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {numericFields.map((field, idx) => (
              <Line
                key={field}
                type="monotone"
                dataKey={field}
                stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name={field.replace(/[_-]/g, ' ')}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Bar Chart rendering
  const renderBarChart = (value: any) => {
    let items: any[] = [];

    if (Array.isArray(value)) {
      items = value;
    } else if (typeof value === 'object' && value !== null) {
      // Convert object to array for bar chart
      const entries = Object.entries(value).filter(([, v]) => typeof v === 'number');
      if (entries.length > 0) {
        items = entries.map(([name, value]) => ({ name, value }));
      } else {
        items = (value.data as any[]) || (value.results as any[]) || (value.items as any[]) || [];
      }
    }

    if (items.length === 0) return renderRaw(value);

    const first = items[0];
    const keys = Object.keys(first);

    // Find label field
    const labelField = keys.find(k =>
      k.toLowerCase().includes('name') ||
      k.toLowerCase().includes('label') ||
      k.toLowerCase().includes('category') ||
      k.toLowerCase().includes('type')
    ) || keys[0];

    // Find numeric fields
    const numericFields = keys.filter(k => typeof first[k] === 'number').slice(0, 3);

    if (numericFields.length === 0) return renderTable(value);

    return (
      <div className="mt-2 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={labelField}
              tick={{ fontSize: 10 }}
              tickFormatter={(val) => String(val).slice(0, 12)}
            />
            <YAxis tick={{ fontSize: 10 }} width={40} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {numericFields.map((field, idx) => (
              <Bar
                key={field}
                dataKey={field}
                fill={CHART_COLORS[idx % CHART_COLORS.length]}
                radius={[4, 4, 0, 0]}
                name={field.replace(/[_-]/g, ' ')}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Pie Chart rendering
  const renderPieChart = (value: any, isDonut = false) => {
    let items: any[] = [];

    if (Array.isArray(value)) {
      items = value;
    } else if (typeof value === 'object' && value !== null) {
      // Convert object to array for pie chart
      const entries = Object.entries(value).filter(([, v]) => typeof v === 'number');
      if (entries.length > 0) {
        items = entries.map(([name, value]) => ({ name, value }));
      }
    }

    if (items.length === 0) return renderRaw(value);

    const first = items[0];
    const keys = Object.keys(first);

    // Find label and value fields
    const labelField = keys.find(k =>
      k.toLowerCase().includes('name') ||
      k.toLowerCase().includes('label') ||
      k.toLowerCase().includes('category')
    ) || keys.find(k => typeof first[k] === 'string') || keys[0];

    const valueField = keys.find(k => typeof first[k] === 'number') || 'value';

    return (
      <div className="mt-2 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={items}
              dataKey={valueField}
              nameKey={labelField}
              cx="50%"
              cy="50%"
              innerRadius={isDonut ? 40 : 0}
              outerRadius={70}
              paddingAngle={2}
              label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={{ stroke: '#6b7280', strokeWidth: 1 }}
            >
              {items.map((_, idx) => (
                <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8 }}
              formatter={(value) => typeof value === 'number' ? formatNumber(value) : value}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Area Chart rendering
  const renderAreaChart = (value: any) => {
    let items: any[] = [];

    if (Array.isArray(value)) {
      items = value;
    } else if (typeof value === 'object' && value !== null) {
      items = (value.data as any[]) || (value.results as any[]) || (value.items as any[]) || [];
    }

    if (items.length === 0 || typeof items[0] !== 'object') return renderRaw(value);

    const first = items[0];
    const keys = Object.keys(first);

    // Find label field
    const labelField = keys.find(k =>
      k.toLowerCase().includes('date') ||
      k.toLowerCase().includes('time') ||
      k.toLowerCase().includes('name') ||
      k.toLowerCase().includes('label')
    ) || keys[0];

    // Find numeric fields
    const numericFields = keys.filter(k => typeof first[k] === 'number').slice(0, 3);

    if (numericFields.length === 0) return renderTable(value);

    return (
      <div className="mt-2 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={items} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              {numericFields.map((field, idx) => (
                <linearGradient key={field} id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={labelField}
              tick={{ fontSize: 10 }}
              tickFormatter={(val) => String(val).slice(0, 10)}
            />
            <YAxis tick={{ fontSize: 10 }} width={40} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {numericFields.map((field, idx) => (
              <Area
                key={field}
                type="monotone"
                dataKey={field}
                stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                fill={`url(#gradient-${idx})`}
                strokeWidth={2}
                name={field.replace(/[_-]/g, ' ')}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderList = (value: any) => {
    if (Array.isArray(value)) {
      return (
        <ul className="mt-2 border border-neutral-200 rounded-xl divide-y divide-neutral-100 max-h-48 overflow-auto text-[11px]">
          {value.slice(0, 10).map((item, idx) => {
            if (typeof item === "object" && item !== null) {
              const title =
                (item.title as string) ||
                (item.name as string) ||
                (item.label as string) ||
                (item.id && String(item.id)) ||
                `Item ${idx + 1}`;
              const subtitle =
                (item.description as string) ||
                (item.body as string) ||
                (item.summary as string) ||
                (item.email as string) ||
                "";
              const status = (item.status as string) || (item.state as string);
              const image = (item.avatar as string) || (item.image as string) || (item.thumbnail as string);
              const date = (item.date as string) || (item.created_at as string) || (item.timestamp as string);

              return (
                <li key={idx} className="flex items-center gap-3 p-2 hover:bg-neutral-50 transition-colors">
                  {image && (
                    <img
                      src={image}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 bg-neutral-200"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  {!image && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {title.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-800 truncate">{title}</span>
                      {status && renderFormattedValue('status', status, true)}
                    </div>
                    {subtitle && (
                      <span className="text-neutral-500 truncate block text-[10px]">
                        {subtitle}
                      </span>
                    )}
                  </div>
                  {date && (
                    <span className="text-[10px] text-neutral-400 flex-shrink-0">
                      {formatDate(date, 'relative')}
                    </span>
                  )}
                </li>
              );
            }
            return (
              <li key={idx} className="flex items-center gap-2 p-2 hover:bg-neutral-50 transition-colors">
                <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-neutral-700">{renderFormattedValue('item', item)}</span>
              </li>
            );
          })}
        </ul>
      );
    }

    if (typeof value === "object" && value !== null) {
      const entries = Object.entries(value).slice(0, 10);
      return (
        <div className="mt-2 border border-neutral-200 rounded-xl divide-y divide-neutral-100 text-[11px]">
          {entries.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-neutral-50 transition-colors">
              <span className="font-medium text-neutral-600 capitalize">{k.replace(/[_-]/g, ' ')}</span>
              <span className="text-neutral-800 text-right max-w-[60%]">
                {renderFormattedValue(k, v)}
              </span>
            </div>
          ))}
        </div>
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
              <p className="text-2xl font-semibold">{Math.round(temp)}\u00b0</p>
              {typeof feels === "number" && (
                <p className="text-[11px] text-neutral-500">
                  Feels like {Math.round(feels)}\u00b0
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

  const renderMediaList = (
    value: any,
    kind: "movie" | "book" | "game" | "news" | "model" | "sport"
  ) => {
    let items: any[] = [];

    if (Array.isArray(value)) {
      items = value;
    } else if (typeof value === "object" && value !== null) {
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
            <div
              key={idx}
              className="flex flex-col gap-0.5 border-b last:border-b-0 border-neutral-200 pb-1"
            >
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

  const WidgetContent = () => {
    if (widget.type === "editable") {
      return (
        <div className="mt-2 border border-dashed border-neutral-300 rounded-lg p-3">
          <textarea
            rows={5}
            className="w-full text-xs text-neutral-800 outline-none resize-none"
            placeholder="Write anything here..."
            value={editableContent}
            onChange={(e) => setEditableContent(e.target.value)}
          />
        </div>
      );
    }

    if (status.state === "loading") {
      return (
        <div className="mt-2 text-[11px] text-neutral-500">
          Fetching data...
        </div>
      );
    }

    if (status.state === "error" || !data) {
      return (
        <div className="mt-2 border border-dashed border-neutral-300 rounded-lg p-3 text-[11px] text-neutral-500">
          {status.state === "error"
            ? status.message
            : "No data yet. Add an API source and we'll render it nicely."}
        </div>
      );
    }

    // Chart types - explicit widget type takes priority
    if (widget.type === "lineChart") return renderLineChart(data);
    if (widget.type === "barChart") return renderBarChart(data);
    if (widget.type === "pieChart") return renderPieChart(data);
    if (widget.type === "areaChart") return renderAreaChart(data);
    if (widget.type === "donutChart") return renderPieChart(data, true);

    // Domain-specific types
    if (widget.type === "weather") return renderWeather(data);
    if (widget.type === "stocks") return renderStocks(data);
    if (widget.type === "exchangeRates") return renderExchangeRates(data);
    if (widget.type === "movies") return renderMediaList(data, "movie");
    if (widget.type === "books") return renderMediaList(data, "book");
    if (widget.type === "aiModels") return renderMediaList(data, "model");
    if (widget.type === "news") return renderMediaList(data, "news");
    if (widget.type === "sports") return renderMediaList(data, "sport");
    if (widget.type === "gaming") return renderMediaList(data, "game");

    if (status.state === "success") {
      const { presentation } = status;
      switch (presentation) {
        case "lineChart":
          return renderLineChart(data);
        case "barChart":
          return renderBarChart(data);
        case "pieChart":
          return renderPieChart(data);
        case "areaChart":
          return renderAreaChart(data);
        case "donutChart":
          return renderPieChart(data, true);
        case "stats":
          return renderStats(data);
        case "kpi":
          return renderKPI(data);
        case "list":
          return renderList(data);
        case "table":
          return renderTable(data);
        case "cards":
          return renderCards(data);
        case "timeline":
          return renderTimeline(data);
        case "progress":
          return renderProgress(data);
        case "gauge":
          return renderGauge(data);
        case "text":
          return renderText(data);
        default:
          return renderRaw(data);
      }
    }

    return renderRaw(data);
  };

  const renderStatusBadge = () => {
    if (status.state === "loading") {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
          Loading...
        </span>
      );
    }
    if (status.state === "success") {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
          {status.presentation}
        </span>
      );
    }
    if (status.state === "error") {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
          Error
        </span>
      );
    }
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
        Idle
      </span>
    );
  };

  return (
    <div className={`border rounded-xl p-4 shadow-sm ${tone.container}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <p className={`text-[10px] uppercase tracking-[0.16em] ${tone.accent}`}>
            {labelForType(widget.type)}
          </p>
          <p className="text-sm font-semibold truncate">{widget.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] border rounded-full px-2 py-0.5 ${tone.badge}`}
          >
            {widget.type}
          </span>
          <button
            type="button"
            onClick={() => onRemove(widget.id)}
            className="text-[11px] text-neutral-400 hover:text-black px-1"
            aria-label={`Remove ${widget.title}`}
          >
            x
          </button>
        </div>
      </div>

      {status.state === "idle" && shouldUseApi && (
        <p className="mt-1 text-[10px] text-neutral-500">
          Connect an API to preview data.
        </p>
      )}

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

      <WidgetContent />

      {widget.apiUrl && widget.type !== "editable" && (
        <p className="mt-1 text-[10px] text-neutral-400 break-all">
          Source: <span className="font-mono">{widget.apiUrl}</span>
        </p>
      )}
    </div>
  );
}
