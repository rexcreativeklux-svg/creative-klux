"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
  Trash2,
  Filter,
  Search,
  X,
} from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
  addMonths,
  subMonths,
} from "date-fns";
import {
  getPublishedPosts,
  deletePostFromPlatform,
  fetchLivePostsFromConnectedAccounts,
} from "../../../../../(lib)/integration";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Link from "next/link";

const PLATFORM_META = {
  facebook: { label: "FB", emoji: "🔵" },
  instagram: { label: "IG", emoji: "📸" },
  meta_ads: { label: "Meta", emoji: "📢" },
  google_ads: { label: "G.Ads", emoji: "🔍" },
  tiktok: { label: "TikTok", emoji: "🎵" },
  tiktok_ads: { label: "TT.Ads", emoji: "🎯" },
  linkedin: { label: "LI", emoji: "💼" },
  twitter: { label: "X", emoji: "🐦" },
  youtube: { label: "YT", emoji: "▶️" },
  pinterest: { label: "PIN", emoji: "📌" },
  pinterest_ads: { label: "PIN.Ads", emoji: "🎯" },
  linkedin_ads: { label: "LI.Ads", emoji: "📊" },
  snapchat_ads: { label: "Snap.Ads", emoji: "💥" },
};

const STATUS_BORDER = {
  published: "border-l-green-500",
  scheduled: "border-l-blue-500",
  failed: "border-l-red-500",
};

const STATUS_BADGE = {
  published: "bg-green-100 text-green-700",
  scheduled: "bg-blue-100 text-blue-700",
  failed: "bg-red-100 text-red-600",
};

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "scheduled", label: "Scheduled" },
  { key: "failed", label: "Failed" },
];

function PostPill({ post, onDelete }) {
  const meta = PLATFORM_META[post.platform] || {
    label: post.platform,
    emoji: "🌐",
  };
  const borderColor = STATUS_BORDER[post.status] || "border-l-gray-300";
  return (
    <div
      className={
        "group flex cursor-pointer items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] border-l-2 bg-surface hover:bg-gray-50 transition-all cursor-default " +
        borderColor
      }
    >
      <span>{meta.emoji}</span>
      <span className="text-gray-700 truncate flex-1 min-w-0">
        {post.project_title}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 cursor-pointer group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity ml-auto shrink-0"
      >
        <Trash2 className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}

export default function AdsContentCalendar() {
  const typeLabel = "Ads";
  const matchType = "ad";

  // AuthContext does NOT expose `integrations` — fetch them ourselves (the old
  // `const { integrations } = useAuth()` was always undefined → no live ads ever).
  const { fetchIntegrations, updateIntegration } = useAuth();
  const [integrations, setIntegrations] = useState([]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [allPosts, setAllPosts] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);

  // Filters (mirror the Publishing page): status / platform / free-text search.
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [search, setSearch] = useState("");

  const reload = useCallback(() => setAllPosts(getPublishedPosts()), []);

  const fetchLive = useCallback(async () => {
    try {
      const ints = (await fetchIntegrations()) || [];
      setIntegrations(ints);
      const livePosts = await fetchLivePostsFromConnectedAccounts(ints, {
        onTokenRotated: (id, rt) =>
          updateIntegration(id, { refresh_token: rt }),
      });

      // Live (Facebook/Meta) is authoritative for status. Keep a local post ONLY when
      // it's no longer reported live, and never trust a local 'scheduled'.
      const liveIds = new Set(livePosts.map((p) => p.id));
      const local = getPublishedPosts();
      const localOnly = local.filter(
        (p) => !liveIds.has(p.id) && p.status !== "scheduled",
      );

      const byId = new Map();
      [...livePosts, ...localOnly].forEach((p) => {
        if (!byId.has(p.id)) byId.set(p.id, p);
      });
      const all = [...byId.values()];

      localStorage.setItem(
        "creativeklux_published_posts",
        JSON.stringify(all.filter((p) => p.status !== "scheduled")),
      );
      setAllPosts(all);
    } catch {
      reload();
    }
  }, [fetchIntegrations, reload]);

  useEffect(() => {
    fetchLive();
  }, [fetchLive]);

  const posts = allPosts.filter((p) => p.type === matchType);

  // Platform options come from what's actually present, so the dropdown never lists empties.
  const platformOptions = useMemo(
    () => [...new Set(posts.map((p) => p.platform))],
    [posts],
  );

  // Per-status counts (over the unfiltered set) for the tab badges.
  const statusCounts = useMemo(
    () => ({
      all: posts.length,
      published: posts.filter((p) => p.status === "published").length,
      scheduled: posts.filter((p) => p.status === "scheduled").length,
      failed: posts.filter((p) => p.status === "failed").length,
    }),
    [posts],
  );

  // Apply status / platform / search filters — the calendar grid renders from this set.
  const filteredPosts = useMemo(() => {
    let result = posts;
    if (statusFilter !== "all")
      result = result.filter((p) => p.status === statusFilter);
    if (platformFilter !== "all")
      result = result.filter((p) => p.platform === platformFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          (p.project_title || "").toLowerCase().includes(q) ||
          (p.caption || "").toLowerCase().includes(q),
      );
    }
    return result;
  }, [posts, statusFilter, platformFilter, search]);

  const handleDelete = async (post) => {
    await deletePostFromPlatform(post, integrations ?? []);
    await fetchLive(); // re-fetch (keeps live posts; reload() would drop them)
    toast.success("Ad removed");
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getPostsForDay = (day) =>
    filteredPosts.filter((p) => {
      const d = p.status === "scheduled" ? p.scheduled_at : p.published_at;
      return d && isSameDay(new Date(d), day);
    });

  const selectedDayPosts = selectedDay ? getPostsForDay(selectedDay) : [];
  const totalScheduled = filteredPosts.filter(
    (p) => p.status === "scheduled",
  ).length;
  const totalPublished = filteredPosts.filter(
    (p) => p.status === "published",
  ).length;

  return (
    <div className="">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {typeLabel} Calendar
          </h1>
          <p className="text-gray-500 text-sm">
            {totalScheduled} scheduled · {totalPublished} published
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />{" "}
            Published
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block ml-2" />{" "}
            Scheduled
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block ml-2" />{" "}
            Failed
          </div>
          <Link href="/creatives">
            <button
              className="inline-flex items-center cursor-pointer hover:scale-95 gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
              style={{ background: "#003dda" }}
            >
              <Plus className="w-3.5 h-3.5" /> New Ad
            </button>
          </Link>
        </div>
      </div>

      {/* ── Month nav ── */}
      <div className="flex items-center gap-4 mb-4">
        <button
          className="h-8 w-8 flex cursor-pointer hover:scale-95 items-center justify-center rounded-lg border border-gray-200 bg-surface text-gray-600 hover:bg-gray-50 transition-all duration-200"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="font-semibold text-gray-900 text-lg min-w-[160px] text-center">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <button
          className="h-8 w-8 flex cursor-pointer hover:scale-95 items-center justify-center rounded-lg border border-gray-200 bg-surface text-gray-600 hover:bg-gray-50 transition-colors"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          className="text-xs text-gray-500 hover:text-gray-800 ml-2 transition-colors"
          onClick={() => setCurrentMonth(new Date())}
        >
          Today
        </button>
      </div>

      {/* ── Status Tabs (matches the Publishing page) ── */}
      {posts.length > 0 && (
        <div className="flex items-center border-b border-gray-200 bg-surface rounded-t-xl px-2 shadow-sm">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === tab.key
                  ? "border-[#003dda] text-[#003dda]"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
              }`}
            >
              {tab.label}
              <span
                className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                style={
                  statusFilter === tab.key
                    ? { backgroundColor: "#003dda", color: "#fff" }
                    : { backgroundColor: "#f3f4f6", color: "#6b7280" }
                }
              >
                {statusCounts[tab.key]}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Filter Bar (matches the Publishing page) ── */}
      {posts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-surface border-x border-b border-gray-200 rounded-b-xl mb-6 shadow-sm">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 h-9">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-transparent text-xs text-gray-700 outline-none pr-1 cursor-pointer"
            >
              <option value="all">All Platforms</option>
              <optgroup label="── Ad Platforms">
                {platformOptions.map((p) => {
                  const m = PLATFORM_META[p] || { emoji: "🌐" };
                  const name = p
                    .split("_")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ");
                  return (
                    <option key={p} value={p}>
                      {m.emoji} {name}
                    </option>
                  );
                })}
              </optgroup>
            </select>
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or caption…"
              className="w-full pl-8 pr-8 h-9 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#003dda] transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <span className="text-xs text-gray-400 ml-auto">
            {filteredPosts.length} result{filteredPosts.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Calendar grid ── */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-gray-200 bg-surface overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div
                  key={d}
                  className="py-2 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="grid grid-cols-7">
              {days.map((day, idx) => {
                const dayPosts = getPostsForDay(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const inMonth = isSameMonth(day, currentMonth);
                const todayDay = isToday(day);

                return (
                  <div
                    key={idx}
                    onClick={() =>
                      setSelectedDay(isSameDay(day, selectedDay) ? null : day)
                    }
                    className={
                      "min-h-[90px] p-1.5 border-b cursor-pointer border-r border-gray-100 transition-colors " +
                      (!inMonth ? "opacity-30 " : "") +
                      (isSelected ? "bg-blue-50 " : "hover:bg-gray-50 ") +
                      (idx % 7 === 6 ? "border-r-0" : "")
                    }
                  >
                    <div
                      className={
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1 ml-auto " +
                        (todayDay ? "text-white" : "text-gray-700")
                      }
                      style={todayDay ? { background: "#003dda" } : {}}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5">
                      {dayPosts.slice(0, 3).map((post) => (
                        <PostPill
                          key={post.id}
                          post={post}
                          onDelete={() => handleDelete(post)}
                        />
                      ))}
                      {dayPosts.length > 3 && (
                        <p className="text-[9px] text-gray-400 px-1">
                          +{dayPosts.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Day detail panel ── */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-gray-200 bg-surface p-4 sticky top-6">
            {selectedDay ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDays
                    className="w-4 h-4"
                    style={{ color: "#003dda" }}
                  />
                  <h3 className="font-semibold text-gray-800 text-sm">
                    {format(selectedDay, "EEE, MMM d")}
                  </h3>
                </div>
                {selectedDayPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-gray-400">No ads on this day</p>
                    <Link href="/creatives">
                      <button className="mt-3 inline-flex cursor-pointer items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-xs text-gray-600 bg-surface hover:bg-gray-50 transition-colors">
                        <Plus className="w-3 h-3" /> Schedule an ad
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDayPosts.map((post) => {
                      const meta = PLATFORM_META[post.platform] || {
                        emoji: "🌐",
                        label: post.platform,
                      };
                      const dateStr =
                        post.status === "scheduled"
                          ? post.scheduled_at
                          : post.published_at;
                      const badge =
                        STATUS_BADGE[post.status] ||
                        "bg-gray-100 text-gray-600";
                      return (
                        <div
                          key={post.id}
                          className="rounded-lg border border-gray-100 p-3 space-y-2"
                        >
                          {post.image_url && (
                            <img
                              src={post.image_url}
                              alt=""
                              className="w-full h-24 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800 truncate">
                                {post.project_title}
                              </p>
                              {post.caption && (
                                <p className="text-[10px] text-gray-400 truncate mt-0.5">
                                  {post.caption}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDelete(post)}
                              className="text-red-300 hover:text-red-500 shrink-0 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span
                              className={
                                "text-[10px] font-medium px-1.5 py-0.5 rounded-full " +
                                badge
                              }
                            >
                              {post.status}
                            </span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              {meta.emoji}
                              {dateStr && format(new Date(dateStr), "h:mm a")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10">
                <CalendarDays className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">
                  Click a day to see its ads
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
