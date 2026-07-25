"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Tv2,
  Share2,
  Palette,
  Wand2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const PIPELINE_OPTIONS = [
  {
    type: "ads_creative",
    name: "Ads Creative",
    tagline: "Run Ads",
    description: "High-converting ads for Google, Meta, TikTok & more",
    Icon: Tv2,
    color: "#3b82f6",
    colorRgb: "59,130,246",
    cardBg: "#fff",
    borderIdle: "rgba(59,130,246,0.18)",
    borderActive: "rgba(59,130,246,0.8)",
    tags: ["Image Ads", "Video Ads", "Interactive"],
  },
  {
    type: "social_creative",
    name: "Social Creative",
    tagline: "Create Content",
    description: "Posts, reels, and stories for every platform",
    Icon: Share2,
    color: "#10b981",
    colorRgb: "16,185,129",
    cardBg: "#fff",
    borderIdle: "rgba(16,185,129,0.18)",
    borderActive: "rgba(16,185,129,0.8)",
    tags: ["Posts", "Reels", "Banners"],
  },
  {
    type: "designer_creative",
    name: "Designer",
    tagline: "Design Anything",
    description: "Logos, flyers, brand assets & more",
    Icon: Palette,
    color: "#8b5cf6",
    colorRgb: "139,92,246",
    cardBg: "#fff",
    borderIdle: "rgba(139,92,246,0.18)",
    borderActive: "rgba(139,92,246,0.8)",
    tags: ["Logos", "Business Cards", "Banners"],
  },
  // {
  //   type: "magic_studio",
  //   name: "Magic Studio",
  //   tagline: "AI Generation",
  //   description: "Text to image, video, audio & variations",
  //   Icon: Wand2,
  //   color: "#f43f5e",
  //   colorRgb: "244,63,94",
  //   cardBg: "#fff",
  //   borderIdle: "rgba(244,63,94,0.18)",
  //   borderActive: "rgba(244,63,94,0.8)",
  //   tags: ["Text to Image", "Text to Video", "Voiceover"],
  // },
];

/* ── Soft ambient canvas background — transparent, the themed page
   background (light or dark) shows through behind the orbs/dots ── */
function LightCanvas() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    const orbs = [
      { x: 0.12, y: 0.2, r: 0.42, rgb: "59,130,246", spd: 0.00006, ang: 0.5 },
      { x: 0.82, y: 0.5, r: 0.36, rgb: "139,92,246", spd: 0.00004, ang: 2.2 },
      { x: 0.5, y: 0.85, r: 0.3, rgb: "244,63,94", spd: 0.00008, ang: 4.8 },
      { x: 0.05, y: 0.75, r: 0.24, rgb: "16,185,129", spd: 0.00005, ang: 1.2 },
      { x: 0.9, y: 0.1, r: 0.22, rgb: "139,92,246", spd: 0.00007, ang: 3.3 },
    ];

    const dots = Array.from({ length: 40 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.8 + 0.5,
      base: Math.random() * 0.18 + 0.06,
      phase: Math.random() * Math.PI * 2,
      freq: Math.random() * 0.006 + 0.002,
      rgb: ["59,130,246", "139,92,246", "244,63,94", "16,185,129"][
        Math.floor(Math.random() * 4)
      ],
    }));

    const draw = (ts) => {
      const t = ts * 0.001;
      const w = W(),
        h = H();
      ctx.clearRect(0, 0, w, h);

      // soft coloured orbs
      orbs.forEach((orb) => {
        orb.ang += orb.spd;
        const ox = (orb.x + Math.cos(orb.ang) * 0.08) * w;
        const oy = (orb.y + Math.sin(orb.ang * 1.3) * 0.06) * h;
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, orb.r * w);
        g.addColorStop(0, `rgba(${orb.rgb},0.07)`);
        g.addColorStop(0.5, `rgba(${orb.rgb},0.03)`);
        g.addColorStop(1, `rgba(${orb.rgb},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });

      // floating dots
      dots.forEach((d) => {
        const a = d.base + Math.sin(t * d.freq * 60 + d.phase) * 0.08;
        ctx.beginPath();
        ctx.arc(d.x * w, d.y * h, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${d.rgb},${a})`;
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}

export default function StudioSelectPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [hovered, setHovered] = useState(null);
  const inputRef = useRef(null);

  const selectedConfig = PIPELINE_OPTIONS.find((p) => p.type === selectedType);

  useEffect(() => {
    if (selectedType) setTimeout(() => inputRef.current?.focus(), 50);
  }, [selectedType]);

  const navigateToChat = (type = "general", message = "") => {
    const params = new URLSearchParams({ creative: type });
    if (message.trim()) params.set("initialMessage", message.trim());
    router.push(`/studio/ai-chat-page?${params.toString()}`);
  };

  const handleCardClick = (type) => {
    navigateToChat(type, inputValue);
  };

  return (
    <div
      className="h-full bg-white dark:bg-page"
      style={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <LightCanvas />

      <div
        className="pt-[8%]"
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          isolation: "isolate",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: "rgba(139,92,246,0.08)",
            border: "1px solid rgba(139,92,246,0.22)",
            color: "#8b5cf6",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            padding: "6px 16px",
            borderRadius: 999,
            marginBottom: 22,
            textTransform: "uppercase",
          }}
        >
          <Sparkles style={{ width: 12, height: 12 }} />
          Creative Klux AI
        </div>

        {/* Headline */}
        <h1
          className="text-[#0f172a] dark:text-gray-900"
          style={{
            fontSize: "clamp(28px, 4.5vw, 50px)",
            fontWeight: 800,
            textAlign: "center",
            lineHeight: 1.1,
            margin: "0 0 12px",
            letterSpacing: "-0.035em",
          }}
        >
          What will you{" "}
          <span className="bg-linear-to-r from-[#003dda] via-blue-300 to-blue-600 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
            create
          </span>{" "}
          today?
        </h1>

        <p
          className="text-[#64748b] dark:text-gray-500"
          style={{
            fontSize: 14,
            textAlign: "center",
            margin: "0 0 48px",
            letterSpacing: "0.01em",
          }}
        >
          Select a creative or describe your vision · let AI do the rest
        </p>

        {/* Cards */}
        <div
          className="py-5 pt-10"
          style={{
            display: "flex",
            gap: 12,
            width: "100%",
            maxWidth: 1400,
            justifyContent: "center",
            flexWrap: "nowrap",
            overflowX: "auto",
          }}
        >
          {PIPELINE_OPTIONS.map((opt) => {
            const { Icon } = opt;
            const isHov = hovered === opt.type;

            return (
              <button
                key={opt.type}
                onClick={() => handleCardClick(opt.type)}
                onMouseEnter={() => setHovered(opt.type)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "flex-start",
                  textAlign: "left",
                  padding: "18px 18px",
                  borderRadius: 16,
                  border: `1.5px solid ${
                    isHov ? opt.borderActive : opt.borderIdle
                  }`,
                  // Mix the accent into the themed surface so the hover tint
                  // works on both the light (white) and dark (#1c1c20) card.
                  background: isHov
                    ? `color-mix(in srgb, rgb(${opt.colorRgb}) 4%, var(--color-surface))`
                    : "var(--color-surface)",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                  boxShadow: isHov
                    ? `0 8px 32px rgba(${opt.colorRgb},0.14), 0 2px 8px rgba(0,0,0,0.06)`
                    : "0 1px 4px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.04)",
                  transform: isHov ? "translateY(-3px)" : "none",
                  outline: "none",
                  overflow: "hidden",
                }}
              >
                {/* Top shimmer line on hover */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "10%",
                    right: "10%",
                    height: 1,
                    background: isHov
                      ? `linear-gradient(90deg, transparent, rgba(${opt.colorRgb},0.5), transparent)`
                      : "transparent",
                    borderRadius: 1,
                    transition: "all 0.3s",
                  }}
                />

                {/* Icon */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `rgba(${opt.colorRgb}, ${isHov ? 0.14 : 0.08})`,
                    border: `1px solid rgba(${opt.colorRgb}, ${isHov ? 0.35 : 0.16})`,
                    flexShrink: 0,
                    transition: "all 0.2s",
                  }}
                >
                  <Icon
                    style={{ color: opt.color }}
                    strokeWidth={1.75}
                    size={20}
                  />
                </div>

                <div style={{ paddingLeft: 14, flex: 1 }}>
                  {/* Name */}
                  <p
                    className="text-[#0f172a] dark:text-gray-900"
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      margin: "0 0 3px",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {opt.name}
                  </p>

                  {/* Tagline */}
                  <p
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: opt.color,
                      margin: "0 0 6px",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {opt.tagline}
                  </p>

                  {/* Description */}
                  <p
                    className="text-[#64748b] dark:text-gray-500"
                    style={{
                      fontSize: 12,
                      margin: "0 0 10px",
                      lineHeight: 1.55,
                    }}
                  >
                    {opt.description}
                  </p>

                  {/* Tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {opt.tags.map((tag, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 10,
                          padding: "3px 8px",
                          borderRadius: 999,
                          background: `rgba(${opt.colorRgb}, 0.08)`,
                          color: opt.color,
                          border: `1px solid rgba(${opt.colorRgb}, 0.18)`,
                          fontWeight: 500,
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Arrow on hover */}
                {isHov && (
                  <div
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 14,
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: `rgba(${opt.colorRgb}, 0.1)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ArrowRight
                      style={{ width: 11, height: 11, color: opt.color }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom input bar — fades up from the themed page background */}
      <div
        className="bg-linear-to-t from-white from-65% to-transparent dark:from-page"
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 2,
          paddingBottom: 28,
          paddingTop: 24,
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px" }}>
          {/* status line */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: 20,
              marginBottom: 10,
            }}
          >
            {selectedConfig ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: selectedConfig.color,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: selectedConfig.color,
                    display: "inline-block",
                  }}
                />
                {selectedConfig.name} selected
                <span
                  className="text-[#94a3b8] dark:text-gray-400"
                  style={{ fontWeight: 400 }}
                >
                  · Esc to clear
                </span>
              </span>
            ) : (
              <span
                className="text-[#64748b] dark:text-gray-500"
                style={{ fontSize: 12 }}
              >
                Select a studio above or describe your vision below
              </span>
            )}
          </div>

          {/* input row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderRadius: 14,
              border: `1.5px solid ${
                inputFocused && selectedConfig
                  ? `rgba(${selectedConfig.colorRgb}, 0.65)`
                  : inputFocused
                    ? "rgba(99,102,241,0.45)"
                    : "var(--color-gray-200)"
              }`,
              padding: "11px 12px",
              background: "var(--color-surface)",
              boxShadow: inputFocused
                ? `0 0 0 3px ${
                    selectedConfig
                      ? `rgba(${selectedConfig.colorRgb},0.1)`
                      : "rgba(99,102,241,0.08)"
                  }, 0 4px 16px rgba(0,0,0,0.06)`
                : "0 2px 8px rgba(0,0,0,0.05)",
              transition: "all 0.2s",
            }}
          >
            <input
              className="text-[#0f172a] dark:text-gray-900"
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  navigateToChat("general", inputValue);
                }
                if (e.key === "Escape") {
                  setSelectedType(null);
                  setInputValue("");
                }
              }}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Describe what you want to create… (or pick a studio above)"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 13.5,
                fontFamily: "inherit",
              }}
            />

            <button
              onClick={() => navigateToChat("general", inputValue)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                background: selectedConfig
                  ? `linear-gradient(135deg, ${selectedConfig.color}, rgba(${selectedConfig.colorRgb},0.7))`
                  : "#003dda",
                color: "#fff",
                cursor: "pointer",
                boxShadow: selectedConfig
                  ? `0 3px 12px rgba(${selectedConfig.colorRgb},0.35)`
                  : "0 3px 12px rgba(139,92,246,0.3)",
                transition: "all 0.15s",
                flexShrink: 0,
              }}
            >
              <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          </div>

          <p
            className="text-[#94a3b8] dark:text-gray-400"
            style={{
              fontSize: 11,
              textAlign: "center",
              marginTop: 9,
            }}
          >
            {selectedType
              ? "Enter to launch · description is optional"
              : "Choose a studio above, or describe your vision and jump straight in"}
          </p>
        </div>
      </div>
    </div>
  );
}
