"use client";

import { WeeklyClassSlot, isSlotFull, getSubjectColor } from "./WeeklyClassCalendar";
import { replaceCampaignInUrl, replacePromocodeInUrl } from "@/utils/campaign";
import { getFallbackRegistrationLinkByLevel } from "@/utils/prefillRegistration";

export default function ListView({ sessions }: { sessions: WeeklyClassSlot[] }) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">No classes found matching your criteria</div>
        <p className="text-gray-400">Try adjusting your filters to see more classes</p>
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
    <div className="space-y-8">
      {sortedDays.map((day) => (
        <div key={day} className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-blue-200 pb-2">
            <h3 className="text-lg font-extrabold text-gray-800">{dayNames[day]}</h3>
            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {sessionsByDay[day].length} classes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

                    <div className="p-5 flex flex-col space-y-3">
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
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium text-gray-700">{session.startTime} – {session.endTime}</span>
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
