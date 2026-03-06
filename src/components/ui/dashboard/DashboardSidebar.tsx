import React, { FormEvent } from "react";

import { Branding, MenuItem } from "./types";

type Props = {
  branding: Branding;
  menuItems: MenuItem[];
  activeMenuId: number;
  accentColor: string;
  accentBorderStyle: React.CSSProperties;
  accentSolidStyle: React.CSSProperties;
  newMenuLabel: string;
  onSelectMenu: (id: number) => void;
  onOpenMenuModal: (item: MenuItem) => void;
  onChangeNewMenuLabel: (value: string) => void;
  onAddMenuItem: (e: FormEvent) => void;
};

export default function DashboardSidebar({
  branding,
  menuItems,
  activeMenuId,
  accentColor,
  accentBorderStyle,
  accentSolidStyle,
  newMenuLabel,
  onSelectMenu,
  onOpenMenuModal,
  onChangeNewMenuLabel,
  onAddMenuItem,
}: Props) {
  return (
    <aside className="h-full w-64 border-r border-neutral-200 flex flex-col">
      <div className="px-4 py-4 border-b border-neutral-200 flex items-center gap-2">
        <div
          className="h-7 w-7 rounded-md border flex items-center justify-center text-xs font-semibold"
          style={accentBorderStyle}
        >
          {branding.initials || "DB"}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium tracking-[0.16em] uppercase text-neutral-500">
            {branding.name}
          </span>
          <span className="text-xs text-neutral-500">{branding.subtitle}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = activeMenuId === item.id;
            return (
              <div
                key={item.id}
                className={`w-full flex items-center gap-2 text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  isActive ? "text-white" : "hover:bg-neutral-100 text-neutral-900"
                }`}
                style={isActive ? { backgroundColor: accentColor } : undefined}
              >
                <button
                  type="button"
                  onClick={() => onSelectMenu(item.id)}
                  className="flex-1 text-left"
                >
                  <span>{item.label}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenMenuModal(item)}
                  className={`text-[12px] px-1 ${
                    isActive ? "text-white/80 hover:text-white" : "text-neutral-400 hover:text-black"
                  }`}
                  aria-label={`Edit or delete ${item.label}`}
                >
                  ...
                </button>
              </div>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-neutral-200 p-3">
        <form onSubmit={onAddMenuItem} className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
            Add menu item
          </p>
          <input
            type="text"
            value={newMenuLabel}
            onChange={(e) => onChangeNewMenuLabel(e.target.value)}
            placeholder="Label"
            className="w-full border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-black"
          />
          <button
            type="submit"
            className="w-full text-xs border rounded-full py-1.5 transition-opacity hover:opacity-90"
            style={accentSolidStyle}
          >
            Add
          </button>
        </form>
      </div>
    </aside>
  );
}
