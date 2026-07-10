import React from "react";

export default function MarketValueEasyPoster() {
  return (
    <div className=" flex items-center justify-center ">
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
            className="absolute inset-y-0 left-23 -top-10 rotate-25 h-full"
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
          <div className="mb-2">
            <p className="text-white text-xs font-semibold tracking-widest uppercase opacity-60">
              MARKET VALUE
            </p>
          </div>

          {/* Main Headline */}
          <div className="mb-4">
            <h1
              className="text-4xl font-bold leading-tight tracking-tight mb-1"
              style={{ color: "var(--secondary)" }}
            >
              Market Value Made
            </h1>
            <div
              className="inline-block px-4 py-1"
              style={{ backgroundColor: "var(--secondary)" }}
            >
              <h1
                className="text-4xl font-black leading-tight tracking-tight"
                style={{ color: "var(--primary)" }}
              >
                Easy to Learn
              </h1>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <p className="text-xs font-normal text-white opacity-80 leading-tight max-w-[200px]">
              Market value is simply the price an asset would sell for in a
              competitive marketplace
            </p>
          </div>

          {/* Image section */}
          <div className="flex-1 flex items-end justify-center">
            <div className="relative w-full max-w-sm">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop"
                alt="Person relaxing with laptop"
                className="w-full h-auto object-contain"
                style={{ maxHeight: "300px" }}
              />
            </div>
          </div>

          {/* Footer - Website URL */}
          <div className="mt-6">
            <div className="bg-white rounded-full px-6 py-1 shadow-lg text-center">
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
