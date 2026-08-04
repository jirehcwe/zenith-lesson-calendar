import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Filters from "./Filters";

type OptionWithCount = { value: string; count: number; selected: boolean };
const opt = (value: string, count = 1): OptionWithCount => ({ value, count, selected: false });
const defaultFilters = { subject: [], centre: [], level: [], stream: null };

const baseProps = {
  streams: [] as OptionWithCount[],
  levels: [] as OptionWithCount[],
  subjects: [] as OptionWithCount[],
  centres: [] as OptionWithCount[],
  filters: defaultFilters,
  onFilterChange: jest.fn(),
  currentView: "calendar" as const,
  onViewChange: jest.fn(),
  totalCount: 0,
};

describe("Filters", () => {
  it("renders stream buttons for each stream", () => {
    render(<Filters {...baseProps} streams={[opt("JC"), opt("Secondary Exp")]} />);
    // Pill text is "JC 1" and "Sec Express 1" (label + count); use regex
    expect(screen.getByRole("button", { name: /^JC/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sec Express/ })).toBeInTheDocument();
  });

  it("renders Level, Subject, and Centre dropdown labels", () => {
    render(<Filters {...baseProps} />);
    expect(screen.getByText("Level")).toBeInTheDocument();
    expect(screen.getByText("Subject")).toBeInTheDocument();
    expect(screen.getByText("Centre")).toBeInTheDocument();
  });

  it("calls onFilterChange with selected stream when a stream button is clicked", async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(<Filters {...baseProps} streams={[opt("JC"), opt("Secondary Exp")]} onFilterChange={onFilterChange} />);
    await user.click(screen.getByRole("button", { name: /^JC/ }));
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ stream: "JC" }));
  });

  it("calls onFilterChange with stream=null when the active stream pill is clicked again", async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(
      <Filters
        {...baseProps}
        streams={[opt("JC")]}
        filters={{ ...defaultFilters, stream: "JC" }}
        onFilterChange={onFilterChange}
      />
    );
    // Clicking the already-active stream pill toggles it off (pill is first match; chip is second)
    await user.click(screen.getAllByRole("button", { name: /^JC/ })[0]);
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ stream: null }));
  });

  it("shows placeholder when no subject is selected", () => {
    render(<Filters {...baseProps} subjects={[opt("Math")]} />);
    expect(screen.getByText("Subject")).toBeInTheDocument();
  });

  it("calls onFilterChange with selected subject when a subject option is clicked", async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(<Filters {...baseProps} subjects={[opt("Math"), opt("English")]} onFilterChange={onFilterChange} />);
    await user.click(screen.getByText("Subject"));
    await user.click(screen.getByText("Math"));
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ subject: ["Math"] }));
  });

  it("renders Calendar and List view toggle buttons when showViewToggle is true", () => {
    render(<Filters {...baseProps} showViewToggle />);
    expect(screen.getByRole("button", { name: /Calendar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /List/i })).toBeInTheDocument();
  });

  it("hides view toggle buttons when showViewToggle is false", () => {
    render(<Filters {...baseProps} showViewToggle={false} />);
    expect(screen.queryByRole("button", { name: /Calendar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /List/i })).not.toBeInTheDocument();
  });

  it("calls onViewChange with 'list' when List button is clicked", async () => {
    const user = userEvent.setup();
    const onViewChange = jest.fn();
    render(<Filters {...baseProps} showViewToggle onViewChange={onViewChange} />);
    await user.click(screen.getByRole("button", { name: /List/i }));
    expect(onViewChange).toHaveBeenCalledWith("list");
  });

  it("shows class count in summary row when filters are active", () => {
    render(
      <Filters
        {...baseProps}
        streams={[opt("JC")]}
        filters={{ ...defaultFilters, stream: "JC" }}
        totalCount={5}
      />
    );
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText(/classes/i)).toBeInTheDocument();
  });

  it("shows a chip for the active stream filter in the summary row", () => {
    render(
      <Filters
        {...baseProps}
        streams={[opt("JC")]}
        filters={{ ...defaultFilters, stream: "JC" }}
        totalCount={3}
      />
    );
    // "JC" appears in the stream pill AND in the summary row chip
    expect(screen.getAllByText(/JC/).length).toBeGreaterThanOrEqual(2);
  });

  it("calls onFilterChange to reset all when Clear all is clicked", async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(
      <Filters
        {...baseProps}
        streams={[opt("JC")]}
        filters={{ ...defaultFilters, stream: "JC" }}
        onFilterChange={onFilterChange}
        totalCount={3}
      />
    );
    await user.click(screen.getAllByText("Clear all")[0]);
    expect(onFilterChange).toHaveBeenCalledWith({
      subject: [], centre: [], level: [], stream: null,
    });
  });

  it("does not show summary row when no filters are active", () => {
    render(<Filters {...baseProps} totalCount={0} />);
    expect(screen.queryByText("Clear all")).not.toBeInTheDocument();
  });

  it("opens the Level dropdown when triggerLevelOpen is true", async () => {
    render(
      <Filters
        {...baseProps}
        levels={[opt("J1"), opt("J2")]}
        triggerLevelOpen
      />
    );
    expect(await screen.findByText("J1")).toBeInTheDocument();
    expect(screen.getByText("J2")).toBeInTheDocument();
  });
});

describe("Filters — mobile layout (openUpward=true)", () => {
  it("renders a visible label element for each dropdown", () => {
    render(<Filters {...baseProps} openUpward />);
    // Non-compact mode renders a <label> element above each dropdown button
    // (desktop compact mode omits the <label> entirely)
    expect(screen.getByText("Level", { selector: "label" })).toBeInTheDocument();
    expect(screen.getByText("Subject", { selector: "label" })).toBeInTheDocument();
    expect(screen.getByText("Centre", { selector: "label" })).toBeInTheDocument();
  });

  it("calls onFilterChange when a subject is selected in mobile mode", async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(
      <Filters
        {...baseProps}
        subjects={[opt("Math"), opt("English")]}
        onFilterChange={onFilterChange}
        openUpward
      />
    );
    await user.click(screen.getByRole("button", { name: /Subject/ }));
    await user.click(screen.getByText("Math"));
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ subject: ["Math"] }));
  });

  it("calls onFilterChange when a level is selected in mobile mode", async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(
      <Filters
        {...baseProps}
        levels={[opt("J1"), opt("J2")]}
        onFilterChange={onFilterChange}
        openUpward
      />
    );
    await user.click(screen.getByRole("button", { name: /Level/ }));
    await user.click(screen.getByText("J1"));
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ level: ["J1"] }));
  });

  it("does not render view toggle buttons in mobile mode even when showViewToggle is true", () => {
    render(<Filters {...baseProps} showViewToggle openUpward />);
    expect(screen.queryByRole("button", { name: /Calendar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /List/i })).not.toBeInTheDocument();
  });

  it("calls onFilterChange with selected stream in mobile mode", async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(
      <Filters
        {...baseProps}
        streams={[opt("JC"), opt("Primary")]}
        onFilterChange={onFilterChange}
        openUpward
      />
    );
    await user.click(screen.getByRole("button", { name: /^JC/ }));
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ stream: "JC" }));
  });

  it("shows active filter summary row in mobile mode", () => {
    render(
      <Filters
        {...baseProps}
        streams={[opt("JC")]}
        filters={{ ...defaultFilters, stream: "JC" }}
        totalCount={8}
        openUpward
      />
    );
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText(/classes/i)).toBeInTheDocument();
    expect(screen.getAllByText("Clear all").length).toBeGreaterThan(0);
  });
});
