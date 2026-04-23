"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { getCrashCourseConfig } from "../../crash-courses";

const STORAGE_KEY = "signupBannerCollapsed";

const LOGO_SRC_MOBILE =
  "https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f12/65ed367b65acaa4acb2bbf72_Zenith-logo.webp";
const LOGO_SRC_DESKTOP =
  "https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f12/65e1a2a65798fb58f1336fe6_education-2.png.webp";
const AVATAR_SRCS = [
  "https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f12/6620e0830701a7bceb0c7204_Screenshot%202024-04-18%20163444.webp",
  "https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f12/65f278d68ea311803c30e993_Screenshot%202024-03-14%20at%2012.10.54%20PM.webp",
  "https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f12/6620dd4162fa73292402d873_Screenshot%202024-04-18%20163707.webp",
  "https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f12/65f2786b8a3bd7f56bb2ac99_Screenshot%202024-03-14%20at%2012.09.05%20PM.webp",
];

export default function SignupBanner() {
  const { hero } = getCrashCourseConfig();
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setIsCollapsed(true);
    else if (stored === "false") setIsCollapsed(false);
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem(STORAGE_KEY, next.toString());
  };

  return (
    <div className="w-full hero-gradient">
      <div
        className={`max-w-7xl mx-auto px-2 ${
          isCollapsed ? "py-1 sm:py-1" : "py-4 sm:py-4"
        }`}
      >
        {/* Mobile Layout */}
        <div className="lg:hidden relative">
          {isCollapsed ? (
            <button
              onClick={toggleCollapse}
              className="w-full flex items-center gap-2 py-1 px-2 text-left hover:opacity-90 transition-opacity"
              aria-label="Expand banner"
            >
              <svg
                className="w-5 h-5 text-white flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              <h1 className="text-base sm:text-lg font-bold text-white flex-1">
                {hero.title}
              </h1>
            </button>
          ) : (
            <div className="space-y-4 relative">
              <button
                onClick={toggleCollapse}
                className="absolute top-0 left-0 z-20 text-white hover:text-blue-100 transition-colors p-2 bg-white/10 rounded-lg"
                aria-label="Collapse banner"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </button>
              <div className="absolute top-0 right-0 z-10">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center">
                  <Image
                    src={LOGO_SRC_MOBILE}
                    alt="Zenith Education Logo"
                    width={50}
                    height={50}
                    className="sm:w-[60px] sm:h-[60px]"
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <div className="relative">
                  <Image
                    src={hero.heroImageSrc}
                    alt={hero.heroImageAlt}
                    width={245}
                    height={210}
                    className="rounded-xl opacity-90"
                    priority
                  />
                </div>
              </div>

              <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-white">
                  {hero.title}
                </h1>
                <p className="text-sm sm:text-base text-blue-100 font-medium mt-2">
                  {hero.tagline}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <div className="flex -space-x-1">
                  {AVATAR_SRCS.map((src) => (
                    <div
                      key={src}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 border-2 border-white overflow-hidden"
                    >
                      <Image
                        className="rounded-full"
                        src={src}
                        alt=""
                        width={40}
                        height={40}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-blue-100 text-xs sm:text-sm font-medium">
                  {hero.stats}
                </p>
              </div>

              <div className="pt-4 mt-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3 text-center">
                  {hero.blurbHeadline}
                </h2>
                <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto text-center">
                  {hero.blurbBody}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center gap-2 relative">
          <div className="absolute top-0 right-0 z-10">
            <div className="w-24 h-24 rounded-lg flex items-center justify-center">
              <Image
                src={LOGO_SRC_DESKTOP}
                alt="Zenith Education Logo"
                width={80}
                height={80}
              />
            </div>
          </div>

          <div className="flex-shrink-0">
            <div className="relative w-[350px] h-[300px] overflow-hidden rounded-xl">
              <Image
                src={hero.heroImageSrc}
                alt={hero.heroImageAlt}
                fill
                className="object-contain opacity-90"
                priority
              />
            </div>
          </div>

          <div className="flex-1 text-white space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl xl:text-4xl font-bold leading-tight">
                {hero.title}
              </h1>
              <p className="text-lg xl:text-lg text-blue-100 font-medium">
                {hero.tagline}
              </p>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-2">
                {AVATAR_SRCS.map((src) => (
                  <div
                    key={src}
                    className="w-12 h-12 rounded-full bg-white/20 border-2 border-white overflow-hidden"
                  >
                    <Image
                      className="rounded-full"
                      src={src}
                      alt=""
                      width={48}
                      height={48}
                    />
                  </div>
                ))}
              </div>
              <p className="text-blue-100 text-base font-medium">
                {hero.stats}
              </p>
            </div>

            <div className="pt-6 mt-6">
              <h2 className="text-2xl xl:text-2xl font-bold text-white mb-3">
                {hero.blurbHeadline}
              </h2>
              <p className="text-base xl:text-lg text-blue-100 max-w-2xl">
                {hero.blurbBody}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
