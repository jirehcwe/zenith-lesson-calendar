import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";

// SignupActions owns the trial and register buttons and the rule that turns
// them off (full class, closed trial form, closed registration form). A view
// that builds its own buttons would skip that rule and link a form that no
// longer lists the class. This fails when any other source file reads the
// prefill links or renders the button labels.
const SRC = path.join(__dirname, "..");
const OWNER = path.join(SRC, "components", "SignupActions.tsx");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
  });
}

const SIGNUP_BUTTON_MARKERS = [
  /\.prefill(Trial|Registration)Link\b/,
  /Sign up for FREE Trial/,
  /Register now/,
];

describe("sign-up buttons", () => {
  it("are rendered only by SignupActions", () => {
    const files = sourceFiles(SRC);
    expect(files).toContain(OWNER);
    const offenders = files
      .filter((file) => file !== OWNER)
      .filter((file) => {
        const text = readFileSync(file, "utf8");
        return SIGNUP_BUTTON_MARKERS.some((marker) => marker.test(text));
      })
      .map((file) => path.relative(SRC, file));
    expect(offenders).toEqual([]);
  });
});
