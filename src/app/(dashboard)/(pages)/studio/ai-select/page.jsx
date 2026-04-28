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
    color: "#2563eb",
    lightBg: "#eff6ff",
    tags: ["Image Ads", "Video Ads", "Interactive"],
  },
  {
    type: "social_creative",
    name: "Social Creative",
    tagline: "Create Content",
    description: "Posts, reels, and stories for every platform",
    Icon: Share2,
    color: "#059669",
    lightBg: "#ecfdf5",
    tags: ["Posts", "Reels", "Banners"],
  },
  {
    type: "designer_creative",
    name: "Designer",
    tagline: "Design Anything",
    description: "Logos, flyers, brand assets & more",
    Icon: Palette,
    color: "#7c3aed",
    lightBg: "#f5f3ff",
    tags: ["Logos", "Business Cards", "Banners"],
  },
  {
    type: "magic_studio",
    name: "Magic Studio",
    tagline: "AI Generation",
    description: "Text to image, video, audio & variations",
    Icon: Wand2,
    color: "#db2777",
    lightBg: "#fdf2f8",
    tags: ["Text to Image", "Text to Video", "Voiceover"],
  },
];

export default function StudioSelectPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef(null);

  const selectedConfig = PIPELINE_OPTIONS.find((p) => p.type === selectedType);

  // Focus input when a card is selected
  useEffect(() => {
    if (selectedType) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [selectedType]);

  const navigateToChat = (type, message = "") => {
    const params = new URLSearchParams({ creative: type });
    if (message.trim()) params.set("initialMessage", message.trim());
    router.push(`/studio/ai-chat-page?${params.toString()}`);
  };

  const handleCardClick = (type) => {
    if (selectedType === type) {
      // Second click on same card → navigate directly
      navigateToChat(type, inputValue);
    } else {
      setSelectedType(type);
      setInputValue("");
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && selectedType) {
      e.preventDefault();
      navigateToChat(selectedType, inputValue);
    }
    if (e.key === "Escape") {
      setSelectedType(null);
      setInputValue("");
    }
  };

  const handleInputSubmit = () => {
    if (selectedType) navigateToChat(selectedType, inputValue);
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Top section ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-primary-600 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
            <Sparkles className="w-3 h-3" />
            CreativeKlux AI Studio
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            What would you like to create?
          </h1>
          <p className="text-sm text-gray-400 mt-1.5">
            Pick a studio — then describe your vision below
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-4xl">
          {PIPELINE_OPTIONS.map((opt, i) => {
            const { Icon } = opt;
            const isSelected = selectedType === opt.type;

            return (
              <button
                key={opt.type}
                onClick={() => handleCardClick(opt.type)}
                className="group relative flex flex-col items-start text-left rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer focus:outline-none"
                style={{
                  background: isSelected ? opt.lightBg : "#ffffff",
                  borderColor: isSelected ? opt.color : "#e5e7eb",
                  boxShadow: isSelected
                    ? `0 0 0 3px ${opt.color}18, 0 4px 16px ${opt.color}14`
                    : "0 1px 3px rgba(0,0,0,0.04)",
                  animationDelay: `${i * 60}ms`,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = opt.color + "60";
                    e.currentTarget.style.boxShadow = `0 4px 16px ${opt.color}12`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                  }
                }}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div
                    className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
                    style={{ background: opt.color }}
                  />
                )}

                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-105"
                  style={{
                    background: isSelected ? opt.color + "18" : opt.lightBg,
                    border: `1px solid ${opt.color}25`,
                  }}
                >
                  <Icon
                    className="w-4.5 h-4.5"
                    style={{ color: opt.color }}
                    strokeWidth={1.75}
                    size={18}
                  />
                </div>

                {/* Text */}
                <p className="text-xs font-semibold text-gray-900 leading-tight mb-0.5">
                  {opt.name}
                </p>
                <p className="text-[10px] text-gray-400 leading-tight line-clamp-2">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Bottom input ── */}
      <div className="sticky bottom-0  px-4 pt-4 pb-6 ">
        <div className="max-w-2xl mx-auto">
          {/* Selection label */}
          <div className="flex items-center justify-between mb-2 h-5">
            {selectedConfig ? (
              <span className="text-[11px] font-medium flex items-center gap-1.5" style={{ color: selectedConfig.color }}>
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{ background: selectedConfig.color }}
                />
                {selectedConfig.name} selected
                <span className="text-gray-400 font-normal">· press Esc to clear</span>
              </span>
            ) : (
              <span className="text-[11px] text-gray-400">
                Select a studio above first
              </span>
            )}
          </div>

          {/* Input row */}
          <div
            className="flex items-center gap-2 rounded-2xl border-2 px-4 py-3 transition-all duration-200 bg-white"
            style={{
              borderColor: inputFocused && selectedConfig
                ? selectedConfig.color + "80"
                : inputFocused
                ? "#2563eb50"
                : "#e5e7eb",
              boxShadow: inputFocused
                ? `0 0 0 3px ${selectedConfig?.color || "#2563eb"}12`
                : "none",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              disabled={!selectedType}
              placeholder={
                selectedConfig
                  ? `Describe what you want to create with ${selectedConfig.name}…`
                  : "Select a studio above to get started…"
              }
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />

            {/* Submit button */}
            <button
              onClick={handleInputSubmit}
              disabled={!selectedType}
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: selectedConfig ? selectedConfig.color : "#2563eb",
                color: "#fff",
              }}
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[10px] text-gray-400 mt-2 text-center">
            {selectedType
              ? "Press Enter to open chat · or leave blank to just browse"
              : "Click a studio card above, then describe what you want to make"}
          </p>
        </div>
      </div>
    </div>
  );
}