"use client";

export type ViewType = "calendar" | "list";

interface ViewSelectorProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export default function ViewSelector({
  currentView,
  onViewChange,
}: ViewSelectorProps) {
  return (
    <div className="flex items-center justify-center mt-2 p-2">
      <div className="flex bg-gray-100 rounded-xl p-1 shadow-sm">
        <button
          onClick={() => onViewChange("calendar")}
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
          onClick={() => onViewChange("list")}
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
