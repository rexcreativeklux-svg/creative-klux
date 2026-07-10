import React from "react";

export default function MarketValueCompassPoster() {
  return (
    <div className=" flex items-center justify-center">
      <div
        className="ClientTestimonialPoster relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        style={{
          background: "var(--accent-on-primary)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow)",
          aspectRatio: "9 / 12",
        }}
      >
        <div
          className="absolute -bottom-12 -left-50 w-120 h-120 z-10 rounded-full"
          style={{ backgroundColor: "var(--primary)" }}
        ></div>

        <div className="absolute top-2 rotate-20  left-36 pointer-events-none">
          <svg width="120" height="450" viewBox="0 0 120 450">
            <path
              d="M40,0 Q10,40 30,80 Q60,120 20,160 Q5,200 40,240 Q80,280 30,320 Q10,360 50,400 Q70,425 60,450 L80,450 Q90,425 70,400 Q110,360 90,320 Q40,280 80,240 Q115,200 100,160 Q60,120 90,80 Q110,40 80,0 Z"
              fill="var(--primary-light)"
            />
          </svg>
        </div>

        <div className="relative z-10 h-full flex flex-col p-8">
          {/* Logo at top */}
          <div className="flex justify-center mb-6">
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

          {/* Main content area with two columns */}
          <div className=" flex relative gap-6">
            {/* Left column - Text */}
            <div className=" flex flex-col justify-between">
              {/* Headlines */}
              <div>
                <h1
                  className="text-3xl z-20 font-black leading-tight mb-3"
                  style={{ color: "var(--primary)" }}
                >
                  Your Market
                  <br />
                  Value
                </h1>

                {/* Equals sign */}
                <div className="mb-3">
                  <svg width="20" height="30" viewBox="0 0 40 30">
                    <line
                      x1="0"
                      y1="8"
                      x2="40"
                      y2="8"
                      stroke="var(--secondary)"
                      strokeWidth="8"
                    />
                    <line
                      x1="0"
                      y1="22"
                      x2="40"
                      y2="22"
                      stroke="var(--secondary)"
                      strokeWidth="8"
                    />
                  </svg>
                </div>

                <h2
                  className="text-3xl z-20 font-black leading-tight mb-6"
                  style={{ color: "var(--secondary)" }}
                >
                  Your
                  <br />
                  Compass
                </h2>

                {/* Description */}
                <p className="text-xs text-[var(--text-on-primary)] max-w-[220px] text-left font-medium z-20 leading-relaxed mb-6">
                  It guides every decision, keeps your brand aligned, and shows
                  customers what you stand for.
                </p>
              </div>

              {/* White pill with message */}
              <div className="flex justify-start">
                <div className="bg-[var(--primary-light)] z-20 rounded-full px-4 py-2 shadow-md mb-6">
                  <p className="text-xs font-bold text-[var(--primary)] text-center">
                    Without it? You'll lose direction
                  </p>
                </div>
              </div>
            </div>

            {/* Right column - Person image */}
            <div
              className="shrink-0 absolute top-10 -right-2 flex justify-center"
              style={{ width: "45%" }}
            >
              <div
                className="absolute top-0 left-8 w-40 h-40 rounded-full -translate-y-8"
                style={{ backgroundColor: "var(--secondary)" }}
              ></div>

              {/* Yellow circle behind person */}
              <div className="relative left-5 w-full">
                <img
                  src="https://png.pngtree.com/png-vector/20241019/ourlarge/pngtree-a-smiling-female-employee-posing-png-image_14113973.png"
                  alt="Professional woman"
                  className="relative z-10 w-auto h-120 bg-transparent  object-cover"
                />
              </div>
            </div>
          </div>

          {/* Footer - Contact info */}
          <div className="flex relative -bottom-25 justify-center ">
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
