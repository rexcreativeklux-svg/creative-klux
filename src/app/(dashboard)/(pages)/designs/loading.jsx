"use client";

// /designs — loading UI.
// DesignsLayout is a title over a 4-across grid of poster thumbnails, so this
// is the same grid with the artwork greyed out. The tiles carry no footer:
// the real cards are artwork only, and inventing a caption row here would make
// the grid visibly shorten as the real thumbnails land.

import Skeleton from "@/app/(components)/skeletons/Skeleton";
import { SkeletonCardGrid } from "@/app/(components)/skeletons/PageSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen px-13 py-10">
      <Skeleton className="mb-10 h-5 w-40 rounded-md" />
      <SkeletonCardGrid
        count={12}
        aspect="aspect-3/4"
        withFooter={false}
        gap="gap-8"
        columns="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      />
    </div>
  );
}
