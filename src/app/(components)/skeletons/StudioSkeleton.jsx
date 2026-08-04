"use client";

// app/(components)/skeletons/StudioSkeleton.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Loading state for /studio — the back link + breadcrumb strip, the page
// heading, then the category grid the "select" step opens on.
//
// Two boundaries can show this on the way into the page: the route's
// loading.jsx (segment transition) and the page's own Suspense wrapper around
// useSearchParams. Both render THIS, so whichever fires — or if both do in
// sequence — the frame never changes.

import Skeleton from "./Skeleton";
import { SkeletonToolGrid } from "./PageSkeleton";

export default function StudioSkeleton() {
  return (
    <div className="flex h-full flex-col">
      {/* Back link + breadcrumb */}
      <div className="mb-5 flex shrink-0 items-center gap-2">
        <Skeleton className="h-3 w-16" tone="soft" />
        <Skeleton className="h-3 w-24" tone="soft" />
        <Skeleton className="h-3 w-20" tone="soft" />
      </div>

      {/* Page heading */}
      <div className="mb-6 flex shrink-0 flex-col gap-2">
        <Skeleton className="h-7 w-52 rounded-md" />
        <Skeleton className="h-3 w-64" tone="soft" />
      </div>

      {/* Category cards */}
      <SkeletonToolGrid
        count={9}
        columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      />
    </div>
  );
}
