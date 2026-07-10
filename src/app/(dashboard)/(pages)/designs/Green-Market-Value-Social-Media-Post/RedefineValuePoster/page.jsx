import React from "react";

export default function RedefineValuePoster() {
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

        <div className="relative z-10 h-full justify-between flex flex-col p-8">
          {/* Top badge */}
          <div className="flex absolute top-16 rotate-[-4deg] left-40 z-20 justify-center mb-6">
            <div className="bg-white px-4 py-1 text-[var(--tertiary)] rounded-full shadow-lg">
              <span className="text-sm font-bold text-gray-600">
                Market Value
              </span>
            </div>
          </div>

          {/* Large yellow card */}
          <div
            className="relative mt-12 rounded-lg h-[380px] shadow-2xl overflow-hidden"
            style={{ backgroundColor: "var(--secondary)" }}
          >
            {/* Decorative curvy lines in background */}
            <div className="absolute bottom-0 right-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
              <svg
                className="absolute bottom-0 right-0 w-[120%] h-[80%]"
                viewBox="0 0 400 300"
                preserveAspectRatio="none"
              >
                <path
                  d="M250,300 Q200,250 250,200 Q300,150 250,100 Q200,50 250,0"
                  fill="none"
                  stroke="#fef08a"
                  strokeWidth="60"
                  strokeLinecap="round"
                />
                <path
                  d="M350,300 Q300,250 350,200 Q400,150 350,100 Q300,50 350,0"
                  fill="none"
                  stroke="#fef08a"
                  strokeWidth="60"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="relative z-10 p-8 h-full flex flex-col  text-center">
              {/* Main headline */}
              <div className="mb-8">
                <h1
                  className="text-5xl font-black  tracking-tight"
                  style={{ color: "var(--text-on-secondary)" }}
                >
                  READY TO
                  <br />
                  <span
                    className="inline-block px-4 py-1 my-1"
                    style={{
                      backgroundColor: "var(--text-on-secondary)",
                      color: "var(--secondary)",
                    }}
                  >
                    REDEFINE
                  </span>
                  <br />
                  YOUR VALUE
                </h1>
              </div>

              {/* Sub-text */}
              <div className=" flex items-center">
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-on-secondary)" }}
                >
                  Follow us for more insights on building a brand that matters.
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
