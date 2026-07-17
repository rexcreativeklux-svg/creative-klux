"use client";

/**
 * AuthShowcasePanel
 * ---------------------------------------------------------------------------
 * The animated product showcase shown beside the auth screens (login /
 * register). Desktop-only (hidden below `lg`). Auto-advancing cross-fading
 * slides with manual prev/next + dot navigation and a progress bar.
 *
 * Rendered from a single source of truth so every auth screen shows an
 * identical panel. Purely presentational — no props, no side effects beyond
 * its own slide timer.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Slides ───────────────────────────────────────────────────────────────────

const SLIDES = [
  {
    image: "/ads-creative-image.png",
    tag: "Ads Creatives",
    tagColor: "#1447e6",
    headline: "Launch ads that\nstop the scroll.",
    sub: "Generate high-converting creatives for every platform in minutes.",
  },
  {
    image: "/designer-image.png",
    tag: "Designer Creatives",
    tagColor: "#0ea5e9",
    headline: "Brand assets that\nlook agency-made.",
    sub: "Logos, banners, infographics — professional design without the price tag.",
  },
  {
    image: "/social-creatives-image.webp",
    tag: "Social Creatives",
    tagColor: "#6366f1",
    headline: "Dominate\nevery feed.",
    sub: "Posts, reels, stories — content your audience can't ignore.",
  },
  {
    image: "/magic-studio-image.webp",
    tag: "Magic Studio",
    tagColor: "#8b5cf6",
    headline: "AI that creates\nthe impossible.",
    sub: "Text to image, text to video, script to voiceover — all in one place.",
  },
];

export default function AuthShowcasePanel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setCurrent((c) => (c + 1) % SLIDES.length),
      4500,
    );
    return () => clearInterval(t);
  }, []);

  const prev = () => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setCurrent((c) => (c + 1) % SLIDES.length);

  const slide = SLIDES[current];

  return (
    <div className="relative hidden lg:block w-1/2 h-full overflow-hidden bg-[#080810]">
      {/* BG image crossfade */}
      <AnimatePresence initial={false}>
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        >
          <Image
            src={slide.image}
            alt={slide.tag}
            fill
            className="object-contain"
            sizes="50vw"
            priority
          />
          {/* layered overlays for readability */}
          <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/50 to-black/10" />
          <div className="absolute inset-0 bg-linear-to-r from-black/20 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 pt-7 z-20">
        <div className="flex items-center gap-2.5">
          <img
            src="/logoblue.svg"
            alt="Logo"
            className="w-7 h-7 shrink-0"
            loading="lazy"
          />
          <span
            className="text-white font-semibold text-[15px]"
            style={{ fontFamily: "Geist, sans-serif" }}
          >
            Creative Klux
          </span>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1 text-white/50 hover:text-white/90 text-[12.5px] transition-colors no-underline"
        >
          <ChevronLeft size={13} />
          Back to site
        </Link>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 px-8 pb-8 z-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45 }}
          >
            {/* Tag */}
            <span
              className="inline-block px-3 py-1 rounded-full text-[10.5px] font-bold tracking-widest uppercase text-white mb-4"
              style={{ background: slide.tagColor }}
            >
              {slide.tag}
            </span>

            {/* Headline */}
            <h2
              className="text-white font-bold leading-[1.1] whitespace-pre-line mb-3"
              style={{
                fontSize: "clamp(30px, 3.2vw, 44px)",
                fontFamily: "Geist, sans-serif",
              }}
            >
              {slide.headline}
            </h2>

            {/* Sub */}
            <p className="text-white/55 text-[13.5px] leading-relaxed max-w-90 mb-7">
              {slide.sub}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.75">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="rounded-full border-none cursor-pointer p-0 transition-all duration-300"
                style={{
                  width: i === current ? 22 : 6,
                  height: 6,
                  background:
                    i === current ? "white" : "rgba(255,255,255,0.25)",
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={prev}
              className="w-9 h-9 rounded-full border border-white/15 bg-surface/8 hover:bg-surface/18 backdrop-blur-md grid place-items-center text-white cursor-pointer transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={next}
              className="w-9 h-9 rounded-full border border-white/15 bg-surface/8 hover:bg-surface/18 backdrop-blur-md grid place-items-center text-white cursor-pointer transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-surface/8 z-30">
        <motion.div
          key={current}
          className="h-full bg-surface/50"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 4.5, ease: "linear" }}
        />
      </div>
    </div>
  );
}
