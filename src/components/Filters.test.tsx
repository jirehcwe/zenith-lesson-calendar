import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Filters from "./Filters";

type OptionWithCount = { value: string; count: number; selected: boolean };

const opt = (value: string, count = 1): OptionWithCount => ({ value, count, selected: false });

const defaultFilters = { subject: [], centre: [], tutor: [], level: [], stream: null };

describe("Filters", () => {
  it("renders stream buttons for each stream", () => {
    render(
      <Filters
        streams={["JC", "Secondary (Express)"]}
        levels={[]}
        subjects={[]}
        centres={[]}
        tutors={[]}
        filters={defaultFilters}
        onFilterChange={jest.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "JC" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Secondary (Express)" })).toBeInTheDocument();
  });

  it("renders Level, Subject, and Centre dropdown labels", () => {
    render(
      <Filters
        streams={[]}
        levels={[]}
        subjects={[]}
        centres={[]}
        tutors={[]}
        filters={defaultFilters}
        onFilterChange={jest.fn()}
      />
    );
    expect(screen.getByText("Level")).toBeInTheDocument();
    expect(screen.getByText("Subject")).toBeInTheDocument();
    expect(screen.getByText("Centre")).toBeInTheDocument();
  });

  it("calls onFilterChange with selected stream when a stream button is clicked", async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(
      <Filters
        streams={["JC", "Secondary (Express)"]}
        levels={[]}
        subjects={[]}
        centres={[]}
        tutors={[]}
        filters={defaultFilters}
        onFilterChange={onFilterChange}
      />
    );
    await user.click(screen.getByRole("button", { name: "JC" }));
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ stream: "JC" })
    );
  });

  it("calls onFilterChange with stream=null when clear stream button is clicked", async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(
      <Filters
        streams={["JC"]}
        levels={[]}
        subjects={[]}
        centres={[]}
        tutors={[]}
        filters={{ ...defaultFilters, stream: "JC" }}
        onFilterChange={onFilterChange}
      />
    );
    await user.click(screen.getByLabelText("Clear stream selection"));
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ stream: null })
    );
  });

  it("shows placeholder when no subject is selected", () => {
    render(
      <Filters
        streams={[]}
        levels={[]}
        subjects={[opt("Math")]}
        centres={[]}
        tutors={[]}
        filters={defaultFilters}
        onFilterChange={jest.fn()}
      />
    );
    expect(screen.getByText("Select Subject")).toBeInTheDocument();
  });

  it("calls onFilterChange with selected subject when a subject option is clicked", async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(
      <Filters
        streams={[]}
        levels={[]}
        subjects={[opt("Math"), opt("English")]}
        centres={[]}
        tutors={[]}
        filters={defaultFilters}
        onFilterChange={onFilterChange}
      />
    );
    await user.click(screen.getByText("Select Subject"));
    await user.click(screen.getByText("Math"));
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ subject: ["Math"] })
    );
  });
});
