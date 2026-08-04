"use client";

// The settings group — loading UI for /profile, /billing, /team, /resell,
// /socials, /ads, /custom-domain and /sessions-and-password.
//
// (settings) is a route group, so this single boundary covers all eight without
// each needing its own file. They share one shape: a heading with a line of
// supporting copy, then stacked bordered panels of fields — which is what this
// draws. Any one of them that grows a genuinely different layout can override
// this by dropping a loading.jsx of its own beside its page.

import Skeleton from "@/app/(components)/skeletons/Skeleton";

/** Fields per panel — a longer first panel, a shorter second one. */
const PANELS = [4, 2];

export default function Loading() {
  return (
    <div className="space-y-4 py-3">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2">
        <Skeleton className="h-5 w-48 rounded-md" />
        <Skeleton className="h-3 w-72 max-w-full" tone="soft" />
      </div>

      {PANELS.map((fields, panelIndex) => (
        <div
          key={panelIndex}
          className="space-y-5 rounded-xl border border-gray-200 bg-surface p-6"
        >
          {/* Panel eyebrow */}
          <Skeleton className="h-2.5 w-20" tone="soft" />

          {/* The first panel opens with an avatar row */}
          {panelIndex === 0 && (
            <div className="flex items-center gap-4">
              <Skeleton w={56} h={56} className="rounded-full" tone="soft" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2.5 w-48" tone="soft" />
              </div>
            </div>
          )}

          {/* Fields, two across from sm up — matching the pages' own grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: fields }).map((_, index) => (
              <div key={index} className="flex flex-col gap-2">
                <Skeleton className="h-2.5 w-24" tone="soft" />
                <Skeleton className="h-10 w-full rounded-lg" tone="soft" />
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
