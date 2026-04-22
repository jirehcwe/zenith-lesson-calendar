import type { Session } from "@/types";

export type SubjectColor = { backgroundColor: string; textColor: string };

export type BannerContent = {
  headline?: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
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
  signupBanner: BannerContent & { imageSrc: string; imageAlt: string };
  bottomBanner: BannerContent;
  calendar: CalendarUIConfig;
  registrationFormUrl: string;
  campaignField: string;
  promocodeField?: string;
  sessions: Session[];
};
