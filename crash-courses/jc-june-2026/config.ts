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
      "Our next JC crash course runs from 5 to 13 September 2026. Registration opens soon. The June 2026 schedule below shows the sessions that ran — and you can start now with a free trial lesson in our regular JC classes.",
    stats: "Trusted by over 20,000 students since 2019",
    heroImageSrc: "/zenith-banner.webp",
    heroImageAlt: "Zenith Education",
  },
  // The June course is over, so this block announces the next one. Its copy
  // also feeds the calendar overlay and the list panel through
  // getCourseEndedCta — one edit updates all three surfaces. Point ctaHref at
  // the September registration form once ops publishes it; until then the CTA
  // sends students to the regular free-trial schedule (filtered to JC).
  closingBanner: {
    headline: "Upcoming: JC Crash Course, 5–13 September 2026",
    body: "Registration opens soon. Until then, try a free trial lesson in our regular JC programme.",
    ctaLabel: "Browse free JC trial classes →",
    ctaHref: "https://schedule.zenitheducationstudio.com/?stream=JC",
  },
  bottomBanner: {
    body: "Looking for regular JC classes?",
    ctaLabel: "Try a free trial lesson →",
    ctaHref: "https://schedule.zenitheducationstudio.com/?stream=JC",
  },
  // From 1 Jul (the day after dateRange.end), the calendar shows an overlay
  // and the list a matching panel. Both carry the closingBanner copy above
  // and link to the regular free-trial JC schedule. `campaign` tags the
  // overlay click-out for attribution.
  trialRedirect: {
    baseUrl: "https://schedule.zenitheducationstudio.com/",
    stream: "JC",
    campaign: "POSTJUNCC",
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
