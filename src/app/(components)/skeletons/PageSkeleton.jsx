"use client";

// app/(components)/skeletons/PageSkeleton.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The body shapes inner pages are assembled from, plus a neutral default for
// routes that don't warrant a bespoke one.
//
// A skeleton is only worth having if it predicts the layout that replaces it, so
// each block here is deliberately generic in CONTENT and specific in GEOMETRY —
// a card grid really is `sm:2 / lg:3 / xl:4` because that's the grid the app
// uses, a table row really is a 5-column line. Reach for these first; only write
// a bespoke skeleton when a page's shape genuinely isn't one of them.
//
// All of these are CONTENT ONLY — they render inside the already-mounted sidebar
// and header. For the pre-auth, no-chrome case use AppShellSkeleton instead.

import Skeleton, { SkeletonPageHeader, SkeletonText } from "./Skeleton";

/**
 * A responsive grid of media/design cards — the shape behind Designs, Creatives,
 * Gallery, Brand Kits and the template pickers.
 *
 * @param {object} props
 * @param {number} [props.count]        How many cards.
 * @param {string} [props.aspect]       Tailwind aspect class for the artwork.
 * @param {boolean} [props.withFooter]  Draw the title/meta lines under the tile.
 * @param {string} [props.columns]      Grid-column classes, when a page differs.
 * @param {string} [props.gap]          Grid gap class. Kept separate from
 *   `columns` because two gap utilities in one string are resolved by Tailwind's
 *   emit order, not by the order they were written in.
 */
export function SkeletonCardGrid({
  count = 8,
  aspect = "aspect-4/3",
  withFooter = true,
  columns = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  gap = "gap-4",
}) {
  return (
    <div className={`grid ${gap} ${columns}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-gray-200 bg-surface"
        >
          <Skeleton className={`w-full rounded-none ${aspect}`} tone="soft" />
          {withFooter && (
            <div className="flex flex-col gap-2 p-3">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-2.5 w-1/3" tone="soft" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * A row of summary tiles — the metric strip at the top of the analytics and
 * statistics pages.
 *
 * @param {object} props
 * @param {number} [props.count]
 * @param {string} [props.columns]
 */
export function SkeletonStatRow({
  count = 4,
  columns = "grid-cols-2 lg:grid-cols-4",
}) {
  return (
    <div className={`grid gap-4 ${columns}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-surface p-4"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" tone="soft" />
            <Skeleton w={28} h={28} className="rounded-lg" tone="soft" />
          </div>
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-2.5 w-28" tone="soft" />
        </div>
      ))}
    </div>
  );
}

/**
 * A chart panel — title, then a plot area faked with a bar silhouette so the
 * block reads as a chart rather than an empty card.
 *
 * @param {object} props
 * @param {number} [props.height]     Plot height in px.
 * @param {string} [props.className]
 */
export function SkeletonChart({ height = 240, className = "" }) {
  // Fixed, uneven heights: a flat row of equal bars reads as a broken chart.
  const bars = [52, 74, 41, 88, 63, 96, 58, 79, 46, 84, 69, 55];

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-surface p-5 ${className}`}
    >
      <div className="mb-6 flex flex-col gap-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-2.5 w-52" tone="soft" />
      </div>

      <div className="flex items-end gap-2" style={{ height }}>
        {bars.map((value, index) => (
          <Skeleton
            key={index}
            tone="soft"
            className="flex-1 rounded-t-md"
            style={{ height: `${value}%` }}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        {bars.map((_, index) => (
          <Skeleton key={index} h={8} w={22} tone="soft" />
        ))}
      </div>
    </div>
  );
}

/**
 * A data table — a header strip and evenly-spaced rows.
 *
 * @param {object} props
 * @param {number} [props.rows]
 * @param {number} [props.columns]
 * @param {boolean} [props.withAvatar]  Lead each row with a round avatar.
 */
export function SkeletonTable({ rows = 6, columns = 5, withAvatar = false }) {
  const template = `${withAvatar ? "auto " : ""}repeat(${columns}, minmax(0, 1fr))`;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-surface">
      {/* Header strip */}
      <div
        className="grid items-center gap-4 border-b border-gray-200 bg-gray-100 px-4 py-3"
        style={{ gridTemplateColumns: template }}
      >
        {withAvatar && <span className="w-8" />}
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-2.5 w-20" />
        ))}
      </div>

      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid items-center gap-4 border-b border-gray-200 px-4 py-3.5 last:border-b-0"
          style={{ gridTemplateColumns: template }}
        >
          {withAvatar && <Skeleton w={32} h={32} className="rounded-full" />}
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={`h-3 ${colIndex === 0 ? "w-4/5" : "w-2/3"}`}
              tone={colIndex === 0 ? "base" : "soft"}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * A stack of list rows — icon, two lines of text, trailing control. Used by the
 * settings pages, integrations, sessions, team invites and the help index.
 *
 * @param {object} props
 * @param {number} [props.rows]
 * @param {boolean} [props.withAction]
 */
export function SkeletonList({ rows = 5, withAction = true }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-surface p-4"
        >
          <Skeleton w={40} h={40} className="rounded-xl" tone="soft" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-2.5 w-64 max-w-full" tone="soft" />
          </div>
          {withAction && <Skeleton className="h-8 w-20 rounded-lg" tone="soft" />}
        </div>
      ))}
    </div>
  );
}

/**
 * A form panel — labelled fields and a submit row.
 *
 * @param {object} props
 * @param {number} [props.fields]
 * @param {string} [props.className]
 */
export function SkeletonForm({ fields = 5, className = "" }) {
  return (
    <div
      className={`flex flex-col gap-5 rounded-xl border border-gray-200 bg-surface p-6 ${className}`}
    >
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="h-2.5 w-28" tone="soft" />
          <Skeleton className="h-10 w-full rounded-lg" tone="soft" />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-1">
        <Skeleton className="h-10 w-24 rounded-lg" tone="soft" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * A filter/toolbar strip — search field on the left, controls on the right.
 *
 * @param {object} props
 * @param {number} [props.controls]
 */
export function SkeletonToolbar({ controls = 3 }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Skeleton className="h-10 w-full max-w-xs rounded-lg" tone="soft" />
      <div className="flex items-center gap-2">
        {Array.from({ length: controls }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-24 rounded-lg" tone="soft" />
        ))}
      </div>
    </div>
  );
}

/**
 * A grid of tool tiles — icon square, label, blurb — as used by the Product
 * Studio and Magic Studio pickers.
 *
 * @param {object} props
 * @param {number} [props.count]
 * @param {string} [props.columns]
 * @param {boolean} [props.withBlurb]  Second, smaller line under the label.
 */
export function SkeletonToolGrid({
  count = 10,
  columns = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  withBlurb = true,
}) {
  return (
    <div className={`grid gap-2.5 ${columns}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-surface px-3.5 py-3"
        >
          <Skeleton w={36} h={36} className="rounded-lg" tone="soft" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-3/5" />
            {withBlurb && <Skeleton className="h-2 w-4/5" tone="soft" />}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * A row of pill tabs, as used above most inner-page content.
 *
 * @param {object} props
 * @param {number} [props.count]
 */
export function SkeletonTabs({ count = 4 }) {
  const widths = [86, 104, 78, 96, 112, 84];

  return (
    <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          h={32}
          w={widths[index % widths.length]}
          className="rounded-lg"
          tone="soft"
        />
      ))}
    </div>
  );
}

/**
 * The shape shared by the three SECTION routes — /ad-intelligence,
 * /social-content, /ads-content — and their sub-pages. They all open with a
 * heading and a refresh control, a row of metric tiles, then two analysis
 * panels side by side.
 *
 * Their loading.jsx sits inside the section's own layout, so the secondary
 * sidebar is already drawn and only this content column is missing.
 *
 * @param {object} props
 * @param {number} [props.stats]   Metric tiles in the row.
 * @param {number} [props.panels]  Panels below it.
 */
export function SectionPageSkeleton({ stats = 4, panels = 2 }) {
  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Heading + action */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-3 w-72 max-w-full" tone="soft" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" tone="soft" />
      </div>

      <SkeletonStatRow count={stats} columns="grid-cols-2 md:grid-cols-4" />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {Array.from({ length: panels }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-surface p-5"
          >
            <Skeleton className="h-4 w-40" />
            <SkeletonText lines={4} tone="soft" />
            <Skeleton className="h-32 w-full rounded-lg" tone="soft" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The neutral default: a page heading, a toolbar and a card grid. Used by the
 * (pages) group's loading.jsx, which covers every route that hasn't been given
 * a skeleton of its own yet.
 */
export default function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-10">
      <SkeletonPageHeader withActions />
      <SkeletonToolbar />
      <SkeletonCardGrid count={8} />
      <SkeletonText lines={2} className="max-w-md" tone="soft" />
    </div>
  );
}
