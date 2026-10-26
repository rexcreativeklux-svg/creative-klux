"use client";

/**
 * /statistics — creation activity at a glance.
 * The data half of the old overview page, extracted to its own page when "/"
 * became the create-hero home: the stat-cards row (designs by category,
 * platforms, published posts) with the activity chart full-width below it.
 * The chart's header dropdown switches the period (today / weekly / monthly).
 */

import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

import DashboardStats from "@/app/(components)/DashboardStats";
import ActivityChart from "@/app/(components)/ActivityChart";
import { SkeletonChart } from "@/app/(components)/skeletons/PageSkeleton";
import { fetchLivePostsFromConnectedAccounts } from "@/(lib)/integration";

export default function Statistics() {
  const {
    activeBrandId,
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

  /* ── connected platforms (unique, from integrations) and published posts
        (the social posts the backend lists for them — the same source the
        publishing pages read) ── */
  useEffect(() => {
    let alive = true;
    (async () => {
      let data;
      try {
        data = await fetchIntegrations?.();
      } catch (err) {
        if (alive) toast.error(err.message);
        return;
      }
      if (!alive) return;
      const arr = Array.isArray(data) ? data : [];
      const unique = new Set(arr.map((i) => i?.platform).filter(Boolean));
      setPlatformCount(unique.size);
      try {
        const rows = await fetchLivePostsFromConnectedAccounts(arr);
        if (!alive) return;
        setPublishedCount(
          rows.filter((p) => p.type === "social" && p.status === "published")
            .length,
        );
      } catch {
        if (alive) setPublishedCount(0);
      }
    })();
    return () => { alive = false; };
  }, [fetchIntegrations, activeBrandId]);

  /* ── stats derived from designs ── */
  const statsByCategory = {
    ads:          designs.filter((d) => (d.type || "").toLowerCase() === "ads").length,
    social:       designs.filter((d) => (d.type || "").toLowerCase() === "social").length,
    designer:     designs.filter((d) => ["card", "banner", "design", "designer"].includes((d.type || "").toLowerCase())).length,
    magic_studio: designs.filter((d) => ["magic", "magic_studio"].includes((d.type || "").toLowerCase())).length,
  };

  const isLoading = brandsLoading || designsLoading;

  return (
    <div
      className="space-y-5 bg-page"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >

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

      {/* ── Activity chart — full width, taller than its overview-card days ──
          While the designs are in flight the chart has nothing to plot, so it
          used to render as an empty panel: indistinguishable from a brand with
          no activity. The skeleton says "still loading" instead, and holds the
          same 420px so the page doesn't resize under the user. */}
      <div className="h-[420px]">
        {isLoading ? (
          <SkeletonChart height={280} className="h-full rounded-2xl" />
        ) : (
          <ActivityChart designs={designs} />
        )}
      </div>
    </div>
  );
}
