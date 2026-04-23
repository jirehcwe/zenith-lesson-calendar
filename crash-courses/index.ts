import type { CrashCourseConfig } from "./types";

// The resolver runs in three contexts:
//   1. Next.js static export build (Node) — needs fs to validate slug on disk.
//   2. Jest tests (Node) — same, needs fs to discover and validate.
//   3. Browser bundle — fs unavailable; validation is a no-op since the
//      correct config was already bundled at build time.
// `typeof window` is unreliable here: jsdom (Jest's default env) defines
// `window` even though fs is available. Sniff Node specifically via
// `process.versions.node`, which webpack's browser-polyfill of `process`
// omits.
function isNodeRuntime(): boolean {
  try {
    return (
      typeof process !== "undefined" &&
      process.versions != null &&
      typeof process.versions.node === "string"
    );
  } catch {
    return false;
  }
}

function nodeOnly<T>(load: () => T): T | null {
  if (!isNodeRuntime()) return null;
  try {
    return load();
  } catch {
    return null;
  }
}

function getFs() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return nodeOnly(() => require("fs") as typeof import("fs"));
}

function getPath() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return nodeOnly(() => require("path") as typeof import("path"));
}

function ccRootDir(): string {
  const p = getPath();
  return p ? p.join(process.cwd(), "crash-courses") : "crash-courses";
}

/**
 * Discover every slug on disk that has both a `config.ts` and a
 * `sessions.json`. Returns an empty array in the browser bundle (where
 * fs is unavailable).
 */
export function listAvailableSlugs(): string[] {
  const fs = getFs();
  const path = getPath();
  if (!fs || !path) return [];
  try {
    const root = ccRootDir();
    return fs
      .readdirSync(root, { withFileTypes: true })
      .filter(
        (e) => e.isDirectory() && !e.name.startsWith("_") && !e.name.startsWith(".")
      )
      .map((e) => e.name)
      .filter((name) => {
        const cPath = path.join(root, name, "config.ts");
        const sPath = path.join(root, name, "sessions.json");
        return fs.existsSync(cPath) && fs.existsSync(sPath);
      })
      .sort();
  } catch {
    return [];
  }
}

function validateSlugOnDisk(slug: string): void {
  const fs = getFs();
  const path = getPath();
  // Browser bundle — trust the bundle; validation already happened at build time.
  if (!fs || !path) return;
  const root = ccRootDir();
  const cPath = path.join(root, slug, "config.ts");
  const sPath = path.join(root, slug, "sessions.json");
  if (!fs.existsSync(cPath)) {
    const available = listAvailableSlugs();
    throw new Error(
      `Crash course config not found: crash-courses/${slug}/config.ts. ` +
        `Available slugs: ${available.length > 0 ? available.join(", ") : "(none on disk)"}`
    );
  }
  if (!fs.existsSync(sPath)) {
    throw new Error(
      `Crash course sessions data not found: crash-courses/${slug}/sessions.json.`
    );
  }
}

/**
 * Resolve the crash course config for the current build/deployment.
 * Slug is taken from NEXT_PUBLIC_CC_SLUG and must correspond to a folder
 * under `crash-courses/` containing both `config.ts` and `sessions.json`.
 */
export function getCrashCourseConfig(): CrashCourseConfig {
  const slug = process.env.NEXT_PUBLIC_CC_SLUG;
  if (!slug) {
    const available = listAvailableSlugs();
    throw new Error(
      "NEXT_PUBLIC_CC_SLUG is not set. Set it at build time to one of: " +
        (available.length > 0 ? available.join(", ") : "(no slugs found on disk)")
    );
  }
  validateSlugOnDisk(slug);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require(`./${slug}/config`);
  return mod.default as CrashCourseConfig;
}

/**
 * Load every registered config. Used by the config-integrity test suite
 * so that newly-added crash courses are automatically validated.
 * Returns an empty array in the browser.
 */
export function getAllRegisteredConfigs(): CrashCourseConfig[] {
  return listAvailableSlugs().map((s) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(`./${s}/config`).default as CrashCourseConfig;
  });
}

export type { CrashCourseConfig } from "./types";
