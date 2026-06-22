"use client";

import { getCrashCourseConfig } from "../../crash-courses";

const { closingBanner } = getCrashCourseConfig();

// Prominent announcement strip rendered at the very top of the page (above
// the hero). Config-gated: slugs without a `closingBanner` render nothing,
// so an ended course (e.g. JC) shows this while still-running courses don't.
export default function ClosingBanner() {
  if (!closingBanner) return null;
  return (
    <div className="w-full bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
        <p className="text-sm sm:text-base">
          {closingBanner.headline && (
            <span className="font-bold">{closingBanner.headline} </span>
          )}
          <span className="text-slate-300">{closingBanner.body}</span>
        </p>
        <a
          href={closingBanner.ctaHref}
          className="btn-primary whitespace-nowrap text-sm sm:text-base"
        >
          {closingBanner.ctaLabel}
        </a>
      </div>
    </div>
  );
}
