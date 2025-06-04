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
    fetch("http://192.168.50.143:3000/schedule")
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

  // Compute filtered options for cascading filters
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

    // Base data filtered by stream
    const streamFilteredData = weeklyClassData.filter((s) =>
      levelToFilterMapper(filters.stream, s.level, s.stream)
    );

    // Apply bidirectional filtering for Level-Subject-Centre-Tutor
    let filteredData = streamFilteredData;

    // Filter by selected levels
    if (filters.level.length > 0) {
      filteredData = filteredData.filter((s) =>
        filters.level.includes(s.level)
      );
    }

    // Filter by selected subjects
    if (filters.subject.length > 0) {
      filteredData = filteredData.filter((s) =>
        filters.subject.includes(s.subject)
      );
    }

    // Filter by selected centres
    if (filters.centre.length > 0) {
      filteredData = filteredData.filter((s) =>
        filters.centre.includes(s.centre)
      );
    }

    // Filter by selected tutors
    if (filters.tutor.length > 0) {
      filteredData = filteredData.filter((s) =>
        filters.tutor.includes(s.tutor)
      );
    }

    // Extract available options from the filtered dataset
    const availableLevels = [...new Set(filteredData.map((s) => s.level))];
    const availableSubjects = [...new Set(filteredData.map((s) => s.subject))];
    const availableCentres = [...new Set(filteredData.map((s) => s.centre))];
    const availableTutors = [...new Set(filteredData.map((s) => s.tutor))];

    return {
      levels: availableLevels,
      subjects: availableSubjects,
      centres: availableCentres,
      tutors: availableTutors,
    };
  }, [
    weeklyClassData,
    filters.stream,
    filters.level,
    filters.subject,
    filters.centre,
    filters.tutor,
  ]);

  const events = useMemo(() => {
    // Apply filters
    if (filters.stream === null || filters.subject.length === 0) {
      return [];
    }
    const filtered = weeklyClassData.filter((s) => {
      return (
        levelToFilterMapper(filters.stream, s.level, s.stream) &&
        filters.subject.includes(s.subject) &&
        (filters.level.length === 0 || filters.level.includes(s.level)) &&
        (filters.centre.length === 0 || filters.centre.includes(s.centre)) &&
        (filters.tutor.length === 0 || filters.tutor.includes(s.tutor))
      );
    });

    // Map to event structure (add color if needed)
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

    // For Level-Subject-Centre-Tutor bidirectional filtering,
    // we don't automatically clear other filters anymore
    // Let the user make selections and the UI will show only valid options
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
              streams={["JC", "Secondary (Express)", "Secondary (IP)"]}
              levels={filteredOptions.levels}
              subjects={filteredOptions.subjects}
              centres={filteredOptions.centres}
              tutors={filteredOptions.tutors}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
            <WeeklyClassCalendar slots={events} />
          </>
        )}
      </div>
      <BottomBanner />
    </div>
  );
}
