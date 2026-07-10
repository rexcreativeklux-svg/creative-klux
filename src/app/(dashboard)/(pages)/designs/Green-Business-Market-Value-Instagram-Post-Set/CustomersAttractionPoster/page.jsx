import React from "react";
import "../Green-Business-Market-Value-Instagram-Post-Set.css";

export default function CustomersAttractionPoster() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div
        className="Green-Business-Market-Value-Instagram-Post-Set relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--secondary-light)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow)",
          aspectRatio: "9 / 12",
        }}
        data-size="medium"
        data-category="customer-engagement"
        data-industry="business"
        data-orientation="portrait"
        data-event="none"
      >
        {/* Decorative light green rectangles in background */}
        <div className="absolute text-[650px] font-bold text-[var(--accent-on-secondary)] -top-55 right-2">
          *
        </div>

        <div className="relative z-10 h-full flex flex-col p-8">
          {/* Person image and headline section */}
          <div className="flex gap-4 mb-6">
            {/* Person image */}
            <div className="shrink-0">
              <div className="w-44 h-50 rounded-3xl overflow-hidden shadow-xl bg-gray-300">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop"
                  alt="Customer"
                  className="w-full h-full object-cover grayscale"
                />
              </div>
            </div>

            {/* Logo and headline */}
            <div className="flex-1 flex flex-col">
              {/* Company logo */}
              <div className="flex items-center relative -right-18 gap-2 mb-4">
                <svg width="24" height="24" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="18" fill="var(--primary)" />
                  <circle cx="20" cy="20" r="8" fill="var(--bg-light)" />
                  <rect
                    x="18"
                    y="5"
                    width="4"
                    height="8"
                    fill="var(--bg-light)"
                  />
                  <rect
                    x="18"
                    y="27"
                    width="4"
                    height="8"
                    fill="var(--bg-light)"
                  />
                  <rect
                    x="5"
                    y="18"
                    width="8"
                    height="4"
                    fill="var(--bg-light)"
                  />
                  <rect
                    x="27"
                    y="18"
                    width="8"
                    height="4"
                    fill="var(--bg-light)"
                  />
                </svg>
                <div className="text-left">
                  <div className="text-xs font-bold text-[var(--primary)]">
                    Company
                  </div>
                  <div className="text-xs text-[var(--primary)]">Name Here</div>
                </div>
              </div>

              {/* Headline */}
              <div className="relative -left-5">
                <h1 className="text-4xl font-black relative -left-3 leading-tight mb-2 text-[var(--primary)]">
                  Customers
                  <br />
                  with Your
                </h1>
                <div className="inline-flex relative w-[600px] items-center gap-2 px-4 bg-[var(--secondary)]">
                  <div className="absolute text-[100px] font-bold text-[var(--primary)] -top-10 -left-6">
                    *
                  </div>
                  <span className="text-4xl relative pl-6 font-bold text-white">
                    Today?
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main content box */}
          <div className="flex-1 rounded-3xl px-5 py-6 shadow-2xl bg-[var(--primary)] relative">
            {/* Vertical text on the left */}
            <div className="absolute left-2 top-2 bottom-2 flex items-center justify-center w-12">
              <div className="transform -rotate-90 bg-[var(--secondary-light)] py-3 px-2 rounded-full origin-center whitespace-nowrap">
                <p className="text-xs font-black text-[var(--primary)] tracking-widest">
                  ATTRACTING TO THE CUSTOMERS
                </p>
              </div>
            </div>

            {/* Large decorative asterisk positioned under the main text (bottom right area) */}
            <div className="absolute -top-10 -right-3 text-[350px] leading-none font-medium text-[var(--accent-on-primary)]  pointer-events-none select-none">
              ✱
            </div>

            {/* Main content */}
            <div className="ml-12 relative z-10">
              <h2 className="text-lg font-bold border-b-2 pb-3 text-[var(--secondary-light)] mb-4">
                Want loyal, aligned customers?
                <br />
                Start by showing who you are.
              </h2>

              {/* Bullet points */}
              <ul className="space-y-2">
                <li className="flex items-start gap-3 text-[var(--secondary-light)]">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full mt-2 bg-[var(--secondary-light)]"></span>
                  <span className="text-sm leading-relaxed">
                    Strong values filter in audiences.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-[var(--secondary-light)]">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full mt-2 bg-[var(--secondary-light)]"></span>
                  <span className="text-sm leading-relaxed">
                    People support brands they feel emotionally connected.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-[var(--secondary-light)]">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full mt-2 bg-[var(--secondary-light)]"></span>
                  <span className="text-sm leading-relaxed">
                    Communicating your values.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-[var(--secondary-light)]">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full mt-2 bg-[var(--secondary-light)]"></span>
                  <span className="text-sm leading-relaxed">
                    Aligned with customers.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--primary)]">
              @yoursocialmedia
            </span>
            <span className="text-sm font-bold text-[var(--primary)]">
              www.yourwebsite.com
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
