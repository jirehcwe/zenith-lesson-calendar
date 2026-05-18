"use client";

import { ViewType } from "./ViewSelector";

interface BottomNavProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onOpenFilter: () => void;
  hasActiveFilters?: boolean;
}

export default function BottomNav({ currentView, onViewChange, onOpenFilter, hasActiveFilters }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {/* Calendar tab */}
        <button
          onClick={() => onViewChange("calendar")}
          className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 ${
            currentView === "calendar" ? "text-blue-400" : "text-gray-500"
          }`}
        >
          {currentView === "calendar" && (
            <span className="absolute top-0 inset-x-[25%] h-0.5 bg-blue-400 rounded-b-full" />
          )}
          <svg
            aria-hidden="true"
            className={`w-6 h-6 transition-transform duration-200 ${currentView === "calendar" ? "scale-110" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              strokeWidth={currentView === "calendar" ? 2.5 : 2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className={`text-xs ${currentView === "calendar" ? "font-semibold" : "font-medium"}`}>
            Calendar
          </span>
        </button>

        {/* List tab */}
        <button
          onClick={() => onViewChange("list")}
          className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 ${
            currentView === "list" ? "text-blue-400" : "text-gray-500"
          }`}
        >
          {currentView === "list" && (
            <span className="absolute top-0 inset-x-[25%] h-0.5 bg-blue-400 rounded-b-full" />
          )}
          <svg
            aria-hidden="true"
            className={`w-6 h-6 transition-transform duration-200 ${currentView === "list" ? "scale-110" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              strokeWidth={currentView === "list" ? 2.5 : 2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <span className={`text-xs ${currentView === "list" ? "font-semibold" : "font-medium"}`}>
            List
          </span>
        </button>

        {/* Filter tab */}
        <button
          onClick={onOpenFilter}
          className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full text-gray-500 transition-all duration-200"
        >
          <div className="relative">
            <svg aria-hidden="true" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full border-2 border-white" />
            )}
          </div>
          <span className="text-xs font-medium">Filter</span>
        </button>
      </div>
    </nav>
  );
}
