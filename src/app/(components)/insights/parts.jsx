"use client";

// app/(components)/insights/parts.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The building blocks the network insights pages share — social
// (NetworkInsightsPage) and ads (AdsInsightsPage) — so both read as one
// product, after the "Creative Klux Analytics" design.

import { Lock } from "lucide-react";

export const BRAND = "#003dda";
export const SERIES = ["#003dda", "#13a0a0", "#d9497a", "#8257e6", "#c2820a"];

export const num = (v, digits = 0) =>
  v === undefined || v === null
    ? "—"
    : Number(v).toLocaleString(undefined, {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits ? Math.min(digits, 1) : 0,
      });

/** Money as the network reports it — two decimals, no symbol (the backend doesn't say which currency). */
export const money = (v) =>
  v === undefined || v === null
    ? "—"
    : Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const shortDate = (ms) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
export const longDate = (ms) =>
  new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function ago(ms) {
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}

export function Card({ title, sub, action, children, className = "", bodyClass = "" }) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-gray-200 bg-surface shadow-[0_1px_2px_rgba(18,24,38,.04),0_10px_26px_-22px_rgba(18,24,38,.26)] ${className}`}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3.5">
          <div>
            <h3 className="text-[15px] font-semibold text-gray-900">{title}</h3>
            {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

/** A section the backend can't fill yet — kept in place, saying why. */
export function NotAvailable({ children, compact = false }) {
  return (
    <div
      className={`flex items-start gap-2.5 text-xs text-gray-500 ${
        compact ? "" : "rounded-lg border border-dashed border-gray-200 bg-gray-50/60 px-4 py-6"
      }`}
    >
      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
      <span>{children}</span>
    </div>
  );
}

/** A tiny line over the period, by day. */
export function Sparkline({ values, color = BRAND }) {
  const w = 84;
  const h = 30;
  const max = Math.max(...(values || []), 0);
  if (!max) return <span className="h-7.5 w-21" />;
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const pts = values
    .map((v, i) => `${(i * step).toFixed(1)},${(h - 2 - (v / max) * (h - 4)).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/**
 * A headline number. `card`:
 *   { label, value, format: "count"|"pct"|"money"|"ratio", rate?, delta?,
 *     deltaKind: "%"|"pts", lowerIsBetter?, series?, hint?, available, reason? }
 */
export function KpiCard({ card, loading }) {
  if (!card.available)
    return (
      <div className="rounded-xl border border-gray-200 bg-surface p-4">
        <p className="text-[13px] font-medium text-gray-600">{card.label}</p>
        <p className="mt-1 text-[26px] font-bold leading-tight text-gray-300">—</p>
        <NotAvailable compact>{card.reason}</NotAvailable>
      </div>
    );
  const format = card.format || (card.rate ? "pct" : "count");
  const shown =
    card.value === undefined
      ? "—"
      : format === "pct"
        ? `${card.value.toFixed(2)}%`
        : format === "money"
          ? money(card.value)
          : format === "ratio"
            ? card.value.toFixed(2)
            : num(card.value);
  const better = card.delta !== undefined && (card.lowerIsBetter ? card.delta <= 0 : card.delta >= 0);
  return (
    <div className="rounded-xl border border-gray-200 bg-surface p-4 shadow-[0_1px_2px_rgba(18,24,38,.04)]" title={card.hint || undefined}>
      <p className="text-[13px] font-medium text-gray-600">{card.label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        {loading && card.value === undefined ? (
          <span className="my-1.5 block h-7 w-24 animate-pulse rounded bg-gray-200" />
        ) : (
          <p className="text-[26px] font-bold leading-tight tracking-tight text-gray-900">{shown}</p>
        )}
        {card.series && <Sparkline values={card.series} />}
      </div>
      <p
        className={`mt-0.5 text-xs font-semibold ${
          card.delta === undefined ? "text-gray-400" : better ? "text-emerald-700" : "text-red-600"
        }`}
      >
        {card.delta === undefined
          ? card.noDelta || "no posts to compare"
          : `${card.delta >= 0 ? "+" : "−"}${Math.abs(card.delta).toFixed(card.deltaKind === "pts" ? 1 : 0)}${card.deltaKind === "pts" ? " pts" : "%"}`}
      </p>
    </div>
  );
}

/** Placeholder cards while the numbers are on their way. */
export const KpiPlaceholder = () => (
  <div className="rounded-xl border border-gray-200 bg-surface p-4">
    <span className="block h-3.5 w-20 animate-pulse rounded bg-gray-200" />
    <span className="mt-3 block h-7 w-28 animate-pulse rounded bg-gray-200" />
    <span className="mt-2 block h-3 w-12 animate-pulse rounded bg-gray-100" />
  </div>
);

/** A labelled group of bars, best first — one row of "What works". */
export function BarRows({ rows, format }) {
  const max = rows[0]?.value || 1;
  return (
    <div className="space-y-1.5">
      {rows.map((r, i) => (
        <div key={r.label} className="grid grid-cols-[7rem_minmax(0,1fr)_4.5rem] items-center gap-3 text-xs">
          <span className="truncate text-gray-700" title={`${r.label} · ${r.count} item${r.count === 1 ? "" : "s"}`}>
            {r.label}
          </span>
          <span className="h-2 overflow-hidden rounded-full bg-gray-100">
            <span
              className="block h-full rounded-full"
              style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, background: SERIES[i % SERIES.length] }}
            />
          </span>
          <span className="text-right font-semibold tabular-nums text-gray-900">{format(r.value)}</span>
        </div>
      ))}
    </div>
  );
}
