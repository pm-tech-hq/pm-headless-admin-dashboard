import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

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

type DashboardLayout = {
  menuItems: MenuItem[];
  widgetSets: Record<number, Widget[]>;
};

const layoutPath = path.join(process.cwd(), "data", "dashboardLayout.json");
const defaultLayout: DashboardLayout = {
  menuItems: [
    { id: 1, label: "Overview" },
    { id: 2, label: "Analytics" },
    { id: 3, label: "Settings" },
  ],
  widgetSets: {
    1: [
      { id: 1, title: "Traffic (auto)", type: "auto" },
      { id: 2, title: "Notes (editable)", type: "editable" },
    ],
  },
};

function toNewLayout(raw: any): DashboardLayout {
  // Already in new shape
  if (raw && raw.widgetSets) {
    return {
      menuItems: raw.menuItems ?? defaultLayout.menuItems,
      widgetSets: raw.widgetSets ?? defaultLayout.widgetSets,
    };
  }

  // Legacy shape with a single widgets array
  if (raw && raw.widgets) {
    const menuItems = raw.menuItems ?? defaultLayout.menuItems;
    const firstMenuId = menuItems[0]?.id ?? 1;
    return {
      menuItems,
      widgetSets: { [firstMenuId]: raw.widgets },
    };
  }

  return defaultLayout;
}

async function readLayout(): Promise<DashboardLayout> {
  try {
    const raw = await fs.readFile(layoutPath, "utf-8");
    const parsed = JSON.parse(raw);
    return toNewLayout(parsed);
  } catch {
    // fallback if file doesn't exist or is invalid
    return defaultLayout;
  }
}

async function writeLayout(layout: DashboardLayout) {
  await fs.mkdir(path.dirname(layoutPath), { recursive: true });
  await fs.writeFile(layoutPath, JSON.stringify(layout, null, 2), "utf-8");
}

export async function GET() {
  const layout = await readLayout();
  return NextResponse.json(layout);
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<DashboardLayout>;
  const current = await readLayout();

  const incomingWidgetSets =
    (body as any).widgetSets ??
    ((body as any).widgets
      ? {
          [(body.menuItems ?? current.menuItems ?? defaultLayout.menuItems)[0]?.id ?? 1]:
            (body as any).widgets,
        }
      : undefined);

  const merged: DashboardLayout = {
    menuItems: body.menuItems ?? current.menuItems,
    widgetSets: incomingWidgetSets ?? current.widgetSets,
  };

  await writeLayout(merged);
  return NextResponse.json(merged);
}
