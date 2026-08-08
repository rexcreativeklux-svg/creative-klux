"use client";

// app/(components)/skeletons/ContentSectionSkeletons.jsx
// ─────────────────────────────────────────────────────────────────────────────
// First-load placeholders for the Publishing / Calendar / Analytics trio that
// /social-content and /ads-content BOTH render.
//
// WHY THESE ARE SHARED. The two sections are the same three pages pointed at a
// different post `type` ("social" vs "ad"). Their labels differ — "Social
// Publishing" vs "Ads Publishing", "No posts on this day" vs "No ads on this
// day" — but a skeleton draws no labels, so the geometry is genuinely identical:
// same eleven-column table, same six-week month grid, same eight KPI tiles.
// Duplicating that per section would be two copies to keep in step for no gain.
// If the pages themselves ever diverge, split this then, not before.
//
// WHY THEY EXIST SEPARATELY FROM loading.jsx. Each section's loading.jsx only
// covers the ROUTE transition — Next unmounts it the moment the client component
// mounts, which is long before any data exists. All six pages then fetch from
// the connected platforms in a mount effect, and that request is the slow part:
// several seconds against Facebook/Instagram/Meta. During that window the pages
// used to render their zero state — "No published posts yet", an empty calendar
// grid, all-zero KPI tiles — which reads as "you have nothing" rather than
// "still loading", and then flips to a full page of data. These skeletons hold
// the page's real geometry for that window instead.
//
// Each one mirrors the page it stands in for closely enough that nothing jumps
// when the data lands: same grid columns, same card chrome, same row heights.
// The one large block that carries each page shimmers; the small bars pulse.

import Skeleton, { SkeletonText } from "./Skeleton";

/* ── Shared pieces ─────────────────────────────────────────────────────────── */

/** Title + supporting line, with however many action buttons the page has. */
function HeaderSkeleton({ actions = 1 }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-56 rounded-md" />
        <Skeleton className="h-3.5 w-72 max-w-full" tone="soft" />
      </div>
      <div className="flex items-center gap-2">
        {Array.from({ length: actions }).map((_, index) => (
          <Skeleton
            key={index}
            className={`h-9 rounded-lg ${index === 0 ? "w-36" : "w-32"}`}
            tone="soft"
          />
        ))}
      </div>
    </div>
  );
}

/**
 * The tab strip and filter bar, which Publishing and Calendar render as one
 * joined card (tabs get the top radius, filters the bottom). Reproduced as a
 * single unit here for the same reason — split into two blocks it reads as two
 * cards with a seam.
 */
function FilterCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-surface shadow-sm">
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200 px-6 py-2.5">
        {[54, 78, 76, 52].map((width, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <Skeleton className="h-3 rounded" w={width} tone="soft" />
            <Skeleton w={20} h={14} className="rounded-full" tone="soft" />
          </div>
        ))}
      </div>

      {/* Platform select + search + result count */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <Skeleton className="h-9 w-36 rounded-lg" tone="soft" />
        <Skeleton className="h-9 min-w-[200px] flex-1 rounded-lg" tone="soft" />
        <Skeleton className="ml-auto h-3 w-16" tone="soft" />
      </div>
    </div>
  );
}

/** A row of the small icon-left summary tiles used by Publishing. */
function SummaryRowSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-surface p-4 shadow-sm"
        >
          <Skeleton w={36} h={36} className="rounded-lg shrink-0" tone="soft" />
          <div className="flex min-w-0 flex-col gap-1.5">
            <Skeleton className="h-4 w-14 rounded-md" />
            <Skeleton className="h-2.5 w-20" tone="soft" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Publishing ────────────────────────────────────────────────────────────── */

/**
 * /social-content/publishing.
 *
 * The table there is eleven columns wide and scrolls sideways, so the skeleton
 * uses the same `overflow-x-auto` + `min-w` pair: on a phone the placeholder
 * rows are as wide as the real ones will be, and the page doesn't reflow the
 * moment posts arrive.
 *
 * @param {object} props
 * @param {number} [props.rows]  Placeholder rows — one page-worth by default.
 */
export function PublishingSkeleton({ rows = 6 }) {
  return (
    <div className="flex flex-col gap-8 pb-5">
      <HeaderSkeleton actions={1} />
      <SummaryRowSkeleton />

      <div className="flex flex-col gap-6">
        <FilterCardSkeleton />

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-surface">
          <div className="overflow-x-auto">
            <div className="min-w-[880px]">
              {/* Header strip */}
              <div className="flex items-center gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-2.5 w-14" />
                <Skeleton className="h-2.5 w-12" />
                {/* The six metric columns are narrow and centred. */}
                <div className="ml-auto flex items-center gap-6 pr-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-2.5 w-10" />
                  ))}
                </div>
              </div>

              {Array.from({ length: rows }).map((_, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 border-b border-gray-100 px-4 py-3 last:border-b-0 ${
                    index % 2 === 0 ? "bg-surface" : "bg-gray-50/50"
                  }`}
                >
                  {/* Creative: thumbnail + title + caption */}
                  <div className="flex w-[220px] shrink-0 items-center gap-3">
                    <Skeleton
                      w={36}
                      h={36}
                      className="rounded-lg"
                      tone="soft"
                      shimmer
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <Skeleton className="h-3 w-4/5" />
                      <Skeleton className="h-2 w-3/5" tone="soft" />
                    </div>
                  </div>
                  {/* Platform + status pills, then the date */}
                  <Skeleton className="h-5 w-24 rounded-full" tone="soft" />
                  <Skeleton className="h-5 w-20 rounded-full" tone="soft" />
                  <Skeleton className="h-3 w-20" tone="soft" />
                  {/* Metrics + the action buttons */}
                  <div className="ml-auto flex items-center gap-6 pr-4">
                    {Array.from({ length: 6 }).map((_, cell) => (
                      <Skeleton key={cell} className="h-3 w-10" tone="soft" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/50 px-4 py-3">
            <Skeleton className="h-3 w-44" tone="soft" />
            <div className="flex items-center gap-1">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton
                  key={index}
                  w={28}
                  h={28}
                  className="rounded-md"
                  tone="soft"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Calendar ──────────────────────────────────────────────────────────────── */

/**
 * /social-content/calendar.
 *
 * `weeks = 6` matters: the real grid renders whole weeks from the Monday before
 * the 1st to the Sunday after the last, which is six rows for most months. Five
 * rows here would let the page grow by ~90px when the data lands.
 *
 * Which cells get pills is fixed rather than random — a skeleton that reshuffles
 * on every render (or differs between server and client) is its own kind of
 * flicker.
 */
export function CalendarSkeleton({ weeks = 6 }) {
  const cells = weeks * 7;
  // Cell index → how many post pills to draw. Sparse and uneven, like a month.
  const pillsAt = { 2: 1, 4: 2, 8: 1, 10: 1, 15: 2, 17: 1, 22: 1, 26: 3, 30: 1, 33: 2 };

  return (
    <div className="flex flex-col gap-6">
      {/* Header — title, legend, New Post */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-52 rounded-md" />
          <Skeleton className="h-3.5 w-48" tone="soft" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-52 max-w-full" tone="soft" />
          <Skeleton className="h-9 w-28 rounded-lg" tone="soft" />
        </div>
      </div>

      {/* Month nav */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Skeleton w={32} h={32} className="rounded-lg shrink-0" tone="soft" />
        <Skeleton className="h-5 w-32 rounded-md" />
        <Skeleton w={32} h={32} className="rounded-lg shrink-0" tone="soft" />
        <Skeleton className="ml-0 h-3 w-10 sm:ml-2" tone="soft" />
      </div>

      <FilterCardSkeleton />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Month grid */}
        <div className="lg:col-span-3">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-surface">
            <div className="grid grid-cols-7 border-b border-gray-100">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="flex justify-center py-2.5">
                  <Skeleton className="h-2.5 w-7" tone="soft" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {Array.from({ length: cells }).map((_, index) => (
                <div
                  key={index}
                  className={`min-h-[90px] border-b border-r border-gray-100 p-1.5 ${
                    index % 7 === 6 ? "border-r-0" : ""
                  }`}
                >
                  {/* Day number sits top-right, as in the real cell. */}
                  <div className="mb-1 flex justify-end">
                    <Skeleton w={24} h={24} className="rounded-full" tone="soft" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {Array.from({ length: pillsAt[index] || 0 }).map((_, pill) => (
                      <Skeleton
                        key={pill}
                        className="h-4 w-full rounded"
                        tone="soft"
                        shimmer
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Day detail panel */}
        <div className="lg:col-span-1">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-surface p-4 py-14">
            <Skeleton w={32} h={32} className="rounded-lg" tone="soft" />
            <Skeleton className="h-3 w-32" tone="soft" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Analytics ─────────────────────────────────────────────────────────────── */

/** One chart panel: heading, plot area, and — optionally — a legend strip. */
function ChartPanelSkeleton({ height = 240, withLegend = true }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-surface p-5">
      <Skeleton className="mb-4 h-4 w-44" />
      <Skeleton
        className="w-full rounded-lg"
        h={height}
        tone="soft"
        shimmer
      />
      {withLegend && (
        <div className="mt-4 flex items-center justify-center gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <Skeleton w={10} h={10} className="rounded-sm" tone="soft" />
              <Skeleton className="h-2.5 w-14" tone="soft" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * /social-content/analytics.
 *
 * Eight KPI tiles, the 14-day line chart, the two half-width charts, then the
 * post table — the page's own order, so the shapes stay put as the numbers
 * arrive. This page has the longest wait of the three: it syncs live posts and
 * then fetches per-post stats one platform call at a time.
 */
export function AnalyticsSkeleton({ rows = 5 }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="mb-2">
        <HeaderSkeleton actions={2} />
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-surface p-5"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-2.5 w-24" tone="soft" />
              <Skeleton w={32} h={32} className="rounded-lg" tone="soft" />
            </div>
            <Skeleton className="h-7 w-24 rounded-md" />
          </div>
        ))}
      </div>

      <ChartPanelSkeleton height={240} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChartPanelSkeleton height={180} withLegend={false} />
        <ChartPanelSkeleton height={180} />
      </div>

      {/* Post Performance table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-surface">
        <div className="border-b border-gray-100 px-5 py-3">
          <Skeleton className="h-3.5 w-36" />
        </div>
        {/* From `md` up the real component is a table; below it, stacked cards.
            Both are a run of rows of the same height, so one shape covers it. */}
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-gray-100 px-4 py-3 last:border-b-0"
          >
            <Skeleton w={32} h={32} className="rounded shrink-0" tone="soft" />
            <Skeleton className="h-3 w-32 max-w-[35%]" />
            <div className="ml-auto hidden items-center gap-6 md:flex">
              {Array.from({ length: 6 }).map((_, cell) => (
                <Skeleton key={cell} className="h-3 w-12" tone="soft" />
              ))}
            </div>
            <SkeletonText
              lines={2}
              lineClassName="h-2.5"
              tone="soft"
              className="ml-auto w-24 md:hidden"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
