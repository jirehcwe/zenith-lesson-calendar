"use client";

import { WeeklyClassSlot, isSlotFull  } from "./WeeklyClassCalendar";
import { replaceCampaignInUrl, replacePromocodeInUrl } from "@/utils/campaign";
import { getFallbackRegistrationLinkByLevel } from "@/utils/prefillRegistration";

export default function ListView({
  sessions,
}: {
  sessions: WeeklyClassSlot[];
}) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">
          No classes found matching your criteria
        </div>
        <p className="text-gray-400">
          Try adjusting your filters to see more classes
        </p>
      </div>
    );
  }

  // Group sessions by day for better organization
  const sessionsByDay = sessions.reduce((acc, session) => {
    // Adjust slot.day if the calendar starts on Monday and slot is Sunday
    let adjustedDay = session.day;
    if (session.day === 0) {
      adjustedDay = 7; // Treat Sunday as the 7th day (after Saturday) for a Monday-first calendar
    }

    if (!acc[adjustedDay]) {
      acc[adjustedDay] = [];
    }
    acc[adjustedDay].push(session);
    return acc;
  }, {} as Record<number, WeeklyClassSlot[]>);

  // Sort days in order (1=Monday through 7=Sunday)
  const dayNames = [
    "", // Index 0 unused
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const sortedDays = Object.keys(sessionsByDay)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      {sortedDays.map((day) => (
        <div key={day} className="space-y-4">
          <h3 className="text-xl font-bold text-gray-800 border-b-2 border-blue-200 pb-2">
            {dayNames[day]}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessionsByDay[day]
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((session, index) => {
                const full = isSlotFull(session);
                return (
                <div
                  key={`${session.startTime}-${session.tutor}-${session.centre}-${session.day}-${index}`}
                  className={`rounded-xl p-5 shadow-sm border-2 ${
                    full
                      ? "bg-gray-100 border-gray-300 opacity-60"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="font-bold text-lg text-gray-800">
                        {session.stream}
                        {session.stream?.length > 0 && " - "}
                        {session.subjects.join(" + ")}
                      </div>
                      <div className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                        {session.level}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="font-medium text-gray-700">
                          {session.startTime} - {session.endTime}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="text-gray-600">{session.centre}</span>
                      </div>

                      {session.stream && (
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span className="text-gray-600">{session.level}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      {full ? (
                        <div className="w-full bg-gray-200 text-gray-500 font-medium py-2.5 px-4 rounded-lg text-sm text-center">
                          This class is currently full
                        </div>
                      ) : (
                        <div className="flex gap-2.5">
                          <a
                            href={replacePromocodeInUrl(replaceCampaignInUrl(session.prefillTrialLink))}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 text-sm whitespace-nowrap">
                              Sign up for FREE Trial
                            </button>
                          </a>
                          <a
                            href={replacePromocodeInUrl(replaceCampaignInUrl(
                              session.prefillRegistrationLink ??
                              getFallbackRegistrationLinkByLevel(session.level)
                            ))}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1"
                          >
                            <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 text-sm">
                              Register now
                            </button>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
