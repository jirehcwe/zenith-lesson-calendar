import {
  isMockExam,
  isMockWalkthrough,
  getVariantLabel,
  getVariantLabels,
  getWalkthroughNote,
  getRegistrationUrl,
} from "../sessionVariant";
import type { Session } from "@/types";

const paired = {
  registrationFormUrl:
    "https://docs.google.com/forms/d/e/FORM/viewform?entry.1157532004=SCHEDULE",
  mockExam: {
    purposeMatch: "Pri Mock Exam",
    variantLabel: "Exam Simulation",
    pairedVariant: {
      purposeMatch: "Pri Mock Walkthrough",
      variantLabel: "Exam Walkthrough",
      note: "Included with the Exam Simulation.",
    },
  },
};

// June's shape: a single variant booked on an external form.
const singleJotform = {
  registrationFormUrl: "https://docs.google.com/forms/d/e/FORM/viewform",
  mockExam: {
    purposeMatch: "Pri Mock Exam",
    variantLabel: "Exam Simulation",
    registrationFormUrl: "https://pci.jotform.com/form/123",
    ctaLabel: "Register for Exam Simulation",
  },
};

const session = (purpose: string): Session => ({
  purpose,
  subject: "P5EngMock",
  level: "P5 2026",
  topic: "Simulation 07 Sep · Walkthrough 10 Sep",
  tutor: "Ju",
  centre: "Bishan",
  date: "07 Sep",
  startTime: "8:15 AM",
  endTime: "11:50 AM",
  prefill: "[P5 Eng by Ju] - Bishan",
  prefillField: "414070380",
  displaySubject: "P5 English Mock Exam",
});

describe("paired mock-exam variants", () => {
  it("treats both halves as mock exams", () => {
    expect(isMockExam(session("Pri Mock Exam"), paired)).toBe(true);
    expect(isMockExam(session("Pri Mock Walkthrough"), paired)).toBe(true);
    expect(isMockExam(session("Pri SepCC"), paired)).toBe(false);
  });

  it("identifies only the walkthrough half", () => {
    expect(isMockWalkthrough(session("Pri Mock Walkthrough"), paired)).toBe(true);
    expect(isMockWalkthrough(session("Pri Mock Exam"), paired)).toBe(false);
  });

  it("labels each half distinctly and leaves classes unlabelled", () => {
    expect(getVariantLabel(session("Pri Mock Exam"), paired)).toBe("Exam Simulation");
    expect(getVariantLabel(session("Pri Mock Walkthrough"), paired)).toBe("Exam Walkthrough");
    expect(getVariantLabel(session("Pri SepCC"), paired)).toBeNull();
    expect(getVariantLabels(paired)).toEqual(["Exam Simulation", "Exam Walkthrough"]);
  });

  it("returns the note only for the walkthrough", () => {
    expect(getWalkthroughNote(session("Pri Mock Walkthrough"), paired)).toMatch(/Included/);
    expect(getWalkthroughNote(session("Pri Mock Exam"), paired)).toBeNull();
  });

  it("prefills through the slug's own form when no override URL is set", () => {
    const url = getRegistrationUrl(session("Pri Mock Exam"), paired);
    expect(url).toContain("entry.414070380=");
    expect(url).not.toContain("jotform");
  });

  it("still honours an override URL, as June's Jotform did", () => {
    expect(getRegistrationUrl(session("Pri Mock Exam"), singleJotform)).toBe(
      "https://pci.jotform.com/form/123"
    );
  });

  it("leaves a slug without a paired variant unchanged", () => {
    expect(getVariantLabels(singleJotform)).toEqual(["Exam Simulation"]);
    expect(isMockWalkthrough(session("Pri Mock Walkthrough"), singleJotform)).toBe(false);
  });
});
