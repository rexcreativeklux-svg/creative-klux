"use client";

import React, { useState, useCallback, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, CalendarDays, Plus, Trash2
} from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  format, addMonths, subMonths
} from 'date-fns';
import { getPublishedPosts, deletePostFromPlatform, fetchLivePostsFromConnectedAccounts } from '../../../../../(lib)/integration';
import { useAuth } from '@/context/AuthContext'; 
import { toast } from 'sonner';
import Link from 'next/link';

const PLATFORM_META = {
  facebook:    { label: 'FB',      emoji: '🔵' },
  instagram:   { label: 'IG',      emoji: '📸' },
  meta_ads:    { label: 'Meta',    emoji: '📢' },
  google_ads:  { label: 'G.Ads',  emoji: '🔍' },
  tiktok:      { label: 'TikTok', emoji: '🎵' },
  tiktok_ads:  { label: 'TT.Ads', emoji: '🎯' },
  linkedin:    { label: 'LI',      emoji: '💼' },
  twitter:     { label: 'X',       emoji: '🐦' },
  youtube:     { label: 'YT',      emoji: '▶️' },
  pinterest:   { label: 'PIN',     emoji: '📌' },
  snapchat:    { label: 'SNAP',    emoji: '👻' },
};

const STATUS_BORDER = {
  published: 'border-l-green-500',
  scheduled: 'border-l-blue-500',
  failed:    'border-l-red-500',
};

const STATUS_BADGE = {
  published: 'bg-green-100 text-green-700',
  scheduled: 'bg-blue-100 text-blue-700',
  failed:    'bg-red-100 text-red-600',
};

function PostPill({ post, onDelete }) {
  const meta = PLATFORM_META[post.platform] || { label: post.platform, emoji: '🌐' };
  const borderColor = STATUS_BORDER[post.status] || 'border-l-gray-300';
  return (
    <div className={'group flex cursor-pointer items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] border-l-2 bg-white hover:bg-gray-50 transition-all cursor-default ' + borderColor}>
      <span>{meta.emoji}</span>
      <span className="text-gray-700 truncate flex-1 min-w-0">{post.project_title}</span>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 cursor-pointer group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity ml-auto flex-shrink-0"
      >
        <Trash2 className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}

export default function AdsContentCalendar() {
  const typeLabel = 'Ads';
  const matchType = 'ad';

  const { integrations } = useAuth(); // ← get integrations from auth context

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [allPosts, setAllPosts]         = useState([]);
  const [selectedDay, setSelectedDay]   = useState(null);

  const reload = useCallback(() => setAllPosts(getPublishedPosts()), []);

  const fetchLive = useCallback(async () => {
    try {
      const livePosts = await fetchLivePostsFromConnectedAccounts(integrations ?? []); // ← pass integrations
      const local     = getPublishedPosts();
      const localIds  = new Set(local.map(p => p.id));
      const newPosts  = livePosts.filter(lp => !localIds.has(lp.id));
      const merged    = [...newPosts, ...local];
      localStorage.setItem('creativeklux_published_posts', JSON.stringify(merged));
      setAllPosts(merged);
    } catch {
      reload();
    }
  }, [integrations, reload]); // ← integrations in dep array

  useEffect(() => { fetchLive(); }, [fetchLive]);

  const posts = allPosts.filter(p => p.type === matchType);

  const handleDelete = async (post) => {
    await deletePostFromPlatform(post, integrations ?? []); // ← pass integrations
    reload();
    toast.success('Ad removed');
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd     = endOfWeek(monthEnd,     { weekStartsOn: 1 });
  const days       = eachDayOfInterval({ start: calStart, end: calEnd });

  const getPostsForDay = (day) =>
    posts.filter(p => {
      const d = p.status === 'scheduled' ? p.scheduled_at : p.published_at;
      return d && isSameDay(new Date(d), day);
    });

  const selectedDayPosts = selectedDay ? getPostsForDay(selectedDay) : [];
  const totalScheduled   = posts.filter(p => p.status === 'scheduled').length;
  const totalPublished   = posts.filter(p => p.status === 'published').length;

  return (
    <div className="">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{typeLabel} Calendar</h1>
          <p className="text-gray-500 text-sm">
            {totalScheduled} scheduled · {totalPublished} published
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Published
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block ml-2" /> Scheduled
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block ml-2" /> Failed
          </div>
          <Link href="/creatives">
            <button
              className="inline-flex items-center cursor-pointer hover:scale-95 gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
              style={{ background: '#003dda' }}
            >
              <Plus className="w-3.5 h-3.5" /> New Ad
            </button>
          </Link>
        </div>
      </div>

      {/* ── Month nav ── */}
      <div className="flex items-center gap-4 mb-4">
        <button
          className="h-8 w-8 flex cursor-pointer hover:scale-95 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-all duration-200"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="font-semibold text-gray-900 text-lg min-w-[160px] text-center">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          className="h-8 w-8 flex cursor-pointer hover:scale-95 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ── Calendar grid ── */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} className="py-2 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="grid grid-cols-7">
              {days.map((day, idx) => {
                const dayPosts   = getPostsForDay(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const inMonth    = isSameMonth(day, currentMonth);
                const todayDay   = isToday(day);

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDay(isSameDay(day, selectedDay) ? null : day)}
                    className={
                      'min-h-[90px] p-1.5 border-b cursor-pointer border-r border-gray-100 transition-colors ' +
                      (!inMonth    ? 'opacity-30 '      : '') +
                      (isSelected  ? 'bg-blue-50 '      : 'hover:bg-gray-50 ') +
                      (idx % 7 === 6 ? 'border-r-0'     : '')
                    }
                  >
                    <div
                      className={
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1 ml-auto ' +
                        (todayDay ? 'text-white' : 'text-gray-700')
                      }
                      style={todayDay ? { background: '#003dda' } : {}}
                    >
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayPosts.slice(0, 3).map(post => (
                        <PostPill key={post.id} post={post} onDelete={() => handleDelete(post)} />
                      ))}
                      {dayPosts.length > 3 && (
                        <p className="text-[9px] text-gray-400 px-1">+{dayPosts.length - 3} more</p>
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
          <div className="rounded-xl border border-gray-200 bg-white p-4 sticky top-6">
            {selectedDay ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDays className="w-4 h-4" style={{ color: '#003dda' }} />
                  <h3 className="font-semibold text-gray-800 text-sm">
                    {format(selectedDay, 'EEE, MMM d')}
                  </h3>
                </div>
                {selectedDayPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-gray-400">No ads on this day</p>
                    <Link href="/creatives">
                      <button className="mt-3 inline-flex cursor-pointer items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 text-xs text-gray-600 bg-white hover:bg-gray-50 transition-colors">
                        <Plus className="w-3 h-3" /> Schedule an ad
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDayPosts.map(post => {
                      const meta    = PLATFORM_META[post.platform] || { emoji: '🌐', label: post.platform };
                      const dateStr = post.status === 'scheduled' ? post.scheduled_at : post.published_at;
                      const badge   = STATUS_BADGE[post.status] || 'bg-gray-100 text-gray-600';
                      return (
                        <div key={post.id} className="rounded-lg border border-gray-100 p-3 space-y-2">
                          {post.image_url && (
                            <img src={post.image_url} alt="" className="w-full h-24 object-cover rounded-lg" />
                          )}
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800 truncate">{post.project_title}</p>
                              {post.caption && (
                                <p className="text-[10px] text-gray-400 truncate mt-0.5">{post.caption}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDelete(post)}
                              className="text-red-300 hover:text-red-500 flex-shrink-0 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={'text-[10px] font-medium px-1.5 py-0.5 rounded-full ' + badge}>
                              {post.status}
                            </span>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              {meta.emoji}
                              {dateStr && format(new Date(dateStr), 'h:mm a')}
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
                <p className="text-xs text-gray-400">Click a day to see its ads</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}