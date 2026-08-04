"use client";

// /statistics — loading UI.
// Mirrors page.jsx: the 7-across DashboardStats row, then the activity chart
// pinned to the same h-[420px] the page gives it, so the chart doesn't resize
// under the user when the real one arrives.

import Skeleton from "@/app/(components)/skeletons/Skeleton";
import { SkeletonChart } from "@/app/(components)/skeletons/PageSkeleton";

/** DashboardStats renders exactly seven cards — see STAT_CARDS. */
const STAT_CARDS = 7;

export default function Loading() {
  return (
    <div className="space-y-5 bg-page">
      {/* Stat cards — same grid, same card chrome as DashboardStats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {Array.from({ length: STAT_CARDS }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-surface p-4"
          >
            <Skeleton w={36} h={36} className="rounded-xl" tone="soft" />
            <Skeleton className="h-7 w-10 rounded-lg" />
            <Skeleton className="h-2.5 w-16" tone="soft" />
          </div>
        ))}
      </div>

      {/* Activity chart */}
      <div className="h-[420px]">
        <SkeletonChart height={280} className="h-full rounded-2xl" />
      </div>
    </div>
  );
}
