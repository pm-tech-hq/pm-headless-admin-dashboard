export type MenuItem = {
  id: number;
  label: string;
};

export type WidgetType =
  | "auto"
  | "stats"
  | "kpi"
  | "text"
  | "list"
  | "table"
  | "cards"
  | "timeline"
  | "progress"
  | "gauge"
  | "raw"
  | "lineChart"
  | "barChart"
  | "pieChart"
  | "areaChart"
  | "donutChart"
  | "map"
  | "kanban"
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

export type Widget = {
  id: number;
  title: string;
  type: WidgetType;
  apiUrl?: string;
};

export type BrandSetupData = {
  brandName: string;
  website: string;
  brandColor: string;
  tagline: string;
  description: string;
};

export type Branding = {
  name: string;
  subtitle: string;
  initials: string;
  accentColor: string;
};

export type DashboardLayout = {
  menuItems: MenuItem[];
  widgetSets: Record<number, Widget[]>;
  branding: Branding;
};
