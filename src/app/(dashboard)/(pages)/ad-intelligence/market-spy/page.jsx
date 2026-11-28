"use client";

import React, { useState } from "react";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AdsSection from "./_components/AdsSection";
import {
  Assessment,
  Hero,
  LandingPages,
  LaunchesAndGlance,
  Notices,
  SiteCard,
  AudienceDetails,
  Strategy,
} from "./_components/SiteSections";

/**
 * Market Spy (/ad-intelligence/market-spy)
 *
 * POST /competitor-insights → one response drives the whole page. Nothing is
 * inferred or hardcoded here: every figure, label, tag and message on screen
 * is a field of that response (including `dataQuality`, which says whether
 * each field is real, an estimate, an AI assessment or unavailable).
 */

// Values the backend accepts in `country` (it echoes the one it used in
// competitorAds.country; empty means it defaults to ALL).
const COUNTRIES = [
  { value: "", label: "All countries" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
];

export default function MarketSpyPage() {
  const { getCompetitorInsights } = useAuth();

  const [url, setUrl] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const analyze = async (e) => {
    e?.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError("");
    setData(null);

    const res = await getCompetitorInsights({ url: url.trim(), country });
    if (!res.ok) setError(res.message);
    else setData(res.data);
    setLoading(false);
  };

  return (
    <div className="pb-8">
      <div className="max-w-[1220px] mx-auto flex flex-col gap-5">
        {/* Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Market Spy</h1>
            <p className="text-sm text-gray-400">
              Every ad a competitor runs, which ones are working, and your own version in one click
            </p>
          </div>
        </div>

        {/* Search */}
        <form
          onSubmit={analyze}
          className="flex flex-wrap gap-2.5 bg-surface border border-gray-200 rounded-2xl p-2.5"
        >
          <label htmlFor="ms-url" className="sr-only">Competitor website</label>
          <input
            id="ms-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Competitor website, e.g. competitor.com"
            autoComplete="off"
            className="flex-1 basis-[260px] min-w-0 h-12 rounded-xl border border-gray-200 bg-surface px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <label htmlFor="ms-country" className="sr-only">Country</label>
          <select
            id="ms-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="h-12 rounded-xl border border-gray-200 bg-surface px-3.5 text-sm text-gray-800"
          >
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Spy on their ads"}
          </button>
        </form>

        {error && (
          <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-24 bg-surface border border-gray-200 rounded-2xl">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-sm text-gray-600">Fetching their ads and site…</p>
              <p className="text-xs text-gray-400 mt-1">This can take over a minute.</p>
            </div>
          </div>
        )}

        {!data && !loading && !error && (
          <div className="py-24 bg-surface border border-gray-200 rounded-2xl text-center">
            <p className="text-sm font-semibold text-gray-600">Enter a competitor website to get started</p>
          </div>
        )}

        {data && !loading && (
          <>
            <Notices data={data} />
            <Hero data={data} />
            <LaunchesAndGlance data={data} />
            <AdsSection key={`${data.domain}-${data.competitorAds?.country}`} data={data} />
            <Strategy data={data} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <LandingPages data={data} />
              <SiteCard data={data} />
            </div>
            {/* The design ends after the two cards above; the rest of what the
                backend sends is kept here, collapsed. */}
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-blue-600 select-none">
                More insights
              </summary>
              <div className="space-y-4 mt-4">
                <AudienceDetails data={data} />
                <Assessment data={data} />
              </div>
            </details>
            <p className="text-xs text-gray-400">
              {[
                data.competitorAds?.country && `Country: ${data.competitorAds.country}`,
                data.cached !== undefined && `Cached: ${String(data.cached)}`,
                data.tokens_remaining !== undefined && `Tokens remaining: ${data.tokens_remaining}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
