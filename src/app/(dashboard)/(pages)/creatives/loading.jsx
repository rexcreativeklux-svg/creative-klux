"use client";

// /creatives — loading UI.
// Mirrors the page's header ("LIBRARY" eyebrow over "My Creations", two CTAs),
// its filter/view toolbar, then the 4-across card grid the page opens in.
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
      <div className="flex shrink-0 items-center justify-between pb-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-2 w-14" tone="soft" />
          <Skeleton className="h-5 w-40 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" tone="soft" />
        </div>
      </div>

      {/* Filter / view toolbar */}
      <div className="flex flex-wrap items-center gap-3 pb-4">
        <Skeleton className="h-9 w-full max-w-xs rounded-lg" tone="soft" />
        <Skeleton className="h-9 w-28 rounded-lg" tone="soft" />
        <Skeleton className="h-9 w-24 rounded-lg" tone="soft" />
        <div className="ml-auto">
          <Skeleton className="h-9 w-20 rounded-xl" tone="soft" />
        </div>
      </div>

      {/* Card grid */}
      <div className="flex-1 pb-2">
        <SkeletonCardGrid
          count={8}
          aspect="aspect-4/3"
          columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        />
      </div>
    </div>
  );
}
