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
 * @param {boolean}  [props.statsLoading] Metrics still on their way — tiles
 *                                       show a shimmer instead of "—".
 */

import { format } from "date-fns";
import { BarChart3, ExternalLink } from "lucide-react";
import ResponsiveModal from "@/app/(components)/ui/ResponsiveModal";

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
}) {
  if (!item) return null;
  const updated = item.stats?.last_updated;

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={BarChart3}
      size="2xl"
    >
      <div className="space-y-5">
        {/* The post / campaign */}
        <div className="flex flex-col gap-4 sm:flex-row">
          {item.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.image_url}
              alt=""
              className="h-40 w-full shrink-0 rounded-xl border border-gray-200 object-cover sm:h-36 sm:w-36"
            />
          )}
          <div className="min-w-0 flex-1">
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
              <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-line text-[13px] leading-relaxed text-gray-600">
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

        {/* Its stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
    </ResponsiveModal>
  );
}
