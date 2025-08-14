"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import scrollGridPlugin from "@fullcalendar/scrollgrid";
import { useEffect, useState, useMemo } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { replaceCampaignInUrl } from "@/utils/campaign";
import { prefillRegistration } from "@/utils/prefillRegistration";

// Helper function to format location display text
function formatLocationDisplay(location: string): string {
  if (location === "Kovan") {
    return "Kovan (NEW!)";
  }
  return location;
}

// Define a new type for weekly class slots (no topic, no date)
export type WeeklyClassSlot = {
  title: string;
  day: number; // 0 (Sunday) to 6 (Saturday)
  startTime: string; // e.g. "10:00"
  endTime: string; // e.g. "12:00"
  subject: string;
  tutor: string;
  centre: string;
  stream: string;
  level: string;
  prefillLink: string;
};

const jcSubjectToColorMap: Record<
  string,
  { backgroundColor: string; textColor: string }
> = {
  "General Paper": {
    backgroundColor: "#FBBC03",
    textColor: "#000000",
  },
  Biology: {
    backgroundColor: "#95B0F0",
    textColor: "#000000",
  },
  Physics: {
    backgroundColor: "#FC696A",
    textColor: "#000000",
  },
  Chemistry: {
    backgroundColor: "#FFFF02",
    textColor: "#000000",
  },
  Mathematics: {
    backgroundColor: "#BFFCFF",
    textColor: "#000000",
  },
  Economics: {
    backgroundColor: "#7BFF85",
    textColor: "#000000",
  },
};

const secSubjectToColorMap: Record<
  string,
  { backgroundColor: string; textColor: string }
> = {
  Mathematics: {
    backgroundColor: "#FED966",
    textColor: "#000000",
  },
  "A Math": {
    backgroundColor: "#CFE2F3",
    textColor: "#000000",
  },
  "E Math": {
    backgroundColor: "#CFE2F3",
    textColor: "#000000",
  },
  "Pure Physics": {
    backgroundColor: "#C27BA0",
    textColor: "#000000",
  },
  "Combined Physics": {
    backgroundColor: "#C27BA0",
    textColor: "#000000",
  },
  // IP
  Chemistry: {
    backgroundColor: "#C27BA0",
    textColor: "#000000",
  },
  // Lower sec science
  Science: {
    backgroundColor: "#C27BA0",
    textColor: "#000000",
  },
  "Pure Chemistry": {
    backgroundColor: "#F4CCCC",
    textColor: "#000000",
  },
  "Combined Chemistry": {
    backgroundColor: "#F4CCCC",
    textColor: "#000000",
  },
  "Pure Biology": {
    backgroundColor: "#D9EAD3",
    textColor: "#000000",
  },
  "Combined Biology": {
    backgroundColor: "#D9EAD3",
    textColor: "#000000",
  },
  English: {
    backgroundColor: "#DD7E6B",
    textColor: "#000000",
  },
};

const primarySubjectToColorMap: Record<
  string,
  { backgroundColor: string; textColor: string }
> = {
  English: {
    backgroundColor: "#9FC5E8",
    textColor: "#000000",
  },
  Math: {
    backgroundColor: "#F6B26B",
    textColor: "#000000",
  },
  Science: {
    backgroundColor: "#B6D7A8",
    textColor: "#000000",
  },
};

// // Function to generate consistent colors from subject names
// function hashStringToColor(str: string): {
//   backgroundColor: string;
//   textColor: string;
// } {
//   // Simple hash function
//   let hash = 0;
//   for (let i = 0; i < str.length; i++) {
//     const char = str.charCodeAt(i);
//     hash = (hash << 5) - hash + char;
//     hash = hash & hash; // Convert to 32-bit integer
//   }

//   // Use the hash to generate HSL values for better color distribution
//   const hue = Math.abs(hash) % 270;
//   const saturation = 75 + (Math.abs(hash) % 20); // 75-95%
//   const lightness = 55 + (Math.abs(hash) % 15); // 55-70%

//   const backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

//   // Choose text color based on lightness
//   const textColor = lightness > 30 ? "#000000" : "#ffffff";

//   return { backgroundColor, textColor };
// }

function subjectToColor(
  level: string,
  subject: string
): {
  backgroundColor: string;
  textColor: string;
} {
  if (level.includes("J")) {
    return (
      jcSubjectToColorMap[subject] || {
        backgroundColor: "#ffffff",
        textColor: "#000000",
      }
    );
  }

  if (level.includes("S")) {
    return (
      secSubjectToColorMap[subject] || {
        backgroundColor: "#ffffff",
        textColor: "#000000",
      }
    );
  }

  if (level.includes("P")) {
    return (
      primarySubjectToColorMap[subject] || {
        backgroundColor: "#ffffff",
        textColor: "#000000",
      }
    );
  }

  return {
    backgroundColor: "#ffffff",
    textColor: "#000000",
  };
}

// Helper to get a fixed date for a weekday (using a reference week)
function getFixedWeekdayDate(weekday: number): Date {
  // Use a fixed reference date (e.g., January 7, 2024 was a Sunday)
  const referenceDate = new Date(2024, 0, 7); // January 7, 2024 (Sunday)
  const result = new Date(referenceDate);
  result.setDate(referenceDate.getDate() + weekday);
  result.setHours(0, 0, 0, 0);
  return result;
}

export default function WeeklyClassCalendar({
  slots,
}: // filters,
{
  slots: WeeklyClassSlot[];
  filters: {
    subject: string[];
    centre: string[];
    tutor: string[];
    level: string[];
    stream: string | null;
  };
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isMobile, setIsMobile] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<WeeklyClassSlot | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Convert weekly slots to FullCalendar events for the current week
  const events = useMemo(() => {
    return slots.map((slot) => {
      // Adjust slot.day if the calendar starts on Monday and slot is Sunday
      let adjustedDay = slot.day;
      if (slot.day === 0) {
        adjustedDay = 7; // Treat Sunday as the 7th day (after Saturday) for a Monday-first calendar
      }
      const baseDate = getFixedWeekdayDate(adjustedDay);
      const [startHour, startMinute] = slot.startTime.split(":").map(Number);
      const [endHour, endMinute] = slot.endTime.split(":").map(Number);
      const start = new Date(baseDate);
      start.setHours(startHour, startMinute, 0, 0);
      const end = new Date(baseDate);
      end.setHours(endHour, endMinute, 0, 0);
      return {
        title: `${slot.level} ${slot.subject} ${
          slot.stream ? `(${slot.stream})` : ""
        }`,
        start,
        end,
        extendedProps: slot,
        backgroundColor: subjectToColor(slot.level, slot.subject)
          .backgroundColor,
        textColor: subjectToColor(slot.level, slot.subject).textColor,
      };
    });
  }, [slots]);

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  const handleEventClick = (arg: any) => {
    setSelectedEvent(arg.event.extendedProps);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Custom CSS for FullCalendar hover effects */}
      <style jsx>{`
        :global(.fc-v-event) {
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
        }
        :global(.fc-v-event:hover) {
          transform: scale(1.05) translateY(-1px) !important;
          filter: brightness(0.9) !important;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25) !important;
        }
      `}</style>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-xl">💡</span>
        </div>
        <div className="text-sm text-gray-700">
          <span className="font-semibold text-blue-800">Pro Tip:</span> Use the
          filters above to reduce overlap and see specific classes more clearly.
          Click on any class to register!
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <FullCalendar
          schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
          plugins={[timeGridPlugin, scrollGridPlugin]}
          initialView="timeGridWeek"
          initialDate="2024-01-08" // Fixed reference date (Monday)
          headerToolbar={{
            left: "",
            center: "",
            right: "",
          }}
          views={{}}
          events={events}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dayHeaderContent={(args: any) => {
            // Show only the day name, not the date
            return args.date.toLocaleDateString(undefined, {
              weekday: "short",
            });
          }}
          height="auto"
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          displayEventEnd={true}
          // Disable navigation since this is a template view
          navLinks={false}
          // Hide the date numbers, only show day names
          dayHeaderFormat={{ weekday: "short" }}
          stickyHeaderDates={true}
          dayMinWidth={100}
          eventContent={(arg) => {
            const centre = arg.event.extendedProps.centre;
            return (
              <div className="p-1 h-full flex flex-col justify-between overflow-hidden">
                <div className="flex-1 min-h-0">
                  <div className="font-semibold truncate text-sm">
                    {arg.event.title}
                  </div>
                  {centre && (
                    <div className="text-xs opacity-80 truncate">
                      {formatLocationDisplay(centre)}
                    </div>
                  )}
                </div>
                <div className="text-xs underline opacity-90 truncate flex-shrink-0">
                  Click to Register
                </div>
              </div>
            );
          }}
          eventClick={handleEventClick}
          // Show only one week, starting from Sunday
          firstDay={1}
          weekends={true}
        />
      </div>

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 flex w-screen items-center justify-center p-3 bg-black/50 backdrop-blur-sm">
          <DialogPanel className="max-w-sm w-full space-y-4 bg-white p-5 rounded-2xl shadow-2xl relative border-0">
            <button
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setIsDialogOpen(false)}
              aria-label="Close"
            >
              ✕
            </button>
            {selectedEvent && (
              <>
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full">
                    <span className="text-lg text-white font-bold">
                      {selectedEvent.subject.charAt(0)}
                    </span>
                  </div>
                  <DialogTitle className="text-xl font-bold text-gray-800">
                    {selectedEvent.level} {selectedEvent.subject}
                    {selectedEvent.stream && (
                      <span className="block text-base text-blue-600 font-medium mt-1">
                        ({selectedEvent.stream})
                      </span>
                    )}
                  </DialogTitle>
                </div>

                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-[10px] text-blue-600">📅</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">
                          Day:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {
                            [
                              "Sunday",
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday",
                            ][selectedEvent.day]
                          }
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-[10px] text-blue-600">🏢</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">
                          Venue:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {formatLocationDisplay(selectedEvent.centre)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-[10px] text-blue-600">⏰</span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">
                          Time:
                        </span>
                        <span className="ml-2 text-gray-600">
                          {selectedEvent.startTime} - {selectedEvent.endTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2.5 pt-3">
              {selectedEvent?.prefillLink && (
                <a
                  href={replaceCampaignInUrl(selectedEvent.prefillLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    console.log("form_click_prefilled");
                  }}
                  className="flex-1"
                >
                  <button className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm">
                    Sign up for Trial
                  </button>
                </a>
              )}
              <a
                href={replaceCampaignInUrl(
                  prefillRegistration(selectedEvent?.level ?? "Unknown")
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <button className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 text-sm">
                  Register now
                </button>
              </a>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
