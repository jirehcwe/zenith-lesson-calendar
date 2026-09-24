import { render } from "@testing-library/react";
import GoogleTagManager from "./GoogleTagManager";
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

type WindowWithDataLayer = Window & { dataLayer?: unknown[] };

/** The container bootstrap announces itself on the dataLayer before gtm.js loads. */
function gtmBootstrapped(): boolean {
  const layer = (window as WindowWithDataLayer).dataLayer ?? [];
  return layer.some(
    (entry) => typeof entry === "object" && entry !== null && "gtm.start" in entry
  );
}

function injectedContainerIds(): string[] {
  return Array.from(
    document.querySelectorAll<HTMLScriptElement>('script[src*="/gtm.js"]')
  ).map((s) => new URL(s.src).searchParams.get("id") ?? "");
}

/**
 * ORDER MATTERS HERE. next/script remembers every id it has loaded in a module-scoped
 * cache that survives between tests, and jest.resetModules() cannot clear it without
 * also handing the component a second copy of React. So the "loads nothing" cases run
 * first, while that cache is still empty and an unwanted script would really appear.
 * Put them after the loading case and they go quietly vacuous.
 */
describe("GoogleTagManager", () => {
  afterEach(() => {
    jest.clearAllMocks();
    delete (window as WindowWithDataLayer).dataLayer;
  });

  it("loads no container when the host does not qualify", () => {
    // The staging branch carries this code, so this branch of the check is the only
    // thing keeping preview traffic out of the container.
    mockShouldLoad.mockReturnValue(false);
    render(<GoogleTagManager />);
    expect(injectedContainerIds()).toEqual([]);
    expect(gtmBootstrapped()).toBe(false);
  });

  it("writes no container id into the page when the host does not qualify", () => {
    mockShouldLoad.mockReturnValue(false);
    render(<GoogleTagManager />);
    const inline = Array.from(document.querySelectorAll("script"))
      .map((s) => s.textContent ?? "")
      .join("");
    expect(inline).not.toContain("GTM-NTBDX6K2");
  });

  it("decides using the browser's actual hostname", () => {
    mockShouldLoad.mockReturnValue(false);
    render(<GoogleTagManager />);
    expect(mockShouldLoad).toHaveBeenCalledWith(window.location.hostname);
  });

  it("bootstraps the container when the host qualifies", () => {
    mockShouldLoad.mockReturnValue(true);
    render(<GoogleTagManager />);
    expect(gtmBootstrapped()).toBe(true);
    expect(injectedContainerIds()).toContain("GTM-NTBDX6K2");
  });
});
