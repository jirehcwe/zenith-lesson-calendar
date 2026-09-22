import { canBookTrial, canRegister, isSlotClosed } from "./slotStatus";
import type { WeeklyClassSlot } from "@/components/WeeklyClassCalendar";

const makeSlot = (overrides: Partial<WeeklyClassSlot> = {}): WeeklyClassSlot => ({
  title: "(EXP) Bishan | Mon 5PM - 7PM | Jael (S4 Pure Physics 2026)",
  day: 1,
  startTime: "17:00",
  endTime: "19:00",
  subjects: ["Pure Physics"],
  tutor: "Jael",
  centre: "Bishan",
  stream: "EXP",
  level: "S4",
  prefillTrialLink: "https://example.com/trial",
  prefillRegistrationLink: "https://example.com/register",
  ...overrides,
});

describe("canBookTrial / canRegister", () => {
  it("treats a slot without the flags as open, so older feeds and caches keep their buttons", () => {
    const slot = makeSlot();
    expect(canBookTrial(slot)).toBe(true);
    expect(canRegister(slot)).toBe(true);
  });

  it("follows each flag on its own", () => {
    const trialClosed = makeSlot({ trialOpen: false, registrationOpen: true });
    expect(canBookTrial(trialClosed)).toBe(false);
    expect(canRegister(trialClosed)).toBe(true);

    const registrationClosed = makeSlot({ trialOpen: true, registrationOpen: false });
    expect(canBookTrial(registrationClosed)).toBe(true);
    expect(canRegister(registrationClosed)).toBe(false);
  });

  it("closes both for a [FULL] class even when both forms are open", () => {
    const full = makeSlot({
      title: "[FULL] (EXP) Bishan | Mon 5PM - 7PM | Jael (S4 Pure Physics 2026)",
      trialOpen: true,
      registrationOpen: true,
    });
    expect(canBookTrial(full)).toBe(false);
    expect(canRegister(full)).toBe(false);
  });
});

describe("isSlotClosed", () => {
  it("is true only when both forms are closed", () => {
    expect(isSlotClosed(makeSlot({ trialOpen: false, registrationOpen: false }))).toBe(true);
    expect(isSlotClosed(makeSlot({ trialOpen: false, registrationOpen: true }))).toBe(false);
    expect(isSlotClosed(makeSlot({ trialOpen: true, registrationOpen: false }))).toBe(false);
  });

  it("is false when the flags are missing, so older feeds show classes as open", () => {
    expect(isSlotClosed(makeSlot())).toBe(false);
  });

  it("leaves a [FULL] class full, even when both forms are closed", () => {
    const full = makeSlot({
      title: "[FULL] (EXP) Bishan | Mon 5PM - 7PM | Jael (S4 Pure Physics 2026)",
      trialOpen: false,
      registrationOpen: false,
    });
    expect(isSlotClosed(full)).toBe(false);
  });
});
