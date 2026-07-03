"use client";

import type { CourseEndedCta } from "@/utils/sessionAvailability";

// The "course has ended → regular trials" message box, shared by the calendar
// overlay and the list view. Purely presentational; the caller supplies the
// resolved CTA (which controls whether the click-out carries a campaign tag).
export default function CourseEndedPanel({ cta }: { cta: CourseEndedCta }) {
  return (
    <div className="max-w-md w-full mx-auto rounded-2xl bg-white shadow-xl border border-gray-100 p-6 sm:p-8 text-center space-y-3">
      {cta.headline && (
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">
          {cta.headline}
        </h3>
      )}
      <p className="text-sm sm:text-base text-slate-600">{cta.body}</p>
      <a href={cta.ctaHref} className="btn-primary inline-block mt-2">
        {cta.ctaLabel}
      </a>
    </div>
  );
}
