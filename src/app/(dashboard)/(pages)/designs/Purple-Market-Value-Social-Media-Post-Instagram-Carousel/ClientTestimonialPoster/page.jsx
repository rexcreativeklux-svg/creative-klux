import React from "react";
import "../Purple-Market-Value-Social-Media-Post.css";

export default function ClientTestimonialPoster() {
  return (
    <div className="flex items-center justify-center">
      <div
        className="ClientTestimonialPoster relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden bg-[#efeff7]"
        style={{
          background: "var(--linear-primary)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow)",
          aspectRatio: "9 / 12",
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute top-20 left-8 w-13 h-13 rounded-full"
          style={{ backgroundColor: "var(--primary)" }}
        ></div>
        <div
          className="absolute top-14 right-8 w-14 h-14 rounded-full"
          style={{ backgroundColor: "var(--secondary)" }}
        ></div>
        <div
          className="absolute bottom-6 right-0 w-12 h-12 rounded-full"
          style={{ backgroundColor: "var(--primary)" }}
        ></div>

        <div className="relative z-10 h-full flex flex-col p-8">
          {/* Logo at top */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--primary)" }}
              >
                <div className="w-4 h-4 border-3 border-white rounded-full"></div>
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-gray-800">
                  Company name
                </div>
                <div className="text-xs text-gray-500">here</div>
              </div>
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center mb-8">
            <h1
              className="text-4xl font-black leading-tight"
              style={{ color: "var(--primary)" }}
            >
              Hear It From
              <br />
              Our Clients
            </h1>
          </div>

          {/* Person image with decorative background circles */}
          <div className="flex-1 flex items-center justify-center mb-6 relative">
            {/* Large purple circle - top */}
            {/* Wide, thin, shallow U-shaped purple curve at top */}
            <svg
              className="absolute top-0 left-0 w-full z-20 h-24" // h-32 for thin (adjust to h-24 for even thinner)
              viewBox="0 0 1440 128"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M0,0 L0,64 Q720,100 1440,64 L1440,0 Z"
                fill="var(--primary)"
              />
            </svg>

            {/* Large yellow circle - bottom */}
            <div
              className="absolute -bottom-30 z-0 left-1/2 -translate-x-1/2 w-100 h-100 rounded-full"
              style={{ backgroundColor: "var(--secondary)" }}
            ></div>

            {/* Person image */}
            <div className="relative z-20">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop"
                alt="Happy client"
                className="w-48 h-auto object-contain"
                style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.15))" }}
              />
            </div>
          </div>

          {/* Testimonial quote box */}
          <div
            className="rounded-2xl absolute left-22 bottom-14 z-20 px-4 py-2 max-w-[270px] border-4 border-white/60 mb-6"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <p className="text-white text-xs font-bold leading-relaxed text-center mb-3">
              "Working with [company name] gave us clarity and direction. Our
              customers finally understand what we stand for."
            </p>
            <p className="text-white text-xs font-bold text-center">
              - Alex T.
            </p>
          </div>

          {/* Footer - Contact info */}
          <div className="flex justify-center">
            <div className="flex z-20 w-[250px] rounded-full py-1 items-center justify-center bg-white gap-4 text-gray-600 text-xs font-bold">
              <span>(00) 000-0000</span>
              <span>www.yourwebsite.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
