"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import scrollGridPlugin from "@fullcalendar/scrollgrid";
import { Session } from "../types";
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { getCrashCourseConfig } from "../../crash-courses";
import {
  getRegistrationUrl,
  getCtaLabel,
  isMockExam,
} from "@/utils/sessionVariant";
import {
  getSessionAvailability,
  getAvailabilityLabel,
  isRegisterable,
  getCourseEndedCta,
} from "@/utils/sessionAvailability";
import CourseEndedPanel from "@/components/CourseEndedPanel";

function ExamPill() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-black/75 text-white text-[10px] font-bold tracking-wide leading-none">
      EXAM
    </span>
  );
}

export default function CalendarView({
  events,
  now,
}: {
  events: {
    title: string;
    start: Date;
    end: Date;
    extendedProps: Session;
    backgroundColor: string;
    textColor: string;
  }[];
  now: Date;
}) {
  const config = getCrashCourseConfig();
  const calendarRef = useRef<FullCalendar | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<{
    title: string;
    start: Date;
    end: Date;
    extendedProps: Session;
    backgroundColor: string;
    textColor: string;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Jump to the current week on mount when today falls inside the
  // configured dateRange. Static export means initialDate is baked in at
  // build time — without this, every visitor lands on the first week of
  // the run regardless of when they open the page.
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    const today = new Date();
    const start = new Date(config.dateRange.start);
    const end = new Date(config.dateRange.end);
    if (today >= start && today <= end) api.gotoDate(today);
  }, [config.dateRange.start, config.dateRange.end]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEventClick = (arg: any) => {
    setSelectedEvent(arg.event);
    setIsDialogOpen(true);
  };

  // Once the course is over, a translucent overlay covers the calendar with a
  // single "course ended → regular trials" click-out (tagged with the campaign).
  const courseEnded = getCourseEndedCta(config, now, { withCampaign: true });

  return (
    <>
      {config.calendar.tip && !courseEnded && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-blue-700 text-sm">
              <span className="font-semibold">{config.calendar.tip.label}:</span>{" "}
              {config.calendar.tip.body}
            </p>
          </div>
        </div>
      )}
      <div className="relative">
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, dayGridPlugin, scrollGridPlugin]}
        initialView="timeGridWeek"
        validRange={{
          start: new Date(config.dateRange.start),
          end: new Date(config.dateRange.end),
        }}
        firstDay={config.calendar.firstDay}
        initialDate={config.calendar.initialDate}
        headerToolbar={{
          left: isMobile ? "prev,next" : "prev,next today",
          center: "title",
          right: isMobile ? "" : "timeGridWeek,dayGridMonth",
        }}
        views={{
          timeGridThreeDay: {
            type: "timeGrid",
            duration: { days: 3 },
            buttonText: "3 day",
          },
        }}
        events={events}
        nowIndicator={true}
        height="auto"
        slotMinTime={config.calendar.slotMinTime}
        slotMaxTime={config.calendar.slotMaxTime}
        allDaySlot={false}
        displayEventEnd={true}
        dayMinWidth={120}
        stickyHeaderDates={true}
        schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
        eventContent={(arg) => {
          const topic = arg.event.extendedProps.topic;
          const centre = arg.event.extendedProps.centre;
          const session = arg.event.extendedProps as Session;
          const availability = getSessionAvailability(session, config, now);
          const registerable = isRegisterable(availability);
          const isMock = isMockExam(session, config);
          return (
            <div className="p-1 overflow-hidden h-full text-xs leading-tight">
              <div
                className="font-semibold truncate mb-1 flex items-center gap-1"
                title={arg.event.title}
              >
                <span className="truncate">{arg.event.title}</span>
                {isMock && <ExamPill />}
              </div>
              {topic && (
                <div className="opacity-80 truncate" title={`Topic: ${topic}`}>
                  Topic: {topic}
                </div>
              )}
              {centre && (
                <div className="opacity-80 truncate" title={`Centre: ${centre}`}>
                  Centre: {centre}
                </div>
              )}
              <div
                className={`mt-1 truncate ${
                  registerable
                    ? "underline cursor-pointer"
                    : "text-gray-500 cursor-not-allowed"
                }`}
              >
                {getAvailabilityLabel(availability)}
              </div>
            </div>
          );
        }}
        eventClick={handleEventClick}
      />
      {courseEnded && (
        <div className="absolute inset-0 z-20 flex items-start justify-center rounded-lg bg-white/70 px-4 pt-10 backdrop-blur-[2px] sm:pt-16">
          <CourseEndedPanel cta={courseEnded} />
        </div>
      )}
      </div>
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4 bg-black/30">
          <DialogPanel className="max-w-md w-full space-y-4 border bg-white p-6 rounded shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold focus:outline-none"
              onClick={() => setIsDialogOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            {selectedEvent && (
              <>
                <DialogTitle className="font-bold text-lg mb-2 flex items-center gap-2">
                  <span>
                    {[
                      selectedEvent.extendedProps.subject,
                      selectedEvent.extendedProps.topic,
                      selectedEvent.extendedProps.level,
                    ]
                      .filter((part) => part && part.trim().length > 0)
                      .join(" - ")}
                  </span>
                  {isMockExam(selectedEvent.extendedProps, config) && (
                    <ExamPill />
                  )}
                </DialogTitle>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-semibold">Date:</span>{" "}
                    {selectedEvent.extendedProps.date}
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Venue:</span>{" "}
                    {selectedEvent.extendedProps.centre}
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Timeslot:</span>{" "}
                    {selectedEvent.extendedProps.startTime} -{" "}
                    {selectedEvent.extendedProps.endTime}
                  </div>
                </div>
              </>
            )}
            <div className="flex justify-end mt-4">
              {(() => {
                if (!selectedEvent) return null;
                const availability = getSessionAvailability(
                  selectedEvent.extendedProps,
                  config,
                  now
                );
                if (isRegisterable(availability)) {
                  return (
                    <a
                      href={getRegistrationUrl(
                        selectedEvent.extendedProps,
                        config
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        {getCtaLabel(
                          selectedEvent.extendedProps,
                          config,
                          "Register (prefilled)"
                        )}
                      </button>
                    </a>
                  );
                }
                return (
                  <button
                    className="px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed"
                    disabled
                  >
                    {getAvailabilityLabel(availability)}
                  </button>
                );
              })()}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
