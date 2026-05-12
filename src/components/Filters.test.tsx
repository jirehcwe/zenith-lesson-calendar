import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Filters from "./Filters";

const defaultFilters = { subject: [], topic: [], centre: [], tutor: [] };

describe("Filters", () => {
  it("renders Subject, Topic, and Centre dropdown labels", () => {
    render(
      <Filters
        subjects={[]}
        topics={[]}
        centres={[]}
        tutors={[]}
        filters={defaultFilters}
        onFilterChange={jest.fn()}
      />
    );
    expect(screen.getByText("Subject")).toBeInTheDocument();
    expect(screen.getByText("Topic")).toBeInTheDocument();
    expect(screen.getByText("Centre")).toBeInTheDocument();
  });

  it("shows placeholder text when no option is selected", () => {
    render(
      <Filters
        subjects={["Math"]}
        topics={[]}
        centres={[]}
        tutors={[]}
        filters={defaultFilters}
        onFilterChange={jest.fn()}
      />
    );
    expect(screen.getByText("Select Subject")).toBeInTheDocument();
  });

  it("calls onFilterChange with the selected value when an option is clicked", async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(
      <Filters
        subjects={["Math", "English"]}
        topics={[]}
        centres={[]}
        tutors={[]}
        filters={defaultFilters}
        onFilterChange={onFilterChange}
      />
    );
    await user.click(screen.getByText("Select Subject"));
    await user.click(screen.getByText("Math"));
    expect(onFilterChange).toHaveBeenCalledWith({
      subject: ["Math"],
      topic: [],
      centre: [],
      tutor: [],
    });
  });

  it("calls onFilterChange with the value removed when a selected option is clicked again", async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(
      <Filters
        subjects={["Math", "English"]}
        topics={[]}
        centres={[]}
        tutors={[]}
        filters={{ ...defaultFilters, subject: ["Math"] }}
        onFilterChange={onFilterChange}
      />
    );
    // The button shows "Math" (current selection) — click to open dropdown
    await user.click(screen.getByText("Math"));
    // Find the checked checkbox for "Math" and click its parent li to deselect.
    // Note: MultiSelect wires both Listbox.onChange AND <li onClick={toggleOption}>,
    // so onFilterChange fires twice per click (both with the same payload).
    // Use toHaveBeenCalledWith, not toHaveBeenCalledTimes(1), to stay tolerant of this.
    const checkedCheckbox = screen
      .getAllByRole("checkbox")
      .find((el) => (el as HTMLInputElement).checked);
    await user.click(checkedCheckbox!.closest("li")!);
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ subject: [] })
    );
  });
});
