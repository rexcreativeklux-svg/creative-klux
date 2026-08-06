"use client";

// app/(components)/home/QuickStartCards.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The two shortcut cards at the foot of the home hero — the non-prompt ways into
// the studio, for someone who would rather paste a link or fill in a form than
// describe what they want:
//
//   Create from URL  → /studio/create-from-url   paste a site, it scrapes the
//                      brand and generates matching creatives
//   Create from Active Brand  → /studio/select            pick a pipeline, then work
//                      through that creative's guided form
//
// Both are plain <Link>s and collect nothing here: each destination already owns
// its whole flow (the URL page opens with its own input focused), so duplicating
// a field on the home page would only give the user two places to type it.
//
// ⚠️ Render this as the hero's LAST child, IN NORMAL FLOW — never absolutely
// positioned. The hero's height is measured against --ck-rail-top so the
// template rail's hairlines continue the sidebar's across the window (see the
// note at the top of (dashboard)/page.jsx); an in-flow row leaves that
// arithmetic untouched and, unlike an absolute one, can never end up sitting on
// top of the composer on a short viewport.
//
// Colours are the app's theme tokens (bg-surface / gray-* / blue-* / violet-*),
// so both themes follow the user's choice with no per-mode overrides.

import Link from "next/link";
import { ArrowRight, Globe, Wand2 } from "lucide-react";

/**
 * The two entry points. Exported so another surface can render the same pair
 * without restating the copy or the destinations.
 *
 * `accent` is the app's accent-chip pair — a 10% tint under a 600-weight glyph.
 * Deliberately NOT a solid fill: the gray ramp flips in dark mode but the colour
 * ramps don't, so a tint reads on the light page and the dark one alike with no
 * `dark:` override (same pairing as TemplatesSection's state panel).
 */
export const QUICK_START_ACTIONS = [
  {
    href: "/studio/create-from-url",
    // Globe matches the icon the create-from-url page leads with.
    icon: Globe,
    title: "Create from URL",
    description:
      "Paste a website link — we read the brand and build creatives that match it.",
    accent: "bg-blue-500/10 text-blue-600",
  },
  {
    href: "/studio/select",
    icon: Wand2,
    title: "Create from Active Brand",
    description:
      "Pick a creative type and shape it yourself with a guided form.",
    accent: "bg-violet-500/10 text-violet-600",
  },
];

/**
 * @param {object} props
 * @param {string} [props.className] Extra classes for the outer wrapper —
 *   spacing and entrance animation belong to the call site, not to the cards.
 * @param {React.CSSProperties} [props.style] Inline styles for the same wrapper.
 *   The home hero uses it for its stagger's `animationDelay`, matching how the
 *   greeting and composer are delayed.
 */
export default function QuickStartCards({ className = "", style }) {
  return (
    // Three quarters of the width, capped to the composer's own max-w-2xl: the
    // pair stays clear of both edges and reads as sitting under the composer
    // rather than spanning wider than it.
    <div className={`mx-auto w-[90%] max-w-5xl sm:w-3/4 ${className}`} style={style}>
      {/* Tighter stack below `sm`. Every size below is trimmed on mobile ONLY
          (`sm:` restores the desktop values): the pair is the last thing in the
          hero, so whatever height it gives back goes to the flex-1 block above,
          which re-centres — and the composer settles a little lower on a phone
          without the rail beneath moving at all. */}
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-4 justify-between">
        {QUICK_START_ACTIONS.map(
          ({ href, icon: Icon, title, description, accent }) => (
            <Link
              key={href}
              href={href}
              onClick={() =>
                console.log(`🚀 [home] quick start → "${title}" (${href})`)
              }
              // w-full below `sm`: a fixed 320px card inside the 90%-wide
              // wrapper leaves ~4px of slack on a 360px screen, so any longer
              // label pushed the row into horizontal overflow. Stacked cards
              // should just take the width they are given.
              className="group flex w-full items-center gap-2.5 rounded-xl border border-gray-200 bg-surface px-3 py-2 text-left shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_14px_32px_-16px_rgba(15,23,42,0.35)] focus:outline-none focus-visible:border-blue-500/60 focus-visible:ring-2 focus-visible:ring-blue-500/25 sm:w-80 sm:gap-3 sm:px-3.5 sm:py-3"
            >
              {/* Icon tile. h-* AND w-* on the glyph: lucide hard-codes
                  height="24" on its <svg>, so a width-only class letterboxes it. */}
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${accent}`}
              >
                <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              </span>

              {/* Spans, not <p>s — an <a> may not contain block-level content.
                  Both carry an explicit leading: Tailwind v4's arbitrary font
                  sizes set font-size only, leaving line-height at the inherited
                  1.5, which would space these two lines far too loosely. */}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold leading-tight text-gray-900">
                  {title}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-gray-500 sm:mt-1">
                  {description}
                </span>
              </span>

              <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-gray-500" />
            </Link>
          ),
        )}
      </div>
    </div>
  );
}
