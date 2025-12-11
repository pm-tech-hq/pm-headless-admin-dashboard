import React, { FormEvent } from "react";

import { WidgetType } from "./types";

type Props = {
  accentSolidStyle: React.CSSProperties;
  newWidgetTitle: string;
  newWidgetType: WidgetType;
  newWidgetApiUrl: string;
  onSubmit: (e: FormEvent) => void;
  onTitleChange: (value: string) => void;
  onTypeChange: (value: WidgetType) => void;
  onApiChange: (value: string) => void;
};

const labelForType = (type: WidgetType): string => {
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
};

const placeholderForType = (type: WidgetType): string => {
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

export default function AddWidgetPanel({
  accentSolidStyle,
  newWidgetTitle,
  newWidgetType,
  newWidgetApiUrl,
  onSubmit,
  onTitleChange,
  onTypeChange,
  onApiChange,
}: Props) {
  return (
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
        <form onSubmit={onSubmit} className="space-y-3">
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
              onChange={(e) => onTitleChange(e.target.value)}
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
                      onClick={() => onTypeChange(type)}
                      className={`border rounded-full px-2.5 py-1 ${
                        newWidgetType === type
                          ? "text-white"
                          : "border-neutral-300 text-neutral-600 hover:bg-neutral-100"
                      }`}
                      style={newWidgetType === type ? accentSolidStyle : undefined}
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
              onChange={(e) => onApiChange(e.target.value)}
              placeholder={placeholderForType(newWidgetType)}
              disabled={newWidgetType === "editable"}
              className={`w-full border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-black ${
                newWidgetType === "editable" ? "bg-neutral-100 text-neutral-400" : ""
              }`}
            />
            <p className="text-[10px] text-neutral-500">
              Must return JSON. The dashboard will try to format it as cards, stats, or lists instead of raw arrays.
            </p>
          </div>

          <button
            type="submit"
            className="w-full text-xs border rounded-full py-1.5 mt-1 transition-opacity hover:opacity-90"
            style={accentSolidStyle}
          >
            Add widget
          </button>
        </form>
      </div>
    </aside>
  );
}
