"use client";

import React from "react";
import { Zap, Settings, Tv2, Share2, Palette, Sparkles } from "lucide-react";
import Link from "next/link";

const pipelineOptions = [
  {
    type: "ads_creative",
    name: "Ads Creative",
    desc: "Run Ads",
    inner: "Create high-converting ads for Google, Meta, TikTok & more",
    studioPath: "/studio?creative=ads_creative",
    color: "#2563eb",
    Icon: Tv2,
    decorative: (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-4 right-4 w-16 h-10 border-2 border-violet-300/40 rounded-lg" />
        <div className="absolute top-7 right-7 w-10 h-6 border border-violet-300/30 rounded" />
        <div className="absolute bottom-6 left-5 w-12 h-1.5 bg-violet-300/30 rounded-full" />
        <div className="absolute bottom-9 left-5 w-8 h-1.5 bg-violet-200/30 rounded-full" />
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
    studioPath: "/studio?creative=social_creative",
    color: "#059669",
    Icon: Share2,
    decorative: (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-5 left-5 w-9 h-9 border-2 border-sky-300/40 rounded-xl" />
        <div className="absolute top-5 left-16 w-9 h-9 border-2 border-sky-300/30 rounded-xl" />
        <div className="absolute bottom-5 left-5 right-5 h-1.5 bg-sky-200/30 rounded-full" />
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
    studioPath: "/studio?creative=designer_creative",
    color: "#7c3aed",
    Icon: Palette,
    decorative: (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-4 right-6 w-10 h-10 border-2 border-amber-300/40 rounded-full" />
        <div className="absolute top-8 right-10 w-4 h-4 bg-amber-300/20 rounded-full" />
        <div className="absolute bottom-5 left-5 w-14 h-1.5 bg-amber-200/30 rounded-full" />
        <div className="absolute bottom-8 left-5 w-9 h-1.5 bg-amber-300/20 rounded-full" />
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
    desc: "AI-powered generation pipelines",
    inner: "Generate images, videos, variations, voiceovers, & more",
    studioPath: "/studio?creative=magic_studio",
    color: "#db2777",
    Icon: Sparkles,
    decorative: (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 border-2 border-emerald-300/20 rounded-full group-hover:animate-ping" />
          <div className="absolute w-14 h-14 border border-emerald-300/20 rounded-full group-hover:animate-ping" style={{ animationDelay: "0.4s" }} />
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
  return (
    <div className="flex flex-col  justify-center min-h-full">
      <div className="mb-8 ">
        <div className="font-semibold text-xl text-gray-900">Creative Studio</div>
        <p className="text-sm text-gray-400 mt-0.5">Choose a creative engine to get started</p>
      </div>

      <div className=" grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {pipelineOptions.map((opt) => {
          const { Icon } = opt;
          return (
            <div
              key={opt.type}
              className="bg-white rounded-xl border cursor-pointer border-gray-200 py-5 px-5 flex flex-col transition-all duration-200 relative group overflow-hidden"
              style={{ transition: "box-shadow 0.2s, border-color 0.2s" }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = opt.color + "60";
                e.currentTarget.style.boxShadow = `0 4px 20px ${opt.color}18`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "#E5E7EB";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* subtle bg glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at top right, ${opt.color}0d, transparent 65%)` }}
              />

              {/* icon area */}
              <div
                className="w-full h-40 rounded-xl flex items-center justify-center mb-4 relative overflow-hidden transition-all duration-300"
                style={{ background: `${opt.color}0f`, border: `1px solid ${opt.color}20` }}
              >
                {opt.decorative}
                <div
                  className="relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${opt.color}18` }}
                >
                  <Icon
                    className="w-7 h-7 transition-colors duration-300"
                    style={{ color: opt.color }}
                    strokeWidth={1.5}
                  />
                </div>

                {/* overlay buttons — sit on top of the icon area on hover */}
                <div
                  className="absolute inset-0 z-20 flex items-end gap-2 p-3 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  style={{ background: `linear-gradient(to top, ${opt.color}30 0%, transparent 60%)` }}
                >
                  <Link
                    href="#"
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm transition-colors duration-150"
                    style={{
                      background: "rgba(255,255,255,0.85)",
                      color: opt.color,
                      border: `1px solid ${opt.color}30`,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.85)"}
                  >
                    <Zap size={11} /> Instant
                  </Link>
                  <Link
                    href={opt.studioPath}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity duration-150 hover:opacity-90"
                    style={{ background: opt.color }}
                  >
                    <Settings size={11} /> Custom
                  </Link>
                </div>
              </div>

              {/* text */}
              <div className="relative z-10 flex-1">
                <h3 className="text-md font-semibold mb-0.5" style={{ color: "#111827" }}>
                  {opt.name}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{opt.desc}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{opt.inner}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}