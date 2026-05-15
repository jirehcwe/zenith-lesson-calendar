"use client";
import Image from "next/image";
import { useState, useEffect } from "react";

const STORAGE_KEY = "signupBannerCollapsed";

export default function SignupBanner() {
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(STORAGE_KEY, newState.toString());
  };

  const eyebrowPill = (
    <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 motion-safe:animate-pulse block flex-shrink-0" />
      <span className="text-xs font-semibold uppercase tracking-widest text-white/85">
        Now booking · 2026 academic year
      </span>
    </div>
  );

  return (
    <div className="w-full hero-gradient">
      <div className={`max-w-7xl mx-auto px-4 lg:py-10 ${isCollapsed ? 'py-1 sm:py-1' : 'py-8 sm:py-10'}`}>
        {/* Mobile Layout - Stacked */}
        <div className="lg:hidden relative">
          {/* Collapsed State - Mobile Only */}
          {isCollapsed ? (
            <button
              onClick={toggleCollapse}
              className="w-full flex items-center gap-3 py-2 px-2 text-left hover:opacity-90 transition-opacity"
              aria-label="Expand banner"
            >
              <svg
                className="w-4 h-4 text-white/70 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <h1 className="text-sm font-semibold text-white flex-1 tracking-wide">
                Zenith 2026 Schedule
              </h1>
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                <Image
                  src="https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f12/65ed367b65acaa4acb2bbf72_Zenith-logo.webp"
                  alt="Zenith"
                  width={22}
                  height={22}
                />
              </div>
            </button>
          ) : (
            <div className="space-y-4 relative">
              {/* Collapse Button */}
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
          {/* Logo in top right - absolute positioned */}
          <div className="absolute top-0 right-0 z-10">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center">
              <Image
                src="https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f12/65ed367b65acaa4acb2bbf72_Zenith-logo.webp"
                alt="Zenith Education Logo"
                width={56}
                height={56}
                className="object-contain"
              />
            </div>
          </div>

          {/* Banner Image */}
          <div className="flex justify-center">
            <div className="relative">
              <Image
                src="/zenith-banner.webp"
                alt="Zenith Education"
                width={245}
                height={210}
                className="rounded-xl opacity-90"
                priority
              />
            </div>
          </div>

          {/* Eyebrow pill */}
          <div className="flex justify-center">
            {eyebrowPill}
          </div>

          {/* Title Section */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight text-white">
              Browse every class.{" "}
              <span className="text-amber-400">Find Your Perfect Class Schedule.</span>
            </h1>
            <p className="text-sm sm:text-base text-blue-100 font-medium mt-2 leading-relaxed">
              Filter by stream, level, and centre to find the right fit — then book a complimentary trial or register directly.
            </p>
          </div>

          {/* Student Testimonials */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex -space-x-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 border-2 border-white overflow-hidden">
                <Image
                  className="rounded-full"
                  src="https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f12/6620e0830701a7bceb0c7204_Screenshot%202024-04-18%20163444.webp"
                  alt=""
                  width={40}
                  height={40}
                />
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 border-2 border-white overflow-hidden">
                <Image
                  className="rounded-full"
                  src="https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f12/65f278d68ea311803c30e993_Screenshot%202024-03-14%20at%2012.10.54%20PM.webp"
                  alt=""
                  width={40}
                  height={40}
                />
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 border-2 border-white overflow-hidden">
                <Image
                  className="rounded-full"
                  src="https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f12/6620dd4162fa73292402d873_Screenshot%202024-04-18%20163707.webp"
                  alt=""
                  width={40}
                  height={40}
                />
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 border-2 border-white overflow-hidden">
                <Image
                  className="rounded-full"
                  src="https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f12/65f2786b8a3bd7f56bb2ac99_Screenshot%202024-03-14%20at%2012.09.05%20PM.webp"
                  alt=""
                  width={40}
                  height={40}
                />
              </div>
            </div>
            <p className="text-blue-100 text-xs sm:text-sm font-medium">
              <span className="font-bold text-white">20,000+</span> students since 2019
            </p>
          </div>
            </div>
          )}
        </div>

        {/* Desktop Layout - Row */}
        <div className="hidden lg:flex items-center gap-9 relative">
          {/* Logo in top right - absolute positioned */}
          <div className="absolute top-2 right-0 z-10">
            <div className="w-20 h-20 rounded-lg flex items-center justify-center">
              <Image
                src="https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f12/65e1a2a65798fb58f1336fe6_education-2.png.webp"
                alt="Zenith Education Logo"
                width={72}
                height={72}
              />
            </div>
          </div>

          {/* Left - Banner Image */}
          <div className="flex-shrink-0">
            <div className="relative w-[270px] h-[260px] overflow-hidden rounded-2xl">
              <Image
                src="/zenith-banner.webp"
                alt="Zenith Education"
                fill
                className="object-cover opacity-90"
                priority
              />
            </div>
          </div>

          {/* Center - Text Content */}
          <div className="flex-1 text-white space-y-4 pr-24">
            <div className="space-y-3">
              {eyebrowPill}
              <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight">
                Browse every class.{" "}
                <span className="text-amber-400">Find Your Perfect Class Schedule.</span>
              </h1>
              <p className="text-base xl:text-lg text-blue-100 font-medium leading-relaxed">
                Filter by stream, level, and centre to find the right fit — then book a complimentary trial or register directly.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white overflow-hidden">
                  <Image
                    className="rounded-full"
                    src="https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f12/6620e0830701a7bceb0c7204_Screenshot%202024-04-18%20163444.webp"
                    alt=""
                    width={48}
                    height={48}
                  />
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white overflow-hidden">
                  <Image
                    className="rounded-full"
                    src="https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f12/65f278d68ea311803c30e993_Screenshot%202024-03-14%20at%2012.10.54%20PM.webp"
                    alt=""
                    width={48}
                    height={48}
                  />
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white overflow-hidden">
                  <Image
                    className="rounded-full"
                    src="https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f12/6620dd4162fa73292402d873_Screenshot%202024-04-18%20163707.webp"
                    alt=""
                    width={48}
                    height={48}
                  />
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white overflow-hidden">
                  <Image
                    className="rounded-full"
                    src="https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f12/65f2786b8a3bd7f56bb2ac99_Screenshot%202024-03-14%20at%2012.09.05%20PM.webp"
                    alt=""
                    width={48}
                    height={48}
                  />
                </div>
              </div>
              <p className="text-blue-100 text-base font-medium">
                <span className="font-bold text-white">20,000+</span> students since 2019
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
