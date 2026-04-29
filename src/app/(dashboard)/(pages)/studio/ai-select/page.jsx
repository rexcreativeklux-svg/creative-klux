"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tv2, Share2, Palette, Wand2, ArrowRight, Sparkles } from "lucide-react";

const PIPELINE_OPTIONS = [
  {
    type: "ads_creative",
    name: "Ads Creative",
    tagline: "Run Ads",
    description: "High-converting ads for Google, Meta, TikTok & more",
    Icon: Tv2,
    color: "#60a5fa",
    colorRgb: "96,165,250",
    cardBg: "rgba(15,40,100,0.7)",
    borderIdle: "rgba(96,165,250,0.22)",
    borderActive: "rgba(96,165,250,0.9)",
    tags: ["Image Ads", "Video Ads", "Interactive"],
  },
  {
    type: "social_creative",
    name: "Social Creative",
    tagline: "Create Content",
    description: "Posts, reels, and stories for every platform",
    Icon: Share2,
    color: "#34d399",
    colorRgb: "52,211,153",
    cardBg: "rgba(5,45,35,0.7)",
    borderIdle: "rgba(52,211,153,0.22)",
    borderActive: "rgba(52,211,153,0.9)",
    tags: ["Posts", "Reels", "Banners"],
  },
  {
    type: "designer_creative",
    name: "Designer",
    tagline: "Design Anything",
    description: "Logos, flyers, brand assets & more",
    Icon: Palette,
    color: "#c084fc",
    colorRgb: "192,132,252",
    cardBg: "rgba(50,15,90,0.7)",
    borderIdle: "rgba(192,132,252,0.22)",
    borderActive: "rgba(192,132,252,0.9)",
    tags: ["Logos", "Business Cards", "Banners"],
  },
  {
    type: "magic_studio",
    name: "Magic Studio",
    tagline: "AI Generation",
    description: "Text to image, video, audio & variations",
    Icon: Wand2,
    color: "#fb7185",
    colorRgb: "251,113,133",
    cardBg: "rgba(90,10,40,0.7)",
    borderIdle: "rgba(251,113,133,0.22)",
    borderActive: "rgba(251,113,133,0.9)",
    tags: ["Text to Image", "Text to Video", "Voiceover"],
  },
];

function SpaceCanvas() {
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

    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.6 + 0.2,
      base: Math.random() * 0.55 + 0.1,
      phase: Math.random() * Math.PI * 2,
      freq: Math.random() * 0.008 + 0.003,
    }));

    const orbs = [
      { x: 0.18, y: 0.28, r: 0.38, rgb: "96,165,250", spd: 0.00007, ang: 0.5 },
      { x: 0.78, y: 0.55, r: 0.32, rgb: "192,132,252", spd: 0.00005, ang: 2.2 },
      { x: 0.52, y: 0.08, r: 0.28, rgb: "251,113,133", spd: 0.00009, ang: 4.8 },
      { x: 0.08, y: 0.72, r: 0.22, rgb: "52,211,153", spd: 0.00006, ang: 1.2 },
      { x: 0.9, y: 0.15, r: 0.2, rgb: "192,132,252", spd: 0.00008, ang: 3.3 },
    ];

    const floaters = Array.from({ length: 50 }, () => ({
      x: Math.random() * 1200,
      y: Math.random() * 900,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -Math.random() * 0.2 - 0.05,
      r: Math.random() * 2.2 + 0.4,
      alpha: Math.random() * 0.35 + 0.08,
      rgb: ["96,165,250", "192,132,252", "251,113,133", "52,211,153"][Math.floor(Math.random() * 4)],
      phase: Math.random() * Math.PI * 2,
    }));

    const shoots = [];
    let lastShoot = 0;

    const spawnShoot = () => {
      const dir = Math.random() > 0.5 ? 1 : -1;
      shoots.push({
        x: dir > 0 ? -50 : W() + 50,
        y: Math.random() * H() * 0.6,
        vx: dir * (Math.random() * 5 + 4),
        vy: Math.random() * 2.5 + 0.5,
        len: Math.random() * 140 + 80,
        life: 1,
      });
    };

    const draw = (ts) => {
      const t = ts * 0.001;
      const w = W(), h = H();

      ctx.clearRect(0, 0, w, h);

      const bg = ctx.createLinearGradient(0, 0, w * 0.6, h);
      bg.addColorStop(0, "#010b1a");
      bg.addColorStop(0.45, "#020d20");
      bg.addColorStop(1, "#010810");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      orbs.forEach((orb) => {
        orb.ang += orb.spd;
        const ox = (orb.x + Math.cos(orb.ang) * 0.09) * w;
        const oy = (orb.y + Math.sin(orb.ang * 1.4) * 0.07) * h;
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, orb.r * w);
        g.addColorStop(0, `rgba(${orb.rgb},0.14)`);
        g.addColorStop(0.35, `rgba(${orb.rgb},0.06)`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });

      stars.forEach((s) => {
        const a = s.base + Math.sin(t * s.freq * 60 + s.phase) * 0.28;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, a)})`;
        ctx.fill();
      });

      if (ts - lastShoot > 1800 + Math.random() * 2500) {
        spawnShoot();
        lastShoot = ts;
      }
      for (let i = shoots.length - 1; i >= 0; i--) {
        const s = shoots[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.016;
        if (s.life <= 0 || s.x < -200 || s.x > w + 200) { shoots.splice(i, 1); continue; }
        const grad = ctx.createLinearGradient(s.x - s.vx * (s.len / 5), s.y - s.vy * (s.len / 5), s.x, s.y);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(0.7, `rgba(200,220,255,${s.life * 0.6})`);
        grad.addColorStop(1, `rgba(255,255,255,${s.life * 0.95})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(s.x - s.vx * (s.len / 5), s.y - s.vy * (s.len / 5));
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
      }

      floaters.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h + 10;
        if (p.y > h + 10) p.y = 0;
        const pulse = 0.65 + 0.35 * Math.sin(t * 1.2 + p.phase);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.rgb},${p.alpha * pulse})`;
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
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
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

  const navigateToChat = (type, message = "") => {
    const params = new URLSearchParams({ creative: type });
    if (message.trim()) params.set("initialMessage", message.trim());
    router.push(`/studio/ai-chat-page?${params.toString()}`);
  };

  const handleCardClick = (type) => {
    if (selectedType === type) {
      navigateToChat(type, inputValue);
    } else {
      setSelectedType(type);
      setInputValue("");
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && selectedType) { e.preventDefault(); navigateToChat(selectedType, inputValue); }
    if (e.key === "Escape") { setSelectedType(null); setInputValue(""); }
  };

  return (
    <div className="h-full" style={{  background: "#010b1a", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <SpaceCanvas />

      <div className="pt-[15%]" style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", alignItems: "center",}}>

        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(192,132,252,0.1)", border: "1px solid rgba(192,132,252,0.3)", color: "rgba(255,255,255,0.72)", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", padding: "6px 16px", borderRadius: 999, marginBottom: 24, textTransform: "uppercase" }}>
          <Sparkles style={{ width: 12, height: 12, color: "#c084fc" }} />
          Creative Klux AI Studio
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: "clamp(30px, 4.5vw, 52px)", fontWeight: 800, color: "#fff", textAlign: "center", lineHeight: 1.1, margin: "0 0 14px", letterSpacing: "-0.035em" }}>
          What will you{" "}
          <span style={{ background: "linear-gradient(95deg, #60a5fa 0%, #c084fc 48%, #fb7185 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            create
          </span>{" "}
          today?
        </h1>

        <p className="text-gray-400" style={{ fontSize: 14, textAlign: "center", margin: "0 0 52px", letterSpacing: "0.01em" }}>
          Pick a studio · describe your vision · let AI do the rest
        </p>

        {/* Cards */}
        <div className="pt-10" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, width: "100%", maxWidth: 940 }}>
          {PIPELINE_OPTIONS.map((opt) => {
            const { Icon } = opt;
            const isSel = selectedType === opt.type;
            const isHov = hovered === opt.type;
            const lit = isSel || isHov;

            return (
              <button
                key={opt.type}
                onClick={() => handleCardClick(opt.type)}
                onMouseEnter={() => setHovered(opt.type)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  textAlign: "left",
                  padding: "22px 20px 20px",
                  borderRadius: 20,
                  border: `1.5px solid ${isSel ? opt.borderActive : isHov ? `rgba(${opt.colorRgb},0.5)` : opt.borderIdle}`,
                  background: lit ? opt.cardBg : "rgba(255,255,255,0.045)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  cursor: "pointer",
                  transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
                  boxShadow: isSel
                    ? `0 0 48px rgba(${opt.colorRgb},0.28), 0 12px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)`
                    : isHov
                    ? `0 0 24px rgba(${opt.colorRgb},0.18), 0 8px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)`
                    : "0 2px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
                  transform: isSel ? "translateY(-5px) scale(1.015)" : isHov ? "translateY(-2px)" : "none",
                  outline: "none",
                  overflow: "hidden",
                }}
              >
                {/* Top shimmer line */}
                <div aria-hidden="true" style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 1, background: lit ? `linear-gradient(90deg, transparent, rgba(${opt.colorRgb},0.7), transparent)` : "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)", borderRadius: 1, transition: "all 0.3s" }} />

                {/* Glow corner */}
                {isSel && (
                  <div aria-hidden="true" style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: `radial-gradient(circle, rgba(${opt.colorRgb},0.3) 0%, transparent 70%)`, pointerEvents: "none" }} />
                )}

                {/* Pulse dot */}
                {isSel && (
                  <div style={{ position: "absolute", top: 16, right: 16, width: 8, height: 8, borderRadius: "50%", background: opt.color, boxShadow: `0 0 12px ${opt.color}, 0 0 24px rgba(${opt.colorRgb},0.5)` }} />
                )}

                {/* Icon */}
                <div style={{ width: 46, height: 46, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${opt.colorRgb},${lit ? 0.22 : 0.1})`, border: `1.5px solid rgba(${opt.colorRgb},${lit ? 0.5 : 0.18})`, marginBottom: 15, transition: "all 0.22s", flexShrink: 0 }}>
                  <Icon style={{ color: lit ? opt.color : `rgba(${opt.colorRgb},0.65)` }} strokeWidth={1.75} size={21} />
                </div>

                {/* Name */}
                <p style={{ fontSize: 14, fontWeight: 700, color: lit ? "#ffffff" : "rgba(255,255,255,0.82)", margin: "0 0 6px", letterSpacing: "-0.015em" }}>
                  {opt.name}
                </p>

                {/* Tagline */}
                <p style={{ fontSize: 11, fontWeight: 600, color: lit ? opt.color : `rgba(${opt.colorRgb},0.55)`, margin: "0 0 8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  {opt.tagline}
                </p>

                {/* Description */}
                <p className="text-gray-400" style={{ fontSize: 12, margin: "0 0 18px", lineHeight: 1.6 }}>
                  {opt.description}
                </p>

              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom input */}
      <div style={{ position: "sticky", bottom: 50, zIndex: 2, background: "linear-gradient(to top, #010b1a 60%, transparent)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>

          <div style={{ display: "flex", alignItems: "center", height: 20, marginBottom: 10 }}>
            {selectedConfig ? (
              <span style={{ fontSize: 11, fontWeight: 600, color: selectedConfig.color, display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: selectedConfig.color, boxShadow: `0 0 10px ${selectedConfig.color}`, display: "inline-block" }} />
                {selectedConfig.name} selected
                <span style={{ color: "rgba(255,255,255,0.28)", fontWeight: 400 }}>· Esc to clear</span>
              </span>
            ) : (
              <span className="text-gray-300" style={{ fontSize: 13, }}>Select a studio above to get started</span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, borderRadius: 16, border: `1.5px solid ${inputFocused && selectedConfig ? `rgba(${selectedConfig.colorRgb},0.75)` : inputFocused ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.1)"}`, padding: "12px 14px", background: "rgba(255,255,255,0.055)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", transition: "all 0.2s", boxShadow: inputFocused && selectedConfig ? `0 0 0 3px rgba(${selectedConfig.colorRgb},0.15), 0 8px 32px rgba(0,0,0,0.45)` : "0 4px 24px rgba(0,0,0,0.35)" }}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              disabled={!selectedType}
              placeholder={selectedConfig ? `Describe what you want to make with ${selectedConfig.name}… (optional)` : "Select a studio above to get started…"}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "rgba(255,255,255)", cursor: !selectedType ? "not-allowed" : "text", opacity: !selectedType ? 0.32 : 0 }}
            />
            <button
              onClick={() => selectedType && navigateToChat(selectedType, inputValue)}
              disabled={!selectedType}
              style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "none", background: selectedConfig ? `linear-gradient(135deg, ${selectedConfig.color} 0%, rgba(${selectedConfig.colorRgb},0.65) 100%)` : "rgba(255,255,255,0.07)", color: "#fff", cursor: !selectedType ? "not-allowed" : "pointer", opacity: !selectedType ? 0.22 : 1, transition: "all 0.15s", boxShadow: selectedConfig ? `0 4px 18px rgba(${selectedConfig.colorRgb},0.45)` : "none" }}>
              <ArrowRight className="text-white" style={{ width: 17, height: 17 }} />
            </button>
          </div>

          <p style={{ fontSize: 11, color: "rgba(255,255,255)", textAlign: "center", marginTop: 10 }}>
            {selectedType ? "Enter to launch · description is optional" : "Choose a studio, describe your vision or jump straight in"}
          </p>
        </div>
      </div>
    </div>
  );
}