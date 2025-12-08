import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const settingsPath = path.join(process.cwd(), "data", "brandSettings.json");

type BrandSetupData = {
  brandName: string;
  website: string;
  brandColor: string;
  tagline: string;
  description: string;
};

// Make sure this runs in Node so we can use fs
export const runtime = "nodejs";

async function readSettings(): Promise<BrandSetupData> {
  try {
    const raw = await fs.readFile(settingsPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    // fallback if file missing or invalid
    return {
      brandName: "",
      website: "",
      brandColor: "#000000",
      tagline: "",
      description: "",
    };
  }
}

async function writeSettings(settings: BrandSetupData) {
  await fs.mkdir(path.dirname(settingsPath), { recursive: true });
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
}

export async function GET() {
  const settings = await readSettings();
  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<BrandSetupData>;
  const current = await readSettings();
  const merged = { ...current, ...body };

  await writeSettings(merged);
  return NextResponse.json(merged);
}
