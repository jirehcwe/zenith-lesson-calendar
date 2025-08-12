"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import scrollGridPlugin from "@fullcalendar/scrollgrid";
import { useEffect, useState, useMemo } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";

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
}: // eslint-disable-next-line @typescript-eslint/no-unused-vars
// filters,
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
    <>
      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
        💡 <strong>Tip:</strong> Use the filters above to reduce overlap and see
        specific classes more clearly.
      </div>
      <div>
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
              <div>
                <div className="font-semibold truncate">{arg.event.title}</div>
                {centre && (
                  <div className="text-xs opacity-80 truncate">{centre}</div>
                )}
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
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4 bg-black/30">
          <DialogPanel className="max-w-md w-full space-y-4 border bg-white p-6 rounded shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold focus:outline-none"
              onClick={() => setIsDialogOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            {selectedEvent && (
              <>
                <DialogTitle className="font-bold text-lg mb-2">
                  {selectedEvent.level} {selectedEvent.subject}{" "}
                  {selectedEvent.stream ? `(${selectedEvent.stream})` : ""}
                </DialogTitle>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-semibold">Day:</span>{" "}
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
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Venue:</span>{" "}
                    {selectedEvent.centre}
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Timeslot:</span>{" "}
                    {selectedEvent.startTime} - {selectedEvent.endTime}
                  </div>
                </div>
              </>
            )}
            <div className="flex justify-end mt-4">
              {selectedEvent?.prefillLink ? (
                <a
                  href={selectedEvent.prefillLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    console.log("form_click_prefilled");
                  }}
                >
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Register
                  </button>
                </a>
              ) : null}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
