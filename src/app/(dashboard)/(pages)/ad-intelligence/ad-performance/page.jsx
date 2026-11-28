"use client";

/**
 * /ad-intelligence/ad-performance — the Ad Performance report.
 *
 * Rebuilt from the design file (ad-performance.html) and wired to
 * `POST /creative-insights` (AuthContext.creativeInsights), whose response uses
 * the same field names as the design's sample data.
 *
 * ⚠️ LOADING IS SLOW THE FIRST TIME. The server builds the report on demand
 * (~30s) and caches it per brand + period (repeats ~2s). So the page loads the
 * active brand on open, keeps the last report on screen (dimmed) while another
 * period loads, and shows an honest elapsed-time wait rather than a bar that
 * guesses at progress.
 *
 * Request state is keyed (brand | days | refresh count) and derived rather than
 * set inside the effect: a reply for an older key is ignored, so switching
 * period quickly can never show the previous period's numbers as the new one.
 */

import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Header, Accounts, Brief, Kpis } from "./_components/Overview";
import {
  TrendCard,
  BudgetCard,
  Funnel,
  Health,
  ActionPlan,
} from "./_components/Insights";
import { AdsSection } from "./_components/Ads";
import {
  AudienceCard,
  WhereCard,
  LandingPages,
  NextCreatives,
  Campaigns,
} from "./_components/Breakdowns";

export default function AdPerformancePage() {
  const { creativeInsights, activeBrand } = useAuth();
  const brandName = activeBrand?.name ?? null;

  const [days, setDays] = useState(30);
  const [nonce, setNonce] = useState(0); // bumped by Refresh
  const key = brandName ? `${brandName}|${days}|${nonce}` : null;

  // The last finished request: { key, data, error }.
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const loading = !!key && result.key !== key;

  useEffect(() => {
    if (!key) return undefined;
    let alive = true;
    creativeInsights({ brand: brandName, days }).then((res) => {
      if (!alive) return;
      setResult(
        res.ok
          ? { key, data: res.data, error: null }
          : { key, data: null, error: res.message || "Couldn't load the report." },
      );
    });
    return () => {
      alive = false;
    };
  }, [key, brandName, days, creativeInsights]);

  // Keep showing the previous report while the next one loads.
  const [shown, setShown] = useState(null);
  if (result.data && result.data !== shown) setShown(result.data);
  const data = result.error ? null : shown;
  // Each section's provenance tag comes from here (see SourceTag).
  const dq = data?.dataQuality ?? {};

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif" }} className="pb-16">
      <div className="max-w-305 mx-auto flex flex-col gap-5">
        <Header
          brand={data?.brand ?? brandName}
          periodDays={loading ? days : data?.periodDays}
          generatedAt={loading ? null : data?.generatedAt}
          days={days}
          onDays={setDays}
          onRefresh={() => setNonce((n) => n + 1)}
          loading={loading}
        />

        {!brandName && (
          <Notice>Pick a brand in the top bar to see its ad performance.</Notice>
        )}

        {result.error && !loading && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-[#fff5f5] border border-[#fbd5d5] rounded-[14px]">
            <AlertCircle className="w-4 h-4 text-[#dc2626] shrink-0 mt-0.5" />
            <div className="text-[13.5px] text-[#b91c1c]">
              {result.error}{" "}
              <button
                type="button"
                onClick={() => setNonce((n) => n + 1)}
                className="font-semibold underline cursor-pointer"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {loading && <Waiting hasData={!!data} days={days} />}

        {data && (
          <div
            className={`flex flex-col gap-5 transition-opacity ${loading ? "opacity-50 pointer-events-none" : ""}`}
            aria-busy={loading || undefined}
          >
            <Accounts
              adAccounts={data.adAccounts}
              accounts={data.accounts}
              accountErrors={data.accountErrors}
            />

            <Brief
              ciScore={data.ciScore}
              ciLevel={data.ciLevel}
              ciSummary={data.ciSummary}
              health={data.health}
              actionPlan={data.actionPlan}
            />

            <Kpis data={data} />

            <div className="grid grid-cols-1 min-[1100px]:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-4.5">
              <TrendCard trendData={data.trendData} currency={data.currency} />
              <BudgetCard
                budgetAdvice={data.budgetAdvice}
                suggestedRefreshIn={data.suggestedRefreshIn}
              />
            </div>

            <Funnel funnel={data.funnel} dq={dq.funnel} />
            <Health health={data.health} dq={dq.health} />
            <ActionPlan actionPlan={data.actionPlan} dq={dq.actionPlan} />

            <AdsSection
              ads={data.ads}
              activeAds={data.activeAds}
              deliveringAds={data.deliveringAds}
              periodDays={data.periodDays}
            />

            <div className="grid grid-cols-1 min-[1100px]:grid-cols-2 gap-4.5">
              <AudienceCard
                audience={data.audience}
                audienceInsight={data.audienceInsight}
                dq={dq.audience}
              />
              <WhereCard
                audience={data.audience}
                topCreativeTypes={data.topCreativeTypes}
                dq={dq.audience}
              />
            </div>

            <LandingPages landingPages={data.landingPages} dq={dq.landingPages} />
            <NextCreatives nextCreatives={data.nextCreatives} dq={dq.nextCreatives} />
            <Campaigns campaigns={data.campaigns} dq={dq.campaigns} />
          </div>
        )}
      </div>
    </div>
  );
}

function Notice({ children }) {
  return (
    <div className="rounded-[18px] border border-gray-200 bg-surface px-5 py-10 text-center text-[14px] text-gray-500">
      {children}
    </div>
  );
}

/**
 * The wait. A first report for a period takes ~30s, so it says so and counts
 * up — true information, unlike a progress bar that would be guessing.
 */
function Waiting({ hasData, days }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  if (hasData) {
    return (
      <div className="flex items-center gap-2 text-[13px] text-gray-500" role="status">
        <Loader2 className="w-4 h-4 animate-spin text-[#1447e6]" />
        Loading the last {days} days… {seconds >= 3 && `${seconds}s`}
      </div>
    );
  }

  return (
    <div
      role="status"
      className="rounded-[22px] bg-[#0b1430] text-white px-7 py-10 flex flex-col items-center text-center gap-3"
    >
      <Loader2 className="w-7 h-7 animate-spin text-[#93c5fd]" />
      <b className="text-[16px]">Reading your ad accounts…</b>
      <p className="m-0 max-w-md text-[13.5px] leading-[1.6] text-[#b9c4e2]">
        The first report for a period takes about 30 seconds while we pull your
        ads, audiences and Pixel events and check your landing pages. After
        that it opens instantly.
      </p>
      <span className="text-[12.5px] text-[#a5b4d8] tabular-nums">{seconds}s</span>
    </div>
  );
}
