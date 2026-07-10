import React from "react";
import { Zap } from "lucide-react";

export default function MarketValuePoster() {
  return (
    <div className=" flex items-center justify-center p-8">
      <div
        className="corporate-poster relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        style={{
          background:
            "linear-gradient(65deg, #649cf5 0%, #193ca9 50%, #183ba8 100%)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow)",
          aspectRatio: "9 / 12",
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20"
          style={{ backgroundColor: "#3b82f6" }}
        />
        <div
          className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 opacity-20"
          style={{ backgroundColor: "#60a5fa" }}
        />

        <div className="relative z-10 py-8">
          {/* Header */}
          <div className="flex items-center justify-between px-8 mb-8">
            <div className="flex items-center gap-2">
              <Zap
                className="w-8 h-8"
                style={{ color: "var(--secondary)" }}
                fill="currentColor"
              />
              <div>
                <div className="font-bold text-sm text-white">MARKET</div>
                <div className="text-xs text-blue-200">VALUE</div>
              </div>
            </div>

            <button className="px-4 py-2 rounded-full border border-white text-sm font-semibold shadow-lg transition-all flex items-center gap-2 bg-transparent text-white hover:bg-white hover:text-blue-700">
              LET'S CONNECT
              <span
                className="w-5 h-5 rounded-full rotate-45 flex items-center justify-center text-xs"
                style={{
                  backgroundColor: "var(--secondary)",
                  color: "var(--text-on-secondary)",
                }}
              >
                ↑
              </span>
            </button>
          </div>

          {/* Headline */}
          <div className="mb-6 px-8">
            <h1 className="font-bold text-4xl leading-tight text-white mb-4">
              Understanding
              <br />
              Quick Tips Monitor
              <br />
              Market Value
            </h1>

            <p className="text-sm leading-relaxed font-normal opacity-90 text-white max-w-sm">
              Webinars give you exclusive access to experts who share proven
              methods, real experiences
            </p>
          </div>

          {/* Image and List Section */}
          <div className="relative mb-6 px-8">
            <div className="relative h-72">
              {/* Yellow curved border wrapping around image */}
              <div className="absolute bottom-0 right-0 w-3/5 h-full">
                <svg
                  viewBox="0 0 300 400"
                  className="w-full h-full absolute"
                  style={{ overflow: "visible" }}
                >
                  <path
                    d="M50,50 Q20,80 50,120 L50,350 Q50,380 80,380 L270,380 Q290,380 290,360 L290,80 Q290,50 260,50 Z"
                    style={{ fill: "var(--secondary)" }}
                  />
                </svg>
              </div>

              <div className="relative flex gap-4 h-full">
                {/* List Box */}
                <div
                  className="w-1/2 flex flex-col justify-center gap-3 z-20"
                  style={{
                    backgroundColor: "#1e40af",
                    borderRadius: "var(--radius-lg)",
                    padding: "1.5rem",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "var(--secondary)" }}
                    >
                      <svg
                        className="w-4 h-4"
                        style={{ color: "var(--text-on-secondary)" }}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-white text-sm font-semibold">
                      Provide Brand SDK
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "var(--secondary)" }}
                    >
                      <svg
                        className="w-4 h-4"
                        style={{ color: "var(--text-on-secondary)" }}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-white text-sm font-semibold">
                      Market High/lows
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "var(--secondary)" }}
                    >
                      <svg
                        className="w-4 h-4"
                        style={{ color: "var(--text-on-secondary)" }}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-white text-sm font-semibold">
                      Cognitive Resonance
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "var(--secondary)" }}
                    >
                      <svg
                        className="w-4 h-4"
                        style={{ color: "var(--text-on-secondary)" }}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-white text-sm font-semibold">
                      Haptic Branding
                    </span>
                  </div>
                </div>

                {/* Image with organic curved shape */}
                <div className="w-1/2 relative z-30 flex items-end">
                  <div className="relative w-full" style={{ height: "280px" }}>
                    <svg
                      viewBox="0 0 200 300"
                      className="absolute inset-0 w-full h-full"
                    >
                      <defs>
                        <clipPath id="organic-shape">
                          <path d="M40,30 Q20,60 40,90 L40,260 Q40,280 60,280 L180,280 Q190,280 190,270 L190,60 Q190,30 160,30 Z" />
                        </clipPath>
                      </defs>
                      <image
                        href="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=600&fit=crop"
                        x="0"
                        y="0"
                        width="200"
                        height="300"
                        clipPath="url(#organic-shape)"
                        preserveAspectRatio="xMidYMid slice"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side accent */}
        <div
          className="absolute top-1/2 right-0 w-1 h-32 -translate-y-1/2"
          style={{
            background:
              "linear-gradient(to bottom, var(--secondary), transparent)",
          }}
        />
      </div>
    </div>
  );
}
