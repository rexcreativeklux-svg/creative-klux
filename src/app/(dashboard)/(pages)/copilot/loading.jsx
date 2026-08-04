"use client";

// /copilot/* — loading UI (covers /copilot/all too).
// Copilot is one of the layout's full-bleed routes: it clears the fixed header
// itself with pt-16 and paints its own tinted page colour, so this reproduces
// both rather than sitting on bg-page.
//
// Mirrors page.jsx: centred hero heading, the task composer card, then the
// starter-ideas band — whose hairline grid is drawn the same way the real one
// is (gap-px over a grey backdrop) so the rules land on identical pixels.

import Skeleton from "@/app/(components)/skeletons/Skeleton";

const IDEA_CARDS = 6;

/** Category-tab label widths, in px. */
const TAB_WIDTHS = [64, 88, 72, 96, 80];

export default function Loading() {
  return (
    <div className="flex min-h-full flex-col bg-[#eef1f7] pt-16 dark:bg-page">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center px-4 pb-12 pt-14 md:pt-24">
        <div className="flex w-full max-w-xl flex-col items-center gap-3">
          <Skeleton className="h-8 w-64 max-w-full rounded-lg md:h-10" />
          <Skeleton className="h-8 w-80 max-w-full rounded-lg md:h-10" />
        </div>

        {/* Task composer */}
        <div className="mt-10 w-full max-w-xl rounded-2xl border border-gray-200 bg-surface p-4 shadow-sm">
          <div className="flex flex-col gap-2.5">
            <Skeleton className="h-3 w-3/5" tone="soft" />
            <Skeleton className="h-3 w-2/5" tone="soft" />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Skeleton w={28} h={28} className="rounded-lg" tone="soft" />
            <div className="flex items-center gap-1.5">
              <Skeleton w={28} h={28} className="rounded-lg" tone="soft" />
              <Skeleton w={32} h={32} className="rounded-lg" />
            </div>
          </div>
        </div>

        <Skeleton className="mt-14 h-2.5 w-52" tone="soft" />
      </section>

      {/* ── Starter ideas ─────────────────────────────────────────────────── */}
      <section className="flex-1 border-t border-gray-200 bg-surface pb-20 md:pb-0">
        <div className="flex gap-6 px-4 py-3 md:justify-center">
          {TAB_WIDTHS.map((width, index) => (
            <Skeleton key={index} h={13} w={width} className="shrink-0" tone="soft" />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-px border-y border-gray-200 bg-gray-200 md:grid-cols-3">
          {Array.from({ length: IDEA_CARDS }).map((_, index) => (
            <div key={index} className="bg-surface p-6">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-3.5 w-2/5" />
                <div className="flex items-center gap-1.5">
                  <Skeleton w={18} h={18} className="rounded-full" tone="soft" />
                  <Skeleton w={18} h={18} className="rounded-full" tone="soft" />
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <Skeleton className="h-2.5 w-full" tone="soft" />
                <Skeleton className="h-2.5 w-4/5" tone="soft" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center py-4">
          <Skeleton className="h-2.5 w-64 max-w-full" tone="soft" />
        </div>
      </section>
    </div>
  );
}
