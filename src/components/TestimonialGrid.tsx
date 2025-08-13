"use client";

import Image from "next/image";
import { testimonialsData } from "@/data/testimonials";

export default function TestimonialGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {testimonialsData.map((testimonial) => (
        <div
          key={testimonial.id}
          className={`modern-card p-6 text-center ${
            testimonial.id === "gloria" ? "md:col-span-2 lg:col-span-1" : ""
          }`}
        >
          {/* Avatar and Name */}
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
              <Image
                src={testimonial.avatar}
                alt={testimonial.name}
                className="w-full h-full object-cover"
                loading="lazy"
                width={45}
                height={45}
              />
            </div>
            <div className="font-semibold text-gray-800">
              {testimonial.name}
            </div>
          </div>

          {/* Testimonials */}
          <div className="text-left">
            {testimonial.testimonials.map((item, index) => (
              <div key={index}>
                <h4 className="font-bold text-lg text-gray-800 mb-3">
                  {item.achievement}
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  &quot;{item.quote}&quot;
                </p>
                {index < testimonial.testimonials.length - 1 && <br />}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
