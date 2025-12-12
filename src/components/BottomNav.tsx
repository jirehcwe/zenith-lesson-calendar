"use client";

import { ViewType } from "./ViewSelector";

interface BottomNavProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export default function BottomNav({ currentView, onViewChange }: BottomNavProps) {

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
      style={{ paddingBottom: `calc(env(safe-area-inset-bottom) - 1rem)` }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        <button
          onClick={() => onViewChange("calendar")}
          className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 ${
            currentView === "calendar"
              ? "text-blue-600"
              : "text-gray-500"
          }`}
        >
          <svg
            className={`w-6 h-6 transition-transform duration-200 ${
              currentView === "calendar" ? "scale-110" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={currentView === "calendar" ? 2.5 : 2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className={`text-xs font-medium ${
            currentView === "calendar" ? "font-semibold" : ""
          }`}>
            Calendar
          </span>
        </button>
        
        <div className="w-px h-8 bg-gray-200"></div>
        
        <button
          onClick={() => onViewChange("list")}
          className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 ${
            currentView === "list"
              ? "text-blue-600"
              : "text-gray-500"
          }`}
        >
          <svg
            className={`w-6 h-6 transition-transform duration-200 ${
              currentView === "list" ? "scale-110" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={currentView === "list" ? 2.5 : 2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          <span className={`text-xs font-medium ${
            currentView === "list" ? "font-semibold" : ""
          }`}>
            List
          </span>
        </button>
      </div>
    </nav>
  );
}

