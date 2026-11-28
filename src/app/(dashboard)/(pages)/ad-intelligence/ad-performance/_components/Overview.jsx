"use client";

/**
 * Ad Performance — the top of the page: header (period + refresh), connected
 * accounts, the dark summary panel and the eight KPI cards.
 */

import Link from "next/link";
import { ChartLine, RefreshCw, TriangleAlert, Loader2 } from "lucide-react";
import { AD_NETWORKS } from "@/app/(components)/content/socialPlatformScope";
import { Delta, Spark, dash, num, btn } from "./ui";

export const PERIODS = [7, 30, 90];

/* ─── trend series ────────────────────────────────────────────── */

/**
 * `trendData` as [{ date, spend, results }] with numbers. Tolerant of the key
 * names (spend / spendRaw, results / conversions) and of display strings, since
 * the live account has had no delivery to show the real row shape yet.
 */
export function trendSeries(trendData) {
  return (trendData ?? [])
    .map((d) => ({
      date: d.date,
      spend: num(d.spendRaw ?? d.spend) ?? 0,
      results: num(d.resultsRaw ?? d.results ?? d.conversions) ?? 0,
    }))
    .filter((d) => d.date);
}

/* ─── header ──────────────────────────────────────────────────── */

export function Header({ brand, periodDays, generatedAt, days, onDays, onRefresh, loading }) {
  const updated = generatedAt
    ? new Date(generatedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="flex flex-wrap gap-3.5 items-center justify-between">
      <div className="flex gap-3.5 items-center">
        <div className="w-11.5 h-11.5 rounded-[14px] bg-[#1447e6] text-white flex items-center justify-center shrink-0">
          <ChartLine className="w-5.5 h-5.5" strokeWidth={2} />
        </div>
        <div>
          <h1 className="m-0 text-[25px] font-extrabold tracking-[-0.02em] text-gray-900">
            Ad Performance
          </h1>
          <div className="text-[13.5px] text-gray-500 mt-0.5">
            {brand ?? "Your brand"} · last {periodDays ?? days} days
            {updated && <> · updated {updated}</>}
          </div>
        </div>
      </div>

      <div className="flex gap-2.5 flex-wrap items-center">
        <div
          role="group"
          aria-label="Period"
          className="flex bg-surface border border-gray-200 rounded-[11px] p-0.75"
        >
          {PERIODS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDays(d)}
              disabled={loading}
              aria-pressed={d === days}
              className={`h-9 px-3.5 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed ${
                d === days ? "bg-[#1447e6] text-white" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {d} days
            </button>
          ))}
        </div>
        <button type="button" onClick={onRefresh} disabled={loading} className={btn}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" strokeWidth={2} />
          )}
          Refresh
        </button>
      </div>
    </div>
  );
}

/* ─── connected accounts ──────────────────────────────────────── */

export function Accounts({ adAccounts = [], accounts = [], accountErrors = [] }) {
  // Connected integrations with no ad-account detail row get a plain chip.
  const detailed = new Set(adAccounts.map((a) => a.platform));
  const others = accounts.filter((a) => !detailed.has(a.label));
  const connectedIds = new Set(accounts.map((a) => a.platform));
  const nextToConnect = AD_NETWORKS.find((n) => !connectedIds.has(n.id));
  const chip =
    "flex gap-2 items-center bg-surface border border-gray-200 rounded-[11px] px-3 py-2 text-[12.5px]";

  return (
    <div className="flex flex-wrap gap-2">
      {adAccounts.map((a) => {
        const ok = a.isActive !== false && !a.spendCapReached;
        return (
          <div key={a.id ?? a.name} className={chip}>
            <span
              className={`w-2 h-2 rounded-full ${ok ? "bg-[#16a34a]" : "bg-[#dc2626]"}`}
            />
            <b className="text-gray-900">{a.platform}</b>
            <span className="text-gray-500">
              {a.name} · {a.status} · Payment: {a.paymentMethod || "none"} · {a.currency}
              {a.spendCapReached && (
                <span className="text-[#b91c1c] font-semibold"> · Spend limit reached</span>
              )}
            </span>
          </div>
        );
      })}
      {/* The API sends only a name and platform for these — so all the chip
          can truthfully say is that the account is connected. */}
      {others.map((a) => (
        <div key={a.platform} className={chip}>
          <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
          <b className="text-gray-900">{a.label}</b>
          <span className="text-gray-500">Connected</span>
        </div>
      ))}
      {accountErrors.map((e, i) => (
        <div key={`err-${i}`} className={`${chip} border-[#fbd5d5]`}>
          <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
          <span className="text-[#b91c1c]">
            {typeof e === "string" ? e : (e.message ?? e.error ?? "An account could not be read")}
          </span>
        </div>
      ))}
      {nextToConnect && (
        <Link
          href="/integrations"
          className={`${chip} border-dashed font-semibold text-[#1447e6] hover:bg-[#eef3ff]`}
        >
          + Connect {nextToConnect.label}
        </Link>
      )}
    </div>
  );
}

/* ─── summary panel ───────────────────────────────────────────── */

const scoreColor = (s) =>
  s >= 65 ? "#22c55e" : s >= 50 ? "#3b82f6" : s >= 30 ? "#f59e0b" : "#ef4444";

export function Brief({ ciScore, ciLevel, ciSummary, health, actionPlan = [] }) {
  const s = Math.max(0, Math.min(100, ciScore ?? 0));
  const col = scoreColor(s);
  // "Now" items first, then the rest, top three.
  const first = [
    ...actionPlan.filter((p) => p.priority === "Now"),
    ...actionPlan.filter((p) => p.priority !== "Now"),
  ].slice(0, 3);

  return (
    <section
      aria-label="Summary"
      className="grid grid-cols-1 min-[1100px]:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] bg-[#0b1430] text-white rounded-[22px] overflow-hidden"
    >
      <div className="px-7 py-6.5 flex flex-col sm:flex-row gap-5.5 items-start bg-linear-to-b from-[#0e1a40] to-[#0b1430]">
        <div
          className="w-32 h-32 shrink-0 rounded-full flex items-center justify-center"
          style={{
            background: `conic-gradient(${col} 0 ${s}%, rgba(255,255,255,.1) ${s}% 100%)`,
          }}
        >
          <div className="w-25 h-25 rounded-full bg-[#0b1430] flex flex-col items-center justify-center">
            <b className="text-[34px] font-extrabold leading-none">{ciScore ?? "—"}</b>
            <small className="text-[11px] text-[#a5b4d8] mt-1">out of 100</small>
          </div>
        </div>
        <div className="min-w-0">
          {ciLevel && (
            <span
              className="inline-block text-[11.5px] font-extrabold tracking-[0.06em] rounded-full px-2.5 py-1 text-[#231400]"
              style={{ background: col }}
            >
              {ciLevel}
            </span>
          )}
          <p className="mt-2.5 mb-0 text-[14px] leading-[1.6] text-[#dbe3f7]">{ciSummary}</p>
          {health && (health.critical > 0 || health.warnings > 0) && (
            <div className="flex gap-2 items-center text-[13px] text-[#fecaca] mt-3.5">
              <TriangleAlert className="w-4 h-4 shrink-0" strokeWidth={2} />
              <span>
                {health.critical} critical · {health.warnings} warnings ·{" "}
                <a href="#health" className="text-white font-bold underline">
                  See account health
                </a>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-5.5 bg-[#111d45] flex flex-col gap-2.5">
        <h3 className="m-0 mb-0.5 text-[13px] text-[#a5b4d8] font-semibold tracking-[0.04em] uppercase">
          Do these first
        </h3>
        {first.length === 0 ? (
          <p className="m-0 text-[13px] text-[#b9c4e2]">Nothing urgent right now.</p>
        ) : (
          first.map((p, i) => (
            <div
              key={i}
              className="flex gap-3 items-start bg-white/6 border border-white/8 rounded-[14px] px-3.5 py-3"
            >
              <span className="w-6.5 h-6.5 shrink-0 rounded-lg bg-[#1447e6] flex items-center justify-center font-extrabold text-[13px]">
                {i + 1}
              </span>
              <div className="min-w-0">
                <b className="text-[14px]">{p.step}</b>
                <div className="text-[12.5px] text-[#b9c4e2] mt-0.5">{p.why}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

/* ─── KPI cards ───────────────────────────────────────────────── */

export function Kpis({ data }) {
  // Sparklines only for series the API actually sends per day (spend and
  // conversions in `trendData`) — nothing is computed here.
  const t = trendSeries(data.trendData);
  const spendS = t.map((d) => d.spend);
  const resS = t.map((d) => d.results);

  // [label, value, key into `changes`, key into `dataQuality`, sparkline]
  // "Conversions", not the design's "Purchases": the API counts purchases,
  // sign-ups, conversations and app installs together (dataQuality.conversions).
  const list = [
    ["Spend", data.spend, "spend", "spend", spendS],
    ["Conversions", data.conversions, "conversions", "conversions", resS],
    ["Cost per conversion", data.costPerConversion, "costPerConversion", "costPerConversion", null],
    ["ROAS", data.avgROAS, "roas", "avgROAS", null],
    ["Link CTR", data.avgCTR, "ctr", "avgCTR", null],
    ["CPC", data.avgCPC, "cpc", "avgCPC", null],
    ["CPM", data.avgCPM, "cpm", "avgCPM", null],
    ["Frequency", data.avgFrequency, "frequency", "avgFrequency", null],
  ];

  return (
    <section
      aria-label="Totals"
      className="grid grid-cols-2 min-[1100px]:grid-cols-4 gap-3.5"
    >
      {list.map(([label, value, key, dqKey, series]) => {
        const c = data.changes?.[key];
        const bad = c && c.good === false;
        // When the API marks a metric unavailable, its note says why.
        const q = data.dataQuality?.[dqKey];
        const unavailableNote = q?.type === "unavailable" ? q.note : null;
        return (
          <div
            key={label}
            className="bg-surface border border-gray-200 rounded-2xl px-4.5 pt-4 pb-3"
          >
            <div className="text-[11.5px] font-semibold tracking-[0.05em] uppercase text-gray-500">
              {label}
            </div>
            <div className="text-[27px] font-extrabold tracking-[-0.02em] mt-1.5 text-gray-900">
              {dash(value)}
            </div>
            <div className="flex gap-1.5 items-center text-[12px] mt-0.5 text-gray-500">
              {c?.change ? (
                <>
                  <Delta change={c} />
                  vs {c.previous}
                </>
              ) : (
                unavailableNote ?? "No earlier data"
              )}
            </div>
            {series && series.some((v) => v > 0) && (
              <Spark values={series} color={bad ? "#dc2626" : "#1447e6"} />
            )}
          </div>
        );
      })}
    </section>
  );
}
