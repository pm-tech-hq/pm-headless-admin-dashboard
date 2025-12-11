"use client";

import React, { FormEvent, useEffect, useState } from "react";

import AddWidgetPanel from "@/components/ui/dashboard/AddWidgetPanel";
import BrandingModal from "@/components/ui/dashboard/BrandingModal";
import DashboardHeader from "@/components/ui/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/ui/dashboard/DashboardSidebar";
import MenuModal from "@/components/ui/dashboard/MenuModal";
import WidgetCard from "@/components/ui/dashboard/WidgetCard";
import {
  Branding,
  BrandSetupData,
  DashboardLayout,
  MenuItem,
  Widget,
  WidgetType,
} from "@/components/ui/dashboard/types";

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
  branding: {
    name: "Admin dashboard",
    subtitle: "Headless admin",
    initials: "DB",
    accentColor: "#000000",
  },
};

const defaultBrandSettings: BrandSetupData = {
  brandName: "",
  website: "",
  brandColor: "#000000",
  tagline: "",
  description: "",
};

function deriveInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "DB";
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
}

export default function Dashboard() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(defaultLayout.menuItems);
  const [widgetSets, setWidgetSets] = useState<Record<number, Widget[]>>(
    defaultLayout.widgetSets
  );
  const [activeMenuId, setActiveMenuId] = useState<number>(
    defaultLayout.menuItems[0]?.id ?? 1
  );
  const [branding, setBranding] = useState<Branding>(defaultLayout.branding);

  const [newMenuLabel, setNewMenuLabel] = useState("");
  const [newWidgetTitle, setNewWidgetTitle] = useState("");
  const [newWidgetType, setNewWidgetType] = useState<WidgetType>("auto");
  const [newWidgetApiUrl, setNewWidgetApiUrl] = useState("");
  const [isLoadingLayout, setIsLoadingLayout] = useState(true);
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [menuModalItem, setMenuModalItem] = useState<MenuItem | null>(null);
  const [editMenuLabel, setEditMenuLabel] = useState("");
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [brandSettings, setBrandSettings] = useState<BrandSetupData>(defaultBrandSettings);

  const accentColor = branding.accentColor || "#000000";
  const accentBorderStyle = { borderColor: accentColor, color: accentColor };
  const accentSolidStyle = { backgroundColor: accentColor, borderColor: accentColor, color: "#fff" };

  const syncBrandingFromBrandSettings = (settings: BrandSetupData) => {
    setBranding((prev) => ({
      ...prev,
      name: settings.brandName || prev.name,
      subtitle: settings.tagline || prev.subtitle,
      accentColor: settings.brandColor || prev.accentColor,
      initials: settings.brandName ? deriveInitials(settings.brandName) : prev.initials,
    }));
  };

  const syncBrandSettingsFromBranding = (): BrandSetupData => ({
    ...brandSettings,
    brandName: branding.name,
    brandColor: branding.accentColor,
    tagline: branding.subtitle,
  });

  const handleAddMenuItem = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newMenuLabel.trim();
    if (!trimmed) return;

    const id = Date.now();
    setMenuItems((prev) => [...prev, { id, label: trimmed }]);
    setWidgetSets((prev) => ({ ...prev, [id]: [] }));
    setActiveMenuId(id);
    setNewMenuLabel("");
  };

  const handleAddWidget = (e: FormEvent) => {
    e.preventDefault();
    const title = newWidgetTitle.trim();
    if (!title) return;
    const menuId = activeMenuId;
    if (!menuId) return;

    setWidgetSets((prev) => {
      const nextWidgets = prev[menuId] ?? [];
      const newWidget: Widget = {
        id: Date.now(),
        title,
        type: newWidgetType,
        apiUrl:
          newWidgetType === "editable"
            ? undefined
            : newWidgetApiUrl.trim() || undefined,
      };

      return { ...prev, [menuId]: [...nextWidgets, newWidget] };
    });

    setNewWidgetTitle("");
    setNewWidgetApiUrl("");
  };

  const handleBrandingChange = (key: keyof Branding, value: string) => {
    setBranding((prev) => ({ ...prev, [key]: value }));
  };

  const persistBranding = async () => {
    const nextBrandSettings = syncBrandSettingsFromBranding();
    setBrandSettings(nextBrandSettings);
    try {
      await Promise.all([
        fetch("/api/brand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextBrandSettings),
        }),
        fetch("/api/dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ menuItems, widgetSets, branding }),
        }),
      ]);
    } catch {
      // ignore; header save button still allows retry
    }
  };

  const openMenuModal = (item: MenuItem) => {
    setMenuModalItem(item);
    setEditMenuLabel(item.label);
  };

  const closeMenuModal = () => {
    setMenuModalItem(null);
    setEditMenuLabel("");
  };

  const handleUpdateMenuLabel = () => {
    if (!menuModalItem) return;
    const trimmed = editMenuLabel.trim();
    if (!trimmed) return;

    setMenuItems((prev) =>
      prev.map((item) => (item.id === menuModalItem.id ? { ...item, label: trimmed } : item))
    );
    closeMenuModal();
  };

  const handleDeleteMenuItem = () => {
    if (!menuModalItem) return;
    const targetId = menuModalItem.id;

    setMenuItems((prev) => {
      const next = prev.filter((item) => item.id !== targetId);
      setActiveMenuId((current) => {
        if (current !== targetId) return current;
        return next[0]?.id ?? current;
      });
      return next;
    });

    setWidgetSets((prev) => {
      const next = { ...prev };
      delete next[targetId];
      return next;
    });

    closeMenuModal();
  };

  const handleRemoveWidget = (id: number) => {
    const menuId = activeMenuId;
    if (!menuId) return;
    setWidgetSets((prev) => ({
      ...prev,
      [menuId]: (prev[menuId] ?? []).filter((w) => w.id !== id),
    }));
  };

  useEffect(() => {
    let active = true;
    const fetchLayout = async () => {
      setIsLoadingLayout(true);
      try {
        const res = await fetch("/api/dashboard", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load saved layout");
        }
        const json = (await res.json()) as DashboardLayout;
        if (!active) return;
        setMenuItems(json.menuItems ?? defaultLayout.menuItems);
        setWidgetSets(json.widgetSets ?? defaultLayout.widgetSets);
        setBranding(json.branding ?? defaultLayout.branding);
        setActiveMenuId(json.menuItems?.[0]?.id ?? defaultLayout.menuItems[0].id);
        setLayoutError(null);
      } catch {
        if (!active) return;
        setLayoutError("Unable to load saved layout; using defaults for now.");
        setMenuItems(defaultLayout.menuItems);
        setWidgetSets(defaultLayout.widgetSets);
        setBranding(defaultLayout.branding);
        setActiveMenuId(defaultLayout.menuItems[0]?.id ?? 1);
      } finally {
        if (active) setIsLoadingLayout(false);
      }
    };

    const fetchBrandSettings = async () => {
      try {
        const res = await fetch("/api/brand", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as BrandSetupData;
        setBrandSettings(data);
        syncBrandingFromBrandSettings(data);
      } catch {
        // ignore; fall back to defaults/layout branding
      }
    };

    fetchLayout().then(fetchBrandSettings);
    return () => {
      active = false;
    };
  }, []);

  const handleSaveLayout = async () => {
    setSaveState("saving");
    try {
      const nextBrandSettings = syncBrandSettingsFromBranding();
      setBrandSettings(nextBrandSettings);

      const brandPromise = fetch("/api/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextBrandSettings),
      });

      const res = await fetch("/api/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItems, widgetSets, branding }),
      });

      if (!res.ok) {
        throw new Error("Failed to save layout");
      }

      await brandPromise;

      setSaveState("saved");
      setLayoutError(null);
      setTimeout(() => setSaveState("idle"), 1500);
    } catch {
      setSaveState("error");
    }
  };

  const widgets = widgetSets[activeMenuId] ?? [];

  useEffect(() => {
    if (!menuItems.find((item) => item.id === activeMenuId)) {
      setActiveMenuId(menuItems[0]?.id ?? activeMenuId);
    }
  }, [menuItems, activeMenuId]);

  return (
    <div className="h-screen w-screen bg-white text-black flex overflow-hidden">
      <DashboardSidebar
        branding={branding}
        menuItems={menuItems}
        activeMenuId={activeMenuId}
        accentColor={accentColor}
        accentBorderStyle={accentBorderStyle}
        accentSolidStyle={accentSolidStyle}
        newMenuLabel={newMenuLabel}
        onSelectMenu={setActiveMenuId}
        onOpenMenuModal={openMenuModal}
        onChangeNewMenuLabel={setNewMenuLabel}
        onAddMenuItem={handleAddMenuItem}
      />

      <main className="flex-1 flex flex-col">
        <DashboardHeader
          branding={branding}
          accentColor={accentColor}
          saveState={saveState}
          isLoadingLayout={isLoadingLayout}
          onOpenBranding={() => setIsBrandingModalOpen(true)}
          onSaveLayout={handleSaveLayout}
        />

        <section className="flex-1 flex overflow-hidden">
          <div className="flex-1 h-full overflow-y-auto px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">
                  Widgets
                </p>
                <p className="text-xs text-neutral-500">
                  Add widgets, connect APIs, and the dashboard will try to format the data nicely.
                </p>
              </div>
            </div>
            {layoutError && (
              <p className="text-[11px] text-red-600 mb-2">{layoutError}</p>
            )}
            {saveState === "saved" && (
              <p className="text-[11px] text-emerald-600 mb-2">Layout saved to persistence.</p>
            )}
            {saveState === "error" && (
              <p className="text-[11px] text-red-600 mb-2">
                Save failed. Please check the API route and try again.
              </p>
            )}

            {isLoadingLayout ? (
              <p className="text-[11px] text-neutral-500">Loading saved layout...</p>
            ) : widgets.length === 0 ? (
              <p className="text-[11px] text-neutral-500">
                No widgets yet for this menu. Add one to start a fresh view.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {widgets.map((widget) => (
                  <WidgetCard key={widget.id} widget={widget} onRemove={handleRemoveWidget} />
                ))}
              </div>
            )}
          </div>

          <AddWidgetPanel
            accentSolidStyle={accentSolidStyle}
            newWidgetTitle={newWidgetTitle}
            newWidgetType={newWidgetType}
            newWidgetApiUrl={newWidgetApiUrl}
            onSubmit={handleAddWidget}
            onTitleChange={setNewWidgetTitle}
            onTypeChange={setNewWidgetType}
            onApiChange={setNewWidgetApiUrl}
          />
        </section>
      </main>

      <MenuModal
        menuModalItem={menuModalItem}
        editMenuLabel={editMenuLabel}
        accentSolidStyle={accentSolidStyle}
        onClose={closeMenuModal}
        onChangeEditLabel={setEditMenuLabel}
        onUpdateMenuLabel={handleUpdateMenuLabel}
        onDeleteMenuItem={handleDeleteMenuItem}
      />

      <BrandingModal
        isOpen={isBrandingModalOpen}
        branding={branding}
        accentSolidStyle={accentSolidStyle}
        onClose={() => setIsBrandingModalOpen(false)}
        onChange={handleBrandingChange}
        onDone={async () => {
          await persistBranding();
          setIsBrandingModalOpen(false);
        }}
      />
    </div>
  );
}
