"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare, Link2, FileText, Sparkles, ArrowRight } from "lucide-react";

const QUICK_ACTIONS = [
  {
    href: "/studio/ai-select",
    icon: MessageSquare,
    label: "AI Studio",
    description: "Describe your creative and let AI build it",
    iconBg: "#ede9fe",
    iconColor: "#7c3aed",
  },
  {
    href: "/studio/create-from-url",
    icon: Link2,
    label: "Website to Design",
    description: "Enter a website URL to generate brand-matched creatives",
    iconBg: "#d1fae5",
    iconColor: "#059669",
  },
  {
    href: "/studio/select",
    icon: FileText,
    label: "Custom Create",
    description: "Use a guided form to create your asset step by step",
    iconBg: "#fef3c7",
    iconColor: "#d97706",
  },
];

export default function QuickCreate() {
  return (
    <div className="bg-surface border border-gray-100 rounded-2xl shadow-sm h-full flex flex-col overflow-hidden">

      {/* Header */}
      <div className="px-5 pt-5 pb-4 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold text-gray-900">Quick Create</h3>
        </div>
        <p className="text-xs text-gray-400">Start creating in seconds</p>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 mx-5 shrink-0" />

      {/* Action rows */}
      <div className="flex flex-col flex-1 px-3 py-3 gap-2">
        {QUICK_ACTIONS.map(({ href, icon: Icon, label, description, iconBg, iconColor }) => (
          <Link
            key={href}
            href={href}
            className="group border border-gray-100 bg-gray-50 flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-gray-50 transition-all duration-150 cursor-pointer"
          >
            {/* Icon box */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: iconBg }}
            >
              <Icon className="w-4 h-4" style={{ color: iconColor }} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 leading-tight">{label}</p>
              <p className="text-xs text-gray-400 leading-snug mt-0.5 line-clamp-2">{description}</p>
            </div>

            {/* Arrow */}
            <ArrowRight
              className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all duration-150 shrink-0"
            />
          </Link>
        ))}
      </div>

      {/* CTA button */}
      <div className="px-5 pb-5 pt-2 shrink-0">
        <Link
          href="/studio/ai-select"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-semibold text-white text-center flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] duration-150"
        //   style={{ background: "#2563eb" }}
        >
          <Sparkles className="w-4 h-4" />
          Open Full Studio
        </Link>
      </div>
    </div>
  );
}