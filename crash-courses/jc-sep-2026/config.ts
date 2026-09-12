import type { CrashCourseConfig } from "../types";
import sessionsRaw from "./sessions.json";
import type { Session } from "@/types";

const sessions = sessionsRaw as Session[];

// September offers four subjects, not June's six — there is no GP and no
// Math this round. Colours carry over from jc-june-2026 so a returning
// student sees the same subject at the same colour.
const config: CrashCourseConfig = {
  slug: "jc-sep-2026",
  metadata: {
    title: "Zenith September JC Crash Course Scheduler",
    description: "Browse and register for the September 2026 Zenith JC Crash Course.",
  },
  // Classes run 4 Sep (two Economics sessions at Bishan) through 13 Sep.
  dateRange: { start: "2026-09-04", end: "2026-09-13" },
  year: 2026,
  subjectColors: {
    "J1 Biology": { backgroundColor: "#95B0F0", textColor: "#000000" },
    "J1 Physics": { backgroundColor: "#FC696A", textColor: "#000000" },
    "J1 Chemistry": { backgroundColor: "#FFFF02", textColor: "#000000" },
    "J1 Economics": { backgroundColor: "#7BFF85", textColor: "#000000" },
  },
  subjectLabels: {
    BIO: "Biology",
    CHEM: "Chemistry",
    ECON: "Economics",
    PHYS: "Physics",
  },
  hero: {
    title: "September 2026 JC Crash Course",
    tagline: "Expert tutors • Proven results • Trusted since 2019",
    blurbHeadline: "Crash Course Schedule",
    blurbBody:
      "Registration is open for the September 2026 JC crash course, 4 to 13 September. Pick a subject and a centre below, then click any class to register.",
    stats: "Trusted by over 20,000 students since 2019",
    heroImageSrc: "/zenith-banner.webp",
    heroImageAlt: "Zenith Education",
  },
  // Retirement blocks. `closingBanner` supplies the copy and `trialRedirect`
  // the click-out. Both are gated on the course being over, so nothing here
  // shows while the course still runs — that is deliberate, so students sign
  // up for the crash course rather than being sent to regular classes early.
  // From the day after dateRange.end the top strip, the calendar overlay and
  // the list panel all appear and point at the regular JC schedule,
  // tagged POSTSEPCC. The bottomBanner below is the one exception: it links
  // out throughout, and now carries the same tag.
  closingBanner: {
    headline: "The September JC Crash Course has ended",
    body: "Our regular JC programme runs all year. Try a free trial lesson.",
    ctaLabel: "Browse free JC trial classes →",
    ctaHref:
      "https://schedule.zenitheducationstudio.com/?stream=JC&campaign=POSTSEPCC",
  },
  trialRedirect: {
    baseUrl: "https://schedule.zenitheducationstudio.com/",
    stream: "JC",
    campaign: "POSTSEPCC",
  },
  bottomBanner: {
    body: "Looking for regular JC classes?",
    ctaLabel: "Try a free trial lesson →",
    ctaHref: "https://schedule.zenitheducationstudio.com/?stream=JC&campaign=POSTSEPCC",
  },
  calendar: {
    firstDay: 1,
    initialDate: "2026-09-04",
    slotMinTime: "09:00:00",
    slotMaxTime: "20:00:00",
    listViewMinDate: "2026-09-04",
    tip: {
      label: "Pro Tip",
      body: "Use the filters to narrow down by subject or centre. Click any class for the prefilled registration link.",
    },
  },
  registrationFormUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSf7vctKS1OXQjTezixd1qkpcNxe6eYK4HWT_qcbcY-n3ixkSw/viewform?entry.1157532004=SCHEDULE",
  campaignField: "entry.1157532004",
  sessions,
};

export default config;
