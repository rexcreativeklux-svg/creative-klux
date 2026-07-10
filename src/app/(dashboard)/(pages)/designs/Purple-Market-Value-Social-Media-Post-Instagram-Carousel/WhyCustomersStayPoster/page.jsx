import React from "react";
import { Check } from "lucide-react";

export default function WhyCustomersStayPoster() {
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
          className="absolute top-80 left-0 w-24 h-24 rounded-full -translate-x-1/2"
          style={{ backgroundColor: "var(--primary)" }}
        ></div>
        <div
          className="absolute top-66 right-22 w-10 h-10 rounded-full translate-x-1/2"
          style={{ backgroundColor: "var(--primary)" }}
        ></div>

        <div className="relative z-10 h-full flex flex-col p-8">
          {/* Logo at top */}
          <div className="flex justify-center mb-4">
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
          <div className="text-center mb-4">
            <h1
              className="text-3xl font-black leading-tight"
              style={{ color: "var(--primary)" }}
            >
              Why Customers
              <br />
              Stay With You?
            </h1>
          </div>

          {/* Yellow badge */}
          <div className="flex justify-center mb-6">
            <div
              className="inline-block px-6 py-1 max-w-[200px] rounded"
              style={{ backgroundColor: "var(--secondary)" }}
            >
              <p
                className="text-sm font-black flex text-center"
                style={{ color: "var(--primary)" }}
              >
                Because they share your values
              </p>
            </div>
          </div>

          {/* Two person images side by side */}
          <div className="flex gap-3 justify-center mb-6">
            {/* Person 1 */}
            <div className="relative">
              <div
                className="w-32 h-30 rounded-2xl overflow-hidden"
                style={{ backgroundColor: "var(--secondary)" }}
              >
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=400&fit=crop"
                  alt="Customer 1"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Person 2 */}
            <div className="relative top-10">
              <div
                className="w-32 h-30 rounded-2xl overflow-hidden"
                style={{ backgroundColor: "var(--secondary)" }}
              >
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=400&fit=crop"
                  alt="Customer 2"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Checklist items */}
          <div className="space-y-3 z-20 flex flex-col justify-center items-center  mb-8">
            <div
              className="flex items-center gap-3 px-4 py-2 rounded-full"
              style={{ backgroundColor: "var(--primary)" }}
            >
              <div className="shrink-0 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                <Check
                  className="w-3 h-3"
                  style={{ color: "var(--primary)" }}
                  strokeWidth={3}
                />
              </div>
              <span className="text-white text-xs font-semibold">
                Show what you believe in
              </span>
            </div>

            <div
              className="flex items-center gap-3 px-4 py-2 rounded-full"
              style={{ backgroundColor: "var(--primary)" }}
            >
              <div className="shrink-0 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                <Check
                  className="w-3 h-3"
                  style={{ color: "var(--primary)" }}
                  strokeWidth={3}
                />
              </div>
              <span className="text-white text-xs font-semibold">
                Communicate it consistently
              </span>
            </div>

            <div
              className="flex items-center gap-3 px-4 py-2 rounded-full"
              style={{ backgroundColor: "var(--primary)" }}
            >
              <div className="shrink-0 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                <Check
                  className="w-3 h-3"
                  style={{ color: "var(--primary)" }}
                  strokeWidth={3}
                />
              </div>
              <span className="text-white text-xs font-semibold">
                Make customers feel aligned
              </span>
            </div>
          </div>

          {/* Footer - Contact info */}
          <div className="flex justify-center">
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
