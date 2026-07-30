"use client";

/**
 * /statistics — creation activity at a glance.
 * The data half of the old overview page, extracted to its own page when "/"
 * became the create-hero home: the stat-cards row (designs by category,
 * platforms, published posts) with the activity chart full-width below it.
 * The chart's header dropdown switches the period (today / weekly / monthly).
 */

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

import DashboardStats from "@/app/(components)/DashboardStats";
import ActivityChart from "@/app/(components)/ActivityChart";
import { getPublishedPosts } from "@/(lib)/integration";

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

      {/* ── Activity chart — full width, taller than its overview-card days ── */}
      <div className="h-[420px]">
        <ActivityChart designs={designs} />
      </div>
    </div>
  );
}
