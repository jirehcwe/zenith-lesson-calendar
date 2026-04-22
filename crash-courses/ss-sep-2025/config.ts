import type { CrashCourseConfig } from "../types";
import sessionsRaw from "./sessions.json";
import type { Session } from "@/types";

const sessions = sessionsRaw as Session[];

const config: CrashCourseConfig = {
  slug: "ss-sep-2025",
  metadata: {
    title: "Zenith September SS Crash Course Scheduler",
    description: "Sign up for Zenith Secondary Crash Course now!",
  },
  dateRange: { start: "2025-09-01", end: "2025-09-14" },
  year: 2025,
  subjectColors: {
    Mathematics: { backgroundColor: "#FED966", textColor: "#000000" },
    Math: { backgroundColor: "#FED966", textColor: "#000000" },
    "IP Math": { backgroundColor: "#FED966", textColor: "#000000" },
    "A Math": { backgroundColor: "#CFE2F3", textColor: "#000000" },
    "E Math": { backgroundColor: "#CFE2F3", textColor: "#000000" },
    "Pure Physics": { backgroundColor: "#C27BA0", textColor: "#000000" },
    "Combined Physics": { backgroundColor: "#C27BA0", textColor: "#000000" },
    Chemistry: { backgroundColor: "#C27BA0", textColor: "#000000" },
    Science: { backgroundColor: "#C27BA0", textColor: "#000000" },
    "IP Science": { backgroundColor: "#C27BA0", textColor: "#000000" },
    "Pure Chemistry": { backgroundColor: "#F4CCCC", textColor: "#000000" },
    "Combined Chemistry": { backgroundColor: "#F4CCCC", textColor: "#000000" },
    "Pure Biology": { backgroundColor: "#D9EAD3", textColor: "#000000" },
    "Combined Biology": { backgroundColor: "#D9EAD3", textColor: "#000000" },
    English: { backgroundColor: "#DD7E6B", textColor: "#000000" },
    "IP English": { backgroundColor: "#DD7E6B", textColor: "#000000" },
  },
  signupBanner: {
    imageSrc: "/zenith_banner.jpg",
    imageAlt: "Zenith Banner",
    body:
      "This website will help you plan out the crash course slots you wish to attend\n\n" +
      "Ready to lock in for your exams?",
    ctaLabel: "Click here to sign up!",
    ctaHref:
      "https://docs.google.com/forms/d/e/1FAIpQLSdc1DdBljxZx1mXH6Ztpxr_zbnI9XJunAKHDeN_GVR1jBuI9Q/viewform?usp=pp_url&entry.1157532004=SCHEDULE",
  },
  bottomBanner: {
    body: "Ready to lock in for your exams?",
    ctaLabel: "Click here to sign up!",
    ctaHref:
      "https://docs.google.com/forms/d/e/1FAIpQLSdc1DdBljxZx1mXH6Ztpxr_zbnI9XJunAKHDeN_GVR1jBuI9Q/viewform?usp=dialog&entry.1157532004=SCHEDULE",
  },
  calendar: {
    firstDay: 1,
    initialDate: "2025-09-01",
    slotMinTime: "09:00:00",
    slotMaxTime: "22:00:00",
    listViewMinDate: "2025-09-06",
    tip: {
      label: "Tip",
      body:
        "There are more crash course slots in September! Use the right arrow to navigate to the September calendar.",
    },
  },
  registrationFormUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSdc1DdBljxZx1mXH6Ztpxr_zbnI9XJunAKHDeN_GVR1jBuI9Q/viewform?entry.1157532004=SCHEDULE",
  campaignField: "entry.1157532004",
  sessions,
};

export default config;
