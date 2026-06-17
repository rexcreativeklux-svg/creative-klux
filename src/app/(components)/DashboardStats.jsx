"use client";
import React from "react";
import { Layers, Megaphone, Users, Share2, Image, Loader2, Paintbrush, Sparkles, Link2, Send } from "lucide-react";

const STAT_CARDS = [
  {
    key: "total",
    label: "Total Designs",
    icon: Layers,
    color: "#2563eb",
    bgColor: "#eff6ff",
    borderColor: "#bfdbfe",
    getValue: ({ statsByCategory }) =>
      Object.values(statsByCategory).reduce((a, b) => a + b, 0),
  },
  {
    key: "ads",
    label: "Ad Creatives",
    icon: Megaphone,
    color: "#7c3aed",
    bgColor: "#f5f3ff",
    borderColor: "#ddd6fe",
    getValue: ({ statsByCategory }) => statsByCategory.ads ?? 0,
  },
  {
    key: "social",
    label: "Social Posts",
    icon: Share2,
    color: "#0891b2",
    bgColor: "#ecfeff",
    borderColor: "#a5f3fc",
    getValue: ({ statsByCategory }) => statsByCategory.social ?? 0,
  },
  {
    key: "designer",
    label: "Designer Assets",
    icon: Paintbrush,
    color: "#d97706",
    bgColor: "#fffbeb",
    borderColor: "#fde68a",
    getValue: ({ statsByCategory }) => statsByCategory.designer ?? 0,
  },
  {
    key: "magic",
    label: "Magic Studio",
    icon: Sparkles,
    color: "#0d9488",
    bgColor: "#f0fdfa",
    borderColor: "#99f6e4",
    getValue: ({ magicCount }) => magicCount ?? 0,
  },
  {
    key: "platforms",
    label: "Connected Platforms",
    icon: Link2,
    color: "#16a34a",
    bgColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    getValue: ({ platformCount }) => platformCount ?? 0,
  },
  {
    key: "published",
    label: "Published Posts",
    icon: Send,
    color: "#1d4ed8",
    bgColor: "#eff6ff",
    borderColor: "#bfdbfe",
    getValue: ({ publishedCount }) => publishedCount ?? 0,
  },
];

export default function DashboardStats({
  statsByCategory = {},
  imageCount = 0,
  teamCount = 0,
  magicCount = 0,
  platformCount = 0,
  publishedCount = 0,
  isLoading = false,
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
      {STAT_CARDS.map(({ key, label, icon: Icon, color, bgColor, borderColor, getValue }) => {
        const value = getValue({ statsByCategory, imageCount, teamCount, magicCount, platformCount, publishedCount });
        return (
          <div
            key={key}
            className="bg-surface cursor-pointer rounded-xl border p-4 flex flex-col gap-3 transition-all hover:shadow-md hover:-translate-y-0.5 duration-200"
            style={{ borderColor }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: bgColor }}
            >
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            {isLoading ? (
              <div className="h-7 w-10 bg-gray-100 animate-pulse rounded-lg" />
            ) : (
              <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
            )}
            <p className="text-xs font-medium text-gray-500 leading-tight">{label}</p>
          </div>
        );
      })}
    </div>
  );
}