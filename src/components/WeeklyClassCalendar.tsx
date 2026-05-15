"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import scrollGridPlugin from "@fullcalendar/scrollgrid";
import { useEffect, useRef, useState, useMemo } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { replaceCampaignInUrl, replacePromocodeInUrl } from "@/utils/campaign";
import { getFallbackRegistrationLinkByLevel } from "@/utils/prefillRegistration";

// Check if a slot is full based on [FULL] prefix in the title
export function isSlotFull(slot: WeeklyClassSlot): boolean {
  return slot.title.startsWith("[FULL]");
}

const FULL_SLOT_COLOR = { color: "#64748B", tint: "#E5E7EB" };

const LEGEND_ITEMS = [
  { label: "Math",         color: "#B45309", tint: "#FEF3C7" },
  { label: "A Math",       color: "#1E40AF", tint: "#DBEAFE" },
  { label: "Physics",      color: "#BE123C", tint: "#FECDD3" },
  { label: "Chemistry",    color: "#15803D", tint: "#DCFCE7" },
  { label: "Biology",      color: "#166534", tint: "#BBFBD0" },
  { label: "English",      color: "#0369A1", tint: "#BAE6FD" },
  { label: "GP",           color: "#9A3412", tint: "#FED7AA" },
  { label: "Econ",         color: "#4338CA", tint: "#E0E7FF" },
  { label: "History",      color: "#92400E", tint: "#FFEDD5" },
  { label: "Literature",   color: "#831843", tint: "#FCE7F3" },
  { label: "Geography",    color: "#065F46", tint: "#ECFDF5" },
  { label: "Soc. Studies", color: "#6B21A8", tint: "#F3E8FF" },
  { label: "Full",         color: "#64748B", tint: "#E5E7EB" },
] as const;

// Define a new type for weekly class slots (no topic, no date)
export type WeeklyClassSlot = {
  title: string;
  day: number; // 0 (Sunday) to 6 (Saturday)
  startTime: string; // e.g. "10:00"
  endTime: string; // e.g. "12:00"
  subjects: string[];
  tutor: string;
  centre: string;
  stream: string;
  level: string;
  prefillTrialLink: string;
  prefillRegistrationLink?: string;
};

const jcSubjectToColorMap: Record<string, { color: string; tint: string }> = {
  "General Paper": { color: "#9A3412", tint: "#FED7AA" },
  Biology:         { color: "#166534", tint: "#BBFBD0" },
  Physics:         { color: "#BE123C", tint: "#FECDD3" },
  Chemistry:       { color: "#15803D", tint: "#DCFCE7" },
  Mathematics:     { color: "#B45309", tint: "#FEF3C7" },
  Economics:       { color: "#4338CA", tint: "#E0E7FF" },
};

const secSubjectToColorMap: Record<string, { color: string; tint: string }> = {
  Mathematics:          { color: "#B45309", tint: "#FEF3C7" },
  "A Math":             { color: "#1E40AF", tint: "#DBEAFE" },
  "E Math":             { color: "#B45309", tint: "#FEF3C7" },
  "Pure Physics":       { color: "#BE123C", tint: "#FECDD3" },
  "Combined Physics":   { color: "#BE123C", tint: "#FECDD3" },
  Chemistry:            { color: "#15803D", tint: "#DCFCE7" },
  Physics:              { color: "#BE123C", tint: "#FECDD3" },
  Science:              { color: "#BE123C", tint: "#FECDD3" },
  "Pure Chemistry":     { color: "#15803D", tint: "#DCFCE7" },
  "Combined Chemistry": { color: "#15803D", tint: "#DCFCE7" },
  "Pure Biology":       { color: "#166534", tint: "#BBFBD0" },
  "Combined Biology":   { color: "#166534", tint: "#BBFBD0" },
  English:              { color: "#0369A1", tint: "#BAE6FD" },
  "Pure History":       { color: "#92400E", tint: "#FFEDD5" },
  "Combined History":   { color: "#92400E", tint: "#FFEDD5" },
  "Pure Literature":    { color: "#831843", tint: "#FCE7F3" },
  "Combined Literature":{ color: "#831843", tint: "#FCE7F3" },
  "Pure Geography":     { color: "#065F46", tint: "#ECFDF5" },
  "Combined Geography": { color: "#065F46", tint: "#ECFDF5" },
  "Social Studies":     { color: "#6B21A8", tint: "#F3E8FF" },
};

const primarySubjectToColorMap: Record<string, { color: string; tint: string }> = {
  English:     { color: "#0369A1", tint: "#BAE6FD" },
  Mathematics: { color: "#B45309", tint: "#FEF3C7" },
  Science:     { color: "#BE123C", tint: "#FECDD3" },
};

export function getSubjectColor(subject: string, level: string): string {
  return subjectToColor(level, subject).color;
}

function subjectToColor(
  level: string,
  subject: string
): { color: string; tint: string } {
  const normalisedSubject = subject.startsWith("IP ")
    ? subject.slice(3)
    : subject;

  if (level.includes("J")) {
    return jcSubjectToColorMap[normalisedSubject] || FULL_SLOT_COLOR;
  }
  if (level.includes("S")) {
    return secSubjectToColorMap[normalisedSubject] || FULL_SLOT_COLOR;
  }
  if (level.includes("P")) {
    return primarySubjectToColorMap[normalisedSubject] || FULL_SLOT_COLOR;
  }
  return FULL_SLOT_COLOR;
}

// Helper to get a fixed date for a weekday (using a reference week)
function getFixedWeekdayDate(weekday: number): Date {
  // Use a fixed reference date (e.g., January 7, 2024 was a Sunday)
  const referenceDate = new Date(2024, 0, 7); // January 7, 2024 (Sunday)
  const result = new Date(referenceDate);
  result.setDate(referenceDate.getDate() + weekday);
  result.setHours(0, 0, 0, 0);
  return result;
}

const PRO_TIP_STORAGE_KEY = "proTipDismissed";

export default function WeeklyClassCalendar({ slots, isVisible = true }: { slots: WeeklyClassSlot[]; isVisible?: boolean }) {
  const [selectedEvent, setSelectedEvent] = useState<WeeklyClassSlot | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProTipDismissed, setIsProTipDismissed] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    const stored = localStorage.getItem(PRO_TIP_STORAGE_KEY);
    if (stored === "true") {
      setIsProTipDismissed(true);
    }
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      calendarRef.current?.getApi().updateSize();
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Re-measure after becoming visible — scrollGrid loses its column widths when hidden
  useEffect(() => {
    if (!isVisible) return;
    const id = requestAnimationFrame(() => {
      calendarRef.current?.getApi().updateSize();
    });
    return () => cancelAnimationFrame(id);
  }, [isVisible]);

  const handleDismissProTip = () => {
    setIsProTipDismissed(true);
    localStorage.setItem(PRO_TIP_STORAGE_KEY, "true");
  };

  // Convert weekly slots to FullCalendar events for the current week
  const events = useMemo(() => {
    return slots.map((slot) => {
      // Adjust slot.day if the calendar starts on Monday and slot is Sunday
      let adjustedDay = slot.day;
      if (slot.day === 0) {
        adjustedDay = 7; // Treat Sunday as the 7th day (after Saturday) for a Monday-first calendar
      }
      const baseDate = getFixedWeekdayDate(adjustedDay);
      const [startHour, startMinute] = slot.startTime.split(":").map(Number);
      const [endHour, endMinute] = slot.endTime.split(":").map(Number);
      const start = new Date(baseDate);
      start.setHours(startHour, startMinute, 0, 0);
      const end = new Date(baseDate);
      end.setHours(endHour, endMinute, 0, 0);
      const full = isSlotFull(slot);
      const colors = full
        ? FULL_SLOT_COLOR
        : subjectToColor(slot.level, slot.subjects[0] ?? "");
      return {
        title: `${slot.level} ${slot.subjects.join(" + ")} ${
          slot.stream ? `(${slot.stream})` : ""
        }`,
        start,
        end,
        extendedProps: slot,
        backgroundColor: colors.tint,
        textColor: colors.color,
      };
    });
  }, [slots]);

  const emptyDayStyles = useMemo(() => {
    if (slots.length === 0) return '';
    const dayClassMap: Record<number, string> = {
      0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
    };
    const activeDays = new Set(slots.map(s => s.day));
    return [0, 1, 2, 3, 4, 5, 6]
      .filter(d => !activeDays.has(d))
      .map(d => {
        const c = dayClassMap[d];
        return `.fc-col-header-cell.fc-day-${c}{opacity:0.35}.fc-timegrid-col.fc-day-${c}{background:rgba(248,250,252,0.7)!important}`;
      })
      .join('');
  }, [slots]);

  useEffect(() => {
    const styleId = 'zenith-fc-empty-day-styles';
    let el = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = styleId;
      document.head.appendChild(el);
    }
    el.textContent = emptyDayStyles;
    return () => { if (el) el.textContent = ''; };
  }, [emptyDayStyles]);

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  const handleEventClick = (arg: any) => {
    setSelectedEvent(arg.event.extendedProps);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Custom CSS for FullCalendar hover effects */}
      <style jsx>{`
        :global(.fc-v-event) {
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          background: transparent !important;
          border: none !important;
        }
        :global(.fc-v-event:hover) {
          transform: translateY(-1px) scale(1.02) !important;
          filter: brightness(1.04) !important;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12) !important;
        }
        :global(.fc) {
          --fc-border-color: #CBD5E1;
        }
        :global(.fc-col-header) {
          background-color: #F9FAFB;
        }
        :global(.fc-timegrid-slot-label-cushion) {
          font-size: 11px !important;
          color: #94a3b8 !important;
        }
      `}</style>

      {!isProTipDismissed && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 relative">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xl">💡</span>
          </div>
          <div className="text-sm text-gray-700 flex-1">
            <span className="font-semibold text-blue-800">Pro Tip:</span> Use the
            filters above to reduce overlap and see specific classes more clearly.
            Click on any class for a free trial or register directly!
          </div>
          <button
            onClick={handleDismissProTip}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Dismiss pro tip"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <FullCalendar
          ref={calendarRef}
          schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
          plugins={[timeGridPlugin, scrollGridPlugin]}
          initialView="timeGridWeek"
          initialDate="2024-01-08" // Fixed reference date (Monday)
          headerToolbar={false}
          views={{}}
          events={events}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dayHeaderContent={(args: any) => {
            const dayName = args.date.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase();
            const count = events.filter((e) => e.start.toDateString() === args.date.toDateString()).length;
            return (
              <div style={{ textAlign: "center", lineHeight: 1.2, padding: "10px 0" }}>
                <div style={{ fontWeight: 700, letterSpacing: "0.06em" }}>{dayName}</div>
                {count > 0 && (
                  <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 400, marginTop: "1px" }}>
                    {count} class{count !== 1 ? "es" : ""}
                  </div>
                )}
              </div>
            );
          }}
          height="auto"
          slotMinTime="09:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          displayEventEnd={true}
          // Disable navigation since this is a template view
          navLinks={false}
          stickyHeaderDates={false}
          dayMinWidth={100}
          eventContent={(arg) => {
            const slotData = arg.event.extendedProps as WeeklyClassSlot;
            const full = isSlotFull(slotData);
            const colors = full
              ? FULL_SLOT_COLOR
              : subjectToColor(slotData.level, slotData.subjects[0] ?? "");
            return (
              <div
                style={{
                  height: "100%",
                  background: colors.tint,
                  borderLeft: `3px solid ${colors.color}`,
                  borderRadius: "2px",
                  padding: "4px 6px",
                  color: colors.color,
                  fontFamily: "var(--font-manrope), 'Manrope', sans-serif",
                  fontSize: "12px",
                  fontWeight: 700,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  boxSizing: "border-box",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                }}
              >
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {arg.event.title}
                </div>
                {slotData.centre && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      fontSize: "11px",
                      fontWeight: 400,
                      opacity: 0.78,
                      overflow: "hidden",
                    }}
                  >
                    <svg
                      width="8"
                      height="10"
                      viewBox="0 0 10 13"
                      fill="currentColor"
                      aria-hidden="true"
                      style={{ flexShrink: 0 }}
                    >
                      <path d="M5 0C2.24 0 0 2.24 0 5c0 3.75 5 8 5 8s5-4.25 5-8c0-2.76-2.24-5-5-5zm0 6.5c-.83 0-1.5-.67-1.5-1.5S4.17 3.5 5 3.5 6.5 4.17 6.5 5 5.83 6.5 5 6.5z" />
                    </svg>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                      {slotData.centre}
                    </span>
                  </div>
                )}
                {full && (
                  <div style={{ fontSize: "10px", fontWeight: 600, opacity: 0.7 }}>
                    Class is full
                  </div>
                )}
              </div>
            );
          }}
          eventClick={handleEventClick}
          // Show only one week, starting from Monday
          firstDay={1}
          weekends={true}
        />
        <div className="flex flex-wrap gap-x-4 gap-y-2 px-3 py-2.5 border-t border-slate-200 bg-gray-50">
          {LEGEND_ITEMS.map(({ label, color, tint }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color, fontFamily: "var(--font-manrope), 'Manrope', sans-serif", fontWeight: 600 }}>
              <span style={{ display: "inline-block", width: "12px", height: "12px", background: tint, borderLeft: `2px solid ${color}`, borderRadius: "2px", flexShrink: 0 }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 flex w-screen items-center justify-center p-3 bg-black/50 backdrop-blur-sm">
          <DialogPanel className="max-w-sm w-full bg-white rounded-2xl shadow-2xl relative overflow-hidden border-0">
            {/* Hero header band */}
            {selectedEvent && (
              <div
                className="px-5 pt-5 pb-4 relative"
                style={{
                  backgroundColor:
                    subjectToColor(selectedEvent.level, selectedEvent.subjects[0] ?? "").tint,
                }}
              >
                <button
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-900 hover:text-white transition-colors focus:outline-none"
                  onClick={() => setIsDialogOpen(false)}
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-1 pr-10">
                  {selectedEvent.stream} · {selectedEvent.level}
                </div>
                <DialogTitle className="text-2xl font-extrabold text-gray-900">
                  {selectedEvent.subjects.join(" + ")}
                </DialogTitle>
              </div>
            )}

            {/* Details + CTAs */}
            {selectedEvent && (
              <div className="px-5 pt-4 pb-5 space-y-4">
                {/* Icon-row details */}
                <div
                  className="rounded-xl p-3.5 space-y-3"
                  style={{
                    backgroundColor:
                      subjectToColor(selectedEvent.level, selectedEvent.subjects[0] ?? "").tint + "55",
                  }}
                >
                  {/* Day */}
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0" style={{ border: `1px solid ${subjectToColor(selectedEvent.level, selectedEvent.subjects[0] ?? "").color}4D` }}>
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][selectedEvent.day]}
                    </span>
                  </div>
                  {/* Time */}
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0" style={{ border: `1px solid ${subjectToColor(selectedEvent.level, selectedEvent.subjects[0] ?? "").color}4D` }}>
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      {selectedEvent.startTime} – {selectedEvent.endTime}
                    </span>
                  </div>
                  {/* Venue */}
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0" style={{ border: `1px solid ${subjectToColor(selectedEvent.level, selectedEvent.subjects[0] ?? "").color}4D` }}>
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{selectedEvent.centre}</span>
                  </div>
                </div>

                {isSlotFull(selectedEvent) ? (
                  <button
                    disabled
                    className="w-full bg-gray-100 text-gray-500 font-medium py-2.5 px-4 rounded-lg text-sm cursor-not-allowed"
                  >
                    This class is currently full
                  </button>
                ) : (
                  <div className="flex gap-2.5">
                    {selectedEvent.prefillTrialLink && (
                      <a
                        href={replacePromocodeInUrl(replaceCampaignInUrl(selectedEvent.prefillTrialLink))}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => console.log("form_click_prefilled")}
                        className="flex-1 flex items-center justify-center bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold text-sm py-2.5 px-4 rounded-lg text-center transition-all duration-200"
                      >
                        Sign up for FREE Trial
                      </a>
                    )}
                    <a
                      href={replacePromocodeInUrl(replaceCampaignInUrl(
                        selectedEvent.prefillRegistrationLink ??
                          getFallbackRegistrationLinkByLevel(selectedEvent.level ?? "Unknown")
                      ))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 px-4 rounded-lg text-center transition-all duration-200"
                    >
                      Register now
                    </a>
                  </div>
                )}
              </div>
            )}
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
