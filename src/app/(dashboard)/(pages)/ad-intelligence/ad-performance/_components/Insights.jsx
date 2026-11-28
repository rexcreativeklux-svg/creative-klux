"use client";

/**
 * Ad Performance — the middle of the page: daily trend, budget advice, the
 * purchase funnel, account health and the action plan.
 */

import { useState } from "react";
import { ArrowDown } from "lucide-react";
import { trendSeries } from "./Overview";
import {
  Card,
  CardHead,
  Chip,
  Empty,
  SecTitle,
  SourceTag,
  severityKind,
  severityLabel,
} from "./ui";

/* ─── spend + results by day ──────────────────────────────────── */

export function TrendCard({ trendData, currency }) {
  const t = trendSeries(trendData);
  const W = 640;
  const H = 220;
  const pad = 26;

  let chart = null;
  if (t.length > 1) {
    const bw = (W - pad) / t.length;
    const maxS = Math.max(...t.map((d) => d.spend), 1);
    const maxR = Math.max(...t.map((d) => d.results), 1);
    const line = t.map(
      (d, i) => [pad + i * bw + bw / 2, H - 22 - (d.results / maxR) * (H - 60)],
    );
    const lbl = (i) =>
      new Date(t[i].date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    chart = (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Daily spend and conversions"
        className="block w-full h-55"
      >
        <line x1={pad} x2={W} y1={H - 22} y2={H - 22} stroke="#e7eaf3" />
        {t.map((d, i) => {
          const h = (d.spend / maxS) * (H - 50);
          return (
            <rect
              key={d.date}
              x={pad + i * bw + 2}
              y={H - 22 - h}
              width={Math.max(bw - 4, 1)}
              height={h}
              rx="3"
              fill="#c9d6fb"
            >
              <title>
                {d.date}: {currency ? `${currency} ` : ""}
                {d.spend.toLocaleString()} · {d.results} conversions
              </title>
            </rect>
          );
        })}
        <polyline
          points={line.map((p) => p.join(",")).join(" ")}
          fill="none"
          stroke="#1447e6"
          strokeWidth="2.2"
        />
        {line.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.6" fill="#1447e6" />
        ))}
        <text x={pad} y={H - 6} fontSize="11" fill="#64748b">
          {lbl(0)}
        </text>
        <text x={W / 2} y={H - 6} fontSize="11" fill="#64748b" textAnchor="middle">
          {lbl(Math.floor(t.length / 2))}
        </text>
        <text x={W} y={H - 6} fontSize="11" fill="#64748b" textAnchor="end">
          {lbl(t.length - 1)}
        </text>
      </svg>
    );
  }

  return (
    <Card aria-labelledby="h-trend">
      <CardHead id="h-trend" title="Spend and conversions by day">
        <div className="flex gap-3.5 text-[12px] text-gray-700">
          <span className="flex gap-1.5 items-center">
            <i className="w-2.5 h-2.5 rounded-[3px] inline-block bg-[#c9d6fb]" />
            Spend
          </span>
          <span className="flex gap-1.5 items-center">
            <i className="w-2.5 h-2.5 rounded-[3px] inline-block bg-[#1447e6]" />
            Conversions
          </span>
        </div>
      </CardHead>
      {chart ?? <Empty>No daily delivery in this period.</Empty>}
    </Card>
  );
}

export function BudgetCard({ budgetAdvice, suggestedRefreshIn }) {
  return (
    <Card aria-labelledby="h-budget">
      {/* No tag: the API's dataQuality has no entry for budgetAdvice or
          suggestedRefreshIn, and the page doesn't label what it didn't. */}
      <CardHead id="h-budget" title="Budget advice" />
      <p className="m-0 text-[14px] leading-[1.6] text-gray-700">
        {budgetAdvice || "No budget advice for this period."}
      </p>
      <SecTitle className="mt-4.5 mb-2">When to refresh creatives</SecTitle>
      <p className="m-0 text-[14px] leading-[1.6] text-gray-700">
        {suggestedRefreshIn || "—"}
      </p>
    </Card>
  );
}

/* ─── funnel ──────────────────────────────────────────────────── */

export function Funnel({ funnel, dq }) {
  const steps = funnel?.steps ?? [];
  const max = Math.max(steps[0]?.count ?? 0, 1);
  const leak = funnel?.biggestLeak;
  const anyData = steps.some((s) => s.count > 0);

  return (
    <Card aria-labelledby="h-funnel">
      <CardHead
        id="h-funnel"
        title="Where buyers drop off"
        sub="From the moment people see your ad to the moment they pay"
      >
        <SourceTag q={dq} />
      </CardHead>

      {funnel && funnel.tracking === false && (
        <div className="mb-3 text-[13px] text-[#92400e] bg-[#fef3c7] rounded-[11px] px-3 py-2.5">
          No Pixel events were received in this period, so the steps after the
          click can&apos;t be measured yet.
        </div>
      )}

      {steps.length === 0 ? (
        <Empty>No funnel data for this period.</Empty>
      ) : (
        <div className="flex flex-col gap-2">
          {steps.map((s) => {
            const isLeak = leak && s.key === leak.step;
            // Square-root scale so the later, much smaller steps stay visible.
            // A step with nothing in it gets no bar at all — a 6% stub would
            // read as "a little", and zero is not a little.
            const w =
              anyData && s.count > 0 ? Math.max(6, Math.sqrt(s.count / max) * 100) : 0;
            return (
              <div
                key={s.key}
                className="grid grid-cols-[110px_minmax(0,1fr)] sm:grid-cols-[190px_minmax(0,1fr)_170px] gap-3.5 items-center"
              >
                <div className="text-[13.5px] font-semibold text-gray-900">
                  {s.label}
                  {s.costPerStep && (
                    <small className="block font-medium text-gray-500 text-[12px]">
                      {s.costPerStep} each
                    </small>
                  )}
                </div>
                <div className="h-8.5 bg-gray-100 rounded-[9px] relative overflow-hidden">
                  <i
                    className={`absolute left-0 top-0 bottom-0 rounded-[9px] ${isLeak ? "bg-[#dc2626]" : "bg-[#1447e6]"}`}
                    style={{ width: `${w}%` }}
                  />
                  {/* Inside the bar when it fits, just past its end when not */}
                  <span
                    className={`absolute top-0 bottom-0 flex items-center font-bold text-[13px] ${
                      w > 12 ? "text-white" : "text-gray-700"
                    }`}
                    style={{ left: w > 12 ? 12 : `calc(${w}% + 8px)` }}
                  >
                    {s.value}
                  </span>
                </div>
                <div className="col-start-2 sm:col-start-auto text-[12.5px] text-gray-700">
                  {s.rate ? (
                    <>
                      <b className={`text-[14px] ${isLeak ? "text-[#b91c1c]" : ""}`}>
                        {s.rate}
                      </b>{" "}
                      move on
                      {s.benchmark && (
                        <>
                          <br />
                          <span className="text-gray-500">typical {s.benchmark}</span>
                        </>
                      )}
                    </>
                  ) : s.benchmark ? (
                    <span className="text-gray-500">typical {s.benchmark}</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {leak && (
        <div className="flex gap-3.5 items-start bg-[#fff5f5] border border-[#fbd5d5] rounded-[14px] px-4 py-3.5 mt-3.5">
          <div className="w-8.5 h-8.5 shrink-0 rounded-[10px] bg-[#dc2626] text-white flex items-center justify-center">
            <ArrowDown className="w-4.5 h-4.5" strokeWidth={2} />
          </div>
          <div>
            <b className="text-[14px] text-[#0b1220]">Biggest leak: {leak.title}</b>
            <div className="text-[13px] text-[#334155] mt-1 leading-normal">
              {leak.rate} vs {leak.benchmark} typical. {leak.fix}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ─── account health ──────────────────────────────────────────── */

export function Health({ health, dq }) {
  const [filter, setFilter] = useState("all");
  if (!health) return null;
  const issues = health.issues ?? [];
  const opts = [
    ["all", `All ${issues.length}`],
    ["critical", `Critical ${health.critical ?? 0}`],
    ["warning", `Warnings ${health.warnings ?? 0}`],
  ];
  const shown = issues.filter((i) => filter === "all" || i.severity === filter);

  return (
    <Card id="health" aria-labelledby="h-health" className="scroll-mt-24">
      <CardHead
        id="h-health"
        title="Account health"
        // Where the checks come from is the API's own sentence (dataQuality).
        sub={[
          `${health.critical ?? 0} critical`,
          `${health.warnings ?? 0} warnings`,
          dq?.source,
        ]
          .filter(Boolean)
          .join(" · ")}
      >
        <Pills options={opts} value={filter} onChange={setFilter} />
      </CardHead>

      {shown.length === 0 ? (
        <Empty>
          {issues.length === 0 ? "No problems found. Nice." : "Nothing in this filter."}
        </Empty>
      ) : (
        <div className="flex flex-col">
          {shown.map((i, n) => (
            <div
              key={n}
              className={`grid grid-cols-1 min-[1100px]:grid-cols-[92px_minmax(0,1fr)_minmax(0,1fr)] gap-4 py-3.5 items-start ${
                n > 0 ? "border-t border-gray-100" : ""
              }`}
            >
              <span className="justify-self-start">
                <Chip kind={severityKind(i.severity)}>{severityLabel(i.severity)}</Chip>
              </span>
              <div className="min-w-0">
                <div className="font-semibold text-[14.5px] text-gray-900">{i.title}</div>
                {i.area && <div className="text-[12.5px] text-gray-500 mt-0.5">{i.area}</div>}
                {i.detail && <div className="text-[13px] text-gray-700 mt-1">{i.detail}</div>}
              </div>
              {i.fix && (
                <div className="text-[13px] bg-gray-50 rounded-[11px] px-3 py-2.5 leading-normal text-gray-700">
                  <b className="text-[#1447e6]">Fix: </b>
                  {i.fix}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/** Pill filters ("All 10 · Critical 8 · Warnings 2"). */
export function Pills({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([k, label]) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          aria-pressed={value === k}
          className={`h-8.5 px-3 rounded-full border text-[12.5px] font-semibold transition-colors cursor-pointer ${
            value === k
              ? "bg-gray-900 border-gray-900 text-surface"
              : "bg-surface border-gray-200 text-gray-700 hover:border-gray-300"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ─── action plan ─────────────────────────────────────────────── */

const PRIORITY_KIND = { Now: "critical", "This week": "warning", Next: "info" };

export function ActionPlan({ actionPlan = [], dq }) {
  return (
    <Card aria-labelledby="h-plan">
      <CardHead id="h-plan" title="Action plan">
        <SourceTag q={dq} />
      </CardHead>
      {actionPlan.length === 0 ? (
        <Empty>No actions suggested for this period.</Empty>
      ) : (
        <ol className="list-none m-0 p-0 flex flex-col gap-2.5">
          {actionPlan.map((p, i) => (
            <li
              key={i}
              className="grid grid-cols-[34px_minmax(0,1fr)] sm:grid-cols-[34px_minmax(0,1fr)_auto] gap-3.5 p-3.5 border border-gray-100 rounded-[14px] items-start"
            >
              <span className="w-8 h-8 rounded-[10px] bg-[#eef3ff] text-[#1447e6] font-extrabold flex items-center justify-center">
                {i + 1}
              </span>
              <div className="min-w-0">
                <b className="text-[14.5px] text-gray-900">{p.step}</b>
                {p.why && (
                  <p className="mt-1 mb-0 text-[13px] text-gray-700 leading-normal">
                    <em className="not-italic font-semibold text-gray-900">Why:</em> {p.why}
                  </p>
                )}
                {p.how && (
                  <p className="mt-1 mb-0 text-[13px] text-gray-700 leading-normal">
                    <em className="not-italic font-semibold text-gray-900">How:</em> {p.how}
                  </p>
                )}
                {p.impact && (
                  <p className="mt-1 mb-0 text-[13px] text-gray-700 leading-normal">
                    <em className="not-italic font-semibold text-gray-900">Expected:</em>{" "}
                    {p.impact}
                  </p>
                )}
              </div>
              <span className="col-start-2 sm:col-start-auto justify-self-start">
                <Chip kind={PRIORITY_KIND[p.priority] ?? "info"}>{p.priority}</Chip>
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
