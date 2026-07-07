import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import Page from "./page";

// FullCalendar renders nothing in jsdom; assert via the List view instead.
jest.mock("@fullcalendar/react", () => ({ __esModule: true, default: () => null }));
jest.mock("@fullcalendar/timegrid", () => ({}));
jest.mock("@fullcalendar/scrollgrid", () => ({}));
// next/image needs a plain <img/> in jsdom (used by SignupBanner).
jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, jsx-a11y/alt-text
  default: (props: any) => <img {...props} />,
}));
// swiper ships ESM (.mjs) that jest does not transpile; page.tsx pulls it in via
// TestimonialCarousel, which only renders for campaign=SCHEDULE1 (never in these
// tests), so a stub is enough to satisfy the import graph.
jest.mock("swiper/react", () => ({
  __esModule: true,
  Swiper: () => null,
  SwiperSlide: () => null,
}));
jest.mock("swiper/modules", () => ({
  __esModule: true,
  Pagination: {},
  Navigation: {},
  Autoplay: {},
}));
jest.mock("swiper/css", () => ({}), { virtual: true });
jest.mock("swiper/css/pagination", () => ({}), { virtual: true });
jest.mock("swiper/css/navigation", () => ({}), { virtual: true });

const SLOTS = [
  {
    classSlotId: "2026-Class0001",
    title: "JC Physics A",
    day: 6, startTime: "16:00", endTime: "18:00",
    subjects: ["Physics"], tutor: "T1", centre: "Tampines", stream: "H2", level: "J2",
    prefillTrialLink: "https://forms/trial?campaign=SCHEDULE",
    prefillRegistrationLink: "https://forms/reg?campaign=SCHEDULE&promocode=PROMOCODE",
  },
  {
    classSlotId: "2026-Class0002",
    title: "JC Econ B",
    day: 4, startTime: "17:00", endTime: "19:00",
    subjects: ["Economics"], tutor: "T2", centre: "Jurong East", stream: "H2", level: "J1",
    prefillTrialLink: "https://forms/trial2?campaign=SCHEDULE",
    prefillRegistrationLink: "https://forms/reg2?campaign=SCHEDULE&promocode=PROMOCODE",
  },
  {
    classSlotId: "2026-Class0003",
    title: "Sec Math C",
    day: 1, startTime: "10:00", endTime: "12:00",
    subjects: ["Mathematics"], tutor: "T3", centre: "Bishan", stream: "EXP", level: "Secondary 3",
    prefillTrialLink: "https://forms/trial3?campaign=SCHEDULE",
    prefillRegistrationLink: "https://forms/reg3?campaign=SCHEDULE&promocode=PROMOCODE",
  },
];

function setUrl(search: string) {
  window.history.replaceState({}, "", search);
}

// page.tsx builds the schedule URL from this env var (validated at build time by
// next.config.ts). jest does not load .env, so provide it for the fetch effect.
process.env.NEXT_PUBLIC_SCHEDULE_API_BASE_URL =
  process.env.NEXT_PUBLIC_SCHEDULE_API_BASE_URL ||
  "https://api.schedule.myzenithstudy.com";

beforeEach(() => {
  localStorage.clear();
  setUrl("/");
  global.fetch = jest.fn(() =>
    Promise.resolve({ json: () => Promise.resolve({ data: SLOTS }) }),
  ) as unknown as typeof fetch;
});

describe("pinned mode (?classes=)", () => {
  // NOTE: ListView renders `session.subjects.join(" + ")` as the visible label
  // (NOT `session.title`), so assertions target the subject text.
  //
  // page.tsx renders BOTH the calendar and the list view at all times, toggling
  // visibility with a `hidden` CSS class (not the hidden attribute), so jsdom
  // still sees both in the DOM. The calendar's subject legend and its own
  // "Select a stream to see classes" empty-state therefore co-exist with the
  // list view's copies. We scope subject/empty-state assertions to the visible
  // list region (the non-`hidden` `.modern-card` wrapper) so we measure what the
  // user actually sees, not the offscreen calendar chrome.
  const listRegion = (container: HTMLElement) => {
    const card = Array.from(
      container.querySelectorAll<HTMLElement>("div.modern-card"),
    ).find((el) => !el.className.includes("hidden") && el.className.includes("p-3"));
    if (!card) throw new Error("visible list region not found");
    return within(card);
  };

  it("shows exactly the pinned classes, hiding the rest (AC 1)", async () => {
    setUrl("/?classes=2026-Class0001,2026-Class0002&view=list");
    const { container } = render(<Page />);
    // The calendar legend also renders a "Physics" swatch, so scope the wait to
    // the visible list region rather than an ambiguous unscoped findByText.
    await waitFor(() =>
      expect(listRegion(container).getByText("Physics")).toBeInTheDocument(),
    );
    const list = listRegion(container);
    expect(list.getByText("Physics")).toBeInTheDocument();
    expect(list.getByText("Economics")).toBeInTheDocument();
    expect(list.queryByText("Mathematics")).not.toBeInTheDocument();
  });

  it("ignores extra filter params; still shows only the pinned set (AC 2)", async () => {
    // stream=JC would normally surface BOTH JC classes (Physics + Econ); pinned wins.
    setUrl("/?classes=2026-Class0001&stream=JC&view=list");
    const { container } = render(<Page />);
    // stream=JC also renders a calendar "Physics" legend item, so wait on the
    // list region's own copy rather than an unscoped (ambiguous) findByText.
    await waitFor(() =>
      expect(listRegion(container).getByText("Physics")).toBeInTheDocument(),
    );
    const list = listRegion(container);
    expect(list.queryByText("Economics")).not.toBeInTheDocument();
    expect(list.queryByText("Mathematics")).not.toBeInTheDocument();
  });

  it("matches classSlotId case-insensitively (AC 8)", async () => {
    setUrl("/?classes=2026-class0001&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(listRegion(container).getByText("Physics")).toBeInTheDocument(),
    );
  });

  it("shows the exit banner with the displayed count (AC 9)", async () => {
    setUrl("/?classes=2026-Class0001,2026-Class0002&view=list");
    render(<Page />);
    expect(await screen.findByText(/2 selected classes/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /show all classes/i })).toBeInTheDocument();
  });

  it("preserves campaign & promocode params in the rendered links (AC 4, 5)", async () => {
    setUrl("/?classes=2026-Class0001&campaign=PROMO1&promocode=XYZ&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(listRegion(container).getByText("Physics")).toBeInTheDocument(),
    );
    // campaign SCHEDULE -> PROMO1, promocode placeholder -> XYZ
    expect(container.querySelector('a[href*="campaign=PROMO1"]')).not.toBeNull();
    expect(container.querySelector('a[href*="promocode=XYZ"]')).not.toBeNull();
  });

  it("falls back to the normal empty-state when no code matches (AC 6)", async () => {
    setUrl("/?classes=NOPE&view=list");
    const { container } = render(<Page />);
    // No banner means no pinned mode; scope the empty-state to the visible list.
    await waitFor(() =>
      expect(
        listRegion(container).getByText(/select a stream to see classes/i),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText(/selected class/i)).not.toBeInTheDocument();
  });

  it("exits to the normal empty-state and strips classes, keeping campaign (AC 10, 11)", async () => {
    setUrl("/?classes=2026-Class0001&campaign=PROMO1&view=list");
    const { container } = render(<Page />);
    fireEvent.click(await screen.findByRole("button", { name: /show all classes/i }));
    await waitFor(() =>
      expect(
        listRegion(container).getByText(/select a stream to see classes/i),
      ).toBeInTheDocument(),
    );
    expect(listRegion(container).queryByText("Physics")).not.toBeInTheDocument();
    expect(window.location.search).not.toContain("classes");
    expect(window.location.search).toContain("campaign=PROMO1");
  });
});
