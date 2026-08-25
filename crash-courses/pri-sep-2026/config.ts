import type { CrashCourseConfig } from "../types";
import sessionsRaw from "./sessions.json";
import type { Session } from "@/types";

const sessions = sessionsRaw as Session[];

// Palette carried over from pri-june-2026.
const ENGLISH = "#9FC5E8";
const MATH = "#F6B26B";
const SCIENCE = "#B6D7A8";
const BLACK = "#000000";

// September runs P4 and P5 only. The form covers P4-P6, but P6 appears there
// solely under the Mock Exam questions, and no P6 crash-course class exists in
// the schedule.
//
// The prefill IDs below come from the September form, NOT from
// pri-june-2026/form-mapping.json. Google kept the question IDs when the form
// was duplicated but ops relabelled the levels, so June's "P5 English" id
// (822255076) is September's *P4* English, and June's P6 ids are September's
// P5. Copying June would send every P5 signup to the P4 question.
const config: CrashCourseConfig = {
  slug: "pri-sep-2026",
  metadata: {
    title: "Zenith September Primary Crash Course Scheduler",
    description:
      "Browse and register for the September 2026 Zenith Primary Crash Course.",
  },
  dateRange: { start: "2026-09-06", end: "2026-09-15" },
  year: 2026,
  subjectColors: {
    "P4 English": { backgroundColor: ENGLISH, textColor: BLACK },
    "P5 English": { backgroundColor: ENGLISH, textColor: BLACK },

    "P4 Math": { backgroundColor: MATH, textColor: BLACK },
    "P5 Math": { backgroundColor: MATH, textColor: BLACK },

    "P4 Science": { backgroundColor: SCIENCE, textColor: BLACK },
    "P5 Science": { backgroundColor: SCIENCE, textColor: BLACK },
  },
  subjectLabels: {
    P4Eng: "P4 English",
    P4Math: "P4 Math",
    P4Sci: "P4 Science",
    P5Eng: "P5 English",
    P5Math: "P5 Math",
    P5Sci: "P5 Science",
  },
  hero: {
    title: "Zenith Primary\n2026 September Crash Course",
    tagline: "Expert tutors • Proven results • Trusted since 2019",
    blurbBody:
      "Registration is open for the September 2026 Primary crash course, 6 to 15 September, for P4 and P5. Pick a level, subject and centre below, then click any class to register.",
    stats: "Trusted by over 20,000 students since 2019",
    heroImageSrc: "/zenith_banner_alt.webp",
    heroImageAlt: "Zenith Education",
  },
  bottomBanner: {
    body: "Looking for regular Primary classes?",
    ctaLabel: "Try a free trial lesson →",
    ctaHref: "https://schedule.zenitheducationstudio.com/?stream=Primary",
  },
  calendar: {
    firstDay: 1,
    initialDate: "2026-09-07",
    slotMinTime: "08:00:00",
    slotMaxTime: "22:00:00",
    listViewMinDate: "2026-09-06",
    tip: {
      label: "Pro Tip",
      body: "Use the filters to narrow down by level, subject or centre. Click any class for the prefilled registration link.",
    },
  },
  registrationFormUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSeIYwmErMuxTWLSLoeP_HTz54BIPzNcMrZJwwLxVI-BcuVhyA/viewform?entry.1157532004=SCHEDULE",
  campaignField: "entry.1157532004",
  levelFilter: { enabled: true, order: ["P4", "P5"] },
  sessions,
};

export default config;
