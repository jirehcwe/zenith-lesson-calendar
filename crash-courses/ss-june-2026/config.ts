import type { CrashCourseConfig } from "../types";
import sessionsRaw from "./sessions.json";
import type { Session } from "@/types";

const sessions = sessionsRaw as Session[];

const ENGLISH = "#DD7E6B";
const MATH = "#FED966";
const A_E_MATH = "#CFE2F3";
const PHYSICS = "#C27BA0";
const CHEMISTRY = "#F4CCCC";
const BIOLOGY = "#D9EAD3";
// TODO: humanities palette is a placeholder picked from Google Sheets defaults.
// Confirm with design before deploy.
const HISTORY = "#B6A48E";
const LITERATURE = "#D5A6BD";
const SOCIAL_STUDIES = "#C9DAF8";
const BLACK = "#000000";

const config: CrashCourseConfig = {
  slug: "ss-june-2026",
  metadata: {
    title: "Zenith June SS Crash Course Scheduler",
    description: "Browse the June 2026 Zenith Secondary Crash Course schedule.",
  },
  dateRange: { start: "2026-05-30", end: "2026-06-30" },
  year: 2026,
  subjectColors: {
    "S1 English": { backgroundColor: ENGLISH, textColor: BLACK },
    "S2 English": { backgroundColor: ENGLISH, textColor: BLACK },
    "S3 English": { backgroundColor: ENGLISH, textColor: BLACK },
    "S4/5 English": { backgroundColor: ENGLISH, textColor: BLACK },
    "S1 IP English": { backgroundColor: ENGLISH, textColor: BLACK },
    "S2 IP English": { backgroundColor: ENGLISH, textColor: BLACK },
    "S3 IP English": { backgroundColor: ENGLISH, textColor: BLACK },
    "S4 IP English": { backgroundColor: ENGLISH, textColor: BLACK },

    "S1 Math": { backgroundColor: MATH, textColor: BLACK },
    "S2 Math": { backgroundColor: MATH, textColor: BLACK },
    "S1 IP Math": { backgroundColor: MATH, textColor: BLACK },
    "S2 IP Math": { backgroundColor: MATH, textColor: BLACK },
    "S3 IP Math": { backgroundColor: MATH, textColor: BLACK },
    "S4 IP Math": { backgroundColor: MATH, textColor: BLACK },

    "S3 A Math": { backgroundColor: A_E_MATH, textColor: BLACK },
    "S3 E Math": { backgroundColor: A_E_MATH, textColor: BLACK },
    "S4/5 A Math": { backgroundColor: A_E_MATH, textColor: BLACK },
    "S4/5 E Math": { backgroundColor: A_E_MATH, textColor: BLACK },

    "S1 Science": { backgroundColor: PHYSICS, textColor: BLACK },
    "S2 Science": { backgroundColor: PHYSICS, textColor: BLACK },
    "S3 Pure Physics": { backgroundColor: PHYSICS, textColor: BLACK },
    "S3 Combined Physics": { backgroundColor: PHYSICS, textColor: BLACK },
    "S4/5 Pure Physics": { backgroundColor: PHYSICS, textColor: BLACK },
    "S4/5 Combined Physics": { backgroundColor: PHYSICS, textColor: BLACK },

    "S3 Combined Chemistry": { backgroundColor: CHEMISTRY, textColor: BLACK },
    "S3 Pure Chemistry": { backgroundColor: CHEMISTRY, textColor: BLACK },
    "S4/5 Pure Chemistry": { backgroundColor: CHEMISTRY, textColor: BLACK },
    "S4/5 Combined Chemistry": { backgroundColor: CHEMISTRY, textColor: BLACK },
    "S3 IP Chemistry": { backgroundColor: CHEMISTRY, textColor: BLACK },
    "S4 IP Chemistry": { backgroundColor: CHEMISTRY, textColor: BLACK },

    "S3 Pure Biology": { backgroundColor: BIOLOGY, textColor: BLACK },
    "S3 Combined Biology": { backgroundColor: BIOLOGY, textColor: BLACK },
    "S4/5 Pure Biology": { backgroundColor: BIOLOGY, textColor: BLACK },
    "S4/5 Combined Biology": { backgroundColor: BIOLOGY, textColor: BLACK },

    // TODO: humanities — colours are placeholders, confirm with design.
    "S3 Pure History": { backgroundColor: HISTORY, textColor: BLACK },
    "S3 Combined History": { backgroundColor: HISTORY, textColor: BLACK },
    "S4 Pure History": { backgroundColor: HISTORY, textColor: BLACK },
    "S4 Combined History": { backgroundColor: HISTORY, textColor: BLACK },

    "S3 Pure Literature": { backgroundColor: LITERATURE, textColor: BLACK },
    "S3 Combined Literature": { backgroundColor: LITERATURE, textColor: BLACK },
    "S4 Pure Literature": { backgroundColor: LITERATURE, textColor: BLACK },
    "S4 Combined Literature": { backgroundColor: LITERATURE, textColor: BLACK },

    "S3 Social Studies": { backgroundColor: SOCIAL_STUDIES, textColor: BLACK },
    "S4 Social Studies": { backgroundColor: SOCIAL_STUDIES, textColor: BLACK },
  },
  subjectLabels: {
    LSEng: "Lower Sec English",
    "LSEng(IP)": "(IP) Lower Sec English",
    LSMath: "Lower Sec Math",
    "LSMath(IP)": "(IP) Lower Sec Math",
    LSScience: "Lower Sec Science",
    SEng: "Upper Sec English",
    "SEng(IP)": "(IP) Upper Sec English",
    "SMath(AM)": "A Math",
    "SMath(EM)": "E Math",
    "SMath(IP)": "(IP) Upper Sec Math",
    "SPhy(Pure)": "Pure Physics",
    "SPhy(Comb)": "Combined Physics",
    "SChem(Pure)": "Pure Chemistry",
    "SChem(Comb)": "Combined Chemistry",
    "SChem(IP)": "(IP) Chemistry",
    "SBio(Pure)": "Pure Biology",
    "SBio(Comb)": "Combined Biology",
    "SHis(Pure)": "Pure History",
    "SHis(Comb)": "Combined History",
    "SLit(Pure)": "Pure Literature",
    "SLit(Comb)": "Combined Literature",
    SSoc: "Social Studies",
  },
  hero: {
    title: "June 2026 SS Crash Course",
    tagline: "Expert tutors • Proven results • Trusted since 2019",
    blurbHeadline: "Crash Course Schedule",
    blurbBody:
      "The June 2026 Secondary crash course has concluded. Browse the schedule below to review the sessions that ran — and explore our regular Secondary classes with a free trial lesson.",
    stats: "Trusted by over 20,000 students since 2019",
    heroImageSrc: "/zenith-banner.webp",
    heroImageAlt: "Zenith Education",
  },
  // Course has ended: sticky banner announces it and links to the regular
  // free-trial Secondary schedule. The course-ended overlay/panel deep-link
  // there too — tagged POSTJUNCC on the overlay (a shared "post June crash
  // course" code across all levels). The SS cohort mixes Express + IP; the
  // click-out defaults to Express (the majority).
  closingBanner: {
    headline: "The June 2026 Secondary Crash Course has ended.",
    body: "Thank you for joining us! Continue your prep with a free trial lesson in our regular Secondary programme.",
    ctaLabel: "Browse free Secondary trial classes →",
    ctaHref:
      "https://schedule.zenitheducationstudio.com/?stream=Secondary+(Express)",
  },
  bottomBanner: {
    body: "Looking for regular Secondary classes?",
    ctaLabel: "Try a free trial lesson →",
    ctaHref:
      "https://schedule.zenitheducationstudio.com/?stream=Secondary+(Express)",
  },
  trialRedirect: {
    baseUrl: "https://schedule.zenitheducationstudio.com/",
    stream: "Secondary (Express)",
    campaign: "POSTJUNCC",
  },
  calendar: {
    firstDay: 1,
    initialDate: "2026-06-01",
    slotMinTime: "09:00:00",
    slotMaxTime: "22:00:00",
    listViewMinDate: "2026-05-30",
    tip: {
      label: "Pro Tip",
      body: "Use the filters to narrow down by subject or centre. Click any class for the prefilled registration link.",
    },
  },
  registrationFormUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSd67XsTW9RiNHFBoP4R0-j0y3yPIBO2syghkbPmt6bzyUViPw/viewform?entry.1157532004=SCHEDULE",
  campaignField: "entry.1157532004",
  levelFilter: { enabled: true },
  sessions,
};

export default config;
