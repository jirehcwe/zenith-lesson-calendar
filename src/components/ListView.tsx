"use client";

import { WeeklyClassSlot, isSlotFull, getSubjectColor } from "./WeeklyClassCalendar";
import { replaceCampaignInUrl, replacePromocodeInUrl } from "@/utils/campaign";
import { getFallbackRegistrationLinkByLevel } from "@/utils/prefillRegistration";
import { to12hr } from "@/utils/time";

export default function ListView({
  sessions,
  onEmptyStateClick,
  suppressEmptyState = false,
}: {
  sessions: WeeklyClassSlot[];
  onEmptyStateClick?: () => void;
  suppressEmptyState?: boolean;
}) {
  if (sessions.length === 0) {
    // In pinned mode the filter bar and the mobile Filter tab are hidden, so
    // "Select a stream" / "Open filters" would point at controls that are not
    // on screen. The pinned banner carries the explanation instead.
    if (suppressEmptyState) return null;
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-50 flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-gray-600 mt-3">Select a stream to see classes</p>
        <p className="text-xs text-gray-400 mt-1">Filter by stream, level, subject, or centre</p>
        {onEmptyStateClick && (
          <button
            onClick={onEmptyStateClick}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-sm hover:shadow-md mt-4"
          >
            Open filters
          </button>
        )}
      </div>
    );
  }

  const sessionsByDay = sessions.reduce((acc, session) => {
    const adjustedDay = session.day === 0 ? 7 : session.day;
    if (!acc[adjustedDay]) acc[adjustedDay] = [];
    acc[adjustedDay].push(session);
    return acc;
  }, {} as Record<number, WeeklyClassSlot[]>);

  const dayNames = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const sortedDays = Object.keys(sessionsByDay).map(Number).sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-8">
      {sortedDays.map((day) => (
        <div key={day} className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b-2 border-blue-200 pb-2">
            <h3 className="text-lg font-extrabold text-gray-800">{dayNames[day]}</h3>
            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {sessionsByDay[day].length} classes
            </span>
          </div>

          <div className="grid list-view-grid gap-4">
            {sessionsByDay[day]
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((session, index) => {
                const full = isSlotFull(session);
                const accentColor = getSubjectColor(session.subjects[0] ?? "", session.level);
                return (
                  <div
                    key={`${session.startTime}-${session.tutor}-${session.centre}-${session.day}-${index}`}
                    className={`rounded-xl overflow-hidden shadow-sm border-2 transition-all duration-200 hover:shadow-lg hover:border-blue-200 hover:-translate-y-0.5 ${
                      full ? "bg-gray-50 border-gray-300 opacity-60" : "bg-white border-gray-200"
                    }`}
                  >
                    {/* Accent bar */}
                    <div className="h-1 w-full rounded-t-xl" style={{ background: accentColor }} />

                    <div className="p-6 flex flex-col gap-4">
                      {/* Header: subject + level pill */}
                      <div className="flex items-start justify-between">
                        <div className="font-bold text-base text-gray-800">
                          {session.subjects.join(" + ")}
                        </div>
                        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-md border border-gray-200 ml-2 flex-shrink-0">
                          {session.level}
                        </span>
                      </div>

                      {/* Info rows */}
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium text-gray-700">{to12hr(session.startTime)} – {to12hr(session.endTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-gray-600">{session.centre}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-gray-100">
                        {full ? (
                          <button
                            disabled
                            className="w-full bg-gray-200 text-gray-500 font-medium py-2.5 px-4 rounded-lg text-sm cursor-not-allowed"
                          >
                            Class Full
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <a
                              href={replacePromocodeInUrl(replaceCampaignInUrl(session.prefillTrialLink))}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 block bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold text-xs py-2 px-3 rounded-lg text-center transition-all duration-200"
                            >
                              Sign up for FREE Trial
                            </a>
                            <a
                              href={replacePromocodeInUrl(replaceCampaignInUrl(
                                session.prefillRegistrationLink ?? getFallbackRegistrationLinkByLevel(session.level)
                              ))}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-3 rounded-lg text-center transition-all duration-200"
                            >
                              Register now
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
