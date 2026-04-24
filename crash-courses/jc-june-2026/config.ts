import type { CrashCourseConfig } from "../types";
import sessionsRaw from "./sessions.json";
import type { Session } from "@/types";

const sessions = sessionsRaw as Session[];

const config: CrashCourseConfig = {
  slug: "jc-june-2026",
  metadata: {
    title: "Zenith June JC Crash Course Scheduler",
    description: "Sign up for Zenith JC Crash Course now!",
  },
  dateRange: { start: "2026-06-01", end: "2026-06-30" },
  year: 2026,
  subjectColors: {
    "J1 GP": { backgroundColor: "#FBBC03", textColor: "#000000" },
    "J1 Biology": { backgroundColor: "#95B0F0", textColor: "#000000" },
    "J1 Physics": { backgroundColor: "#FC696A", textColor: "#000000" },
    "J1 Chemistry": { backgroundColor: "#FFFF02", textColor: "#000000" },
    "J1 Math": { backgroundColor: "#BFFCFF", textColor: "#000000" },
    "J1 Economics": { backgroundColor: "#7BFF85", textColor: "#000000" },
  },
  hero: {
    title: "June 2026 JC Crash Course",
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
      "https://docs.google.com/forms/d/e/1FAIpQLSf0WPe24FSB4ix2R8LgWHdgjns098Nthn1zFYLtR3zIeDCG-A/viewform?usp=dialog&entry.1157532004=SCHEDULE",
  },
  calendar: {
    firstDay: 1,
    initialDate: "2026-06-01",
    slotMinTime: "09:00:00",
    slotMaxTime: "22:00:00",
    listViewMinDate: "2026-06-01",
    tip: {
      label: "Pro Tip",
      body: "Use the filters to narrow down by subject or centre. Click any class for the prefilled registration link.",
    },
  },
  registrationFormUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSf0WPe24FSB4ix2R8LgWHdgjns098Nthn1zFYLtR3zIeDCG-A/viewform?entry.1157532004=SCHEDULE",
  campaignField: "entry.1157532004",
  sessions,
};

export default config;
