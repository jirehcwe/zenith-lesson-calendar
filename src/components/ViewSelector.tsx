"use client";

import { useEffect, useState } from "react";

export type ViewType = "calendar" | "list";

interface ViewSelectorProps {
  onViewChange: (view: ViewType) => void;
}

export default function ViewSelector({ onViewChange }: ViewSelectorProps) {
  const [currentView, setCurrentView] = useState<ViewType>("calendar");
  const [isInitialized, setIsInitialized] = useState(false);

  // Read view from URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get("view") as ViewType;

    if (viewParam === "list" || viewParam === "calendar") {
      setCurrentView(viewParam);
      onViewChange(viewParam);
    } else {
      // Default to calendar if no valid view param
      setCurrentView("calendar");
      onViewChange("calendar");
    }
    setIsInitialized(true);
  }, [onViewChange]);

  // Update URL when view changes (non-destructive to other params) - but not during initial load
  useEffect(() => {
    if (!isInitialized) return;

    const params = new URLSearchParams(window.location.search);

    if (currentView === "calendar") {
      // Remove view param for calendar (default)
      params.delete("view");
    } else {
      // Set view param for other views
      params.set("view", currentView);
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }, [currentView, isInitialized]);

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view);
    onViewChange(view);
  };
  return (
    <div className="flex items-center justify-center mb-6">
      <div className="flex bg-gray-100 rounded-xl p-1 shadow-sm">
        <button
          onClick={() => handleViewChange("calendar")}
          className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
            currentView === "calendar"
              ? "bg-white text-blue-600 shadow-md transform scale-105"
              : "text-gray-600 hover:text-blue-600 hover:bg-white/50"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Calendar View
        </button>
        <button
          onClick={() => handleViewChange("list")}
          className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
            currentView === "list"
              ? "bg-white text-blue-600 shadow-md transform scale-105"
              : "text-gray-600 hover:text-blue-600 hover:bg-white/50"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          List View
        </button>
      </div>
    </div>
  );
}
