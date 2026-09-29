import { render } from "@testing-library/react";
import GoogleTagManager from "../GoogleTagManager";
import { gtmContainerFor } from "@/utils/analytics";

// jsdom will not let `window.location.hostname` be redefined, so drive the
// component through the decision function. Which hosts it accepts is covered in
// src/utils/__tests__/analytics.test.ts; the seam test below pins that the real
// hostname and the slug are what get passed in.
jest.mock("@/utils/analytics", () => ({
  ...jest.requireActual("@/utils/analytics"),
  gtmContainerFor: jest.fn(),
}));

const mockContainerFor = gtmContainerFor as jest.MockedFunction<typeof gtmContainerFor>;

type WindowWithDataLayer = Window & { dataLayer?: unknown[] };

function gtmBootstrapped(): boolean {
  const layer = (window as WindowWithDataLayer).dataLayer ?? [];
  return layer.some((e) => typeof e === "object" && e !== null && "gtm.start" in e);
}

function injectedContainerIds(): string[] {
  return Array.from(
    document.querySelectorAll<HTMLScriptElement>('script[src*="/gtm.js"]')
  ).map((s) => new URL(s.src).searchParams.get("id") ?? "");
}

/**
 * ORDER MATTERS. next/script caches every script id it has loaded at module
 * scope, and the cache survives between tests. The "loads nothing" cases must
 * run before the loading case, or they become vacuous and pass whatever the
 * component does.
 */
describe("GoogleTagManager", () => {
  afterEach(() => {
    jest.clearAllMocks();
    delete (window as WindowWithDataLayer).dataLayer;
  });

  it("loads no container when the host does not qualify", () => {
    mockContainerFor.mockReturnValue(null);
    render(<GoogleTagManager slug="pri-sep-2026" />);
    expect(injectedContainerIds()).toEqual([]);
    expect(gtmBootstrapped()).toBe(false);
  });

  it("writes no container id into the page when the host does not qualify", () => {
    mockContainerFor.mockReturnValue(null);
    render(<GoogleTagManager slug="pri-sep-2026" />);
    const inline = Array.from(document.querySelectorAll("script"))
      .map((s) => s.textContent ?? "")
      .join("");
    expect(inline).not.toContain("GTM-");
  });

  it("decides using the slug and the browser's actual hostname", () => {
    mockContainerFor.mockReturnValue(null);
    render(<GoogleTagManager slug="pri-sep-2026" />);
    expect(mockContainerFor).toHaveBeenCalledWith("pri-sep-2026", window.location.hostname);
  });

  it("bootstraps the container the decision returns", () => {
    mockContainerFor.mockReturnValue("GTM-W9TJKN3L");
    render(<GoogleTagManager slug="pri-sep-2026" />);
    expect(gtmBootstrapped()).toBe(true);
    expect(injectedContainerIds()).toContain("GTM-W9TJKN3L");
  });
});
