"use client";

import React from "react";

/**
 * PracticeLoader — a Base44-style splash loader: an animated "sunset" mark
 * (an orange sun crossed by horizontal gaps) over a warm gradient, with a
 * "Loading your app…" label whose dots pulse.
 *
 * Fully self-contained (inline SVG + scoped keyframes), theme-aware, and
 * reusable anywhere.
 *
 * Props:
 *   label       string   — text under the mark (default "Loading your app")
 *   fullScreen  boolean  — fixed overlay covering the viewport (default true)
 *   size        number   — sun diameter in px (default 96)
 */
export default function PracticeLoader({
  label = "Loading your app",
  fullScreen = true,
  size = 96,
}) {
  return (
    <div className={`practice-loader ${fullScreen ? "is-fixed" : ""}`}>
      <div className="pl-stack">
        {/* Sun mark with radiating pulse rings */}
        <div className="pl-sun-wrap" style={{ width: size, height: size }}>
          <span className="pl-ring" />
          <span className="pl-ring pl-ring-2" />
          <span className="pl-ring pl-ring-3" />
          <div className="pl-sun">
          <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
            <defs>
              <linearGradient id="pl-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF9A5A" />
                <stop offset="55%" stopColor="#FB7A3C" />
                <stop offset="100%" stopColor="#F1651E" />
              </linearGradient>
              {/* thin transparent gaps across the lower half → the "sunset" bands */}
              <mask id="pl-mask">
                <rect x="0" y="0" width="100" height="100" fill="white" />
                <rect x="0" y="60" width="100" height="4.5" fill="black" />
                <rect x="0" y="72" width="100" height="4.5" fill="black" />
                <rect x="0" y="84" width="100" height="4.5" fill="black" />
              </mask>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="url(#pl-grad)"
              mask="url(#pl-mask)"
            />
          </svg>
          </div>
        </div>

        {/* Label with pulsing dots */}
        <p className="pl-label">
          {label}
          <span className="pl-dot">.</span>
          <span className="pl-dot">.</span>
          <span className="pl-dot">.</span>
        </p>
      </div>

      <style jsx>{`
        .practice-loader {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          min-height: 240px;
          background: radial-gradient(
            120% 90% at 50% 100%,
            #ffe6d2 0%,
            #fff5ee 42%,
            #ffffff 100%
          );
        }
        .practice-loader.is-fixed {
          position: fixed;
          inset: 0;
          z-index: 50;
        }
        .pl-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 22px;
        }
        .pl-sun-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pl-sun {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          animation: pl-breathe 2.4s ease-in-out infinite;
          filter: drop-shadow(0 8px 22px rgba(241, 101, 30, 0.28));
          transform-origin: center;
        }
        /* radiating pulse — filled sun-colored discs expanding from the centre */
        .pl-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #fb7a3c;
          transform-origin: center;
          animation: pl-ring 2.4s ease-out infinite;
        }
        .pl-ring-2 {
          animation-delay: 0.8s;
        }
        .pl-ring-3 {
          animation-delay: 1.6s;
        }
        @keyframes pl-ring {
          0% {
            transform: scale(1);
            opacity: 0.45;
          }
          100% {
            transform: scale(2.1);
            opacity: 0;
          }
        }
        .pl-label {
          margin: 0;
          font-size: 20px;
          font-weight: 500;
          letter-spacing: 0.2px;
          color: #9aa1ab;
        }
        .pl-dot {
          animation: pl-dots 1.4s infinite;
          opacity: 0.2;
        }
        .pl-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .pl-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes pl-breathe {
          0%,
          100% {
            transform: scale(1);
            filter: drop-shadow(0 8px 22px rgba(241, 101, 30, 0.24));
          }
          50% {
            transform: scale(1.07);
            filter: drop-shadow(0 12px 30px rgba(241, 101, 30, 0.42));
          }
        }
        @keyframes pl-dots {
          0%,
          60%,
          100% {
            opacity: 0.2;
          }
          30% {
            opacity: 1;
          }
        }
        /* App dark mode is class-based (next-themes, darkMode class): the dark
           class on <html> is the single source of truth. Follow it so the
           background respects the SELECTED theme, not the OS preference. The
           light background is the base rule above; the sun keeps its colours. */
        :global(.dark) .practice-loader {
          background: radial-gradient(
            120% 90% at 50% 100%,
            #2a1c14 0%,
            #1a1613 45%,
            #121011 100%
          );
        }
        :global(.dark) .pl-label {
          color: #8b9099;
        }
        @media (prefers-reduced-motion: reduce) {
          .pl-sun,
          .pl-dot,
          .pl-ring {
            animation: none;
          }
          .pl-ring {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
