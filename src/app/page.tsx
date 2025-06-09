"use client";

import { useState, useEffect, useMemo } from "react";
import Filters from "../components/Filters";
import SignupBanner from "../components/SignupBanner";
import BottomBanner from "@/components/BottomBanner";
import WeeklyClassCalendar, {
  WeeklyClassSlot,
} from "@/components/WeeklyClassCalendar";

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
    return false;
  }
  switch (filter) {
    case "JC":
      return level.includes("JC");
    case "Secondary (Express)":
      return level.includes("Sec") && stream.includes("EXP");
    case "Secondary (IP)":
      return level.includes("Sec") && stream.includes("IP");
    case "Primary":
      return level.includes("Primary");
    default:
      return false;
  }
}

export default function Page() {
  const [weeklyClassData, setWeeklyClassData] = useState<WeeklyClassSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    subject: [] as string[],
    centre: [] as string[],
    tutor: [] as string[],
    level: [] as string[],
    stream: null as string | null,
  });

  useEffect(() => {
    const cached = getCachedData();
    if (cached) {
      setWeeklyClassData(cached);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    // fetch("http://192.168.50.143:3000/schedule")
    fetch("https://lms-api-test.myzenithstudy.com/schedule")
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

  // Compute filtered options for progressive disclosure with counts
  const filteredOptions = useMemo(() => {
    // If no stream selected, return empty arrays for dependent filters
    if (filters.stream === null) {
      return {
        levels: [],
        subjects: [],
        centres: [],
        tutors: [],
      };
    }

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
        testFilters.level = [...filters.level, value];
      } else if (field === "subject") {
        testFilters.subject = [...filters.subject, value];
      } else if (field === "centre") {
        testFilters.centre = [...filters.centre, value];
      } else if (field === "tutor") {
        testFilters.tutor = [...filters.tutor, value];
      }

      return streamFilteredData.filter((s) => {
        return (
          (testFilters.level.length === 0 ||
            testFilters.level.includes(s.level)) &&
          (testFilters.subject.length === 0 ||
            testFilters.subject.includes(s.subject)) &&
          (testFilters.centre.length === 0 ||
            testFilters.centre.includes(s.centre)) &&
          (testFilters.tutor.length === 0 ||
            testFilters.tutor.includes(s.tutor))
        );
      }).length;
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
        if (a.count === 0 && b.count === 0)
          return a.value.localeCompare(b.value);
        // For non-zero counts, preserve original order
        return a.originalIndex - b.originalIndex;
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
        if (a.count === 0 && b.count === 0)
          return a.value.localeCompare(b.value);
        // For non-zero counts, preserve original order
        return a.originalIndex - b.originalIndex;
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
        if (a.count === 0 && b.count === 0)
          return a.value.localeCompare(b.value);
        // For non-zero counts, preserve original order
        return a.originalIndex - b.originalIndex;
      });

    return {
      levels: levelsWithCounts,
      subjects: subjectsWithCounts,
      centres: centresWithCounts,
      tutors: tutorsWithCounts,
    };
  }, [weeklyClassData, filters]);

  const events = useMemo(() => {
    // Apply filters - now level is required instead of subject
    if (filters.stream === null || filters.level.length === 0) {
      return [];
    }
    const filtered = weeklyClassData.filter((s) => {
      return (
        levelToFilterMapper(filters.stream, s.level, s.stream) &&
        filters.level.includes(s.level) &&
        (filters.subject.length === 0 || filters.subject.includes(s.subject)) &&
        (filters.centre.length === 0 || filters.centre.includes(s.centre)) &&
        (filters.tutor.length === 0 || filters.tutor.includes(s.tutor))
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

    // If level changed, clear subject, centre, and tutor filters
    if (
      JSON.stringify(prevFilters.level) !== JSON.stringify(newFilters.level)
    ) {
      setFilters({
        ...newFilters,
        subject: [],
        centre: [],
        tutor: [],
      });
      return;
    }

    // For Subject-Centre-Tutor, allow bidirectional filtering
    setFilters(newFilters);
  };

  return (
    <div>
      <SignupBanner />
      <div className="p-4 space-y-6 text-sm md:text-base">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading courses...</p>
          </div>
        ) : (
          <>
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
            <WeeklyClassCalendar slots={events} filters={filters} />
          </>
        )}
      </div>
      <BottomBanner />
    </div>
  );
}
