"use client";

// /product-studio/* — loading UI (covers the batch sub-page too).
// Mirrors page.jsx: title + search on one line, the 5-across tool grid, then
// the "Get started" card row.

import Skeleton from "@/app/(components)/skeletons/Skeleton";
import {
  SkeletonCardGrid,
  SkeletonToolGrid,
} from "@/app/(components)/skeletons/PageSkeleton";

export default function Loading() {
  return (
    <div>
      {/* Header — title left, search right */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-7 w-52 rounded-md" />
        <Skeleton className="h-10 w-64 rounded-lg" tone="soft" />
      </div>

      <div className="py-6">
        {/* Tool grid — grid-cols-5, gap-2, as the real one is */}
        <div className="mb-8">
          <SkeletonToolGrid
            count={10}
            withBlurb={false}
            columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
          />
        </div>

        {/* Get started */}
        <div className="mb-4 flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2.5 w-64" tone="soft" />
        </div>
        <SkeletonCardGrid count={8} aspect="aspect-square" />
      </div>
    </div>
  );
}
