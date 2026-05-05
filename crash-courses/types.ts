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

// Optional per-slug variant for sessions tagged as something other than the
// standard crash course (currently: Primary mock exams). When set, sessions
// whose `purpose` matches `purposeMatch` are routed through this block:
// they take a darker shade of the subject palette (computed at render
// time), the registration link points at `registrationFormUrl` with no
// prefill, and CTA copy is overridden by `ctaLabel`. Filters expose a Type
// pill so users can isolate the variant or the regulars.
export type MockExamConfig = {
  // Exact value to match against Session.purpose (e.g. "Pri Mock Exam").
  purposeMatch: string;
  // User-facing label for the Type filter pill and modal/list CTA copy
  // (e.g. "Exam Simulation").
  variantLabel: string;
  // Form URL. No SCHEDULE/PROMOCODE placeholders required — this URL is
  // used as-is (e.g. a Jotform that doesn't take prefill query params).
  registrationFormUrl: string;
  // CTA button label for mock-exam rows (e.g. "Register for Exam Simulation").
  ctaLabel: string;
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
  // Optional. When omitted, the page does not render a bottom CTA banner —
  // useful for slugs where the per-session CTA is the only intended path.
  bottomBanner?: BannerContent;
  calendar: CalendarUIConfig;
  registrationFormUrl: string;
  campaignField: string;
  promocodeField?: string;
  sessions: Session[];
  mockExam?: MockExamConfig;
  // Set to true when a slug folder exists ahead of the source data. Lets the
  // config ship through type-check + bundle while waiting for the schedule
  // CSV; the config-integrity "non-empty sessions" assertion is skipped, and
  // build/deploy of this slug should be gated externally until data lands.
  preLaunch?: boolean;
};
