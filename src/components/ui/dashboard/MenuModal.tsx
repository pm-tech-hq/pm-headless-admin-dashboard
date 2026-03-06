import React from "react";

import { MenuItem } from "./types";

type Props = {
  menuModalItem: MenuItem | null;
  editMenuLabel: string;
  accentSolidStyle: React.CSSProperties;
  onClose: () => void;
  onChangeEditLabel: (value: string) => void;
  onUpdateMenuLabel: () => void;
  onDeleteMenuItem: () => void;
};

export default function MenuModal({
  menuModalItem,
  editMenuLabel,
  accentSolidStyle,
  onClose,
  onChangeEditLabel,
  onUpdateMenuLabel,
  onDeleteMenuItem,
}: Props) {
  if (!menuModalItem) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-xl shadow-xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">Menu</p>
            <p className="text-sm font-semibold">{menuModalItem.label}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] text-neutral-400 hover:text-black px-1"
            aria-label="Close menu actions"
          >
            x
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-medium text-neutral-700">Rename</label>
          <input
            type="text"
            value={editMenuLabel}
            onChange={(e) => onChangeEditLabel(e.target.value)}
            className="w-full border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-black"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] px-3 py-1 rounded-full border border-neutral-200 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onUpdateMenuLabel}
              disabled={!editMenuLabel.trim()}
              className={`text-[11px] px-3 py-1 rounded-full border ${
                editMenuLabel.trim()
                  ? "hover:opacity-90"
                  : "border-neutral-200 text-neutral-400 bg-neutral-100 cursor-not-allowed"
              }`}
              style={editMenuLabel.trim() ? accentSolidStyle : undefined}
            >
              Save
            </button>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-3 space-y-2">
          <div>
            <p className="text-[11px] font-medium text-neutral-700">Delete menu</p>
            <p className="text-[11px] text-neutral-500">
              Remove this menu and all widgets inside it.
            </p>
          </div>
          <button
            type="button"
            onClick={onDeleteMenuItem}
            className="w-full text-[11px] px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
          >
            Delete menu
          </button>
        </div>
      </div>
    </div>
  );
}
