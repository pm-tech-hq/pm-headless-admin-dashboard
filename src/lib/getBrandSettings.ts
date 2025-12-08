import { promises as fs } from "fs";
import path from "path";

export type BrandSettings = {
  brandName: string;
  website: string;
  brandColor: string;
  tagline: string;
  description: string;
};

export async function getBrandSettings(): Promise<BrandSettings | null> {
  const settingsPath = path.join(process.cwd(), "data", "brandSettings.json");

  try {
    const raw = await fs.readFile(settingsPath, "utf-8");
    const json = JSON.parse(raw);
    return json;
  } catch {
    return null;
  }
}
