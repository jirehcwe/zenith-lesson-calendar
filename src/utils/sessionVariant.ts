import type { Session } from "@/types";
import type { CrashCourseConfig } from "../../crash-courses/types";
import { buildRegistrationUrl } from "./registration";

type MockCfg = Pick<CrashCourseConfig, "mockExam">;

// True for either half of a mock exam — the simulation and its walkthrough.
// Drives the EXAM pill, the darker subject shade, and whether the Type filter
// appears at all. Use isMockWalkthrough to tell the two apart.
export function isMockExam(
  session: Pick<Session, "purpose">,
  config: MockCfg
): boolean {
  const m = config.mockExam;
  if (!m) return false;
  return (
    session.purpose === m.purposeMatch ||
    session.purpose === m.pairedVariant?.purposeMatch
  );
}

// The walkthrough half: shown as its own Type, and never registrable on its
// own — parents book it via the paired simulation slot.
export function isMockWalkthrough(
  session: Pick<Session, "purpose">,
  config: MockCfg
): boolean {
  const paired = config.mockExam?.pairedVariant;
  return !!paired && session.purpose === paired.purposeMatch;
}

export function hasAnyMockExams(
  sessions: Pick<Session, "purpose">[],
  config: MockCfg
): boolean {
  if (!config.mockExam) return false;
  return sessions.some((s) => isMockExam(s, config));
}

// Label for the Type filter: the simulation label, the walkthrough label, or
// null for an ordinary class.
export function getVariantLabel(
  session: Pick<Session, "purpose">,
  config: MockCfg
): string | null {
  const m = config.mockExam;
  if (!m) return null;
  if (isMockWalkthrough(session, config)) {
    return m.pairedVariant!.variantLabel;
  }
  return session.purpose === m.purposeMatch ? m.variantLabel : null;
}

// Every Type option a slug can show, in filter order.
export function getVariantLabels(config: MockCfg): string[] {
  const m = config.mockExam;
  if (!m) return [];
  return m.pairedVariant
    ? [m.variantLabel, m.pairedVariant.variantLabel]
    : [m.variantLabel];
}

// The explanation shown in place of a CTA on a walkthrough row.
export function getWalkthroughNote(
  session: Pick<Session, "purpose">,
  config: MockCfg
): string | null {
  return isMockWalkthrough(session, config)
    ? (config.mockExam!.pairedVariant!.note ?? null)
    : null;
}

// Resolves the registration URL for a session. A mock exam routes to the
// variant URL with no prefill when one is configured (June used a Jotform,
// which doesn't accept Google-Forms-style entry params). When the mock exam
// lives inside the slug's own form instead, omit that URL and the row goes
// through the normal prefill builder with its own entry id.
export function getRegistrationUrl(
  session: Session,
  config: Pick<CrashCourseConfig, "registrationFormUrl" | "mockExam">
): string {
  const override = config.mockExam?.registrationFormUrl;
  if (override && isMockExam(session, config)) return override;
  return buildRegistrationUrl(config.registrationFormUrl, session);
}

export function getCtaLabel(
  session: Pick<Session, "purpose">,
  config: MockCfg,
  defaultLabel: string
): string {
  const label = config.mockExam?.ctaLabel;
  if (label && isMockExam(session, config)) return label;
  return defaultLabel;
}
