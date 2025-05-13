"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import { END_DATE, Session, START_DATE } from "../types";
import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { track } from "@vercel/analytics";

export default function CalendarView({
  events,
}: {
  events: {
    title: string;
    start: Date;
    end: Date;
    extendedProps: Session;
    backgroundColor: string;
    textColor: string;
  }[];
}) {
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
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  const handleEventClick = (arg: any) => {
    setSelectedEvent(arg.event);
    setIsDialogOpen(true);
  };

  console.log(
    selectedEvent
      ? `https://docs.google.com/forms/d/e/1FAIpQLSdqyeoGBF4DyUXQA3cUOaZee3DB5NFhTtqPRyN5wdkQcIgL0Q/viewform?usp=pp_url&entry.1157532004=SCHEDULE&entry.${
          selectedEvent.extendedProps.prefillField
        }=${encodeURIComponent(selectedEvent.extendedProps.prefill)
          .replace(/%20/g, "+")
          .replace(/%3A/g, ":")}`
      : null
  );

  return (
    <>
      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin]}
        initialView="timeGridWeek"
        validRange={{ start: START_DATE, end: END_DATE }}
        initialDate="2025-05-25"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: isMobile ? "timeGridWeek" : "timeGridWeek,dayGridMonth",
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
        slotMinTime="09:00:00"
        slotMaxTime="20:00:00"
        allDaySlot={false}
        displayEventEnd={true}
        eventContent={(arg) => {
          const topic = arg.event.extendedProps.topic;
          const centre = arg.event.extendedProps.centre;
          return (
            <div>
              <div className="font-semibold">{arg.event.title}</div>
              {topic && (
                <div className="text-xs opacity-80">Topic: {topic}</div>
              )}
              {centre && (
                <div className="text-xs opacity-80">Centre: {centre}</div>
              )}
              <br />
              <div className="underline cursor-pointer">
                Click for registration link
              </div>
            </div>
          );
        }}
        eventClick={handleEventClick}
      />
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
                <DialogTitle className="font-bold text-lg mb-2">
                  {selectedEvent.extendedProps.subject} -{" "}
                  {selectedEvent.extendedProps.topic} -{" "}
                  {selectedEvent.extendedProps.level}
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
              {selectedEvent?.extendedProps.prefill ? (
                <a
                  href={`https://docs.google.com/forms/d/e/1FAIpQLSdqyeoGBF4DyUXQA3cUOaZee3DB5NFhTtqPRyN5wdkQcIgL0Q/viewform?entry.1157532004=SCHEDULE&entry.${
                    selectedEvent.extendedProps.prefillField
                  }=${encodeURIComponent(selectedEvent.extendedProps.prefill)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    track("form_click_prefilled");
                  }}
                >
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Register (prefilled)
                  </button>
                </a>
              ) : null}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
