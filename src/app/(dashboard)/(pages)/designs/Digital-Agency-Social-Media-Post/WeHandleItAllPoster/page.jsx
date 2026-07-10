import React from "react";
import "../Digital-Agency-Social-Media-Post.css";

export default function WeHandleItAllPoster() {
  return (
    <div className=" flex items-center justify-center ">
      <div
        className="struggling-poster relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        style={{
          background: "var(--linear-primary)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow)",
          aspectRatio: "9 / 12",
        }}
      >
        {/* Large background checkmark */}
        <div className="absolute  inset-0 overflow-hidden pointer-events-none opacity-10">
          <svg
            className="absolute top-60 -left-30 rotate-0 w--100 h-full"
            viewBox="0 0 400 600"
            fill="none"
          >
            <path
              d="
      M300 80
      C200 40, 90 140, 110 250
      C130 330, 240 360, 300 320
      C360 280, 420 400, 350 450
      C300 480, 260 430, 320 380
    "
              stroke="var(--accent-on-secondary)"
              strokeWidth="15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Large background checkmark */}
        <div className="absolute  inset-0 overflow-hidden pointer-events-none opacity-10">
          <svg
            className="absolute top-70 -left-25 rotate-0 w-100 h-120"
            viewBox="0 0 400 600"
            fill="none"
          >
            <path
              d="
      M300 80
      C200 40, 90 140, 110 250
      C130 330, 240 360, 300 320
    "
              stroke="var(--accent-on-secondary)"
              strokeWidth="15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="relative z-10 h-full flex flex-col p-8">
          {/* Logo at top */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <div className="w-5 h-5 border-4 border-blue-600 rounded-full"></div>
              </div>
              <span className="text-white font-bold text-xl">yourlogo</span>
            </div>
          </div>

          {/* Image with organic blob shape */}
          <div className="mb-4">
            <svg width="0" height="0" className="absolute">
              <defs>
                <clipPath id="blob-clip" clipPathUnits="objectBoundingBox">
                  <path d="M0.023438 0.319010 C0.100000 0.150000 0.150000 0.050000 0.328125 0.053385 L0.510417 0.165365 C0.632813 -0.048177 0.942708 0.016927 1.005208 0.347656 L1.002604 0.660156 C0.963542 0.959635 0.848958 0.964844 0.700000 0.950000 L0.541667 0.842448 C0.395833 1.076823 0.039063 0.944010 0.026042 0.683594 Z" />
                </clipPath>
              </defs>
            </svg>

            <div
              className="w-full overflow-hidden"
              style={{
                height: "240px",
                clipPath: "url(#blob-clip)",
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop"
                alt="Team meeting with whiteboard"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Description text */}
          <div className="text-center mb-4">
            <p className="text-xs font-medium text-white leading-relaxed">
              With our Social Media Digital Marketing, you'll get targeted
              strategies that bring real results.
            </p>
          </div>

          {/* Main Headline */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold leading-tight text-white mb-2">
              From content creation
              <br />
              to ad optimization
            </h1>
            <div
              className="inline-block px-2 rotate-7 mt-[-5px] py-1 rounded-full"
              style={{ backgroundColor: "var(--secondary)" }}
            >
              <h1
                className="text-xl font-bold leading-tight"
                style={{ color: "var(--text-on-secondary)" }}
              >
                we handle it all
              </h1>
            </div>
          </div>

          {/* Footer - Social handle and website */}
          <div className="mt-auto flex items-center justify-between text-white text-xs font-bold">
            <span>@yoursocialmedia</span>
            <span>yourwebsite.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}
