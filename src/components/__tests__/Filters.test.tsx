import { render, screen } from "@testing-library/react";
import userEventDefault from "@testing-library/user-event";
import Filters from "../Filters";

const userEvent = (userEventDefault as unknown as { default?: typeof userEventDefault }).default ?? userEventDefault;

const STORAGE_KEY = "crashCourseFiltersCollapsed";

function renderFilters() {
  return render(
    <Filters
      subjects={["English", "Math"]}
      topics={["[English] Personal Recount"]}
      centres={["Marine Parade"]}
      tutors={[]}
      filters={{ subject: [], topic: [], centre: [], tutor: [], type: [] }}
      onFilterChange={() => {}}
    />
  );
}

describe("Filters collapse persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to expanded when no stored state", () => {
    renderFilters();
    expect(screen.getByText(/Filters/i)).toBeInTheDocument();
    // MultiSelect labels are visible when expanded
    expect(screen.getByText("Subject")).toBeInTheDocument();
  });

  it("persists collapsed state across renders", async () => {
    const user = userEvent.setup();
    const { unmount } = renderFilters();

    const toggle = screen.getByRole("button", { name: /Filters/i });
    await user.click(toggle);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("true");

    unmount();
    renderFilters();
    // Subject label should now be hidden (section collapsed)
    expect(screen.queryByText("Subject")).toBeNull();
  });
});
