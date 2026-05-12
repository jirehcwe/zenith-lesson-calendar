import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CalendarView from "./CalendarView";

jest.mock("@vercel/analytics", () => ({ track: jest.fn() }));

const mockEvents = [
  {
    title: "Math",
    start: new Date("2025-05-24T10:00:00"),
    end: new Date("2025-05-24T12:00:00"),
    extendedProps: {
      subject: "Math",
      topic: "Algebra",
      centre: "City",
      date: "24 May",
      startTime: "10:00",
      endTime: "12:00",
      level: "Secondary",
      prefill: "Math+Algebra",
      prefillField: "1234567890",
      tutor: "Alice",
      classroom: "Room 1",
    },
    backgroundColor: "#3b82f6",
    textColor: "#ffffff",
  },
];

describe("CalendarView", () => {
  it("does not show a dialog on initial render", () => {
    render(<CalendarView events={[]} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens dialog with session details when an event is clicked", async () => {
    const user = userEvent.setup();
    render(<CalendarView events={mockEvents} />);
    await user.click(screen.getByText("Math"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Math - Algebra - Secondary/)).toBeInTheDocument();
    expect(screen.getByText("City")).toBeInTheDocument();
  });

  it("closes the dialog when the close button is clicked", async () => {
    const user = userEvent.setup();
    render(<CalendarView events={mockEvents} />);
    await user.click(screen.getByText("Math"));
    await user.click(screen.getByLabelText("Close"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows a registration link when prefill is set on the selected event", async () => {
    const user = userEvent.setup();
    render(<CalendarView events={mockEvents} />);
    await user.click(screen.getByText("Math"));
    expect(
      screen.getByRole("link", { name: /Register \(prefilled\)/i })
    ).toBeInTheDocument();
  });

  it("does not show a registration link when prefill is empty", async () => {
    const user = userEvent.setup();
    const eventsNoPrefill = [
      {
        ...mockEvents[0],
        extendedProps: { ...mockEvents[0].extendedProps, prefill: "" },
      },
    ];
    render(<CalendarView events={eventsNoPrefill} />);
    await user.click(screen.getByText("Math"));
    expect(
      screen.queryByRole("link", { name: /Register \(prefilled\)/i })
    ).not.toBeInTheDocument();
  });
});
