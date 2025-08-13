"use client";

import Image from "next/image";
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
                  {new URLSearchParams(window.location.search)
                    .get("campaign")
                    ?.includes("SCHEDULE1")
                    ? `At Zenith, many of our students strengthen their learning by 
                    taking two or more subjects. They're supported by caring teachers who go 
                    above and beyond to help every student succeed. Discover how you can do the 
                    same by finding a class that fits your timetable! Click on your preferred timeslot, 
                    and enjoy a one-time free trial* for any new subject you choose.`
                    : `Browse through our comprehensive course offerings and filter
                  by your preferences to find the ideal classes for your
                  academic journey.`}
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

              {/* Terms and Conditions Footer */}
              <div className="text-center py-4 sm:py-6">
                <p className="text-sm text-gray-600 max-w-4xl mx-auto px-4">
                  * Free trial is only applicable if you have not attended a
                  trial for the subject before, standard fees apply otherwise.
                </p>
              </div>

              {/* Testimonials Section */}
              {new URLSearchParams(window.location.search)
                .get("campaign")
                ?.includes("SCHEDULE1") ? (
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

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {/* Testimonial 1 */}
                    <div className="modern-card p-6 text-center">
                      <div className="mb-6">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
                          <Image
                            src="https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f73/68552294f18d2bd8a0a4bb86_Screenshot%202025-06-20%20165746.png"
                            alt="Kit Kaye"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            width={45}
                            height={45}
                          />
                        </div>
                        <div className="font-semibold text-gray-800">
                          Kit Kaye
                        </div>
                      </div>

                      {/* <div className="mb-6">
                        <Image
                          src="https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f73/68518dffee935c0cb5fdddea_Fionn%20Lim%20Hui%20Ying%20.webp"
                          alt="Fionn's testimonial"
                          className="w-full h-auto object-contain rounded-lg mb-4"
                          loading="lazy"
                          width={1080}
                          height={1080}
                        />
                      </div> */}

                      <div className="text-left">
                        <h4 className="font-bold text-lg text-gray-800 mb-3">
                          S to A - Econs | D to A - Chem
                        </h4>
                        <p className="text-gray-600 leading-relaxed">
                          &quot;I’m incredibly thankful for the help and support
                          Lay Chun has provided throughout my studies. His
                          lessons are always clear, engaging, and incredibly
                          thorough. He takes the time to break down every
                          concept in a way that’s easy to understand, no matter
                          how complex the topic may seem. What I appreciate most
                          is his patience—he always answers every one of my
                          questions, no matter how simple or “stupid” they may
                          feel, and he ensures I fully grasp the material before
                          moving on. His willingness to explain things in
                          different ways until I truly understand is what sets
                          him apart. Thanks to his guidance and feedback, I was
                          able to improve from an S to an A!&quot;
                        </p>
                        <br />
                        <h4 className="font-bold text-lg text-gray-800 mb-3">
                          U to A - Physics
                        </h4>
                        <p className="text-gray-600 leading-relaxed">
                          &quot;I can confidently say that Duncan played a
                          pivotal role in my academic journey—helping me go from
                          a U to an A in Physics. He’s an exceptional teacher:
                          always responsive to my questions and willing to go
                          the extra mile to ensure I fully understand the
                          material. His teaching is clear, engaging, and makes
                          even the most complex concepts easy to grasp. Duncan’s
                          dedication to his students is truly evident, and I’m
                          incredibly grateful for his unwavering support
                          throughout. I couldn’t have achieved this without his
                          guidance. Highly recommended!&quot;
                        </p>
                      </div>
                    </div>

                    {/* Testimonial 2 */}
                    <div className="modern-card p-6 text-center">
                      <div className="mb-6">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
                          <Image
                            src="https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f73/6855292ece9c33e8d67b947d_Screenshot%202025-06-20%20172556.png"
                            alt="Leora"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            width={45}
                            height={45}
                          />
                        </div>
                        <div className="font-semibold text-gray-800">Leora</div>
                      </div>

                      {/* <div className="mb-6">
                        <Image
                          src="https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f73/68518daaf608cc4fac821811_Sven-p-1080.webp"
                          alt="Sven's testimonial"
                          className="w-full h-auto object-contain rounded-lg mb-4"
                          loading="lazy"
                          width={1080}
                          height={1080}
                        />
                      </div> */}

                      <div className="text-left">
                        <h4 className="font-bold text-lg text-gray-800 mb-3">
                          D to A - GP
                        </h4>
                        <p className="text-gray-600 leading-relaxed">
                          ‍&quot;✨ From Overwhelmed to Overachieving: My GP
                          Journey with Zenith! ✨ When I first entered JC,
                          General Paper felt like an insurmountable challenge.
                          Despite pouring in effort during my first semester, I
                          hit a tipping point and knew I needed extra support,
                          so I turned to Zenith . My tutor: Zach—the most
                          patient and engaging tutor ever. He transformed what
                          used to be tedious case study memorization into a bank
                          of hilariously effective examples that made
                          essay-writing so much easier. Even with the new
                          syllabus and daunting exam format, his targeted
                          practices and additional consults helped me clarify
                          misconceptions, refine my thought process, and
                          actually enjoy GP. But Zach didn’t just help with my
                          grades. When I was overwhelmed and on the verge of
                          burnout, he offered a listening ear and unwavering
                          support, reigniting my motivation across all subjects.
                          (Also, psst... he’s super generous with the monthly
                          welfare, so there’s that too 😉). Jokes aside, I’m
                          beyond grateful to Zach for being such a crucial part
                          of my JC journey. If you’re struggling with GP, I
                          highly recommend having him as part of yours too!
                          💯✨&quot;
                        </p>
                      </div>
                    </div>

                    {/* Testimonial 3 */}
                    <div className="modern-card p-6 text-center md:col-span-2 lg:col-span-1">
                      <div className="mb-6">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
                          <Image
                            src="https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f73/685509c6fb9942e9b642af7b_Screenshot%202025-06-20%20151153.png"
                            alt="Gloria"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            width={45}
                            height={45}
                          />
                        </div>
                        <div className="font-semibold text-gray-800">
                          Gloria
                        </div>
                      </div>

                      {/* <div className="mb-6">
                        <Image
                          src="https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f73/68518dc70d9d9773f42f43b8_Gao%20Shan-p-1080.webp"
                          alt="Gaoshan's testimonial"
                          className="w-full h-auto object-contain rounded-lg mb-4"
                          loading="lazy"
                          width={1080}
                          height={1080}
                        />
                      </div> */}

                      <div className="text-left">
                        <h4 className="font-bold text-lg text-gray-800 mb-3">
                          S to A - Math
                        </h4>
                        <p className="text-gray-600 leading-relaxed">
                          &quot;I took H2 Math lessons with Hui Xuan from late
                          2023 to 2024, and it was an incredible experience. Hui
                          Xuan is a fun-loving and dedicated tutor who made
                          learning Math far less daunting. Despite my initial
                          struggles, she broke down complex concepts into easily
                          digestible lessons, structuring each session with
                          scaffolding and clear summaries to support effective
                          learning. Her approachable nature fostered a
                          supportive environment where I felt comfortable asking
                          questions without hesitation. Beyond lessons, she
                          offered personalised advice and regularly checked in
                          on my progress, ensuring steady and consistent
                          improvement. Math with Hui Xuan has been a 10/10
                          experience—I truly couldn’t have tackled JC Math any
                          other way. Thank you, Hui Xuan!&quot;
                        </p>
                        <br />
                        <h4 className="font-bold text-lg text-gray-800 mb-3">
                          U to A - Bio
                        </h4>
                        <p className="text-gray-600 leading-relaxed">
                          &quot;I took H2 Biology tuition with Derek Tan in
                          2024, and he was the most nurturing tutor I’ve ever
                          had. His sharpness, attentiveness, and deep expertise
                          completely transformed my learning experience. Before
                          joining his class, I struggled with exams despite
                          doing well in discussions. Yet, Derek never dismissed
                          my difficulties. Instead, he patiently analysed my
                          weaknesses and helped me develop practical strategies
                          to improve. He tailored his teaching with patience and
                          adaptability, always ensuring I could keep pace.
                          Derek’s structured and clear teaching approach helped
                          me gain confidence in the subject. He creates an
                          empowering learning environment that eases anxieties
                          and keeps students motivated—ultimately driving real
                          improvement. His unwavering support and dedication had
                          a profound impact on my journey. Thank you, Derek, for
                          being an incredible tutor and mentor—I’m truly
                          grateful.&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <></>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
