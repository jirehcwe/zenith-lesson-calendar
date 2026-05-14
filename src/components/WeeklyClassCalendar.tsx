"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import scrollGridPlugin from "@fullcalendar/scrollgrid";
import { useEffect, useState, useMemo } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { replaceCampaignInUrl, replacePromocodeInUrl } from "@/utils/campaign";
import { getFallbackRegistrationLinkByLevel } from "@/utils/prefillRegistration";

// Helper function to format location display text
function formatLocationDisplay(location: string): string {
  return location;
}

// Check if a slot is full based on [FULL] prefix in the title
export function isSlotFull(slot: WeeklyClassSlot): boolean {
  return slot.title.startsWith("[FULL]");
}

const FULL_SLOT_COLOR = { color: "#64748B", tint: "#E5E7EB" };

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

export default function WeeklyClassCalendar({
  slots,
}: // filters,
{
  slots: WeeklyClassSlot[];
  filters: {
    subject: string[];
    centre: string[];
    tutor: string[];
    level: string[];
    stream: string | null;
  };
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isMobile, setIsMobile] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<WeeklyClassSlot | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProTipDismissed, setIsProTipDismissed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(PRO_TIP_STORAGE_KEY);
    if (stored === "true") {
      setIsProTipDismissed(true);
    }
  }, []);

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
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
        }
        :global(.fc-v-event:hover) {
          transform: scale(1.05) translateY(-1px) !important;
          filter: brightness(0.9) !important;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25) !important;
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

      <div className="relative overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <FullCalendar
          schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
          plugins={[timeGridPlugin, scrollGridPlugin]}
          initialView="timeGridWeek"
          initialDate="2024-01-08" // Fixed reference date (Monday)
          headerToolbar={{
            left: "",
            center: "",
            right: "",
          }}
          views={{}}
          events={events}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dayHeaderContent={(args: any) => {
            // Show only the day name, not the date
            return args.date.toLocaleDateString(undefined, {
              weekday: "short",
            });
          }}
          height="auto"
          slotMinTime="09:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          displayEventEnd={true}
          // Disable navigation since this is a template view
          navLinks={false}
          // Hide the date numbers, only show day names
          dayHeaderFormat={{ weekday: "short" }}
          stickyHeaderDates={true}
          dayMinWidth={100}
          eventContent={(arg) => {
            const centre = arg.event.extendedProps.centre;
            const full = isSlotFull(arg.event.extendedProps as WeeklyClassSlot);
            return (
              <div className="p-1 h-full flex flex-col justify-between overflow-hidden">
                <div className="flex-1 min-h-0">
                  <div className="font-semibold truncate text-sm">
                    {arg.event.title}
                  </div>
                  {centre && (
                    <div className="text-xs opacity-80 truncate">
                      {formatLocationDisplay(centre)}
                    </div>
                  )}
                </div>
                {full ? (
                  <div className="text-xs font-semibold opacity-90 truncate flex-shrink-0">
                    FULL
                  </div>
                ) : (
                  <div className="text-xs underline opacity-90 truncate flex-shrink-0">
                    Free Trial/Registration
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
                    subjectToColor(selectedEvent.level, selectedEvent.subjects[0] ?? "").tint + "66",
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
                      subjectToColor(selectedEvent.level, selectedEvent.subjects[0] ?? "").tint + "33",
                  }}
                >
                  {/* Day */}
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-white/80 shadow-sm flex items-center justify-center flex-shrink-0">
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
                    <div className="w-7 h-7 rounded-full bg-white/80 shadow-sm flex items-center justify-center flex-shrink-0">
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
                    <div className="w-7 h-7 rounded-full bg-white/80 shadow-sm flex items-center justify-center flex-shrink-0">
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
