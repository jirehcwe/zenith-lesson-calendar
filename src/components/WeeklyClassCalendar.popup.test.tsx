import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WeeklyClassCalendar, { type WeeklyClassSlot } from "./WeeklyClassCalendar";
import { FULL_SWATCH } from "@/utils/subjectColors";

// Stand-in for FullCalendar: one block per event, drawn with the component's
// own eventContent and colour, that calls eventClick the way FullCalendar
// does. The test reaches the real grid label and the real class popup.
jest.mock("@fullcalendar/react", () => {
  const React = jest.requireActual("react");
  type MockEvent = {
    title: string;
    extendedProps: unknown;
    backgroundColor?: string;
    classNames?: string[];
  };
  return {
    __esModule: true,
    default: ({
      events,
      eventClick,
      eventContent,
    }: {
      events: MockEvent[];
      eventClick: (arg: { event: { extendedProps: unknown } }) => void;
      eventContent: (arg: { event: { title: string; extendedProps: unknown } }) => unknown;
    }) =>
      React.createElement(
        "div",
        null,
        events.map((event, i) =>
          React.createElement(
            "div",
            {
              key: i,
              "data-testid": "calendar-event",
              "data-background": event.backgroundColor,
              className: (event.classNames ?? []).join(" "),
              onClick: () => eventClick({ event: { extendedProps: event.extendedProps } }),
            },
            eventContent({ event: { title: event.title, extendedProps: event.extendedProps } })
          )
        )
      ),
  };
});
jest.mock("@fullcalendar/timegrid", () => ({}));
jest.mock("@fullcalendar/scrollgrid", () => ({}));
jest.mock("@/utils/campaign", () => ({
  replaceCampaignInUrl: (url: string) => url,
  replacePromocodeInUrl: (url: string) => url,
}));
jest.mock("@/utils/prefillRegistration", () => ({
  getFallbackRegistrationLinkByLevel: () => "https://example.com/fallback",
}));

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

async function openPopup(slot: WeeklyClassSlot) {
  render(<WeeklyClassCalendar slots={[slot]} />);
  await userEvent.click(screen.getByTestId("calendar-event"));
  return within(await screen.findByRole("dialog"));
}

describe("WeeklyClassCalendar class popup", () => {
  it("links both forms for an open class", async () => {
    const popup = await openPopup(makeSlot());
    expect(popup.getByRole("link", { name: /Sign up for FREE Trial/i })).toHaveAttribute(
      "href",
      "https://example.com/trial"
    );
    expect(popup.getByRole("link", { name: /Register now/i })).toHaveAttribute(
      "href",
      "https://example.com/register"
    );
  });

  it("greys out the trial button when the trial form is closed", async () => {
    const popup = await openPopup(makeSlot({ trialOpen: false }));
    expect(popup.queryByRole("link", { name: /Sign up for FREE Trial/i })).not.toBeInTheDocument();
    expect(popup.getByRole("button", { name: /Trial closed/i })).toBeDisabled();
    expect(popup.getByRole("link", { name: /Register now/i })).toBeInTheDocument();
  });

  it("greys out the register button when the registration form is closed", async () => {
    const popup = await openPopup(makeSlot({ registrationOpen: false }));
    expect(popup.queryByRole("link", { name: /Register now/i })).not.toBeInTheDocument();
    expect(popup.getByRole("button", { name: /Registration closed/i })).toBeDisabled();
    expect(popup.getByRole("link", { name: /Sign up for FREE Trial/i })).toBeInTheDocument();
  });

  it("shows only the full message for a [FULL] class", async () => {
    const popup = await openPopup(makeSlot({ title: "[FULL] Pure Physics" }));
    expect(popup.getByRole("button", { name: /currently full/i })).toBeDisabled();
    expect(popup.queryByRole("link", { name: /Sign up for FREE Trial/i })).not.toBeInTheDocument();
    expect(popup.queryByRole("link", { name: /Register now/i })).not.toBeInTheDocument();
  });
});

describe("WeeklyClassCalendar grid block", () => {
  const block = () => screen.getByTestId("calendar-event");

  it("greys out a class whose trial and registration forms are both closed", () => {
    render(<WeeklyClassCalendar slots={[makeSlot({ trialOpen: false, registrationOpen: false })]} />);
    expect(block()).toHaveAttribute("data-background", FULL_SWATCH.tint);
    expect(block()).toHaveTextContent("Class is closed");
    expect(block()).not.toHaveTextContent("Class is full");
  });

  it("opens no popup for a closed class", async () => {
    render(<WeeklyClassCalendar slots={[makeSlot({ trialOpen: false, registrationOpen: false })]} />);
    await userEvent.click(block());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps a class with only one form closed in its subject colour, and clickable", async () => {
    render(<WeeklyClassCalendar slots={[makeSlot({ trialOpen: false })]} />);
    expect(block()).not.toHaveAttribute("data-background", FULL_SWATCH.tint);
    expect(block()).not.toHaveTextContent("Class is closed");
    await userEvent.click(block());
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("still labels a [FULL] class full, and it still opens its popup", async () => {
    render(
      <WeeklyClassCalendar
        slots={[makeSlot({ title: "[FULL] Pure Physics", trialOpen: false, registrationOpen: false })]}
      />
    );
    expect(block()).toHaveAttribute("data-background", FULL_SWATCH.tint);
    expect(block()).toHaveTextContent("Class is full");
    expect(block()).not.toHaveTextContent("Class is closed");
    await userEvent.click(block());
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
