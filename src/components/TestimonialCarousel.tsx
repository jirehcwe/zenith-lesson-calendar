"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, Autoplay } from "swiper/modules";
import { testimonialsData, type Testimonial } from "@/data/testimonials";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

interface TestimonialCardProps {
  testimonial: Testimonial;
}

function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <div className="modern-card p-6 text-center h-full">
      {/* Avatar and Name */}
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
          <Image
            src={testimonial.avatar}
            alt={testimonial.name}
            className="w-full h-full object-cover"
            loading="lazy"
            width={64}
            height={64}
          />
        </div>
        <div className="font-semibold text-gray-800">{testimonial.name}</div>
      </div>

      {/* Testimonials */}
      <div className="text-left space-y-4">
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
  );
}

export default function TestimonialCarousel() {
  return (
    <div className="relative">
      {/* Custom styles for carousel */}
      <style jsx global>{`
        .testimonial-swiper .swiper-pagination {
          position: static !important;
          margin-top: 2rem;
        }
        .testimonial-swiper .swiper-pagination-bullet {
          background-color: #d1d5db;
          opacity: 1;
          width: 12px;
          height: 12px;
        }
        .testimonial-swiper .swiper-pagination-bullet-active {
          background-color: #3b82f6;
        }
        .testimonial-swiper .swiper-slide {
          height: auto;
          display: flex;
        }
        .testimonial-swiper .swiper-slide > div {
          width: 100%;
        }
      `}</style>

      <Swiper
        modules={[Pagination, Navigation, Autoplay]}
        spaceBetween={20}
        slidesPerView={1}
        pagination={{
          clickable: true,
          dynamicBullets: false,
        }}
        autoplay={{
          delay: 6000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        loop={true}
        className="testimonial-swiper"
        style={{ paddingBottom: "60px" }}
      >
        {testimonialsData.map((testimonial) => (
          <SwiperSlide key={testimonial.id}>
            <TestimonialCard testimonial={testimonial} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
