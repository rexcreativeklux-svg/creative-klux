"use client";

/**
 * Ad Performance — the bottom of the page: who buys (age × gender), devices /
 * placements / formats, landing pages, next ads to launch, and campaigns.
 */

import { useState } from "react";
import { toast } from "sonner";
import { studioHref } from "./Ads";
import {
  Card,
  CardHead,
  Chip,
  Empty,
  SecTitle,
  SourceTag,
  btn,
  btnGhost,
  btnSm,
  dash,
  shortUrl,
} from "./ui";

/* ─── who buys ────────────────────────────────────────────────── */

export function AudienceCard({ audience, audienceInsight, dq }) {
  const mx = audience?.ageGenderMatrix ?? [];
  const vals = [];
  mx.forEach((r) => ["female", "male"].forEach((g) => r[g]?.cprRaw && vals.push(r[g].cprRaw)));
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);

  const cell = (c) => {
    if (!c) {
      return (
        <div className="rounded-[10px] p-2.5 min-h-14 flex flex-col justify-center bg-gray-50 text-gray-500">
          <small className="text-[11.5px]">No data</small>
        </div>
      );
    }
    if (!c.cprRaw) {
      return (
        <div className="rounded-[10px] p-2.5 min-h-14 flex flex-col justify-center bg-gray-50 text-gray-500">
          <b className="text-[14px]">—</b>
          <small className="text-[11.5px]">{c.share}% of views · no conversions</small>
        </div>
      );
    }
    // Darker = cheaper.
    const t = 1 - (c.cprRaw - lo) / (hi - lo || 1);
    return (
      <div
        className="rounded-[10px] p-2.5 min-h-14 flex flex-col justify-center"
        style={{
          background: `rgba(20,71,230,${0.12 + t * 0.88})`,
          color: t > 0.45 ? "#fff" : "#0b1220",
        }}
      >
        <b className="text-[14px]">{c.costPerResult}</b>
        <small className="text-[11.5px] opacity-85">{c.share}% of views</small>
      </div>
    );
  };

  return (
    <Card aria-labelledby="h-aud">
      <CardHead id="h-aud" title="Who buys, and what they cost">
        <SourceTag q={dq} />
      </CardHead>
      <div className="text-[13.5px] text-gray-500 -mt-2 mb-3">
        Cost per conversion by age and gender. Darker = cheaper.
      </div>
      {mx.length === 0 ? (
        <Empty>No age or gender breakdown for this period.</Empty>
      ) : (
        <div className="grid grid-cols-[70px_repeat(2,minmax(0,1fr))] gap-1.5 text-[12.5px]">
          <span />
          <span className="font-semibold text-gray-500 text-center pb-0.5">Women</span>
          <span className="font-semibold text-gray-500 text-center pb-0.5">Men</span>
          {mx.map((r) => (
            <div key={r.age} className="contents">
              <span className="flex items-center font-semibold text-gray-700">{r.age}</span>
              {cell(r.female)}
              {cell(r.male)}
            </div>
          ))}
        </div>
      )}
      {/* No "AI:" label: dataQuality has no entry for audienceInsight. */}
      {audienceInsight && (
        <div className="text-[13px] leading-[1.55] bg-gray-50 rounded-[11px] px-3.25 py-2.75 text-gray-700 mt-3.5">
          {audienceInsight}
        </div>
      )}
    </Card>
  );
}

/* ─── devices, placements, formats ────────────────────────────── */

function Bars({ rows }) {
  if (!rows?.length) return <Empty>No data for this period.</Empty>;
  return (
    <div className="flex flex-col gap-2.25">
      {rows.map((r) => (
        <div
          key={r.name}
          className="grid grid-cols-[96px_minmax(0,1fr)_46px_70px] gap-2.5 items-center text-[12.5px]"
        >
          <span className="text-gray-900 truncate">{r.name}</span>
          <div className="h-2.25 bg-gray-100 rounded-md">
            <i
              className="block h-2.25 rounded-md bg-[#1447e6]"
              style={{ width: `${Math.min(r.percent ?? 0, 100)}%` }}
            />
          </div>
          <b className="text-gray-900">{r.percent ?? 0}%</b>
          <span className="text-gray-500">{dash(r.costPerResult)}</span>
        </div>
      ))}
    </div>
  );
}

export function WhereCard({ audience, topCreativeTypes = [], dq }) {
  return (
    <Card aria-labelledby="h-where">
      <CardHead id="h-where" title="Devices, placements and formats">
        <SourceTag q={dq} />
      </CardHead>
      <SecTitle className="mb-2">Placements</SecTitle>
      <Bars rows={audience?.placements} />
      <SecTitle className="mt-4 mb-2">Devices</SecTitle>
      <Bars rows={audience?.devices} />
      <SecTitle className="mt-4 mb-2">Formats</SecTitle>
      {topCreativeTypes.length === 0 ? (
        <Empty>No format data for this period.</Empty>
      ) : (
        <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-2.5">
          {topCreativeTypes.map((f) => (
            <div key={f.type} className="bg-gray-50 rounded-xl p-3">
              <small className="text-[12px] text-gray-500">
                {f.type} · {f.ads} ads
              </small>
              <b className="text-[15px] block text-gray-900">{dash(f.costPerResult)}</b>
              <small className="text-[12px] text-gray-500">
                per conversion · {f.share ?? 0}% of spend
              </small>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ─── landing pages ───────────────────────────────────────────── */

export function LandingPages({ landingPages = [], dq }) {
  return (
    <Card aria-labelledby="h-land">
      <CardHead id="h-land" title="Landing pages your ads use">
        <SourceTag q={dq} />
      </CardHead>
      {landingPages.length === 0 ? (
        <Empty>No landing pages found on your ads.</Empty>
      ) : (
        <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-3">
          {landingPages.map((l) => {
            const pixels = l.pixels ?? [];
            const offers = l.offers ?? [];
            const hasMeta = pixels.includes("Meta Pixel");
            return (
              <div key={l.url} className="border border-gray-100 rounded-[13px] px-3.5 py-3">
                <div className="flex justify-between gap-2.5 items-center font-semibold text-[13.5px] text-gray-900">
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate hover:text-[#1447e6]"
                  >
                    {shortUrl(l.url)}
                  </a>
                  <Chip kind={l.error ? "critical" : hasMeta ? "active" : "critical"}>
                    {l.error ? "Not loading" : hasMeta ? "Pixel on" : "No Meta Pixel"}
                  </Chip>
                </div>
                <div className="text-[12.5px] text-gray-700 mt-1.25">
                  {l.headline && <>“{l.headline}” · </>}
                  {l.adsUsing} ads · Offers: {offers.join(" · ") || "none seen"}
                </div>
                <div className="text-[12.5px] text-gray-500 mt-1.25">
                  Tracking: {pixels.join(", ") || "none found"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ─── next ads to launch ──────────────────────────────────────── */

export function NextCreatives({ nextCreatives = [], dq }) {
  const [copied, setCopied] = useState(null);

  const copy = async (c, i) => {
    const text = [c.headline, c.body, c.cta && `CTA: ${c.cta}`].filter(Boolean).join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied((v) => (v === i ? null : v)), 1500);
    } catch {
      toast.error("Couldn't copy the text.");
    }
  };

  const brief = (c) =>
    [
      `Create a ${c.format?.toLowerCase() ?? "image"} ad.`,
      `Angle: ${c.angle}`,
      `Headline: ${c.headline}`,
      `Text: ${c.body}`,
      c.cta && `Call to action: ${c.cta}`,
      c.visual && `Visual: ${c.visual}`,
    ]
      .filter(Boolean)
      .join("\n");

  return (
    <Card aria-labelledby="h-ideas">
      {/* No "built from your brand kit" line: the API doesn't say what the
          ideas were built from, so the page doesn't either. */}
      <CardHead id="h-ideas" title="Next ads to launch">
        <SourceTag q={dq} />
      </CardHead>
      {nextCreatives.length === 0 ? (
        <Empty>No new ad ideas for this period.</Empty>
      ) : (
        <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-3.5">
          {nextCreatives.map((c, i) => (
            <div key={i} className="border border-gray-100 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex justify-between gap-2 text-[12px] font-bold text-[#1447e6]">
                <span>{c.angle}</span>
                {c.format && (
                  <Chip kind="off" small>
                    {c.format}
                  </Chip>
                )}
              </div>
              <h3 className="m-0 text-[16.5px] leading-[1.3] font-bold text-gray-900">
                {c.headline}
              </h3>
              <p className="m-0 text-[13px] text-gray-700 leading-normal whitespace-pre-line">
                {c.body}
              </p>
              {c.visual && (
                <div className="text-[12px] text-gray-500">
                  <b className="text-gray-900">Visual:</b> {c.visual}
                </div>
              )}
              <div className="flex gap-2 mt-auto pt-1.5">
                <a href={studioHref(brief(c))} className={`${btn} ${btnSm} flex-1`}>
                  Create in Studio
                </a>
                <button type="button" onClick={() => copy(c, i)} className={`${btnGhost} ${btnSm}`}>
                  {copied === i ? "Copied" : "Copy text"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ─── campaigns ───────────────────────────────────────────────── */

const campaignKind = (s) => (s === "Active" ? "active" : s === "Disapproved" ? "critical" : "off");

export function Campaigns({ campaigns = [], dq }) {
  const th =
    "text-left text-[11.5px] text-gray-500 font-semibold uppercase tracking-[0.04em] p-2 whitespace-nowrap";
  // Every column but the name stays on one line; the table scrolls sideways
  // on narrow screens instead of stacking "Google / Ads".
  const td = "px-2 py-3 border-t border-gray-100 text-gray-900 whitespace-nowrap";
  return (
    <Card aria-labelledby="h-camp">
      <CardHead id="h-camp" title="Campaigns">
        <SourceTag q={dq} />
      </CardHead>
      {campaigns.length === 0 ? (
        <Empty>No campaigns in the connected accounts.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {["Campaign", "Channel", "Status", "Spend", "Impressions", "Link CTR", "CPC", "Results"].map(
                  (h) => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id ?? c.name}>
                  <td className={`${td} font-semibold whitespace-normal! min-w-55`}>{c.name}</td>
                  <td className={td}>{c.platform}</td>
                  <td className={td}>
                    <Chip kind={campaignKind(c.status)} small>
                      {c.status}
                    </Chip>
                  </td>
                  <td className={td}>{dash(c.spend)}</td>
                  <td className={td}>{dash(c.impressions)}</td>
                  <td className={td}>{dash(c.ctr)}</td>
                  <td className={td}>{dash(c.cpc)}</td>
                  <td className={td}>{dash(c.conversions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
