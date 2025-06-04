"use client";

import { WeeklyClassSlot } from "./WeeklyClassCalendar";

export default function ListView({
  sessions,
}: {
  sessions: WeeklyClassSlot[];
  calendarFilter: string | null;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.map((s) => (
          <div
            key={`${s.startTime}-${s.tutor}-${s.centre}-${s.day}`}
            className="p-4 border rounded shadow"
          >
            <div className="font-semibold">{s.subject}</div>
            <div className="text-sm opacity-80">Tutor: {s.tutor}</div>
            <div className="text-sm opacity-80">Centre: {s.centre}</div>
            <div className="text-sm opacity-80">
              Time: {s.startTime} - {s.endTime}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
