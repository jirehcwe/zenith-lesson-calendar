"use client";

export default function BottomBanner() {
  return (
    <div className="w-full p-4 bg-[rgb(245,244,236)] rounded flex flex-col items-center justify-center gap-4 text-center max-w-3xl mx-auto">
      <div className="text-sm font-semibold">
        Ready to lock in for promos?{" "}
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSesYi1vS9HGIsyW1nTjxXbk07anXX3iZ9yAMXfwON4w0wiqdg/viewform?usp=dialog&entry.1157532004=SCHEDULE"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          Click here to sign up!
        </a>
      </div>
    </div>
  );
}
