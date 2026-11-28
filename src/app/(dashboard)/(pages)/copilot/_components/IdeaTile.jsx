"use client";

/**
 * IdeaTile — one template as a bold colour tile, styled after the home page's
 * template artwork: the copilot it becomes (avatar + name) top-left, a big
 * headline, short copy, an accent shape along the bottom-left and the platforms
 * it touches bottom-right.
 *
 * Shared by the /copilot home's template grid and /copilot/templates, so the
 * two cannot drift.
 */

import { Loader2 } from "lucide-react";
import PlatformChip from "./PlatformChip";
import TemplateAvatar from "./TemplateAvatar";

/**
 * Colour sets, cycled by position. Literal hex rather than theme tokens on
 * purpose: these are "printed" tiles and must look the same in light and dark
 * mode (gray-900 etc. flip in dark mode and would vanish on these backgrounds).
 */
const IDEA_TILES = [
  { bg: "#1d4ed8", fg: "#ffffff", muted: "rgba(255,255,255,0.78)", eyebrow: "rgba(255,255,255,0.85)", accent: "#facc15" },
  { bg: "#fdf1e4", fg: "#1f2937", muted: "#4b5563", eyebrow: "#e2553b", accent: "#e2553b" },
  { bg: "#0f6b4f", fg: "#ffffff", muted: "rgba(255,255,255,0.78)", eyebrow: "#facc15", accent: "#facc15" },
  { bg: "#0b3b3f", fg: "#ffffff", muted: "rgba(255,255,255,0.75)", eyebrow: "#f4a261", accent: "#f4a261" },
  { bg: "#0f1736", fg: "#ffffff", muted: "rgba(255,255,255,0.72)", eyebrow: "#93c5fd", accent: "#3b82f6" },
  { bg: "#fde68a", fg: "#1f2937", muted: "#4b5563", eyebrow: "#1d4ed8", accent: "#1d4ed8" },
];

/**
 * @param {Object} props
 * @param {{name: string, title: string, platforms: string[], description: string}} props.idea
 * @param {number} props.index     Picks the colour set.
 * @param {() => void} props.onClick
 * @param {boolean} [props.busy]   This template's copilot is being created.
 * @param {boolean} [props.disabled] Another template is being created.
 */
export default function IdeaTile({ idea, index, onClick, busy = false, disabled = false }) {
  const { name, title, platforms, description } = idea;
  const tile = IDEA_TILES[index % IDEA_TILES.length];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      aria-label={`Use template: ${name} — ${title}`}
      aria-busy={busy || undefined}
      className={`group relative flex min-h-56 flex-col overflow-hidden rounded-xl p-6 text-left transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
        busy || disabled
          ? "cursor-default"
          : "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg"
      } ${disabled && !busy ? "opacity-60" : ""}`}
      style={{ backgroundColor: tile.bg }}
    >
      {/* Accent shape */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-8 -left-6 h-16 w-[75%] -rotate-6"
        style={{ backgroundColor: tile.accent }}
      />

      {/* The copilot this template becomes */}
      <div className="relative flex items-center gap-2.5">
        <TemplateAvatar seed={name} size={36} />
        <p
          className="text-[12px] font-bold tracking-wide truncate"
          style={{ color: tile.eyebrow }}
        >
          {name}
        </p>
      </div>

      <p
        className="relative mt-4 text-2xl font-extrabold leading-tight tracking-tight"
        style={{ color: tile.fg }}
      >
        {title}
      </p>
      <p
        className="relative mt-2.5 pb-10 text-[13px] leading-relaxed"
        style={{ color: tile.muted }}
      >
        {description}
      </p>

      {/* Platforms — bottom-right, clear of the accent shape on the left */}
      {platforms.length > 0 && (
        <span className="absolute bottom-4 right-4 flex items-center gap-1.5">
          {platforms.map((platform) => (
            <PlatformChip key={platform} platform={platform} />
          ))}
        </span>
      )}

      {/* Creating the copilot */}
      {busy && (
        <span className="absolute inset-0 flex items-center justify-center gap-2 bg-black/35 text-sm font-semibold text-white">
          <Loader2 className="h-4 w-4 animate-spin" />
          Creating {name}…
        </span>
      )}
    </button>
  );
}
