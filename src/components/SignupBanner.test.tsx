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
    expect(screen.getAllByText(/2026 Weekly Class Schedule/i).length).toBeGreaterThan(0);
  });

  it("renders the student trust line", () => {
    render(<SignupBanner />);
    expect(screen.getByText(/20,000 students/i)).toBeInTheDocument();
  });

  it("shows an expand button on mobile (collapsed by default)", () => {
    render(<SignupBanner />);
    expect(screen.getByLabelText("Expand banner")).toBeInTheDocument();
  });

  it("toggles to collapsed state when collapse button is clicked", async () => {
    const user = userEvent.setup();
    render(<SignupBanner />);
    await user.click(screen.getByLabelText("Expand banner"));
    expect(screen.getByLabelText("Collapse banner")).toBeInTheDocument();
  });
});
