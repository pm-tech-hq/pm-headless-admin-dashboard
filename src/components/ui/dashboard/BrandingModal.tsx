import React from "react";

import { Branding } from "./types";

type Props = {
  isOpen: boolean;
  branding: Branding;
  accentSolidStyle: React.CSSProperties;
  onClose: () => void;
  onChange: (key: keyof Branding, value: string) => void;
  onDone: () => Promise<void> | void;
};

export default function BrandingModal({
  isOpen,
  branding,
  accentSolidStyle,
  onClose,
  onChange,
  onDone,
}: Props) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Branding</p>
            <p className="text-sm font-semibold">Update dashboard identity</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] text-neutral-400 hover:text-black px-1"
            aria-label="Close branding modal"
          >
            x
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-neutral-700">Name</label>
            <input
              type="text"
              value={branding.name}
              onChange={(e) => onChange("name", e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-neutral-700">Subtitle</label>
            <input
              type="text"
              value={branding.subtitle}
              onChange={(e) => onChange("subtitle", e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-neutral-700">Initials</label>
              <input
                type="text"
                maxLength={4}
                value={branding.initials}
                onChange={(e) => onChange("initials", e.target.value.toUpperCase())}
                className="w-full border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-neutral-700">Accent</label>
              <input
                type="color"
                value={branding.accentColor}
                onChange={(e) => onChange("accentColor", e.target.value)}
                className="w-full h-9 border border-neutral-300 rounded-lg p-1 bg-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] px-3 py-1 rounded-full border border-neutral-200 hover:bg-neutral-100"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onDone}
            className="text-[11px] px-3 py-1 rounded-full border hover:opacity-90"
            style={accentSolidStyle}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
