"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

import DashboardStats from "@/app/(components)/DashboardStats";
import ActivityChart from "@/app/(components)/ActivityChart";
import QuickCreate from "@/app/(components)/QuickCreate";
import DashboardRecentProjects from "@/app/(components)/DashboardRecentProjects";
import { getPublishedPosts } from "@/(lib)/integration";

export default function Dashboard() {
  const {
    user,
    activeBrand,
    activeBrandId,
    brands,
    brandsLoading,
    myImages,
    teams,
    fetchDesigns,
    fetchIntegrations,
  } = useAuth();

  const [designs, setDesigns]         = useState([]);
  const [designsLoading, setDesignsLoading] = useState(true);

  /* Connected platforms (unique) + published posts — extra stat sources that
     don't come from `designs`. Loaded independently so the design stats aren't
     blocked on them. */
  const [platformCount, setPlatformCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);

  /* ── fetch designs for active brand ── */
  const loadDesigns = useCallback(async () => {
    if (!activeBrandId) {
      setDesigns([]);
      setDesignsLoading(false);
      return;
    }
    setDesignsLoading(true);
    try {
      const result = await fetchDesigns(50);
      const arr = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];
      setDesigns(arr);
    } catch {
      setDesigns([]);
    } finally {
      setDesignsLoading(false);
    }
  }, [fetchDesigns, activeBrandId]);

  useEffect(() => { loadDesigns(); }, [loadDesigns]);

  /* ── connected platforms: count unique platforms from integrations ── */
  useEffect(() => {
    let alive = true;
    (async () => {
      const data = await fetchIntegrations?.();
      if (!alive) return;
      const arr = Array.isArray(data) ? data : [];
      const unique = new Set(arr.map((i) => i?.platform).filter(Boolean));
      setPlatformCount(unique.size);
    })();
    return () => { alive = false; };
  }, [fetchIntegrations]);

  /* ── published posts: count "published" entries (localStorage-backed, same
        source the social/ads publishing pages read) ── */
  useEffect(() => {
    try {
      const posts = getPublishedPosts() || [];
      setPublishedCount(posts.filter((p) => p?.status === "published").length);
    } catch {
      setPublishedCount(0);
    }
  }, []);

  /* ── stats derived from designs ── */
  const statsByCategory = {
    ads:          designs.filter((d) => (d.type || "").toLowerCase() === "ads").length,
    social:       designs.filter((d) => (d.type || "").toLowerCase() === "social").length,
    designer:     designs.filter((d) => ["card", "banner", "design", "designer"].includes((d.type || "").toLowerCase())).length,
    magic_studio: designs.filter((d) => ["magic", "magic_studio"].includes((d.type || "").toLowerCase())).length,
  };

  const isLoading = brandsLoading || designsLoading;
  const firstName = user?.name?.split(" ")?.[0] || "there";

  /* ── latest four designs (newest first) ── */
  const recentDesigns = [...designs]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 4);

  return (
    <div
      className="space-y-5 bg-page"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >

      {/* ── Welcome header ── */}
      <div className="flex items-start justify-between">
        <div>
          {/* <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Dashboard</p> */}
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {/* {activeBrand
              ? <>Viewing <span className="font-semibold text-gray-700">{activeBrand.name}</span></>
              : brands.length > 0
                ? "Select a brand to see your designs"
                : "Here's your CreativeKlux overview"
            } */}

            Here's your CreativeKlux overview
          </p>
        </div>

        {/* <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadDesigns}
            disabled={isLoading}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition cursor-pointer disabled:opacity-40"
          >
            {isLoading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <RefreshCw className="w-4 h-4" />
            }
          </button>

          <Link
            href="/studio/select"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:scale-105 duration-200"
          >
            <Plus className="w-4 h-4" /> New Creative
          </Link>
        </div> */}
      </div>

      {/* ── No active brand notice ── */}
      {!activeBrand && !brandsLoading && brands.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-sm">
          <span className="text-amber-500">⚠</span>
          <p className="text-amber-700 font-medium">
            Select a brand from the sidebar to see brand-specific designs and stats.
          </p>
        </div>
      )}

      {/* ── Stats row ── */}
      <DashboardStats
        statsByCategory={statsByCategory}
        imageCount={myImages?.length ?? 0}
        teamCount={teams?.length ?? 0}
        magicCount={statsByCategory.magic_studio}
        platformCount={platformCount}
        publishedCount={publishedCount}
        isLoading={isLoading}
      />

      {/* ── Activity chart + Quick Create ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <ActivityChart designs={designs} />
        </div>
        <div>
          <QuickCreate />
        </div>
      </div>

      {/* ── Recent designs ── */}
      <DashboardRecentProjects
        designs={recentDesigns}
        isLoading={isLoading}
      />
    </div>
  );
}