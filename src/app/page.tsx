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
// Increment this version when the API changes to force all clients to invalidate cache
const CACHE_VERSION = 3;
const FILTERS_COLLAPSED_STORAGE_KEY = "filtersCollapsed";

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
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    subject: [] as string[],
    centre: [] as string[],
    tutor: [] as string[],
    level: [] as string[],
    stream: null as string | null,
  });

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

    // Read filters collapsed state
    const stored = localStorage.getItem(FILTERS_COLLAPSED_STORAGE_KEY);
    if (stored === "true") {
      setFiltersCollapsed(true);
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

  const events = useMemo(() => {
    if (
      searchQuery === "" &&
      filters.stream === null &&
      filters.level.length === 0 &&
      filters.subject.length === 0 &&
      filters.centre.length === 0
    ) {
      return [];
    }
    const filtered = weeklyClassData.filter((s) => {
      return (
        (searchQuery === "" ||
          s.subjects.some((subj) =>
            subj.toLowerCase().includes(searchQuery.toLowerCase())
          ) ||
          s.centre.toLowerCase().includes(searchQuery.toLowerCase())) &&
        levelToFilterMapper(filters.stream, s.level, s.stream) &&
        (filters.level.length === 0 || filters.level.includes(s.level)) &&
        (filters.subject.length === 0 ||
          s.subjects.some((subj) => filters.subject.includes(subj))) &&
        (filters.centre.length === 0 || filters.centre.includes(s.centre))
      );
    });
    return filtered.map((s) => ({ ...s }));
  }, [weeklyClassData, filters, searchQuery]);

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

  const toggleFiltersCollapse = () => {
    const newState = !filtersCollapsed;
    setFiltersCollapsed(newState);
    localStorage.setItem(FILTERS_COLLAPSED_STORAGE_KEY, newState.toString());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SignupBanner />
      <div className="max-w-7xl mx-auto px-2 pb-safe">
        <div className="space-y-2 sm:space-y-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-24 space-y-4 sm:space-y-6">
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
              <div className="md:static sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
                 <div className="max-w-7xl mx-auto px-2 p-2">
                  {/* Collapsed state - mobile only */}
                  {filtersCollapsed && (
                    <button
                      onClick={toggleFiltersCollapse}
                      className="lg:hidden w-full flex items-center justify-between gap-2 py-1 text-right hover:bg-gray-100 transition-colors rounded"
                      aria-label="Expand filters"
                    >
                      <h3 className="text-base sm:text-lg font-bold text-gray-800 flex-1 text-right">
                        Show Filters
                      </h3>
                      <svg
                        className="w-5 h-5 text-gray-600 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  )}
                  
                  {/* Expanded state - always show on desktop, conditional on mobile */}
                  <div className={filtersCollapsed ? "hidden lg:block" : ""}>
                    <div className="hidden lg:flex items-center gap-2 mb-4 py-1">
                      <h3 className="text-base sm:text-lg font-bold text-gray-800 flex-1">
                        Filters
                      </h3>
                    </div>
                    <Filters
                      streams={[
                        "JC",
                        "Secondary (Express)",
                        "Secondary (IP)",
                        "Primary",
                      ]}
                      levels={filteredOptions.levels}
                      subjects={filteredOptions.subjects}
                      centres={filteredOptions.centres}
                      tutors={filteredOptions.tutors}
                      filters={filters}
                      onFilterChange={handleFilterChange}
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      currentView={currentView}
                      onViewChange={setCurrentView}
                    />
                    <button
                      onClick={toggleFiltersCollapse}
                      className="lg:hidden w-full flex items-center justify-end gap-2 mt-4 py-1 text-right hover:bg-gray-100 transition-colors rounded"
                      aria-label="Collapse filters"
                    >
                      <h3 className="text-base sm:text-lg font-bold text-gray-800">
                        Hide Filters
                      </h3>
                      <svg
                        className="w-5 h-5 text-gray-600 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="modern-card p-3 sm:p-6">
                {currentView === "calendar" ? (
                  <WeeklyClassCalendar slots={events} filters={filters} />
                ) : (
                  <ListView sessions={events} />
                )}
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
      <BottomNav currentView={currentView} onViewChange={setCurrentView} />
    </div>
  );
}
