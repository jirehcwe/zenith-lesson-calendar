"use client";
import Image from "next/image";
export default function SignupBanner() {
  return (
    <div className="w-full p-4 bg-[rgb(245,244,236)] rounded flex flex-col items-center justify-center gap-4 text-center max-w-3xl mx-auto">
      <Image
        src="/banner.jpg"
        width={5613}
        height={1392}
        alt="Zenith Banner"
        className="w-full object-cover rounded"
      />
    </div>
  );
}
