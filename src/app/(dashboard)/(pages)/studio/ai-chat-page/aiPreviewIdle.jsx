"use client";

import React, { useEffect, useRef } from "react";

/* ─── Floating orb canvas animation ─────────────────────────── */
function OrbCanvas({ colorRgb }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const dpr = window.devicePixelRatio || 1;
    const CW = canvas.offsetWidth;
    const CH = canvas.offsetHeight;
    canvas.width = CW * dpr;
    canvas.height = CH * dpr;
    ctx.scale(dpr, dpr);

    const [r, g, b] = colorRgb.split(",").map(Number);

    const particles = Array.from({ length: 18 }, () => ({
      x: Math.random() * CW,
      y: Math.random() * CH,
      r: 1.5 + Math.random() * 2.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      op: 0.08 + Math.random() * 0.18,
      phase: Math.random() * Math.PI * 2,
      speed: 0.005 + Math.random() * 0.007,
    }));

    const orbs = [
      { x: CW * 0.22, y: CH * 0.38, r: 110, phase: 0, speed: 0.003 },
      { x: CW * 0.75, y: CH * 0.60, r: 85, phase: 1.9, speed: 0.004 },
      { x: CW * 0.52, y: CH * 0.18, r: 65, phase: 3.1, speed: 0.006 },
    ];

    let t = 0;

    function draw() {
      ctx.clearRect(0, 0, CW, CH);

      orbs.forEach((orb) => {
        const ox = orb.x + Math.sin(t * orb.speed + orb.phase) * 20;
        const oy = orb.y + Math.cos(t * orb.speed * 0.7 + orb.phase) * 14;
        const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, orb.r);
        grad.addColorStop(0, `rgba(${r},${g},${b},0.07)`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ox, oy, orb.r, 0, Math.PI * 2);
        ctx.fill();
      });

      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > CW) p.dx *= -1;
        if (p.y < 0 || p.y > CH) p.dy *= -1;
        const pulse = p.op * (0.5 + 0.5 * Math.sin(t * p.speed + p.phase));
        ctx.fillStyle = `rgba(${r},${g},${b},${pulse})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            const alpha = (1 - dist / 80) * 0.05;
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      t++;
      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [colorRgb]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        borderRadius: 14,
      }}
    />
  );
}

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
          background: "rgba(255,255,255,0.88)",
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
            background: "rgba(255,255,255,0.9)",
            border: `0.5px solid rgba(${colorRgb},0.2)`,
            color,
            fontWeight: 600,
            whiteSpace: "nowrap",
            cursor: "default",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = config.colorLight;
            e.currentTarget.style.borderColor = `rgba(${colorRgb},0.4)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.9)";
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
            background: "rgba(255,255,255,0.85)",
            border: "0.5px solid rgba(0,0,0,0.07)",
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
                  background: "rgba(0,0,0,0.08)",
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
        @keyframes ck-scanline {
          0%   { transform: translateY(-6px); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(600px); opacity: 0; }
        }
      `}</style>

      {/* particle bg */}
      <OrbCanvas colorRgb={colorRgb} />

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
              color: "#111",
              letterSpacing: "-0.02em",
              margin: "0 0 5px",
            }}
          >
            Ready to generate
          </p>
          <p
            style={{
              fontSize: 11,
              color: "#aaa",
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
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 5,
          borderRadius: 14,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 1,
            background: `linear-gradient(90deg, transparent, rgba(${colorRgb},0.25), transparent)`,
            animation: "ck-scanline 5s ease-in-out infinite 1.5s",
          }}
        />
      </div>
    </div>
  );
}