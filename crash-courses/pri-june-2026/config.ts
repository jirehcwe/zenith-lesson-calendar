import type { CrashCourseConfig } from "../types";
import sessionsRaw from "./sessions.json";
import type { Session } from "@/types";

const sessions = sessionsRaw as Session[];

const ENGLISH = "#9FC5E8";
const MATH = "#F6B26B";
const SCIENCE = "#B6D7A8";
const BLACK = "#000000";

const config: CrashCourseConfig = {
  slug: "pri-june-2026",
  metadata: {
    title: "Zenith June Primary Crash Course Scheduler",
    description: "Sign up for Zenith Primary Crash Course now!",
  },
  dateRange: { start: "2026-06-01", end: "2026-06-30" },
  year: 2026,
  subjectColors: {
    "P5 English": { backgroundColor: ENGLISH, textColor: BLACK },
    "P6 English": { backgroundColor: ENGLISH, textColor: BLACK },

    "P5 Math": { backgroundColor: MATH, textColor: BLACK },
    "P6 Math": { backgroundColor: MATH, textColor: BLACK },

    "P5 Science": { backgroundColor: SCIENCE, textColor: BLACK },
    "P6 Science": { backgroundColor: SCIENCE, textColor: BLACK },
  },
  subjectLabels: {
    P5Eng: "P5 English",
    P6Eng: "P6 English",
    P5Math: "P5 Math",
    P6Math: "P6 Math",
    P5Sci: "P5 Science",
    P6Sci: "P6 Science",
  },
  hero: {
    title: "Zenith Primary\n2026 June Holiday Programmes",
    tagline:
      "Flexible scheduling • Expert tutors • Proven results • Book your slots early",
    blurbBody:
      "Make this June holiday a fruitful one with Zenith’s two-part programme for P5–P6 students. Start with our FREE Crash Course to strengthen core concepts, then move into our Exam Simulation to apply what they’ve learned under real exam conditions.",
    stats: "Trusted by over 20,000 students since 2019",
    heroImageSrc: "/zenith_banner_alt.webp",
    heroImageAlt: "Zenith Education",
  },
  calendar: {
    firstDay: 1,
    initialDate: "2026-06-01",
    slotMinTime: "08:00:00",
    slotMaxTime: "22:00:00",
    listViewMinDate: "2026-06-01",
    tip: {
      label: "Pro Tip",
      body: "Use the filters to narrow down by subject or centre. Click any class for the prefilled registration link.",
    },
  },
  registrationFormUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSf7DBZ-j35Yd3XkzqZfntLPjJEqqm0q0J3mVx2-loTdz0euQg/viewform?entry.1157532004=SCHEDULE",
  campaignField: "entry.1157532004",
  sessions,
  mockExam: {
    purposeMatch: "Pri Mock Exam",
    variantLabel: "Exam Simulation",
    registrationFormUrl: "https://pci.jotform.com/form/261182286777064",
    ctaLabel: "Register for Exam Simulation",
  },
};

export default config;
