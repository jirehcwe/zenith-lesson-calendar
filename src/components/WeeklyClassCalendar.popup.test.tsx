import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WeeklyClassCalendar, { type WeeklyClassSlot } from "./WeeklyClassCalendar";

// Stand-in for FullCalendar: one button per event that calls eventClick the
// way FullCalendar does, so the test reaches the real class popup.
jest.mock("@fullcalendar/react", () => {
  const React = jest.requireActual("react");
  return {
    __esModule: true,
    default: ({
      events,
      eventClick,
    }: {
      events: { title: string; extendedProps: unknown }[];
      eventClick: (arg: { event: { extendedProps: unknown } }) => void;
    }) =>
      React.createElement(
        "div",
        null,
        events.map((event, i) =>
          React.createElement(
            "button",
            {
              key: i,
              "data-testid": "calendar-event",
              onClick: () => eventClick({ event: { extendedProps: event.extendedProps } }),
            },
            event.title
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
