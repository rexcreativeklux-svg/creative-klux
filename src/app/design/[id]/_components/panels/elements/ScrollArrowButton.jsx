"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SIDE = {
  left: { Icon: ChevronLeft, pos: "left-0", label: "Scroll left" },
  right: { Icon: ChevronRight, pos: "right-0", label: "Scroll right" },
};

/**
 * ScrollArrowButton — the circular chevron that pages a horizontal strip. Sits
 * over the strip's edge on the side it points to.
 *
 * Props: { side: "left" | "right", onClick }
 */
export default function ScrollArrowButton({ side, onClick }) {
  const { Icon, pos, label } = SIDE[side];

  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`absolute ${pos} top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-surface text-gray-600 shadow-md ring-1 ring-gray-200 hover:text-gray-900 hover:shadow-lg cursor-pointer transition`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
