import React from "react";
import "../Digital-Agency-Social-Media-Post.css";

export default function StrugglingResultsPoster() {
  return (
    <div className="flex items-center justify-center">
      <div
        className="struggling-poster relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        style={{
          background: "var(--linear-primary)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow)",
          aspectRatio: "9 / 12",
        }}
      >
        {/* Star shapes - top right */}
        <div className="absolute top-8 right-8 opacity-20 pointer-events-none">
          <svg width="80" height="80" viewBox="0 0 100 100">
            <path
              d="M50,10 L60,40 L90,40 L65,60 L75,90 L50,70 L25,90 L35,60 L10,40 L40,40 Z"
              fill="white"
            />
          </svg>
        </div>

        {/* Star shapes - bottom left */}
        <div className="absolute bottom-32 left-8 opacity-20 pointer-events-none">
          <svg width="60" height="60" viewBox="0 0 100 100">
            <path
              d="M50,10 L60,40 L90,40 L65,60 L75,90 L50,70 L25,90 L35,60 L10,40 L40,40 Z"
              fill="white"
            />
          </svg>
        </div>

        <div className="relative z-10 h-full flex flex-col p-8">
          {/* Logo at top */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: "var(--primary)" }}
                ></div>
              </div>
              <span className="text-white font-bold text-lg">yourlogo</span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold leading-tight text-white mb-2">
              Struggling to
            </h1>
            <div
              className="inline-block rotate-[-5deg] px-6 py-1 rounded-full mb-2"
              style={{ backgroundColor: "var(--secondary)" }}
            >
              <h1
                className="text-3xl font-bold leading-tight"
                style={{ color: "var(--text-on-secondary)" }}
              >
                Get Results
              </h1>
            </div>
            <h1 className="text-3xl font-bold leading-tight text-white">
              on Social Media?
            </h1>
          </div>

          {/* Image with circular white background */}
          <div className="flex-1 flex items-end justify-center mb-6 relative">
            {/* Large white semicircle background */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-white rounded-full z-10">
              {/* Footer - Social handle and website */}
              <div className="absolute bottom-4 left-5 z-50">
                <div className="flex  items-center justify-between text-xs">
                  <span className="font-semibold">@yoursocialmedia</span>
                  <span className="font-semibold">yourwebsite.com</span>
                </div>
              </div>
            </div>

            {/* Hidden SVG for exact semicircle clipPath */}
            {/* <svg width="0" height="0" className="absolute">
                            <defs>
                                <clipPath id="semicircle-clip">
                                   
                                    <circle cx="160" cy="160" r="160" />
                                    <rect x="0" y="0" width="320" height="160" />
                                </clipPath>
                            </defs>
                        </svg> */}

            {/* Clipped person image - positioned absolutely on top of the white semicircle */}
            {/* <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-80 h-80 z-20">
                            <img
                                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop"
                                alt="Woman thinking"
                                className="w-full h-full object-cover object-top"
                                style={{
                                    clipPath: 'url(#semicircle-clip)',
                                    filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.2))'
                                }}
                            />
                        </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
