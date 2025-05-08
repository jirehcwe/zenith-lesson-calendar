"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useState, useEffect, useMemo, useRef } from "react";
import Filters from "./Filters";

type Session = {
  subject: string;
  level: string;
  tutor: string;
  centre: string;
  classroom: string;
  topic: string;
  date: string;
  startTime: string;
  endTime: string;
};

export default function CalendarPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filters, setFilters] = useState({
    subject: "",
    centre: "",
    tutor: "",
    level: "",
  });
  const [calendarView, setCalendarView] = useState("timeGridWeek");

  const calendarRef = useRef<FullCalendar | null>(null);

  useEffect(() => {
    fetch("/sessions.json")
      .then((res) => res.json())
      .then((data: Session[]) => setSessions(data));
  }, []);

  // Switch calendar view when calendarView state changes
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(calendarView);
    }
  }, [calendarView]);

  // Handle window resize to change calendarView state
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCalendarView("timeGridThreeDay");
      } else {
        setCalendarView("timeGridWeek");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const unique = (field: keyof Session) =>
    Array.from(new Set(sessions.map((s) => s[field]))).sort();

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      return (!filters.subject || s.subject === filters.subject)
        && (!filters.centre || s.centre === filters.centre)
        && (!filters.tutor || s.tutor === filters.tutor)
        && (!filters.level || s.level === filters.level);
    });
  }, [sessions, filters]);

  const events = filteredSessions.map((s) => {
    const start = new Date(`${s.date} 2025 ${s.startTime}`);
    const end = new Date(`${s.date} 2025 ${s.endTime}`);

    return {
      title: `${s.subject} (${s.level}) - ${s.tutor}`,
      start,
      end,
      extendedProps: s,
    };
  });

  return (
    <div className="p-4 space-y-6 text-sm md:text-base">
      <Filters
        subjects={unique("subject")}
        centres={unique("centre")}
        tutors={unique("tutor")}
        levels={unique("level")}
        filters={filters}
        onFilterChange={setFilters}
      />

      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, dayGridPlugin]}
        initialView="timeGridWeek"
        initialDate="2025-05-25"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridWeek,dayGridMonth",
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
      />
    </div>
  );
}
