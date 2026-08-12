import { render } from "@testing-library/react";
import GoogleAnalytics from "./GoogleAnalytics";
import { shouldLoadAnalytics } from "@/utils/analytics";

// jsdom will not let `window.location` (or even its `hostname`) be redefined, so drive
// the component through the decision function instead. Which hostnames that function
// accepts is covered exhaustively in src/utils/analytics.test.ts; the last test here
// pins the seam between the two — that the real hostname is what gets passed in.
jest.mock("@/utils/analytics", () => ({
  ...jest.requireActual("@/utils/analytics"),
  shouldLoadAnalytics: jest.fn(),
}));

const mockShouldLoad = shouldLoadAnalytics as jest.MockedFunction<
  typeof shouldLoadAnalytics
>;

function loadedTagIds(): string[] {
  return Array.from(
    document.querySelectorAll<HTMLScriptElement>(
      'script[src*="googletagmanager.com/gtag/js"]'
    )
  ).map((s) => new URL(s.src).searchParams.get("id") ?? "");
}

/**
 * ORDER MATTERS HERE. next/script remembers every src and id it has loaded in a
 * module-scoped cache that survives between tests, and jest.resetModules() cannot clear
 * it without also handing the component a second copy of React. So the "loads nothing"
 * cases run first, while that cache is still empty and an unwanted script would really
 * appear in the DOM. Put them after the loading case and they go quietly vacuous.
 */
describe("GoogleAnalytics", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("loads nothing when the host does not qualify", () => {
    // The staging branch carries this code, so this branch of the check is the only
    // thing keeping preview traffic out of the GA4 property.
    mockShouldLoad.mockReturnValue(false);
    render(<GoogleAnalytics />);
    expect(loadedTagIds()).toEqual([]);
  });

  it("writes no gtag bootstrap when the host does not qualify", () => {
    mockShouldLoad.mockReturnValue(false);
    render(<GoogleAnalytics />);
    const inline = Array.from(document.querySelectorAll("script"))
      .map((s) => s.textContent ?? "")
      .join("");
    expect(inline).not.toContain("G-GX27V89PJK");
  });

  it("decides using the browser's actual hostname", () => {
    mockShouldLoad.mockReturnValue(false);
    render(<GoogleAnalytics />);
    expect(mockShouldLoad).toHaveBeenCalledWith(window.location.hostname);
  });

  it("loads the tag for the corrected GA4 property when the host qualifies", () => {
    mockShouldLoad.mockReturnValue(true);
    render(<GoogleAnalytics />);
    expect(loadedTagIds()).toContain("G-GX27V89PJK");
  });
});
