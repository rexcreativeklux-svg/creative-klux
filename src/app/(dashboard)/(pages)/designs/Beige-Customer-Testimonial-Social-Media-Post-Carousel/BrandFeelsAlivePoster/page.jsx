import React from "react";
import { Phone, Globe } from "lucide-react";
import "../Beige-Customer-Testimonial-Social-Media-Post-Carousel.css";

export default function BrandFeelsAlivePoster() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 ">
      <div
        className="Beige-Customer-Testimonial-Social-Media-Post-Carousel relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--secondary)",
          borderRadius: "var(--radius-xl)",
          aspectRatio: "9 / 12",
        }}
        data-size="medium"
        data-category="case-study"
        data-industry="business"
        data-orientation="portrait"
        data-event="none"
      >
        {/* Large quotation mark background */}
        <div className="absolute top-36 -right-8 opacity- pointer-events-none">
          <svg width="180" height="160" viewBox="0 0 100 100">
            <text
              x="0"
              y="80"
              fontSize="120"
              fontWeight="900"
              fill="var(--accent-on-secondary)"
              fontFamily="serif"
            >
              "
            </text>
          </svg>
        </div>

        {/* Tiled pattern background in green section - bigger tiles + top-left blur */}
        <div className="absolute bottom-0 left-0 w-75 h-30 overflow-hidden opacity-80 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Larger checkerboard pattern */}
              <pattern
                id="tile-pattern"
                x="0"
                y="0"
                width="100"
                height="100"
                patternUnits="userSpaceOnUse"
              >
                <rect
                  x="0"
                  y="0"
                  width="50"
                  height="50"
                  fill="var(--accent-on-secondary)"
                />
                <rect
                  x="50"
                  y="50"
                  width="50"
                  height="50"
                  fill="var(--accent-on-secondary)"
                />
              </pattern>

              {/* Blur filter */}
              <filter
                id="soft-blur"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="8" />
              </filter>

              {/* Gradient mask: opaque on bottom-right, fading to transparent on top-left */}
              <mask id="fade-mask">
                <rect
                  width="100%"
                  height="100%"
                  fill="var(--accent-on-secondary)"
                />
                <rect
                  width="100%"
                  height="100%"
                  fill="black"
                  style={{
                    maskImage:
                      "radial-gradient(circle at top left, transparent 20%, black 70%)",
                  }}
                />
              </mask>
            </defs>

            {/* Main tiled background */}
            <rect width="100%" height="100%" fill="url(#tile-pattern)" />

            {/* Blurred overlay on top-left */}
            <rect
              width="80%"
              height="80%"
              x="0"
              y="0"
              fill="url(#tile-pattern)"
              filter="url(#soft-blur)"
              mask="url(#fade-mask)"
              opacity="0.8"
            />
          </svg>
        </div>

        {/* Grid lines decoration */}
        <div className="absolute inset-0">
          {/* Horizontal line - bottom  */}
          <div className="absolute top-26 left-20 w-[335px] h-[220px] rounded-[45px] border-2 border-[var(--primary)] "></div>

          {/* Horizontal line - bottom third */}
          <div className="absolute -bottom-14 py-20 -left-6 w-full h-[2px] rounded-tr-[45px] border-2 border-[var(--primary)] "></div>

          {/* Horizontal line - bottom  */}
          <div className="absolute -bottom-5 -left-20 w-[200px] h-[300px] rounded-tr-[45px] border-2 border-[var(--primary)] "></div>

          {/* Circle node - bottom */}
          <div className="absolute bottom-23 left-30 w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[var(--primary)] bg-[var(--secondary)]"></div>
        </div>

        <div className="relative z-10 h-full flex flex-col p-8">
          {/* Top section - Logo and Contact */}
          <div className="flex items-start justify-between mb-8">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center">
                <div className="w-5 h-5 rounded-full border-4 border-white"></div>
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[var(--primary)]">
                  YOUR
                </div>
                <div className="text-xs font-bold text-[var(--primary)]">
                  LOGO
                </div>
              </div>
            </div>

            {/* Contact info */}
            <div className="mr-6 space-y-1">
              <div className="flex items-center  gap-2 text-[var(--primary)]">
                <Phone className="w-3 h-3" />
                <span className="text-xs font-semibold">(0)(0) 0000-0000</span>
              </div>
              <div className="flex items-center  gap-2 text-[var(--primary)]">
                <Globe className="w-3 h-3" />
                <span className="text-xs font-semibold">
                  www.yourwebsite.com
                </span>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 flex flex-col items-center">
            {/* Person image with rounded corners */}
            <div className="relative  mb-6">
              <div className="rounded-xl w-65 h-75 overflow-hidden relative -left-16 top-5 ">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop"
                  alt="Felix Sap"
                  className="w-full h-full  object-cover"
                />
              </div>

              {/* Quote box - top right */}
              <div className="absolute top-17 -right-16 p-4 max-w-xs">
                <p className="text-lg font-bold text-[var(--primary)] ">
                  Our brand <br /> finally feels <br /> alive online
                </p>
              </div>

              {/* Name and title overlay */}
              <div className="z-50 relative -right-52 bottom-10">
                <h3 className="text-base font-bold text-[var(--primary)]">
                  Felix Sap
                </h3>
                <p className="text-xs text-[var(--primary)]">Co-founder</p>
              </div>

              {/* Conversion rate boost card - bottom overlapping */}
              <div className="absolute -bottom-35 left-45 -translate-x-1/2 bg-[image:var(--linear-primary)] rounded-xl p-6 shadow-2xl">
                <p className="text-xl font-medium text-[var(--secondary)]  mb-2 text-center">
                  Conversion rate boost
                </p>
                <h2 className="text-7xl font-bold text-[var(--secondary)] text-center leading-none">
                  +85%
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
