import { act, render, screen, fireEvent, waitFor, within } from "@testing-library/react";
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
// silently break every later test in the file. The timeout tests install fake
// timers; a leaked fake clock would hang every later `waitFor`.
//
// Order matters: spies first, clock second. One test spies on
// setTimeout/clearTimeout WHILE fake timers are installed, so restoring that spy
// puts the FAKE functions back on `global` — useRealTimers has to run after it
// to sweep them away again.
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

// page.tsx reaches for the calendar year in exactly ONE place —
// `new Date().getFullYear()`, threaded through the cache read, the request and
// the cache write — and nothing else under src/ calls it, so pinning that call
// is a precise stand-in for "this browser tab was open when the year rolled
// over". Deliberately NOT jest.setSystemTime: the bug lives INSIDE the 5-minute
// freshness window, so the two mounts must stay milliseconds apart on the
// wall clock while disagreeing about the year. Freezing the whole clock instead
// would let the cache expire on age and the test would pass for the wrong
// reason.
function pinYear(year: number) {
  return jest.spyOn(Date.prototype, "getFullYear").mockReturnValue(year);
}

// A request that opens and then goes nowhere: it settles ONLY when the app
// aborts it. That is what a stalled connection actually does — a rejected
// promise is the one thing it never produces — and it is the case a cache
// fallback living in `.catch` alone cannot see.
// Note the `init?.signal?` chain: a call made without a signal never subscribes
// to anything and so hangs forever, exactly as it would in a browser. Passing no
// AbortSignal cannot accidentally pass these tests.
function stallingFetch() {
  return jest.fn((input: RequestInfo | URL, init?: RequestInit) =>
    new Promise((_, reject) => {
      init?.signal?.addEventListener("abort", () =>
        reject(new DOMException("The user aborted a request.", "AbortError")),
      );
    }),
  );
}

// The app-level timeout, restated so the tests below can straddle it. Kept as a
// literal rather than imported: page.tsx does not export it, and a test that
// read the value from the module under test could not tell 10 seconds from 10
// milliseconds.
const FETCH_TIMEOUT_MS = 10_000;

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
    // The empty cache used to be incidental here and is now load-bearing: a
    // failed pinned fetch falls back to the cache, so this test only covers the
    // nothing-to-fall-back-on case if there is genuinely nothing stored. Stated
    // rather than assumed, because beforeEach's localStorage.clear() is one
    // edit away from making this test assert the fallback's behaviour by
    // accident.
    expect(localStorage.getItem("weeklyClassData")).toBeNull();
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
    // that the retry never leaves the browser. Prove the second mount refetches
    // — and do it UNPINNED, because a pinned visit now skips the cache read
    // outright and so would refetch here no matter what was stored.
    first.unmount();
    setUrl("/");
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
    //
    // Deliberately UNPINNED on both mounts. This used to drive the whole thing
    // through ?tutor=T1, which no longer exercises anything: a pinned visit
    // skips the cache read entirely, so it refetches whatever is stored and the
    // `parsed.length === 0` guard could be deleted with this test still green.
    // The read path is the unpinned path now, so that is where it is probed.
    const fetchMock = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ data: SLOTS }) }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    setUrl("/?stream=JC&view=list");

    // Seed the version and timestamp entries through a real visit so they are
    // genuinely valid — and so the test does not restate CACHE_VERSION, which
    // must not be bumped.
    const first = render(<Page />);
    await waitFor(() =>
      expect(listRegion(first.container).getByText("Physics")).toBeInTheDocument(),
    );
    first.unmount();
    localStorage.setItem("weeklyClassData", "[]");

    setUrl("/?stream=JC&view=list");
    const { container } = render(<Page />);
    // Wait on the CONTENT, not the call count: fetch fires synchronously inside
    // the mount effect, so a count assertion resolves while the spinner is
    // still up and listRegion has nothing to find.
    await waitFor(() =>
      expect(listRegion(container).getByText("Physics")).toBeInTheDocument(),
    );
    // ...and it asked again rather than serving the empty entry.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(/loading courses/i)).not.toBeInTheDocument();
  });

  it("refetches for a pinned link rather than calling it dead from a stale cache", async () => {
    // THE regression. A cache does not have to be EXPIRED to be wrong, only
    // OLDER than the schedule: five minutes is plenty of room for ops to
    // publish a class or correct a tutor code. The mount effect used to return
    // on any cache hit before fetching, so the pin was matched against the
    // pre-change payload and missed — and "matched nothing" is rendered as
    // "We couldn't find any classes for this link.", i.e. the page telling a
    // parent that a working link is broken. Realistic path, and it is the exact
    // inverse of the silent-failure this whole feature exists to stop.
    const staleFetch = jest.fn(() =>
      // The schedule as it was BEFORE the change: no T1 anywhere in it.
      Promise.resolve({ json: () => Promise.resolve({ data: [SLOTS[2]] }) }),
    );
    global.fetch = staleFetch as unknown as typeof fetch;
    setUrl("/");
    const first = render(<Page />);
    // Seed via a real unpinned visit so the timestamp is genuinely fresh and the
    // test does not restate CACHE_VERSION, which must not be bumped.
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("weeklyClassData") ?? "[]")).toHaveLength(1),
    );
    first.unmount();

    // Ops publishes the class; the tutor shares the link; the parent taps it
    // well inside CACHE_DURATION, so that stale entry still reads as fresh.
    const freshFetch = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ data: SLOTS }) }),
    );
    global.fetch = freshFetch as unknown as typeof fetch;
    setUrl("/?tutor=T1&view=list");
    const { container } = render(<Page />);

    await waitFor(() =>
      expect(screen.getByText("You're viewing T1's classes")).toBeInTheDocument(),
    );
    // Not merely "the banner is right": the class the link points at is on
    // screen, so the visit is actually useful and not just politely worded.
    expect(listRegion(container).getByText("Physics")).toBeInTheDocument();
    expect(screen.queryByText(/couldn't find any classes for this link/i)).not.toBeInTheDocument();
    // And it is stated plainly, not hedged: this data came off the wire on this
    // page load. The saved-copy wording belongs to the failed-fetch path only,
    // and leaking it here would hedge every pinned visit into meaninglessness.
    expect(screen.queryByText(/saved copy/i)).not.toBeInTheDocument();
    expect(freshFetch).toHaveBeenCalledTimes(1);
  });

  it("states a successful pinned fetch plainly, with no saved-copy hedge", async () => {
    // The containment test for the fallback flag. It has to be reachable ONLY
    // from the .catch: a visitor on a healthy load is looking at live data, and
    // a warning that their view "may be out of date" is both false and, once it
    // appears on every visit, unreadable on the visit where it is true.
    // beforeEach supplies a successful fetch and an empty cache.
    setUrl("/?tutor=T1&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(screen.getByText("You're viewing T1's classes")).toBeInTheDocument(),
    );
    expect(listRegion(container).getByText("Physics")).toBeInTheDocument();
    expect(screen.queryByText(/saved copy/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/may be out of date/i)).not.toBeInTheDocument();
  });

  it("still reports a genuinely dead pin even with a valid cache present", async () => {
    // The other edge of the same change. Bypassing the cache must make the
    // dead-link report MORE accurate, not unreachable: a code that matches
    // nothing in the freshly fetched schedule is still a broken link, and the
    // page must still say so rather than fall silent on the homepage.
    const fetchMock = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ data: SLOTS }) }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    setUrl("/");
    const first = render(<Page />);
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("weeklyClassData") ?? "[]")).toHaveLength(SLOTS.length),
    );
    first.unmount();

    setUrl("/?tutor=NoSuchTutor");
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByText(/couldn't find any classes for this link/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText(/select a stream/i)).not.toBeInTheDocument();
    // ...and it reached that verdict from a fresh fetch, not from the cache.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to the cache for a pinned link when the fetch fails", async () => {
    // THE regression for the cache-bypass fix above. Skipping the cache read is
    // a rule about SUCCESS — it exists so a dead-link verdict is only ever
    // reached against fresh data. Applied to the FAILURE path it throws away a
    // schedule the browser already holds, so one CORS hiccup or 502 makes every
    // tutor link in circulation render an empty page with an apology on it,
    // while the classes the link asks for sit unread in localStorage.
    const okFetch = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ data: SLOTS }) }),
    );
    global.fetch = okFetch as unknown as typeof fetch;
    setUrl("/");
    // Seed via a real unpinned visit so the timestamp and version entries are
    // genuinely valid, and the test does not restate CACHE_VERSION.
    const first = render(<Page />);
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("weeklyClassData") ?? "[]")).toHaveLength(SLOTS.length),
    );
    first.unmount();

    // The API goes down. The tutor's link is still perfectly valid and the data
    // to serve it is still perfectly fresh.
    const failingFetch = jest.fn(() => Promise.reject(new Error("network")));
    global.fetch = failingFetch as unknown as typeof fetch;
    setUrl("/?tutor=T1&view=list");
    const { container } = render(<Page />);

    // The banner names the tutor — and says where the answer came from. The
    // assertion used to be the bare "You're viewing T1's classes", which was
    // this page presenting a snapshot as the schedule: any class added since
    // the cache was written is missing from a view that claims to be T1's
    // classes, and nothing on screen said so.
    await waitFor(() =>
      expect(
        screen.getByText("You're viewing T1's classes — a saved copy, which may be out of date."),
      ).toBeInTheDocument(),
    );
    // The unqualified claim must be GONE, not merely accompanied.
    expect(screen.queryByText("You're viewing T1's classes")).not.toBeInTheDocument();
    // The class itself, not just a politely worded banner. This is the half of
    // the round-B fix that the warning must not undo: the visitor still gets
    // the classes, they are just told what they are looking at.
    expect(listRegion(container).getByText("Physics")).toBeInTheDocument();
    // No apology for a failure the visitor never experienced...
    expect(screen.queryByText(/couldn't load the schedule/i)).not.toBeInTheDocument();
    // ...and no accusation against a link that plainly works.
    expect(screen.queryByText(/couldn't find any classes for this link/i)).not.toBeInTheDocument();
    // It really did go to the network first — otherwise this is just the old
    // serve-from-cache behaviour wearing the new test's name.
    expect(failingFetch).toHaveBeenCalledTimes(1);
  });

  it("hedges a PARTIAL cached match instead of counting it as the whole link", async () => {
    // The misinformation round C names. ?classes=A,B against a cache written
    // before B existed renders A alone and, unqualified, calls it "1 selected
    // class" — true of the cache, false of the link. The visitor has no way to
    // tell a two-class link that lost a class from a one-class link, and the
    // page sounds equally confident either way.
    const oldFetch = jest.fn(() =>
      // The schedule as it was before Class0002 was published.
      Promise.resolve({ json: () => Promise.resolve({ data: [SLOTS[0]] }) }),
    );
    global.fetch = oldFetch as unknown as typeof fetch;
    setUrl("/");
    const first = render(<Page />);
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("weeklyClassData") ?? "[]")).toHaveLength(1),
    );
    first.unmount();

    const failingFetch = jest.fn(() => Promise.reject(new Error("network")));
    global.fetch = failingFetch as unknown as typeof fetch;
    setUrl("/?classes=2026-Class0001,2026-Class0002&view=list");
    const { container } = render(<Page />);

    await waitFor(() =>
      expect(
        screen.getByText("You're viewing 1 selected class — a saved copy, which may be out of date."),
      ).toBeInTheDocument(),
    );
    // It must not read as a plain, complete selection of one class.
    expect(screen.queryByText("You're viewing 1 selected class")).not.toBeInTheDocument();
    // What the cache does hold is still served — hedging is not withholding.
    expect(listRegion(container).getByText("Physics")).toBeInTheDocument();
    // ...and the class it does not hold is simply absent, not invented.
    expect(listRegion(container).queryByText("Economics")).not.toBeInTheDocument();
  });

  it("keeps the load-failure copy when the failed fetch's fallback matches nothing", async () => {
    // The dangerous half of the fallback. The cache is valid and non-empty but
    // predates the pinned class, so nothing matches — and under a FAILED fetch
    // that is not evidence of anything: "your link is dead" and "our data is
    // stale" are indistinguishable from here. Falling through to the dead-link
    // copy would resurrect the exact bug the cache bypass was added to kill,
    // via the failure path instead of the happy one.
    const staleFetch = jest.fn(() =>
      // A real schedule, just not one containing T1.
      Promise.resolve({ json: () => Promise.resolve({ data: [SLOTS[2]] }) }),
    );
    global.fetch = staleFetch as unknown as typeof fetch;
    setUrl("/");
    const first = render(<Page />);
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("weeklyClassData") ?? "[]")).toHaveLength(1),
    );
    first.unmount();
    // States the precondition that separates this test from the no-cache one
    // below it: there IS a fresh cache here, it simply misses the pin.
    expect(JSON.parse(localStorage.getItem("weeklyClassData") ?? "[]")).toHaveLength(1);

    const failingFetch = jest.fn(() => Promise.reject(new Error("network")));
    global.fetch = failingFetch as unknown as typeof fetch;
    setUrl("/?tutor=T1");
    render(<Page />);

    await waitFor(() =>
      expect(
        screen.getByText("We couldn't load the schedule. Please try again."),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText(/couldn't find any classes for this link/i)).not.toBeInTheDocument();
    // The cache was non-empty, so this must not be the not-yet-published copy
    // either — that one is reserved for a SUCCESSFUL response carrying no rows.
    expect(screen.queryByText(/isn't published yet/i)).not.toBeInTheDocument();
    // And the saved-copy wording stays away too: there is nothing on screen for
    // it to qualify, and hedging a dead-link verdict would be the round-A bug
    // with a disclaimer bolted on. The failure copy is the whole message here.
    expect(screen.queryByText(/saved copy/i)).not.toBeInTheDocument();
  });

  it("refuses LAST year's cache when this year's pinned fetch fails", async () => {
    // The cache is keyed by nothing but its own age, while the request is
    // keyed by year. Cross midnight on 31 December and a five-minute-old entry
    // — fresh by every check the page makes — answers a question about a
    // different academic year. Tutor codes and centres are stable year to
    // year, so the substitution is invisible: the parent gets a complete,
    // plausible, RETIRED timetable, hedged only as "may be out of date".
    const seen: string[] = [];
    const yearSpy = pinYear(2026);
    const lastYearFetch = jest.fn((url: RequestInfo | URL) => {
      seen.push(String(url));
      return Promise.resolve({ json: () => Promise.resolve({ data: SLOTS }) });
    });
    global.fetch = lastYearFetch as unknown as typeof fetch;
    setUrl("/");
    // Seed through a real visit, so the entry is exactly what an ordinary
    // browse on 31 December leaves behind — and so the test does not restate
    // CACHE_VERSION, which must not be bumped.
    const first = render(<Page />);
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("weeklyClassData") ?? "[]")).toHaveLength(SLOTS.length),
    );
    first.unmount();

    // Midnight. The tab is still open, the entry is still minutes old.
    yearSpy.mockReturnValue(2027);
    const failingFetch = jest.fn((url: RequestInfo | URL) => {
      seen.push(String(url));
      return Promise.reject(new Error("network"));
    });
    global.fetch = failingFetch as unknown as typeof fetch;
    setUrl("/?tutor=T1&view=list");
    const { container } = render(<Page />);

    await waitFor(() =>
      expect(
        screen.getByText("We couldn't load the schedule. Please try again."),
      ).toBeInTheDocument(),
    );
    // The whole point: last year's classes are NOT on screen. A hedge is not a
    // substitute — "may be out of date" describes a stale copy of the right
    // year, not a complete copy of the wrong one.
    expect(listRegion(container).queryByText("Physics")).not.toBeInTheDocument();
    expect(screen.queryByText(/saved copy/i)).not.toBeInTheDocument();
    // ...and the link is not blamed for it either.
    expect(screen.queryByText(/couldn't find any classes for this link/i)).not.toBeInTheDocument();
    // The two mounts really did ask about different years — otherwise this is
    // just the same-year fallback test with a spy attached.
    expect(seen[0]).toContain("year=2026");
    expect(seen[1]).toContain("year=2027");
  });

  it("still falls back to a SAME-year cache when the fetch fails", async () => {
    // Control for the test above, driven through the same lever. Without it,
    // "reject a mismatched year" could be implemented as "reject everything"
    // and the suite would still be green — silently deleting the round-5
    // fallback, whose whole job is to keep a shared tutor link working through
    // a backend blip.
    const yearSpy = pinYear(2026);
    const okFetch = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ data: SLOTS }) }),
    );
    global.fetch = okFetch as unknown as typeof fetch;
    setUrl("/");
    const first = render(<Page />);
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("weeklyClassData") ?? "[]")).toHaveLength(SLOTS.length),
    );
    first.unmount();

    // Same year, same as every visit that is not on 1 January.
    yearSpy.mockReturnValue(2026);
    const failingFetch = jest.fn(() => Promise.reject(new Error("network")));
    global.fetch = failingFetch as unknown as typeof fetch;
    setUrl("/?tutor=T1&view=list");
    const { container } = render(<Page />);

    await waitFor(() =>
      expect(
        screen.getByText("You're viewing T1's classes — a saved copy, which may be out of date."),
      ).toBeInTheDocument(),
    );
    expect(listRegion(container).getByText("Physics")).toBeInTheDocument();
  });

  it("clears a stale cache once a successful response says the schedule is empty", async () => {
    // Refusing to WRITE an empty payload is only half the job. A 200 carrying
    // no rows is the API stating that the schedule being asked about has no
    // classes — which makes whatever is already stored wrong, not merely old.
    // Left in place it is read back by the next ordinary visit, which then
    // renders a schedule the API has already disowned and (being unpinned)
    // never fetches to discover that.
    const okFetch = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ data: SLOTS }) }),
    );
    global.fetch = okFetch as unknown as typeof fetch;
    setUrl("/?stream=JC&view=list");
    const first = render(<Page />);
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("weeklyClassData") ?? "[]")).toHaveLength(SLOTS.length),
    );
    first.unmount();

    // The schedule is withdrawn (or the year turns and the new one is not up
    // yet). PINNED deliberately: with a valid cache in place that is the only
    // visit that reaches the network at all, so it is the only one that can
    // learn the schedule is empty.
    const emptyFetch = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ data: [] }) }),
    );
    global.fetch = emptyFetch as unknown as typeof fetch;
    setUrl("/?tutor=T1");
    const second = render(<Page />);
    await waitFor(() =>
      expect(
        screen.getByText("The schedule isn't published yet. Please check back soon."),
      ).toBeInTheDocument(),
    );
    expect(localStorage.getItem("weeklyClassData")).toBeNull();
    second.unmount();

    // ...and the consequence that matters: the next ordinary visit asks again
    // instead of resurrecting the entry. Without the clear it serves the stale
    // classes from localStorage and never calls fetch at all.
    const okAgain = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ data: SLOTS }) }),
    );
    global.fetch = okAgain as unknown as typeof fetch;
    setUrl("/?stream=JC&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(listRegion(container).getByText("Physics")).toBeInTheDocument(),
    );
    expect(okAgain).toHaveBeenCalledTimes(1);
  });

  it("escapes the spinner when a pinned fetch STALLS, serving the cache", async () => {
    // The failure machinery all hangs off `.catch`, and a stalled request never
    // rejects. isLoading stays true, the spinner replaces the pinned banner,
    // and the banner holds "Show all classes →" — the only exit from pinned
    // mode. A degraded API therefore stranded a visitor on a shared link with
    // no route to the ordinary site at all.
    jest.useFakeTimers();
    const okFetch = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ data: SLOTS }) }),
    );
    global.fetch = okFetch as unknown as typeof fetch;
    setUrl("/");
    const first = render(<Page />);
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("weeklyClassData") ?? "[]")).toHaveLength(SLOTS.length),
    );
    first.unmount();

    global.fetch = stallingFetch() as unknown as typeof fetch;
    setUrl("/?tutor=T1&view=list");
    const { container } = render(<Page />);
    expect(screen.getByText(/loading courses/i)).toBeInTheDocument();

    // A second short of the deadline it is still waiting — the page does not
    // give up on a merely slow mobile connection.
    await act(async () => {
      jest.advanceTimersByTime(FETCH_TIMEOUT_MS - 1000);
    });
    expect(screen.getByText(/loading courses/i)).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    // Out of the spinner, into the EXISTING failure path: cache served, and
    // labelled as a snapshot rather than presented as the schedule.
    expect(screen.queryByText(/loading courses/i)).not.toBeInTheDocument();
    expect(
      screen.getByText("You're viewing T1's classes — a saved copy, which may be out of date."),
    ).toBeInTheDocument();
    expect(listRegion(container).getByText("Physics")).toBeInTheDocument();
    // And the way out of pinned mode is reachable again, which is the point.
    expect(screen.getByRole("button", { name: /show all classes/i })).toBeInTheDocument();
  });

  it("escapes the spinner when a pinned fetch STALLS with no cache to serve", async () => {
    // Same stall, nothing stored. There is no honest content to show, so the
    // visitor gets the ordinary failure copy — not a new fourth banner state,
    // and not an accusation that their link is dead.
    jest.useFakeTimers();
    global.fetch = stallingFetch() as unknown as typeof fetch;
    expect(localStorage.getItem("weeklyClassData")).toBeNull();
    setUrl("/?tutor=T1&view=list");
    render(<Page />);
    expect(screen.getByText(/loading courses/i)).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(FETCH_TIMEOUT_MS);
    });
    expect(screen.queryByText(/loading courses/i)).not.toBeInTheDocument();
    expect(
      screen.getByText("We couldn't load the schedule. Please try again."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/couldn't find any classes for this link/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /show all classes/i })).toBeInTheDocument();
  });

  it("clears the timeout once the fetch settles normally", async () => {
    // The timeout must not outlive the request it guards: an abort fired at a
    // page that already loaded is harmless today only by accident, and a timer
    // left armed on every successful load is the shape of a leak.
    jest.useFakeTimers();
    // Spies go in AFTER useFakeTimers, so they wrap the fake clock's functions
    // rather than the real ones jest has just swapped out. (afterEach restores
    // the spies BEFORE dropping the fake clock, so the fake never leaks back
    // into a later test.)
    const scheduled = jest.spyOn(global, "setTimeout");
    const cleared = jest.spyOn(global, "clearTimeout");
    setUrl("/?tutor=T1&view=list");
    render(<Page />);
    await waitFor(() =>
      expect(screen.getByText("You're viewing T1's classes")).toBeInTheDocument(),
    );

    // Deliberately NOT jest.getTimerCount(): fake timers count
    // requestAnimationFrame too, and WeeklyClassCalendar schedules one on
    // mount, so the total here is never zero for reasons that have nothing to
    // do with the fetch. Name the fetch's own timer instead.
    const armed = scheduled.mock.calls.findIndex(([, ms]) => ms === FETCH_TIMEOUT_MS);
    // It was armed at all — otherwise "it was cleared" is vacuously satisfiable
    // by deleting the timeout entirely, which is the bug this pair guards.
    expect(armed).toBeGreaterThanOrEqual(0);
    expect(cleared).toHaveBeenCalledWith(scheduled.mock.results[armed].value);
  });

  it("cancels an in-flight fetch on unmount without a late state update", async () => {
    // Unmount mid-request — the visitor navigates away while the API is slow.
    // The effect's cleanup must take the timer AND the request with it;
    // otherwise the abort lands ten seconds later on a tree that is gone,
    // logging a failure nobody experienced and setting state on nothing.
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.useFakeTimers();
    global.fetch = stallingFetch() as unknown as typeof fetch;
    setUrl("/?tutor=T1&view=list");
    const { unmount } = render(<Page />);
    // A raw count IS meaningful here, unlike after a successful load: the fetch
    // has not settled, so the page is still on the spinner and
    // WeeklyClassCalendar (with its mount-time requestAnimationFrame) has not
    // rendered. The one pending timer is the fetch timeout.
    expect(jest.getTimerCount()).toBe(1);

    unmount();
    expect(jest.getTimerCount()).toBe(0);
    await act(async () => {
      jest.advanceTimersByTime(FETCH_TIMEOUT_MS * 6);
    });
    expect(error).not.toHaveBeenCalled();
  });

  it("still serves an UNPINNED visit from cache, with no second fetch", async () => {
    // The cost control on the fix above: bypassing the cache is scoped to
    // pinned links, which are a small share of traffic. An implementation that
    // simply stopped reading the cache would satisfy every pinned assertion in
    // this file and quietly double the request count for everyone else.
    const fetchMock = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ data: SLOTS }) }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    setUrl("/?stream=JC&view=list");
    const first = render(<Page />);
    await waitFor(() =>
      expect(listRegion(first.container).getByText("Physics")).toBeInTheDocument(),
    );
    first.unmount();

    setUrl("/?stream=JC&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(listRegion(container).getByText("Physics")).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("still WRITES the cache on a pinned visit, for the next unpinned one", async () => {
    // Bypass the READ only. The pinned visitor has just paid for a fresh
    // payload; throwing it away would make their own next visit — and any
    // ordinary browse from the same browser — pay again for nothing.
    const fetchMock = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ data: SLOTS }) }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    setUrl("/?tutor=T1&view=list");
    const first = render(<Page />);
    await waitFor(() =>
      expect(screen.getByText("You're viewing T1's classes")).toBeInTheDocument(),
    );
    expect(JSON.parse(localStorage.getItem("weeklyClassData") ?? "[]")).toHaveLength(SLOTS.length);
    first.unmount();

    // The write is only worth anything if a later unpinned visit can read it.
    setUrl("/?stream=JC&view=list");
    const { container } = render(<Page />);
    await waitFor(() =>
      expect(listRegion(container).getByText("Physics")).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
    // throw escapes the effect and isLoading never clears: a permanent spinner
    // over a page that has no other way to paint.
    //
    // UNPINNED, and it has to be. The original framing here was the pinned one
    // ("the spinner replaces the pinned banner, the only exit from pinned
    // mode"), but pinned visits no longer read the cache at all, so a corrupt
    // entry is unreachable from a pin link and this became a test that could
    // not fail. The hazard is undiminished on the unpinned path — the parse
    // still runs there, and a stuck spinner is worse for an ordinary browse
    // because every visitor hits it.
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMock = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ data: SLOTS }) }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    setUrl("/?stream=JC&view=list");

    // Seed the cache through a real visit so the version and timestamp entries
    // are genuinely valid and only the payload is corrupt — and so the test does
    // not restate CACHE_VERSION, which must not be bumped.
    const first = render(<Page />);
    await waitFor(() =>
      expect(listRegion(first.container).getByText("Physics")).toBeInTheDocument(),
    );
    first.unmount();
    localStorage.setItem("weeklyClassData", '[{"classSlotId":"2026-Class0001",');

    setUrl("/?stream=JC&view=list");
    const { container } = render(<Page />);
    // Wait on the CONTENT, not the call count: fetch fires synchronously inside
    // the mount effect, so a count assertion resolves while the spinner is
    // still up and listRegion has nothing to find.
    await waitFor(() =>
      expect(listRegion(container).getByText("Physics")).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
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

// Every honest state this branch built rendered inside `!isLoading && isPinned`,
// so an ordinary visitor — no ?tutor=, no ?classes=, i.e. most traffic — got
// NOTHING when the fetch failed or came back empty: hero, filter bar, and
// "Select a stream to see classes" over a calendar that can never fill. The
// prompt is worse than silence there, because it points at filters that cannot
// help, and the reasonable conclusion is that the centre runs no classes.
//
// The absence assertions here are deliberately UNSCOPED. page.tsx keeps both
// views mounted at all times (it toggles a `hidden` class, not the hidden
// attribute), so one unscoped query covers the calendar's copy of the prompt as
// well as the list's — which is how both suppression paths
// (WeeklyClassCalendar's `hasActiveFilters`, ListView's `suppressEmptyState`)
// get covered without forcing a view.
describe("unpinned schedule notice (no ?tutor= / ?classes=)", () => {
  it("tells an unpinned visitor when the schedule fails to load", async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error("network"))) as unknown as typeof fetch;
    // Stated rather than assumed: with something cached the page would have
    // returned before fetching and there would be no failure to report.
    expect(localStorage.getItem("weeklyClassData")).toBeNull();
    setUrl("/");
    render(<Page />);
    await waitFor(() =>
      expect(
        screen.getByText("We couldn't load the schedule. Please try again."),
      ).toBeInTheDocument(),
    );
    // The misleading prompt — and its CTA — must be gone from BOTH views, not
    // merely accompanied by an explanation that contradicts them.
    expect(screen.queryByText(/select a stream/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /open filters/i })).not.toBeInTheDocument();
    // Nothing failed to publish; the system failed. The two must not blur.
    expect(screen.queryByText(/isn't published yet/i)).not.toBeInTheDocument();
  });

  it("tells an unpinned visitor when the fetch STALLS past the timeout", async () => {
    // The 10s abort is what makes this reachable in the wild: a connection that
    // opens and then goes nowhere never rejects, so before the timeout this was
    // a permanent spinner. Now it is a silently empty site unless the notice
    // renders — which is the whole point of this test.
    jest.useFakeTimers();
    global.fetch = stallingFetch() as unknown as typeof fetch;
    expect(localStorage.getItem("weeklyClassData")).toBeNull();
    setUrl("/");
    render(<Page />);
    expect(screen.getByText(/loading courses/i)).toBeInTheDocument();

    // A second short of the deadline it is still waiting: a merely slow mobile
    // connection must not be told the schedule failed.
    await act(async () => {
      jest.advanceTimersByTime(FETCH_TIMEOUT_MS - 1000);
    });
    expect(screen.getByText(/loading courses/i)).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.queryByText(/loading courses/i)).not.toBeInTheDocument();
    expect(
      screen.getByText("We couldn't load the schedule. Please try again."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/select a stream/i)).not.toBeInTheDocument();
  });

  it("tells an unpinned visitor when the schedule loaded but is empty", async () => {
    // A 200 carrying zero rows. Reachable every year: the request pins
    // year=<current>, so from 1 January until the new year's schedule is
    // published every ordinary visit lands here — and "Please try again" would
    // be both a lie and useless advice.
    global.fetch = jest.fn(() =>
      Promise.resolve({ json: () => Promise.resolve({ data: [] }) }),
    ) as unknown as typeof fetch;
    setUrl("/");
    render(<Page />);
    await waitFor(() =>
      expect(
        screen.getByText("The schedule isn't published yet. Please check back soon."),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText(/select a stream/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /open filters/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/couldn't load the schedule/i)).not.toBeInTheDocument();
  });

  it("says nothing at all to an unpinned visitor whose schedule loads", async () => {
    // THE control. A notice that always rendered would be worse than none, and
    // suppressing the prompt unconditionally would break the ordinary browse
    // this site exists for — both bugs pass every positive test above.
    // beforeEach supplies a successful, non-empty fetch.
    setUrl("/");
    render(<Page />);
    await waitFor(() =>
      expect(screen.queryByText(/loading courses/i)).not.toBeInTheDocument(),
    );
    expect(screen.queryByText(/couldn't load the schedule/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/isn't published yet/i)).not.toBeInTheDocument();
    // Exactly two: the calendar's overlay and the list's empty state, both
    // mounted at all times. Counting them is what proves neither suppression
    // path fired — a bare getByText would be ambiguous, and a single-view
    // assertion would leave the other free to suppress.
    expect(screen.getAllByText("Select a stream to see classes")).toHaveLength(2);
  });

  it("offers an unpinned visitor no escape hatch, having pinned nothing", async () => {
    // "Show all classes →" is the pin's exit. An unpinned visitor is already
    // looking at all classes, so on this notice it is a control that changes
    // nothing — and next to "Please try again" it reads as the retry button
    // this change deliberately does not implement.
    global.fetch = jest.fn(() => Promise.reject(new Error("network"))) as unknown as typeof fetch;
    setUrl("/");
    render(<Page />);
    await waitFor(() =>
      expect(
        screen.getByText("We couldn't load the schedule. Please try again."),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByRole("button", { name: /show all classes/i })).not.toBeInTheDocument();
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
