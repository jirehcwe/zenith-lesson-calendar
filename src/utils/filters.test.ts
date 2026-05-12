import { applyFilters } from "./filters";
import { Session } from "../types";

const makeSession = (overrides: Partial<Session> = {}): Session => ({
  subject: "Math",
  tutor: "Alice",
  centre: "City",
  classroom: "Room 1",
  topic: "Algebra",
  date: "24 May",
  startTime: "10:00",
  endTime: "12:00",
  level: "Secondary",
  prefill: "",
  prefillField: "",
  ...overrides,
});

const emptyFilters = { subject: [], topic: [], centre: [], tutor: [] };

describe("applyFilters", () => {
  it("returns all sessions when all filters are empty", () => {
    const sessions = [makeSession(), makeSession({ subject: "English" })];
    expect(applyFilters(sessions, emptyFilters)).toHaveLength(2);
  });

  it("filters by subject", () => {
    const sessions = [makeSession({ subject: "Math" }), makeSession({ subject: "English" })];
    const result = applyFilters(sessions, { ...emptyFilters, subject: ["Math"] });
    expect(result).toHaveLength(1);
    expect(result[0].subject).toBe("Math");
  });

  it("filters by topic using [subject] topic format", () => {
    const sessions = [
      makeSession({ subject: "Math", topic: "Algebra" }),
      makeSession({ subject: "Math", topic: "Calculus" }),
    ];
    const result = applyFilters(sessions, { ...emptyFilters, topic: ["[Math] Algebra"] });
    expect(result).toHaveLength(1);
    expect(result[0].topic).toBe("Algebra");
  });

  it("filters by multiple fields (intersection)", () => {
    const sessions = [
      makeSession({ subject: "Math", centre: "City" }),
      makeSession({ subject: "Math", centre: "Suburbs" }),
      makeSession({ subject: "English", centre: "City" }),
    ];
    const result = applyFilters(sessions, {
      ...emptyFilters,
      subject: ["Math"],
      centre: ["City"],
    });
    expect(result).toHaveLength(1);
    expect(result[0].subject).toBe("Math");
    expect(result[0].centre).toBe("City");
  });

  it("returns empty array when no sessions match", () => {
    const sessions = [makeSession({ subject: "Math" })];
    const result = applyFilters(sessions, { ...emptyFilters, subject: ["English"] });
    expect(result).toHaveLength(0);
  });
});
