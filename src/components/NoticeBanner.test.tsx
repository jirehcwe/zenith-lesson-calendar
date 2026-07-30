import { render, screen, fireEvent } from "@testing-library/react";
import NoticeBanner from "./NoticeBanner";

describe("NoticeBanner", () => {
  it("renders the message it is given", () => {
    render(<NoticeBanner message="You're viewing Alicia's classes" onShowAll={() => {}} />);
    expect(screen.getByText("You're viewing Alicia's classes")).toBeInTheDocument();
  });

  it("renders a multi-tutor message", () => {
    render(
      <NoticeBanner message="You're viewing classes taught by Alicia and DJ" onShowAll={() => {}} />,
    );
    expect(screen.getByText(/taught by Alicia and DJ/)).toBeInTheDocument();
  });

  it("renders the dead-link message", () => {
    render(
      <NoticeBanner message="We couldn't find any classes for this link." onShowAll={() => {}} />,
    );
    expect(screen.getByText(/couldn't find any classes/i)).toBeInTheDocument();
  });

  it("still offers the escape hatch when the link is dead", () => {
    const onShowAll = jest.fn();
    render(
      <NoticeBanner message="We couldn't find any classes for this link." onShowAll={onShowAll} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /show all classes/i }));
    expect(onShowAll).toHaveBeenCalledTimes(1);
  });

  it("omits the escape hatch when there is nowhere to escape to", () => {
    // The unpinned caller's shape. "Show all classes →" is the pin's exit; an
    // unpinned visitor is already looking at all classes, so rendering it there
    // offers a control that changes nothing about the page they are on — and, on
    // the load-failure notice, one that looks like the retry this deliberately
    // does not implement.
    render(<NoticeBanner message="We couldn't load the schedule. Please try again." />);
    expect(
      screen.getByText("We couldn't load the schedule. Please try again."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
