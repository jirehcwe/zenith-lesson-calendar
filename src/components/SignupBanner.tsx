"use client";
import Image from "next/image";

export default function SignupBanner() {
  return (
    <div className="w-full hero-gradient">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-8 sm:py-16">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="text-white space-y-4 sm:space-y-6">
            <div className="space-y-2 sm:space-y-4">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                Find The Perfect Class
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-blue-100 font-medium">
                Flexible scheduling • Expert tutors • Proven results
              </p>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 pt-2 sm:pt-4">
              <div className="flex -space-x-1 sm:-space-x-2">
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
              <p className="text-blue-100 text-xs sm:text-sm">
                Proven results since 2019
              </p>
            </div>
          </div>

          {/* Right Content - Branding */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative">
              <Image
                src="/banner.webp"
                alt="Zenith Education"
                width={600}
                height={450}
                className="rounded-xl shadow-lg opacity-90"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
