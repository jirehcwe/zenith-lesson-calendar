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

  function hexToHsv(hex: string) {
    // Remove # if present
    hex = hex.replace("#", "");

    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Normalize RGB to 0-1
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const delta = max - min;

    // Calculate HSV
    let h = 0;
    const s = max === 0 ? 0 : delta / max;
    const v = max;

    if (delta !== 0) {
      if (max === rNorm) {
        h = ((gNorm - bNorm) / delta) % 6;
      } else if (max === gNorm) {
        h = (bNorm - rNorm) / delta + 2;
      } else {
        h = (rNorm - gNorm) / delta + 4;
      }
    }

    h = Math.round(h * 60);
    if (h < 0) h += 360;

    return {
      h: h, // 0-360 degrees
      s: Math.round(s * 100), // 0-100%
      v: Math.round(v * 100), // 0-100%
    };
  }

  function hsvToHex({ h, s, v }: { h: number; s: number; v: number }) {
    // Normalize inputs
    s = s / 100; // Convert percentage to 0-1
    v = v / 100; // Convert percentage to 0-1

    const c = v * s; // Chroma
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r, g, b;

    if (h >= 0 && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (h >= 60 && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (h >= 180 && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (h >= 240 && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }

    // Convert to 0-255 range and add m
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    // Convert to hex
    const toHex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

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
        backgroundColor: "#FC696A",
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
      const isFull = s.prefill.length === 0;
      const color = map[s.displaySubject];
      // convert color to HSV
      const hsv = hexToHsv(color.backgroundColor);
      const darkerHex = hsvToHex({
        h: hsv.h,
        s: hsv.s,
        v: hsv.v * 0.8,
      });
      if (color === undefined) {
        throw new Error(`No color found for ${s.displaySubject}`);
      }
      return {
        title: `${s.subject}`,
        start: new Date(`${s.date} 2025 ${s.startTime}`),
        end: new Date(`${s.date} 2025 ${s.endTime}`),
        extendedProps: { ...s },
        backgroundColor: isFull ? darkerHex : color.backgroundColor,
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
