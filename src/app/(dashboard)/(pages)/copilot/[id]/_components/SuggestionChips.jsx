"use client";

/**
 * SuggestionChips — the row of starters above a copilot's composer.
 *
 * ⚠️ The chips are THIS copilot's own starters, read from the shared idea
 * catalog (../../_data/ideas) by its `category`, not a generic set. Brand Warden
 * offers brand-kit work; Voice Desk offers voiceovers. That is the whole point
 * of the row — a suggestion the copilot in front of you would not do is worse
 * than no suggestion — and reading them from the same catalog the /copilot home
 * grid uses means there is no second list to keep honest.
 *
 * Cycling rather than shuffling: ↻ advances a window through the category's
 * ideas and wraps, so the user can walk the whole set and get back to where they
 * started. A random pick repeats and hides ideas at the same time.
 *
 * @param {Object} props
 * @param {Object[]} props.ideas    That category's ideas (may be empty).
 * @param {(idea: Object) => void} props.onPick  Chip clicked — the screen loads
 *   the idea's description into the composer.
 * @param {() => void} props.onDismiss           Hide the row for this session.
 */

import { useState } from "react";
import { RefreshCw, X } from "lucide-react";
import PlatformChip from "../../_components/PlatformChip";

/** Chips per row. Three fits the composer's width without wrapping on a laptop. */
const WINDOW = 3;

export default function SuggestionChips({ ideas, onPick, onDismiss }) {
  const [offset, setOffset] = useState(0);
  if (!ideas.length) return null;

  // Wraps, so the window keeps working when the catalog is not a multiple of 3.
  const shown = Array.from({ length: Math.min(WINDOW, ideas.length) }, (_, i) => ideas[(offset + i) % ideas.length]);

  return (
    <div className="flex items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto hide-scrollbar">
        {shown.map((idea) => (
          <button
            key={idea.title}
            onClick={() => onPick(idea)}
            title={idea.description}
            className="flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-surface px-3 py-1.5 text-[13px] font-medium text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            {/* The same chip the idea cards use, so a starter carries the same
                platform badges wherever it is offered. */}
            {idea.platforms.slice(0, 2).map((platform) => (
              <PlatformChip key={platform} platform={platform} />
            ))}
            <span className="max-w-50 truncate">{idea.title}</span>
          </button>
        ))}
      </div>
      <button
        onClick={() => setOffset((o) => (o + WINDOW) % ideas.length)}
        aria-label="Show other suggestions"
        className="shrink-0 p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <RefreshCw className="h-4 w-4" />
      </button>
      <button
        onClick={onDismiss}
        aria-label="Hide suggestions"
        className="shrink-0 p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
