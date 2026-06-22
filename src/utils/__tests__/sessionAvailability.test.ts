import {
  getSessionAvailability,
  getAvailabilityLabel,
  isRegisterable,
  getTrialRedirect,
} from "../sessionAvailability";
import type { Session } from "@/types";

const config = { year: 2026 } as const;

function makeSession(
  date: string,
  prefill: string = "[stub] prefill string"
): Pick<Session, "date" | "prefill"> {
  return { date, prefill };
}

// Reference clock for all "now"-based tests.
// 2026-06-11 is a Thursday. So:
//   2026-06-10 (Wed) = yesterday
//   2026-06-11 (Thu) = today
//   2026-06-12 (Fri) = tomorrow
//   2026-06-13 (Sat) = day after tomorrow
function nowAt(hour: number, minute: number = 0): Date {
  return new Date(2026, 5, 11, hour, minute, 0); // month 5 = June
}

describe("getSessionAvailability — ops policy edge cases", () => {
  describe("D-1 6pm cutoff for tomorrow's class", () => {
    it("5:59pm: tomorrow's class is still clickable", () => {
      const session = makeSession("12 Jun");
      expect(
        getSessionAvailability(session, config, nowAt(17, 59))
      ).toBe("open");
    });

    it("6:00pm exactly: tomorrow's class is blocked", () => {
      const session = makeSession("12 Jun");
      expect(
        getSessionAvailability(session, config, nowAt(18, 0))
      ).toBe("registration-closed");
    });

    it("11:59pm: tomorrow's class is still blocked", () => {
      const session = makeSession("12 Jun");
      expect(
        getSessionAvailability(session, config, nowAt(23, 59))
      ).toBe("registration-closed");
    });

    it("9am: tomorrow's class is open (well before cutoff)", () => {
      const session = makeSession("12 Jun");
      expect(
        getSessionAvailability(session, config, nowAt(9, 0))
      ).toBe("open");
    });
  });

  describe("two-days-out classes are unaffected by the D-1 cutoff", () => {
    it("6pm today: class two days from now is still clickable", () => {
      const session = makeSession("13 Jun");
      expect(
        getSessionAvailability(session, config, nowAt(18, 0))
      ).toBe("open");
    });

    it("11:59pm today: class two days from now is still clickable", () => {
      const session = makeSession("13 Jun");
      expect(
        getSessionAvailability(session, config, nowAt(23, 59))
      ).toBe("open");
    });

    it("a week from now: open regardless of time", () => {
      const session = makeSession("18 Jun");
      expect(
        getSessionAvailability(session, config, nowAt(18, 0))
      ).toBe("open");
    });
  });

  describe("past dates → Class Ended", () => {
    it("yesterday's class is ended", () => {
      const session = makeSession("10 Jun");
      expect(
        getSessionAvailability(session, config, nowAt(9, 0))
      ).toBe("ended");
    });

    it("today's class is ended (registration cutoff was yesterday)", () => {
      const session = makeSession("11 Jun");
      expect(
        getSessionAvailability(session, config, nowAt(9, 0))
      ).toBe("ended");
    });

    it("a week ago is ended", () => {
      const session = makeSession("04 Jun");
      expect(
        getSessionAvailability(session, config, nowAt(9, 0))
      ).toBe("ended");
    });
  });

  describe("precedence: ended > full > registration-closed > open", () => {
    it("past + empty prefill → ended (not full)", () => {
      const session = makeSession("10 Jun", "");
      expect(
        getSessionAvailability(session, config, nowAt(9, 0))
      ).toBe("ended");
    });

    it("tomorrow + empty prefill + after 6pm → full (not registration-closed)", () => {
      const session = makeSession("12 Jun", "");
      expect(
        getSessionAvailability(session, config, nowAt(18, 30))
      ).toBe("full");
    });

    it("tomorrow + empty prefill + before 6pm → full", () => {
      const session = makeSession("12 Jun", "");
      expect(
        getSessionAvailability(session, config, nowAt(10, 0))
      ).toBe("full");
    });

    it("two days out + empty prefill → full (not open)", () => {
      const session = makeSession("13 Jun", "");
      expect(
        getSessionAvailability(session, config, nowAt(10, 0))
      ).toBe("full");
    });
  });

  describe("fallback when date is unparseable", () => {
    it("garbage date + prefill → open", () => {
      const session = makeSession("not a date");
      expect(
        getSessionAvailability(session, config, nowAt(10, 0))
      ).toBe("open");
    });

    it("garbage date + empty prefill → full", () => {
      const session = makeSession("not a date", "");
      expect(
        getSessionAvailability(session, config, nowAt(10, 0))
      ).toBe("full");
    });
  });
});

describe("getAvailabilityLabel", () => {
  it.each([
    ["open", "Click to register"],
    ["ended", "Class Ended"],
    ["full", "Class Full"],
    ["registration-closed", "Registration Closed"],
  ] as const)("maps %s → %s", (state, label) => {
    expect(getAvailabilityLabel(state)).toBe(label);
  });
});

describe("isRegisterable", () => {
  it("only open is registerable", () => {
    expect(isRegisterable("open")).toBe(true);
    expect(isRegisterable("ended")).toBe(false);
    expect(isRegisterable("full")).toBe(false);
    expect(isRegisterable("registration-closed")).toBe(false);
  });
});

describe("getTrialRedirect", () => {
  const trialConfig = {
    dateRange: { start: "2026-06-01", end: "2026-06-30" },
    subjectLabels: { CHEM: "Chemistry", MATH: "Math" },
    trialRedirect: {
      baseUrl: "https://schedule.zenitheducationstudio.com/",
      stream: "JC",
      subjectOverrides: { Math: "Mathematics" },
    },
  };

  it("returns null on dateRange.end (cutoff is the day after)", () => {
    expect(
      getTrialRedirect({ subject: "CHEM" }, trialConfig, new Date(2026, 5, 30))
    ).toBeNull();
  });

  it("returns a subject+stream deep link the day after dateRange.end", () => {
    const r = getTrialRedirect(
      { subject: "CHEM" },
      trialConfig,
      new Date(2026, 6, 1)
    );
    expect(r?.href).toBe(
      "https://schedule.zenitheducationstudio.com/?subject=Chemistry&stream=JC"
    );
  });

  it("applies subjectOverrides (Math → Mathematics)", () => {
    const r = getTrialRedirect(
      { subject: "MATH" },
      trialConfig,
      new Date(2026, 6, 1)
    );
    expect(r?.href).toContain("subject=Mathematics");
    expect(r?.href).toContain("stream=JC");
  });

  it("returns null when the slug has no trialRedirect", () => {
    const noTrial = {
      dateRange: trialConfig.dateRange,
      subjectLabels: trialConfig.subjectLabels,
    };
    expect(
      getTrialRedirect({ subject: "CHEM" }, noTrial, new Date(2026, 6, 1))
    ).toBeNull();
  });
});
