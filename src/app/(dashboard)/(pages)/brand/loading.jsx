"use client";

// /brand/* — loading UI for the whole Brand Kits section (reuse, manage, edit,
// create), since they share brand/layout.jsx.
//
// Shaped after /brand/reuse, the section's landing page: title + actions, a
// search/view toolbar, then the 4-across grid of brand cards. Once the route's
// code has loaded, reuse swaps to its OWN BrandCardSkeleton for the fetch — this
// grid is deliberately the same size so that hand-off is invisible.

import Skeleton from "@/app/(components)/skeletons/Skeleton";

/** Matches BrandsSkeleton's default count in brand/reuse/page.js. */
const BRAND_CARDS = 8;

export default function Loading() {
  return (
    <div className="py-2">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-40 rounded-md" />
          <Skeleton className="h-3 w-64" tone="soft" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      {/* Search + view toggle */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-10 w-full max-w-sm rounded-lg" tone="soft" />
        <Skeleton className="h-10 w-20 rounded-xl" tone="soft" />
      </div>

      {/* Brand cards — banner block, then name/tagline, pills, avatar row */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: BRAND_CARDS }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-sm"
          >
            <div className="bg-gray-100 px-4 pb-9 pt-3">
              <div className="mb-3 flex items-center justify-between">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton w={28} h={28} className="rounded-lg" />
              </div>
              <Skeleton w={48} h={48} className="rounded-xl" />
            </div>
            <div className="flex flex-1 flex-col px-3 pb-3">
              <div className="mb-2.5 flex flex-col gap-2 py-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" tone="soft" />
              </div>
              <div className="mb-2.5 flex gap-1">
                <Skeleton className="h-5 w-20 rounded-lg" tone="soft" />
                <Skeleton className="h-5 w-14 rounded-lg" tone="soft" />
              </div>
              <Skeleton className="h-2.5 w-24" tone="soft" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
