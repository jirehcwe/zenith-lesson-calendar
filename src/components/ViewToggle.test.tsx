import { render, screen, fireEvent } from "@testing-library/react";
import ViewToggle from "./ViewToggle";

describe("ViewToggle", () => {
  it("renders Calendar and List buttons", () => {
    render(<ViewToggle currentView="calendar" onViewChange={() => {}} />);
    expect(screen.getByRole("button", { name: /calendar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /list/i })).toBeInTheDocument();
  });

  it("calls onViewChange('list') when List is clicked", () => {
    const onViewChange = jest.fn();
    render(<ViewToggle currentView="calendar" onViewChange={onViewChange} />);
    fireEvent.click(screen.getByRole("button", { name: /list/i }));
    expect(onViewChange).toHaveBeenCalledWith("list");
  });
});
