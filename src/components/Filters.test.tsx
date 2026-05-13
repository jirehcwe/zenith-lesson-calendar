import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Filters from "./Filters";

type OptionWithCount = { value: string; count: number; selected: boolean };
const opt = (value: string, count = 1): OptionWithCount => ({ value, count, selected: false });
const defaultFilters = { subject: [], centre: [], tutor: [], level: [], stream: null };

const baseProps = {
  streams: [] as string[],
  levels: [] as OptionWithCount[],
  subjects: [] as OptionWithCount[],
  centres: [] as OptionWithCount[],
  tutors: [] as OptionWithCount[],
  filters: defaultFilters,
  onFilterChange: jest.fn(),
  searchQuery: "",
  onSearchChange: jest.fn(),
  currentView: "calendar" as const,
  onViewChange: jest.fn(),
  totalCount: 0,
};

describe("Filters", () => {
  it("renders stream buttons for each stream", () => {
    render(<Filters {...baseProps} streams={["JC", "Secondary (Express)"]} />);
    expect(screen.getByRole("button", { name: "JC" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Secondary (Express)" })).toBeInTheDocument();
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
    render(<Filters {...baseProps} streams={["JC", "Secondary (Express)"]} onFilterChange={onFilterChange} />);
    await user.click(screen.getByRole("button", { name: "JC" }));
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ stream: "JC" }));
  });

  it("calls onFilterChange with stream=null when clear stream button is clicked", async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(
      <Filters {...baseProps} streams={["JC"]} filters={{ ...defaultFilters, stream: "JC" }} onFilterChange={onFilterChange} />
    );
    await user.click(screen.getByLabelText("Clear stream selection"));
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ stream: null }));
  });

  it("shows placeholder when no subject is selected", () => {
    render(<Filters {...baseProps} subjects={[opt("Math")]} />);
    expect(screen.getByText("Select Subject")).toBeInTheDocument();
  });

  it("calls onFilterChange with selected subject when a subject option is clicked", async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(<Filters {...baseProps} subjects={[opt("Math"), opt("English")]} onFilterChange={onFilterChange} />);
    await user.click(screen.getByText("Select Subject"));
    await user.click(screen.getByText("Math"));
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ subject: ["Math"] }));
  });

  it("renders a search input with correct placeholder", () => {
    render(<Filters {...baseProps} />);
    expect(screen.getByPlaceholderText("Search subject or centre…")).toBeInTheDocument();
  });

  it("calls onSearchChange when the search input changes", async () => {
    const user = userEvent.setup();
    const onSearchChange = jest.fn();
    render(<Filters {...baseProps} onSearchChange={onSearchChange} />);
    await user.type(screen.getByPlaceholderText("Search subject or centre…"), "Math");
    expect(onSearchChange).toHaveBeenCalled();
  });

  it("renders Calendar and List view toggle buttons", () => {
    render(<Filters {...baseProps} />);
    expect(screen.getByRole("button", { name: /Calendar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /List/i })).toBeInTheDocument();
  });

  it("calls onViewChange with 'list' when List button is clicked", async () => {
    const user = userEvent.setup();
    const onViewChange = jest.fn();
    render(<Filters {...baseProps} onViewChange={onViewChange} />);
    await user.click(screen.getByRole("button", { name: /List/i }));
    expect(onViewChange).toHaveBeenCalledWith("list");
  });

  it("shows class count in summary row when filters are active", () => {
    render(
      <Filters
        {...baseProps}
        streams={["JC"]}
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
        streams={["JC"]}
        filters={{ ...defaultFilters, stream: "JC" }}
        totalCount={3}
      />
    );
    // "JC" appears as stream button AND as chip in summary row
    expect(screen.getAllByText("JC").length).toBeGreaterThanOrEqual(2);
  });

  it("calls onFilterChange to reset all when Clear all is clicked", async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(
      <Filters
        {...baseProps}
        streams={["JC"]}
        filters={{ ...defaultFilters, stream: "JC" }}
        onFilterChange={onFilterChange}
        totalCount={3}
      />
    );
    await user.click(screen.getByText("Clear all"));
    expect(onFilterChange).toHaveBeenCalledWith({
      subject: [], centre: [], tutor: [], level: [], stream: null,
    });
  });

  it("does not show summary row when no filters are active", () => {
    render(<Filters {...baseProps} totalCount={0} />);
    expect(screen.queryByText("Clear all")).not.toBeInTheDocument();
  });
});
