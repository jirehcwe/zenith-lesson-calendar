import type { Session } from "@/types";
import type { CrashCourseConfig } from "../../crash-courses/types";
import { buildRegistrationUrl } from "./registration";

export function isMockExam(
  session: Pick<Session, "purpose">,
  config: Pick<CrashCourseConfig, "mockExam">
): boolean {
  if (!config.mockExam) return false;
  return session.purpose === config.mockExam.purposeMatch;
}

export function hasAnyMockExams(
  sessions: Pick<Session, "purpose">[],
  config: Pick<CrashCourseConfig, "mockExam">
): boolean {
  if (!config.mockExam) return false;
  return sessions.some((s) => isMockExam(s, config));
}

// Resolves the registration URL for a session. Mock-exam rows route to the
// variant URL with no prefill (Jotform doesn't accept Google-Forms-style
// entry params). Everything else goes through the existing prefill builder.
export function getRegistrationUrl(
  session: Session,
  config: Pick<CrashCourseConfig, "registrationFormUrl" | "mockExam">
): string {
  if (isMockExam(session, config) && config.mockExam) {
    return config.mockExam.registrationFormUrl;
  }
  return buildRegistrationUrl(config.registrationFormUrl, session);
}

export function getCtaLabel(
  session: Pick<Session, "purpose">,
  config: Pick<CrashCourseConfig, "mockExam">,
  defaultLabel: string
): string {
  if (isMockExam(session, config) && config.mockExam) {
    return config.mockExam.ctaLabel;
  }
  return defaultLabel;
}
