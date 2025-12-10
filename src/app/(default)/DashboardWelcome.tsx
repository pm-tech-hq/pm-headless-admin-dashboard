"use client";

import React, { useState, useEffect, KeyboardEvent, MouseEvent } from "react";
import { useRouter } from 'next/navigation';

type BrandSetupData = {
  brandName: string;
  website: string;
  brandColor: string;
  tagline: string;
  description: string;
};

const initialData: BrandSetupData = {
  brandName: "",
  website: "",
  brandColor: "#000000",
  tagline: "",
  description: "",
};

const steps = ["Basics", "Profile", "Branding"];

export default function DashboardWelcome() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<BrandSetupData>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  // 🔹 Load saved brand settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/brand");
        if (res.ok) {
          const data = (await res.json()) as BrandSetupData;
          setFormData(data);
        }
      } catch (err) {
        console.error("Failed to load brand settings", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Close modal on ESC
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent | KeyboardEventInit) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown as any);
    return () => window.removeEventListener("keydown", handleKeyDown as any);
  }, [isModalOpen]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setStep(0);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsModalOpen(false);
    }
  };

  const updateField = <K extends keyof BrandSetupData>(
    key: K,
    value: BrandSetupData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 🔹 Save on final step
  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep((prev) => prev + 1);
    } else {
      try {
        const res = await fetch("/api/brand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          console.error("Failed to save brand settings");
        } else {
          const saved = (await res.json()) as BrandSetupData;
          setFormData(saved);
          console.log("Submitted brand setup:", saved);
        }
      } catch (err) {
        console.error("Error saving brand settings:", err);
      } finally {
        setIsModalOpen(false);
        if (formData.brandName != "") router.push('/dashboard')
      }
    }
  };

  const handlePrevious = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  };

  const isLastStep = step === steps.length - 1;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white text-black flex items-center justify-center px-4">
        <p className="text-sm text-neutral-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black flex items-center justify-center px-4">
      <div className="text-center flex flex-col items-center gap-6">
        <h1 className="text-5xl font-normal tracking-tight">
          Welcome to <br /> PM Headless Dashboard
        </h1>
        <p className="pb-10">
          Get started by setting up your brand to personalize your experience.
        </p>
        <button
          type="button"
          onClick={handleOpenModal}
          className="inline-flex items-center gap-2 border border-black px-6 py-3 rounded-full text-sm font-medium hover:bg-black hover:text-white transition-colors"
        >
          Proceed to setup
        </button>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={handleOverlayClick}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="brand-setup-title"
            className="w-full max-w-lg bg-white text-black rounded-2xl shadow-xl border border-black/10 p-6 relative"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute right-4 top-4 text-neutral-500 hover:text-black text-sm"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Header */}
            <header className="mb-5">
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-500 mb-1">
                Setup
              </p>
              <div className="flex items-center justify-between gap-2">
                <h2
                  id="brand-setup-title"
                  className="text-xl font-semibold tracking-tight"
                >
                  Brand onboarding
                </h2>
                <div className="flex items-center gap-1 text-xs text-neutral-500">
                  {steps.map((label, index) => (
                    <div
                      key={label}
                      className={`h-1.5 w-6 rounded-full ${index <= step ? "bg-black" : "bg-neutral-200"
                        }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-neutral-600 mt-1">
                Only the essentials for now. You can fill in the rest later.
              </p>
            </header>

            {/* Body */}
            <div className="border border-dashed border-neutral-200 rounded-xl p-4 mb-5">
              {step === 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Brand basics</h3>
                  <div className="space-y-1">
                    <label
                      htmlFor="brandName"
                      className="text-xs font-medium text-neutral-700"
                    >
                      Brand name
                    </label>
                    <input
                      id="brandName"
                      type="text"
                      value={formData.brandName}
                      onChange={(e) => updateField("brandName", e.target.value)}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="e.g. Acme Studio"
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="website"
                      className="text-xs font-medium text-neutral-700"
                    >
                      Website (optional)
                    </label>
                    <input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => updateField("website", e.target.value)}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="https://yourbrand.com"
                    />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Brand profile</h3>
                  <div className="space-y-1">
                    <label
                      htmlFor="tagline"
                      className="text-xs font-medium text-neutral-700"
                    >
                      Tagline (optional)
                    </label>
                    <input
                      id="tagline"
                      type="text"
                      value={formData.tagline}
                      onChange={(e) => updateField("tagline", e.target.value)}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="e.g. Design that works."
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="description"
                      className="text-xs font-medium text-neutral-700"
                    >
                      Short description (optional)
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      value={formData.description}
                      onChange={(e) =>
                        updateField("description", e.target.value)
                      }
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black resize-none"
                      placeholder="A sentence or two about your brand."
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Branding</h3>
                  <div className="space-y-1">
                    <label
                      htmlFor="brandColor"
                      className="text-xs font-medium text-neutral-700 flex items-center justify-between"
                    >
                      Brand color
                      <span className="text-[11px] text-neutral-500">
                        Default is black &amp; white
                      </span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id="brandColor"
                        type="color"
                        value={formData.brandColor}
                        onChange={(e) =>
                          updateField("brandColor", e.target.value)
                        }
                        className="h-9 w-9 rounded-lg border border-neutral-300 bg-white cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.brandColor}
                        onChange={(e) =>
                          updateField("brandColor", e.target.value)
                        }
                        className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-black"
                      />
                      <div className="h-9 w-9 rounded-lg border border-neutral-300 bg-white flex items-center justify-center text-[10px] text-neutral-500">
                        <span
                          className="inline-block h-6 w-6 rounded-md border border-neutral-300"
                          style={{ backgroundColor: formData.brandColor }}
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      We’ll apply this color to your dashboard accents later.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer: navigation */}
            <footer className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={step === 0}
                className={`inline-flex items-center gap-1 text-xs border px-3 py-1.5 rounded-full ${step === 0
                    ? "border-neutral-200 text-neutral-300 cursor-not-allowed"
                    : "border-neutral-400 text-neutral-700 hover:bg-neutral-100"
                  }`}
              >
                ← Previous
              </button>

              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <span>
                  Step {step + 1} of {steps.length}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1 text-xs font-medium border border-black px-4 py-1.5 rounded-full bg-black text-white hover:bg-white hover:text-black transition-colors"
              >
                {isLastStep ? "Finish" : "Next"}
                <span aria-hidden>→</span>
              </button>
            </footer>
          </div>
        </div>
      )}
    </main>
  );
}
