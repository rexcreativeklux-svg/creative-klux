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

/** Tab-label widths, in px — "Recent designs • Klux templates". */
const TAB_WIDTHS = [92, 106];

/**
 * @param {object} props
 * @param {boolean} [props.clearsHeader]  Reserve space for the app header.
 *   TRUE (default) when the real, FIXED header overlays this — i.e. every use
 *   inside the live layout. FALSE inside AppShellSkeleton, whose stand-in header
 *   sits in the flex flow and has therefore already taken its own 4rem.
 */
export default function HomeSkeleton({ clearsHeader = true }) {
  return (
    <div className={`relative min-h-full bg-page ${clearsHeader ? "pt-16" : ""}`}>
      {/* ── Hero ────────────────────────────────────────────────────────────
          Same height expression as (dashboard)/page.jsx, so the rail below
          starts on the sidebar's THEME hairline in both states. */}
      <section className="relative flex min-h-[calc(100vh-4rem-7rem)] flex-col justify-center pt-[clamp(1.5rem,7vh,5rem)] md:min-h-[calc(100vh-4rem-var(--ck-rail-top))]">
        <div className="relative mx-auto w-full max-w-5xl px-5 pb-10 sm:px-8">
          {/* Greeting — two lines, centred, at the heading's own height */}
          <div className="mb-7 flex flex-col items-center gap-3">
            <Skeleton className="h-8 w-40 rounded-lg sm:h-9" />
            <Skeleton className="h-8 w-72 rounded-lg sm:h-9 sm:w-96" />
          </div>

          {/* Composer — the glass panel's footprint: rounded-[20px], a 2-row
              text area, then the toolbar strip of controls along the bottom. */}
          <div className="mx-auto w-full max-w-2xl">
            <div className="rounded-[20px] border border-gray-200 bg-surface p-4 shadow-[0_22px_60px_-28px_rgba(15,23,42,0.40)]">
              {/* Prompt area (rows={2}) */}
              <div className="flex flex-col gap-2.5 px-1 pt-1">
                <Skeleton className="h-3.5 w-3/4" tone="soft" />
                <Skeleton className="h-3.5 w-1/2" tone="soft" />
              </div>

              {/* Toolbar: attach · divider · model · mode … send */}
              <div className="mt-5 flex items-center gap-1.5">
                <Skeleton w={32} h={32} className="rounded-lg" tone="soft" />
                <span className="mx-0.5 h-5 w-px shrink-0 bg-gray-200" />
                <Skeleton className="h-8 w-28 rounded-lg" tone="soft" />
                <Skeleton className="h-8 w-20 rounded-lg" tone="soft" />
                <div className="flex-1" />
                <Skeleton w={32} h={32} className="rounded-lg" />
              </div>
            </div>

            {/* The hint line under the composer */}
            <div className="mt-2.5 flex min-h-4.5 justify-center">
              <Skeleton className="h-2.5 w-52" tone="soft" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Template rail ───────────────────────────────────────────────────
          Full-bleed, and its two hairlines (this border-t, and the grid's) are
          the ones that continue the sidebar's across the window. */}
      <section className="w-full border-t border-gray-200">
        {/* Tab row — pinned to --ck-rail-row on desktop, as the real one is */}
        <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6 md:h-(--ck-rail-row) md:py-0">
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

        {/* Card grid — same columns and dividers as TemplatesSection's CardGrid,
            so the real cards drop straight into these slots. */}
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
