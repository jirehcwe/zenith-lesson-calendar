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
    topic: "-",
    centre: "",
    tutor: "",
    level: "",
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

  const unique = (field: keyof Session, subjectFilter?: string) => {
    return Array.from(
      new Set(
        sessions
          .filter((s) => !subjectFilter || s.subject === subjectFilter)
          .map((s) => s[field])
      )
    ).sort();
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      return (
        (!filters.subject || s.subject === filters.subject) &&
        (!filters.topic ||
          filters.topic === "All" ||
          filters.topic === "-" ||
          s.topic === filters.topic) &&
        (!filters.centre ||
          filters.centre === "All" ||
          s.centre === filters.centre) &&
        (!filters.tutor ||
          filters.tutor === "All" ||
          s.tutor === filters.tutor) &&
        (!filters.level || filters.level === "All" || s.level === filters.level)
      );
    });
  }, [sessions, filters]);

  const events = filteredSessions.map((s) => {
    const start = new Date(`${s.date} 2025 ${s.startTime}`);
    const end = new Date(`${s.date} 2025 ${s.endTime}`);
    const color = subjectColorMap[s.subject] || "#9ca3af"; // default gray

    return {
      title: `${s.subject} (${s.level}) - ${s.tutor}`,
      start,
      end,
      extendedProps: {
        topic: s.topic,
        subject: s.subject,
        ...s,
      },
      backgroundColor: color, // 👈 this overrides the blue
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
        eventClassNames={(arg) => {
          const subject = arg.event.extendedProps.subject;
          const bgClass = subjectColorMap[subject] || "bg-gray-400";
          return [bgClass, "text-white", "rounded", "p-1"];
        }}
        eventContent={(arg) => {
          const topic = arg.event.extendedProps.topic;
          return (
            <div>
              <div className="font-semibold">{arg.event.title}</div>
              {topic && topic !== "-" && <div className="text-s">{topic}</div>}
            </div>
          );
        }}
      />
    </div>
  );
}
