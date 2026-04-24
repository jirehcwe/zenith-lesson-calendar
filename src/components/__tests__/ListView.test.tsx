/**
 * ListView tests.
 *
 * getCrashCourseConfig() is called at module-top-level in ListView.tsx.
 * Rather than using isolateModules (which causes a duplicate React instance
 * problem when react-datepicker is involved), we mock the crash-courses module
 * at the file level with jest.mock, returning a known SS config shape.
 */

// Mock must be before any imports that transitively load the component.
jest.mock("../../../crash-courses", () => ({
  getCrashCourseConfig: () => ({
    slug: "ss-june-2026",
    year: 2026,
    dateRange: { start: "2026-05-01", end: "2026-05-31" },
    calendar: { listViewMinDate: "2026-05-01" },
    registrationFormUrl:
      "https://docs.google.com/forms/d/e/1FAIpQLSdc1DdBljxZx1mXH6Ztpxr_zbnI9XJunAKHDeN_GVR1jBuI9Q/viewform?entry.1157532004=SCHEDULE",
    campaignField: "entry.1157532004",
  }),
}));

import { render, screen } from "@testing-library/react";
import React from "react";
import type { Session } from "../../types";
import ListView from "../ListView";

// Sample sessions.
// date "06 Sep" with config.year 2026 normalizes to "2026-09-06".
const sampleSessions: Session[] = [
  {
    subject: "Math",
    tutor: "Matthew",
    centre: "Marine Parade",
    topic: "Algebra",
    date: "06 Sep",
    startTime: "11:15 AM",
    endTime: "1:15 PM",
    level: "S1",
    prefill: "[S1 Math] MP | 06 Sep (Sat)",
    prefillField: "1234",
    displaySubject: "Math",
  },
  {
    subject: "Math",
    tutor: "Matthew",
    centre: "Marine Parade",
    topic: "Algebra",
    date: "09 Sep",
    startTime: "7:15 PM",
    endTime: "9:15 PM",
    level: "S1",
    prefill: "",
    prefillField: "1234",
    displaySubject: "Math",
  },
];

describe("ListView", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders a card per session passed in", () => {
    render(
      <ListView
        sessions={sampleSessions}
        calendarFilter={null}
        onCalendarFilterChange={() => {}}
      />
    );
    expect(screen.getByText("Date: 06 Sep")).toBeInTheDocument();
    expect(screen.getByText("Date: 09 Sep")).toBeInTheDocument();
  });

  it("session with non-empty prefill renders a Register link, not opacity-60", () => {
    const { container } = render(
      <ListView
        sessions={[sampleSessions[0]]}
        calendarFilter={null}
        onCalendarFilterChange={() => {}}
      />
    );

    const link = screen.getByRole("link");
    const href = link.getAttribute("href") ?? "";
    // href should contain the campaignField key
    expect(href).toContain("entry.1157532004");
    // href should contain entry.<prefillField>=<encoded prefill>
    expect(href).toContain(
      `entry.${sampleSessions[0].prefillField}=${encodeURIComponent(sampleSessions[0].prefill)}`
    );

    // The card wrapper should NOT have opacity-60
    const card = container.querySelector(".p-4.border.rounded.shadow");
    expect(card).not.toHaveClass("opacity-60");
  });

  it("session with empty prefill renders a disabled 'Class Full' button, and card has opacity-60", () => {
    const { container } = render(
      <ListView
        sessions={[sampleSessions[1]]}
        calendarFilter={null}
        onCalendarFilterChange={() => {}}
      />
    );

    const button = screen.getByRole("button", { name: /class full/i });
    expect(button).toBeDisabled();
    expect(screen.queryByRole("link")).toBeNull();

    const card = container.querySelector(".p-4.border.rounded.shadow");
    expect(card).toHaveClass("opacity-60");
  });

  it("calendarFilter matching a session's date shows only that session", () => {
    render(
      <ListView
        sessions={sampleSessions}
        calendarFilter="2026-09-06"
        onCalendarFilterChange={() => {}}
      />
    );
    expect(screen.getByText("Date: 06 Sep")).toBeInTheDocument();
    expect(screen.queryByText("Date: 09 Sep")).toBeNull();
  });

  it("Register URL substitutes campaign param from window.location.search", () => {
    window.history.pushState({}, "", "/?campaign=TEST");

    render(
      <ListView
        sessions={[sampleSessions[0]]}
        calendarFilter={null}
        onCalendarFilterChange={() => {}}
      />
    );

    const link = screen.getByRole("link");
    const href = link.getAttribute("href") ?? "";
    // SCHEDULE placeholder should be replaced with TEST
    expect(href).toContain("TEST");
    expect(href).not.toContain("SCHEDULE");
  });
});
