"use client";

// app/(components)/home/HomePromptSuggestions.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The starter prompts under the home composer:
//
//     Not sure where to start? Try these  ⤨
//     ( ● Instagram post for a sale )  ( ● Poster for a live show )  …
//
// Clicking one writes it into the prompt box; the shuffle control swaps the five
// on screen for the next five in that tab's pool. Both effects belong to the
// CALLER — this component reports the click and owns nothing but which slice of
// the pool is showing.
//
// The suggestions follow the selected tab, so switching from Ai Chat to Import
// Site changes what is on offer here as well as what the placeholder says.
//
// ⚠️ The shuffle walks the pool in order — it does NOT pick at random. Random
// would resolve differently in the server render and the client's, and React
// would throw the row away and rebuild it during hydration.

import { Shuffle } from "lucide-react";
import { useState } from "react";
// ⚠️ "homeSuggestions", not "homePromptSuggestions" — a data file whose name
// differs from this component's only by case would resolve to THIS FILE on a
// case-insensitive filesystem (Next tries .jsx before .js), and the component
// would quietly import itself.
import { SUGGESTIONS_VISIBLE, dotGradient, nextSuggestions } from "./homeSuggestions";

/**
 * @param {object} props
 * @param {string} props.tabId  The selected composer tab — picks the pool.
 * @param {(suggestion: string) => void} props.onPick Fired with the chosen line.
 * @param {string} [props.className] Extra classes for the wrapper — spacing and
 *   entrance animation belong to the call site.
 * @param {React.CSSProperties} [props.style] Inline styles for the same wrapper.
 */
export default function HomePromptSuggestions({
  tabId,
  onPick,
  className = "",
  style,
}) {
  // How far the shuffle has walked. It only ever grows — nextSuggestions wraps,
  // so there is nothing to reset when the tab changes.
  const [offset, setOffset] = useState(0);
  const suggestions = nextSuggestions(tabId, offset);

  const shuffle = () => {
    console.log(`🎲 [home] shuffling the "${tabId}" starter prompts`);
    setOffset((current) => current + SUGGESTIONS_VISIBLE);
  };

  return (
    <div className={`w-full ${className}`} style={style}>
      {/* Heading — quiet on purpose. It's a nudge for someone who has nothing to
          type, not a section title competing with the greeting above. */}
      <div className="flex items-center justify-center gap-1.5 text-[12px] text-gray-400">
        <span>Not sure where to start? Try these</span>
        <button
          type="button"
          onClick={shuffle}
          aria-label="Show different suggestions"
          title="Show different suggestions"
          // The glyph turns as the row changes, so the control shows that it did
          // something even when the new five are the same length as the old.
          className="group flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-surface/60 hover:text-gray-600"
        >
          {/* h-* AND w-*: lucide hard-codes height="24" on its <svg>, so a
              width-only class letterboxes the glyph. */}
          <Shuffle className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:rotate-180 motion-reduce:transition-none" />
        </button>
      </div>

      {/* Chips. Centred and wrapping, so the row reflows to two lines on a
          narrow window instead of scrolling sideways or squashing the copy. */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            // The suggestion text, not the index: keying by position would let
            // React reuse the same DOM node for a different line and the chips
            // would swap their text in place instead of coming in fresh.
            key={suggestion}
            type="button"
            onClick={() => {
              console.log(`💡 [home] starter prompt picked — "${suggestion}"`);
              onPick?.(suggestion);
            }}
            className="animate-ck-fade-in group flex max-w-full cursor-pointer items-center gap-2 rounded-full border border-gray-200/70 bg-surface/65 px-3.5 py-2 text-[13px] font-medium text-gray-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-surface hover:text-gray-900 focus:outline-none focus-visible:border-blue-500/60 focus-visible:ring-2 focus-visible:ring-blue-500/25 motion-reduce:transition-none"
          >
            <span
              aria-hidden="true"
              className={`h-4 w-4 shrink-0 rounded-full bg-linear-to-br ${dotGradient(index)}`}
            />
            <span className="truncate">{suggestion}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
