"use client";

import { getCrashCourseConfig } from "../../crash-courses";
import { isCourseOver } from "@/utils/sessionAvailability";

const config = getCrashCourseConfig();
const { closingBanner } = config;

// Prominent announcement strip rendered at the very top of the page (above
// the hero). Gated twice over: a slug without a `closingBanner` renders
// nothing, and a slug whose course is still running renders nothing either.
//
// The second gate matters. A slug can carry its retirement copy well before
// it retires, so the strip must not appear while the course is still on —
// otherwise it sends students to regular classes instead of the crash course
// they could still register for. From the day after `dateRange.end` it shows.
export default function ClosingBanner({ now }: { now?: Date }) {
  if (!closingBanner) return null;
  if (!isCourseOver(config, now ?? new Date())) return null;
  return (
    <div className="w-full bg-slate-900 text-white sticky top-0 z-50">
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
