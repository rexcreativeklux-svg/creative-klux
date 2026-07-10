"use client";

/**
 * Floating background-swatch pill shown under a tool's result (Beautifier,
 * Flat Lay). Renders "Original" (keep the photo's own background), "Auto match"
 * (the color analysis pick), "Transparent" (checkerboard) and the curated/
 * matched color swatches; the active ring glides between swatches with a
 * framer-motion layoutId.
 *
 * @param {object} props
 * @param {{auto:string, swatches:Array<{id,name,color}>}|null} props.backgrounds
 * @param {string} props.value "original" | "auto" | "transparent" | a css color.
 * @param {(next: string) => void} props.onChange
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.showOriginal=false] Offer keeping the photo's background.
 * @param {boolean} [props.showAuto=true] Hide for tools without an auto pick.
 * @param {boolean} [props.showTransparent=true]
 */

import { motion } from "framer-motion";
import { Sparkles, Image as ImageIcon } from "lucide-react";

const CHECKER =
  "repeating-conic-gradient(#e4e4e7 0% 25%, #fff 0% 50%) 50% / 10px 10px";

export default function BackgroundSwatchRow({
  backgrounds,
  value,
  onChange,
  disabled = false,
  showOriginal = false,
  showAuto = true,
  showTransparent = true,
}) {
  if (!backgrounds) return null;

  const options = [
    ...(showOriginal
      ? [{ id: "original", name: "Original background", isOriginal: true }]
      : []),
    ...(showAuto
      ? [{ id: "auto", name: "Auto match", color: backgrounds.auto, isAuto: true }]
      : []),
    ...(showTransparent
      ? [{ id: "transparent", name: "Transparent", color: "transparent" }]
      : []),
    ...backgrounds.swatches,
  ];

  const isActive = (opt) => {
    if (opt.id === "original") return value === "original";
    if (opt.id === "auto") return value === "auto";
    if (opt.id === "transparent") return value === "transparent";
    return value === opt.color;
  };
  const valueFor = (opt) => {
    if (opt.id === "original") return "original";
    if (opt.id === "auto") return "auto";
    if (opt.id === "transparent") return "transparent";
    return opt.color;
  };

  return (
    <div className="flex items-center gap-1.5 bg-surface/90 backdrop-blur rounded-full border border-gray-200 shadow-lg px-2.5 py-1.5">
      {options.map((opt) => {
        const active = isActive(opt);
        return (
          <motion.button
            key={opt.id}
            type="button"
            title={opt.name}
            aria-label={`Background: ${opt.name}`}
            disabled={disabled}
            onClick={() => !active && onChange(valueFor(opt))}
            whileTap={{ scale: 0.88 }}
            className="relative w-7 h-7 rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span
              className="absolute inset-0 rounded-full border border-gray-200 flex items-center justify-center overflow-hidden"
              style={
                opt.isOriginal
                  ? { background: "linear-gradient(135deg, #e8edf5 0%, #f4efe6 100%)" }
                  : opt.id === "transparent"
                    ? { background: CHECKER }
                    : { backgroundColor: opt.color }
              }
            >
              {opt.isOriginal && <ImageIcon className="w-3 h-3 text-gray-600" />}
              {opt.isAuto && (
                <Sparkles className="w-3 h-3 text-violet-500 drop-shadow-sm" />
              )}
            </span>
            {active && (
              <motion.span
                layoutId="bg-swatch-ring"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                className="absolute -inset-1 rounded-full ring-2 ring-violet-500"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
