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
  dateRange: { start: "2026-05-01", end: "2026-05-31" },
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
  signupBanner: {
    imageSrc: "/zenith_banner.jpg",
    imageAlt: "Zenith Banner",
    body:
      "This website will help you plan out the crash course slots you wish to attend\n\n" +
      "Ready to lock in for promos?",
    ctaLabel: "Click here to sign up!",
    ctaHref:
      "https://docs.google.com/forms/d/e/1FAIpQLSesYi1vS9HGIsyW1nTjxXbk07anXX3iZ9yAMXfwON4w0wiqdg/viewform?usp=pp_url&entry.1157532004=SCHEDULE",
  },
  bottomBanner: {
    body: "Ready to lock in for promos?",
    ctaLabel: "Click here to sign up!",
    ctaHref:
      "https://docs.google.com/forms/d/e/1FAIpQLSesYi1vS9HGIsyW1nTjxXbk07anXX3iZ9yAMXfwON4w0wiqdg/viewform?usp=dialog&entry.1157532004=SCHEDULE",
  },
  calendar: {
    firstDay: 1,
    initialDate: "2026-05-01",
    slotMinTime: "09:00:00",
    slotMaxTime: "22:00:00",
    listViewMinDate: "2026-05-01",
    tip: null,
  },
  registrationFormUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSesYi1vS9HGIsyW1nTjxXbk07anXX3iZ9yAMXfwON4w0wiqdg/viewform?entry.1157532004=SCHEDULE",
  campaignField: "entry.1157532004",
  sessions,
};

export default config;
