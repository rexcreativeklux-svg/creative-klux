"use client";

// app/(components)/integrations/IntegrationsSkeleton.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Placeholder rows for the Integrations page, sized to PlatformCard: a 44px
// icon tile, the name + status pill on one line with the description beneath,
// and the Connect/Disconnect button on the right.
//
// Shared by two callers on purpose — the route's loading.jsx and the page's own
// `fetching` state — so the route transition and the integrations request draw
// the SAME rows and the list never resizes between them.

import Skeleton from "@/app/(components)/skeletons/Skeleton";

/** SOCIAL_PLATFORMS and AD_PLATFORMS, roughly, so both sections fill out. */
const DEFAULT_SECTIONS = [
  { rows: 5 },
  { rows: 4 },
];

/** One platform row. */
function PlatformCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-surface">
      <div className="flex items-center gap-4 px-5 py-4">
        <Skeleton w={44} h={44} className="rounded-xl" tone="soft" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-24 rounded-full" tone="soft" />
          </div>
          <Skeleton className="h-2.5 w-64 max-w-full" tone="soft" />
        </div>
        <Skeleton className="h-8 w-24 shrink-0 rounded-lg" tone="soft" />
      </div>
    </div>
  );
}

/**
 * @param {object} props
 * @param {{rows: number}[]} [props.sections]  One entry per platform section.
 * @param {boolean} [props.withHeadings]       Draw a heading above each section.
 */
export default function IntegrationsSkeleton({
  sections = DEFAULT_SECTIONS,
  withHeadings = true,
}) {
  return (
    <>
      {sections.map(({ rows }, sectionIndex) => (
        <div key={sectionIndex} className="mb-8">
          {withHeadings && <Skeleton className="mb-3 h-3.5 w-40" />}
          <div className="flex flex-col gap-3">
            {Array.from({ length: rows }).map((_, index) => (
              <PlatformCardSkeleton key={index} />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
