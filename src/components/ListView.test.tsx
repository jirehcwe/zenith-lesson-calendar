import { render, screen } from "@testing-library/react";
import ListView from "./ListView";
import { Session } from "../types";

jest.mock("react-datepicker", () => {
  const MockDatePicker = ({ placeholderText }: { placeholderText?: string }) => (
    <input data-testid="date-picker" placeholder={placeholderText} readOnly />
  );
  MockDatePicker.displayName = "MockDatePicker";
  return MockDatePicker;
});

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

describe("ListView", () => {
  it("renders a card for each session", () => {
    const sessions = [
      makeSession({ subject: "Math" }),
      makeSession({ subject: "English", date: "25 May" }),
    ];
    render(
      <ListView sessions={sessions} calendarFilter={null} onCalendarFilterChange={jest.fn()} />
    );
    expect(screen.getByText("Math")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("shows all sessions when calendarFilter is null", () => {
    const sessions = [
      makeSession({ date: "24 May" }),
      makeSession({ subject: "English", date: "25 May" }),
    ];
    render(
      <ListView sessions={sessions} calendarFilter={null} onCalendarFilterChange={jest.fn()} />
    );
    expect(screen.getByText("Math")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("shows only sessions matching calendarFilter", () => {
    const sessions = [
      makeSession({ subject: "Math", date: "24 May" }),
      makeSession({ subject: "English", date: "25 May" }),
    ];
    render(
      <ListView sessions={sessions} calendarFilter="2025-05-24" onCalendarFilterChange={jest.fn()} />
    );
    expect(screen.getByText("Math")).toBeInTheDocument();
    expect(screen.queryByText("English")).not.toBeInTheDocument();
  });

  it("renders no cards when no sessions match calendarFilter", () => {
    const sessions = [makeSession({ date: "24 May" })];
    render(
      <ListView sessions={sessions} calendarFilter="2025-06-01" onCalendarFilterChange={jest.fn()} />
    );
    expect(screen.queryByText("Math")).not.toBeInTheDocument();
  });

  it("renders the date picker", () => {
    render(
      <ListView sessions={[]} calendarFilter={null} onCalendarFilterChange={jest.fn()} />
    );
    expect(screen.getByTestId("date-picker")).toBeInTheDocument();
  });
});
