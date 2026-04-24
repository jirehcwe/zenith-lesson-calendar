import type { Session } from "@/types";

export type SubjectColor = { backgroundColor: string; textColor: string };

export type BannerContent = {
  headline?: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
};

export type HeroContent = {
  title: string;           // "May 2026 SS Crash Course"
  tagline: string;         // "Flexible scheduling • Expert tutors • …"
  blurbHeadline: string;   // "Find Your Perfect Crash Course"
  blurbBody: string;       // long intro paragraph
  stats: string;           // "Trusted by over 20,000 students since 2019"
  heroImageSrc: string;    // e.g. "/zenith-banner.webp"
  heroImageAlt: string;
};

export type CalendarUIConfig = {
  firstDay: number;
  initialDate: string;
  slotMinTime: string;
  slotMaxTime: string;
  listViewMinDate: string;
  tip?: { label: string; body: string } | null;
};

export type CrashCourseConfig = {
  slug: string;
  metadata: { title: string; description: string };
  dateRange: { start: string; end: string };
  year: number;
  subjectColors: Record<string, SubjectColor>;
  // Maps raw CSV `subject` codes (e.g. "SMath(AM)") to the labels shown
  // to students in filters, list cards, and calendar event titles. Codes
  // without an entry fall back to the raw code at render time.
  subjectLabels?: Record<string, string>;
  hero: HeroContent;
  bottomBanner: BannerContent;
  calendar: CalendarUIConfig;
  registrationFormUrl: string;
  campaignField: string;
  promocodeField?: string;
  sessions: Session[];
};
