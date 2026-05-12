import { render, screen } from "@testing-library/react";
import BottomBanner from "./BottomBanner";

jest.mock("@vercel/analytics", () => ({ track: jest.fn() }));

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
});
