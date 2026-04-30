"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tv2, Share2, Palette, Sparkles, ArrowRight } from "lucide-react";

const PIPELINE_OPTIONS = [
    {
        type: "ads_creative",
        name: "Ads Creative",
        tagline: "Run Ads",
        description: "Create high-converting ads for Google, Meta, TikTok & more",
        Icon: Tv2,
        color: "#2563eb",
        colorRgb: "37,99,235",
        tags: ["Image Ads", "Video Ads", "Interactive Ads"],
    },
    {
        type: "social_creative",
        name: "Social Creative",
        tagline: "Create Content",
        description: "Posts, reels, and stories for Instagram, TikTok, LinkedIn & more",
        Icon: Share2,
        color: "#059669",
        colorRgb: "5,150,105",
        tags: ["Posts", "Reels / Stories", "Banners / Covers"],
    },
    {
        type: "designer_creative",
        name: "Designer Creative",
        tagline: "Design Anything",
        description: "Logos, flyers, banners, brand assets & more",
        Icon: Palette,
        color: "#7c3aed",
        colorRgb: "124,58,237",
        tags: ["Logos", "Business Cards", "Banners"],
    },
    {
        type: "magic_studio",
        name: "Magic Studio",
        tagline: "AI Generation",
        description: "Generate images, videos, variations, voiceovers & more",
        Icon: Sparkles,
        color: "#db2777",
        colorRgb: "219,39,119",
        tags: ["Text to Image", "Text to Video", "Image Variations"],
    },
];

/* ── Soft light canvas background ── */
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
            { x: 0.12, y: 0.2, r: 0.42, rgb: "37,99,235", spd: 0.00006, ang: 0.5 },
            { x: 0.82, y: 0.5, r: 0.36, rgb: "124,58,237", spd: 0.00004, ang: 2.2 },
            { x: 0.5, y: 0.85, r: 0.3, rgb: "219,39,119", spd: 0.00008, ang: 4.8 },
            { x: 0.05, y: 0.75, r: 0.24, rgb: "5,150,105", spd: 0.00005, ang: 1.2 },
            { x: 0.9, y: 0.1, r: 0.22, rgb: "124,58,237", spd: 0.00007, ang: 3.3 },
        ];

        const dots = Array.from({ length: 40 }, () => ({
            x: Math.random(),
            y: Math.random(),
            r: Math.random() * 1.8 + 0.5,
            base: Math.random() * 0.18 + 0.06,
            phase: Math.random() * Math.PI * 2,
            freq: Math.random() * 0.006 + 0.002,
            rgb: ["37,99,235", "124,58,237", "219,39,119", "5,150,105"][
                Math.floor(Math.random() * 4)
            ],
        }));

        const draw = (ts) => {
            const t = ts * 0.001;
            const w = W(), h = H();
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, w, h);

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
    const [hovered, setHovered] = useState(null);

    return (
        <div
            className="h-full"
            style={{
                background: "#ffffff",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <LightCanvas />

            <div className="pt-40"
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


                {/* Headline */}
                <h1
                    style={{
                        fontSize: "clamp(26px, 4vw, 46px)",
                        fontWeight: 800,
                        color: "#0f172a",
                        textAlign: "center",
                        lineHeight: 1.1,
                        margin: "0 0 12px",
                        letterSpacing: "-0.035em",
                    }}
                >
                    What would you like to{" "}
                    <span className="bg-gradient-to-r from-[#003dda] via-blue-300 to-blue-600 bg-clip-text text-transparent">
                        Create
                    </span>
                    {" "}
                    today?
                </h1>

                <p className="pb-20"
                    style={{
                        fontSize: 14,
                        color: "#64748b",
                        textAlign: "center",
                        margin: "0 0 44px",
                        letterSpacing: "0.01em",
                    }}
                >
                    Choose a creative type to get started
                </p>

                {/* Cards */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 12,
                        width: "100%",
                        maxWidth: 860,
                        padding: "0 16px",
                    }}
                >
                    {PIPELINE_OPTIONS.map((opt) => {
                        const { Icon } = opt;
                        const isHov = hovered === opt.type;

                        return (
                            <button
                                key={opt.type}
                                onClick={() => router.push(`/studio?creative=${opt.type}`)}
                                onMouseEnter={() => setHovered(opt.type)}
                                onMouseLeave={() => setHovered(null)}
                                style={{
                                    position: "relative",
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "flex-start",
                                    textAlign: "left",
                                    padding: "18px",
                                    borderRadius: 16,
                                    border: `1.5px solid ${isHov
                                        ? `rgba(${opt.colorRgb}, 0.7)`
                                        : `rgba(${opt.colorRgb}, 0.18)`
                                        }`,
                                    background: isHov
                                        ? `rgba(${opt.colorRgb}, 0.03)`
                                        : "#ffffff",
                                    cursor: "pointer",
                                    transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                                    boxShadow: isHov
                                        ? `0 8px 32px rgba(${opt.colorRgb},0.13), 0 2px 8px rgba(0,0,0,0.05)`
                                        : "0 1px 4px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.03)",
                                    transform: isHov ? "translateY(-3px)" : "none",
                                    outline: "none",
                                    overflow: "hidden",
                                }}
                            >
                                {/* top shimmer on hover */}
                                <div
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: "10%",
                                        right: "10%",
                                        height: 1,
                                        background: isHov
                                            ? `linear-gradient(90deg, transparent, rgba(${opt.colorRgb},0.45), transparent)`
                                            : "transparent",
                                        transition: "all 0.3s",
                                    }}
                                />

                                {/* icon */}
                                <div
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 12,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background: `rgba(${opt.colorRgb}, ${isHov ? 0.13 : 0.08})`,
                                        border: `1px solid rgba(${opt.colorRgb}, ${isHov ? 0.3 : 0.15})`,
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
                                    {/* name */}
                                    <p
                                        style={{
                                            fontSize: 13.5,
                                            fontWeight: 700,
                                            color: "#0f172a",
                                            margin: "0 0 3px",
                                            letterSpacing: "-0.01em",
                                        }}
                                    >
                                        {opt.name}
                                    </p>

                                    {/* tagline */}
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

                                    {/* description */}
                                    <p
                                        style={{
                                            fontSize: 12,
                                            color: "#64748b",
                                            margin: "0 0 10px",
                                            lineHeight: 1.55,
                                        }}
                                    >
                                        {opt.description}
                                    </p>

                                    {/* tags */}
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

                                {/* arrow indicator — smooth fade/scale in on hover */}
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
                                        transition: "opacity 0.2s, transform 0.2s",
                                        opacity: isHov ? 1 : 0,
                                        transform: isHov ? "scale(1)" : "scale(0.6)",
                                    }}
                                >
                                    <ArrowRight
                                        style={{ width: 11, height: 11, color: opt.color }}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}