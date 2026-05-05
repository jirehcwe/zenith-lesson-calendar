/**
 * @jest-environment jsdom
 */
import {
  isMockExam,
  hasAnyMockExams,
  getRegistrationUrl,
  getCtaLabel,
} from "../sessionVariant";
import type { Session } from "@/types";
import type { CrashCourseConfig } from "../../../crash-courses/types";

const baseConfig: Pick<
  CrashCourseConfig,
  "registrationFormUrl" | "mockExam"
> = {
  registrationFormUrl:
    "https://docs.google.com/forms/d/e/FORMID/viewform?entry.1157532004=SCHEDULE",
  mockExam: {
    purposeMatch: "Pri Mock Exam",
    variantLabel: "Exam Simulation",
    registrationFormUrl: "https://pci.jotform.com/form/261182286777064",
    ctaLabel: "Register for Exam Simulation",
  },
};

const regular: Session = {
  purpose: "Pri JunCC",
  subject: "P5Eng",
  tutor: "Jolene",
  centre: "Bishan",
  topic: "Open-ended",
  date: "12 Jun",
  startTime: "1:00 PM",
  endTime: "3:00 PM",
  level: "P5 2026",
  prefill: "[P5 English] Bishan | 12 Jun (Fri) | 1:00PM - 3:00PM",
  prefillField: "822255076",
  displaySubject: "P5 English",
};

const mock: Session = {
  ...regular,
  purpose: "Pri Mock Exam",
  prefill: "[P5 English] Bishan | 12 Jun (Fri) | 08:00AM - 01:00PM",
  topic: "",
};

describe("sessionVariant", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("isMockExam matches by purpose when config.mockExam is set", () => {
    expect(isMockExam(mock, baseConfig)).toBe(true);
    expect(isMockExam(regular, baseConfig)).toBe(false);
  });

  it("isMockExam returns false when config.mockExam is undefined", () => {
    expect(isMockExam(mock, { mockExam: undefined })).toBe(false);
  });

  it("hasAnyMockExams reflects presence of any mock-exam row", () => {
    expect(hasAnyMockExams([regular, mock], baseConfig)).toBe(true);
    expect(hasAnyMockExams([regular], baseConfig)).toBe(false);
    expect(hasAnyMockExams([mock], { mockExam: undefined })).toBe(false);
  });

  it("getRegistrationUrl routes mock exams to the variant URL with no prefill query", () => {
    const url = getRegistrationUrl(mock, baseConfig);
    expect(url).toBe("https://pci.jotform.com/form/261182286777064");
    expect(url).not.toContain("entry.");
  });

  it("getRegistrationUrl routes regular sessions through the prefill builder", () => {
    const url = getRegistrationUrl(regular, baseConfig);
    expect(url).toContain("entry.822255076=");
    expect(url).toContain("entry.1157532004=SCHEDULE");
  });

  it("getCtaLabel returns the variant copy for mock exams, default otherwise", () => {
    expect(getCtaLabel(mock, baseConfig, "Register (prefilled)")).toBe(
      "Register for Exam Simulation"
    );
    expect(getCtaLabel(regular, baseConfig, "Register (prefilled)")).toBe(
      "Register (prefilled)"
    );
  });
});
