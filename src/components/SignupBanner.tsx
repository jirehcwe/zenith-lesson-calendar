"use client";

export default function SignupBanner() {
  return (
    <div className="w-full p-4 bg-[rgb(245,244,236)] rounded flex flex-col items-center justify-center gap-4 text-center max-w-3xl mx-auto">
      <img
        src="/zenith_banner.png"
        alt="Zenith Banner"
        className="w-full object-cover rounded"
      />
      <div className="text-sm font-semibold">
        📢 Ready to join?{" "}
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSdqyeoGBF4DyUXQA3cUOaZee3DB5NFhTtqPRyN5wdkQcIgL0Q/viewform?usp=dialog"
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
