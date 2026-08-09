"use client";

// app/(components)/skeletons/HomeSkeleton.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Loading state for "/" — the AI interface that replaced the old overview
// dashboard (greeting → prompt composer → template rail).
//
// This file is a mirror of (dashboard)/page.jsx and has to be edited alongside
// it. In particular it repeats that page's ONE structural trick: the hero is
// sized against --ck-rail-top so the rail underneath starts on the sidebar's
// THEME hairline. Getting that wrong here is very visible — the rail's rules
// would sit a few pixels off the sidebar's and then jump into place on load.
//
// It is CONTENT ONLY — no sidebar, no header. The real chrome is already mounted
// by the time this shows, and drawing a second set would double it up.
//
// The backdrop is deliberately omitted. RotatingHeroBackdrop paints instantly
// (it's CSS gradients, not a fetch), so the loading frame is the one moment the
// page has no artwork to preview and a flat surface is the honest placeholder.

import Skeleton from "./Skeleton";

/** Card count in the rail — TEMPLATE_DISPLAY_LIMIT's first row, xl:grid-cols-4. */
const RAIL_CARDS = 4;

/** Tab-label widths, in px — "Klux templates • Recent designs". */
const TAB_WIDTHS = [106, 92];

/**
 * Starter-prompt chip widths, in px — five pills over two centred rows, sized
 * to the real copy in home/homeSuggestions.js so the row doesn't visibly
 * re-flow the moment the page loads.
 *
 * These track the FIRST FIVE of that file's Ai Chat pool, because that is the
 * tab the composer opens on. Derived from the chip's own box: ~6.4px per
 * character at 13px/500, plus 52px of chrome (the 16px dot, its 8px gap and
 * 14px of padding each side). The three widest must still total under the
 * composer's 768px with two 8px gaps, or the skeleton wraps 2/3 while the real
 * row wraps 3/2 — which is the exact re-flow this constant exists to prevent.
 * Re-derive when the Ai Chat copy changes.
 */
const SUGGESTION_CHIP_WIDTHS = [256, 238, 250, 232, 238];

/**
 * @param {object} props
 * @param {boolean} [props.clearsHeader]  Reserve space for the app header.
 *   TRUE (default) when the real, FIXED header overlays this — i.e. every use
 *   inside the live layout. FALSE inside AppShellSkeleton, whose stand-in header
 *   sits in the flex flow and has therefore already taken its own 4rem.
 */
export default function HomeSkeleton({ clearsHeader = true }) {
  return (
    <div className={`relative min-h-full bg-page ${clearsHeader ? "pt-header" : ""}`}>
      {/* ── Hero ────────────────────────────────────────────────────────────
          Same height expression as (dashboard)/page.jsx, so the rail below
          starts on the sidebar's THEME hairline in both states. */}
      <section className="relative flex min-h-[calc(100dvh-var(--spacing-header)-var(--spacing-nav)-4rem)] flex-col justify-center pt-[clamp(1.5rem,7vh,5rem)] lg:min-h-[calc(100dvh-var(--spacing-header)-var(--ck-rail-top))]">
        <div className="relative mx-auto w-full max-w-5xl px-5 pb-10 sm:px-8">
          {/* Greeting — two lines, centred, at the heading's own height */}
          <div className="mb-7 flex flex-col items-center gap-3">
            <Skeleton className="h-8 w-40 rounded-lg sm:h-9" />
            <Skeleton className="h-8 w-72 rounded-lg sm:h-9 sm:w-96" />
          </div>

          {/* Composer — ComposerShell's footprint, in the same three pieces:
              the tab row, the tray, and the input card inside it. Every number
              below is copied from the real shell (see ComposerShell.jsx) — get
              one wrong and the whole assembly visibly resizes on load. */}
          <div className="mx-auto w-full max-w-3xl">
            {/* Tab row. Inset from the tray's left edge, tabs separated by a
                gap, the first at full height (it's the selected one) and the
                other two resting lower — exactly as the live strip draws it. */}
            <div className="flex h-10 items-end gap-1 pl-4 sm:h-11 sm:gap-1.5">
              {/* `rounded` (the inline prop) rather than a class — it has to beat
                  Skeleton's own default radius on the two bottom corners, which
                  must stay square where the tab meets the tray. */}
              <Skeleton
                rounded="15px 15px 0 0"
                className="h-10 w-24 sm:h-11 sm:w-[148px]"
              />
              {[0, 1].map((index) => (
                <Skeleton
                  key={index}
                  tone="soft"
                  rounded="15px 15px 0 0"
                  // Height = the row minus the 7px an unselected tab rests at.
                  className="h-[33px] w-24 sm:h-[37px] sm:w-[148px]"
                />
              ))}
            </div>

            <div className="rounded-[21px] bg-gray-100 p-1.5">
              <div className="rounded-[15px] bg-surface px-5 pb-3 pt-5">
                {/* Prompt area (rows={3}) */}
                <div className="flex flex-col gap-2.5">
                  <Skeleton className="h-3.5 w-3/4" tone="soft" />
                  <Skeleton className="h-3.5 w-1/2" tone="soft" />
                </div>

                {/* Toolbar: model ▾ │ attach … mic · send. The model menu leads,
                    then the divider, then the three round controls — no
                    Build/Plan and no hint line, which the home composer hides. */}
                <div className="mt-8 flex items-center gap-2">
                  {/* The menu trigger is text, not a circle — a pill roughly as
                      wide as "Model ▾", so nothing shifts when the live toolbar
                      replaces it. It stays that width whatever model is
                      selected, because the trigger names the setting rather
                      than reporting the value. */}
                  <Skeleton className="h-7 w-20 rounded-lg" tone="soft" />
                  <span className="h-5 w-px shrink-0 bg-gray-100" />
                  <Skeleton w={40} h={40} className="rounded-full" tone="soft" />
                  <div className="flex-1" />
                  <Skeleton w={40} h={40} className="rounded-full" tone="soft" />
                  <Skeleton w={40} h={40} className="rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Starter prompts — the "Not sure where to start?" line and five
              chips over two centred rows, matching HomePromptSuggestions. */}
          <div className="mx-auto mt-6 max-w-3xl sm:mt-7">
            <div className="flex justify-center">
              <Skeleton className="h-2.5 w-48" tone="soft" />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {SUGGESTION_CHIP_WIDTHS.map((width, index) => (
                <Skeleton
                  key={index}
                  tone="soft"
                  className="h-9 rounded-full"
                  w={width}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Template rail ───────────────────────────────────────────────────
          Full-bleed, and its two hairlines (this border-t, and the grid's) are
          the ones that continue the sidebar's across the window. */}
      <section className="w-full border-t border-gray-200">
        {/* Tab row — pinned to --ck-rail-row on desktop, as the real one is */}
        <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:h-(--ck-rail-row) lg:py-0">
          <div className="flex items-center gap-2.5">
            {TAB_WIDTHS.map((width, index) => (
              <div key={index} className="flex items-center gap-2.5">
                {index > 0 && (
                  <span
                    aria-hidden="true"
                    className="h-1 w-1 shrink-0 rounded-full bg-gray-300"
                  />
                )}
                <Skeleton h={12} w={width} tone="soft" />
              </div>
            ))}
          </div>
          <Skeleton h={12} w={68} tone="soft" />
        </div>

        {/* Card grid — same columns and dividers as TemplateCard.jsx's
            TemplateCardGrid, so the real cards drop straight into these slots. */}
        <div className="-mr-px grid grid-cols-1 border-t border-gray-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: RAIL_CARDS }).map((_, index) => (
            <div
              key={index}
              className="border-b border-r border-gray-200 px-4 py-5 sm:px-6"
            >
              <Skeleton className="aspect-16/10 w-full rounded-lg" tone="soft" />
              <div className="mt-3.5 flex flex-col gap-2">
                <Skeleton className="h-3.5 w-2/3" tone="soft" />
                <Skeleton className="h-3 w-1/2" tone="soft" />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Skeleton className="h-3 w-20" tone="soft" />
                <Skeleton w={32} h={32} className="rounded-lg" tone="soft" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
