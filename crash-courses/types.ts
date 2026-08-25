import type { Session } from "@/types";

export type SubjectColor = { backgroundColor: string; textColor: string };

export type BannerContent = {
  headline?: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
};

export type TrialRedirectConfig = {
  // Regular free-trial schedule base URL
  // (e.g. "https://schedule.zenitheducationstudio.com/").
  baseUrl: string;
  // ?stream= value, matched exactly against the regular site's stream options
  // (e.g. "JC", "Secondary (Express)", "Secondary (IP)", "Primary").
  stream: string;
  // Optional ?campaign= value appended to the course-ended overlay click-out
  // for attribution (e.g. "POSTJUNCC"). Overlay only; the list panel omits it.
  campaign?: string;
};

export type HeroContent = {
  // May contain a literal "\n" to split the visible title across lines
  // (rendered by SignupBanner via a split-and-block pass).
  title: string;
  tagline: string;
  // Optional. When omitted or empty, the headline above the blurb body
  // is not rendered.
  blurbHeadline?: string;
  blurbBody: string;
  stats: string;
  heroImageSrc: string;
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
  // OMIT it when the mock exam is booked through the slug's main form: rows
  // then go through the normal prefill builder, using their own entry id.
  registrationFormUrl?: string;
  // CTA button label for mock-exam rows (e.g. "Register for Exam Simulation").
  // Omit to fall back to the regular label.
  ctaLabel?: string;
  // Optional second half of a paired mock exam — the walkthrough that follows
  // the simulation, on another day and sometimes in another room. Rows whose
  // `purpose` matches appear as their own Type in the filter and deliberately
  // render NO call to action: a place is booked through the paired simulation
  // slot, and `note` says so on the card and in the modal.
  pairedVariant?: {
    purposeMatch: string;
    variantLabel: string;
    note: string;
  };
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
  // Optional. When set, a prominent banner renders at the very top of the
  // page (above the hero) — used to announce that a course has ended and
  // redirect students elsewhere (e.g. the regular free-trial schedule).
  // Reuses BannerContent; unlike bottomBanner, its `headline` is shown.
  closingBanner?: BannerContent;
  // Optional. Base URL + stream (+ campaign) for the regular free-trial
  // schedule. With `closingBanner` set, once the course ends (past
  // dateRange.end) the calendar shows a course-ended overlay and the list a
  // matching panel, both linking students there.
  trialRedirect?: TrialRedirectConfig;
  calendar: CalendarUIConfig;
  registrationFormUrl: string;
  campaignField: string;
  promocodeField?: string;
  sessions: Session[];
  mockExam?: MockExamConfig;
  // Optional. When enabled, the Filters bar renders a Level dropdown
  // (e.g. "S1"…"S4", "P5"/"P6") derived from each session's `level` field
  // with the trailing year stripped. `order` overrides the default sort if
  // the natural ordering is wrong; omit it to alpha-sort.
  // Slugs with a single level (e.g. JC = J1 only) should omit this block —
  // the filter would be a no-op pill.
  levelFilter?: { enabled: boolean; order?: string[] };
  // Set to true when a slug folder exists ahead of the source data. Lets the
  // config ship through type-check + bundle while waiting for the schedule
  // CSV; the config-integrity "non-empty sessions" assertion is skipped, and
  // build/deploy of this slug should be gated externally until data lands.
  preLaunch?: boolean;
};
