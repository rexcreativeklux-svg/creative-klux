"use client";

// /help/* — loading UI for the help index, /help/support and
// /help/tutorial-videos.
//
// The three share a shape: a large centred-ish heading with a line of copy,
// then a grid of cards (support channels, or video thumbnails). Tutorial Videos
// is the one with real artwork, so the tiles carry a thumbnail block.

import Skeleton from "@/app/(components)/skeletons/Skeleton";
import { SkeletonCardGrid } from "@/app/(components)/skeletons/PageSkeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-64 max-w-full rounded-lg" />
        <Skeleton className="h-3.5 w-96 max-w-full" tone="soft" />
      </div>

      <SkeletonCardGrid
        count={8}
        aspect="aspect-video"
        columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        gap="gap-6"
      />
    </div>
  );
}
