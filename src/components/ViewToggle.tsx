"use client";

type ViewType = "calendar" | "list";

export default function ViewToggle({
  currentView,
  onViewChange,
}: {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}) {
  return (
    <div className="flex bg-white border border-gray-200 rounded-xl p-0.5 gap-0.5">
      <button
        onClick={() => onViewChange("calendar")}
        className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
          currentView === "calendar" ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Calendar
      </button>
      <button
        onClick={() => onViewChange("list")}
        className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
          currentView === "list" ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        List
      </button>
    </div>
  );
}
