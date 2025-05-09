"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import { END_DATE, Session, START_DATE } from "../types";
import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

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

  // @ts-ignore
  const handleEventClick = (arg: any) => {
    setSelectedEvent(arg.event);
    setIsDialogOpen(true);
  };

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
          <DialogPanel className="max-w-md w-full space-y-4 border bg-white p-6 rounded shadow-lg">
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
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => setIsDialogOpen(false)}
              >
                Close
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
