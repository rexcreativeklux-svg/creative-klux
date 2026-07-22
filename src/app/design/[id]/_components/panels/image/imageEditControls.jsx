"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Shared controls for the design-editor-style image sections (Adjust / Filter /
 * Shadows). Colocated beside the sections that use them.
 */

/** Labelled range slider. */
export function Slider({ label, min, max, value, onChange, unit = "" }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-gray-600">{label}</p>
        <span className="text-[11px] text-gray-400 tabular-nums">
          {Math.round(value)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-blue-600"
      />
    </div>
  );
}

/** Section header: title on the left, an optional "See more/less" toggle + an
 *  optional extra action (e.g. Reset) on the right — the design-editor look. */
export function SectionHeader({ title, expanded, onToggle, action }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold text-gray-500">{title}</p>
      <div className="flex items-center gap-3">
        {action}
        {onToggle && (
          <button
            onClick={onToggle}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            {expanded ? "See less" : "See more"}
          </button>
        )}
      </div>
    </div>
  );
}

/** Horizontal, scrollable strip of preset tiles with left/right arrow
 *  affordances that appear only when there's more to scroll. */
export function PresetStrip({ children }) {
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 1);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scroll = (dir) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {canLeft && <Arrow side="left" onClick={() => scroll(-1)} />}
      <div
        ref={ref}
        className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>
      {canRight && <Arrow side="right" onClick={() => scroll(1)} />}
    </div>
  );
}

function Arrow({ side, onClick }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      aria-label={`Scroll ${side}`}
      className={`absolute ${side === "left" ? "left-0" : "right-0"} top-1/2 -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center rounded-full bg-surface border border-gray-200 shadow text-gray-600 hover:bg-gray-50 cursor-pointer`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
