import { render, screen } from "@testing-library/react";
import ListView from "./ListView";
import type { WeeklyClassSlot } from "./WeeklyClassCalendar";

jest.mock("./WeeklyClassCalendar", () => ({
  isSlotFull: (slot: { title: string }) => slot.title.startsWith("[FULL]"),
  getSubjectColor: () => "#9ca3af",
}));

jest.mock("@/utils/campaign", () => ({
  replaceCampaignInUrl: (url: string) => url,
  replacePromocodeInUrl: (url: string) => url,
}));

jest.mock("@/utils/prefillRegistration", () => ({
  getFallbackRegistrationLinkByLevel: () => "https://example.com/fallback",
}));

const makeSlot = (overrides: Partial<WeeklyClassSlot> = {}): WeeklyClassSlot => ({
  title: "Math class",
  day: 1,
  startTime: "10:00",
  endTime: "12:00",
  subjects: ["Math"],
  tutor: "Alice",
  centre: "Bishan",
  stream: "JC",
  level: "J2",
  prefillTrialLink: "https://example.com/trial",
  prefillRegistrationLink: "https://example.com/register",
  ...overrides,
});

describe("ListView", () => {
  it("shows empty state when no sessions are provided", () => {
    render(<ListView sessions={[]} />);
    expect(screen.getByText(/Select a stream to see classes/i)).toBeInTheDocument();
  });

  it("renders Open filters button in empty state when onEmptyStateClick is provided", async () => {
    const handleClick = jest.fn();
    render(<ListView sessions={[]} onEmptyStateClick={handleClick} />);
    const btn = screen.getByRole("button", { name: /Open filters/i });
    btn.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not render Open filters button in empty state when onEmptyStateClick is omitted", () => {
    render(<ListView sessions={[]} />);
    expect(screen.queryByRole("button", { name: /Open filters/i })).not.toBeInTheDocument();
  });

  it("renders a card for each session", () => {
    const sessions = [
      makeSlot({ subjects: ["Math"], day: 1 }),
      makeSlot({ subjects: ["English"], day: 2 }),
    ];
    render(<ListView sessions={sessions} />);
    expect(screen.getByText(/Math/)).toBeInTheDocument();
    expect(screen.getByText(/English/)).toBeInTheDocument();
  });

  it("groups sessions under day headings", () => {
    const sessions = [
      makeSlot({ day: 1 }),
      makeSlot({ subjects: ["English"], day: 3 }),
    ];
    render(<ListView sessions={sessions} />);
    expect(screen.getByText("Monday")).toBeInTheDocument();
    expect(screen.getByText("Wednesday")).toBeInTheDocument();
  });

  it("renders trial and register buttons for available slots", () => {
    render(<ListView sessions={[makeSlot()]} />);
    expect(screen.getByRole("link", { name: /Sign up for FREE Trial/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Register now/i })).toBeInTheDocument();
  });

  it("shows full message and hides action buttons for full slots", () => {
    render(<ListView sessions={[makeSlot({ title: "[FULL] Math class" })]} />);
    expect(screen.getByText(/Class Full/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Sign up for FREE Trial/i })).not.toBeInTheDocument();
  });

  it("renders centre information on each card", () => {
    render(<ListView sessions={[makeSlot({ centre: "Clementi" })]} />);
    expect(screen.getByText("Clementi")).toBeInTheDocument();
  });

  it("never renders the tutor name in the output", () => {
    render(<ListView sessions={[makeSlot({ tutor: "Alice" })]} />);
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });


  it("renders day header with a class count badge", () => {
    render(
      <ListView
        sessions={[
          makeSlot({ day: 1 }),
          makeSlot({ day: 1, subjects: ["English"] }),
        ]}
      />
    );
    expect(screen.getByText("2 classes")).toBeInTheDocument();
  });

  it("renders time in 12-hour format", () => {
    render(<ListView sessions={[makeSlot({ startTime: "14:00", endTime: "16:00" })]} />);
    expect(screen.getByText("2:00 PM – 4:00 PM")).toBeInTheDocument();
  });
});
