import React from "react";

export default function FactorsAffectPoster() {
  return (
    <div className=" flex items-center justify-center p-8">
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

        <div className="relative z-10 h-full flex flex-col p-8">
          {/* Header */}
          <div className="text-center mb-3">
            <p className="text-white text-xs font-bold tracking-widest uppercase opacity-60">
              MARKET VALUE
            </p>
          </div>

          {/* Main Headline */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-semibold leading-tight tracking-tight"
              style={{ color: "var(--secondary)" }}
            >
              FACTORS THAT AFFECT
              <br />
              MARKET VALUE
            </h1>
          </div>

          {/* Image section */}
          <div className="mb-3">
            <div
              className="rounded-lg overflow-hidden shadow-lg bg-white"
              style={{ height: "240px" }}
            >
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop"
                alt="Professional woman"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Pills/Tags section */}
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="flex gap-3 w-full justify-center">
              <div
                className="px-3 py-1 rounded-xl shadow-lg text-center"
                style={{ backgroundColor: "var(--secondary)" }}
              >
                <span className="text-sm font-medium text-gray-600">
                  Supply & Demand
                </span>
              </div>
              <div
                className="px-3 py-1 rounded-xl shadow-lg text-center"
                style={{ backgroundColor: "var(--secondary)" }}
              >
                <span className="text-sm font-medium text-gray-600">
                  Trends & Perceptions
                </span>
              </div>
            </div>

            <div className="flex justify-center w-full">
              <div
                className="px-3 py-1 rounded-xl shadow-lg text-center"
                style={{ backgroundColor: "var(--secondary)" }}
              >
                <span className="text-sm font-medium text-gray-600">
                  Economic Conditions
                </span>
              </div>
            </div>
          </div>

          {/* Footer - Website URL */}
          <div className="mt-10">
            <div className="bg-white rounded-full px-4 py-1 shadow-lg text-center">
              <p
                className="text-xs font-bold"
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
