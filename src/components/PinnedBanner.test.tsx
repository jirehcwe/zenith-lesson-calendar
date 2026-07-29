import { render, screen, fireEvent } from "@testing-library/react";
import PinnedBanner from "./PinnedBanner";

describe("PinnedBanner", () => {
  it("renders the message it is given", () => {
    render(<PinnedBanner message="You're viewing Alicia's classes" onShowAll={() => {}} />);
    expect(screen.getByText("You're viewing Alicia's classes")).toBeInTheDocument();
  });

  it("renders a multi-tutor message", () => {
    render(
      <PinnedBanner message="You're viewing classes taught by Alicia and DJ" onShowAll={() => {}} />,
    );
    expect(screen.getByText(/taught by Alicia and DJ/)).toBeInTheDocument();
  });

  it("renders the dead-link message", () => {
    render(
      <PinnedBanner message="We couldn't find any classes for this link." onShowAll={() => {}} />,
    );
    expect(screen.getByText(/couldn't find any classes/i)).toBeInTheDocument();
  });

  it("still offers the escape hatch when the link is dead", () => {
    const onShowAll = jest.fn();
    render(
      <PinnedBanner message="We couldn't find any classes for this link." onShowAll={onShowAll} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /show all classes/i }));
    expect(onShowAll).toHaveBeenCalledTimes(1);
  });
});
