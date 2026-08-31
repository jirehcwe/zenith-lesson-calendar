import type { CrashCourseConfig } from "../types";
import sessionsRaw from "./sessions.json";
import type { Session } from "@/types";

const sessions = sessionsRaw as Session[];

// Palette carried over from ss-june-2026 so a returning student sees each
// subject in the same colour. Science reuses the Physics swatch, as in June.
const ENGLISH = "#DD7E6B";
const MATH = "#FED966";
const A_E_MATH = "#CFE2F3";
const PHYSICS = "#C27BA0";
const CHEMISTRY = "#F4CCCC";
const BIOLOGY = "#D9EAD3";
const HISTORY = "#B6A48E";
const SOCIAL_STUDIES = "#C9DAF8";
const LITERATURE = "#D5A6BD";
const BLACK = "#000000";

// September runs S1-S3 only — the registration form is titled
// "Secondary 1 - 3" and has no S4 questions. June covered S4/5 as well.
const config: CrashCourseConfig = {
  slug: "ss-sep-2026",
  metadata: {
    title: "Zenith September Secondary Crash Course Scheduler",
    description:
      "Browse and register for the September 2026 Zenith Secondary Crash Course.",
  },
  dateRange: { start: "2026-09-05", end: "2026-09-13" },
  year: 2026,
  subjectColors: {
    "S1 English": { backgroundColor: ENGLISH, textColor: BLACK },
    "S2 English": { backgroundColor: ENGLISH, textColor: BLACK },
    "S3 English": { backgroundColor: ENGLISH, textColor: BLACK },
    "S3 IP English": { backgroundColor: ENGLISH, textColor: BLACK },
    "S2 IP English": { backgroundColor: ENGLISH, textColor: BLACK },

    "S1 Math": { backgroundColor: MATH, textColor: BLACK },
    "S2 Math": { backgroundColor: MATH, textColor: BLACK },
    "S1 IP Math": { backgroundColor: MATH, textColor: BLACK },
    "S2 IP Math": { backgroundColor: MATH, textColor: BLACK },

    "S3 A Math": { backgroundColor: A_E_MATH, textColor: BLACK },
    "S3 E Math": { backgroundColor: A_E_MATH, textColor: BLACK },
    "S3 IP Math": { backgroundColor: A_E_MATH, textColor: BLACK },

    "S1 Science": { backgroundColor: PHYSICS, textColor: BLACK },

    "S3 Pure Physics": { backgroundColor: PHYSICS, textColor: BLACK },
    "S3 Combined Physics": { backgroundColor: PHYSICS, textColor: BLACK },
    "S3 IP Physics": { backgroundColor: PHYSICS, textColor: BLACK },

    "S3 Pure Chemistry": { backgroundColor: CHEMISTRY, textColor: BLACK },
    "S3 Combined Chemistry": { backgroundColor: CHEMISTRY, textColor: BLACK },
    "S3 IP Chemistry": { backgroundColor: CHEMISTRY, textColor: BLACK },

    "S3 Pure Biology": { backgroundColor: BIOLOGY, textColor: BLACK },
    "S3 Combined Biology": { backgroundColor: BIOLOGY, textColor: BLACK },

    "S3 Pure History": { backgroundColor: HISTORY, textColor: BLACK },
    "S3 Combined History": { backgroundColor: HISTORY, textColor: BLACK },

    "S3 Pure Literature": { backgroundColor: LITERATURE, textColor: BLACK },
    "S3 Combined Literature": { backgroundColor: LITERATURE, textColor: BLACK },

    "S3 Social Studies": { backgroundColor: SOCIAL_STUDIES, textColor: BLACK },
  },
  subjectLabels: {
    LSEng: "Lower Sec English",
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
    "SPhy(IP)": "(IP) Physics",
    "SChem(Pure)": "Pure Chemistry",
    "SChem(Comb)": "Combined Chemistry",
    "SChem(IP)": "(IP) Chemistry",
    "SBio(Pure)": "Pure Biology",
    "SBio(Comb)": "Combined Biology",
    "SHis(Pure)": "Pure History",
    "SHis(Comb)": "Combined History",
    "SLit(Pure)": "Pure Literature",
    "SLit(Comb)": "Combined Literature",
    "LSEng(IP)": "(IP) Lower Sec English",
    SSoc: "Social Studies",
  },
  hero: {
    title: "September 2026 Secondary Crash Course",
    tagline: "Expert tutors • Proven results • Trusted since 2019",
    blurbHeadline: "Crash Course Schedule",
    blurbBody:
      "Registration is open for the September 2026 Secondary crash course, 5 to 13 September, for S1 to S3. Pick a level, subject and centre below, then click any class to register.",
    stats: "Trusted by over 20,000 students since 2019",
    heroImageSrc: "/zenith-banner.webp",
    heroImageAlt: "Zenith Education",
  },
  // No closingBanner and no trialRedirect while the course is upcoming —
  // together they are what switch the page into its "course has ended" state.
  bottomBanner: {
    body: "Looking for regular Secondary classes?",
    ctaLabel: "Try a free trial lesson →",
    ctaHref:
      "https://schedule.zenitheducationstudio.com/?stream=Secondary+(Express)",
  },
  calendar: {
    firstDay: 1,
    initialDate: "2026-09-05",
    slotMinTime: "09:00:00",
    slotMaxTime: "22:00:00",
    listViewMinDate: "2026-09-05",
    tip: {
      label: "Pro Tip",
      body: "Use the filters to narrow down by level, subject or centre. Click any class for the prefilled registration link.",
    },
  },
  registrationFormUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLScmQhS2LlHQf4iJaxGt29C8Kcws-pUTWMGz_zfrikrTAPIzjw/viewform?entry.1157532004=SCHEDULE",
  campaignField: "entry.1157532004",
  levelFilter: { enabled: true, order: ["S1", "S2", "S3"] },
  sessions,
};

export default config;
