"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "signupBannerCollapsed";

export default function SignupBanner() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") {
      setIsCollapsed(true);
    }
  }, []);

  // Auto-collapse when user scrolls past the banner
  useEffect(() => {
    const el = bannerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          setIsCollapsed(true);
        }
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (newState) {
      localStorage.setItem(STORAGE_KEY, "true");
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
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
    <div ref={bannerRef} className="w-full hero-gradient">
      <div className={`max-w-7xl mx-auto px-4 lg:py-10 ${isCollapsed ? 'py-1' : 'py-4 sm:py-10'}`}>
        {/* Mobile Layout - Stacked */}
        <div className="lg:hidden relative">
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
              <h1 className="text-base font-semibold text-white flex-1 tracking-wide">
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
            <div className="flex flex-col gap-4 relative">
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

              <div className="flex justify-center pt-6">
                <Image
                  src="/zenith_logo.png"
                  alt="Zenith Education Logo"
                  width={239}
                  height={68}
                  className="object-contain w-[191px] h-[54px] sm:w-[239px] sm:h-[68px]"
                />
              </div>

              <div className="flex justify-center">
                {/* Mobile */}
                <Image
                  src="/zenith-banner.webp"
                  alt="Zenith Education"
                  width={324}
                  height={278}
                  className="rounded-xl opacity-90 sm:hidden"
                  priority
                />
                {/* iPad (sm+) — 1.25× mobile */}
                <Image
                  src="/zenith-banner.webp"
                  alt="Zenith Education"
                  width={405}
                  height={348}
                  className="rounded-xl opacity-90 hidden sm:block"
                  priority
                />
              </div>

              <div className="flex justify-center">
                {eyebrowPill}
              </div>

              <div className="text-center">
                <h1 className="text-xl sm:text-3xl font-extrabold leading-tight text-white">
                  Browse every class.{" "}
                  <span className="font-black" style={{ color: "#f4ab25" }}>Find Your Perfect Class Schedule.</span>
                </h1>
                <p className="text-sm sm:text-base text-blue-100 font-medium mt-2 leading-relaxed">
                  Filter by stream, level, and centre to find the right fit — then book a <strong>FREE</strong> trial or register directly.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3">
                <div className="flex avatar-stack">
                  {["/avatars/avatar_01.jpg", "/avatars/avatar_02.jpg", "/avatars/avatar_03.jpg", "/avatars/avatar_04.jpg"].map((src, i) => (
                    <div key={i} className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/20 border-2 border-white overflow-hidden">
                      <Image
                        className="w-full h-full object-cover object-top scale-[1.5] origin-top"
                        src={src}
                        alt=""
                        width={36}
                        height={36}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-blue-100 text-xs sm:text-sm font-medium">
                  <span className="font-bold text-white">20,000+ students since 2019</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Layout - Row */}
        <div className="hidden lg:flex items-center gap-9">
          {/* Left - Text Content */}
          <div className="flex-1 text-white flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Image
                src="/zenith_logo.png"
                alt="Zenith Education Logo"
                width={291}
                height={81}
                className="object-contain flex-shrink-0"
              />
              {eyebrowPill}
            </div>
            <div className="flex flex-col gap-3">
              <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight">
                Browse every class.{" "}
                <span className="font-black" style={{ color: "#f4ab25" }}>Find Your Perfect Class Schedule.</span>
              </h1>
              <p className="text-base text-blue-100 font-medium leading-relaxed">
                Filter by stream, level, and centre to find the right fit — then book a FREE trial or register directly.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex avatar-stack-lg">
                {["/avatars/avatar_01.jpg", "/avatars/avatar_02.jpg", "/avatars/avatar_03.jpg", "/avatars/avatar_04.jpg"].map((src, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-white/20 border-2 border-white overflow-hidden">
                    <Image
                      className="w-full h-full object-cover object-top scale-[1.5] origin-top"
                      src={src}
                      alt=""
                      width={40}
                      height={40}
                    />
                  </div>
                ))}
              </div>
              <p className="text-blue-100 text-base font-medium">
                <span className="font-bold text-white">20,000+</span> students since 2019
              </p>
            </div>
          </div>

          {/* Right - Banner Image */}
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
        </div>
      </div>
    </div>
  );
}
