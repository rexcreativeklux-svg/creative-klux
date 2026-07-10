import React from "react";
import { X } from "lucide-react";

export default function MarketValueMissingPoster() {
  return (
    <div className=" flex items-center justify-center">
      <div
        className="ClientTestimonialPoster relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        style={{
          background: "var(--linear-primary)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow)",
          aspectRatio: "9 / 12",
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute top-2 -right-16 w-28 h-28 rounded-full"
          style={{ backgroundColor: "var(--primary)" }}
        ></div>
        <div
          className="absolute top-72 left-4 w-7 h-7 rounded-full"
          style={{ backgroundColor: "var(--secondary)" }}
        ></div>
        <div
          className="absolute bottom-40 right-29 w-7 h-7 rounded-full"
          style={{ backgroundColor: "var(--secondary)" }}
        ></div>
        <div
          className="absolute -bottom-3 -left-10 w-65 h-65 rounded-full"
          style={{ backgroundColor: "var(--primary)" }}
        ></div>

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

          {/* Main Headline */}
          <div className="mb-8 flex justify-center">
            <h1
              className="text-4xl font-black leading-tight"
              style={{ color: "var(--primary)" }}
            >
              What Happens
              <br />
              When Market
              <br />
              <span className="bg-[var(--secondary)] text-[var(--primary)] mr-2">
                Value Is{" "}
              </span>
              <span className="bg-[var(--secondary)] text-[var(--primary)]">
                Missing?
              </span>
            </h1>
          </div>

          {/* Person image on left, list on right */}
          <div className=" relative flex gap-4 mb-6">
            {/* Person image */}
            <div className="shrink-0 absolute top-28 -left-5 w-36">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop"
                alt="Surprised woman"
                className="w-full h-auto object-contain"
                style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.1))" }}
              />
            </div>

            {/* List items */}
            <div className="flex justify-end w-full">
              <div className=" flex flex-col items-end space-y-3">
                <div
                  className="flex relative  items-center gap-2 pr-5 px-2 py-2 rounded-full shadow-md"
                  style={{ backgroundColor: "var(--secondary)" }}
                >
                  <X
                    className="w-4 h-4 shrink-0"
                    style={{ color: "var(--text-on-secondary)" }}
                    strokeWidth={3}
                  />
                  <span
                    className="text-xs font-bold"
                    style={{ color: "var(--text-on-secondary)" }}
                  >
                    Community leagues & friendly matches
                  </span>
                </div>

                <div
                  className="flex relative  items-center gap-2 px-4 py-2 rounded-full shadow-md"
                  style={{ backgroundColor: "var(--secondary)" }}
                >
                  <X
                    className="w-4 h-4 shrink-0"
                    style={{ color: "var(--text-on-secondary)" }}
                    strokeWidth={3}
                  />
                  <span
                    className="text-xs font-bold"
                    style={{ color: "var(--text-on-secondary)" }}
                  >
                    Events & tournaments every month
                  </span>
                </div>

                <div
                  className="flex relative left-0 items-center gap-2 px-4 py-2 w-[85%] rounded-full shadow-md"
                  style={{ backgroundColor: "var(--secondary)" }}
                >
                  <X
                    className="w-4 h-4 shrink-0"
                    style={{ color: "var(--text-on-secondary)" }}
                    strokeWidth={3}
                  />
                  <span
                    className="text-xs font-bold"
                    style={{ color: "var(--text-on-secondary)" }}
                  >
                    2 vs 2 format for teamwork
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom text */}
          <div className="text-center relative top-15 flex justify-end mb-6">
            <p className="text-xs text-right font-medium opacity-80 leading-relaxed">
              Clarity builds confidence.
              <br />
              Confusion kills trust.
            </p>
          </div>

          {/* Footer - Contact info */}
          <div className="flex relative -bottom-20 justify-center ">
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
