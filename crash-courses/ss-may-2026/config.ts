import type { CrashCourseConfig } from "../types";
import sessionsRaw from "./sessions.json";
import type { Session } from "@/types";

const sessions = sessionsRaw as Session[];

const config: CrashCourseConfig = {
  slug: "ss-may-2026",
  metadata: {
    title: "Zenith May SS Crash Course Scheduler",
    description: "Sign up for Zenith Secondary Crash Course now!",
  },
  // TEMP: pointed at Sep 2026 so the placeholder Sep-dated session data
  // renders for visual testing. Revert to "2026-05-01" / "2026-05-31"
  // when real May 2026 roster lands.
  dateRange: { start: "2026-09-01", end: "2026-09-30" },
  year: 2026,
  subjectColors: {
    Mathematics: { backgroundColor: "#FED966", textColor: "#000000" },
    Math: { backgroundColor: "#FED966", textColor: "#000000" },
    "IP Math": { backgroundColor: "#FED966", textColor: "#000000" },
    "A Math": { backgroundColor: "#CFE2F3", textColor: "#000000" },
    "E Math": { backgroundColor: "#CFE2F3", textColor: "#000000" },
    "Pure Physics": { backgroundColor: "#C27BA0", textColor: "#000000" },
    "Combined Physics": { backgroundColor: "#C27BA0", textColor: "#000000" },
    Chemistry: { backgroundColor: "#C27BA0", textColor: "#000000" },
    Science: { backgroundColor: "#C27BA0", textColor: "#000000" },
    "IP Science": { backgroundColor: "#C27BA0", textColor: "#000000" },
    "Pure Chemistry": { backgroundColor: "#F4CCCC", textColor: "#000000" },
    "Combined Chemistry": { backgroundColor: "#F4CCCC", textColor: "#000000" },
    "Pure Biology": { backgroundColor: "#D9EAD3", textColor: "#000000" },
    "Combined Biology": { backgroundColor: "#D9EAD3", textColor: "#000000" },
    English: { backgroundColor: "#DD7E6B", textColor: "#000000" },
    "IP English": { backgroundColor: "#DD7E6B", textColor: "#000000" },
  },
  hero: {
    title: "May 2026 SS Crash Course",
    tagline:
      "Flexible scheduling • Expert tutors • Proven results • Book your slots early",
    blurbHeadline: "Plan Your Crash Course Schedule",
    blurbBody:
      "Register for the Secondary crash course slots you want to attend. Browse the calendar, filter by subject or centre, and sign up for your preferred sessions before they fill up.",
    stats: "Trusted by over 20,000 students since 2019",
    heroImageSrc: "/zenith-banner.webp",
    heroImageAlt: "Zenith Education",
  },
  bottomBanner: {
    body: "Ready to lock in for your exams?",
    ctaLabel: "Click here to sign up!",
    ctaHref:
      "https://docs.google.com/forms/d/e/1FAIpQLSdc1DdBljxZx1mXH6Ztpxr_zbnI9XJunAKHDeN_GVR1jBuI9Q/viewform?usp=dialog&entry.1157532004=SCHEDULE",
  },
  calendar: {
    firstDay: 1,
    initialDate: "2026-09-01",
    slotMinTime: "09:00:00",
    slotMaxTime: "22:00:00",
    listViewMinDate: "2026-09-06",
    tip: {
      label: "Pro Tip",
      body: "Use the filters to narrow down by subject or centre. Click any class for the prefilled registration link.",
    },
  },
  registrationFormUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSdc1DdBljxZx1mXH6Ztpxr_zbnI9XJunAKHDeN_GVR1jBuI9Q/viewform?entry.1157532004=SCHEDULE",
  campaignField: "entry.1157532004",
  sessions,
};

export default config;
