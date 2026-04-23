import type { CrashCourseConfig } from "../types";
import sessionsRaw from "./sessions.json";
import type { Session } from "@/types";

const sessions = sessionsRaw as Session[];

const config: CrashCourseConfig = {
  slug: "jc-may-2026",
  metadata: {
    title: "Zenith May JC Crash Course Scheduler",
    description: "Sign up for Zenith JC Crash Course now!",
  },
  // TEMP: pointed at Sep 2026 so the placeholder Sep-dated session data
  // renders for visual testing. Revert to "2026-05-01" / "2026-05-31"
  // when real May 2026 roster lands.
  dateRange: { start: "2026-09-01", end: "2026-09-30" },
  year: 2026,
  subjectColors: {
    GP: { backgroundColor: "#FBBC03", textColor: "#000000" },
    "General Paper": { backgroundColor: "#FBBC03", textColor: "#000000" },
    Biology: { backgroundColor: "#95B0F0", textColor: "#000000" },
    Physics: { backgroundColor: "#FC696A", textColor: "#000000" },
    Chemistry: { backgroundColor: "#FFFF02", textColor: "#000000" },
    Mathematics: { backgroundColor: "#BFFCFF", textColor: "#000000" },
    Economics: { backgroundColor: "#7BFF85", textColor: "#000000" },
  },
  hero: {
    title: "May 2026 JC Crash Course",
    tagline:
      "Flexible scheduling • Expert tutors • Proven results • Lock in your promo rates",
    blurbHeadline: "Plan Your Crash Course Schedule",
    blurbBody:
      "Register for the JC crash course slots you want to attend. Browse the calendar, filter by subject or centre, and sign up for your preferred sessions before they fill up.",
    stats: "Trusted by over 20,000 students since 2019",
    heroImageSrc: "/zenith-banner.webp",
    heroImageAlt: "Zenith Education",
  },
  bottomBanner: {
    body: "Ready to lock in for promos?",
    ctaLabel: "Click here to sign up!",
    ctaHref:
      "https://docs.google.com/forms/d/e/1FAIpQLSesYi1vS9HGIsyW1nTjxXbk07anXX3iZ9yAMXfwON4w0wiqdg/viewform?usp=dialog&entry.1157532004=SCHEDULE",
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
    "https://docs.google.com/forms/d/e/1FAIpQLSesYi1vS9HGIsyW1nTjxXbk07anXX3iZ9yAMXfwON4w0wiqdg/viewform?entry.1157532004=SCHEDULE",
  campaignField: "entry.1157532004",
  sessions,
};

export default config;
