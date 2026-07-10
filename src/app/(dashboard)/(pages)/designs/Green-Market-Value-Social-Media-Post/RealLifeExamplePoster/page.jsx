import React from "react";
import "../Green-Market-Value-Social-Media-Post.css";

export default function RealLifeExamplePoster() {
  return (
    <div className="flex items-center justify-center">
      <div
        className="example-poster relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        style={{
          background: "var(--linear-primary)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow)",
          aspectRatio: "9 / 12",
        }}
      >
        {/* Background decorative curvy vertical lines */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          {/* Line 1 */}
          <svg
            className="absolute inset-y-0 left-[49%] h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 800"
            preserveAspectRatio="none"
          >
            <path
              d="M50,0 Q40,100 50,200 T50,400 T50,600 T50,800"
              fill="none"
              stroke="white"
              strokeWidth="25"
              strokeLinecap="round"
            />
          </svg>

          {/* Line 2 */}
          <svg
            className="absolute inset-y-0 left-[69%] rotate-6 h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 800"
            preserveAspectRatio="none"
          >
            <path
              d="M50,0 Q60,100 50,200 T50,400 T50,600 T50,800"
              fill="none"
              stroke="white"
              strokeWidth="25"
              strokeLinecap="round"
            />
          </svg>

          {/* Line 3 */}
          <svg
            className="absolute inset-y-0 left-23 rotate-25 h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 800"
            preserveAspectRatio="none"
          >
            <path
              d="M50,0 Q40,100 50,200 T50,400 T50,600 T50,800"
              fill="none"
              stroke="white"
              strokeWidth="25"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="relative z-10 h-full flex flex-col justify-between p-8">
          {/* Header */}
          <div className="text-center opacity-60 mb-8">
            <p className="text-white text-xs font-bold tracking-widest uppercase ">
              MARKET VALUE
            </p>
          </div>

          {/* Content grid */}
          <div className=" flex flex-col gap-2">
            {/* Top row */}
            <div className="flex gap-2">
              {/* Life Example badge + Main headline */}
              <div
                className="w-[60%] px-4 rounded-lg  shadow-lg flex flex-col justify-center relative overflow-visible"
                style={{ background: "var(--secondary-light)" }}
              >
                {/* Badge */}
                <div
                  className="inline-flex rotate-[-8deg] -top-3 -left-6 absolute self-start px-5 py-2 rounded-full text-xs font-bold mb-4 shadow-md"
                  style={{ backgroundColor: "var(--secondary)" }}
                >
                  Life Example
                </div>

                {/* Headline */}
                <h1 className="text-2xl font-bold text-[var(--text-on-secondary)] leading-tight">
                  Real-Life
                  <br />
                  Example of
                  <br />
                  Market Value
                </h1>
              </div>

              {/* Top right image */}
              <div className="w-[40%] h-[140px] rounded-lg overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=400&fit=crop"
                  alt="Business analysis"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Bottom row */}
            <div className="flex gap-2">
              {/* Bottom left image */}
              <div className="w-[40%] h-[140px] rounded-lg overflow-hidden shadow-lg bg-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop"
                  alt="Professional woman"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Bottom right text box */}
              <div
                className="w-[60%] rounded-lg px-2 shadow-lg flex"
                style={{ background: "var(--secondary)" }}
              >
                <p className="text-sm text-[var(--text-on-secondary)] font-semibold pt-5 leading-tight">
                  The production cost might be $200, but the market value is
                  $800 because of demand, brand reputation, and perceived worth.
                </p>
              </div>
            </div>
          </div>

          {/* Footer - Website URL */}
          <div className="mt-8">
            <div className="bg-white rounded-full px-6 py-1 shadow-lg text-center">
              <p
                className="text-sm font-bold"
                style={{ color: "var(--primary)" }}
              >
                www.yourwebsite.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
