"use client";

import React from "react";
import { Layers, Megaphone, Users, Share2, Image, Loader2 } from "lucide-react";

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
    key: "images",
    label: "Image Gallery",
    icon: Image,
    color: "#d97706",
    bgColor: "#fffbeb",
    borderColor: "#fde68a",
    getValue: ({ imageCount }) => imageCount ?? 0,
  },
  {
    key: "teams",
    label: "Team Members",
    icon: Users,
    color: "#059669",
    bgColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    getValue: ({ teamCount }) => teamCount ?? 0,
  },
];

export default function DashboardStats({
  statsByCategory = {},
  imageCount = 0,
  teamCount = 0,
  isLoading = false,
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {STAT_CARDS.map(({ key, label, icon: Icon, color, bgColor, borderColor, getValue }) => {
        const value = getValue({ statsByCategory, imageCount, teamCount });
        return (
          <div
            key={key}
            className="bg-white rounded-2xl border p-4 flex flex-col gap-3 transition-all hover:shadow-md hover:-translate-y-0.5 duration-200"
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