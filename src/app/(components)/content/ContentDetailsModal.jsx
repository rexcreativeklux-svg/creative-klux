"use client";

/**
 * ContentDetailsModal — the panel a Publishing or Analytics row opens, laid out
 * like a network's own post-insights page: a header naming the post, its
 * insights in cards on the left, and a Feed preview of the post on the right.
 *
 * Two ways to fill the left side:
 *   · `insights` (social posts — see postInsights.js): an Overview row, a Views
 *     card compared with the account's recent posts, and an Interactions card.
 *   · `metrics` (ads campaigns): one Overview card of whatever the caller
 *     passes, already formatted.
 * Either way a value of null/undefined reads "--", meaning not reported, never 0.
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
 * @param {string}   [props.dateLabel]   e.g. "Published on: Nov 10, 10:29"
 * @param {ReturnType<import("./postInsights").buildPostInsights>} [props.insights]
 * @param {Array<{icon?: React.ElementType, label: string, value: any}>} [props.metrics]
 * @param {React.ReactNode} [props.badge] Status badge beside the date.
 * @param {React.ReactNode} [props.preview] The Feed preview card. Without one,
 *                                       the item's image and caption stand in.
 * @param {string}   [props.metricsNote] Shown when there are no metrics.
 * @param {boolean}  [props.statsLoading] Metrics still on their way — values
 *                                       show a shimmer instead of "--".
 */

// Rendered as a right-hand Drawer (full height, slides in from the right edge)
// rather than a centred modal — it's a place to look at a row beside the
// table, the same way a design's details open on the home rail.

import { useState } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  ExternalLink,
  ImageIcon,
  Info,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Drawer from "@/app/(components)/ui/Drawer";

const BRAND = "#003dda";
const POST_BAR = "#5aa7f5";
const TYPICAL_BAR = "#c4c9d2";

const display = (v) =>
  v == null || v === "" ? "--" : typeof v === "number" ? v.toLocaleString() : v;

const Card = ({ children, className = "" }) => (
  <section className={`rounded-xl border border-gray-200 bg-surface p-5 shadow-sm ${className}`}>
    {children}
  </section>
);

/** A metric's name with the network's ⓘ — hovering it names the backend field. */
function Label({ children, hint }) {
  return (
    <p className="mb-1 flex items-center gap-1 truncate text-xs font-medium text-gray-600">
      {children}
      <span title={hint} className="shrink-0">
        <Info className="h-3 w-3 fill-gray-700 text-white" aria-hidden="true" />
      </span>
    </p>
  );
}

/** A big figure, or a shimmer while it's still on its way. */
function Figure({ value, loading, size = "text-2xl" }) {
  if (loading && value == null)
    return <span className="my-1.5 block h-6 w-14 animate-pulse rounded bg-gray-200" />;
  return <p className={`${size} font-normal tabular-nums text-gray-900`}>{display(value)}</p>;
}

/** "This post received more views compared to your recent Facebook posts." */
function Verdict({ verdict, what, platformLabel }) {
  if (!verdict) return null;
  const Icon = verdict === "fewer" ? TrendingDown : TrendingUp;
  return (
    <p className="mb-4 flex items-center gap-2 text-xs text-gray-600">
      <Icon className="h-4 w-4 shrink-0" style={{ color: verdict === "fewer" ? "#d97706" : "#16a34a" }} />
      <span>
        This post received{" "}
        <strong className="font-semibold text-gray-900">
          {verdict === "about the same" ? `about as many ${what}` : `${verdict} ${what}`}
        </strong>{" "}
        {verdict === "about the same" ? "as" : "compared to"} your recent {platformLabel} posts.
      </span>
    </p>
  );
}

/** A tick ceiling that reads cleanly: 395 → 400, 1 840 → 2 000. */
function niceMax(n) {
  if (!n || n <= 0) return 4;
  const mag = 10 ** Math.floor(Math.log10(n));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * mag >= n / 4) * mag;
  return Math.ceil(n / step) * step;
}

/**
 * This post's total next to the account's typical post, on one scale. Totals
 * only — the backend doesn't record how a post's views grew over time.
 */
function ComparisonChart({ value, typical, label }) {
  const max = niceMax(Math.max(value ?? 0, typical ?? 0));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  const bars = [
    { name: `This post's ${label.toLowerCase()}`, v: value, color: POST_BAR },
    ...(typical !== undefined
      ? [{ name: `Your typical post ${label.toLowerCase()}`, v: typical, color: TYPICAL_BAR }]
      : []),
  ];
  return (
    <div className="mt-4">
      <div className="relative ml-10 h-40">
        {/* Grid lines, top = max */}
        {ticks.map((t) => (
          <div
            key={t}
            className="absolute inset-x-0 border-t border-gray-200"
            style={{ bottom: `${(t / max) * 100}%` }}
          >
            <span className="absolute -left-10 -translate-y-1/2 w-8 text-right text-[11px] text-gray-500">
              {t.toLocaleString()}
            </span>
          </div>
        ))}
        {/* Bars */}
        <div className="absolute inset-0 flex justify-around px-6">
          {bars.map((b) => {
            const pct = ((b.v ?? 0) / max) * 100;
            return (
              <div key={b.name} className="relative h-full w-16">
                <span
                  className="absolute inset-x-0 text-center text-[11px] font-medium text-gray-600"
                  style={{ bottom: `calc(${pct}% + 4px)` }}
                >
                  {b.v === undefined ? "--" : Math.round(b.v).toLocaleString()}
                </span>
                <div
                  className="absolute inset-x-0 bottom-0 rounded-t-md transition-[height] duration-500"
                  style={{ height: `${pct}%`, backgroundColor: b.color }}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[11px] text-gray-600">
        {bars.map((b) => (
          <span key={b.name} className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 rounded" style={{ backgroundColor: b.color }} />
            {b.name}
          </span>
        ))}
      </div>
    </div>
  );
}

const VIEW_TABS = ["Total", "Audience", "Age & gender", "Top countries"];

function ViewsCard({ views, platformLabel, loading }) {
  const [tab, setTab] = useState("Total");
  return (
    <Card>
      <Verdict verdict={views.verdict} what={views.label.toLowerCase()} platformLabel={platformLabel} />
      <Label>{views.label}</Label>
      <Figure value={views.value} loading={loading} />
      <div className="mt-3 flex flex-wrap gap-1">
        {VIEW_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              tab === t ? "bg-blue-50 text-[#003dda]" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Total" ? (
        loading && views.value == null ? (
          <div className="mt-4 h-48 animate-pulse rounded-lg bg-gray-100" />
        ) : (
          <ComparisonChart value={views.value} typical={views.typical} label={views.label} />
        )
      ) : (
        <div className="mt-4 flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 px-6 text-center">
          <p className="text-sm font-medium text-gray-700">No {tab.toLowerCase()} breakdown yet</p>
          <p className="mt-1 text-xs text-gray-500">
            {platformLabel} hasn&apos;t sent a {tab.toLowerCase()} breakdown for this post.
          </p>
        </div>
      )}
    </Card>
  );
}

function InteractionsCard({ interactions, platformLabel, loading }) {
  return (
    <Card>
      <Verdict verdict={interactions.verdict} what="interactions" platformLabel={platformLabel} />
      <Label hint="Sum of the interaction metrics below">Interactions</Label>
      <Figure value={interactions.total} loading={loading} />
      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        {interactions.items.map((m) => (
          <div key={m.label} className="min-w-0">
            <Label hint={m.hint}>{m.label}</Label>
            <Figure value={m.value} loading={loading} size="text-xl" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/** A heading and a wrapping row of figures — the Overview card. */
function OverviewCard({ metrics, loading }) {
  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-gray-900">Overview</h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 xl:grid-cols-5">
        {metrics.map(({ icon: Icon, label, value, hint }) => (
          <div key={label} className="min-w-0">
            <Label hint={hint}>
              {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
              {label}
            </Label>
            <Figure value={value} loading={loading} />
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function ContentDetailsModal({
  isOpen,
  onClose,
  item,
  title = "Post details",
  platformLabel,
  platformIcon,
  dateLabel,
  insights,
  metrics = [],
  badge,
  preview,
  statsLoading = false,
  metricsNote,
}) {
  if (!item) return null;
  const updated = item.stats?.last_updated;
  const heading = item.caption || item.project_title || title;
  const overview = insights?.overview ?? metrics;
  const empty = overview.length === 0 && !insights?.views && !insights?.interactions;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      side="right"
      label={title}
      zIndex={100}
      className="w-[min(72rem,100vw)]"
    >
      {/* Header — back, the post, and its link out. */}
      <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-surface px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 cursor-pointer rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt=""
            className="h-10 w-10 shrink-0 rounded-md border border-gray-200 object-cover"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-100 text-gray-300">
            <ImageIcon className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{heading}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-gray-500">
            <span className="whitespace-nowrap">
              {platformIcon} {title === "Post details" ? "Post" : platformLabel}
            </span>
            {dateLabel && (
              <>
                <span>·</span>
                <span className="whitespace-nowrap">{dateLabel}</span>
              </>
            )}
            {badge}
          </div>
        </div>
        {item.permalink_url && (
          <a
            href={item.permalink_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 sm:inline-flex"
            style={{ backgroundColor: BRAND }}
          >
            View on {platformLabel}
          </a>
        )}
      </div>

      {/* Body — soft wash behind white cards, as on the network's page. */}
      <div className="relative flex-1 overflow-y-auto bg-gray-50">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-br from-rose-100/50 via-transparent to-sky-100/60"
        />
        <div className="relative grid items-start gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
          {/* Insights */}
          <div className="space-y-4">
            {empty && !statsLoading ? (
              <Card>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">Overview</h3>
                <p className="text-xs text-gray-500">
                  {metricsNote || `${platformLabel} hasn't sent metrics for this yet.`}
                </p>
              </Card>
            ) : (
              <OverviewCard
                metrics={
                  overview.length
                    ? overview
                    : // Nothing named yet: one figure that shimmers while stats load.
                      [{ label: "Metrics", value: undefined }]
                }
                loading={statsLoading}
              />
            )}
            {insights?.views && (
              <ViewsCard views={insights.views} platformLabel={platformLabel} loading={statsLoading} />
            )}
            {insights?.interactions && (
              <InteractionsCard
                interactions={insights.interactions}
                platformLabel={platformLabel}
                loading={statsLoading}
              />
            )}
            {updated && (
              <p className="text-right text-[11px] text-gray-400">
                Stats updated {format(new Date(updated), "MMM d, HH:mm")}
              </p>
            )}
          </div>

          {/* Feed preview */}
          <Card className="p-4! lg:sticky lg:top-0">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Feed preview</h3>
            {preview ?? (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                {item.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image_url} alt="" className="max-h-80 w-full object-cover" />
                )}
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-900">{item.project_title}</p>
                  {item.caption && item.caption !== item.project_title && (
                    <p className="mt-1.5 line-clamp-3 whitespace-pre-line text-[13px] leading-relaxed text-gray-600">
                      {item.caption}
                    </p>
                  )}
                </div>
              </div>
            )}
            {item.permalink_url && (
              <a
                href={item.permalink_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-1.5 rounded-md border border-gray-200 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Post on {platformLabel}
              </a>
            )}
          </Card>
        </div>
      </div>
    </Drawer>
  );
}
