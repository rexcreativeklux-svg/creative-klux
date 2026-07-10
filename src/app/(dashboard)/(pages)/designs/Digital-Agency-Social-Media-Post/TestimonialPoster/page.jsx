import React from "react";

export default function TestimonialPoster() {
  return (
    <div className="flex items-center justify-center ">
      <div
        className="relative struggling-poster w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        style={{
          background: "var(--linear-primary)",
          aspectRatio: "9 / 12",
        }}
      >
        {/* Large background decorative circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-0 -left-20 w-64 h-64 rounded-full "
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          ></div>
          <div
            className="absolute bottom-20 -right-12 w-96 h-96 rounded-full "
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          ></div>
        </div>

        <div className="relative z-10 h-full flex flex-col p-8">
          {/* Logo at top */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <div
                  className="w-5 h-5 border-4 rounded-full"
                  style={{ borderColor: "var(--primary)" }}
                ></div>
              </div>
              <span className="text-white font-bold text-xl">yourlogo</span>
            </div>
          </div>

          {/* Main content area with two columns */}
          <div className="flex-1 flex gap-4 mb-8">
            {/* Left column - Testimonial and What They Say */}
            <div className="flex-1 flex flex-col gap-4">
              {/* Testimonial card */}
              <div className="bg-white rounded-2xl p-4 relative overflow-hidden">
                {/* Background decorative shape */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle
                      cx="80"
                      cy="20"
                      r="60"
                      fill="var(--primary-light)"
                    />
                  </svg>
                </div>

                {/* Quote icon */}
                <div
                  className="absolute top-4 left-4 text-4xl font-bold "
                  style={{ color: "var(--primary)" }}
                >
                  "
                </div>

                <div className="relative z-10 mt-8">
                  <p className="text-gray-900 font-medium text-sm mb-4 leading-relaxed">
                    We grew our client's Instagram reach by 350% in just 3
                    months
                  </p>
                  <p className="text-sm">
                    <span className="font-bold text-gray-900">
                      Client Name,
                    </span>
                    <span className="text-gray-700"> Company</span>
                  </p>
                </div>
              </div>

              {/* What They Say card */}
              <div
                className="rounded-2xl p-8 relative overflow-hidden flex-1 flex items-center justify-center"
                style={{ backgroundColor: "var(--secondary)" }}
              >
                {/* Background decorative circle */}
                {/* Background decorative circles */}
                <div
                  className="absolute bottom-4 left-4 w-24 h-24 rounded-full "
                  style={{ backgroundColor: "rgba(0,0,0,0.1)" }}
                ></div>
                <div
                  className="absolute top-8 right-8 w-32 h-32 rounded-full "
                  style={{ backgroundColor: "rgba(0,0,0,0.1)" }}
                ></div>

                <div className="text-center relative z-10">
                  <h2
                    className="text-4xl font-bold leading-tight"
                    style={{ color: "var(--text-on-secondary)" }}
                  >
                    What
                    <br />
                    <span
                      className="inline-block px-2 py-1 rotate-[-6deg] rounded-full text-white"
                      style={{ backgroundColor: "var(--primary)" }}
                    >
                      They
                    </span>
                    <br />
                    Say
                  </h2>
                </div>
              </div>
            </div>

            {/* Right column - Person image */}
            <div className="w-40">
              <svg width="0" height="0" className="absolute">
                <defs>
                  <clipPath id="person-clip" clipPathUnits="objectBoundingBox">
                    <path d="M 0.5,0 C 0.78,0 1,0.22 1,0.5 L 1,0.85 C 1,0.93 0.93,1 0.85,1 L 0.15,1 C 0.07,1 0,0.93 0,0.85 L 0,0.5 C 0,0.22 0.22,0 0.5,0 Z" />
                  </clipPath>
                </defs>
              </svg>

              <div
                className="w-full h-full relative"
                style={{
                  clipPath: "url(#person-clip)",
                }}
              >
                {/* Yellow background circle */}
                <div
                  className="absolute top-0 w-full h-48 rounded-full"
                  style={{ backgroundColor: "var(--secondary)" }}
                ></div>

                {/* Person image */}
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop"
                  alt="Satisfied client"
                  className="w-full h-full object-cover relative z-10"
                />
              </div>
            </div>
          </div>

          {/* Footer - Social handle and website */}
          <div className="flex items-center justify-between text-white text-xs font-bold">
            <span>@yoursocialmedia</span>
            <span>yourwebsite.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}
