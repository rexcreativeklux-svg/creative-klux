"use client";

import React from "react";
// The orb field and the scanline are shared with the Studio home page — see
// AmbientOrbCanvas.jsx. The defaults there are this pane's original values, so
// nothing here needs tuning.
import AmbientOrbCanvas, { AmbientSweep } from "./AmbientOrbCanvas";

/* ─── Animated dot-grid glyph ───────────────────────────────── */
function DotGlyph({ color, colorRgb }) {
  const dots = [
    { delay: "0s", op: 0.75 },
    { delay: "0.3s", op: 0.4 },
    { delay: "0.6s", op: 0.4 },
    { delay: "0.9s", op: 0.75 },
  ];

  return (
    <div style={{ position: "relative", width: 80, height: 80 }}>
      {/* outer ring */}
      {[1, 2].map((i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            inset: -(i * 7),
            borderRadius: "50%",
            border: `0.5px solid rgba(${colorRgb},${0.22 - i * 0.07})`,
            animation: `ck-ring ${2.2 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}

      {/* icon circle */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          // Every white-alpha fill in this file becomes the surface token: on
          // the dark preview pane a translucent white was a bright blob, and
          // the ambient orbs behind it still show through the same way.
          background: "var(--color-surface)",
          border: `0.5px solid rgba(${colorRgb},0.2)`,
          boxShadow: `0 8px 32px rgba(${colorRgb},0.10)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "ck-float 3.8s ease-in-out infinite",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* 2×2 dot grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
            width: 28,
            height: 28,
          }}
        >
          {dots.map((d, i) => (
            <div
              key={i}
              style={{
                background: color,
                opacity: d.op,
                borderRadius: 5,
                animation: `ck-dot-breathe 2s ease-in-out infinite`,
                animationDelay: d.delay,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Hint chips ─────────────────────────────────────────────── */
const HINTS = {
  ads_creative: ["Meta ad", "Google banner", "YouTube pre-roll"],
  social_creative: ["Instagram carousel", "Twitter thread", "TikTok caption"],
  designer_creative: ["Logo concept", "Brand kit", "UI mockup"],
  magic_studio: ["Photorealistic scene", "Abstract art", "Product render"],
  general: ["Social post", "Ad creative", "Brand visual"],
};

function HintChips({ config }) {
  const chips = HINTS[config.key] || HINTS.general;
  const { color, colorRgb } = config;

  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        justifyContent: "center",
        marginTop: 16,
        opacity: 0,
        animation: "ck-fade-up 0.5s ease 0.55s forwards",
      }}
    >
      {chips.map((chip) => (
        <span
          key={chip}
          style={{
            fontSize: 10,
            padding: "4px 10px",
            borderRadius: 20,
            background: "var(--color-surface)",
            border: `0.5px solid rgba(${colorRgb},0.2)`,
            color,
            fontWeight: 600,
            whiteSpace: "nowrap",
            cursor: "default",
            transition: "all 0.15s",
          }}
          // Hover tints with a translucent accent instead of `config.colorLight`
          // (#eff6ff and friends) — those pastels are opaque, so on the dark
          // pane they came out as near-white chips.
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `color-mix(in srgb, rgb(${colorRgb}) 10%, var(--color-surface))`;
            e.currentTarget.style.borderColor = `rgba(${colorRgb},0.4)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--color-surface)";
            e.currentTarget.style.borderColor = `rgba(${colorRgb},0.2)`;
          }}
        >
          {chip}
        </span>
      ))}
    </div>
  );
}

/* ─── Skeleton strip cards ───────────────────────────────────── */
function SkeletonStrips({ colorRgb }) {
  const strips = [
    { width: 90, barH: 54, flex: [2, 1], delays: ["0.1s", "0.25s"] },
    { width: 74, barH: 54, flex: [1, 2], delays: ["0.2s", "0.35s"] },
    { width: 120, barH: 40, flex: [3, 1], delays: ["0.15s", "0.3s"] },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        justifyContent: "center",
        marginTop: 28,
        opacity: 0,
        animation: "ck-fade-up 0.5s ease 0.75s forwards",
      }}
    >
      {strips.map((s, i) => (
        <div
          key={i}
          style={{
            width: s.width,
            borderRadius: 10,
            background: "var(--color-surface)",
            border: "0.5px solid var(--color-gray-200)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: s.barH,
              background: `rgba(${colorRgb},0.07)`,
              animation: "ck-shimmer 2.2s ease-in-out infinite",
            }}
          />
          <div style={{ padding: "6px 8px", display: "flex", gap: 5 }}>
            {s.flex.map((f, j) => (
              <div
                key={j}
                style={{
                  height: 6,
                  flex: f,
                  borderRadius: 3,
                  background: "var(--color-gray-200)",
                  animation: "ck-shimmer 2s ease-in-out infinite",
                  animationDelay: s.delays[j],
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function AiPreviewIdle({ config }) {
  const { color, colorRgb } = config;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes ck-float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-7px); }
        }
        @keyframes ck-ring {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 0.15; transform: scale(1.07); }
        }
        @keyframes ck-dot-breathe {
          0%, 100% { opacity: 0.9; }
          50%       { opacity: 0.25; }
        }
        @keyframes ck-shimmer {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
        @keyframes ck-fade-up {
          from { opacity: 0; transform: translateY(7px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* particle bg */}
      <AmbientOrbCanvas colorRgb={colorRgb} style={{ borderRadius: 14 }} />

      {/* content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <DotGlyph color={color} colorRgb={colorRgb} />

        {/* copy */}
        <div
          style={{
            marginTop: 26,
            opacity: 0,
            animation: "ck-fade-up 0.5s ease 0.2s forwards",
          }}
        >
          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--color-gray-900)",
              letterSpacing: "-0.02em",
              margin: "0 0 5px",
            }}
          >
            Ready to generate
          </p>
          <p
            style={{
              fontSize: 11,
              color: "var(--color-gray-400)",
              lineHeight: 1.6,
              maxWidth: 190,
              margin: "0 auto",
            }}
          >
            Describe your idea in the chat — your creative will appear here instantly
          </p>
        </div>

        <HintChips config={config} />

        {/* <SkeletonStrips colorRgb={colorRgb} /> */}
      </div>

      {/* scanline sweep */}
      <AmbientSweep colorRgb={colorRgb} style={{ zIndex: 5, borderRadius: 14 }} />
    </div>
  );
}