"use client";

import { useState, useEffect, useMemo } from "react";
import CalendarView from "../components/CalendarView";
import ListView from "../components/ListView";
import Filters from "../components/Filters";
import { Session } from "../types";
import SignupBanner from "../components/SignupBanner";
import BottomBanner from "@/components/BottomBanner";

export default function Page() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filters, setFilters] = useState({
    subject: [] as string[],
    topic: [] as string[],
    centre: [] as string[],
    tutor: [] as string[],
  });
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [calendarFilter, setCalendarFilter] = useState<string | null>(null);

  useEffect(() => {
    fetch("/sessions-ss.json")
      .then((res) => res.json())
      .then((data: Session[]) => setSessions(data));
  }, []);

  // Generic filter logic
  const applyFilters = (sessions: Session[]) => {
    return sessions.filter((s) => {
      return (
        (filters.subject.length === 0 || filters.subject.includes(s.subject)) &&
        (filters.topic.length === 0 ||
          filters.topic.includes(`[${s.subject}] ${s.topic}`)) &&
        (filters.centre.length === 0 || filters.centre.includes(s.centre))
      );
    });
  };

  // Calendar view filtered sessions (must NOT show anything if nothing selected)
  const calendarFilteredSessions = useMemo(() => {
    return applyFilters(sessions);
  }, [sessions, filters]);

  // List view filtered sessions (always show filtered, date handled inside ListView)
  const listFilteredSessions = useMemo(() => {
    return applyFilters(sessions);
  }, [sessions, filters]);

  const events = useMemo(() => {
    const jcSubjectToColorMap: Record<
      string,
      { backgroundColor: string; textColor: string }
    > = {
      "General Paper": {
        backgroundColor: "#FBBC03",
        textColor: "#000000",
      },
      Biology: {
        backgroundColor: "#95B0F0",
        textColor: "#000000",
      },
      Physics: {
        backgroundColor: "#95F095",
        textColor: "#000000",
      },
      Chemistry: {
        backgroundColor: "#FFFF02",
        textColor: "#000000",
      },
      Mathematics: {
        backgroundColor: "#BFFCFF",
        textColor: "#000000",
      },
      Economics: {
        backgroundColor: "#7BFF85",
        textColor: "#000000",
      },
    };

    const secSubjectToColorMap: Record<
      string,
      { backgroundColor: string; textColor: string }
    > = {
      Mathematics: {
        backgroundColor: "#FED966",
        textColor: "#000000",
      },
      Math: {
        backgroundColor: "#FED966",
        textColor: "#000000",
      },
      "IP Math": {
        backgroundColor: "#FED966",
        textColor: "#000000",
      },
      "A Math": {
        backgroundColor: "#CFE2F3",
        textColor: "#000000",
      },
      "E Math": {
        backgroundColor: "#CFE2F3",
        textColor: "#000000",
      },
      "Pure Physics": {
        backgroundColor: "#C27BA0",
        textColor: "#000000",
      },
      "Combined Physics": {
        backgroundColor: "#C27BA0",
        textColor: "#000000",
      },
      // IP
      Chemistry: {
        backgroundColor: "#C27BA0",
        textColor: "#000000",
      },
      // Lower sec science
      Science: {
        backgroundColor: "#C27BA0",
        textColor: "#000000",
      },
      "IP Science": {
        backgroundColor: "#C27BA0",
        textColor: "#000000",
      },
      "Pure Chemistry": {
        backgroundColor: "#F4CCCC",
        textColor: "#000000",
      },
      "Combined Chemistry": {
        backgroundColor: "#F4CCCC",
        textColor: "#000000",
      },
      "Pure Biology": {
        backgroundColor: "#D9EAD3",
        textColor: "#000000",
      },
      "Combined Biology": {
        backgroundColor: "#D9EAD3",
        textColor: "#000000",
      },
      English: {
        backgroundColor: "#DD7E6B",
        textColor: "#000000",
      },
      "IP English": {
        backgroundColor: "#DD7E6B",
        textColor: "#000000",
      },
    };

    const map = calendarFilteredSessions[0]?.level.includes("J")
      ? jcSubjectToColorMap
      : secSubjectToColorMap;

    return calendarFilteredSessions.map((s) => {
      const color = map[s.displaySubject];
      if (color === undefined) {
        throw new Error(`No color found for ${s.displaySubject}`);
      }
      return {
        title: `${s.subject}`,
        start: new Date(`${s.date} 2025 ${s.startTime}`),
        end: new Date(`${s.date} 2025 ${s.endTime}`),
        extendedProps: { ...s },
        backgroundColor: color.backgroundColor,
        textColor: color.textColor,
      };
    });
  }, [calendarFilteredSessions]);

  // Grouped + Sorted Topics
  const topicOptions = useMemo(() => {
    // If subjects are selected, filter sessions to those subjects
    const filteredSessions =
      filters.subject.length === 0
        ? sessions
        : sessions.filter((s) => filters.subject.includes(s.subject));
    const combined = filteredSessions.map((s) => `[${s.subject}] ${s.topic}`);
    return Array.from(new Set(combined)).sort((a, b) => a.localeCompare(b));
  }, [sessions, filters.subject]);

  return (
    <div>
      <SignupBanner />
      <div className="p-4 space-y-6 text-sm md:text-base">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-4 py-2 rounded ${
              viewMode === "calendar" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            Calendar View
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded ${
              viewMode === "list" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            List View
          </button>
        </div>

        <Filters
          subjects={[...new Set(sessions.map((s) => s.subject))]}
          topics={topicOptions}
          centres={[...new Set(sessions.map((s) => s.centre))]}
          tutors={[...new Set(sessions.map((s) => s.tutor))]}
          filters={filters}
          onFilterChange={setFilters}
        />

        {viewMode === "calendar" ? (
          <CalendarView events={events} />
        ) : (
          <ListView
            sessions={listFilteredSessions}
            calendarFilter={calendarFilter}
            onCalendarFilterChange={setCalendarFilter}
          />
        )}
      </div>
      <BottomBanner />
    </div>
  );
}
