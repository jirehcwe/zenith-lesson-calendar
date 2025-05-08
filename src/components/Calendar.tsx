"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import { useState, useEffect, useMemo, useRef } from "react";
import Filters from "./Filters";

type Session = {
  subject: string;
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
    subject: [] as string[],
    topic: [] as string[],
    centre: [] as string[],
    tutor: [] as string[],
  });
  const [calendarView, setCalendarView] = useState("timeGridWeek");
  const calendarRef = useRef<FullCalendar | null>(null);

  const colorMap = {
    red: "#ef4444",
    blue: "#3b82f6",
    green: "#22c55e",
    yellow: "#eab308",
    purple: "#8b5cf6",
    pink: "#ec4899",
    indigo: "#6366f1",
  };

  const subjectColorMap = useMemo(() => {
    const subjects = Array.from(new Set(sessions.map((s) => s.subject))).sort();
    const colorKeys = Object.keys(colorMap);

    const map: Record<string, string> = {};
    subjects.forEach((subject, index) => {
      const key = colorKeys[index % colorKeys.length] as keyof typeof colorMap;
      map[subject] = colorMap[key];
    });

    return map;
  }, [sessions]);

  useEffect(() => {
    fetch("/sessions.json")
      .then((res) => res.json())
      .then((data: Session[]) => setSessions(data));
  }, []);

  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(calendarView);
    }
  }, [calendarView]);

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

  const unique = (field: keyof Session, subjectFilter?: string[]) => {
    return Array.from(
      new Set(
        sessions
          .filter((s) => !subjectFilter || subjectFilter.includes(s.subject))
          .map((s) => s[field])
      )
    ).sort();
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      return (
        (filters.subject.length === 0 || filters.subject.includes(s.subject)) &&
        (filters.topic.length === 0 || filters.topic.includes(s.topic)) &&
        (filters.centre.length === 0 || filters.centre.includes(s.centre)) &&
        (filters.tutor.length === 0 || filters.tutor.includes(s.tutor))
      );
    });
  }, [sessions, filters]);

  const events = filteredSessions.map((s) => {
    const start = new Date(`${s.date} 2025 ${s.startTime}`);
    const end = new Date(`${s.date} 2025 ${s.endTime}`);
    const color = subjectColorMap[s.subject] || "#9ca3af";

    return {
      title: `${s.subject} - ${s.tutor}`,
      start,
      end,
      extendedProps: {
        ...s,
      },
      backgroundColor: color,
      textColor: "#ffffff",
    };
  });

  return (
    <div className="p-4 space-y-6 text-sm md:text-base">
      <Filters
        subjects={unique("subject")}
        topics={unique("topic", filters.subject)}
        centres={unique("centre")}
        tutors={unique("tutor")}
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
        slotMinTime="10:00:00"
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
      />
    </div>
  );
}
