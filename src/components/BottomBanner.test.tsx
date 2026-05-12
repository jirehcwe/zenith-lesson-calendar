import { render, screen } from "@testing-library/react";
import BottomBanner from "./BottomBanner";

jest.mock("@/utils/campaign", () => ({
  replaceCampaignInUrl: (url: string) => url,
  replacePromocodeInUrl: (url: string) => url,
}));

describe("BottomBanner", () => {
  it("renders without crashing", () => {
    render(<BottomBanner />);
  });

  it("renders a signup link", () => {
    render(<BottomBanner />);
    expect(
      screen.getByRole("link", { name: /Click here to sign up/i })
    ).toBeInTheDocument();
  });

  it("signup link opens in a new tab", () => {
    render(<BottomBanner />);
    const link = screen.getByRole("link", { name: /Click here to sign up/i });
    expect(link).toHaveAttribute("target", "_blank");
  });
});
