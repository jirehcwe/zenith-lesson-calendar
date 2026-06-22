import type { CrashCourseConfig } from "../types";
import sessionsRaw from "./sessions.json";
import type { Session } from "@/types";

const sessions = sessionsRaw as Session[];

const config: CrashCourseConfig = {
  slug: "jc-june-2026",
  metadata: {
    title: "Zenith June JC Crash Course Scheduler",
    description: "Browse the June 2026 Zenith JC Crash Course schedule.",
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
  subjectLabels: {
    BIO: "Biology",
    CHEM: "Chemistry",
    ECON: "Economics",
    GP: "General Paper",
    MATH: "Math",
    PHYS: "Physics",
  },
  hero: {
    title: "June 2026 JC Crash Course",
    tagline: "Expert tutors • Proven results • Trusted since 2019",
    blurbHeadline: "Crash Course Schedule",
    blurbBody:
      "The June 2026 JC crash course has concluded. Browse the schedule below to review the sessions that ran — and explore our regular JC classes with a free trial lesson.",
    stats: "Trusted by over 20,000 students since 2019",
    heroImageSrc: "/zenith-banner.webp",
    heroImageAlt: "Zenith Education",
  },
  // Course has ended: top banner announces it and redirects to the regular
  // free-trial schedule (filtered to JC). When SS/Pri end, add the same block
  // to their configs — no component or page changes needed.
  closingBanner: {
    headline: "The June 2026 JC Crash Course has ended.",
    body: "Thank you for joining us! Continue your prep with a free trial lesson in our regular JC programme.",
    ctaLabel: "Browse free JC trial classes →",
    ctaHref: "https://schedule.zenitheducationstudio.com/?stream=JC",
  },
  bottomBanner: {
    body: "Looking for regular JC classes?",
    ctaLabel: "Try a free trial lesson →",
    ctaHref: "https://schedule.zenitheducationstudio.com/?stream=JC",
  },
  // After the course ends (from 1 Jul, the day after dateRange.end), each
  // ended slot links to the regular free-trial schedule for its subject.
  // The regular site's JC subject filter values match our labels except
  // "Math", which it calls "Mathematics".
  trialRedirect: {
    baseUrl: "https://schedule.zenitheducationstudio.com/",
    stream: "JC",
    subjectOverrides: { Math: "Mathematics" },
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
