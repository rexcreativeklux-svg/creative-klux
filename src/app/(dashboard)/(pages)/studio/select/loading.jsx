"use client";

// /studio/select — loading UI.
// Full-bleed (see NO_PADDING_ROUTES): a centred headline over a single row of
// pipeline cards, on the page's own canvas.
//
// ⚠️ The background pair MUST stay identical to page.jsx's root
// (`bg-white dark:bg-page`), or the canvas changes tone on hand-off.

import Skeleton from "@/app/(components)/skeletons/Skeleton";

/** PIPELINE_OPTIONS renders as one non-wrapping row of cards. */
const PIPELINE_CARDS = 4;

export default function Loading() {
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white dark:bg-page">
      <div className="relative z-1 flex flex-1 flex-col items-center pt-40">
        {/* Headline + sub */}
        <Skeleton className="h-9 w-[min(560px,90%)] rounded-lg" />
        {/* mb-27 ≈ the real sub-line's pb-20 + its 44px bottom margin */}
        <Skeleton className="mb-27 mt-3 h-3 w-64 max-w-full" tone="soft" />

        {/* Pipeline cards */}
        <div className="flex w-full max-w-[1200px] justify-center gap-3 overflow-x-auto px-4 py-5">
          {Array.from({ length: PIPELINE_CARDS }).map((_, index) => (
            <div
              key={index}
              className="flex w-64 shrink-0 gap-3 rounded-2xl border border-gray-200 p-[18px]"
            >
              <Skeleton w={40} h={40} className="rounded-xl" tone="soft" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-3/5" />
                <Skeleton className="h-2.5 w-full" tone="soft" />
                <Skeleton className="h-2.5 w-4/5" tone="soft" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
