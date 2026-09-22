import { render, screen } from "@testing-library/react";
import SignupActions from "./SignupActions";
import type { WeeklyClassSlot } from "./WeeklyClassCalendar";

jest.mock("@/utils/campaign", () => ({
  replaceCampaignInUrl: (url: string) => url.replace("SCHEDULE", "IG"),
  replacePromocodeInUrl: (url: string) => url.replace("PROMOCODE", "ZEN10"),
}));

jest.mock("@/utils/prefillRegistration", () => ({
  getFallbackRegistrationLinkByLevel: (level: string) => `https://example.com/fallback/${level}`,
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
  prefillTrialLink: "https://example.com/trial?c=SCHEDULE",
  prefillRegistrationLink: "https://example.com/register?c=SCHEDULE&p=PROMOCODE",
  ...overrides,
});

const trialLink = () => screen.queryByRole("link", { name: /Sign up for FREE Trial/i });
const registerLink = () => screen.queryByRole("link", { name: /Register now/i });

describe.each(["popup", "card"] as const)("SignupActions (%s)", (variant) => {
  it("links both forms, with the campaign and promo code filled in", () => {
    render(<SignupActions slot={makeSlot()} variant={variant} />);
    expect(trialLink()).toHaveAttribute("href", "https://example.com/trial?c=IG");
    expect(registerLink()).toHaveAttribute("href", "https://example.com/register?c=IG&p=ZEN10");
  });

  it("greys out only the trial button when the trial form is closed", () => {
    render(<SignupActions slot={makeSlot({ trialOpen: false })} variant={variant} />);
    expect(trialLink()).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Trial closed/i })).toBeDisabled();
    expect(registerLink()).toBeInTheDocument();
  });

  it("greys out only the register button when the registration form is closed", () => {
    render(<SignupActions slot={makeSlot({ registrationOpen: false })} variant={variant} />);
    expect(registerLink()).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Registration closed/i })).toBeDisabled();
    expect(trialLink()).toBeInTheDocument();
  });

  it("shows one closed message instead of the buttons when both forms are closed", () => {
    render(
      <SignupActions
        slot={makeSlot({ trialOpen: false, registrationOpen: false })}
        variant={variant}
      />
    );
    expect(screen.getByRole("button", { name: /closed/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /closed/i })).toHaveTextContent(
      variant === "popup" ? "This class is currently closed" : "Class Closed"
    );
    expect(trialLink()).not.toBeInTheDocument();
    expect(registerLink()).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Trial closed/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Registration closed/i })).not.toBeInTheDocument();
  });

  it("shows only the full message for a [FULL] class, whatever the flags say", () => {
    render(
      <SignupActions
        slot={makeSlot({ title: "[FULL] Pure Physics", trialOpen: true, registrationOpen: true })}
        variant={variant}
      />
    );
    expect(screen.getByRole("button", { name: /full/i })).toBeDisabled();
    expect(trialLink()).not.toBeInTheDocument();
    expect(registerLink()).not.toBeInTheDocument();
  });

  it("leaves out the trial button when an open trial has no link", () => {
    render(<SignupActions slot={makeSlot({ prefillTrialLink: "" })} variant={variant} />);
    expect(trialLink()).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Trial closed/i })).not.toBeInTheDocument();
    expect(registerLink()).toBeInTheDocument();
  });

  it("falls back to the level's registration form when the slot has no registration link", () => {
    render(
      <SignupActions slot={makeSlot({ prefillRegistrationLink: undefined })} variant={variant} />
    );
    expect(registerLink()).toHaveAttribute("href", "https://example.com/fallback/S4");
  });
});
