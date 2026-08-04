"use client";

// /magic-studio — loading UI.
// Mirrors page.jsx: title + blurb with a search field opposite, the category
// tool grid, then the Inspiration gallery.

import Skeleton from "@/app/(components)/skeletons/Skeleton";
import {
  SkeletonCardGrid,
  SkeletonToolGrid,
} from "@/app/(components)/skeletons/PageSkeleton";

export default function Loading() {
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-44 rounded-md" />
          <Skeleton className="h-3 w-72 max-w-full" tone="soft" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg sm:w-64" tone="soft" />
      </div>

      <div className="py-6">
        {/* Category tools */}
        <div className="mb-10">
          <SkeletonToolGrid
            count={8}
            columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          />
        </div>

        {/* Inspiration */}
        <div className="mb-4 flex flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-2.5 w-72 max-w-full" tone="soft" />
        </div>
        <SkeletonCardGrid
          count={8}
          aspect="aspect-square"
          columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          gap="gap-3"
        />
      </div>
    </div>
  );
}
