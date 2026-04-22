/**
 * @jest-environment jsdom
 */
import { buildRegistrationUrl } from "../registration";

const baseWithQuery =
  "https://docs.google.com/forms/d/e/FORMID/viewform?entry.1157532004=SCHEDULE";
const baseNoQuery = "https://docs.google.com/forms/d/e/FORMID/viewform";

const session = {
  prefill: "[S1 English] Marine Parade | 06 Sep (Sat) | 11:15AM - 01:15PM",
  prefillField: "1016736042",
};

describe("buildRegistrationUrl", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("appends the prefill entry with `&` when the base URL already has a query", () => {
    const url = buildRegistrationUrl(baseWithQuery, session);
    expect(url).toContain("?entry.1157532004=SCHEDULE&entry.1016736042=");
  });

  it("appends the prefill entry with `?` when the base URL has no query", () => {
    const url = buildRegistrationUrl(baseNoQuery, session);
    expect(url.startsWith(`${baseNoQuery}?entry.1016736042=`)).toBe(true);
  });

  it("url-encodes the prefill value", () => {
    const url = buildRegistrationUrl(baseWithQuery, session);
    expect(url).toContain(encodeURIComponent(session.prefill));
    expect(url).not.toContain(session.prefill);
  });

  it("substitutes the SCHEDULE placeholder when ?campaign= is present", () => {
    window.history.pushState({}, "", "/?campaign=PROMO_AUG");
    const url = buildRegistrationUrl(baseWithQuery, session);
    expect(url).toContain("entry.1157532004=PROMO_AUG");
    expect(url).not.toContain("=SCHEDULE");
  });

  it("substitutes PROMOCODE when present in the base URL and ?promocode= is set", () => {
    window.history.pushState({}, "", "/?promocode=SAVE20");
    const url = buildRegistrationUrl(
      `${baseWithQuery}&entry.9999=PROMOCODE`,
      session
    );
    expect(url).toContain("entry.9999=SAVE20");
  });
});
