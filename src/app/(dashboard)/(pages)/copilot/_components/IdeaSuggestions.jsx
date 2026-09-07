"use client";

/**
 * IdeaSuggestions — three starter ideas in the sidebar's Designs tab, rotating
 * on the hour.
 *
 * The full catalog is the grid on /copilot home; this is a window onto it, put
 * where someone working on designs will actually pass it. Clicking one carries
 * the idea over as `?task=`, so it arrives typed into the Copilot composer
 * rather than making the user find it again in the grid.
 *
 * ── WHY THREE, AND WHY THE ORDER IS INTERLEAVED ─────────────────────────────
 * ⚠️ POOL is built COLUMN-WISE — the first idea of every category, then the
 * second of every category, and so on — so each group of three spans three
 * different surfaces. Chunking the catalog in its natural order would have
 * given three brand-kit ideas in one hour and three ad ideas the next, and the
 * rail would read as a section that only ever talks about one thing.
 *
 * ── WHY THE CLOCK, NOT A TIMER OR A SHUFFLE ─────────────────────────────────
 * Same rule as the home hero and the copilot greeting: the trio is a function
 * of the hour, so it holds across reloads instead of changing every time the
 * user navigates, and two people looking at the same moment see the same three.
 * See useRotatingIndex for the full reasoning.
 *
 * @param {Object} props
 * @param {() => void} [props.onNavigate] Called when a link is followed, so the
 *   mobile drawer holding this can close itself (see Sidebar.jsx).
 */

import { useState } from "react";
import Link from "next/link";
import { useRotatingIndex } from "@/app/(components)/home/useRotatingIndex";
import { CATEGORIES, IDEAS } from "../_data/ideas";
import { CATEGORY_SURFACES } from "../_data/surfaces";
import { HOUR_MS } from "../_data/copilotGreetings";
import NavSection from "./NavSection";

/** How many show at once, and therefore how far the window steps each hour. */
const PER_WINDOW = 3;

/** Every idea, one category at a time across each rank — see the ⚠️ above. */
const POOL = (() => {
  const depth = Math.max(...CATEGORIES.map((c) => IDEAS[c]?.length ?? 0));
  const out = [];
  for (let rank = 0; rank < depth; rank++) {
    for (const category of CATEGORIES) {
      const idea = IDEAS[category]?.[rank];
      if (idea) out.push({ ...idea, category });
    }
  }
  return out;
})();

const GROUPS = Math.max(1, Math.ceil(POOL.length / PER_WINDOW));

export default function IdeaSuggestions({ onNavigate }) {
  const [open, setOpen] = useState(true);
  const { index } = useRotatingIndex(GROUPS, { intervalMs: HOUR_MS });

  // Wrapped rather than sliced, so a catalog that stops being a multiple of
  // three still shows three rows instead of a short last group.
  const start = index * PER_WINDOW;
  const shown = Array.from(
    { length: PER_WINDOW },
    (_, i) => POOL[(start + i) % POOL.length],
  );

  return (
    <NavSection label="Copilot" open={open} onToggle={() => setOpen((p) => !p)}>
      <div className="mt-0.5 flex flex-col">
        {shown.map(({ title, description, category }) => {
          const surface = CATEGORY_SURFACES[category];
          const Icon = surface?.Icon;
          return (
            <Link
              key={title}
              // The description is the task — it is the sentence with the
              // cadence in it ("Every Friday, …"), which is what a copilot
              // needs. The title is a label for the rail, not an instruction.
              href={`/copilot?task=${encodeURIComponent(description)}`}
              onClick={onNavigate}
              title={description}
              className="group flex items-start gap-2.5 rounded-xl px-3 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              {/* Same coloured mark the workflow and skill cards use, so an
                  idea's surface looks the same wherever it turns up. */}
              {Icon && (
                <span
                  className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: surface.iconBg }}
                >
                  <Icon className="h-3 w-3 text-white" />
                </span>
              )}
              {/* Clamped rather than truncated: titles are short noun phrases,
                  so most sit on one line here, and the ones that don't keep
                  their last word instead of ending in an ellipsis. */}
              <span className="min-w-0 flex-1 line-clamp-2 text-[13px] font-medium leading-snug">
                {title}
              </span>
            </Link>
          );
        })}
      </div>

      <Link
        href="/copilot"
        onClick={onNavigate}
        className="block px-3 pt-1.5 text-[12px] text-gray-500 underline underline-offset-2 hover:text-gray-900 transition-colors"
      >
        View all
      </Link>
    </NavSection>
  );
}
