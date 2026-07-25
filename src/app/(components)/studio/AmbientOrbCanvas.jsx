"use client";

// app/(components)/studio/AmbientOrbCanvas.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The Studio's ambient backdrop — drifting brand-tinted orbs, floating dots and
// the hairline that links nearby dots together. This started life inside
// <AiPreviewIdle /> (the chat page's "Ready to generate" pane); it lives here so
// any surface can wear the same background instead of re-implementing it.
//
// Two pieces, both purely decorative and both pointer-events:none:
//
//   <AmbientOrbCanvas />  the particle field, painted on a <canvas>
//   <AmbientSweep />      the slow horizontal scanline that crosses it
//
// Sizing: the canvas fills its positioned parent and re-builds its scene on
// resize, so the same component works in a 600px panel and behind a full page.
// `orbScale` is the only knob most callers need — it multiplies every orb radius
// so a large surface gets proportionally larger, softer washes.
//
// Motion: honours `prefers-reduced-motion`. When the user asks for less motion
// we paint ONE static frame and stop, so the composition still reads as designed
// without anything moving.
//
// Cost: one rAF loop and one canvas per instance. Keep it to one per screen.

import { useEffect, useRef } from "react";

/** The app's brand blue, as the "r,g,b" string every prop here expects. */
export const AMBIENT_BRAND_RGB = "0,61,218";

/**
 * Orb layout. `x`/`y` are FRACTIONS of the canvas (so the composition holds at
 * any size); `r` is in CSS pixels and is multiplied by `orbScale`.
 * @type {{x: number, y: number, r: number, phase: number, speed: number}[]}
 */
const DEFAULT_ORBS = [
  { x: 0.22, y: 0.38, r: 110, phase: 0, speed: 0.003 },
  { x: 0.75, y: 0.6, r: 85, phase: 1.9, speed: 0.004 },
  { x: 0.52, y: 0.18, r: 65, phase: 3.1, speed: 0.006 },
];

/**
 * @param {object} props
 * @param {string} [props.colorRgb]      "r,g,b" tint for orbs, dots and links.
 * @param {number} [props.orbScale]      Multiplies every orb radius. 1 = panel-sized.
 * @param {number} [props.particleCount] How many floating dots to scatter.
 * @param {number} [props.linkDistance]  Below this gap (px) two dots get a hairline.
 * @param {typeof DEFAULT_ORBS} [props.orbs]
 * @param {React.CSSProperties} [props.style] Merged last — use it for radius/z-index.
 */
export default function AmbientOrbCanvas({
  colorRgb = AMBIENT_BRAND_RGB,
  orbScale = 1,
  particleCount = 18,
  linkDistance = 80,
  orbs = DEFAULT_ORBS,
  style,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.warn("⚠️ [ambient] 2D canvas context unavailable — skipping the backdrop");
      return;
    }

    const [r, g, b] = colorRgb.split(",").map(Number);
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    // Everything below is rebuilt from scratch whenever the box resizes, so a
    // sidebar toggle or window drag never leaves a stretched, blurry canvas.
    let width = 0;
    let height = 0;
    let particles = [];
    let frame = 0;
    let animId = null;

    const buildScene = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      if (!width || !height) return false;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // reset, then scale — never compounds

      particles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 1.5 + Math.random() * 2.5,
        dx: (Math.random() - 0.5) * 0.3,
        dy: (Math.random() - 0.5) * 0.3,
        op: 0.08 + Math.random() * 0.18,
        phase: Math.random() * Math.PI * 2,
        speed: 0.005 + Math.random() * 0.007,
      }));
      return true;
    };

    const paint = () => {
      ctx.clearRect(0, 0, width, height);

      // Orbs — big, very low-alpha radial washes.
      orbs.forEach((orb) => {
        const radius = orb.r * orbScale;
        const ox = orb.x * width + Math.sin(frame * orb.speed + orb.phase) * 20;
        const oy = orb.y * height + Math.cos(frame * orb.speed * 0.7 + orb.phase) * 14;
        const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius);
        grad.addColorStop(0, `rgba(${r},${g},${b},0.07)`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ox, oy, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Dots — drift, bounce off the edges, and breathe in opacity.
      particles.forEach((p) => {
        if (!reduceMotion) {
          p.x += p.dx;
          p.y += p.dy;
          if (p.x < 0 || p.x > width) p.dx *= -1;
          if (p.y < 0 || p.y > height) p.dy *= -1;
        }
        const pulse = p.op * (0.5 + 0.5 * Math.sin(frame * p.speed + p.phase));
        ctx.fillStyle = `rgba(${r},${g},${b},${pulse})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Links — a hairline between any two dots that drift close together.
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDistance) {
            ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - dist / linkDistance) * 0.05})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    const loop = () => {
      paint();
      frame++;
      animId = requestAnimationFrame(loop);
    };

    const start = () => {
      if (animId !== null) cancelAnimationFrame(animId);
      animId = null;
      if (!buildScene()) return;
      if (reduceMotion) paint(); // one still frame, then nothing moves
      else loop();
    };

    start();

    // The parent can change size without the window doing so (sidebar collapse,
    // the templates rail loading in), so observe the element itself.
    const observer = new ResizeObserver(start);
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      if (animId !== null) cancelAnimationFrame(animId);
    };
  }, [colorRgb, orbScale, particleCount, linkDistance, orbs]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        ...style,
      }}
    />
  );
}

/**
 * The scanline: a 1px brand-tinted gradient that drifts from the top of its
 * parent to the bottom every few seconds. Positioned absolutely, so give the
 * parent `position: relative`.
 *
 * @param {object} props
 * @param {string} [props.colorRgb]
 * @param {React.CSSProperties} [props.style] Merged last (z-index, radius, …).
 */
export function AmbientSweep({ colorRgb = AMBIENT_BRAND_RGB, style }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Travels on `top` rather than a fixed translateY so one rule works for
          a short panel and a tall page alike. */}
      <style>{`
        @keyframes ck-ambient-sweep {
          0%   { top: 0;    opacity: 0; }
          10%  {            opacity: 1; }
          90%  {            opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ck-ambient-sweep { animation: none; opacity: 0; }
        }
      `}</style>
      <div
        className="ck-ambient-sweep"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, rgba(${colorRgb},0.25), transparent)`,
          animation: "ck-ambient-sweep 5s ease-in-out infinite 1.5s",
        }}
      />
    </div>
  );
}
