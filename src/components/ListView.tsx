"use client";

import { Session } from "../types";
import DatePicker from "react-datepicker";
import { getCrashCourseConfig } from "../../crash-courses";

const config = getCrashCourseConfig();

export default function ListView({
  sessions,
  calendarFilter,
  onCalendarFilterChange,
}: {
  sessions: Session[];
  calendarFilter: string | null;
  onCalendarFilterChange: (date: string | null) => void;
}) {
  // Normalize session date: "24 May" => "2025-05-24"
  const normalizeDate = (raw: string): string | null => {
    const parsed = Date.parse(`${raw} ${config.year}`);
    if (isNaN(parsed)) return null;
    const d = new Date(parsed);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const filtered = calendarFilter
    ? sessions.filter((s) => normalizeDate(s.date) === calendarFilter)
    : sessions;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <label className="font-semibold">Date:</label>
        <DatePicker
          selected={calendarFilter ? new Date(calendarFilter) : null}
          onChange={(date) => {
            if (!date) {
              onCalendarFilterChange(null);
            } else {
              const year = date.getFullYear();
              const month = (date.getMonth() + 1).toString().padStart(2, "0");
              const day = date.getDate().toString().padStart(2, "0");
              onCalendarFilterChange(`${year}-${month}-${day}`);
            }
          }}
          placeholderText="Select date"
          className="border p-2 rounded"
          dateFormat="yyyy-MM-dd"
          isClearable
          minDate={new Date(config.calendar.listViewMinDate)}
          maxDate={new Date(config.dateRange.end)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((s) => (
          <div
            key={`${s.date}-${s.startTime}-${s.tutor}`}
            className="p-4 border rounded shadow flex flex-col"
          >
            <div className="font-semibold">{s.subject}</div>
            <div className="text-sm opacity-80">Topic: {s.topic}</div>
            <div className="text-sm opacity-80">Centre: {s.centre}</div>
            <div className="text-sm opacity-80">Date: {s.date}</div>
            <div className="text-sm opacity-80">
              Time: {s.startTime} - {s.endTime}
            </div>
            <div className="mt-4 flex justify-end">
              {s.prefill ? (
                <a
                  href={`https://docs.google.com/forms/d/e/1FAIpQLSdc1DdBljxZx1mXH6Ztpxr_zbnI9XJunAKHDeN_GVR1jBuI9Q/viewform?entry.1157532004=SCHEDULE&entry.${
                    s.prefillField
                  }=${encodeURIComponent(s.prefill)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                    Register (prefilled)
                  </button>
                </a>
              ) : (
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed text-sm"
                  disabled
                >
                  Class Full
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
