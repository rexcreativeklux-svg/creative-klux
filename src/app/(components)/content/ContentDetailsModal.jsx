"use client";

/**
 * ContentDetailsModal — the pop-up a Publishing or Analytics row opens: the
 * post or campaign itself (image, title, full caption, platform, date, link
 * out) and a grid of every metric the backend returned for it.
 *
 * Shared by social + ads, publishing + analytics, so all four open the same
 * card. The caller decides WHICH metrics (social: likes/comments/…; ads:
 * spend/CPC/conversions) and formats them — a value of null/undefined reads
 * "—", meaning not reported, never 0.
 *
 * Keep the last `item` after closing (flip only `isOpen`) so the exit
 * animation still has content to show.
 *
 * @param {object}   props
 * @param {boolean}  props.isOpen
 * @param {() => void} props.onClose
 * @param {object}   props.item          A normalized row (project_title, caption,
 *                                       image_url, permalink_url, stats…).
 * @param {string}   [props.title="Post details"]
 * @param {string}   props.platformLabel e.g. "Facebook"
 * @param {string}   [props.platformIcon] Emoji shown before the label.
 * @param {string}   [props.dateLabel]   e.g. "Published Nov 12, 2026 · 9:45 AM"
 * @param {Array<{icon: React.ElementType, label: string, value: any}>} props.metrics
 * @param {React.ReactNode} [props.badge] Status badge beside the platform.
 * @param {string}   [props.metricsNote] Shown when `metrics` is empty.
 * @param {boolean}  [props.statsLoading] Metrics still on their way — tiles
 *                                       show a shimmer instead of "—".
 */

// Rendered as a right-hand Drawer (full height, slides in from the right edge)
// rather than a centred modal — it's a place to look at a row beside the
// table, the same way a design's details open on the home rail.

import { format } from "date-fns";
import { BarChart3, ExternalLink, X } from "lucide-react";
import Drawer from "@/app/(components)/ui/Drawer";

const display = (v) =>
  v == null || v === "" ? "—" : typeof v === "number" ? v.toLocaleString() : v;

export default function ContentDetailsModal({
  isOpen,
  onClose,
  item,
  title = "Post details",
  platformLabel,
  platformIcon,
  dateLabel,
  metrics = [],
  badge,
  statsLoading = false,
  metricsNote,
}) {
  if (!item) return null;
  const updated = item.stats?.last_updated;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      side="right"
      label={title}
      zIndex={100}
      className="w-120"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4.5 w-4.5 text-blue-600" />
          <h2 className="text-[15px] font-semibold text-gray-900">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {/* The post / campaign */}
        <div className="flex flex-col gap-4">
          {item.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image_url}
              alt=""
              className="max-h-72 w-full rounded-xl border border-gray-200 object-cover"
            />
          )}
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="whitespace-nowrap">
                {platformIcon} {platformLabel}
              </span>
              {badge}
              {dateLabel && (
                <>
                  <span className="h-1 w-1 rounded-full bg-gray-300" />
                  <span>{dateLabel}</span>
                </>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {item.project_title}
            </p>
            {item.caption && item.caption !== item.project_title && (
              <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-gray-600">
                {item.caption}
              </p>
            )}
            {item.permalink_url && (
              <a
                href={item.permalink_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
              >
                View on {platformLabel}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Why there are no stats, in the backend's words (when it said). */}
        {!statsLoading && metrics.length === 0 && metricsNote && (
          <p className="rounded-xl border border-dashed border-gray-200 p-3 text-xs text-gray-500">
            {metricsNote}
          </p>
        )}

        {/* Its stats */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-gray-200 bg-surface p-3"
            >
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
              </div>
              {statsLoading && value == null ? (
                <span className="my-1 block h-5 w-12 animate-pulse rounded bg-gray-200" />
              ) : (
                <p className="text-lg font-bold text-gray-900">{display(value)}</p>
              )}
            </div>
          ))}
        </div>

        {updated && (
          <p className="text-right text-[11px] text-gray-400">
            Stats updated {format(new Date(updated), "MMM d, HH:mm")}
          </p>
        )}
      </div>
    </Drawer>
  );
}
