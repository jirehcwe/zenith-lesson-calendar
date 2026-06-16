import { render, screen, fireEvent } from "@testing-library/react";
import PinnedBanner from "./PinnedBanner";

describe("PinnedBanner", () => {
  it("shows the count with pluralized 'classes'", () => {
    render(<PinnedBanner count={2} onShowAll={() => {}} />);
    expect(screen.getByText(/2 selected classes/i)).toBeInTheDocument();
  });

  it("uses singular 'class' when count is 1", () => {
    render(<PinnedBanner count={1} onShowAll={() => {}} />);
    expect(screen.getByText(/1 selected class\b/i)).toBeInTheDocument();
  });

  it("calls onShowAll when the button is clicked", () => {
    const onShowAll = jest.fn();
    render(<PinnedBanner count={3} onShowAll={onShowAll} />);
    fireEvent.click(screen.getByRole("button", { name: /show all classes/i }));
    expect(onShowAll).toHaveBeenCalledTimes(1);
  });
});
