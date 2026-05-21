import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupBanner from "./SignupBanner";

jest.mock("next/image", () => {
  const MockImage = ({ alt }: { alt: string }) => <img alt={alt} />;
  MockImage.displayName = "Image";
  return MockImage;
});

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

  it("shows a collapse button by default (banner starts expanded)", () => {
    render(<SignupBanner />);
    expect(screen.getByLabelText("Collapse banner")).toBeInTheDocument();
  });

  it("toggles to collapsed state when collapse button is clicked", async () => {
    const user = userEvent.setup();
    render(<SignupBanner />);
    await user.click(screen.getByLabelText("Collapse banner"));
    expect(screen.getByLabelText("Expand banner")).toBeInTheDocument();
  });

  it("renders the eyebrow pill in the desktop layout", () => {
    render(<SignupBanner />);
    expect(screen.getAllByText(/Now booking/i).length).toBeGreaterThan(0);
  });
});
