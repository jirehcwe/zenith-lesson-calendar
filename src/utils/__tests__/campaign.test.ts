/**
 * @jest-environment jsdom
 */
import {
  getCampaignParam,
  getPromocodeParam,
  replaceCampaignInUrl,
  replacePromocodeInUrl,
  replaceUrlPlaceholders,
} from "../campaign";

describe("campaign/promocode URL utilities", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  describe("getCampaignParam", () => {
    it("returns SCHEDULE when no campaign param is present", () => {
      expect(getCampaignParam()).toBe("SCHEDULE");
    });

    it("returns the campaign query value when present", () => {
      window.history.pushState({}, "", "/?campaign=EMAIL_AUG");
      expect(getCampaignParam()).toBe("EMAIL_AUG");
    });
  });

  describe("replaceCampaignInUrl", () => {
    it("substitutes SCHEDULE with the campaign value", () => {
      window.history.pushState({}, "", "/?campaign=TIKTOK");
      expect(replaceCampaignInUrl("https://form?entry.1=SCHEDULE")).toBe(
        "https://form?entry.1=TIKTOK"
      );
    });

    it("leaves SCHEDULE unchanged when no campaign param is set", () => {
      expect(replaceCampaignInUrl("https://form?entry.1=SCHEDULE&x=1")).toBe(
        "https://form?entry.1=SCHEDULE&x=1"
      );
    });

    it("replaces every occurrence of SCHEDULE", () => {
      window.history.pushState({}, "", "/?campaign=X");
      expect(replaceCampaignInUrl("SCHEDULE/SCHEDULE?k=SCHEDULE")).toBe("X/X?k=X");
    });
  });

  describe("getPromocodeParam", () => {
    it("returns empty string when no promocode param is present", () => {
      expect(getPromocodeParam()).toBe("");
    });

    it("returns the promocode query value when present", () => {
      window.history.pushState({}, "", "/?promocode=SAVE20");
      expect(getPromocodeParam()).toBe("SAVE20");
    });
  });

  describe("replacePromocodeInUrl", () => {
    it("substitutes PROMOCODE with the promocode value", () => {
      window.history.pushState({}, "", "/?promocode=ABC");
      expect(replacePromocodeInUrl("form?promo=PROMOCODE")).toBe("form?promo=ABC");
    });

    it("replaces PROMOCODE with empty string when param is absent", () => {
      expect(replacePromocodeInUrl("form?promo=PROMOCODE")).toBe("form?promo=");
    });
  });

  describe("replaceUrlPlaceholders", () => {
    it("applies both SCHEDULE and PROMOCODE substitutions", () => {
      window.history.pushState({}, "", "/?campaign=CAM&promocode=PRM");
      expect(replaceUrlPlaceholders("?c=SCHEDULE&p=PROMOCODE")).toBe("?c=CAM&p=PRM");
    });
  });
});
