"use client";

export default function PinnedBanner({
  message,
  onShowAll,
}: {
  message: string;
  onShowAll: () => void;
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
      <button
        onClick={onShowAll}
        className="underline font-bold whitespace-nowrap hover:opacity-90"
      >
        Show all classes →
      </button>
    </div>
  );
}
