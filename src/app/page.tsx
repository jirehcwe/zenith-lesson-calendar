"use client";

import { useState, useEffect, useMemo } from "react";
import Filters from "../components/Filters";
import SignupBanner from "../components/SignupBanner";
import WeeklyClassCalendar, {
  WeeklyClassSlot,
} from "@/components/WeeklyClassCalendar";
import ListView from "@/components/ListView";
type ViewType = "calendar" | "list";
import BottomNav from "@/components/BottomNav";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import TestimonialGrid from "@/components/TestimonialGrid";
import PinnedBanner from "@/components/PinnedBanner";
import ViewToggle from "@/components/ViewToggle";
import {
  parsePinRequest,
  matchPinnedSlots,
  pinnedBannerMessage,
  type PinRequest,
} from "@/utils/pinnedSlots";
import { getCampaignParam } from "@/utils/campaign";

const CACHE_KEY = "weeklyClassData";
const CACHE_TIME_KEY = "weeklyClassDataTimestamp";
const CACHE_VERSION_KEY = "weeklyClassDataVersion";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in ms
// Increment this version when the API changes to force all clients to invalidate cache
// Bumped to 4 (2026-05-26): db-schedule-updater MR 3.3 flipped its /schedule
// response shape from `{success, data:{data:[...]}, message}` to the resource
// directly `{data:[...], total, pageSize, currentPage}`. Cached payloads from
// the old shape would still parse but downstream code now reads `res.data`
// (not `res.data.data`), so we invalidate to force a fresh fetch.
const CACHE_VERSION = 4;

// Collapse db-schedule-updater's venue granularity back into the flat labels
// the calendar has always used: "Zoom" → "Online", and strip any parenthetical
// classroom suffix like "Tan Kah Kee (Coronation Plaza)" → "Tan Kah Kee".
function normaliseCentre(centre: string): string {
  if (centre === "Zoom") return "Online";
  return centre.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

// db-schedule-updater returns the full level name ("Secondary 3", "Primary 4");
// the calendar UI has always used short codes ("S3", "P4"). JC levels are
// already stored as "J1"/"J2" so they pass through unchanged.
function normaliseLevel(level: string): string {
  if (level.startsWith("Secondary ")) return "S" + level.slice(10);
  if (level.startsWith("Primary ")) return "P" + level.slice(8);
  return level;
}

function normaliseSlot(slot: WeeklyClassSlot): WeeklyClassSlot {
  return {
    ...slot,
    centre: normaliseCentre(slot.centre),
    level: normaliseLevel(slot.level),
  };
}

// A cache we cannot READ is just a cache miss. Three things in here throw in
// the wild: the `localStorage` property access itself under "block all cookies
// and site data" (SecurityError, before any method runs), getItem/removeItem
// for the same reason, and JSON.parse on a truncated or hand-edited entry —
// hence the whole body is wrapped, not just the parse. This runs inside the
// mount effect, so an escaping throw leaves isLoading stuck true forever, and
// the spinner then hides the pinned banner, which is the only exit from pinned
// mode: one corrupt entry and the visitor is trapped on a blank page.
//
// This covers page.tsx's own storage use only. Keeping the whole page alive
// under blocked site data also depends on WeeklyClassCalendar's pro-tip
// preference being guarded — it reads localStorage in its own mount effect, so
// an unguarded throw there takes the page down just as effectively. Both are
// pinned by "renders with site data blocked entirely" in page.test.tsx.
function getCachedData(): WeeklyClassSlot[] | null {
  try {
    const data = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIME_KEY);
    const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY);

    // Check if cache version matches current version
    if (cachedVersion !== CACHE_VERSION.toString()) {
      // Version mismatch - clear old cache
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIME_KEY);
      localStorage.removeItem(CACHE_VERSION_KEY);
      return null;
    }

    if (data && timestamp && Date.now() - Number(timestamp) < CACHE_DURATION) {
      const parsed: unknown = JSON.parse(data);
      // An empty (or non-array) payload is a MISS, not a hit. `[]` is truthy, so
      // returning it makes the mount effect short-circuit before fetching, and
      // the visitor stays on an empty schedule for the rest of CACHE_DURATION
      // even once the backend has recovered or the new year's schedule has been
      // published. The write path now refuses to cache empty, but that does
      // nothing for clients who already cached one under the old code, and
      // CACHE_VERSION cannot be bumped to flush them — so the read side is
      // where it has to be caught. Refetching an empty schedule costs one
      // request; serving a stale empty one costs the visitor the whole page.
      if (!Array.isArray(parsed) || parsed.length === 0) return null;
      return parsed as WeeklyClassSlot[];
    }
    return null;
  } catch (error) {
    console.warn("Ignoring unreadable schedule cache:", error);
    return null;
  }
}

// A cache we cannot WRITE is a non-event: the payload is already in React state
// and the page renders fine. The throw must be swallowed HERE rather than by the
// fetch chain's .catch, which would set loadFailed and render "We couldn't load
// the schedule. Please try again." directly above the correctly rendered
// classes. Quota-exceeded is the realistic trigger — the schedule blob is the
// biggest thing this site stores.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setCachedData(data: any) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION.toString());
  } catch (error) {
    console.warn("Unable to cache schedule data:", error);
  }
}

// Link-only stream selecting every Secondary level regardless of track. Kept as
// the literal URL value so it round-trips without a bidirectional mapping; the
// display label lives in Filters' streamLabel().
const ALL_SEC = "AllSec";

// The four chips every visitor sees. AllSec is deliberately absent: it is
// link-only, and appended to the options list solely while it is selected.
const STREAM_VALUES = ["JC", "Secondary (Express)", "Secondary (IP)", "Primary"] as const;

// Stream is a closed set, so an unrecognised value resolves to null rather than
// reaching levelToFilterMapper's `default: return true`. That default renders
// the *entire* schedule — JC and Primary included — while a truthy
// filters.stream keeps hasActiveFilters true, which suppresses the "Select a
// stream to see classes" prompt and shows a nonsense removal pill. A parent who
// retypes a shared ?stream=AllSec link as ?stream=AllSecc would otherwise get a
// wrong-platform calendar with no signal that anything had failed. Trimmed
// first, because a trailing space survives copy-paste out of a chat app.
//
// `rejected` is what separates "this visitor named no stream" from "this
// visitor named a stream we refused". Both end at stream: null, but only the
// second must also void the link's subject/centre/level, because a null stream
// matches EVERY case in levelToFilterMapper while any one non-empty dependent
// filter keeps the events memo's "pick a stream first" gate from firing — so
// ?stream=AllSecc&subject=... would otherwise still serve JC, Secondary and
// Primary on one screen. Collapsing both cases to a bare null is exactly how
// that survived the whitelist.
type StreamParam = { stream: string | null; rejected: boolean };

function normaliseStreamParam(raw: string | null): StreamParam {
  if (raw === null) return { stream: null, rejected: false };
  const trimmed = raw.trim();
  // A present-but-blank ?stream= (or one that is all whitespace) names no valid
  // stream either, so it is rejected rather than waved through: otherwise
  // ?stream=&subject=... reopens the same cross-platform leak by another route.
  if (!trimmed) return { stream: null, rejected: true };
  // Only AllSec is matched case-insensitively: it is the one value typed by
  // hand from a shared link rather than clicked.
  if (trimmed.toLowerCase() === ALL_SEC.toLowerCase()) {
    return { stream: ALL_SEC, rejected: false };
  }
  const match = STREAM_VALUES.find((v) => v === trimmed);
  return match ? { stream: match, rejected: false } : { stream: null, rejected: true };
}

function levelToFilterMapper(
  filter: string | null,
  level: string,
  stream: string
): boolean {
  if (filter === null) {
    return true;
  }
  switch (filter) {
    case "JC":
      return level.startsWith("J");
    case "Secondary (Express)":
      return level.startsWith("S") && stream.includes("EXP");
    case "Secondary (IP)":
      return level.startsWith("S") && stream.includes("IP");
    case ALL_SEC:
      // Deliberately level-based rather than EXP||IP: a Secondary slot with a
      // blank stream should surface here rather than vanish from every
      // Secondary view. No such rows exist today (325 EXP + 38 IP = 363 = the
      // exact Secondary row count).
      return level.startsWith("S");
    case "Primary":
      return level.startsWith("P");
    default:
      // Unreachable today (normaliseStreamParam is the only source of a
      // non-null stream), so this is purely a blast-radius choice for the day
      // someone edits a STREAM_VALUES string and misses a case above. `true`
      // turns that typo into "a JC chip showing JC + Secondary + Primary
      // together" — the platforms this client must never mix. `false` degrades
      // it to an obviously-empty view instead.
      return false;
  }
}

export default function Page() {
  const [weeklyClassData, setWeeklyClassData] = useState<WeeklyClassSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>("calendar");
  const [campaignParam, setCampaignParam] = useState<string>("");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [levelDropdownOpen, setLevelDropdownOpen] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  // Use screen dimensions (orientation-independent) to detect phones vs tablets/desktops.
  // window.innerWidth changes with orientation; screen.width/height does not.
  // Smallest iPad short side is 768px; largest phone short side is ~430px.
  const [isMobilePhone, setIsMobilePhone] = useState(false);
  const [filters, setFilters] = useState({
    subject: [] as string[],
    centre: [] as string[],
    level: [] as string[],
    stream: null as string | null,
  });
  const [pinRequest, setPinRequest] = useState<PinRequest>({ kind: "none" });
  // Distinguishes "the schedule never arrived" from "your link matched nothing".
  // Without it, a network/CORS failure on a perfectly valid link tells the user
  // their link is broken — see the banner message in (f).
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsMobilePhone(Math.min(window.screen.width, window.screen.height) < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Effect to read filters and view from URL on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const { stream, rejected } = normaliseStreamParam(params.get("stream"));
    // A rejected stream voids the whole filter set, not just its own param. The
    // dependent filters were chosen for a stream this link no longer selects, so
    // keeping them both leaks other platforms (see normaliseStreamParam) and
    // shows removal pills for a selection the visitor cannot see. This is the
    // same rule handleFilterChange already applies whenever the stream changes;
    // the visitor simply lands on the ordinary unfiltered homepage.
    const initialFilters = rejected
      ? { subject: [], centre: [], level: [], stream: null as string | null }
      : {
          subject: params.get("subject")?.split(",").filter(Boolean) || [],
          centre: params.get("centre")?.split(",").filter(Boolean) || [],
          level: params.get("level")?.split(",").filter(Boolean) || [],
          stream,
        };
    const pin = parsePinRequest(window.location.search);
    setFilters(initialFilters);
    setPinRequest(pin);

    // Read view from URL
    const viewParam = params.get("view") as ViewType;
    if (viewParam === "list" || viewParam === "calendar") {
      setCurrentView(viewParam);
    }

    // Set campaign parameter
    setCampaignParam(getCampaignParam());

    // A pinned link never reads the cache — it only writes one. Every other
    // banner state is derived from data the page HAS, but the dead-link copy is
    // derived from data it does NOT have, so a merely-stale cache is enough to
    // manufacture it: a visitor who browsed the schedule minutes ago, then
    // followed a link for a class ops published (or a tutor code ops corrected)
    // in the meantime, gets "We couldn't find any classes for this link." about
    // a link that works. That is the same lie this feature exists to prevent,
    // pointed the other way, and no amount of correct matching downstream can
    // see past the wrong input.
    //
    // Deliberately a full cache BYPASS rather than a revalidate-after-serve:
    // deferring the truth still flashes the dead-link banner first, and pinned
    // traffic is a small share of visits, so the saving being given up is one
    // request on a fraction of loads. The write below is unconditional, so a
    // pinned visit still warms the cache for the visitor's next unpinned one.
    const cached = pin.kind === "none" ? getCachedData() : null;
    if (cached) {
      setWeeklyClassData(cached);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    // API base is env-configured (prod/preview set in Cloudflare); /schedule path
    // + year are added here. `!` is safe: next.config.ts fails the build if unset.
    const scheduleUrl = new URL("/schedule", process.env.NEXT_PUBLIC_SCHEDULE_API_BASE_URL!);
    scheduleUrl.searchParams.set("year", String(new Date().getFullYear()));
    fetch(scheduleUrl)
      .then((res) => res.json())
      // db-schedule-updater MR 3.3 (2026-05-26) flipped the response envelope:
      //   was → { success, data: { data: WeeklyClassSlot[], total, ... }, message }
      //   now → { data: WeeklyClassSlot[], total, pageSize, currentPage }
      // Cached payloads from the old shape are invalidated by the
      // CACHE_VERSION bump above.
      .then((res: { data: WeeklyClassSlot[] }) => {
        const normalised = res.data.map(normaliseSlot);
        setWeeklyClassData(normalised);
        // Never cache an empty schedule. A cache hit short-circuits this effect
        // before it fetches, so persisting an empty payload locks every visitor
        // out of a retry for CACHE_DURATION. That is reachable, not theoretical:
        // the request pins year=<current>, so from 1 January until the new
        // year's schedule is published the endpoint legitimately returns none.
        if (normalised.length > 0) {
          setCachedData(normalised);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching schedule data:", error);
        setLoadFailed(true);
        setIsLoading(false);
      });
  }, []);

  // Effect to update URL query params when filters change (preserve non-filter params)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Clear existing filter params only
    params.delete("subject");
    params.delete("centre");
    params.delete("level");
    params.delete("stream");

    // Add current filter params
    if (filters.subject.length > 0) {
      params.set("subject", filters.subject.join(","));
    }
    if (filters.centre.length > 0) {
      params.set("centre", filters.centre.join(","));
    }
    if (filters.level.length > 0) {
      params.set("level", filters.level.join(","));
    }
    if (filters.stream) {
      params.set("stream", filters.stream);
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }, [filters]);

  // Effect to update URL query params when view changes (preserve other params)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (currentView === "calendar") {
      // Remove view param for calendar (default)
      params.delete("view");
    } else {
      // Set view param for other views
      params.set("view", currentView);
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }, [currentView]);

  // Compute filtered options for progressive disclosure with counts
  const filteredOptions = useMemo(() => {
    // Base data filtered by stream only
    const streamFilteredData = weeklyClassData.filter((s) =>
      levelToFilterMapper(filters.stream, s.level, s.stream)
    );

    // Get all unique options from stream-filtered data
    const allLevels = [...new Set(streamFilteredData.map((s) => s.level))];
    const allSubjects = [
      ...new Set(streamFilteredData.flatMap((s) => s.subjects)),
    ];
    const allCentres = [...new Set(streamFilteredData.map((s) => s.centre))];

    // Function to count results for each option
    const getResultCount = (field: string, value: string) => {
      const testFilters = { ...filters };
      if (field === "level") {
        testFilters.level = [value];
      } else if (field === "subject") {
        testFilters.subject = [value];
      } else if (field === "centre") {
        testFilters.centre = [value];
      }

      const result = streamFilteredData.filter((s) => {
        return (
          (testFilters.level.length === 0 ||
            testFilters.level.includes(s.level)) &&
          (testFilters.subject.length === 0 ||
            s.subjects.some((subj) => testFilters.subject.includes(subj))) &&
          (testFilters.centre.length === 0 ||
            testFilters.centre.includes(s.centre))
        );
      });

      return result.length;
    };

    // Create options with counts and sort them
    const levelsWithCounts = allLevels
      .map((level) => ({
        value: level,
        count: getResultCount("level", level),
        selected: filters.level.includes(level),
      }))
      .sort((a, b) => b.value.localeCompare(a.value));

    const subjectsWithCounts = allSubjects
      .map((subject) => ({
        value: subject,
        count: getResultCount("subject", subject),
        selected: filters.subject.includes(subject),
      }))
      .sort((a, b) => {
        // Only push zero-count options to the bottom, preserve original order otherwise
        if (a.count === 0 && b.count > 0) return 1;
        if (a.count > 0 && b.count === 0) return -1;

        return a.value.localeCompare(b.value);
      });

    const centresWithCounts = allCentres
      .map((centre) => ({
        value: centre,
        count: getResultCount("centre", centre),
        selected: filters.centre.includes(centre),
      }))
      .sort((a, b) => {
        // Only push zero-count options to the bottom, preserve original order otherwise
        if (a.count === 0 && b.count > 0) return 1;
        if (a.count > 0 && b.count === 0) return -1;

        return a.value.localeCompare(b.value);
      });

    return {
      levels: levelsWithCounts,
      subjects: subjectsWithCounts,
      centres: centresWithCounts,
    };
  }, [weeklyClassData, filters]);

  const streamOptions = useMemo(() => {
    // AllSec is link-only: its chip exists solely while it is the selected
    // stream, so ordinary visitors still see the usual four.
    const values: string[] = [...STREAM_VALUES];
    if (filters.stream === ALL_SEC) values.push(ALL_SEC);
    return values.map((stream) => ({
      value: stream,
      count: weeklyClassData.filter((s) => levelToFilterMapper(stream, s.level, s.stream)).length,
      selected: filters.stream === stream,
    }));
  }, [weeklyClassData, filters.stream]);

  const pinnedSlots = useMemo(
    () => matchPinnedSlots(weeklyClassData, pinRequest),
    [weeklyClassData, pinRequest],
  );
  // Derived from the URL, not the match count, so a link that matches nothing
  // still enters pinned mode and can report itself as broken.
  const isPinned = pinRequest.kind !== "none";

  const events = useMemo(() => {
    if (isPinned) {
      return pinnedSlots.map((s) => ({ ...s }));
    }
    if (
      filters.stream === null &&
      filters.level.length === 0 &&
      filters.subject.length === 0 &&
      filters.centre.length === 0
    ) {
      return [];
    }
    const filtered = weeklyClassData.filter((s) => {
      return (
        levelToFilterMapper(filters.stream, s.level, s.stream) &&
        (filters.level.length === 0 || filters.level.includes(s.level)) &&
        (filters.subject.length === 0 ||
          s.subjects.some((subj) => filters.subject.includes(subj))) &&
        (filters.centre.length === 0 || filters.centre.includes(s.centre))
      );
    });
    return filtered.map((s) => ({ ...s }));
  }, [weeklyClassData, filters, isPinned, pinnedSlots]);

  // Clear dependent filters when parent filter changes
  const handleFilterChange = (newFilters: typeof filters) => {
    const prevFilters = filters;

    // If stream changed, clear all dependent filters
    if (prevFilters.stream !== newFilters.stream) {
      setFilters({
        ...newFilters,
        level: [],
        subject: [],
        centre: [],
      });
      return;
    }

    setFilters(newFilters);
  };

  const handleExitPinned = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("classes");
    params.delete("tutor");
    const qs = params.toString();
    window.history.replaceState(
      {},
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    );
    setPinRequest({ kind: "none" });
    setFilters({ subject: [], centre: [], level: [], stream: null });
  };

  const hasActiveFilters =
    filters.stream !== null ||
    filters.level.length > 0 ||
    filters.subject.length > 0 ||
    filters.centre.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <SignupBanner />
      {!isLoading && isPinned && (
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <PinnedBanner
            // Only blame the link once we have a schedule to have missed it in:
            // describePin would call a failed fetch and a not-yet-published
            // schedule dead links. The three-way choice lives in
            // pinnedBannerMessage so the copy stays pure and unit-testable.
            message={pinnedBannerMessage(pinRequest, pinnedSlots, {
              loadFailed,
              scheduleEmpty: weeklyClassData.length === 0,
            })}
            onShowAll={handleExitPinned}
          />
          {!isMobilePhone && (
            <div className="max-w-7xl mx-auto px-4 py-2 md:px-8 md:py-3 flex justify-end">
              <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
            </div>
          )}
        </div>
      )}
      {!isLoading && !isMobilePhone && !isPinned && (
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-2 md:px-8 md:py-4">
            {filtersCollapsed ? (
              <div className="flex justify-end py-0.5">
                <button
                  onClick={() => setFiltersCollapsed(false)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-50 border border-gray-200 transition-all duration-200"
                  aria-label="Show filters"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Filters
                  {hasActiveFilters && (
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-px rounded-full tabular-nums">
                      {[filters.stream, ...filters.level, ...filters.subject, ...filters.centre].filter(Boolean).length}
                    </span>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-stretch gap-3">
                <div className="flex-1 min-w-0">
                  <Filters
                    streams={streamOptions}
                    levels={filteredOptions.levels}
                    subjects={filteredOptions.subjects}
                    centres={filteredOptions.centres}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    currentView={currentView}
                    onViewChange={setCurrentView}
                    totalCount={events.length}
                    showViewToggle={false}
                    triggerLevelOpen={levelDropdownOpen}
                  />
                </div>
                <div className="flex-shrink-0 flex flex-col justify-between items-end gap-2">
                  <div className="flex bg-white border border-gray-200 rounded-xl p-0.5 gap-0.5">
                    <button
                      onClick={() => setCurrentView("calendar")}
                      className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                        currentView === "calendar" ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Calendar
                    </button>
                    <button
                      onClick={() => setCurrentView("list")}
                      className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                        currentView === "list" ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      List
                    </button>
                  </div>
                  <button
                    onClick={() => setFiltersCollapsed(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-50 border border-gray-200 transition-all duration-200"
                    aria-label="Hide filters"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Hide
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-2 md:pt-4 pb-safe">
        <div className="flex flex-col gap-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-24 gap-4">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
              <div className="text-center">
                <p className="text-xl font-semibold text-gray-700">
                  Loading courses...
                </p>
                <p className="text-gray-500 mt-2">
                  Please wait while we fetch the latest schedule
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className={currentView !== "calendar" ? "hidden" : "modern-card -mx-2 p-0 overflow-hidden"}>
                <WeeklyClassCalendar
                  slots={events}
                  isVisible={currentView === "calendar"}
                  hasActiveFilters={hasActiveFilters || isPinned}
                  selectedStream={filters.stream}
                  onEmptyStateClick={
                    isMobilePhone
                      ? () => setFilterSheetOpen(true)
                      : () => {
                          setLevelDropdownOpen(true);
                          setTimeout(() => setLevelDropdownOpen(false), 50);
                        }
                  }
                />
              </div>
              <div className={currentView !== "list" ? "hidden" : "modern-card p-3 sm:p-6"}>
                <ListView
                  sessions={events}
                  suppressEmptyState={isPinned}
                  onEmptyStateClick={
                    isMobilePhone
                      ? () => setFilterSheetOpen(true)
                      : () => {
                          setLevelDropdownOpen(true);
                          setTimeout(() => setLevelDropdownOpen(false), 50);
                        }
                  }
                />
              </div>

              {/* Terms and Conditions Footer */}
              <div className="text-center py-4 sm:py-6">
                <p className="text-sm text-gray-600 max-w-4xl mx-auto px-4">
                  * Free trial is only applicable if you have not attended a
                  trial for the subject before, standard fees apply otherwise.
                </p>
              </div>

              {/* Testimonials Section - Only show when campaign = SCHEDULE1 */}
              {campaignParam === "SCHEDULE1" && (
                <div className="py-8 sm:py-12">
                  <div className="text-center mb-8 sm:mb-12">
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
                      What Our Students Say
                    </h3>
                    <p className="text-gray-600 max-w-2xl mx-auto px-4">
                      Hear from students who have transformed their academic
                      journey with Zenith
                    </p>
                  </div>

                  {/* Mobile: Carousel */}
                  <div className="lg:hidden">
                    <TestimonialCarousel />
                  </div>

                  {/* Desktop: Grid */}
                  <div className="hidden lg:block">
                    <TestimonialGrid />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {isMobilePhone && (
        <BottomNav
          currentView={currentView}
          onViewChange={setCurrentView}
          onOpenFilter={() => setFilterSheetOpen(true)}
          hasActiveFilters={hasActiveFilters}
          showFilterButton={!isPinned}
        />
      )}

      {/* Mobile filter sheet */}
      {filterSheetOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-black/40"
          onClick={() => setFilterSheetOpen(false)}
        >
          <div
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Filters</h2>
              <button
                onClick={() => setFilterSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                aria-label="Close filter sheet"
              >
                ✕
              </button>
            </div>
            <div className="px-5 py-5 pb-10">
              <Filters
                streams={streamOptions}
                levels={filteredOptions.levels}
                subjects={filteredOptions.subjects}
                centres={filteredOptions.centres}
                filters={filters}
                onFilterChange={handleFilterChange}
                currentView={currentView}
                onViewChange={setCurrentView}
                totalCount={events.length}
                showViewToggle={false}
                openUpward={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
