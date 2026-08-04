"use client";

/**
 * The page's one honest-state bar: a single line of copy explaining why the
 * schedule below is not what the visitor expected, plus an optional way out.
 *
 * Renamed from `PinnedBanner` (2026-07-30). It stopped being about pins the
 * moment the same messages were owed to visitors who never followed a link: a
 * failed or empty fetch leaves an ordinary visitor staring at "Select a stream
 * to see classes" over a calendar that can never fill, and the fix is this bar,
 * not a second one styled to match. Under the old name the unpinned caller
 * would read as a misuse of a pinned component — the same reason
 * `pinnedClasses.ts` became `pinnedSlots.ts` earlier on this branch.
 *
 * `onShowAll` is OPTIONAL because "Show all classes →" is only meaningful when
 * there is somewhere to escape to. A pinned visitor can drop the pin and reach
 * the ordinary site; an unpinned visitor is already on it, and a button that
 * takes them nowhere invites a click that answers nothing. Omit the prop and
 * the action is not rendered at all.
 */
export default function NoticeBanner({
  message,
  onShowAll,
}: {
  message: string;
  onShowAll?: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 text-sm font-semibold">
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[10px] italic font-bold"
        >
          i
        </span>
        {message}
      </span>
      {onShowAll && (
        <button
          onClick={onShowAll}
          className="underline font-bold whitespace-nowrap hover:opacity-90"
        >
          Show all classes →
        </button>
      )}
    </div>
  );
}
