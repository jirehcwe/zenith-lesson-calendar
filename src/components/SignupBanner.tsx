"use client";

import Image from "next/image";
import { getCrashCourseConfig } from "../../crash-courses";

const { signupBanner } = getCrashCourseConfig();

export default function SignupBanner() {
  const paragraphs = signupBanner.body.split("\n\n");
  return (
    <div className="w-full p-4 bg-[rgb(245,244,236)] rounded flex flex-col items-center justify-center gap-4 text-center max-w-3xl mx-auto">
      <Image
        width={1000}
        height={1000}
        src={signupBanner.imageSrc}
        alt={signupBanner.imageAlt}
        className="w-full object-cover rounded"
      />
      <div className="text-sm font-semibold">
        {paragraphs.map((p, i) => (
          <span key={i}>
            {p}
            {i < paragraphs.length - 1 && (
              <>
                <br />
                <br />
              </>
            )}
          </span>
        ))}{" "}
        <a
          href={signupBanner.ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          {signupBanner.ctaLabel}
        </a>
      </div>
    </div>
  );
}
