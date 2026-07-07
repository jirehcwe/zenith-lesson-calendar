import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupBanner from "./SignupBanner";

jest.mock("next/image", () => {
  const MockImage = ({ alt }: { alt: string }) => <img alt={alt} />;
  MockImage.displayName = "Image";
  return MockImage;
});

// Capture the IntersectionObserver callback so tests can simulate the user
// scrolling past the banner (jsdom has no real IntersectionObserver).
let ioCallback: IntersectionObserverCallback | null = null;

beforeEach(() => {
  ioCallback = null;
  class MockIntersectionObserver {
    constructor(cb: IntersectionObserverCallback) {
      ioCallback = cb;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  global.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

// Simulate the banner scrolling above the viewport (auto-collapse trigger).
function scrollPastBanner() {
  act(() => {
    ioCallback?.(
      [
        {
          isIntersecting: false,
          boundingClientRect: { top: -100 } as DOMRectReadOnly,
        } as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver
    );
  });
}

describe("SignupBanner", () => {
  it("renders without crashing", () => {
    render(<SignupBanner />);
  });

  it("renders the schedule heading", () => {
    render(<SignupBanner />);
    expect(screen.getAllByRole("heading", { level: 1 })[0]).toBeInTheDocument();
  });

  it("renders the student trust line", () => {
    render(<SignupBanner />);
    expect(screen.getAllByText(/20,000\+/i).length).toBeGreaterThan(0);
  });

  it("starts expanded (no compact bar) with no manual collapse button", () => {
    render(<SignupBanner />);
    expect(screen.getAllByText(/Registrations Open/i).length).toBeGreaterThan(0);
    expect(screen.queryByLabelText("Expand banner")).not.toBeInTheDocument();
    // The manual hide/collapse button has been removed entirely.
    expect(screen.queryByLabelText("Collapse banner")).not.toBeInTheDocument();
  });

  it("auto-collapses to a single compact bar when scrolled past", () => {
    render(<SignupBanner />);
    scrollPastBanner();
    expect(screen.getAllByLabelText("Expand banner")).toHaveLength(1);
    // The expanded hero (eyebrow pill) is gone from ALL layouts.
    expect(screen.queryByText(/Now booking/i)).not.toBeInTheDocument();
  });

  it("re-expands when the compact bar is clicked", async () => {
    const user = userEvent.setup();
    render(<SignupBanner />);
    scrollPastBanner();
    await user.click(screen.getByLabelText("Expand banner"));
    expect(screen.queryByLabelText("Expand banner")).not.toBeInTheDocument();
    expect(screen.getAllByText(/Registrations Open/i).length).toBeGreaterThan(0);
  });

  it("renders the eyebrow pill in the desktop layout", () => {
    render(<SignupBanner />);
    expect(screen.getAllByText(/Registrations Open/i).length).toBeGreaterThan(0);
  });

  // The embed vs standalone visibility is driven by CSS on the `[data-embed]`
  // attribute (set pre-paint in layout.tsx), so it is exercised in the browser,
  // not here. These cases lock the embed bar's structural contract: it is always
  // in the DOM and, unlike the standalone collapsed bar, offers no expand control.
  describe("static embed bar", () => {
    it("renders the schedule title with no expand/collapse control", () => {
      render(<SignupBanner />);
      const embedBar = document.querySelector(".signup-embed-bar");
      expect(embedBar).toBeInTheDocument();
      expect(embedBar).toHaveTextContent("Zenith 2026 Schedule");
      expect(embedBar?.querySelector("button")).toBeNull();
      expect(embedBar?.querySelector("svg")).toBeNull();
    });

    it("is separate from the interactive standalone hero", () => {
      render(<SignupBanner />);
      expect(document.querySelector(".signup-standalone")).toBeInTheDocument();
    });
  });
});
