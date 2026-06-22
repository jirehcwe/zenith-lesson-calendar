"use client";

import { useState, useMemo } from "react";
import CalendarView from "../components/CalendarView";
import ListView from "../components/ListView";
import Filters from "../components/Filters";
import { Session } from "../types";
import SignupBanner from "../components/SignupBanner";
import ClosingBanner from "@/components/ClosingBanner";
import BottomBanner from "@/components/BottomBanner";
import ViewSelector from "@/components/ViewSelector";
import { getCrashCourseConfig } from "../../crash-courses";
import { isMockExam, hasAnyMockExams } from "@/utils/sessionVariant";

const config = getCrashCourseConfig();
const labelFor = (code: string): string =>
  config.subjectLabels?.[code] ?? code;

// Strip trailing year ("S4 2026" → "S4", "P5 2026" → "P5").
const levelOf = (raw: string): string => raw.replace(/\s*\d{4}\s*$/, "");

const REGULAR_TYPE_LABEL = "Crash Course";

function hexToHsv(hex: string) {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;
  let h = 0;
  const s = max === 0 ? 0 : delta / max;
  const v = max;
  if (delta !== 0) {
    if (max === rNorm) h = ((gNorm - bNorm) / delta) % 6;
    else if (max === gNorm) h = (bNorm - rNorm) / delta + 2;
    else h = (rNorm - gNorm) / delta + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return { h, s: Math.round(s * 100), v: Math.round(v * 100) };
}

function hsvToHex({ h, s, v }: { h: number; s: number; v: number }) {
  s = s / 100;
  v = v / 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  const toHex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function Page() {
  const sessions: Session[] = config.sessions;
  const showTypeFilter = hasAnyMockExams(sessions, config);
  const typeOf = (s: Session): string =>
    isMockExam(s, config) && config.mockExam
      ? config.mockExam.variantLabel
      : REGULAR_TYPE_LABEL;
  const typeOptions = useMemo(
    () =>
      showTypeFilter && config.mockExam
        ? [REGULAR_TYPE_LABEL, config.mockExam.variantLabel]
        : [],
    [showTypeFilter]
  );

  const [filters, setFilters] = useState({
    subject: [] as string[],
    topic: [] as string[],
    centre: [] as string[],
    tutor: [] as string[],
    type: [] as string[],
    level: [] as string[],
  });
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [calendarFilter, setCalendarFilter] = useState<string | null>(null);
  // `now` drives all date-based slot logic, resolved once per mount.
  const now = useMemo<Date>(() => new Date(), []);

  const applyFilters = (list: Session[]) =>
    list.filter(
      (s) =>
        (filters.subject.length === 0 || filters.subject.includes(s.subject)) &&
        (filters.topic.length === 0 ||
          filters.topic.includes(`[${labelFor(s.subject)}] ${s.topic}`)) &&
        (filters.centre.length === 0 || filters.centre.includes(s.centre)) &&
        (filters.type.length === 0 || filters.type.includes(typeOf(s))) &&
        (filters.level.length === 0 || filters.level.includes(levelOf(s.level)))
    );

  const calendarFilteredSessions = useMemo(
    () => applyFilters(sessions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessions, filters]
  );
  const listFilteredSessions = useMemo(
    () => applyFilters(sessions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessions, filters]
  );

  const events = useMemo(() => {
    return calendarFilteredSessions.map((s) => {
      const isFull = s.prefill.length === 0;
      const color = config.subjectColors[s.displaySubject];
      if (!color) {
        throw new Error(
          `No color found for displaySubject="${s.displaySubject}" in config "${config.slug}". Add it to subjectColors.`
        );
      }
      const hsv = hexToHsv(color.backgroundColor);
      const darkerHex = hsvToHex({ h: hsv.h, s: hsv.s, v: hsv.v * 0.8 });
      // Mock exams keep the subject hue intact and are differentiated solely
      // by the EXAM pill rendered in eventContent (and on list cards).
      return {
        title: labelFor(s.subject),
        start: new Date(`${s.date} ${config.year} ${s.startTime}`),
        end: new Date(`${s.date} ${config.year} ${s.endTime}`),
        extendedProps: { ...s },
        backgroundColor: isFull ? darkerHex : color.backgroundColor,
        textColor: color.textColor,
      };
    });
  }, [calendarFilteredSessions]);

  const levelOptions = useMemo(() => {
    if (!config.levelFilter?.enabled) return [];
    const seen = [...new Set(sessions.map((s) => levelOf(s.level)))];
    const order = config.levelFilter.order;
    if (order && order.length > 0) {
      // Sort by config order; unknown levels go last in alpha order.
      const rank = new Map(order.map((v, i) => [v, i]));
      return seen.sort((a, b) => {
        const ra = rank.get(a) ?? order.length;
        const rb = rank.get(b) ?? order.length;
        return ra === rb ? a.localeCompare(b) : ra - rb;
      });
    }
    return seen.sort((a, b) => a.localeCompare(b));
  }, [sessions]);

  const topicOptions = useMemo(() => {
    const filtered =
      filters.subject.length === 0
        ? sessions
        : sessions.filter((s) => filters.subject.includes(s.subject));
    // Slugs whose data has no topic (e.g. Pri, where every row's topic is
    // blank) get an empty list; Filters then hides the Topic pill entirely.
    const combined = filtered
      .filter((s) => s.topic && s.topic.trim().length > 0)
      .map((s) => `[${labelFor(s.subject)}] ${s.topic}`);
    return Array.from(new Set(combined)).sort((a, b) => a.localeCompare(b));
  }, [sessions, filters.subject]);

  return (
    <div>
      {config.closingBanner && <ClosingBanner />}
      <SignupBanner />
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6 space-y-6 text-sm md:text-base">
        <ViewSelector currentView={viewMode} onViewChange={setViewMode} />

        <Filters
          subjects={[...new Set(sessions.map((s) => s.subject))].sort(
            (a, b) => labelFor(a).localeCompare(labelFor(b))
          )}
          topics={topicOptions}
          centres={[...new Set(sessions.map((s) => s.centre))].sort((a, b) =>
            a.localeCompare(b)
          )}
          tutors={[...new Set(sessions.map((s) => s.tutor))].sort((a, b) =>
            a.localeCompare(b)
          )}
          types={typeOptions}
          levels={levelOptions}
          filters={filters}
          onFilterChange={setFilters}
          subjectLabel={labelFor}
        />

        <div className="modern-card p-2 sm:p-6">
          {viewMode === "calendar" ? (
            <CalendarView events={events} now={now} />
          ) : (
            <ListView
              sessions={listFilteredSessions}
              calendarFilter={calendarFilter}
              onCalendarFilterChange={setCalendarFilter}
              now={now}
            />
          )}
        </div>
      </div>
      {config.bottomBanner && <BottomBanner />}
    </div>
  );
}
