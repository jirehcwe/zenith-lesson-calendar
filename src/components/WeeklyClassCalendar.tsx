"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { track } from "@vercel/analytics";

// Define a new type for weekly class slots (no topic, no date)
export type WeeklyClassSlot = {
  title: string;
  day: number; // 0 (Sunday) to 6 (Saturday)
  startTime: string; // e.g. "10:00"
  endTime: string; // e.g. "12:00"
  subject: string;
  tutor: string;
  centre: string;
  stream: string;
  level: string;
  prefillLink: string;
};

// Helper to get the next occurrence of a weekday (0=Sunday, 1=Monday, ...)
function getNextWeekdayDate(weekday: number): Date {
  const now = new Date();
  const currentDay = now.getDay();
  const diff = (weekday - currentDay + 7) % 7;
  const result = new Date(now);
  result.setDate(now.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export default function WeeklyClassCalendar({
  slots, 
}: {
  slots: WeeklyClassSlot[];
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isMobile, setIsMobile] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<WeeklyClassSlot | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Convert weekly slots to FullCalendar events for the current week
  const events = slots.map((slot) => {
    const baseDate = getNextWeekdayDate(slot.day);
    const [startHour, startMinute] = slot.startTime.split(":").map(Number);
    const [endHour, endMinute] = slot.endTime.split(":").map(Number);
    const start = new Date(baseDate);
    start.setHours(startHour, startMinute, 0, 0);
    const end = new Date(baseDate);
    end.setHours(endHour, endMinute, 0, 0);
    return {
      title: slot.title,
      start,
      end,
      extendedProps: slot,
      backgroundColor: "#000000",
      textColor: "#ffffff",
    };
  });

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  const handleEventClick = (arg: any) => {
    console.log(arg.event.extendedProps);
    setSelectedEvent(arg.event.extendedProps);
    setIsDialogOpen(true);
  };

  return (
    <>
      <FullCalendar
        plugins={[timeGridPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "",
          center: "",
          right: "",
        }}
        views={{}}
        events={events}
        dayHeaderContent={(args) => {
          return args.date.toLocaleDateString(undefined, { weekday: "short" });
        }}
        height="auto"
        slotMinTime="07:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        displayEventEnd={true}
        eventContent={(arg) => {
          const centre = arg.event.extendedProps.location;
          return (
            <div>
              <div className="font-semibold">{arg.event.title}</div>
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
        // Show only one week, starting from Sunday
        firstDay={0}
        weekends={true}
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
                  {selectedEvent.subject} - {selectedEvent.level}
                </DialogTitle>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-semibold">Day:</span>{" "}
                    {
                      [
                        "Sunday",
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                      ][selectedEvent.day]
                    }
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Venue:</span>{" "}
                    {selectedEvent.centre}
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Timeslot:</span>{" "}
                    {selectedEvent.startTime} - {selectedEvent.endTime}
                  </div>
                </div>
              </>
            )}
            <div className="flex justify-end mt-4">
              {selectedEvent?.prefillLink ? (
                <a
                  href={selectedEvent.prefillLink}
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
