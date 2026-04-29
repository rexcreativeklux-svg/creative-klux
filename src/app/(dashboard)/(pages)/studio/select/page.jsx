"use client";

import React from "react";
import { Tv2, Share2, Palette, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

const pipelineOptions = [
  {
    type: "ads_creative",
    name: "Ads Creative",
    desc: "Run Ads",
    inner: "Create high-converting ads for Google, Meta, TikTok & more",
    color: "#2563eb",
    Icon: Tv2,
    tags: ["Image Ads", "Video Ads", "Interactive Ads"],
    decorative: (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-4 right-4 w-16 h-10 border-2 border-blue-300/40 rounded-lg" />
        <div className="absolute top-7 right-7 w-10 h-6 border border-blue-300/30 rounded" />
        <div className="absolute bottom-6 left-5 w-12 h-1.5 bg-blue-300/30 rounded-full" />
        <div className="absolute bottom-9 left-5 w-8 h-1.5 bg-blue-200/30 rounded-full" />
        <svg className="absolute inset-0 w-full h-full">
          <circle cx="18%" cy="70%" r="5" fill="#2563eb" opacity="0.12" />
          <circle cx="75%" cy="75%" r="3" fill="#2563eb" opacity="0.15" />
        </svg>
      </div>
    ),
  },
  {
    type: "social_creative",
    name: "Social Creative",
    desc: "Create Content",
    inner: "Posts, reels, and stories for Instagram, TikTok, LinkedIn & more",
    color: "#059669",
    Icon: Share2,
    tags: ["Posts", "Reels / Stories", "Banners / Covers"],
    decorative: (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-5 left-5 w-9 h-9 border-2 border-emerald-300/40 rounded-xl" />
        <div className="absolute top-5 left-16 w-9 h-9 border-2 border-emerald-300/30 rounded-xl" />
        <div className="absolute bottom-5 left-5 right-5 h-1.5 bg-emerald-200/30 rounded-full" />
        <svg className="absolute inset-0 w-full h-full">
          <circle cx="80%" cy="30%" r="6" fill="#059669" opacity="0.1" />
          <circle cx="70%" cy="65%" r="3" fill="#059669" opacity="0.15" />
        </svg>
      </div>
    ),
  },
  {
    type: "designer_creative",
    name: "Designer Creative",
    desc: "Design Anything",
    inner: "Logos, flyers, banners, brand assets & more",
    color: "#7c3aed",
    Icon: Palette,
    tags: ["Logos", "Business Cards", "Banners"],
    decorative: (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-4 right-6 w-10 h-10 border-2 border-violet-300/40 rounded-full" />
        <div className="absolute top-8 right-10 w-4 h-4 bg-violet-300/20 rounded-full" />
        <div className="absolute bottom-5 left-5 w-14 h-1.5 bg-violet-200/30 rounded-full" />
        <div className="absolute bottom-8 left-5 w-9 h-1.5 bg-violet-300/20 rounded-full" />
        <svg className="absolute inset-0 w-full h-full">
          <circle cx="20%" cy="35%" r="4" fill="#7c3aed" opacity="0.12" />
          <circle cx="65%" cy="70%" r="5" fill="#7c3aed" opacity="0.1" />
        </svg>
      </div>
    ),
  },
  {
    type: "magic_studio",
    name: "Magic Studio",
    desc: "AI Generation",
    inner: "Generate images, videos, variations, voiceovers & more",
    color: "#db2777",
    Icon: Sparkles,
    tags: ["Text to Image", "Text to Video", "Image Variations"],
    decorative: (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 border-2 border-pink-300/20 rounded-full" />
          <div className="absolute w-14 h-14 border border-pink-300/20 rounded-full" />
        </div>
        <svg className="absolute inset-0 w-full h-full">
          <circle cx="20%" cy="25%" r="3" fill="#db2777" opacity="0.2" />
          <circle cx="78%" cy="70%" r="4" fill="#db2777" opacity="0.15" />
          <circle cx="75%" cy="25%" r="2.5" fill="#db2777" opacity="0.18" />
        </svg>
      </div>
    ),
  },
];

export default function StudioSelectPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center pt-20 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          What would you like to create?
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Choose a creative type to get started.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {pipelineOptions.map((opt) => {
          const { Icon } = opt;
          return (
            <div
              key={opt.type}
              onClick={() => router.push(`/studio?creative=${opt.type}`)}
              className="bg-white rounded-xl border border-gray-200 py-5 px-5 flex flex-col relative group overflow-hidden cursor-pointer select-none"
              style={{ transition: "box-shadow 0.2s, border-color 0.2s, transform 0.15s" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = opt.color + "55";
                e.currentTarget.style.boxShadow = `0 4px 20px ${opt.color}18`;
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E5E7EB";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "none";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "translateY(0px) scale(0.99)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
            >
              {/* Subtle bg glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at top right, ${opt.color}0d, transparent 65%)`,
                }}
              />

              {/* Icon area */}
              <div
                className="w-full h-28 rounded-xl flex items-center justify-center mb-4 relative overflow-hidden"
                style={{
                  background: `${opt.color}0f`,
                  border: `1px solid ${opt.color}20`,
                }}
              >
                {opt.decorative}

                <div
                  className="relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${opt.color}18` }}
                >
                  <Icon
                    className="w-7 h-7"
                    style={{ color: opt.color }}
                    strokeWidth={1.5}
                  />
                </div>
              </div>

              {/* Text */}
              <div className="relative z-10 flex-1">
                <h3 className="text-sm font-semibold mb-0.5 text-gray-900">
                  {opt.name}
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                  {opt.inner}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {opt.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: `${opt.color}10`,
                        color: opt.color,
                        border: `1px solid ${opt.color}20`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}