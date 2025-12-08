import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

type MenuItem = {
  id: number;
  label: string;
};

type Widget = {
  id: number;
  title: string;
  type: "text" | "stats";
};

type DashboardLayout = {
  menuItems: MenuItem[];
  widgets: Widget[];
};

const layoutPath = path.join(process.cwd(), "data", "dashboardLayout.json");

async function readLayout(): Promise<DashboardLayout> {
  try {
    const raw = await fs.readFile(layoutPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    // fallback if file doesn't exist or is invalid
    return {
      menuItems: [
        { id: 1, label: "Overview" },
        { id: 2, label: "Analytics" },
        { id: 3, label: "Settings" },
      ],
      widgets: [
        { id: 1, title: "Traffic", type: "stats" },
        { id: 2, title: "Notes", type: "text" },
      ],
    };
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

  const merged: DashboardLayout = {
    menuItems: body.menuItems ?? current.menuItems,
    widgets: body.widgets ?? current.widgets,
  };

  await writeLayout(merged);
  return NextResponse.json(merged);
}
