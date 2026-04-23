"use client";

import { getCrashCourseConfig } from "../../crash-courses";

const { bottomBanner } = getCrashCourseConfig();

export default function BottomBanner() {
  return (
    <div className="w-full p-4 bg-[rgb(245,244,236)] rounded flex flex-col items-center justify-center gap-4 text-center max-w-3xl mx-auto">
      <div className="text-sm font-semibold">
        {bottomBanner.body}{" "}
        <a
          href={bottomBanner.ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          {bottomBanner.ctaLabel}
        </a>
      </div>
    </div>
  );
}
