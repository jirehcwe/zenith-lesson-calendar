/**
 * CalendarView tests.
 *
 * CalendarView.tsx calls getCrashCourseConfig() inside the component body
 * (not at module load), so tests can mutate a shared mockConfig between
 * renders to exercise both the tip-present and tip-null branches without
 * reloading the module.
 *
 * FullCalendar and its plugin packages are mocked at file level — we
 * don't need the real calendar to assert prop pass-through or dialog
 * behavior.
 */

import type { CrashCourseConfig } from "../../../crash-courses/types";

// FullCalendar mock — captures props so assertions can inspect them.
let capturedProps: Record<string, unknown> = {};
jest.mock("@fullcalendar/react", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    capturedProps = props;
    return <div data-testid="fullcalendar-stub" />;
  },
}));
jest.mock("@fullcalendar/timegrid", () => ({ __esModule: true, default: {} }));
jest.mock("@fullcalendar/daygrid", () => ({ __esModule: true, default: {} }));
jest.mock("@fullcalendar/scrollgrid", () => ({ __esModule: true, default: {} }));

// Mutable mock config — tests reassign fields on this object before
// render() and the component reads the current value at render time.
const baseMockConfig: CrashCourseConfig = {
  slug: "ss-june-2026",
  metadata: { title: "Mock SS", description: "mock" },
  dateRange: { start: "2026-05-01", end: "2026-05-31" },
  year: 2026,
  subjectColors: { Math: { backgroundColor: "#FED966", textColor: "#000" } },
  hero: {
    title: "mock title",
    tagline: "mock tagline",
    blurbHeadline: "mock headline",
    blurbBody: "mock body",
    stats: "mock stats",
    heroImageSrc: "/mock.webp",
    heroImageAlt: "mock",
  },
  bottomBanner: { body: "mock", ctaLabel: "mock", ctaHref: "https://mock" },
  calendar: {
    firstDay: 1,
    initialDate: "2026-05-01",
    slotMinTime: "09:00:00",
    slotMaxTime: "22:00:00",
    listViewMinDate: "2026-05-01",
    tip: { label: "Tip", body: "Click on a slot to register." },
  },
  registrationFormUrl:
    "https://docs.google.com/forms/d/e/FORMID/viewform?entry.1157532004=SCHEDULE",
  campaignField: "entry.1157532004",
  sessions: [],
};

let mockConfig: CrashCourseConfig = baseMockConfig;

jest.mock("../../../crash-courses", () => ({
  getCrashCourseConfig: () => mockConfig,
}));

import { render, screen, act } from "@testing-library/react";
import type { Session } from "../../types";
import CalendarView from "../CalendarView";

const makeEvent = (session: Session) => ({
  title: `${session.subject} - ${session.level}`,
  start: new Date("2026-05-06T11:15:00"),
  end: new Date("2026-05-06T13:15:00"),
  extendedProps: session,
  backgroundColor: "#FED966",
  textColor: "#000000",
});

const sessionWithPrefill: Session = {
  purpose: "SS SepCC",
  subject: "Math",
  tutor: "Matthew",
  centre: "Marine Parade",
  topic: "Algebra",
  date: "06 May",
  startTime: "11:15 AM",
  endTime: "1:15 PM",
  level: "S1",
  prefill: "[S1 Math] MP | 06 May (Wed)",
  prefillField: "1234",
  displaySubject: "Math",
};

const sessionNoSlots: Session = { ...sessionWithPrefill, prefill: "" };

beforeEach(() => {
  mockConfig = baseMockConfig;
  capturedProps = {};
  window.history.pushState({}, "", "/");
});

describe("CalendarView — tip banner", () => {
  it("renders the tip banner with the configured label and body when tip is set", () => {
    render(<CalendarView events={[]} />);
    expect(screen.getByText(/Tip:/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Click on a slot to register/i)
    ).toBeInTheDocument();
  });

  it("does NOT render the tip banner when tip is null", () => {
    mockConfig = {
      ...baseMockConfig,
      calendar: { ...baseMockConfig.calendar, tip: null },
    };
    render(<CalendarView events={[]} />);
    expect(screen.queryByText(/Tip:/i)).toBeNull();
  });
});

describe("CalendarView — FullCalendar prop wiring", () => {
  it("renders the FullCalendar stub", () => {
    render(<CalendarView events={[]} />);
    expect(screen.getByTestId("fullcalendar-stub")).toBeInTheDocument();
  });

  it("passes validRange matching config.dateRange", () => {
    render(<CalendarView events={[]} />);
    const validRange = capturedProps.validRange as { start: Date; end: Date };
    expect(validRange.start.getTime()).toBe(new Date("2026-05-01").getTime());
    expect(validRange.end.getTime()).toBe(new Date("2026-05-31").getTime());
  });

  it("passes slotMinTime, slotMaxTime, firstDay matching config.calendar", () => {
    render(<CalendarView events={[]} />);
    expect(capturedProps.slotMinTime).toBe("09:00:00");
    expect(capturedProps.slotMaxTime).toBe("22:00:00");
    expect(capturedProps.firstDay).toBe(1);
  });
});

describe("CalendarView — eventClick dialog", () => {
  it("dialog is initially closed", () => {
    render(<CalendarView events={[]} />);
    expect(screen.queryByRole("link", { name: /register/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /class full/i })).toBeNull();
  });

  it("clicking an event with prefill opens a Register link carrying the campaign + prefill fields", async () => {
    render(<CalendarView events={[makeEvent(sessionWithPrefill)]} />);

    const eventClickFn = capturedProps.eventClick as (arg: {
      event: ReturnType<typeof makeEvent>;
    }) => void;

    await act(async () => {
      eventClickFn({ event: makeEvent(sessionWithPrefill) });
    });

    const registerLink = screen.getByRole("link", { name: /register/i });
    const href = registerLink.getAttribute("href") ?? "";
    expect(href).toContain("entry.1157532004");
    expect(href).toContain(`entry.${sessionWithPrefill.prefillField}=`);
  });

  it("clicking an event with empty prefill opens a disabled Class Full button", async () => {
    render(<CalendarView events={[makeEvent(sessionNoSlots)]} />);

    const eventClickFn = capturedProps.eventClick as (arg: {
      event: ReturnType<typeof makeEvent>;
    }) => void;

    await act(async () => {
      eventClickFn({ event: makeEvent(sessionNoSlots) });
    });

    const classFull = screen.getByRole("button", { name: /class full/i });
    expect(classFull).toBeDisabled();
    expect(screen.queryByRole("link", { name: /register/i })).toBeNull();
  });
});
