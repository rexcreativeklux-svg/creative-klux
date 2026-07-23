"use client";
import React from "react";

/**
 * PracticeLoader — Creative Klux Blue Edition
 * An animated splash loader built around a vibrant corporate electric blue gradient.
 *
 * Props:
 * label string — text under the mark (default "Loading your app")
 * fullScreen boolean — fixed overlay covering the viewport (default true)
 * size number — Klux logo mark diameter in px (default 96)
 */
export default function PracticeLoader({
  label = "Loading your app",
  fullScreen = true,
  size = 96,
}) {
  return (
    <div className={`practice-loader ${fullScreen ? "is-fixed" : ""}`}>
      <div className="pl-stack">
        {/* Blue sun mark with radiating pulse rings */}
        <div className="pl-sun-wrap" style={{ width: size, height: size }}>
          <span className="pl-ring" />
          <span className="pl-ring pl-ring-2" />
          <span className="pl-ring pl-ring-3" />
          <div className="pl-sun">
            {/* Klux brand mark (replaces the old sunset "sun"). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logoblue.svg" alt="Creative Klux" className="pl-logo" />
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
          /* Light mode: Clean ice-blue to white background tint */
          background: radial-gradient(
            120% 90% at 50% 100%,
            #eff6ff 0%,
            #f8fafc 42%,
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
          filter: drop-shadow(0 8px 22px rgba(37, 99, 235, 0.25));
          transform-origin: center;
        }
        .pl-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }
        /* Radiating pulse — matching corporate blue */
        .pl-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #2563eb;
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
            opacity: 0.35;
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
          color: #334155; /* Slate gray text for readability */
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
            filter: drop-shadow(0 8px 22px rgba(37, 99, 235, 0.2));
          }
          50% {
            transform: scale(1.07);
            filter: drop-shadow(0 12px 30px rgba(37, 99, 235, 0.45));
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
        /* Dark Mode: Deep slate and navy tones */
        :global(.dark) .practice-loader {
          background: radial-gradient(
            120% 90% at 50% 100%,
            #0f172a 0%,
            /* Slate 900 background core */ #0b0f19 45%,
            #030712 100%
          );
        }
        :global(.dark) .pl-label {
          color: #94a3b8; /* Cool gray for dark text blend */
        }
        :global(.dark) .pl-ring {
          background: #1d4ed8; /* Darker blue ring pulse */
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
