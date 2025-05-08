"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import { Session } from "../types";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  return (
    <FullCalendar
      plugins={[timeGridPlugin, dayGridPlugin]}
      initialView="timeGridWeek"
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
      slotMinTime="07:00:00"
      slotMaxTime="22:00:00"
      allDaySlot={false}
      displayEventEnd={true}
      eventContent={(arg) => {
        const topic = arg.event.extendedProps.topic;
        const centre = arg.event.extendedProps.centre;
        return (
          <div>
            <div className="font-semibold">{arg.event.title}</div>
            {topic && <div className="text-xs opacity-80">Topic: {topic}</div>}
            {centre && (
              <div className="text-xs opacity-80">Centre: {centre}</div>
            )}
          </div>
        );
      }}
    />
  );
}
