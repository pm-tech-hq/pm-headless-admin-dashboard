import React, { FormEvent, useState } from "react";

import { WidgetType } from "./types";
import {
  PUBLIC_API_TEMPLATES,
  TEMPLATE_CATEGORIES,
  PublicApiTemplate,
} from "@/lib/publicApiTemplates";

type Props = {
  accentSolidStyle: React.CSSProperties;
  newWidgetTitle: string;
  newWidgetType: WidgetType;
  newWidgetApiUrl: string;
  onSubmit: (e: FormEvent) => void;
  onTitleChange: (value: string) => void;
  onTypeChange: (value: WidgetType) => void;
  onApiChange: (value: string) => void;
  /** Called when the user clicks "Add" directly from a template card */
  onAddTemplate?: (template: PublicApiTemplate) => void;
};

const labelForType = (type: WidgetType): string => {
  switch (type) {
    case "auto": return "Auto";
    case "stats": return "Stats";
    case "kpi": return "KPI";
    case "text": return "Text";
    case "list": return "List";
    case "table": return "Table";
    case "cards": return "Cards";
    case "timeline": return "Timeline";
    case "progress": return "Progress";
    case "gauge": return "Gauge";
    case "raw": return "Raw JSON";
    case "lineChart": return "Line Chart";
    case "barChart": return "Bar Chart";
    case "pieChart": return "Pie Chart";
    case "areaChart": return "Area Chart";
    case "donutChart": return "Donut Chart";
    case "map": return "Map";
    case "kanban": return "Kanban";
    case "weather": return "Weather";
    case "stocks": return "Stocks";
    case "exchangeRates": return "Exchange Rates";
    case "movies": return "Movies";
    case "books": return "Books";
    case "aiModels": return "AI Models";
    case "news": return "Hacker News";
    case "sports": return "Sports";
    case "gaming": return "Gaming";
    case "editable": return "Editable";
    case "crypto": return "Crypto";
    case "github": return "GitHub";
    case "spacex": return "SpaceX";
    case "nasaApod": return "NASA APOD";
    case "countries": return "Countries";
    case "randomUser": return "Random Users";
    case "joke": return "Joke";
    case "advice": return "Advice";
    case "fact": return "Fact";
    case "dogImage": return "Dog Photo";
    case "pokemon": return "Pokémon";
    case "worldTime": return "World Clock";
    case "ipInfo": return "IP Info";
    case "openLibrary": return "Books";
    default: return type;
  }
};

const placeholderForType = (type: WidgetType): string => {
  switch (type) {
    case "weather": return "e.g. https://api.open-meteo.com/v1/forecast?...";
    case "stocks": return "e.g. https://api.example.com/stocks?symbol=AAPL";
    case "exchangeRates": return "e.g. https://open.er-api.com/v6/latest/USD";
    case "movies": return "e.g. https://api.example.com/movies/popular";
    case "books": return "e.g. https://openlibrary.org/search.json?q=react";
    case "aiModels": return "e.g. https://api.example.com/models";
    case "news": return "e.g. https://hn.algolia.com/api/v1/search?tags=front_page";
    case "sports": return "e.g. https://api.openf1.org/v1/drivers?session_key=latest";
    case "gaming": return "e.g. https://api.example.com/games/top";
    case "editable": return "(not used for editable widgets)";
    default: return "e.g. https://jsonplaceholder.typicode.com/posts";
  }
};

const typeGroups: { label: string; types: WidgetType[] }[] = [
  {
    label: "Display mode",
    types: ["auto", "stats", "kpi", "text", "list", "table", "cards", "timeline", "progress", "gauge", "raw"],
  },
  {
    label: "Charts",
    types: ["lineChart", "barChart", "pieChart", "areaChart", "donutChart"],
  },
  {
    label: "Dedicated widgets",
    types: ["weather", "crypto", "exchangeRates", "news", "github", "spacex", "nasaApod", "countries", "randomUser", "openLibrary"],
  },
  {
    label: "Fun",
    types: ["joke", "advice", "fact", "dogImage", "pokemon", "worldTime", "ipInfo"],
  },
  {
    label: "Domain-specific",
    types: ["stocks", "movies", "books", "aiModels", "sports", "gaming"],
  },
  {
    label: "Other",
    types: ["map", "kanban", "editable"],
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
  onAddTemplate,
}: Props) {
  const [tab, setTab] = useState<"templates" | "custom">("templates");
  const [activeCategory, setActiveCategory] = useState<string>("Finance");
  const [templateSearch, setTemplateSearch] = useState("");

  const filteredTemplates = PUBLIC_API_TEMPLATES.filter((t) => {
    const matchesCategory = t.category === activeCategory;
    const matchesSearch =
      !templateSearch ||
      t.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.description.toLowerCase().includes(templateSearch.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(templateSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = (template: PublicApiTemplate) => {
    if (onAddTemplate) {
      onAddTemplate(template);
    } else {
      onTitleChange(template.title);
      onTypeChange(template.type);
      onApiChange(template.apiUrl);
      setTab("custom");
    }
  };

  return (
    <aside className="w-80 border-l border-neutral-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
          Add widget
        </p>
        <p className="text-[11px] text-neutral-400 mt-0.5">
          Pick a template or connect your own API.
        </p>

        {/* Tab switcher */}
        <div className="flex mt-2 gap-1 bg-neutral-100 rounded-lg p-0.5">
          <button
            onClick={() => setTab("templates")}
            className={`flex-1 text-[11px] py-1 rounded-md transition-all font-medium ${
              tab === "templates"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setTab("custom")}
            className={`flex-1 text-[11px] py-1 rounded-md transition-all font-medium ${
              tab === "custom"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            Custom API
          </button>
        </div>
      </div>

      {tab === "templates" ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="px-3 pt-3 pb-2">
            <input
              type="text"
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full border border-neutral-200 rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-black bg-neutral-50"
            />
          </div>

          {/* Category tabs */}
          <div className="px-3 pb-2 flex gap-1 flex-wrap">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                  activeCategory === cat
                    ? "text-white"
                    : "border-neutral-300 text-neutral-500 hover:bg-neutral-100"
                }`}
                style={activeCategory === cat ? accentSolidStyle : undefined}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Template cards */}
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
            {filteredTemplates.length === 0 ? (
              <p className="text-[11px] text-neutral-400 text-center py-6">
                No templates match your search.
              </p>
            ) : (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border border-neutral-200 rounded-xl p-2.5 bg-white hover:border-neutral-400 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="text-base leading-none mt-0.5 flex-shrink-0">
                        {template.emoji}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-neutral-800 truncate">
                          {template.title}
                        </p>
                        <p className="text-[10px] text-neutral-500 mt-0.5 leading-snug line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="flex-shrink-0 text-[10px] px-2 py-1 rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-all font-medium"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="mt-1.5 flex gap-1 flex-wrap">
                    <span className="text-[9px] px-1.5 py-0.5 bg-neutral-100 text-neutral-500 rounded font-mono">
                      {template.type}
                    </span>
                    {template.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] px-1.5 py-0.5 bg-neutral-50 text-neutral-400 rounded border border-neutral-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
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
                        style={
                          newWidgetType === type ? accentSolidStyle : undefined
                        }
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
                API source{" "}
                {newWidgetType === "editable" && (
                  <span className="text-neutral-400">(ignored)</span>
                )}
              </label>
              <input
                id="widget-api"
                type="url"
                value={newWidgetApiUrl}
                onChange={(e) => onApiChange(e.target.value)}
                placeholder={placeholderForType(newWidgetType)}
                disabled={newWidgetType === "editable"}
                className={`w-full border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-black ${
                  newWidgetType === "editable"
                    ? "bg-neutral-100 text-neutral-400"
                    : ""
                }`}
              />
              <p className="text-[10px] text-neutral-400">
                Must return JSON. The widget will auto-detect the best
                visualisation.
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

          {/* Quick-fill from template */}
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-400 mb-2">
              Or fill from a template
            </p>
            <button
              type="button"
              onClick={() => setTab("templates")}
              className="w-full text-[11px] border border-dashed border-neutral-300 rounded-lg py-2 text-neutral-500 hover:bg-neutral-50 transition-colors"
            >
              Browse {PUBLIC_API_TEMPLATES.length} free public API templates →
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
