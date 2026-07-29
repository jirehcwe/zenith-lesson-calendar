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

// jsdom reports window.screen as 0x0, so page.tsx's phone check
// (min(screen.width, screen.height) < 640) is true by DEFAULT: every test runs
// as a phone unless it says otherwise, and the sticky desktop filter bar can
// never mount. Any assertion about desktop chrome — the filter bar, the pinned
// header's view toggle, the stream chips — has to set a desktop screen first or
// it passes vacuously. Module-scope so both describe blocks share one helper.
function setScreen(width: number, height: number) {
  Object.defineProperty(window.screen, "width", { value: width, configurable: true });
  Object.defineProperty(window.screen, "height", { value: height, configurable: true });
}
// Explicit phone dimensions rather than jsdom's 0x0, so tests that rely on the
// phone layout say so instead of leaning on an accident of the environment.
const PHONE = [390, 844] as const;
const DESKTOP = [1280, 800] as const;

// page.tsx builds the schedule URL from this env var (validated at build time by
// next.config.ts). jest does not load .env, so provide it for the fetch effect.
process.env.NEXT_PUBLIC_SCHEDULE_API_BASE_URL =
  process.env.NEXT_PUBLIC_SCHEDULE_API_BASE_URL ||
  "https://api.schedule.myzenithstudy.com";

beforeEach(() => {
  localStorage.clear();
  setScreen(...PHONE);
  setUrl("/");
  global.fetch = jest.fn(() =>
    Promise.resolve({ json: () => Promise.resolve({ data: SLOTS }) }),
  ) as unknown as typeof fetch;
});

// The storage-failure tests spy on Storage.prototype/console; a leaked spy would
// silently break every later test in the file.
afterEach(() => jest.restoreAllMocks());

// "Block all cookies and site data" (Safari's setting, and Chrome inside a
// storage-partitioned third-party context) does not merely fail writes: it
// throws SecurityError on the `window.localStorage` PROPERTY ACCESS, before any
// method is called. That is the harshest storage environment a public page has
// to survive and the one the page.tsx guards claim to cover, so the probe
// emulates it exactly rather than stubbing individual methods.
function blockSiteData(): () => void {
  const original = Object.getOwnPropertyDescriptor(window, "localStorage")!;
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    get() {
      throw new DOMException("The operation is insecure.", "SecurityError");
    },
  });
  return () => Object.defineProperty(window, "localStorage", original);
}

describe("pinned mode (?classes= and ?tutor=)", () => {
  // AC LABELS: this block covers TWO specs, whose AC numbers collide.
  //   "(June AC n)"  → 2026-06-16-classes-url-param-design.md, the ?classes= spec
  //   "(AC n)"       → 2026-07-28-tutor-link-and-allsec-design.md, Feature 1
  // They are not interchangeable — e.g. June AC 6 said an unmatched link falls
  // back to the normal site, and Feature 1 AC 6 is the deliberate REVERSAL of
  // exactly that. Anything Feature 1 specifies in prose rather than a numbered
  // criterion is named for the section instead of given a number.
  //
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

  it("shows exactly the pinned classes, hiding the rest (June AC 1)", async () => {
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

  it("ignores extra filter params; still shows only the pinned set (June AC 2)", async () => {
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

  it("matches classSlotId case-insensitively (June AC 8)", async () => {
    setUrl("/?classes=2026-class0001&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(listRegion(container).getByText("Physics")).toBeInTheDocument(),
    );
  });

  it("shows the exit banner with the displayed count (June AC 9)", async () => {
    setUrl("/?classes=2026-Class0001,2026-Class0002&view=list");
    render(<Page />);
    expect(await screen.findByText(/2 selected classes/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /show all classes/i })).toBeInTheDocument();
  });

  it("preserves campaign & promocode params in the rendered links (June AC 4, 5)", async () => {
    setUrl("/?classes=2026-Class0001&campaign=PROMO1&promocode=XYZ&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(listRegion(container).getByText("Physics")).toBeInTheDocument(),
    );
    // campaign SCHEDULE -> PROMO1, promocode placeholder -> XYZ
    expect(container.querySelector('a[href*="campaign=PROMO1"]')).not.toBeNull();
    expect(container.querySelector('a[href*="promocode=XYZ"]')).not.toBeNull();
  });

  it("exits to the normal empty-state and strips classes, keeping campaign (June AC 10, 11)", async () => {
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

  // The two dead-link assertions below are deliberately UNSCOPED. page.tsx keeps
  // both views mounted at all times (it toggles a `hidden` class, not the hidden
  // attribute), so one unscoped query covers the calendar's copy of the prompt
  // as well as the list's. Scoping these to listRegion — and forcing view=list to
  // make that region exist — left the calendar's suppression
  // (hasActiveFilters || isPinned) completely untested, on the view that is the
  // production default.
  it("reports a dead classes link instead of the homepage (AC 6)", async () => {
    setUrl("/?classes=NOPE");
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByText(/couldn't find any classes for this link/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText(/select a stream/i)).not.toBeInTheDocument();
  });

  it("shows exactly one tutor's classes (AC 1)", async () => {
    setUrl("/?tutor=T1&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(listRegion(container).getByText("Physics")).toBeInTheDocument(),
    );
    expect(listRegion(container).queryByText("Economics")).not.toBeInTheDocument();
  });

  it("matches tutor codes case-insensitively (AC 2)", async () => {
    setUrl("/?tutor=t1&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(listRegion(container).getByText("Physics")).toBeInTheDocument(),
    );
  });

  it("shows the union for several tutors (AC 4)", async () => {
    setUrl("/?tutor=T1,T2&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(listRegion(container).getByText("Physics")).toBeInTheDocument(),
    );
    expect(listRegion(container).getByText("Economics")).toBeInTheDocument();
  });

  it("names the tutor in the banner (Feature 1 banner copy)", async () => {
    setUrl("/?tutor=T1");
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByText("You're viewing T1's classes")).toBeInTheDocument(),
    );
  });

  it("reports a dead tutor link instead of the homepage (AC 5)", async () => {
    setUrl("/?tutor=NoSuchTutor");
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByText(/couldn't find any classes for this link/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText(/select a stream/i)).not.toBeInTheDocument();
  });

  it("ignores stale filter params alongside a tutor pin (AC 10)", async () => {
    setUrl("/?tutor=T1&stream=JC&level=S3&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(listRegion(container).getByText("Physics")).toBeInTheDocument(),
    );
    expect(listRegion(container).queryByText("Mathematics")).not.toBeInTheDocument();
  });

  it("lets classes win when both pin params are present (AC 8)", async () => {
    setUrl("/?classes=2026-Class0002&tutor=T1&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(listRegion(container).getByText("Economics")).toBeInTheDocument(),
    );
    expect(listRegion(container).queryByText("Physics")).not.toBeInTheDocument();
  });

  it("does not blame the link when the schedule fails to load", async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error("network"))) as unknown as typeof fetch;
    setUrl("/?tutor=T1");
    render(<Page />);
    await waitFor(() =>
      expect(
        screen.getByText("We couldn't load the schedule. Please try again."),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText(/couldn't find any classes for this link/i)).not.toBeInTheDocument();
    // The failure copy is reserved for actual failures: it must NOT be reachable
    // by the empty-schedule path, or loadFailed is dead state again.
    expect(screen.queryByText(/isn't published yet/i)).not.toBeInTheDocument();
  });

  it("strips both pin params on exit (AC 12)", async () => {
    setUrl("/?tutor=T1&campaign=SCHEDULE1");
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /show all classes/i })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: /show all classes/i }));
    await waitFor(() => expect(window.location.search).not.toContain("tutor="));
    expect(window.location.search).not.toContain("classes=");
    expect(window.location.search).toContain("campaign=SCHEDULE1");
    // Exiting must tear the banner down, not just blank its message. describePin
    // returns "" for kind:"none" and its plain-string return type cannot stop a
    // caller rendering that — only the `isPinned &&` gate can.
    expect(screen.queryByRole("button", { name: /show all classes/i })).not.toBeInTheDocument();
  });

  it("shows no pinned banner at all on an unpinned homepage", async () => {
    // Baseline for the describePin kind:"none" contract: with no pin param there
    // must be no banner shell, no blank message and no stray escape hatch. This
    // is the only test that fails if the header's `isPinned &&` gate is dropped.
    setUrl("/");
    render(<Page />);
    await waitFor(() =>
      expect(screen.queryByText(/loading courses/i)).not.toBeInTheDocument(),
    );
    expect(screen.queryByRole("button", { name: /show all classes/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/you're viewing/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/couldn't find any classes for this link/i)).not.toBeInTheDocument();
  });

  it("does not blame the link — or the system — when the schedule loads but is empty", async () => {
    // A 200 carrying no classes is not a broken link AND not a failure. Real
    // trigger: the request pins year=<current>, so every link in circulation
    // hits this from 1 January until the new year's schedule is published.
    // "Please try again" would be a lie there, and retrying cannot help.
    global.fetch = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ data: [] }) }),
    ) as unknown as typeof fetch;
    setUrl("/?tutor=T1");
    render(<Page />);
    await waitFor(() =>
      expect(
        screen.getByText("The schedule isn't published yet. Please check back soon."),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText(/couldn't find any classes for this link/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/couldn't load the schedule/i)).not.toBeInTheDocument();
  });

  it("does not cache an empty schedule, so the user can retry into a fix", async () => {
    const fetchMock = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ data: [] }) }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    setUrl("/?tutor=T1");
    const first = render(<Page />);
    await waitFor(() =>
      expect(screen.getByText(/isn't published yet/i)).toBeInTheDocument(),
    );
    expect(localStorage.getItem("weeklyClassData")).toBeNull();

    // A cache hit returns before fetching, so the real harm of caching empty is
    // that the retry never leaves the browser. Prove the second mount refetches.
    first.unmount();
    render(<Page />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("treats a cached EMPTY schedule as a miss and refetches", async () => {
    // The write path refuses to cache an empty payload, but that only helps
    // clients who have not already cached one. `[]` is truthy, so the read path
    // handed it back as a hit and the mount effect returned before fetching —
    // pinning anyone who cached under the old code to an empty schedule for the
    // rest of CACHE_DURATION, exactly when the backend has just recovered or the
    // new year's schedule has just been published. CACHE_VERSION must not be
    // bumped to flush them, so the read side is what has to reject it.
    const fetchMock = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ data: SLOTS }) }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    setUrl("/?tutor=T1&view=list");

    // Seed the version and timestamp entries through a real visit so they are
    // genuinely valid — and so the test does not restate CACHE_VERSION, which
    // must not be bumped.
    const first = render(<Page />);
    await waitFor(() =>
      expect(screen.getByText("You're viewing T1's classes")).toBeInTheDocument(),
    );
    first.unmount();
    localStorage.setItem("weeklyClassData", "[]");

    const { container } = render(<Page />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    // ...and the refetched schedule actually lands, rather than the page simply
    // asking twice and still rendering nothing.
    expect(await screen.findByText("You're viewing T1's classes")).toBeInTheDocument();
    expect(listRegion(container).getByText("Physics")).toBeInTheDocument();
  });

  it("does cache a non-empty schedule", async () => {
    // Guards the other side of the `normalised.length > 0` condition: the fix
    // must not disable caching outright.
    setUrl("/?tutor=T1");
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByText("You're viewing T1's classes")).toBeInTheDocument(),
    );
    expect(JSON.parse(localStorage.getItem("weeklyClassData") ?? "[]")).toHaveLength(SLOTS.length);
  });

  it("survives a failed cache write instead of claiming the load failed", async () => {
    // Quota exceeded / blocked site data. The write is the last thing the fetch
    // chain does, so an unguarded throw lands in the SHARED .catch and sets
    // loadFailed — printing "We couldn't load the schedule. Please try again."
    // directly above the tutor's correctly rendered classes.
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    // EVERY write throws, not just the schedule cache's. Scoping this to the
    // weeklyClassData* keys used to be forced rather than chosen: page.tsx had a
    // second, unguarded setItem in a passive effect (the write-only
    // filtersCollapsed persist), so a blanket throw killed the render before
    // this test could assert anything. That write is gone.
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
    });

    setUrl("/?tutor=T1&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(screen.getByText("You're viewing T1's classes")).toBeInTheDocument(),
    );
    expect(listRegion(container).getByText("Physics")).toBeInTheDocument();
    expect(screen.queryByText(/couldn't load the schedule/i)).not.toBeInTheDocument();
    expect(warn).toHaveBeenCalled();
  });

  it("treats a corrupt cache entry as a miss instead of hanging on the spinner", async () => {
    // getCachedData runs inside the mount effect, so an unguarded JSON.parse
    // throw escapes the effect: isLoading never clears, and the spinner replaces
    // the pinned banner — which is the only exit from pinned mode.
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMock = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ data: SLOTS }) }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    setUrl("/?tutor=T1");

    // Seed the cache through a real visit so the version and timestamp entries
    // are genuinely valid and only the payload is corrupt — and so the test does
    // not restate CACHE_VERSION, which must not be bumped.
    const first = render(<Page />);
    await waitFor(() =>
      expect(screen.getByText("You're viewing T1's classes")).toBeInTheDocument(),
    );
    first.unmount();
    localStorage.setItem("weeklyClassData", '[{"classSlotId":"2026-Class0001",');

    render(<Page />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("You're viewing T1's classes")).toBeInTheDocument();
    expect(screen.queryByText(/loading courses/i)).not.toBeInTheDocument();
    expect(warn).toHaveBeenCalled();
  });

  it("renders with site data blocked entirely", async () => {
    // The whole-page contract behind the two guards above: with EVERY
    // localStorage touch throwing, a public schedule page must still paint. It
    // is a public, unauthenticated site — a browser privacy setting must not be
    // able to serve a blank page to a parent following a tutor link.
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const restore = blockSiteData();
    try {
      setUrl("/?tutor=T1&view=list");
      const { container } = render(<Page />);
      await waitFor(() =>
        expect(screen.getByText("You're viewing T1's classes")).toBeInTheDocument(),
      );
      expect(listRegion(container).getByText("Physics")).toBeInTheDocument();
      expect(screen.queryByText(/couldn't load the schedule/i)).not.toBeInTheDocument();
      expect(warn).toHaveBeenCalled();
    } finally {
      restore();
    }
  });

  // Feature 1 AC 9. Every clause here was unfalsifiable until the screen size
  // became explicit: jsdom reports window.screen as 0x0, so isMobilePhone is
  // permanently true and the desktop filter bar can never mount — "it is absent
  // while pinned" passed for the wrong reason.
  describe("hides the filter UI while pinned (AC 9)", () => {
    it("does not render the desktop filter bar", async () => {
      setScreen(...DESKTOP);
      setUrl("/?tutor=T1");
      render(<Page />);
      await waitFor(() =>
        expect(screen.getByText("You're viewing T1's classes")).toBeInTheDocument(),
      );
      // "Stream" is the filter bar's own row label. The empty-state prompts say
      // "Select a stream to see classes", which is a different string.
      expect(screen.queryByText("Stream")).not.toBeInTheDocument();
    });

    it("still renders the desktop filter bar when nothing is pinned", async () => {
      // Control: without it the assertion above cannot tell "hidden by isPinned"
      // apart from "never mounts in jsdom at all".
      setScreen(...DESKTOP);
      setUrl("/");
      render(<Page />);
      await waitFor(() => expect(screen.getByText("Stream")).toBeInTheDocument());
    });

    it("drops the phone Filter tab but keeps Calendar and List", async () => {
      // Phone-sized deliberately: BottomNav only mounts on a phone, so the
      // showFilterButton={!isPinned} clause is unobservable on a desktop screen.
      setScreen(...PHONE);
      setUrl("/?tutor=T1");
      render(<Page />);
      await waitFor(() =>
        expect(screen.getByText("You're viewing T1's classes")).toBeInTheDocument(),
      );
      // Exact name: the empty-state CTA is "Open filters", a different control.
      expect(screen.queryByRole("button", { name: "Filter" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Calendar" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "List" })).toBeInTheDocument();
    });

    it("still renders the phone Filter tab when nothing is pinned", async () => {
      setScreen(...PHONE);
      setUrl("/");
      render(<Page />);
      await waitFor(() =>
        expect(screen.queryByText(/loading courses/i)).not.toBeInTheDocument(),
      );
      expect(screen.getByRole("button", { name: "Filter" })).toBeInTheDocument();
    });

    it("keeps the Calendar/List toggle in the pinned header on desktop", async () => {
      // Hiding the filters must not strip the one control a pinned visitor still
      // needs. On desktop this toggle is the ONLY Calendar/List control on the
      // page: the filter bar is suppressed and BottomNav is phone-only.
      setScreen(...DESKTOP);
      setUrl("/?tutor=T1");
      render(<Page />);
      await waitFor(() =>
        expect(screen.getByText("You're viewing T1's classes")).toBeInTheDocument(),
      );
      expect(screen.getByRole("button", { name: "Calendar" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "List" })).toBeInTheDocument();
    });
  });
});

describe("AllSec stream (?stream=AllSec)", () => {
  const SEC_SLOTS = [
    {
      classSlotId: "2026-Class1001",
      title: "Sec Express Math",
      day: 1, startTime: "10:00", endTime: "12:00",
      subjects: ["Mathematics"], tutor: "T1", centre: "Bishan",
      stream: "EXP", level: "Secondary 3",
      prefillTrialLink: "https://forms/t1", prefillRegistrationLink: "https://forms/r1",
    },
    {
      classSlotId: "2026-Class1002",
      title: "Sec IP Chemistry",
      day: 2, startTime: "10:00", endTime: "12:00",
      subjects: ["Chemistry"], tutor: "T2", centre: "Bishan",
      stream: "IP", level: "Secondary 3",
      prefillTrialLink: "https://forms/t2", prefillRegistrationLink: "https://forms/r2",
    },
    {
      classSlotId: "2026-Class1003",
      title: "JC Physics",
      day: 3, startTime: "10:00", endTime: "12:00",
      subjects: ["Physics"], tutor: "T3", centre: "Bishan",
      stream: "H2", level: "J1",
      prefillTrialLink: "https://forms/t3", prefillRegistrationLink: "https://forms/r3",
    },
    {
      classSlotId: "2026-Class1004",
      title: "Primary Science",
      day: 4, startTime: "10:00", endTime: "12:00",
      subjects: ["Science"], tutor: "T4", centre: "Bishan",
      stream: "", level: "Primary 5",
      prefillTrialLink: "https://forms/t4", prefillRegistrationLink: "https://forms/r4",
    },
    {
      // A second Secondary level, so the S1-S4 union is observable.
      classSlotId: "2026-Class1005",
      title: "Sec 1 English",
      day: 5, startTime: "10:00", endTime: "12:00",
      subjects: ["English"], tutor: "T5", centre: "Bishan",
      stream: "EXP", level: "Secondary 1",
      prefillTrialLink: "https://forms/t5", prefillRegistrationLink: "https://forms/r5",
    },
    {
      // A Secondary row with a BLANK stream — the case the level-based rule in
      // levelToFilterMapper exists for. Ops cannot produce one today, but the
      // whole point of matching on level is that such a row surfaces here
      // rather than vanishing from every Secondary view. Without this fixture
      // an `EXP || IP` "simplification" of the case passes the suite.
      classSlotId: "2026-Class1006",
      title: "Sec 2 Biology (no stream)",
      day: 6, startTime: "10:00", endTime: "12:00",
      subjects: ["Pure Biology"], tutor: "T6", centre: "Bishan",
      stream: "", level: "Secondary 2",
      prefillTrialLink: "https://forms/t6", prefillRegistrationLink: "https://forms/r6",
    },
  ];

  // The stream chips only render in the sticky desktop filter bar, which never
  // mounts at jsdom's default 0x0 screen (see setScreen at module scope).
  beforeEach(() => {
    setScreen(...DESKTOP);
    global.fetch = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ data: SEC_SLOTS }) }),
    ) as unknown as typeof fetch;
  });

  // Mirrors the helper the ?classes= describe block already uses: it returns a
  // `within(...)` queries object, so call it as `listRegion(container).getByText`
  // — do NOT wrap it in `within(...)` again.
  const listRegion = (container: HTMLElement) => {
    const card = Array.from(
      container.querySelectorAll<HTMLElement>("div.modern-card"),
    ).find((el) => !el.className.includes("hidden"));
    if (!card) throw new Error("visible list region not found");
    return within(card);
  };

  // The filter bar renders "Secondary (All)" in TWO places: the stream chip
  // (driven by streamOptions) and the summary row's removal pill (driven by
  // filters.stream alone). A bare getAllByText assertion is satisfied by the
  // pill, so it cannot see whether the chip — this feature's whole UI
  // deliverable — exists at all. Scope to the Stream row and query by role so
  // the test names the thing it means.
  const streamChip = (name: RegExp) => {
    const streamRow = screen.getByText("Stream").parentElement;
    if (!streamRow) throw new Error("stream row not found");
    return within(streamRow).queryByRole("button", { name });
  };
  const ALL_SEC_CHIP = /Secondary \(All\)/;

  // NOTE: every test that scopes to `listRegion` must request `&view=list`. In
  // the default calendar view the list wrapper's className is the bare string
  // "hidden" with no `modern-card` class, so the helper finds nothing.

  it("shows Express and IP together (AC 1)", async () => {
    setUrl("/?stream=AllSec&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(listRegion(container).getByText("Mathematics")).toBeInTheDocument(),
    );
    expect(listRegion(container).getByText("Chemistry")).toBeInTheDocument();
    // The blank-stream Secondary row surfaces too. This is what pins the
    // matching rule to `level.startsWith("S")`: an `EXP || IP` rewrite drops
    // this row and only this row.
    expect(listRegion(container).getByText("Pure Biology")).toBeInTheDocument();
  });

  it("excludes JC and Primary (AC 2)", async () => {
    setUrl("/?stream=AllSec&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(listRegion(container).getByText("Mathematics")).toBeInTheDocument(),
    );
    expect(listRegion(container).queryByText("Physics")).not.toBeInTheDocument();
    expect(listRegion(container).queryByText("Science")).not.toBeInTheDocument();
  });

  it("shows the Secondary (All) chip while selected (AC 3)", async () => {
    setUrl("/?stream=AllSec");
    render(<Page />);
    // The chip itself, in the Stream row — not the summary row's removal pill.
    await waitFor(() => expect(streamChip(ALL_SEC_CHIP)).toBeInTheDocument());
    // Exactly two nodes: the chip plus that removal pill. Pinning the count
    // means dropping the streamOptions append cannot pass on the pill alone.
    expect(screen.getAllByText("Secondary (All)")).toHaveLength(2);
    // ...and the chip reads as selected, so the parent can see what is applied.
    expect(streamChip(ALL_SEC_CHIP)).toHaveClass("bg-gray-900");
  });

  it("hides the chip for an ordinary visitor (AC 4)", async () => {
    setUrl("/");
    render(<Page />);
    await waitFor(() => expect(screen.getAllByText("JC").length).toBeGreaterThan(0));
    expect(streamChip(ALL_SEC_CHIP)).not.toBeInTheDocument();
    expect(screen.queryByText("Secondary (All)")).not.toBeInTheDocument();
  });

  it("accepts a lowercase param (AC 6)", async () => {
    setUrl("/?stream=allsec&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(listRegion(container).getByText("Mathematics")).toBeInTheDocument(),
    );
    expect(streamChip(ALL_SEC_CHIP)).toBeInTheDocument();
  });

  it("offers every Secondary level, not just one track's (AC 5)", async () => {
    // Levels are normalised to short codes ("Secondary 1" -> "S1") before they
    // reach the filter, so narrowing AllSec to S1 proves S1 is addressable
    // under it — i.e. the level options are the S1-S4 union, not EXP-only.
    setUrl("/?stream=AllSec&level=S1&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(listRegion(container).getByText("English")).toBeInTheDocument(),
    );
    expect(listRegion(container).queryByText("Mathematics")).not.toBeInTheDocument();
    expect(listRegion(container).queryByText("Chemistry")).not.toBeInTheDocument();
  });

  it("clears the stream and hides the chip when deselected (AC 7)", async () => {
    setUrl("/?stream=AllSec&view=list");
    const { container } = render(<Page />);
    await waitFor(() => expect(streamChip(ALL_SEC_CHIP)).toBeInTheDocument());
    // Click the chip specifically. Clicking whichever node happens to come
    // first would also pass via the summary row's removal pill, whose handler
    // clears the stream too — so it would not prove the chip is clickable.
    fireEvent.click(streamChip(ALL_SEC_CHIP)!);
    await waitFor(() =>
      expect(screen.queryByText("Secondary (All)")).not.toBeInTheDocument(),
    );
    expect(listRegion(container).queryByText("Mathematics")).not.toBeInTheDocument();
  });

  it("ignores a typo'd stream instead of showing every platform (AC 10)", async () => {
    // `default: return true` in levelToFilterMapper means an unrecognised value
    // renders the WHOLE schedule, and a truthy filters.stream keeps
    // hasActiveFilters true, so the "Select a stream" prompt is suppressed and
    // a nonsense `AllSecc ×` pill appears. A parent retyping a shared link sees
    // a wrong-platform calendar with no signal that anything failed.
    setUrl("/?stream=AllSecc&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(
        listRegion(container).getByText("Select a stream to see classes"),
      ).toBeInTheDocument(),
    );
    expect(listRegion(container).queryByText("Mathematics")).not.toBeInTheDocument();
    expect(listRegion(container).queryByText("Physics")).not.toBeInTheDocument();
    expect(screen.queryByText("AllSecc")).not.toBeInTheDocument();
  });

  // Nulling the stream alone was not enough. The mount effect kept reading
  // subject/centre/level off the SAME rejected link, and a null stream matches
  // every case in levelToFilterMapper while the "pick a stream first" gate in
  // the events memo only fires when stream, level, subject AND centre are all
  // empty. So ?stream=AllSecc&subject=... rendered JC, Secondary and Primary
  // side by side — the exact wrong-platform mix the whitelist was added to
  // prevent, just reachable through a longer link. Clearing the dependants is
  // what handleFilterChange already does whenever the stream changes.
  it.each([
    // Each value here is chosen to span platforms, so a leak shows up as JC AND
    // Primary rows on screen rather than as a subtle miscount.
    { dependent: "subject", query: "subject=Physics,Science" },
    { dependent: "level", query: "level=J1,P5" },
    { dependent: "centre", query: "centre=Bishan" },
  ])(
    "discards $dependent too when the stream is rejected (AC 10)",
    async ({ dependent, query }) => {
      setUrl(`/?stream=AllSecc&${query}&view=list`);
      const { container } = render(<Page />);
      await waitFor(() =>
        expect(
          listRegion(container).getByText("Select a stream to see classes"),
        ).toBeInTheDocument(),
      );
      const list = listRegion(container);
      // Named rather than counted: this client sells JC, Secondary and Primary
      // as separate businesses, so "a JC class and a Primary class rendered
      // together" IS the defect, not a symptom of it.
      expect(list.queryByText("Physics")).not.toBeInTheDocument(); // JC
      expect(list.queryByText("Science")).not.toBeInTheDocument(); // Primary
      // ...and nothing from Secondary either: the link is dead, not narrowed.
      expect(list.queryByText("Mathematics")).not.toBeInTheDocument();
      expect(list.queryByText("Chemistry")).not.toBeInTheDocument();
      expect(list.queryByText("English")).not.toBeInTheDocument();
      expect(list.queryByText("Pure Biology")).not.toBeInTheDocument();
      expect(screen.queryByText("AllSecc")).not.toBeInTheDocument();
      // The URL is rewritten to the ordinary homepage, so reloading or
      // re-sharing the link cannot resurrect the leak.
      expect(window.location.search).not.toContain(`${dependent}=`);
      expect(window.location.search).not.toContain("stream=");
    },
  );

  it("keeps a VALID stream's dependent filters (AC 10 control)", async () => {
    // Without this, "discard the dependants" could be implemented as "discard
    // them always" and the suite above would still pass — which would silently
    // break every legitimate deep link that narrows a stream to one subject.
    setUrl("/?stream=AllSec&subject=Chemistry&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(listRegion(container).getByText("Chemistry")).toBeInTheDocument(),
    );
    expect(listRegion(container).queryByText("Mathematics")).not.toBeInTheDocument();
    expect(window.location.search).toContain("subject=Chemistry");
  });

  it("tolerates a trailing space on the param (AC 11)", async () => {
    // Survives copy-paste out of a chat app. Without the trim this lands in the
    // typo path above and the deep link silently stops working.
    setUrl("/?stream=AllSec%20&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(listRegion(container).getByText("Mathematics")).toBeInTheDocument(),
    );
    expect(streamChip(ALL_SEC_CHIP)).toBeInTheDocument();
  });

  // Every ordinary stream value, not a sample of one. Each is BOTH a URL token
  // (STREAM_VALUES gates ?stream=) and a levelToFilterMapper case label, with
  // nothing tying the two together, so editing one string breaks the deep link
  // AND drops the chip through to the default case. Covering only "Secondary
  // (IP)" left the other three free to be renamed with the suite still green —
  // and a mis-mapped chip shows the wrong platform's classes, which for this
  // client (JC / Secondary / Primary are separate businesses) is the worst
  // failure the page has. They contain spaces and parentheses, so this also
  // genuinely exercises encode/decode: the whitelist must compare against the
  // DECODED param.
  it.each([
    {
      stream: "JC",
      chip: /JC/,
      shows: ["Physics"],
      hides: ["Mathematics", "Chemistry", "English", "Pure Biology", "Science"],
    },
    {
      stream: "Secondary (Express)",
      chip: /Sec Express/,
      shows: ["Mathematics", "English"],
      hides: ["Chemistry", "Physics", "Science", "Pure Biology"],
    },
    {
      stream: "Secondary (IP)",
      chip: /Sec IP/,
      shows: ["Chemistry"],
      hides: ["Mathematics", "English", "Physics", "Science", "Pure Biology"],
    },
    {
      stream: "Primary",
      chip: /Primary/,
      shows: ["Science"],
      hides: ["Mathematics", "Chemistry", "English", "Physics", "Pure Biology"],
    },
  ])(
    "round-trips ?stream=$stream and shows only that platform (AC 12)",
    async ({ stream, chip, shows, hides }) => {
      setUrl(`/?stream=${encodeURIComponent(stream)}&view=list`);
      const { container } = render(<Page />);
      await waitFor(() =>
        expect(listRegion(container).getByText(shows[0])).toBeInTheDocument(),
      );
      const list = listRegion(container);
      for (const subject of shows) {
        expect(list.getByText(subject)).toBeInTheDocument();
      }
      for (const subject of hides) {
        expect(list.queryByText(subject)).not.toBeInTheDocument();
      }
      // The param survived the whitelist as a *selected* chip — not merely as a
      // filter that happens to match. A value that fell through to null would
      // still render an unselected chip of the same name.
      expect(streamChip(chip)).toHaveClass("bg-gray-900");
    },
  );
});
