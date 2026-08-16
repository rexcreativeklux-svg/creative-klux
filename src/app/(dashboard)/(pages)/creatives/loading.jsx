"use client";

// /creatives — loading UI.
// Mirrors the page's header ("LIBRARY" eyebrow over "My Creations", the CTAs —
// one "+" on a phone, both buttons from `sm`), its filter/view toolbar, then the
// card grid the page opens in: two across on a phone, four on a wide desktop.
//
// The page ALSO has its own GridSkeleton for the fetch that follows, so this is
// specifically the route-transition frame: same geometry, so the hand-off from
// this to that to the real cards never shifts the grid.

import Skeleton from "@/app/(components)/skeletons/Skeleton";
import { SkeletonCardGrid } from "@/app/(components)/skeletons/PageSkeleton";

export default function Loading() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 pb-2 sm:pb-7">
        <div className="flex flex-col gap-2">
          <Skeleton className="hidden h-2 w-14 sm:block" tone="soft" />
          <Skeleton className="h-5 w-40 rounded-md" />
        </div>
        {/* Phones — the single "+" that opens the create menu. */}
        <Skeleton className="h-9 w-9 rounded-lg sm:hidden" />
        <div className="hidden items-center gap-3 sm:flex">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" tone="soft" />
        </div>
      </div>

      {/* Filter / view toolbar — search + controls on one line, the scrolling
          filter tabs on their own line below `sm`. */}
      <div className="flex flex-wrap items-center gap-2 pb-2 sm:gap-3 sm:pb-7">
        <Skeleton
          className="order-1 h-9 w-full min-w-0 flex-1 rounded-lg sm:max-w-xs"
          tone="soft"
        />
        <div className="order-2 flex shrink-0 items-center gap-1.5 sm:order-3 sm:ml-auto sm:gap-2">
          <Skeleton className="h-9 w-9 rounded-xl" tone="soft" />
          <Skeleton className="h-9 w-24 rounded-xl" tone="soft" />
          <Skeleton className="hidden h-9 w-20 rounded-xl md:block" tone="soft" />
        </div>
        <Skeleton
          className="order-3 h-9 w-full rounded-xl sm:order-2 sm:w-64"
          tone="soft"
        />
      </div>

      {/* Card grid */}
      <div className="flex-1 pb-2">
        <SkeletonCardGrid
          count={8}
          aspect="aspect-video"
          columns="grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          gap="gap-3 sm:gap-4"
        />
      </div>
    </div>
  );
}
