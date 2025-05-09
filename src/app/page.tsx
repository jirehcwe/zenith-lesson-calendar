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
    fetch("/sessions2.json")
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
        (filters.centre.length === 0 || filters.centre.includes(s.centre)) &&
        (filters.tutor.length === 0 || filters.tutor.includes(s.tutor))
      );
    });
  };

  // Calendar view filtered sessions (must NOT show anything if nothing selected)
  const calendarFilteredSessions = useMemo(() => {
    const noFiltersSelected =
      filters.subject.length === 0 &&
      filters.topic.length === 0 &&
      filters.centre.length === 0 &&
      filters.tutor.length === 0;

    if (noFiltersSelected) return [];

    return applyFilters(sessions);
  }, [sessions, filters]);

  // List view filtered sessions (always show filtered, date handled inside ListView)
  const listFilteredSessions = useMemo(() => {
    return applyFilters(sessions);
  }, [sessions, filters]);

  const events = useMemo(() => {
    const colorMap = [
      "#ef4444",
      "#3b82f6",
      "#22c55e",
      "#eab308",
      "#8b5cf6",
      "#ec4899",
      "#6366f1",
    ];
    const subjectColors = Array.from(new Set(sessions.map((s) => s.subject)));
    const colorDict = Object.fromEntries(
      subjectColors.map((subject, idx) => [
        subject,
        colorMap[idx % colorMap.length],
      ])
    );

    return calendarFilteredSessions.map((s) => ({
      title: `${s.subject}`,
      start: new Date(`${s.date} 2025 ${s.startTime}`),
      end: new Date(`${s.date} 2025 ${s.endTime}`),
      extendedProps: { ...s },
      backgroundColor: colorDict[s.subject] || "#9ca3af",
      textColor: "#ffffff",
    }));
  }, [calendarFilteredSessions, sessions]);

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
