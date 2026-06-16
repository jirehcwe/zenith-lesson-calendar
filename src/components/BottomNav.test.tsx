import { render, screen } from "@testing-library/react";
import BottomNav from "./BottomNav";

const baseProps = {
  currentView: "calendar" as const,
  onViewChange: () => {},
  onOpenFilter: () => {},
};

describe("BottomNav", () => {
  it("shows the Filter tab by default", () => {
    render(<BottomNav {...baseProps} />);
    expect(screen.getByText("Filter")).toBeInTheDocument();
  });

  it("hides the Filter tab when showFilterButton is false", () => {
    render(<BottomNav {...baseProps} showFilterButton={false} />);
    expect(screen.queryByText("Filter")).not.toBeInTheDocument();
    // view toggle remains
    expect(screen.getByText("Calendar")).toBeInTheDocument();
    expect(screen.getByText("List")).toBeInTheDocument();
  });
});
