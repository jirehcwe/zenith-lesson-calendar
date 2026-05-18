"use client";

import { useState, useEffect, useMemo } from "react";
import Filters from "../components/Filters";
import SignupBanner from "../components/SignupBanner";
import WeeklyClassCalendar, {
  WeeklyClassSlot,
} from "@/components/WeeklyClassCalendar";
import ListView from "@/components/ListView";
import { ViewType } from "@/components/ViewSelector";
import BottomNav from "@/components/BottomNav";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import TestimonialGrid from "@/components/TestimonialGrid";
import { getCampaignParam } from "@/utils/campaign";

const CACHE_KEY = "weeklyClassData";
const CACHE_TIME_KEY = "weeklyClassDataTimestamp";
const CACHE_VERSION_KEY = "weeklyClassDataVersion";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in ms
const FILTERS_COLLAPSED_STORAGE_KEY = "filtersCollapsed";
// Increment this version when the API changes to force all clients to invalidate cache
const CACHE_VERSION = 3;

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

function getCachedData() {
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
    return JSON.parse(data);
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setCachedData(data: any) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
  localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION.toString());
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
    case "Primary":
      return level.startsWith("P");
    default:
      return true;
  }
}

export default function Page() {
  const [weeklyClassData, setWeeklyClassData] = useState<WeeklyClassSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>("calendar");
  const [campaignParam, setCampaignParam] = useState<string>("");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [streamHighlighted, setStreamHighlighted] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  // Use screen dimensions (orientation-independent) to detect phones vs tablets/desktops.
  // window.innerWidth changes with orientation; screen.width/height does not.
  // Smallest iPad short side is 768px; largest phone short side is ~430px.
  const [isMobilePhone, setIsMobilePhone] = useState(false);
  const [filters, setFilters] = useState({
    subject: [] as string[],
    centre: [] as string[],
    tutor: [] as string[],
    level: [] as string[],
    stream: null as string | null,
  });

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
    const initialFilters = {
      subject: params.get("subject")?.split(",").filter(Boolean) || [],
      centre: params.get("centre")?.split(",").filter(Boolean) || [],
      tutor: params.get("tutor")?.split(",").filter(Boolean) || [],
      level: params.get("level")?.split(",").filter(Boolean) || [],
      stream: params.get("stream") || null,
    };
    setFilters(initialFilters);

    // Read view from URL
    const viewParam = params.get("view") as ViewType;
    if (viewParam === "list" || viewParam === "calendar") {
      setCurrentView(viewParam);
    }

    // Set campaign parameter
    setCampaignParam(getCampaignParam());

    const cached = getCachedData();
    if (cached) {
      setWeeklyClassData(cached);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch(
      `https://api.schedule.myzenithstudy.com/schedule?year=${new Date().getFullYear()}`
    )
      .then((res) => res.json())
      .then((res: { data: { data: WeeklyClassSlot[] } }) => {
        const normalised = res.data.data.map(normaliseSlot);
        setWeeklyClassData(normalised);
        setCachedData(normalised);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching schedule data:", error);
        setIsLoading(false);
      });
  }, []);

  // Effect to update URL query params when filters change (preserve non-filter params)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Clear existing filter params only
    params.delete("subject");
    params.delete("centre");
    params.delete("tutor");
    params.delete("level");
    params.delete("stream");

    // Add current filter params
    if (filters.subject.length > 0) {
      params.set("subject", filters.subject.join(","));
    }
    if (filters.centre.length > 0) {
      params.set("centre", filters.centre.join(","));
    }
    if (filters.tutor.length > 0) {
      params.set("tutor", filters.tutor.join(","));
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

  useEffect(() => {
    localStorage.setItem(FILTERS_COLLAPSED_STORAGE_KEY, filtersCollapsed.toString());
  }, [filtersCollapsed]);

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
    const allTutors = [...new Set(streamFilteredData.map((s) => s.tutor))];

    // Function to count results for each option
    const getResultCount = (field: string, value: string) => {
      const testFilters = { ...filters };
      if (field === "level") {
        testFilters.level = [value];
      } else if (field === "subject") {
        testFilters.subject = [value];
      } else if (field === "centre") {
        testFilters.centre = [value];
      } else if (field === "tutor") {
        testFilters.tutor = [value];
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
      .map((level, index) => ({
        value: level,
        count: getResultCount("level", level),
        selected: filters.level.includes(level),
        originalIndex: index,
      }))
      .sort((a, b) => {
        // Only push zero-count options to the bottom, preserve original order otherwise
        // if (a.count === 0 && b.count > 0) return 1;
        // if (a.count > 0 && b.count === 0) return -1;
        // if (a.count === 0 && b.count === 0)
        //   return a.value.localeCompare(b.value);
        // // For non-zero counts, preserve original order
        // return a.originalIndex - b.originalIndex;

        // Sort reverse alphabetically by name
        return b.value.localeCompare(a.value);
      });

    const subjectsWithCounts = allSubjects
      .map((subject, index) => ({
        value: subject,
        count: getResultCount("subject", subject),
        selected: filters.subject.includes(subject),
        originalIndex: index,
      }))
      .sort((a, b) => {
        // Only push zero-count options to the bottom, preserve original order otherwise
        if (a.count === 0 && b.count > 0) return 1;
        if (a.count > 0 && b.count === 0) return -1;

        return a.value.localeCompare(b.value);
      });

    const centresWithCounts = allCentres
      .map((centre, index) => ({
        value: centre,
        count: getResultCount("centre", centre),
        selected: filters.centre.includes(centre),
        originalIndex: index,
      }))
      .sort((a, b) => {
        // Only push zero-count options to the bottom, preserve original order otherwise
        if (a.count === 0 && b.count > 0) return 1;
        if (a.count > 0 && b.count === 0) return -1;

        return a.value.localeCompare(b.value);
      });

    const tutorsWithCounts = allTutors
      .map((tutor, index) => ({
        value: tutor,
        count: getResultCount("tutor", tutor),
        selected: filters.tutor.includes(tutor),
        originalIndex: index,
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
      tutors: tutorsWithCounts,
    };
  }, [weeklyClassData, filters]);

  const STREAM_VALUES = ["JC", "Secondary (Express)", "Secondary (IP)", "Primary"] as const;

  const streamOptions = useMemo(() =>
    STREAM_VALUES.map((stream) => ({
      value: stream,
      count: weeklyClassData.filter((s) => levelToFilterMapper(stream, s.level, s.stream)).length,
      selected: filters.stream === stream,
    })),
  [weeklyClassData, filters.stream]);

  const events = useMemo(() => {
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
  }, [weeklyClassData, filters]);

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
        tutor: [],
      });
      return;
    }

    setFilters(newFilters);
  };

  const hasActiveFilters =
    filters.stream !== null ||
    filters.level.length > 0 ||
    filters.subject.length > 0 ||
    filters.centre.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <SignupBanner />
      {!isLoading && !isMobilePhone && (
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
                    tutors={filteredOptions.tutors}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    currentView={currentView}
                    onViewChange={setCurrentView}
                    totalCount={events.length}
                    showViewToggle={false}
                    streamHighlighted={streamHighlighted}
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
                  hasActiveFilters={hasActiveFilters}
                  selectedStream={filters.stream}
                  onEmptyStateClick={
                    isMobilePhone
                      ? () => setFilterSheetOpen(true)
                      : () => {
                          setStreamHighlighted(true);
                          setTimeout(() => setStreamHighlighted(false), 2000);
                        }
                  }
                />
              </div>
              <div className={currentView !== "list" ? "hidden" : "modern-card p-3 sm:p-6"}>
                <ListView sessions={events} />
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
                tutors={filteredOptions.tutors}
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
