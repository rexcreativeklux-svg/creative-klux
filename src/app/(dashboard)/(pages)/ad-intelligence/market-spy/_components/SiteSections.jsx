"use client";

import React from "react";
import { Check, ExternalLink, Info } from "lucide-react";
import {
  Bullets,
  Card,
  CardHead,
  QualityTag,
  SecTitle,
  has,
  qualityText,
  isEmpty,
  shortUrl,
} from "./shared";

/**
 * Everything on Market Spy except the ad wall. Each block reads straight from
 * the backend response and renders only what the backend actually sent.
 */

const dqOf = (data, key) => data.dataQuality?.[key];

// ── backend notices, verbatim ────────────────────────────────────────────────
export function Notices({ data }) {
  const ca = data.competitorAds || {};
  // The backend repeats the same sentence in adActivity.reason and
  // competitorAds.message — show each distinct message once.
  const msgs = [
    ...new Set(
      [
        ca.message,
        data.adActivity?.reason,
        ca.meta?.error && `Meta: ${ca.meta.error}`,
        ca.google?.error && `Google: ${ca.google.error}`,
        ca.tiktok?.error && `TikTok: ${ca.tiktok.error}`,
        data.fetchError && `Website fetch: ${data.fetchError}`,
      ].filter(Boolean),
    ),
  ];
  if (!msgs.length) return null;
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-1.5">
      {msgs.map((m) => (
        <p key={m} className="text-sm text-amber-900 flex gap-2.5">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="min-w-0">{m}</span>
        </p>
      ))}
    </div>
  );
}

// ── hero ─────────────────────────────────────────────────────────────────────
export function Hero({ data }) {
  const ca = data.competitorAds || {};
  const sum = ca.summary || {};
  const page = ca.meta?.page;
  const name = page?.name || data.name || data.domain;

  const socialDq = dqOf(data, "socialFollowing");
  const adsDq = dqOf(data, "competitorAds");
  const stats = [
    ...Object.entries(data.socialFollowing || {})
      .filter(([, v]) => has(v))
      .map(([k, v]) => [k, v, socialDq]),
    ["Facebook page likes", page?.likes, adsDq],
    ["Instagram followers", page?.igFollowers, adsDq],
    ["Meta ads live", sum.metaActiveAds, adsDq],
    ["Google ads", sum.googleAds, adsDq],
    ["TikTok ads", sum.tiktokAds, adsDq],
    ["Proven ads", sum.provenAds, adsDq],
  ].filter(([, v]) => has(v));

  const links = data.adLibraryLinks || {};
  const social = Object.entries(data.socialLinks || {}).filter(([, v]) => has(v));
  const tech = [...(data.trackingPixels || []), ...(data.techStack || [])];

  return (
    <section
      aria-label="Competitor"
      className="rounded-3xl bg-[#0b1430] text-white p-5 sm:p-6 flex flex-col gap-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-full bg-white text-[#0b1430] font-extrabold text-xl flex items-center justify-center shrink-0">
            {String(name)
              .split(/\s+/)
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold truncate">{name}</h2>
            <p className="text-sm text-[#b9c4e2] break-all">
              {[data.domain, page?.category].filter(Boolean).join(" · ")}
            </p>
            {ca.meta?.matched && (
              <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold rounded-full bg-green-500/15 text-green-300 px-2.5 py-1">
                <Check className="w-3 h-3" />
                Meta page match: {String(ca.meta.matched)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ["meta", "Meta Ad Library"],
            ["google", "Google Ads Transparency"],
            ["tiktok", "TikTok Ad Library"],
          ].map(
            ([k, label]) =>
              links[k] && (
                <a
                  key={k}
                  href={links[k]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-white ${
                    k === "meta"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "border border-white/25 hover:bg-white/10"
                  }`}
                >
                  <ExternalLink className="w-4 h-4" /> {label}
                </a>
              ),
          )}
        </div>
      </div>

      {(data.siteTitle || data.siteDescription) && (
        <div className="text-sm text-[#b9c4e2] leading-relaxed">
          {data.siteTitle && <p className="font-semibold text-white">{data.siteTitle}</p>}
          {data.siteDescription && <p>{data.siteDescription}</p>}
        </div>
      )}

      {stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {stats.map(([label, value, dq]) => (
            <div key={label} className="rounded-2xl bg-white/[0.06] border border-white/10 px-3.5 py-3">
              <small className="block text-xs text-[#a5b4d8] capitalize">{label}</small>
              <b className="block text-[22px] font-extrabold mt-1">{String(value)}</b>
              {dq && <em className="not-italic text-[11px] text-green-300">{qualityText(dq)}</em>}
            </div>
          ))}
        </div>
      )}

      {(tech.length > 0 || social.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#a5b4d8]">
          {tech.length > 0 && <span className="mr-1">On their site:</span>}
          {tech.map((t) => (
            <span key={t} className="bg-white/10 text-white rounded-lg px-2.5 py-1 font-semibold">
              {t}
            </span>
          ))}
          {social.length > 0 && <span className="ml-2 mr-1">Linked from their site:</span>}
          {social.map(([k, v]) => (
            <a
              key={k}
              href={v}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 text-white rounded-lg px-2.5 py-1 font-semibold capitalize hover:bg-white/20"
            >
              {k}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

// ── launches per week + at a glance ──────────────────────────────────────────
function Timeline({ launches }) {
  const W = 600, H = 250, pad = 8;
  const bw = (W - pad * 2) / launches.length;
  const max = Math.max(...launches.map((l) => l.count), 1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="New ads per week" className="w-full h-[250px] block">
      <line x1="0" x2={W} y1={H - 24} y2={H - 24} stroke="var(--color-gray-200)" />
      {launches.map((l, i) => {
        const h = (l.count / max) * (H - 50);
        const x = pad + i * bw + 6;
        const y = H - 24 - h;
        const hot = i >= launches.length - 2;
        const cx = x + (bw - 12) / 2;
        return (
          <g key={`${l.week}-${i}`}>
            <rect x={x} y={y} width={bw - 12} height={Math.max(h, 2)} rx="5" fill={hot ? "#1447e6" : "#c9d6fb"}>
              <title>{`Week of ${l.week}: ${l.count} new ads`}</title>
            </rect>
            {l.count > 0 && (
              <text x={cx} y={y - 6} fontSize="11" textAnchor="middle" fill="var(--color-gray-700)" fontWeight="700">
                {l.count}
              </text>
            )}
            {(i % 2 === 0 || i === launches.length - 1) && (
              <text x={cx} y={H - 6} fontSize="10.5" textAnchor="middle" fill="var(--color-gray-400)">
                {l.week}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// Lists like formats / ctas / countries come as [{ name, count }]. Strings are
// shown as they are.
const nameOf = (x) => (typeof x === "object" && x ? x.name ?? x.domain ?? x.label : x);
const countOf = (x) => (typeof x === "object" && x ? x.count : undefined);
const joinCounts = (arr) =>
  arr.map((x) => `${nameOf(x)}${has(countOf(x)) ? ` ${countOf(x)}` : ""}`).join(" · ");

function Tile({ label, value, note, wide }) {
  return (
    <div className={`rounded-2xl bg-gray-50 px-3.5 py-3 ${wide ? "col-span-2" : ""}`}>
      <small className="block text-xs text-gray-400">{label}</small>
      <b className="block text-xl font-extrabold text-gray-900 mt-1 break-words">{value}</b>
      {note && <span className="text-xs text-gray-600 break-words">{note}</span>}
    </div>
  );
}

export function LaunchesAndGlance({ data }) {
  const ca = data.competitorAds || {};
  const s = ca.summary || {};
  const launches = s.launches || [];
  const formats = s.formats || [];
  const formatTotal = formats.reduce((a, f) => a + (f.count || 0), 0);
  const shades = ["#1447e6", "#7c9bf2", "#c9d6fb"];
  const dq = dqOf(data, "competitorAds");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4">
      <Card aria-labelledby="h-tl">
        <CardHead
          title="New ads launched per week"
          right={<QualityTag dq={dq} />}
        />
        {launches.length ? <Timeline launches={launches} /> : <p className="text-sm text-gray-400">No launch data from the backend.</p>}
      </Card>

      <Card aria-labelledby="h-sum">
        <CardHead title="At a glance" right={<QualityTag dq={dq} />} />
        <div className="grid grid-cols-2 gap-2.5">
          {has(s.newThisWeek) && <Tile label="New this week" value={s.newThisWeek} />}
          <Tile
            label="Average days running"
            value={s.avgDaysRunning ?? "—"}
            note={
              s.longestRunning
                ? `Longest: ${s.longestRunning.days ?? ""}${s.longestRunning.headline ? ` · ${s.longestRunning.headline}` : ""}`
                : undefined
            }
          />
          {has(s.ctas) && (
            <Tile label="Top button" value={nameOf(s.ctas[0])} note={joinCounts(s.ctas)} />
          )}
          {has(s.countries) && (
            <Tile
              label="Countries"
              value={s.countries.map(nameOf).join(", ")}
              note={joinCounts(s.countries)}
            />
          )}
          {has(s.placements) && (
            <Tile label="Placements" value={s.placements.map(nameOf).join(", ")} note={joinCounts(s.placements)} />
          )}
          {has(s.landingDomains) && (
            <Tile label="Landing domains" value={s.landingDomains.map(nameOf).join(", ")} note={joinCounts(s.landingDomains)} />
          )}
          {formatTotal > 0 && (
            <div className="col-span-2 rounded-2xl bg-gray-50 px-3.5 py-3">
              <small className="block text-xs text-gray-400">Format mix</small>
              <div className="flex h-2.5 rounded overflow-hidden mt-2.5">
                {formats.map((f, i) => (
                  <div key={f.name} style={{ width: `${(f.count / formatTotal) * 100}%`, background: shades[i] || "#e2e8f0" }} />
                ))}
              </div>
              <span className="block text-xs text-gray-600 mt-2">
                {formats.map((f) => `${f.name} ${f.count}`).join(" · ")}
              </span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// Shown inside a block the backend sent empty. The only words are the backend's
// own (its competitorAds.message / error fields); with none, it stays blank.
function EmptyNote({ data }) {
  const ca = data.competitorAds || {};
  const msg = ca.message || data.adActivity?.reason || ca.meta?.error;
  return (
    <p className="rounded-xl bg-gray-50 px-4 py-6 text-sm text-gray-500">
      {msg || "—"}
    </p>
  );
}

// ── strategy ─────────────────────────────────────────────────────────────────
export function Strategy({ data }) {
  const st = data.competitorAds?.strategy || {};
  const p = st.patterns || {};
  const nothing =
    isEmpty(st.summary) &&
    isEmpty(p.hooks) && isEmpty(p.offers) && isEmpty(p.angles) &&
    isEmpty(st.gapsForYou) && isEmpty(st.testPlan);

  return (
    <Card aria-labelledby="h-strat">
      <CardHead
        title="How they advertise, and how to beat it"
        right={<QualityTag dq={dqOf(data, "competitorAds")} />}
      />
      {nothing && <EmptyNote data={data} />}
      {st.summary && <p className="text-sm text-gray-700 leading-relaxed">{st.summary}</p>}
      {(has(p.hooks) || has(p.offers) || has(p.angles)) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          {[
            ["Hooks they repeat", p.hooks],
            ["Offers they push", p.offers],
            ["Angles", p.angles],
          ].map(
            ([t, items]) =>
              has(items) && (
                <div key={t} className="rounded-2xl bg-gray-50 p-4">
                  <b className="text-sm text-gray-900">{t}</b>
                  <div className="mt-2"><Bullets items={items} /></div>
                </div>
              ),
          )}
        </div>
      )}
      {(has(st.gapsForYou) || has(st.testPlan)) && (
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] gap-3 mt-3">
          {has(st.gapsForYou) && (
            <div className="rounded-2xl border border-blue-100 p-4">
              <b className="text-sm text-blue-600">Gaps you can take</b>
              <div className="mt-2"><Bullets items={st.gapsForYou} /></div>
            </div>
          )}
          {has(st.testPlan) && (
            <div className="rounded-2xl border border-blue-100 p-4">
              <b className="text-sm text-blue-600">Your test plan</b>
              <ol className="mt-2 space-y-2 list-decimal pl-5 text-xs text-gray-600 leading-relaxed">
                {st.testPlan.map((t, i) => (
                  <li key={i}>
                    <b className="text-gray-900">{t.test}</b>
                    {t.how ? ` — ${t.how}` : ""}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ── landing pages ────────────────────────────────────────────────────────────
export function LandingPages({ data }) {
  const ca = data.competitorAds || {};
  const pages = ca.landingPages || [];
  const takeaways = ca.strategy?.landingPageTakeaways || [];
  return (
    <Card aria-labelledby="h-lp">
      <CardHead
        title="Pages their ads send people to"
        right={<QualityTag dq={dqOf(data, "competitorAds")} />}
      />
      {!pages.length && !takeaways.length && <EmptyNote data={data} />}
      <div className="space-y-2">
        {pages.map((l) => (
          <div key={l.url} className="rounded-xl border border-gray-200 p-3.5">
            <div className="flex justify-between gap-3 text-sm font-semibold text-gray-900">
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all min-w-0">
                {shortUrl(l.url)}
              </a>
              {has(l.adsUsing) && (
                <span className="text-xs text-gray-400 font-medium shrink-0">{l.adsUsing} ads</span>
              )}
            </div>
            {l.headline && <p className="text-xs text-gray-600 mt-1.5">“{l.headline}”</p>}
            {(has(l.offers) || has(l.pixels)) && (
              <p className="text-xs text-gray-600 mt-1">
                {has(l.offers) && `Offers: ${l.offers.join(" · ")}`}
                {has(l.offers) && has(l.pixels) && " · "}
                {has(l.pixels) && `Tracking: ${l.pixels.join(", ")}`}
              </p>
            )}
          </div>
        ))}
      </div>
      {takeaways.length > 0 && (
        <div className="mt-4 rounded-xl bg-gray-50 px-3.5 py-3">
          <Bullets items={takeaways} />
        </div>
      )}
    </Card>
  );
}

// ── website & audience ───────────────────────────────────────────────────────
function Metric({ label, value, change, dq }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <small className="text-xs text-gray-400">{label}</small>
        <QualityTag dq={dq} />
      </div>
      <b className="block text-base font-extrabold text-gray-900 mt-1.5 break-words">{value}</b>
      {change && <span className="text-xs text-gray-600">{change}</span>}
      {dq?.type === "unavailable" && (dq.note || dq.source) && (
        <span className="block text-xs text-gray-400 mt-1">{dq.note || dq.source}</span>
      )}
    </div>
  );
}

function Bar({ label, value, color = "#1447e6" }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-700 w-24 shrink-0 truncate capitalize">{label}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
        <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-9 text-right shrink-0">{value}%</span>
    </div>
  );
}

function Block({ title, dq, children }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <SecTitle>{title}</SecTitle>
        <QualityTag dq={dq} />
      </div>
      {children}
    </div>
  );
}

const CONF = { high: 3, medium: 2, low: 1 };

function SiteTile({ label, value, dq }) {
  const real = dq?.type === "real";
  const level = real ? 3 : CONF[dq?.confidence] || 0;
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <small className="text-xs text-gray-400">{label}</small>
        <QualityTag dq={dq} />
      </div>
      <b className="block text-[17px] font-extrabold text-gray-900 mt-1.5 break-words">{value}</b>
      {level > 0 && (
        <div className="flex gap-[3px] mt-1.5">
          {[1, 2, 3].map((k) => (
            <i
              key={k}
              className={`w-[18px] h-1 rounded ${
                k <= level ? (real ? "bg-green-600" : "bg-amber-500") : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      )}
      {dq?.type === "unavailable" && (dq.note || dq.source) && (
        <span className="block text-xs text-gray-400 mt-1">{dq.note || dq.source}</span>
      )}
    </div>
  );
}

// The six tiles of the design, each filled only from the backend's fields.
export function SiteCard({ data }) {
  const top = data.topCountries?.[0];
  const audience =
    has(data.femalePercent) || has(data.malePercent)
      ? [
          has(data.femalePercent) && `Women ${data.femalePercent}%`,
          has(data.malePercent) && `Men ${data.malePercent}%`,
        ]
          .filter(Boolean)
          .join(" · ")
      : null;
  const tiles = [
    ["Monthly visits", data.visitCount, "visitCount"],
    ["Revenue", data.estimatedRevenue, "estimatedRevenue"],
    ["Audience", audience, "femalePercent"],
    ["Top country", top ? `${top.country} ${top.share}%` : null, "topCountries"],
    ["SEO score", has(data.seoScore) ? `${data.seoScore} / 100` : null, "seoScore"],
    ["Performance score", has(data.performanceScore) ? `${data.performanceScore} / 100` : null, "performanceScore"],
  ];
  return (
    <Card aria-labelledby="h-site">
      <CardHead title="Their website and audience" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {tiles.map(([label, value, key]) => (
          <SiteTile key={key} label={label} value={has(value) ? String(value) : "—"} dq={dqOf(data, key)} />
        ))}
      </div>
      {data.estimateBasis && (
        <p className="text-xs text-gray-400 leading-relaxed mt-4">{data.estimateBasis}</p>
      )}
    </Card>
  );
}

export function AudienceDetails({ data }) {
  const devices = [
    ["Desktop", data.desktopShare, "desktopShare"],
    ["Mobile", data.mobileShare, "mobileShare"],
    ["Tablet", data.tabletShare, "tabletShare"],
  ].filter(([, v]) => has(v));
  const sources = Object.entries(data.trafficSources || {}).filter(([, v]) => has(v));
  const profile = [
    ["Household", data.householdSize, "householdSize"],
    ["Income", data.incomeLevel, "incomeLevel"],
    ["Education", data.educationLevel, "educationLevel"],
  ].filter(([, v]) => has(v));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {devices.length > 0 && (
          <Card>
            <Block title="Device share" dq={dqOf(data, "desktopShare")}>
              <div className="space-y-3">
                {devices.map(([l, v]) => <Bar key={l} label={l} value={v} />)}
              </div>
            </Block>
          </Card>
        )}
        {sources.length > 0 && (
          <Card>
            <Block title="Traffic sources" dq={dqOf(data, "trafficSources")}>
              <div className="space-y-3">
                {sources.map(([l, v]) => <Bar key={l} label={l} value={v} />)}
              </div>
            </Block>
          </Card>
        )}
        {has(data.topCountries) && (
          <Card>
            <Block title="Top countries" dq={dqOf(data, "topCountries")}>
              <div className="space-y-3">
                {data.topCountries.map((c) => <Bar key={c.country} label={c.country} value={c.share} />)}
              </div>
            </Block>
          </Card>
        )}
        {has(data.ageGroups) && (
          <Card>
            <Block title="Age" dq={dqOf(data, "ageGroups")}>
              <div className="space-y-3">
                {data.ageGroups.map((g) => <Bar key={g.age} label={g.age} value={g.percent} />)}
              </div>
            </Block>
          </Card>
        )}
        {(has(data.malePercent) || has(data.femalePercent)) && (
          <Card className="md:col-span-2">
            <Block title="Gender" dq={dqOf(data, "malePercent")}>
              <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                {has(data.malePercent) && <span>{data.malePercent}% Male</span>}
                {has(data.femalePercent) && <span>{data.femalePercent}% Female</span>}
              </div>
              <div className="flex rounded-full overflow-hidden h-8 text-[11px] font-bold text-white">
                {has(data.malePercent) && (
                  <div className="flex items-center justify-center bg-[#1e3a8a]" style={{ width: `${data.malePercent}%` }}>Male</div>
                )}
                {has(data.femalePercent) && (
                  <div className="flex items-center justify-center bg-blue-600" style={{ width: `${data.femalePercent}%` }}>Female</div>
                )}
              </div>
            </Block>
          </Card>
        )}
      </div>

      {(profile.length > 0 || has(data.interests) || data.purchaseBehavior || has(data.contentAffinities) || has(data.topKeywords)) && (
        <Card>
          <CardHead title="Audience profile" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {profile.map(([l, v, k]) => (
              <Block key={l} title={l} dq={dqOf(data, k)}>
                <p className="text-sm text-gray-700 leading-relaxed">{v}</p>
              </Block>
            ))}
            {data.purchaseBehavior && (
              <Block title="Purchase behavior">
                <p className="text-sm text-gray-700 leading-relaxed">{data.purchaseBehavior}</p>
              </Block>
            )}
            {has(data.interests) && (
              <Block title="Interests">
                <div className="flex flex-wrap gap-1.5">
                  {data.interests.map((t) => (
                    <span key={t} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full">{t}</span>
                  ))}
                </div>
              </Block>
            )}
            {has(data.contentAffinities) && (
              <Block title="Content affinities">
                <div className="flex flex-wrap gap-1.5">
                  {data.contentAffinities.map((t) => (
                    <span key={t} className="text-xs px-2.5 py-1 bg-pink-50 text-pink-700 border border-pink-100 rounded-full">{t}</span>
                  ))}
                </div>
              </Block>
            )}
            {has(data.topKeywords) && (
              <Block title="Top keywords" dq={dqOf(data, "topKeywords")}>
                <div className="space-y-1.5">
                  {data.topKeywords.map((k, i) => (
                    <p key={k} className="text-sm text-gray-700">
                      <span className="text-[11px] font-black text-blue-600 mr-2">#{i + 1}</span>{k}
                    </p>
                  ))}
                </div>
              </Block>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── AI assessment ────────────────────────────────────────────────────────────
export function Assessment({ data }) {
  const any =
    data.marketPositionSummary || data.threatLevel ||
    has(data.strengths) || has(data.weaknesses) || has(data.opportunityGaps);
  if (!any) return null;
  return (
    <Card>
      <CardHead
        title="Assessment"
        right={<QualityTag dq={dqOf(data, "marketPositionSummary")} />}
      />
      {data.marketPositionSummary && (
        <p className="text-sm text-gray-700 leading-relaxed">{data.marketPositionSummary}</p>
      )}
      {data.threatLevel && (
        <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3">
          <SecTitle>Threat level</SecTitle>
          <p className="text-sm text-gray-800 mt-1 leading-relaxed">{data.threatLevel}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {has(data.strengths) && (
          <div>
            <p className="text-sm font-bold text-green-600 mb-2.5">Strengths</p>
            <Bullets items={data.strengths} markerClass="text-green-500" />
          </div>
        )}
        {has(data.weaknesses) && (
          <div>
            <p className="text-sm font-bold text-red-500 mb-2.5">Weaknesses</p>
            <Bullets items={data.weaknesses} markerClass="text-red-400" />
          </div>
        )}
        {has(data.opportunityGaps) && (
          <div>
            <p className="text-sm font-bold text-blue-600 mb-2.5">Opportunity gaps</p>
            <Bullets items={data.opportunityGaps} marker="→" markerClass="text-blue-500" />
          </div>
        )}
      </div>
    </Card>
  );
}
