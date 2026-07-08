"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useEffect, useRef, useState, useMemo } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { replaceCampaignInUrl, replacePromocodeInUrl } from "@/utils/campaign";
import { getFallbackRegistrationLinkByLevel } from "@/utils/prefillRegistration";
import { to12hr } from "@/utils/time";
import {
  subjectToColor,
  getSubjectColor,
  getLegendItemsForStream,
  legendItemsForLevel,
  LEGEND_ORDER,
  FULL_SWATCH,
} from "@/utils/subjectColors";

// Re-exported so existing consumers (ListView, tests) import from here unchanged.
export { getSubjectColor, getLegendItemsForStream };

// Check if a slot is full based on [FULL] prefix in the title
export function isSlotFull(slot: WeeklyClassSlot): boolean {
  return slot.title.startsWith("[FULL]");
}

// Define a new type for weekly class slots (no topic, no date)
export type WeeklyClassSlot = {
  classSlotId?: string;
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

// Build the color legend from the currently visible slots. Each swatch is
// resolved against the palette for that slot's own level, so the legend always
// matches the colors actually rendered on the calendar — the block color comes
// from subjectToColor(slot.level, ...), so the label must too. Deriving the
// palette from a single `selectedStream` breaks when the stream filter is unset
// but a level filter is active (e.g. level=J1, stream=null): the blocks are JC
// colors while the palette would be the combined one, dropping most subjects.
export function computeLegendItems(
  slots: WeeklyClassSlot[],
  selectedStream: string | null
): { label: string; color: string; tint: string }[] {
  if (slots.length === 0) return getLegendItemsForStream(selectedStream);
  const seen = new Set<string>();
  const result: { label: string; color: string; tint: string }[] = [];
  for (const slot of slots) {
    if (isSlotFull(slot)) continue;
    const { color } = subjectToColor(slot.level, slot.subjects[0] ?? "");
    if (seen.has(color)) continue;
    seen.add(color);
    const match = legendItemsForLevel(slot.level).find(
      (item) => item.color === color
    );
    if (match) result.push(match);
  }
  result.sort(
    (a, b) => LEGEND_ORDER.indexOf(a.color) - LEGEND_ORDER.indexOf(b.color)
  );
  if (slots.some(isSlotFull)) {
    const fullItem = getLegendItemsForStream(selectedStream).find(
      (item) => item.label === "Full"
    );
    if (fullItem) result.push(fullItem);
  }
  return result;
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
  isVisible = true,
  hasActiveFilters = false,
  selectedStream = null,
  onEmptyStateClick,
}: {
  slots: WeeklyClassSlot[];
  isVisible?: boolean;
  hasActiveFilters?: boolean;
  selectedStream?: string | null;
  onEmptyStateClick?: () => void;
}) {
  const [selectedEvent, setSelectedEvent] = useState<WeeklyClassSlot | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProTipDismissed, setIsProTipDismissed] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollShadows, setScrollShadows] = useState({ left: false, right: false });

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const update = () => setScrollShadows({
      left: el.scrollLeft > 0,
      right: el.scrollLeft < el.scrollWidth - el.clientWidth - 1,
    });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", update); ro.disconnect(); };
  }, []);

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
        ? FULL_SWATCH
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

  const legendItems = useMemo(
    () => computeLegendItems(slots, selectedStream),
    [slots, selectedStream]
  );

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
    <div className="flex flex-col gap-6">
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
        @media (max-width: 1023px) {
          :global(.fc-scrollgrid-section-header td:not(.fc-timegrid-axis)) {
            position: sticky !important;
            top: 0 !important;
            z-index: 20 !important;
            background: #F9FAFB !important;
          }
        }
      `}</style>

      {!isProTipDismissed && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 relative">
          <div className="flex-shrink-0 w-6 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xl">💡</span>
          </div>
          <div className="text-sm text-gray-700 flex-1">
            <span className="font-semibold text-blue-800">Pro Tip:</span> Use the
            filters to reduce overlap and see specific classes more clearly.
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

      <div className="relative">
        <div className="relative">
          {scrollShadows.left  && <div className="lg:hidden pointer-events-none absolute inset-y-0 left-0  w-6 z-10 rounded-l-xl" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.15), transparent)" }} />}
          {scrollShadows.right && <div className="lg:hidden pointer-events-none absolute inset-y-0 right-0 w-6 z-10 rounded-r-xl" style={{ background: "linear-gradient(to left,  rgba(0,0,0,0.15), transparent)" }} />}
          <div ref={scrollContainerRef} className="overflow-x-auto rounded-t-xl border border-b-0 border-slate-200" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflowY: "clip" }}>
            <div className="min-w-[720px]">
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin]}
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
          slotLabelFormat={{ hour: "numeric", minute: "2-digit", hour12: true } as object}
          allDaySlot={false}
          displayEventEnd={true}
          // Disable navigation since this is a template view
          navLinks={false}
          stickyHeaderDates={false}
          eventContent={(arg) => {
            const slotData = arg.event.extendedProps as WeeklyClassSlot;
            const full = isSlotFull(slotData);
            const colors = full
              ? FULL_SWATCH
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
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 px-3 py-2.5 border-x border-b border-slate-200 bg-gray-50 rounded-b-xl">
          {legendItems.map(({ label, color, tint }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color, fontFamily: "var(--font-manrope), 'Manrope', sans-serif", fontWeight: 600 }}>
              <span style={{ display: "inline-block", width: "12px", height: "12px", background: tint, borderLeft: `2px solid ${color}`, borderRadius: "2px", flexShrink: 0 }} />
              {label}
            </div>
          ))}
        </div>

      {/* Empty-state overlay — shown when no filters are selected */}
      {slots.length === 0 && !hasActiveFilters && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="text-center px-12 py-6 pointer-events-auto bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-600">Select a stream to see classes</p>
            <p className="text-xs text-gray-400 mt-1">Filter by stream, level, subject, or centre</p>
            {onEmptyStateClick && (
              <button
                onClick={onEmptyStateClick}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-sm hover:shadow-md mt-4"
              >
                Open filters
              </button>
            )}
          </div>
        </div>
      )}
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
                  {selectedEvent.stream && `${selectedEvent.stream} · `}{selectedEvent.level}
                </div>
                <DialogTitle className="text-2xl font-extrabold text-gray-900">
                  {selectedEvent.subjects.join(" + ")}
                </DialogTitle>
              </div>
            )}

            {/* Details + CTAs */}
            {selectedEvent && (
              <div className="px-5 pt-4 pb-5 flex flex-col gap-4">
                {/* Icon-row details */}
                <div
                  className="rounded-xl p-3.5 flex flex-col gap-3"
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
                      {to12hr(selectedEvent.startTime)} – {to12hr(selectedEvent.endTime)}
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
