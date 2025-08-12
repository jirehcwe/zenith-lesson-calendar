"use client";

import { useState, useEffect, useMemo } from "react";
import Filters from "../components/Filters";
import SignupBanner from "../components/SignupBanner";
import WeeklyClassCalendar, {
  WeeklyClassSlot,
} from "@/components/WeeklyClassCalendar";
import ListView from "@/components/ListView";
import ViewSelector, { ViewType } from "@/components/ViewSelector";

const CACHE_KEY = "weeklyClassData";
const CACHE_TIME_KEY = "weeklyClassDataTimestamp";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in ms

function getCachedData() {
  const data = localStorage.getItem(CACHE_KEY);
  const timestamp = localStorage.getItem(CACHE_TIME_KEY);
  if (data && timestamp && Date.now() - Number(timestamp) < CACHE_DURATION) {
    return JSON.parse(data);
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setCachedData(data: any) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
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
  const [filters, setFilters] = useState({
    subject: [] as string[],
    centre: [] as string[],
    tutor: [] as string[],
    level: [] as string[],
    stream: null as string | null,
  });

  // Effect to read filters from URL on component mount
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

    const cached = getCachedData();
    if (cached) {
      setWeeklyClassData(cached);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch("https://lms-api.myzenithstudy.com/schedule")
      .then((res) => res.json())
      .then((res: { data: { data: WeeklyClassSlot[] } }) => {
        setWeeklyClassData(res.data.data);
        setCachedData(res.data.data);
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

  // Compute filtered options for progressive disclosure with counts
  const filteredOptions = useMemo(() => {
    // Base data filtered by stream only
    const streamFilteredData = weeklyClassData.filter((s) =>
      levelToFilterMapper(filters.stream, s.level, s.stream)
    );

    // Get all unique options from stream-filtered data
    const allLevels = [...new Set(streamFilteredData.map((s) => s.level))];
    const allSubjects = [...new Set(streamFilteredData.map((s) => s.subject))];
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
            testFilters.subject.includes(s.subject)) &&
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
    // If no filters are applied, return empty array
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
        (filters.subject.length === 0 || filters.subject.includes(s.subject)) &&
        (filters.centre.length === 0 || filters.centre.includes(s.centre))
      );
    });

    // Map to event structure
    return filtered.map((s) => ({
      ...s,
    }));
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

  return (
    <div className="min-h-screen bg-gray-50">
      <SignupBanner />
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="space-y-4 sm:space-y-8">
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
              <div className="text-center py-4 sm:py-8">
                <h2 className="text-xl sm:text-3xl font-bold text-gray-800 mb-2 sm:mb-4">
                  Find Your Perfect Class Schedule
                </h2>
                <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-2 sm:px-0">
                  Browse through our comprehensive course offerings and filter
                  by your preferences to find the ideal classes for your
                  academic journey.
                </p>
              </div>

              <ViewSelector onViewChange={setCurrentView} />

              <div className="modern-card p-3 sm:p-6">
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
                />
              </div>

              <div className="modern-card p-3 sm:p-6">
                {currentView === "calendar" ? (
                  <WeeklyClassCalendar slots={events} filters={filters} />
                ) : (
                  <ListView sessions={events} />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
