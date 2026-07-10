import React from "react";
import { Phone, Globe } from "lucide-react";
import "../Beige-Customer-Testimonial-Social-Media-Post-Carousel.css";

export default function GrowthCampaignViralPoster() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 ">
      <div
        className="Beige-Customer-Testimonial-Social-Media-Post-Carousel  relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden bg-[var(--bg-cream)]"
        style={{
          backgroundColor: "var(--secondary-light)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow)",
          aspectRatio: "9 / 12",
        }}
        data-size="medium"
        data-category="case-study"
        data-industry="business"
        data-orientation="portrait"
        data-event="none"
      >
        {/* Horizontal box - top  */}
        <div className="absolute -top-12 right-20 w-[600px] h-[500px] rounded-tr-[45px] rounded-br-[45px] border-2 border-[var(--primary)] "></div>

        <div className="absolute top-22 right-20 w-[100px] h-[100px] rounded-tl-[45px] border-2 border-[var(--primary)] "></div>

        <div className="absolute top-22 w-[100px] right-0 h-[2px] bg-[var(--primary)] "></div>

        {/* Circle node - bottom */}
        <div className="absolute bottom-33 left-7 z-50 w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[var(--primary)] bg-[var(--secondary)]"></div>

        {/* Circle node - top */}
        <div className="absolute top-22 right-16 z-50 w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[var(--primary)] bg-[var(--secondary)]"></div>

        <div className="relative z-10 h-full flex flex-col p-8">
          {/* Logo at top */}
          <div className="flex items-start mb-6">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-4 border-[var(--secondary)]"></div>
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-[var(--primary)]">
                  YOUR
                </div>
                <div className="text-sm font-bold text-[var(--primary)]">
                  LOGO
                </div>
              </div>
            </div>
          </div>

          {/* Main headline */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-[var(--primary)]">
              Our
              <br />
              growth
              <br />
              campaign
              <br />
              went viral
            </h1>
          </div>

          {/* Content area with image and stat card */}
          <div className="flex-1 relative">
            {/* Person image with rounded corners */}
            <div className="absolute left-0 bottom-0 w-80 h-60 rounded-xl overflow-hidden ">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=800&fit=crop"
                alt="Professional woman"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Green stat card - top right overlapping image */}
            <div className="absolute -top-41 right-0 bg-[image:var(--linear-primary)] rounded-xl p-5 shadow-2xl w-46">
              {/* 3x with triangle icon */}
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-5xl font-bold text-[var(--secondary)]">
                  3×
                </h2>
                <div className="w-12 h-12 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <polygon
                      points="50,10 90,80 10,80"
                      fill="white"
                      opacity="0.3"
                    />
                  </svg>
                </div>
              </div>

              {/* Description text */}
              <p className="text-sm font-medium pb-14 text-[var(--secondary)] ">
                They helped us build a new content system that increased organic
                traffic by 3×
              </p>
            </div>
          </div>

          {/* Footer - Contact info */}
          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center gap-1 text-[var(--primary)]">
              <Phone className="w-4 h-4" />
              <span className="text-xs font-bold">(00) 0000-0000</span>
            </div>
            <div className="flex items-center gap-1 text-[var(--primary)]">
              <Globe className="w-4 h-4" />
              <span className="text-xs font-bold">www.yourwebsite.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
