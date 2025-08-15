"use client";
import Image from "next/image";

export default function SignupBanner() {
  return (
    <div className="w-full hero-gradient">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-4">
        {/* Mobile Layout - Stacked */}
        <div className="lg:hidden space-y-4 relative">
          {/* Logo in top right - absolute positioned */}
          <div className="absolute top-0 right-0 z-10">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center">
              <Image
                src="https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f12/65ed367b65acaa4acb2bbf72_Zenith-logo.webp"
                alt="Zenith Education Logo"
                width={50}
                height={50}
                className="sm:w-[60px] sm:h-[60px]"
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

          {/* Title Section */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-white">
              2025 Weekly Class Schedule
            </h1>
            <p className="text-sm sm:text-base text-blue-100 font-medium mt-2">
              Flexible scheduling • Expert tutors • Proven results
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
              Trusted by over 14,000 students since 2019
            </p>
          </div>
        </div>

        {/* Desktop Layout - Row */}
        <div className="hidden lg:flex items-center gap-2 relative">
          {/* Logo in top right - absolute positioned */}
          <div className="absolute top-0 right-0 z-10">
            <div className="w-24 h-24 rounded-lg flex items-center justify-center">
              <Image
                src="https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f12/65e1a2a65798fb58f1336fe6_education-2.png.webp"
                alt="Zenith Education Logo"
                width={80}
                height={80}
              />
            </div>
          </div>

          {/* Left - Banner Image */}
          <div className="flex-shrink-0">
            <div className="relative w-[350px] h-[300px] overflow-hidden rounded-xl">
              <Image
                src="/zenith-banner.webp"
                alt="Zenith Education"
                fill
                className="object-contain opacity-90"
                priority
              />
            </div>
          </div>

          {/* Center - Text Content */}
          <div className="flex-1 text-white space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl xl:text-4xl font-bold leading-tight">
                2025 Weekly Class Schedule
              </h1>
              <p className="text-lg xl:text-lg text-blue-100 font-medium">
                Flexible scheduling • Expert tutors • Proven results
              </p>
            </div>

            <div className="flex items-center gap-4 pt-4">
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
                Trusted by over 14,000 students since 2019
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
