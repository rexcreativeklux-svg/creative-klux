"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
  Trash2,
  Filter,
  Search,
  X,
  ExternalLink,
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
  deletePostFromPlatform,
  platformSupportsDelete,
  fetchLivePostsFromConnectedAccounts,
  getPostStats,
  POST_STATS_PLATFORMS,
} from "../../../../../(lib)/integration";
import PostInsightsPanel from "@/app/(components)/content/PostInsightsPanel";
import SocialPageActions from "@/app/(components)/content/SocialPageActions";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Link from "next/link";
import Drawer from "@/app/(components)/ui/Drawer";
import { useSocialPlatform } from "@/app/(components)/content/socialPlatformScope";
import ConfirmDialog from "@/app/(components)/ConfirmDialog";
import { CalendarSkeleton } from "@/app/(components)/skeletons/ContentSectionSkeletons";

// `label` is the abbreviation the dense calendar pills use; `name` is the full
// one, for prose like the delete confirmation.
const PLATFORM_META = {
  facebook: { label: "FB", name: "Facebook", emoji: "🔵" },
  instagram: { label: "IG", name: "Instagram", emoji: "📸" },
  meta_ads: { label: "Meta", name: "Meta Ads", emoji: "📢" },
  google_ads: { label: "G.Ads", name: "Google Ads", emoji: "🔍" },
  tiktok: { label: "TikTok", name: "TikTok", emoji: "🎵" },
  tiktok_ads: { label: "TT.Ads", name: "TikTok Ads", emoji: "🎯" },
  linkedin: { label: "LI", name: "LinkedIn", emoji: "💼" },
  twitter: { label: "X", name: "X", emoji: "🐦" },
  youtube: { label: "YT", name: "YouTube", emoji: "▶️" },
  pinterest: { label: "PIN", name: "Pinterest", emoji: "📌" },
};

// Delete is only offered where the backend can really delete the post.
function deleteMessage(post) {
  const title = post.project_title || "Untitled";
  const name = PLATFORM_META[post.platform]?.name || post.platform;
  return `“${title}” will be deleted from ${name}. This can't be undone.`;
}

const canDelete = (post) =>
  !!post.post_id && platformSupportsDelete(post.platform);

const STATUS_BORDER = {
  published: "border-l-green-500",
  scheduled: "border-l-blue-500",
};

const STATUS_BADGE = {
  published: "bg-green-100 text-green-700",
  scheduled: "bg-blue-100 text-blue-700",
};

// "Scheduled" is a post the platform itself reports as scheduled.
const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "scheduled", label: "Scheduled" },
];

function PostPill({ post, onDelete, onSelect, selected }) {
  const meta = PLATFORM_META[post.platform] || {
    label: post.platform,
    emoji: "🌐",
  };
  const borderColor = STATUS_BORDER[post.status] || "border-l-gray-300";
  return (
    <div
      onClick={(e) => {
        e.stopPropagation(); // the day cell's own click toggles the day
        onSelect?.();
      }}
      className={
        "group flex cursor-pointer items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] border-l-2 transition-all " +
        (selected ? "bg-blue-100 ring-1 ring-blue-300 " : "bg-surface hover:bg-gray-50 ") +
        borderColor
      }
    >
      <span>{meta.emoji}</span>
      <span className="text-gray-700 truncate flex-1 min-w-0">
        {post.project_title}
      </span>
      {canDelete(post) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 cursor-pointer group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity ml-auto shrink-0"
        >
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}

export default function SocialContentCalendar() {
  const matchType = "social";
  // The network picked in the section sidebar (?platform=), or every network.
  const { platform: scope, network, scoped, inScope } = useSocialPlatform();
  const typeLabel = network?.label ?? "Social";

  const { fetchIntegrations, activeBrandId } = useAuth();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [allPosts, setAllPosts] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  // The post clicked in the grid — highlighted in the details panel.
  const [selectedPostId, setSelectedPostId] = useState(null);
  const closePanel = () => {
    setSelectedDay(null);
    setSelectedPostId(null);
  };

  // The post opened in the insights panel — the same panel Publishing opens.
  // Kept after close so the panel can slide out with its content.
  const [detailsId, setDetailsId] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statsLoadingId, setStatsLoadingId] = useState(null);
  const [integrations, setIntegrations] = useState([]);

  // The post the trash icon armed — deleting is irreversible, so it waits on a confirm.
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Filters (mirror the Publishing page): status / platform / free-text search.
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [search, setSearch] = useState("");

  // An empty month grid is indistinguishable from a month with nothing posted,
  // so the page holds a skeleton until the backend has answered. Later
  // refetches (after a delete) keep the grid up.
  // Ready means "loaded for this brand and network" — switching either goes
  // back to the skeleton instead of showing the old answer as an empty month.
  const loadKey = `${activeBrandId ?? ""}|${scope}`;
  const [loadedKey, setLoadedKey] = useState(null);
  const latestKey = useRef(loadKey);
  useEffect(() => {
    latestKey.current = loadKey;
  }, [loadKey]);
  const loading = loadedKey !== loadKey;

  // A brand switch clears the previous brand's month.
  useEffect(() => {
    setAllPosts([]);
  }, [activeBrandId]);

  // The posts, exactly as the backend lists them. Shared for a couple of
  // minutes across the section's pages (see requestCache); `fresh` (Refresh,
  // a new post) asks the backend again.
  const [refreshing, setRefreshing] = useState(false);
  const fetchLive = useCallback(async ({ fresh = false } = {}) => {
    const key = loadKey;
    setRefreshing(true);
    try {
      const ints = (await fetchIntegrations({ fresh })) || [];
      setIntegrations(ints);
      // One network's connection when one is picked in the sidebar.
      const rows = await fetchLivePostsFromConnectedAccounts(
        scoped ? ints.filter((i) => i.platform === scope) : ints,
        { fresh },
      );
      if (latestKey.current !== key) return; // reader moved on
      setAllPosts(rows);
      if (rows.errors?.length) toast.error(rows.errors.join(" · "));
    } catch (err) {
      toast.error(err.message || "Couldn't load posts");
    } finally {
      setRefreshing(false);
      setLoadedKey(key);
    }
  }, [fetchIntegrations, scoped, scope, loadKey]);

  useEffect(() => {
    fetchLive();
  }, [fetchLive, activeBrandId]);

  // Only the picked network's rows, even before its refetch lands.
  const posts = allPosts.filter((p) => p.type === matchType && inScope(p.platform));
  // The in-page platform dropdown only applies across all networks.
  const activePlatformFilter = scoped ? "all" : platformFilter;

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
    }),
    [posts],
  );

  // Apply status / platform / search filters — the calendar grid renders from this set.
  const filteredPosts = useMemo(() => {
    let result = posts;
    if (statusFilter !== "all")
      result = result.filter((p) => p.status === statusFilter);
    if (activePlatformFilter !== "all")
      result = result.filter((p) => p.platform === activePlatformFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          (p.project_title || "").toLowerCase().includes(q) ||
          (p.caption || "").toLowerCase().includes(q),
      );
    }
    return result;
  }, [posts, statusFilter, activePlatformFilter, search]);

  // Open a post's insights. The calendar doesn't load every post's numbers up
  // front, so this one's are fetched from the backend as it opens.
  const openPost = async (post) => {
    setSelectedPostId(post.id);
    setDetailsId(post.id);
    setDetailsOpen(true);
    if (
      !post.post_id ||
      post.stats?.last_updated ||
      !POST_STATS_PLATFORMS.includes(post.platform)
    )
      return;
    setStatsLoadingId(post.id);
    try {
      const stats = await getPostStats({
        platform: post.platform,
        post_id: post.post_id,
        brand_id: activeBrandId,
      });
      setAllPosts((rows) =>
        rows.map((p) =>
          p.id === post.id
            ? { ...p, stats: { ...stats, last_updated: new Date().toISOString() } }
            : p,
        ),
      );
    } catch (err) {
      toast.error(`Couldn't load stats: ${err.message}`);
    } finally {
      setStatsLoadingId(null);
    }
  };

  const handleDelete = async () => {
    const post = pendingDelete;
    if (!post) return;
    setDeleting(true);
    try {
      await deletePostFromPlatform(post, activeBrandId);
      await fetchLive();
      toast.success("Post deleted");
    } catch (err) {
      toast.error(err.message || "Couldn't delete the post");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
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

  // The drawer stays mounted for its exit animation after selectedDay is
  // cleared, so it renders the last picked day rather than sliding out blank.
  const [lastDay, setLastDay] = useState(null);
  if (selectedDay && selectedDay !== lastDay) setLastDay(selectedDay);
  const panelDay = selectedDay || lastDay;
  const selectedDayPosts = panelDay ? getPostsForDay(panelDay) : [];
  const totalScheduled = filteredPosts.filter(
    (p) => p.status === "scheduled",
  ).length;
  const totalPublished = filteredPosts.filter(
    (p) => p.status === "published",
  ).length;

  // Match the number of week rows the real grid is about to draw, so the page
  // doesn't grow by a row's height when the posts land.
  if (loading) return <CalendarSkeleton weeks={days.length / 7} />;

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
          </div>
          <SocialPageActions
            onRefresh={({ fresh }) => fetchLive({ fresh })}
            refreshing={refreshing}
          />
        </div>
      </div>

      {/* ── Month nav ── */}
      {/* Arrows stay square (shrink-0) and the month label only reserves its
          full 160px from sm up — the four controls together are wider than a
          small phone otherwise. */}
      <div className="flex items-center gap-2 sm:gap-4 mb-4">
        <button
          className="h-8 w-8 shrink-0 flex cursor-pointer hover:scale-95 items-center justify-center rounded-lg border border-gray-200 bg-surface text-gray-600 hover:bg-gray-50 transition-all duration-200"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="font-semibold text-gray-900 text-lg min-w-30 sm:min-w-40 text-center">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <button
          className="h-8 w-8 shrink-0 flex cursor-pointer hover:scale-95 items-center justify-center rounded-lg border border-gray-200 bg-surface text-gray-600 hover:bg-gray-50 transition-colors"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          className="text-xs text-gray-500 hover:text-gray-800 shrink-0 ml-0 sm:ml-2 transition-colors"
          onClick={() => setCurrentMonth(new Date())}
        >
          Today
        </button>
      </div>

      {/* ── Status Tabs (matches the Publishing page) ── */}
      <div className="border-b border-gray-200 bg-surface rounded-t-xl shadow-sm">
        {/* The tab row scrolls sideways on narrow screens instead of squeezing or
            spilling out of the card. The -1px pull lives on the scroller (not on
            each button) so the active tab's underline still covers the wrapper's
            hairline without overflowing — and being clipped by — the scroll box. */}
        <div className="-mb-px flex items-center overflow-x-auto hide-scrollbar px-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
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
                    : { backgroundColor: "var(--color-gray-100)", color: "var(--color-gray-500)" }
                }
              >
                {statusCounts[tab.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Filter Bar (matches the Publishing page) ── */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-surface border-x border-b border-gray-200 rounded-b-xl mb-6 shadow-sm">
        {/* The sidebar's network already narrows the page — no second
            platform picker while one is chosen. */}
        {!scoped && (
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 h-9">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="bg-transparent text-xs text-gray-700 outline-none pr-1 cursor-pointer"
          >
            <option value="all">All Platforms</option>
            <optgroup label="── Social Media">
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
        )}

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

      {/* The calendar takes the full width; a picked day or post opens its
          details in a drawer that slides in from the right. */}
      <div>
        {/* ── Calendar grid ── */}
        <div>
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
                    onClick={() => {
                      setSelectedPostId(null);
                      setSelectedDay(isSameDay(day, selectedDay) ? null : day);
                    }}
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
                          onDelete={() => setPendingDelete(post)}
                          selected={post.id === selectedPostId}
                          onSelect={() => openPost(post)}
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

        {/* ── Day detail drawer — slides in from the right, full height ── */}
        <Drawer
          isOpen={!!selectedDay}
          onClose={closePanel}
          side="right"
          label="Day details"
          zIndex={90}
          className="w-110"
        >
          <div className="flex-1 overflow-y-auto p-5">
            {panelDay && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDays
                    className="w-4 h-4"
                    style={{ color: "#003dda" }}
                  />
                  <h3 className="font-semibold text-gray-800 text-sm">
                    {format(panelDay, "EEE, MMM d")}
                  </h3>
                  <button
                    onClick={closePanel}
                    aria-label="Close details"
                    className="ml-auto rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {selectedDayPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-gray-400">
                      No posts on this day
                    </p>
                    <Link href="/creatives">
                      <button className="mt-3 inline-flex cursor-pointer items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-xs text-gray-600 bg-surface hover:bg-gray-50 transition-colors">
                        <Plus className="w-3 h-3" /> Schedule a post
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
                          ref={(el) => {
                            if (el && post.id === selectedPostId)
                              el.scrollIntoView({ block: "nearest", behavior: "smooth" });
                          }}
                          // The whole card opens the post's insights.
                          onClick={() => openPost(post)}
                          className={`cursor-pointer rounded-lg border p-3 space-y-2 transition-colors ${
                            post.id === selectedPostId
                              ? "border-blue-300 bg-blue-50/50 ring-1 ring-blue-200"
                              : "border-gray-100 hover:border-blue-200 hover:bg-gray-50"
                          }`}
                        >
                          {/* Whole image, uncropped — contain, not cover. */}
                          {post.image_url && (
                            <img
                              src={post.image_url}
                              alt=""
                              className="w-full max-h-80 object-contain rounded-lg bg-gray-50"
                            />
                          )}
                          <div className="flex items-start justify-between gap-2">
                            <p className="flex-1 min-w-0 text-sm font-semibold text-gray-900">
                              {post.project_title || "Untitled"}
                            </p>
                            {canDelete(post) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPendingDelete(post);
                                }}
                                aria-label="Delete post"
                                className="text-red-300 hover:text-red-500 shrink-0 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          {/* Full caption, line breaks kept. */}
                          {post.caption && post.caption !== post.project_title && (
                            <p className="whitespace-pre-line text-xs leading-relaxed text-gray-600">
                              {post.caption}
                            </p>
                          )}
                          {/* The rest of what the row carries. */}
                          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 border-t border-gray-100 pt-2.5 text-xs">
                            <dt className="text-gray-400">Platform</dt>
                            <dd className="text-gray-700">
                              {meta.emoji} {meta.name || meta.label}
                            </dd>
                            <dt className="text-gray-400">Status</dt>
                            <dd>
                              <span
                                className={
                                  "text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize " +
                                  badge
                                }
                              >
                                {post.status}
                              </span>
                            </dd>
                            {dateStr && (
                              <>
                                <dt className="text-gray-400">
                                  {post.status === "scheduled" ? "Scheduled" : "Published"}
                                </dt>
                                <dd className="text-gray-700">
                                  {format(new Date(dateStr), "EEE, MMM d, yyyy · h:mm a")}
                                </dd>
                              </>
                            )}
                          </dl>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#003dda]">
                              View insights →
                            </span>
                            {post.permalink_url && (
                              <a
                                href={post.permalink_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 hover:underline"
                              >
                                View on {meta.name || meta.label}
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </Drawer>
      </div>

      {/* A post's insights — the same panel Publishing opens. The live row,
          so its stats fill in as they land. */}
      <PostInsightsPanel
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          if (!selectedDay) setSelectedPostId(null);
        }}
        post={allPosts.find((p) => p.id === detailsId)}
        allPosts={allPosts}
        statsLoading={statsLoadingId === detailsId}
        accountName={(() => {
          const platform = allPosts.find((p) => p.id === detailsId)?.platform;
          const i = integrations.find((x) => x.platform === platform);
          return i?.int_name || i?.account_label;
        })()}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this post?"
        message={pendingDelete ? deleteMessage(pendingDelete) : ""}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        variant="danger"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
