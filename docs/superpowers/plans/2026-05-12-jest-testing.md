# Jest Testing Setup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Jest + React Testing Library unit tests for pure utility functions and React components, runnable via `npm run test` or `yarn test`.

**Architecture:** Use `next/jest` as the Jest transformer (SWC-based; auto-handles TypeScript, module aliases, and CSS mocking). Extract two pure functions (`applyFilters`, `normalizeDate`) from components into `src/utils/` for direct unit testing. Mock FullCalendar and Vercel Analytics to isolate component tests from external dependencies.

**Tech Stack:** Jest 29, @testing-library/react 16, @testing-library/user-event 14, @testing-library/jest-dom 6, next/jest (Next.js 15 built-in)

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Create | `jest.config.ts` | Jest config using next/jest factory |
| Create | `jest.setup.ts` | Imports @testing-library/jest-dom matchers |
| Create | `__mocks__/@fullcalendar/react.tsx` | FullCalendar mock rendering buttons |
| Create | `__mocks__/@fullcalendar/timegrid.ts` | Empty plugin mock |
| Create | `__mocks__/@fullcalendar/daygrid.ts` | Empty plugin mock |
| Create | `src/utils/filters.ts` | Extracted `applyFilters` function |
| Create | `src/utils/filters.test.ts` | Unit tests for applyFilters |
| Create | `src/utils/dates.ts` | Extracted `normalizeDate` function |
| Create | `src/utils/dates.test.ts` | Unit tests for normalizeDate |
| Create | `src/components/CalendarView.test.tsx` | Component tests for CalendarView |
| Create | `src/components/Filters.test.tsx` | Component tests for Filters |
| Create | `src/components/ListView.test.tsx` | Component tests for ListView |
| Create | `src/components/SignupBanner.test.tsx` | Render test for SignupBanner |
| Create | `src/components/BottomBanner.test.tsx` | Render test for BottomBanner |
| Modify | `src/app/page.tsx` | Import applyFilters from utils; pass filters arg |
| Modify | `src/components/ListView.tsx` | Import normalizeDate from utils |
| Modify | `package.json` | Add test scripts + devDependencies |

---

### Task 1: Install dependencies and configure Jest

**Files:**
- Modify: `package.json`
- Create: `jest.config.ts`
- Create: `jest.setup.ts`

- [ ] **Step 1: Install Jest packages**

Use whichever package manager the project uses (the project has both `package-lock.json` and `.yarn/` — pick one and stick to it to avoid lockfile drift):

```bash
# npm
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest

# yarn
yarn add --dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest
```

- [ ] **Step 2: Add test scripts to package.json**

In `package.json`, update `"scripts"` to add:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "jest",
  "test:coverage": "jest --coverage"
}
```

- [ ] **Step 3: Create jest.config.ts**

Create `jest.config.ts` at the project root:

```ts
import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
};

export default createJestConfig(config);
```

- [ ] **Step 4: Create jest.setup.ts**

Create `jest.setup.ts` at the project root:

```ts
import "@testing-library/jest-dom";
```

- [ ] **Step 5: Verify Jest and jest-dom are wired up correctly**

Create a temporary file `src/smoke.test.ts`:

```ts
test("jest-dom matchers load correctly", () => {
  const el = document.createElement("div");
  document.body.appendChild(el);
  expect(el).toBeInTheDocument();
});
```

Run it:
```bash
npm run test -- src/smoke.test.ts
```

Expected: PASS. If you see `toBeInTheDocument is not a function`, the `setupFilesAfterEnv` option in `jest.config.ts` is misconfigured — double-check the option name and the path to `jest.setup.ts`.

Delete `src/smoke.test.ts` after it passes.

If you see a module error for `next/jest.js`, confirm `package.json` has `"next": "15.x.x"`.

- [ ] **Step 6: Commit**

```bash
git add jest.config.ts jest.setup.ts package.json package-lock.json
git commit -m "chore: install Jest and configure next/jest"
```

---

### Task 2: Extract applyFilters to src/utils/filters.ts (TDD)

**Files:**
- Create: `src/utils/filters.test.ts`
- Create: `src/utils/filters.ts`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/utils/filters.test.ts`:

```ts
import { applyFilters } from "./filters";
import { Session } from "../types";

const makeSession = (overrides: Partial<Session> = {}): Session => ({
  subject: "Math",
  tutor: "Alice",
  centre: "City",
  classroom: "Room 1",
  topic: "Algebra",
  date: "24 May",
  startTime: "10:00",
  endTime: "12:00",
  level: "Secondary",
  prefill: "",
  prefillField: "",
  ...overrides,
});

const emptyFilters = { subject: [], topic: [], centre: [], tutor: [] };

describe("applyFilters", () => {
  it("returns all sessions when all filters are empty", () => {
    const sessions = [makeSession(), makeSession({ subject: "English" })];
    expect(applyFilters(sessions, emptyFilters)).toHaveLength(2);
  });

  it("filters by subject", () => {
    const sessions = [makeSession({ subject: "Math" }), makeSession({ subject: "English" })];
    const result = applyFilters(sessions, { ...emptyFilters, subject: ["Math"] });
    expect(result).toHaveLength(1);
    expect(result[0].subject).toBe("Math");
  });

  it("filters by topic using [subject] topic format", () => {
    const sessions = [
      makeSession({ subject: "Math", topic: "Algebra" }),
      makeSession({ subject: "Math", topic: "Calculus" }),
    ];
    const result = applyFilters(sessions, { ...emptyFilters, topic: ["[Math] Algebra"] });
    expect(result).toHaveLength(1);
    expect(result[0].topic).toBe("Algebra");
  });

  it("filters by multiple fields (intersection)", () => {
    const sessions = [
      makeSession({ subject: "Math", centre: "City" }),
      makeSession({ subject: "Math", centre: "Suburbs" }),
      makeSession({ subject: "English", centre: "City" }),
    ];
    const result = applyFilters(sessions, {
      ...emptyFilters,
      subject: ["Math"],
      centre: ["City"],
    });
    expect(result).toHaveLength(1);
    expect(result[0].subject).toBe("Math");
    expect(result[0].centre).toBe("City");
  });

  it("returns empty array when no sessions match", () => {
    const sessions = [makeSession({ subject: "Math" })];
    const result = applyFilters(sessions, { ...emptyFilters, subject: ["English"] });
    expect(result).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm run test -- src/utils/filters.test.ts
```

Expected: FAIL — `Cannot find module './filters'`

- [ ] **Step 3: Create src/utils/filters.ts**

```ts
import { Session } from "../types";

type Filters = {
  subject: string[];
  topic: string[];
  centre: string[];
  tutor: string[];
};

export function applyFilters(sessions: Session[], filters: Filters): Session[] {
  return sessions.filter((s) => {
    return (
      (filters.subject.length === 0 || filters.subject.includes(s.subject)) &&
      (filters.topic.length === 0 ||
        filters.topic.includes(`[${s.subject}] ${s.topic}`)) &&
      (filters.centre.length === 0 || filters.centre.includes(s.centre)) &&
      (filters.tutor.length === 0 || filters.tutor.includes(s.tutor))
    );
  });
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm run test -- src/utils/filters.test.ts
```

Expected: PASS — `5 tests passed`

- [ ] **Step 5: Update src/app/page.tsx**

Add import at the top (after existing imports):

```ts
import { applyFilters } from "../utils/filters";
```

Remove the inline `applyFilters` arrow function (the block that starts with `// Generic filter logic` and ends with the closing `};`):

```ts
  // Generic filter logic
  const applyFilters = (sessions: Session[]) => {
    return sessions.filter((s) => {
      return (
        (filters.subject.length === 0 || filters.subject.includes(s.subject)) &&
        (filters.topic.length === 0 ||
          filters.topic.includes(`[${s.subject}] ${s.topic}`)) &&
        (filters.centre.length === 0 || filters.centre.includes(s.centre)) &&
        (filters.tutor.length === 0 || filters.tutor.includes(s.tutor))
      );
    });
  };
```

Update both useMemo calls to pass `filters` as a second argument (the extracted function requires it):

```ts
  const calendarFilteredSessions = useMemo(() => {
    const noFiltersSelected =
      filters.subject.length === 0 &&
      filters.topic.length === 0 &&
      filters.centre.length === 0 &&
      filters.tutor.length === 0;

    if (noFiltersSelected) return [];

    return applyFilters(sessions, filters);
  }, [sessions, filters]);

  const listFilteredSessions = useMemo(() => {
    return applyFilters(sessions, filters);
  }, [sessions, filters]);
```

- [ ] **Step 6: Run all tests**

```bash
npm run test
```

Expected: PASS — `5 tests passed`

- [ ] **Step 7: Commit**

```bash
git add src/utils/filters.ts src/utils/filters.test.ts src/app/page.tsx
git commit -m "feat(test): extract applyFilters and add unit tests"
```

---

### Task 3: Extract normalizeDate to src/utils/dates.ts (TDD)

**Files:**
- Create: `src/utils/dates.test.ts`
- Create: `src/utils/dates.ts`
- Modify: `src/components/ListView.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/utils/dates.test.ts`:

```ts
import { normalizeDate } from "./dates";

describe("normalizeDate", () => {
  it("converts a valid date string to YYYY-MM-DD format", () => {
    expect(normalizeDate("24 May")).toBe("2025-05-24");
  });

  it("pads single-digit day with a leading zero", () => {
    expect(normalizeDate("1 June")).toBe("2025-06-01");
  });

  it("returns null for an invalid date string", () => {
    expect(normalizeDate("not a date")).toBeNull();
  });

  it("returns null for a string with no recognisable date", () => {
    // Note: Date.parse(" 2025") is valid in V8 (parses as Jan 1), so an empty
    // string is NOT a safe invalid input. Use a string that can't be parsed.
    expect(normalizeDate("???")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm run test -- src/utils/dates.test.ts
```

Expected: FAIL — `Cannot find module './dates'`

- [ ] **Step 3: Create src/utils/dates.ts**

```ts
export function normalizeDate(raw: string): string | null {
  const parsed = Date.parse(`${raw} 2025`);
  if (isNaN(parsed)) return null;
  const d = new Date(parsed);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm run test -- src/utils/dates.test.ts
```

Expected: PASS — `4 tests passed`

- [ ] **Step 5: Update src/components/ListView.tsx**

Add import after existing imports:

```ts
import { normalizeDate } from "../utils/dates";
```

Remove the inline `normalizeDate` arrow function (the block starting with `// Normalize session date: ...`):

```ts
  // Normalize session date: "24 May" => "2025-05-24"
  const normalizeDate = (raw: string): string | null => {
    const parsed = Date.parse(`${raw} 2025`);
    if (isNaN(parsed)) return null;
    const d = new Date(parsed);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };
```

- [ ] **Step 6: Run all tests**

```bash
npm run test
```

Expected: PASS — `9 tests passed` (5 filters + 4 dates)

- [ ] **Step 7: Commit**

```bash
git add src/utils/dates.ts src/utils/dates.test.ts src/components/ListView.tsx
git commit -m "feat(test): extract normalizeDate and add unit tests"
```

---

### Task 4: Create FullCalendar mock and CalendarView tests

**Files:**
- Create: `__mocks__/@fullcalendar/react.tsx`
- Create: `__mocks__/@fullcalendar/timegrid.ts`
- Create: `__mocks__/@fullcalendar/daygrid.ts`
- Create: `src/components/CalendarView.test.tsx`

- [ ] **Step 1: Create the FullCalendar mock files**

Create directory and files at the project root (same level as `node_modules/`):

```bash
mkdir -p __mocks__/@fullcalendar
```

Create `__mocks__/@fullcalendar/react.tsx`:

```tsx
const FullCalendar = ({
  eventClick,
  events,
}: {
  eventClick?: (arg: { event: any }) => void;
  events?: any[];
  [key: string]: any;
}) => (
  <div data-testid="fullcalendar">
    {events?.map((e: any, i: number) => (
      <button key={i} onClick={() => eventClick?.({ event: e })}>
        {e.title}
      </button>
    ))}
  </div>
);

export default FullCalendar;
```

Create `__mocks__/@fullcalendar/timegrid.ts`:

```ts
export default {};
```

Create `__mocks__/@fullcalendar/daygrid.ts`:

```ts
export default {};
```

- [ ] **Step 2: Write CalendarView.test.tsx**

Create `src/components/CalendarView.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CalendarView from "./CalendarView";

jest.mock("@vercel/analytics", () => ({ track: jest.fn() }));

const mockEvents = [
  {
    title: "Math",
    start: new Date("2025-05-24T10:00:00"),
    end: new Date("2025-05-24T12:00:00"),
    extendedProps: {
      subject: "Math",
      topic: "Algebra",
      centre: "City",
      date: "24 May",
      startTime: "10:00",
      endTime: "12:00",
      level: "Secondary",
      prefill: "Math+Algebra",
      prefillField: "1234567890",
      tutor: "Alice",
      classroom: "Room 1",
    },
    backgroundColor: "#3b82f6",
    textColor: "#ffffff",
  },
];

describe("CalendarView", () => {
  it("does not show a dialog on initial render", () => {
    render(<CalendarView events={[]} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens dialog with session details when an event is clicked", async () => {
    const user = userEvent.setup();
    render(<CalendarView events={mockEvents} />);
    await user.click(screen.getByText("Math"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Math - Algebra - Secondary/)).toBeInTheDocument();
    expect(screen.getByText("City")).toBeInTheDocument();
  });

  it("closes the dialog when the close button is clicked", async () => {
    const user = userEvent.setup();
    render(<CalendarView events={mockEvents} />);
    await user.click(screen.getByText("Math"));
    await user.click(screen.getByLabelText("Close"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows a registration link when prefill is set on the selected event", async () => {
    const user = userEvent.setup();
    render(<CalendarView events={mockEvents} />);
    await user.click(screen.getByText("Math"));
    expect(
      screen.getByRole("link", { name: /Register \(prefilled\)/i })
    ).toBeInTheDocument();
  });

  it("does not show a registration link when prefill is empty", async () => {
    const user = userEvent.setup();
    const eventsNoPrefill = [
      {
        ...mockEvents[0],
        extendedProps: { ...mockEvents[0].extendedProps, prefill: "" },
      },
    ];
    render(<CalendarView events={eventsNoPrefill} />);
    await user.click(screen.getByText("Math"));
    expect(
      screen.queryByRole("link", { name: /Register \(prefilled\)/i })
    ).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run the tests**

```bash
npm run test -- src/components/CalendarView.test.tsx
```

Expected: PASS — `5 tests passed`

If you see `Cannot find module '@fullcalendar/react'`, confirm `__mocks__/@fullcalendar/react.tsx` exists at the project root (not inside `src/`).

- [ ] **Step 4: Commit**

```bash
git add __mocks__/ src/components/CalendarView.test.tsx
git commit -m "feat(test): add CalendarView tests with FullCalendar mock"
```

---

### Task 5: Write Filters component tests

**Files:**
- Create: `src/components/Filters.test.tsx`

- [ ] **Step 1: Write Filters.test.tsx**

Create `src/components/Filters.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run the tests**

```bash
npm run test -- src/components/Filters.test.tsx
```

Expected: PASS — `4 tests passed`

- [ ] **Step 3: Commit**

```bash
git add src/components/Filters.test.tsx
git commit -m "feat(test): add Filters component tests"
```

---

### Task 6: Write ListView component tests

**Files:**
- Create: `src/components/ListView.test.tsx`

- [ ] **Step 1: Write ListView.test.tsx**

Create `src/components/ListView.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import ListView from "./ListView";
import { Session } from "../types";

jest.mock("react-datepicker", () => {
  const MockDatePicker = ({ placeholderText }: { placeholderText?: string }) => (
    <input data-testid="date-picker" placeholder={placeholderText} readOnly />
  );
  MockDatePicker.displayName = "MockDatePicker";
  return MockDatePicker;
});

const makeSession = (overrides: Partial<Session> = {}): Session => ({
  subject: "Math",
  tutor: "Alice",
  centre: "City",
  classroom: "Room 1",
  topic: "Algebra",
  date: "24 May",
  startTime: "10:00",
  endTime: "12:00",
  level: "Secondary",
  prefill: "",
  prefillField: "",
  ...overrides,
});

describe("ListView", () => {
  it("renders a card for each session", () => {
    const sessions = [
      makeSession({ subject: "Math" }),
      makeSession({ subject: "English", date: "25 May" }),
    ];
    render(
      <ListView sessions={sessions} calendarFilter={null} onCalendarFilterChange={jest.fn()} />
    );
    expect(screen.getByText("Math")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("shows all sessions when calendarFilter is null", () => {
    const sessions = [
      makeSession({ date: "24 May" }),
      makeSession({ subject: "English", date: "25 May" }),
    ];
    render(
      <ListView sessions={sessions} calendarFilter={null} onCalendarFilterChange={jest.fn()} />
    );
    expect(screen.getByText("Math")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("shows only sessions matching calendarFilter", () => {
    const sessions = [
      makeSession({ subject: "Math", date: "24 May" }),
      makeSession({ subject: "English", date: "25 May" }),
    ];
    render(
      <ListView sessions={sessions} calendarFilter="2025-05-24" onCalendarFilterChange={jest.fn()} />
    );
    expect(screen.getByText("Math")).toBeInTheDocument();
    expect(screen.queryByText("English")).not.toBeInTheDocument();
  });

  it("renders no cards when no sessions match calendarFilter", () => {
    const sessions = [makeSession({ date: "24 May" })];
    render(
      <ListView sessions={sessions} calendarFilter="2025-06-01" onCalendarFilterChange={jest.fn()} />
    );
    expect(screen.queryByText("Math")).not.toBeInTheDocument();
  });

  it("renders the date picker", () => {
    render(
      <ListView sessions={[]} calendarFilter={null} onCalendarFilterChange={jest.fn()} />
    );
    expect(screen.getByTestId("date-picker")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests**

```bash
npm run test -- src/components/ListView.test.tsx
```

Expected: PASS — `5 tests passed`

- [ ] **Step 3: Commit**

```bash
git add src/components/ListView.test.tsx
git commit -m "feat(test): add ListView component tests"
```

---

### Task 7: Write SignupBanner and BottomBanner tests

**Files:**
- Create: `src/components/SignupBanner.test.tsx`
- Create: `src/components/BottomBanner.test.tsx`

- [ ] **Step 1: Write SignupBanner.test.tsx**

Create `src/components/SignupBanner.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import SignupBanner from "./SignupBanner";

jest.mock("@vercel/analytics", () => ({ track: jest.fn() }));

describe("SignupBanner", () => {
  it("renders without crashing", () => {
    render(<SignupBanner />);
  });

  it("renders a signup link", () => {
    render(<SignupBanner />);
    expect(
      screen.getByRole("link", { name: /Click here to sign up/i })
    ).toBeInTheDocument();
  });

  it("signup link opens in a new tab", () => {
    render(<SignupBanner />);
    const link = screen.getByRole("link", { name: /Click here to sign up/i });
    expect(link).toHaveAttribute("target", "_blank");
  });
});
```

- [ ] **Step 2: Write BottomBanner.test.tsx**

Create `src/components/BottomBanner.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import BottomBanner from "./BottomBanner";

jest.mock("@vercel/analytics", () => ({ track: jest.fn() }));

describe("BottomBanner", () => {
  it("renders without crashing", () => {
    render(<BottomBanner />);
  });

  it("renders a signup link", () => {
    render(<BottomBanner />);
    expect(
      screen.getByRole("link", { name: /Click here to sign up/i })
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run the full test suite**

```bash
npm run test
```

Expected output:
```
Test Suites: 7 passed, 7 total
Tests:       28 passed, 28 total
```

(5 filters + 4 dates + 5 CalendarView + 4 Filters + 5 ListView + 3 SignupBanner + 2 BottomBanner = 28)

- [ ] **Step 4: Commit**

```bash
git add src/components/SignupBanner.test.tsx src/components/BottomBanner.test.tsx
git commit -m "feat(test): add SignupBanner and BottomBanner render tests"
```
