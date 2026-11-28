"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, Play, X, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import {
  Card,
  CardHead,
  SecTitle,
  has,
  shortUrl,
  signalTone,
} from "./shared";

/**
 * "Ads they are running" — Meta / Google / TikTok tabs, filters, wall and the
 * per-ad breakdown drawer. Reads `data.competitorAds`; every label, count and
 * note is the backend's.
 */

const SIGNAL_ORDER = ["Scaling", "Proven", "Performing", "Testing", "New"];
const signalRank = (s) => {
  const i = SIGNAL_ORDER.indexOf(String(s || "").split(" ")[0]);
  return i === -1 ? SIGNAL_ORDER.length : i;
};

const SORTS = {
  proven: (a, b) =>
    signalRank(a.signal) - signalRank(b.signal) ||
    (b.daysRunning || 0) - (a.daysRunning || 0),
  days: (a, b) => (b.daysRunning || 0) - (a.daysRunning || 0),
  new: (a, b) => (a.daysRunning ?? Infinity) - (b.daysRunning ?? Infinity),
  versions: (a, b) => (b.variations || 0) - (a.variations || 0),
};

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function PlayBadge() {
  return (
    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gray-900/70 flex items-center justify-center">
      <Play className="w-5 h-5 text-white fill-white" />
    </span>
  );
}

function AdImage({ ad, className = "" }) {
  if (!ad.imageUrl) {
    return (
      <div
        className={`w-full aspect-[4/5] bg-gray-100 flex items-center justify-center text-xs text-gray-400 ${className}`}
      >
        No image from the ad library
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ad.imageUrl}
      alt={ad.headline ? `${ad.headline} ad creative` : "Ad creative"}
      className={`w-full aspect-[4/5] object-cover block ${className}`}
    />
  );
}

// ── one card on the wall ─────────────────────────────────────────────────────
function AdCard({ ad, maxDays, onOpen }) {
  return (
    <article className="border border-gray-200 rounded-2xl overflow-hidden bg-surface flex flex-col hover:shadow-lg hover:border-blue-200 transition">
      <div className="relative">
        <AdImage ad={ad} />
        {ad.signal && (
          <span
            className={`absolute left-2.5 top-2.5 text-[11px] font-extrabold rounded-full px-2.5 py-1 ${signalTone(
              ad.signal,
            )}`}
          >
            {ad.signal}
          </span>
        )}
        {ad.format && (
          <span className="absolute right-2.5 top-2.5 text-[11px] font-bold bg-gray-900/80 text-white rounded-full px-2.5 py-1">
            {ad.format}
          </span>
        )}
        {ad.videoUrl && <PlayBadge />}
      </div>

      <div className="p-3.5 flex flex-col gap-2 flex-1">
        {(has(ad.daysRunning) || has(ad.variations) || has(ad.reachRange)) && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            {has(ad.daysRunning) && <b>{plural(ad.daysRunning, "day", "days")}</b>}
            {has(ad.daysRunning) && maxDays > 0 && (
              <div className="flex-1 h-1.5 rounded bg-gray-100">
                <i
                  className="block h-1.5 rounded bg-blue-600"
                  style={{ width: `${Math.max(4, (ad.daysRunning / maxDays) * 100)}%` }}
                />
              </div>
            )}
            <span className="ml-auto whitespace-nowrap">
              {has(ad.variations)
                ? plural(ad.variations, "version", "versions")
                : ad.reachRange}
            </span>
          </div>
        )}
        {ad.headline && (
          <h3 className="text-sm font-bold text-gray-900 leading-snug">{ad.headline}</h3>
        )}
        {ad.body && (
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{ad.body}</p>
        )}
        {(ad.cta || ad.landingUrl) && (
          <div className="flex items-center justify-between gap-2 text-xs">
            {ad.cta && (
              <span className="font-bold text-blue-600 border border-blue-100 rounded-lg px-2 py-1 whitespace-nowrap">
                {ad.cta}
              </span>
            )}
            {ad.landingUrl && (
              <span className="text-gray-400 truncate min-w-0">→ {shortUrl(ad.landingUrl)}</span>
            )}
          </div>
        )}
        {ad.estimatedCpr?.range && (
          <div className="rounded-lg bg-amber-50 text-amber-900 text-xs px-2.5 py-2">
            <b>Est. {ad.estimatedCpr.range}</b>
            {ad.estimatedCpr.resultType ? ` · ${ad.estimatedCpr.resultType}` : ""}
            {ad.estimatedCpr.confidence ? ` · ${ad.estimatedCpr.confidence} confidence` : ""}
          </div>
        )}
        <div className="flex gap-2 mt-auto pt-1">
          <button
            type="button"
            onClick={onOpen}
            className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold cursor-pointer"
          >
            Open breakdown
          </button>
          {ad.libraryUrl && (
            <a
              href={ad.libraryUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open in ad library"
              className="w-10 h-10 shrink-0 rounded-xl border border-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-50"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

// ── breakdown drawer ─────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard blocked — nothing to do */
        }
      }}
      className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
    >
      {done ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {done ? "Copied" : "Copy your version"}
    </button>
  );
}

function Reach({ ad }) {
  const r = ad.reach;
  if (r) {
    return (
      <div className="rounded-xl bg-gray-50 p-3.5">
        <SecTitle>Who it reaches{r.region ? ` (${r.region})` : ""}</SecTitle>
        {has(r.totalReach) && (
          <p className="text-2xl font-extrabold text-gray-900 mt-1.5">{r.totalReach}</p>
        )}
        {r.targeting && (
          <p className="text-xs text-gray-600">
            targeting{" "}
            {[r.targeting.age && `ages ${r.targeting.age}`, r.targeting.gender]
              .filter(Boolean)
              .join(", ")}
            {has(r.targeting.locations) ? ` · ${r.targeting.locations.join(", ")}` : ""}
          </p>
        )}
        {(has(r.femalePercent) || has(r.malePercent)) && (
          <p className="text-xs text-gray-600 mt-1.5">
            {has(r.femalePercent) && `Women ${r.femalePercent}%`}
            {has(r.femalePercent) && has(r.malePercent) && " · "}
            {has(r.malePercent) && `Men ${r.malePercent}%`}
          </p>
        )}
        {has(r.ageGroups) && (
          <div className="mt-2 space-y-1.5">
            {r.ageGroups.map((g) => (
              <div
                key={g.age}
                className="grid grid-cols-[44px_minmax(0,1fr)_38px] gap-2 items-center text-xs"
              >
                <span>{g.age}</span>
                <span className="h-1.5 rounded bg-gray-200">
                  <i
                    className="block h-1.5 rounded bg-blue-600"
                    style={{ width: `${Math.min(100, g.percent * 2)}%` }}
                  />
                </span>
                <b>{g.percent}%</b>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  if (ad.reachRange) {
    return (
      <div className="rounded-xl bg-gray-50 p-3.5">
        <SecTitle>Reached</SecTitle>
        <p className="text-xl font-extrabold text-gray-900 mt-1.5">{ad.reachRange}</p>
      </div>
    );
  }
  return null;
}

function Drawer({ ads, index, onIndex, onClose }) {
  const open = index !== null && ads[index];
  const ad = open ? ads[index] : null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index < ads.length - 1) onIndex(index + 1);
      if (e.key === "ArrowLeft" && index > 0) onIndex(index - 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, index, ads.length, onIndex, onClose]);

  const y = ad?.yourVersion;
  const yourText = y
    ? [y.headline, y.body, y.cta].filter(Boolean).join("\n\n")
    : "";

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-gray-900/45 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        aria-hidden={!open}
        aria-label="Ad breakdown"
        className={`fixed top-0 right-0 bottom-0 z-50 w-[min(760px,100%)] bg-surface overflow-y-auto shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {ad && (
          <>
            <div className="sticky top-0 z-10 bg-surface border-b border-gray-200 px-5 py-3.5 flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-gray-900 truncate">
                {[ad.format && `${ad.format} ad`, has(ad.daysRunning) && `${ad.daysRunning} days running`]
                  .filter(Boolean)
                  .join(" · ") || "Ad"}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => onIndex(index - 1)}
                  className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <button
                  type="button"
                  disabled={index === ads.length - 1}
                  onClick={() => onIndex(index + 1)}
                  className="h-9 px-3 rounded-lg border border-gray-200 text-sm text-gray-700 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-[250px_minmax(0,1fr)] gap-5">
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <AdImage ad={ad} className="rounded-xl" />
                  {ad.videoUrl && <PlayBadge />}
                </div>
                {ad.videoUrl && (
                  <a
                    href={ad.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Open video
                  </a>
                )}
                <p className="text-xs text-gray-600 leading-relaxed">
                  {[
                    ad.startDate && `Started ${ad.startDate}`,
                    has(ad.variations) && plural(ad.variations, "version", "versions"),
                    has(ad.platforms) && ad.platforms.join(", "),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <Reach ad={ad} />
              </div>

              <div className="flex flex-col gap-4 min-w-0">
                {(ad.signal || ad.signalNote) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {ad.signal && (
                      <span className={`text-[11px] font-bold rounded-full px-2.5 py-1 ${signalTone(ad.signal)}`}>
                        {ad.signal}
                      </span>
                    )}
                    {ad.signalNote && <span className="text-sm text-gray-600">{ad.signalNote}</span>}
                  </div>
                )}

                <div>
                  <SecTitle>Their ad</SecTitle>
                  {ad.headline && (
                    <p className="text-lg font-extrabold text-gray-900 mt-1.5 leading-snug">
                      {ad.headline}
                    </p>
                  )}
                  {ad.body && (
                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed whitespace-pre-line">
                      {ad.body}
                    </p>
                  )}
                  {(ad.cta || ad.landingUrl) && (
                    <p className="text-sm mt-2 flex flex-wrap items-center gap-2">
                      {ad.cta && (
                        <span className="font-bold text-blue-600 border border-blue-100 rounded-lg px-2 py-1 text-xs">
                          {ad.cta}
                        </span>
                      )}
                      {ad.landingUrl && (
                        <a
                          href={ad.landingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all text-xs"
                        >
                          {shortUrl(ad.landingUrl)}
                        </a>
                      )}
                    </p>
                  )}
                </div>

                {(ad.hook || ad.whyItWorks) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {ad.hook && (
                      <div className="rounded-xl bg-gray-50 p-3.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                          Hook{ad.angle ? ` · ${ad.angle}` : ""}
                        </p>
                        <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">{ad.hook}</p>
                      </div>
                    )}
                    {ad.whyItWorks && (
                      <div className="rounded-xl bg-gray-50 p-3.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                          Why it works
                        </p>
                        <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">
                          {ad.whyItWorks}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {ad.estimatedCpr?.range && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-sm text-amber-900 leading-relaxed">
                    <p className="font-bold">
                      estimatedCpr: {ad.estimatedCpr.range}
                      {ad.estimatedCpr.resultType ? ` · ${ad.estimatedCpr.resultType}` : ""}
                    </p>
                    {ad.estimatedCpr.confidence && (
                      <p className="text-xs">{ad.estimatedCpr.confidence} confidence</p>
                    )}
                    {ad.estimatedCpr.basis && <p className="mt-1">{ad.estimatedCpr.basis}</p>}
                  </div>
                )}

                {y && (
                  <div className="rounded-2xl border-2 border-blue-600 p-4">
                    <SecTitle>yourVersion</SecTitle>
                    {y.headline && (
                      <p className="text-lg font-extrabold text-gray-900 mt-2 leading-snug">
                        {y.headline}
                      </p>
                    )}
                    {y.body && (
                      <p className="text-sm text-gray-600 mt-1.5 leading-relaxed whitespace-pre-line">
                        {y.body}
                      </p>
                    )}
                    {y.cta && (
                      <p className="mt-2">
                        <span className="font-bold text-blue-600 border border-blue-100 rounded-lg px-2 py-1 text-xs">
                          {y.cta}
                        </span>
                      </p>
                    )}
                    <div className="mt-3">
                      <CopyButton text={yourText} />
                    </div>
                  </div>
                )}

                {ad.libraryUrl && (
                  <a
                    href={ad.libraryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" /> Open in ad library
                  </a>
                )}
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

// ── section ──────────────────────────────────────────────────────────────────
export default function AdsSection({ data }) {
  const ca = data.competitorAds || {};
  const sum = ca.summary || {};
  const metaAds = ca.meta?.ads || [];
  const googleAds = ca.google?.ads || [];
  const tiktokAds = ca.tiktok?.ads || [];

  const tabs = useMemo(
    () => [
      { key: "meta", label: "Meta", count: sum.metaActiveAds ?? ca.meta?.totalActive ?? metaAds.length, ads: metaAds },
      { key: "google", label: "Google", count: sum.googleAds ?? ca.google?.total ?? googleAds.length, ads: googleAds },
      { key: "tiktok", label: "TikTok", count: sum.tiktokAds ?? tiktokAds.length, ads: tiktokAds },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );

  const [tab, setTab] = useState("meta");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("proven");
  const [openIndex, setOpenIndex] = useState(null);

  const current = tabs.find((t) => t.key === tab);
  const src = current.ads;

  const signalCounts = useMemo(() => {
    const c = {};
    src.forEach((a) => a.signal && (c[a.signal] = (c[a.signal] || 0) + 1));
    return c;
  }, [src]);

  const list = useMemo(
    () =>
      src
        .filter((a) => filter === "All" || a.signal === filter)
        .slice()
        .sort(SORTS[sort]),
    [src, filter, sort],
  );
  const maxDays = Math.max(0, ...src.map((a) => a.daysRunning || 0));

  const channelError = ca[tab]?.error;
  const links = data.adLibraryLinks || {};

  const switchTab = (k) => {
    setTab(k);
    setFilter("All");
    setOpenIndex(null);
  };

  return (
    <Card aria-labelledby="h-wall">
      <CardHead
        title="Ads they are running now"
        sub={
          src.length
            ? `Showing ${list.length} of ${current.count ?? src.length}`
            : undefined
        }
        right={
          <div className="flex bg-gray-100 rounded-xl p-1" role="tablist" aria-label="Platform">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => switchTab(t.key)}
                className={`h-9 px-4 rounded-lg text-sm font-semibold cursor-pointer ${
                  tab === t.key
                    ? "bg-surface text-blue-600 shadow-sm"
                    : "text-gray-600"
                }`}
              >
                {t.label}
                {has(t.count) ? ` ${t.count}` : ""}
              </button>
            ))}
          </div>
        }
      />

      {/* Backend's own error for this channel, verbatim. */}
      {channelError && (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-sm px-4 py-3">
          {channelError}
        </p>
      )}

      {src.length === 0 ? (
        <div className="rounded-xl bg-gray-50 px-5 py-10 text-center">
          <p className="text-sm text-gray-600">
            The backend returned no {current.label} ads for this site.
          </p>
          {links[tab] && (
            <a
              href={links[tab]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-blue-600 hover:underline"
            >
              <ExternalLink className="w-4 h-4" /> Open {current.label} ad library
            </a>
          )}
        </div>
      ) : tab === "google" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-gray-400">
                {["Ad", "Format", "First shown", "Last shown", "Days shown", ""].map((h) => (
                  <th key={h} className="p-2 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {googleAds.map((g) => (
                <tr key={g.id} className="border-t border-gray-100">
                  <td className="p-3 font-semibold text-gray-900">{g.id}</td>
                  <td className="p-3 text-gray-600">{g.format}</td>
                  <td className="p-3 text-gray-600">{g.firstShown}</td>
                  <td className="p-3 text-gray-600">{g.lastShown}</td>
                  <td className="p-3 font-bold text-gray-900">{g.daysShown}</td>
                  <td className="p-3">
                    {g.detailsLink && (
                      <a
                        href={g.detailsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View ad
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap gap-1.5">
              {["All", ...Object.keys(signalCounts)].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`h-8 px-3 rounded-full border text-xs font-semibold cursor-pointer ${
                    filter === f
                      ? "bg-gray-900 border-gray-900 text-white"
                      : "border-gray-200 text-gray-700 bg-surface"
                  }`}
                >
                  {f}
                  {f === "All" ? "" : ` ${signalCounts[f]}`}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-400">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-surface text-sm text-gray-700 px-2"
              >
                <option value="proven">Most proven first</option>
                <option value="days">Longest running</option>
                <option value="new">Newest</option>
                <option value="versions">Most versions</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
            {list.map((a, i) => (
              <AdCard key={a.id ?? i} ad={a} maxDays={maxDays} onOpen={() => setOpenIndex(i)} />
            ))}
          </div>
          <Drawer ads={list} index={openIndex} onIndex={setOpenIndex} onClose={() => setOpenIndex(null)} />
        </>
      )}
    </Card>
  );
}
