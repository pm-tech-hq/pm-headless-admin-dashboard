import React from "react";

import { Branding } from "./types";

type SaveState = "idle" | "saving" | "saved" | "error";

type Props = {
  branding: Branding;
  accentColor: string;
  saveState: SaveState;
  isLoadingLayout: boolean;
  onOpenBranding: () => void;
  onSaveLayout: () => void;
};

export default function DashboardHeader({
  branding,
  accentColor,
  saveState,
  isLoadingLayout,
  onOpenBranding,
  onSaveLayout,
}: Props) {
  const accentBorderStyle = { borderColor: accentColor, color: accentColor };

  const saveLabel =
    saveState === "saving"
      ? "Saving..."
      : saveState === "saved"
      ? "Saved"
      : saveState === "error"
      ? "Retry save"
      : "Save layout";

  return (
    <header className="h-14 border-b border-neutral-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-medium">{branding.name}</h1>
        <span
          className="text-[11px] border border-dashed rounded-full px-2 py-0.5"
          style={{ borderColor: accentColor, color: accentColor }}
        >
          {branding.subtitle || "Headless"}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-neutral-500">
        <button
          type="button"
          onClick={onOpenBranding}
          className="border rounded-full px-3 py-1 hover:opacity-90"
          style={accentBorderStyle}
        >
          Branding
        </button>
        <button
          type="button"
          onClick={onSaveLayout}
          disabled={saveState === "saving" || isLoadingLayout}
          className={`border border-neutral-300 rounded-full px-3 py-1 transition-colors ${
            saveState === "saving" || isLoadingLayout
              ? "opacity-60 cursor-not-allowed"
              : "hover:bg-neutral-100"
          }`}
          style={accentBorderStyle}
        >
          {saveLabel}
        </button>
        <div className="h-7 w-7 rounded-full border border-neutral-300 flex items-center justify-center text-[11px]">
          U
        </div>
      </div>
    </header>
  );
}
