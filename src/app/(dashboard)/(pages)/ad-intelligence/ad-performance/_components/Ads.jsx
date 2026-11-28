"use client";

/**
 * Ad Performance — "Your ads": the filterable / sortable ad list and the
 * detail drawer an ad opens.
 */

import { useMemo, useState } from "react";
import { X, ImageOff } from "lucide-react";
import Drawer from "@/app/(components)/ui/Drawer";
import { Pills } from "./Insights";
import {
  Card,
  Chip,
  SecTitle,
  Empty,
  btn,
  btnGhost,
  dash,
  shortUrl,
  verdictKind,
  severityKind,
  deliveryKind,
  deliveryLabel,
} from "./ui";

const VERDICTS = ["Scale", "Keep", "Fix", "Pause"];

const SORTS = {
  spend: { label: "Most spend", key: (a) => -(a.metrics?.spendRaw || 0) },
  cpr: { label: "Lowest cost per result", key: (a) => a.metrics?.cprRaw ?? 1e12 },
  ctr: { label: "Highest CTR", key: (a) => -(a.metrics?.linkCtrRaw || 0) },
  freq: { label: "Highest frequency", key: (a) => -(a.metrics?.frequencyRaw || 0) },
};

/** "Purchases" when every ad counts the same result, "Results" when mixed. */
function resultLabel(ads) {
  const kinds = new Set(ads.map((a) => a.metrics?.resultType).filter(Boolean));
  return kinds.size === 1 ? [...kinds][0] : "Results";
}

/** A Studio brief for "make a new version" of an ad. */
export const studioHref = (message) =>
  `/studio/ai-chat-page?initialMessage=${encodeURIComponent(message)}`;

const COLS =
  "grid-cols-[72px_minmax(0,1fr)_90px] min-[1100px]:grid-cols-[84px_minmax(0,2.2fr)_repeat(6,minmax(0,.8fr))_92px]";

export function AdsSection({ ads = [], activeAds, deliveringAds, periodDays }) {
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("spend");
  const [openId, setOpenId] = useState(null);

  const counts = useMemo(() => {
    const c = { Scale: 0, Keep: 0, Fix: 0, Pause: 0 };
    ads.forEach((a) => c[a.verdict] !== undefined && c[a.verdict]++);
    return c;
  }, [ads]);

  const list = ads
    .filter((a) => filter === "All" || a.verdict === filter)
    .slice()
    .sort((x, y) => SORTS[sort].key(x) - SORTS[sort].key(y));

  const resLabel = resultLabel(ads);
  const costLabel = resLabel === "Purchases" ? "Cost / purch." : "Cost / result";
  const open = ads.find((a) => a.id === openId) ?? null;

  return (
    <Card aria-labelledby="h-ads">
      <div className="flex flex-wrap gap-2.5 items-center justify-between mb-3">
        <div>
          <h2 id="h-ads" className="m-0 text-[16.5px] font-bold text-gray-900">
            Your ads
          </h2>
          <div className="text-[13.5px] text-gray-500 mt-0.5">
            {ads.length} ads · {activeAds ?? 0} active · {deliveringAds ?? 0} delivering
            {ads.length > 0 && " · tap an ad for the full breakdown"}
          </div>
        </div>
        {ads.length > 0 && (
          <div className="flex gap-2.5 flex-wrap items-center">
            <Pills
              options={["All", ...VERDICTS].map((v) => [
                v,
                v === "All" ? "All" : `${v} ${counts[v]}`,
              ])}
              value={filter}
              onChange={setFilter}
            />
            <label htmlFor="adSort" className="text-[13.5px] text-gray-500">
              Sort
            </label>
            <select
              id="adSort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-9 border border-gray-200 rounded-[9px] px-2.5 text-[13px] bg-surface text-gray-900"
            >
              {Object.entries(SORTS).map(([k, s]) => (
                <option key={k} value={k}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {ads.length === 0 ? (
        <Empty>No ads found in the connected accounts.</Empty>
      ) : (
        <>
          <div
            className={`grid ${COLS} gap-3.5 px-3.25 text-[11.5px] text-gray-500 font-semibold uppercase tracking-[0.04em]`}
          >
            <span />
            <span>Ad</span>
            {["Spend", resLabel, costLabel, "ROAS", "Link CTR", "Freq."].map((h) => (
              <span key={h} className="hidden min-[1100px]:block">
                {h}
              </span>
            ))}
            <span>Verdict</span>
          </div>
          {list.length === 0 && (
            <div className="mt-2">
              <Empty>No ads with this verdict.</Empty>
            </div>
          )}
          {list.map((a) => (
            <AdRow key={a.id} ad={a} onOpen={() => setOpenId(a.id)} />
          ))}
        </>
      )}

      <Drawer
        isOpen={!!open}
        onClose={() => setOpenId(null)}
        side="right"
        label="Ad details"
        className="w-155 max-w-full!"
      >
        {open && (
          <AdDetail ad={open} periodDays={periodDays} onClose={() => setOpenId(null)} />
        )}
      </Drawer>
    </Card>
  );
}

/* ─── one ad row ──────────────────────────────────────────────── */

function Thumb({ ad, size }) {
  const src = ad.thumbnail || ad.imageUrl;
  const box = size === "lg" ? "w-50 h-50 rounded-[14px]" : "w-18 h-18 min-[1100px]:w-21 min-[1100px]:h-21 rounded-[11px]";
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={size === "lg" ? `${ad.name} creative` : ""} className={`${box} object-cover bg-gray-100`} />
  ) : (
    <div className={`${box} bg-gray-100 flex items-center justify-center text-gray-300`}>
      <ImageOff className="w-6 h-6" />
    </div>
  );
}

function AdRow({ ad, onOpen }) {
  const m = ad.metrics ?? {};
  // ⚠️ NO RED/GREEN ON THESE NUMBERS. The design coloured cost per result
  // (>50 red, <25 green), CTR (<0.7% red) and frequency (>3.5 red) with fixed
  // dollar-era thresholds; the API sends no such judgement, and ₦50 is not $50.
  // The ad's verdict and issue chips (both from the API) carry that signal.
  const cell = (label, value) => (
    <div className="hidden min-[1100px]:block">
      <small className="block text-[11px] text-gray-500">{label}</small>
      <b className="text-[14px] text-gray-900">{dash(value)}</b>
    </div>
  );

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`grid ${COLS} gap-3.5 items-center p-3 border border-gray-100 rounded-[14px] mt-2 w-full text-left bg-surface hover:border-[#dbe5ff] hover:bg-[#fbfcff] dark:hover:bg-gray-50 transition-colors cursor-pointer`}
    >
      <Thumb ad={ad} />
      <div className="min-w-0">
        <div className="flex gap-2 items-center flex-wrap">
          <span className="font-bold text-[14px] text-gray-900">{ad.name}</span>
          {ad.deliveryStatus && (
            <Chip kind={deliveryKind(ad.deliveryStatus)} small>
              {deliveryLabel(ad.deliveryStatus)}
            </Chip>
          )}
        </div>
        <div className="text-[12px] text-gray-500 mt-0.75">
          {[
            ad.format,
            ad.campaign?.name,
            ad.adset?.name,
            ad.adset?.dailyBudget && `${ad.adset.dailyBudget}/day`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </div>
        {ad.issues?.length > 0 && (
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {ad.issues.slice(0, 3).map((x, i) => (
              <Chip key={i} kind={severityKind(x.severity)} small>
                {x.title}
              </Chip>
            ))}
          </div>
        )}
      </div>
      {cell("Spend", m.spend)}
      {cell(m.resultType ?? "Results", m.results)}
      {cell("Cost / result", m.costPerResult)}
      {cell("ROAS", m.roas)}
      {cell("Link CTR", m.ctr)}
      {cell("Freq.", m.frequency)}
      <span className="justify-self-start">
        {ad.verdict && <Chip kind={verdictKind(ad.verdict)}>{ad.verdict}</Chip>}
      </span>
    </button>
  );
}

/* ─── drawer body ─────────────────────────────────────────────── */

function AdDetail({ ad, periodDays, onClose }) {
  const m = ad.metrics ?? {};
  const cells = [
    ["Spend", m.spend],
    ["Impressions", m.impressions],
    ["Reach", m.reach],
    ["Frequency", m.frequency],
    ["Link clicks", m.linkClicks],
    ["Link CTR", m.ctr],
    ["CPC", m.cpc],
    ["CPM", m.cpm],
    // An ad optimising for link clicks reports them as its result — that is
    // the "Link clicks" cell above, so it is not listed twice.
    ...(m.resultKind === "link_click" || m.resultType === "Link clicks"
      ? []
      : [[m.resultType ?? "Results", m.results]]),
    ["Cost / result", m.costPerResult],
    ["ROAS", m.roas],
    ["Purchase value", m.purchaseValue],
  ];
  if (m.hookRate) cells.push(["Hook rate (3s)", m.hookRate], ["Hold rate", m.holdRate]);
  const r = ad.rankings ?? {};

  const brief = [
    `Make a new version of my ad "${ad.name}".`,
    ad.headline && `Current headline: ${ad.headline}`,
    ad.body && `Current text: ${ad.body}`,
    ad.verdictFix && `What to change: ${ad.verdictFix}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 bg-surface border-b border-gray-200 px-5.5 py-4 flex justify-between items-center gap-3 z-2">
        <h3 className="m-0 text-[16px] font-bold text-gray-900 truncate">{ad.name}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="w-10 h-10 shrink-0 rounded-[10px] border border-gray-200 bg-surface flex items-center justify-center text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          <X className="w-4.5 h-4.5" strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5.5 py-5 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-[200px_minmax(0,1fr)] gap-4">
          <Thumb ad={ad} size="lg" />
          <div className="min-w-0">
            <div className="flex gap-2 flex-wrap">
              {ad.verdict && <Chip kind={verdictKind(ad.verdict)}>{ad.verdict}</Chip>}
              {ad.format && <Chip kind="off">{ad.format}</Chip>}
            </div>
            {ad.headline && (
              <div className="text-[17px] font-extrabold mt-2.5 text-gray-900">{ad.headline}</div>
            )}
            {ad.body && (
              <div className="text-[13.5px] text-gray-700 mt-1.5 leading-[1.55] whitespace-pre-line">
                {ad.body}
              </div>
            )}
            {(ad.cta || ad.landingUrl) && (
              <div className="text-[13px] mt-2">
                {ad.cta && <b className="text-[#1447e6]">[{ad.cta}]</b>}{" "}
                {ad.landingUrl && (
                  <a
                    href={ad.landingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1447e6] hover:text-[#0f36b3]"
                  >
                    {shortUrl(ad.landingUrl)}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {(ad.verdictReason || ad.verdictFix) && (
          <div className="bg-gray-50 rounded-[14px] p-3.5">
            <SecTitle className="text-[#6d28d9]!">AI verdict: {ad.verdict}</SecTitle>
            {ad.verdictReason && (
              <div className="text-[14px] mt-1.5 leading-[1.55] text-gray-900">{ad.verdictReason}</div>
            )}
            {ad.verdictFix && (
              <div className="text-[14px] mt-1.5 leading-[1.55] text-gray-900">
                <b>Do this:</b> {ad.verdictFix}
              </div>
            )}
          </div>
        )}

        <div>
          <SecTitle className="mb-2">Results · last {periodDays} days</SecTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {cells.map(([l, v]) => (
              <div key={l} className="bg-gray-50 rounded-[10px] px-2.5 py-2.25">
                <small className="block text-[11px] text-gray-500">{l}</small>
                <b className="text-[14.5px] text-gray-900">{dash(v)}</b>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SecTitle className="mb-2">Rankings vs competing ads</SecTitle>
          <div className="grid grid-cols-3 gap-2">
            {[
              ["Quality", r.quality],
              ["Engagement", r.engagement],
              ["Conversion", r.conversion],
            ].map(([l, v]) => (
              <div key={l} className="border border-gray-100 rounded-[10px] px-2.5 py-2.25 text-[12px] text-gray-500">
                {l}
                <b className="block text-[13px] text-gray-900 mt-0.5">{dash(v)}</b>
              </div>
            ))}
          </div>
        </div>

        {ad.issues?.length > 0 && (
          <div>
            <SecTitle className="mb-2">Problems on this ad</SecTitle>
            {ad.issues.map((i, n) => (
              <div
                key={n}
                className="text-[13px] bg-gray-50 rounded-[11px] px-3 py-2.5 leading-normal mt-2 text-gray-700"
              >
                <Chip kind={severityKind(i.severity)} className="mr-1.5">
                  {i.title}
                </Chip>
                {i.fix || i.detail}
              </div>
            ))}
          </div>
        )}

        <div>
          <SecTitle className="mb-2">Delivery</SecTitle>
          <div className="text-[13.5px] text-gray-700 leading-[1.7]">
            {ad.campaign && (
              <>
                Campaign: <b className="text-gray-900">{ad.campaign.name}</b>
                {ad.campaign.objective && ` (${ad.campaign.objective})`}
                <br />
              </>
            )}
            {ad.adset && (
              <>
                Ad set: <b className="text-gray-900">{ad.adset.name}</b>
                {ad.adset.dailyBudget && ` · ${ad.adset.dailyBudget}/day`}
                {ad.adset.optimization && ` · optimizing for ${ad.adset.optimization}`}
                {ad.adset.learning && ` · ${ad.adset.learning}`}
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2.5 flex-wrap">
          {ad.previewUrl && (
            <a href={ad.previewUrl} target="_blank" rel="noopener noreferrer" className={btn}>
              Open in Ads Manager
            </a>
          )}
          <a href={studioHref(brief)} className={btnGhost}>
            Make a new version in Studio
          </a>
        </div>
      </div>
    </div>
  );
}
