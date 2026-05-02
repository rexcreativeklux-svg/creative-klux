"use client";

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, MoreHorizontal,
  Target, MoreVertical, X, CalendarDays, LayoutGrid, Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const PLATFORM_CONFIG = {
  facebook:  { label: 'Facebook',  bg: '#1877F2', short: 'FB' },
  tiktok:    { label: 'TikTok',    bg: '#010101', short: 'TK' },
  instagram: { label: 'Instagram', bg: 'linear-gradient(135deg,#f09433,#dc2743,#bc1888)', short: 'IG' },
  linkedin:  { label: 'LinkedIn',  bg: '#0A66C2', short: 'LI' },
  youtube:   { label: 'YouTube',   bg: '#FF0000', short: 'YT' },
};

const PlatformBadge = ({ platform, size = 18 }) => {
  const cfg = PLATFORM_CONFIG[platform];
  if (!cfg) return null;
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, background: cfg.bg, fontSize: Math.round(size * 0.38), letterSpacing: '-0.02em' }}
    >
      {cfg.short}
    </span>
  );
};

const formatDate = (d) => d.toISOString().split('T')[0];
const TODAY_STR  = '2025-09-23';
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getWeekDates = (date) => {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i); return d;
  });
};

const getMonthDates = (date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(start.getDate() - firstDay.getDay());
  const dates = [];
  const cur = new Date(start);
  while (dates.length < 42) { dates.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
  return dates;
};

const FilterChip = ({ label }) => (
  <button className="px-3 py-1.5 rounded-lg text-xs border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
    {label}
  </button>
);

export default function SocialMediaPlanner() {
  const router = useRouter();
  const [currentView, setCurrentView]     = useState('week');
  const [currentDate, setCurrentDate]     = useState(new Date(2025, 8, 23, 7, 21, 0));
  const [selectedDay, setSelectedDay]     = useState(null);
  const [showModal, setShowModal]         = useState(false);
  const [selectedAd, setSelectedAd]       = useState(null);
  const [scheduledItems, setScheduledItems] = useState([]);
  const [menuOpen, setMenuOpen]           = useState(null);
  const [sidebarTab, setSidebarTab]       = useState('goals');
  const [formValues, setFormValues]       = useState({});

  useEffect(() => {
    const stored = localStorage.getItem('selectedAdForScheduling');
    if (stored) {
      const ad = JSON.parse(stored);
      if (Date.now() - ad.timestamp < 5000) { setSelectedAd(ad); setShowModal(true); }
      localStorage.removeItem('selectedAdForScheduling');
    }
    const saved = localStorage.getItem('scheduledItems');
    if (saved) setScheduledItems(JSON.parse(saved));
  }, []);

  const navigate = (dir) => {
    const d = new Date(currentDate);
    if (currentView === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d); setSelectedDay(null);
  };

  const goToday = () => { setCurrentDate(new Date(2025, 8, 23, 7, 21, 0)); setSelectedDay(null); };
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleDelete = (id) => {
    const updated = scheduledItems.filter(i => i.id !== id);
    setScheduledItems(updated);
    localStorage.setItem('scheduledItems', JSON.stringify(updated));
    setMenuOpen(null);
  };

  const handleSchedule = () => {
    if (!selectedAd) return;
    const newItems = [];
    Object.keys(PLATFORM_CONFIG).forEach(platform => {
      const dateVal = formValues[`${platform}_date`];
      const timeVal = formValues[`${platform}_time`];
      if (dateVal && timeVal) {
        newItems.push({ ...selectedAd, id: `${Date.now()}-${Math.random()}-${platform}`, scheduledDate: dateVal, scheduledTime: timeVal, platform });
      }
    });
    if (newItems.length) {
      const updated = [...scheduledItems, ...newItems];
      setScheduledItems(updated);
      localStorage.setItem('scheduledItems', JSON.stringify(updated));
    }
    setShowModal(false); setFormValues({}); setSelectedAd(null);
  };

  const ItemCard = ({ item }) => (
    <div className="relative bg-gray-50 rounded-lg p-1.5 mb-1.5 border border-gray-200 cursor-pointer">
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 rounded flex-shrink-0 overflow-hidden bg-gray-200">
          {item.type === 'image'
            ? <img src={item.content} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gray-300" />}
        </div>
        <span className="text-[11px] text-gray-500 font-medium">{item.scheduledTime}</span>
        <PlatformBadge platform={item.platform} size={14} />
      </div>
      <button
        className="absolute top-0.5 right-0.5 p-0.5 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"
        onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === item.id ? null : item.id); }}
      >
        <MoreVertical size={11} />
      </button>
      {menuOpen === item.id && (
        <div className="absolute top-5 right-0 bg-white border border-gray-200 rounded-lg z-30 min-w-[100px] shadow-md">
          <button
            className="w-full text-left px-3.5 py-2 text-xs text-red-600 bg-transparent border-none cursor-pointer hover:bg-red-50"
            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );

  const WeekView = () => {
    const weekDates = getWeekDates(currentDate);
    return (
      <div className="grid grid-cols-7 flex-1 h-full">
        {weekDates.map((date, idx) => {
          const dateStr   = formatDate(date);
          const items     = scheduledItems.filter(i => i.scheduledDate === dateStr);
          const isToday   = dateStr === TODAY_STR;
          const isSelected = selectedDay === dateStr;
          return (
            <div
              key={idx}
              className={'cursor-pointer ' + (idx < 6 ? 'border-r border-gray-200 ' : '') + (isSelected ? 'bg-blue-50' : 'bg-white')}
              onClick={() => setSelectedDay(isSelected ? null : dateStr)}
            >
              <div
                className={'px-3 py-2.5 border-b border-gray-200 ' + (isToday ? '' : isSelected ? 'bg-blue-50' : 'bg-gray-50')}
                style={isToday ? { background: '#003dda' } : {}}
              >
                <div className={'text-[10px] font-semibold tracking-widest uppercase mb-0.5 ' + (isToday ? 'text-white/70' : 'text-gray-400')}>
                  {SHORT_DAYS[idx]}
                </div>
                <div
                  className={'text-xl leading-none font-' + (isToday ? 'bold' : 'normal') + ' ' + (isToday ? 'text-white' : isSelected ? '' : 'text-gray-900')}
                  style={!isToday && isSelected ? { color: '#003dda' } : {}}
                >
                  {date.getDate()}
                </div>
              </div>
              <div className="p-1.5 overflow-y-auto">
                {items.map(item => <ItemCard key={item.id} item={item} />)}
                {isToday && items.length === 0 && (
                  <div className="text-[10px] text-gray-400 text-center mt-2.5">No posts today</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const MonthView = () => {
    const monthDates = getMonthDates(currentDate);
    return (
      <div className="flex-1">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
          {SHORT_DAYS.map(d => (
            <div key={d} className="px-3 py-2.5 text-[10px] font-semibold text-gray-400 tracking-widest uppercase">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7" style={{ gridTemplateRows: 'repeat(6, 1fr)' }}>
          {monthDates.map((date, idx) => {
            const dateStr        = formatDate(date);
            const items          = scheduledItems.filter(i => i.scheduledDate === dateStr);
            const isToday        = dateStr === TODAY_STR;
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isSelected     = selectedDay === dateStr;
            return (
              <div
                key={idx}
                className={'min-h-[100px] p-2 cursor-pointer ' +
                  ((idx % 7) < 6 ? 'border-r border-gray-200 ' : '') +
                  (idx < 35 ? 'border-b border-gray-200 ' : '') +
                  (isSelected ? 'bg-blue-50' : 'bg-white')}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
              >
                <div
                  className={'w-6 h-6 rounded-full mb-1.5 flex items-center justify-center text-[13px] ' +
                    (isToday ? 'font-bold text-white' : !isCurrentMonth ? 'text-gray-300 font-normal' : 'text-gray-900 font-normal')}
                  style={isToday ? { background: '#003dda' } : {}}
                >
                  {date.getDate()}
                </div>
                {items.slice(0, 3).map(item => <ItemCard key={item.id} item={item} />)}
                {items.length > 3 && (
                  <div className="text-[10px] text-gray-500 mt-0.5">+{items.length - 3} more</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const uniquePlatformCount = [...new Set(scheduledItems.map(i => i.platform))].length;

  return (
    <div className="text-gray-900">

      {/* Page header */}
      <div className="py-6 flex justify-between items-start flex-wrap gap-4 mb-0">
        <div>
          <h1 className="text-xl font-semibold m-0 mb-1 text-gray-900">Planner</h1>
          <p className="text-sm text-gray-500 m-0">Plan your marketing calendar — create, schedule and manage content.</p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => router.push('/studio')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-gray-800 text-[13px] font-medium cursor-pointer hover:scale-105 transition-all duration-200"
          >
            <Plus size={14} /> Create ad
          </button>
          <button
            onClick={() => router.push('/studio')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-white text-[13px] font-medium cursor-pointer hover:scale-105 transition-all duration-200 border-none"
            style={{ background: '#003dda' }}
          >
            <Plus size={14} /> Create post
          </button>
          <button className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 flex cursor-pointer hover:bg-gray-50 transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Main calendar card */}
      <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col bg-white shadow-sm">

        {/* Toolbar */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-gray-50 flex-wrap gap-2.5">
          <div className="flex items-center gap-3">
            {/* View toggle */}
            <div className="flex bg-white border border-gray-200 rounded-lg p-0.5 gap-0.5">
              {['week', 'month'].map(v => (
                <button
                  key={v}
                  onClick={() => setCurrentView(v)}
                  className={'flex items-center gap-1 px-3.5 py-1 rounded-md border-none text-xs font-medium cursor-pointer transition-colors ' +
                    (currentView === v ? 'text-white' : 'bg-transparent text-gray-500 hover:bg-gray-100')}
                  style={currentView === v ? { background: '#003dda' } : {}}
                >
                  {v === 'week' ? <CalendarDays size={12} /> : <LayoutGrid size={12} />}
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>

            {/* Nav */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={goToday}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigate(1)}
                className="flex items-center justify-center p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            <span className="text-[15px] font-semibold text-gray-900">{monthYear}</span>
          </div>

          <div className="flex gap-2">
            <FilterChip label="Content type: All" />
            <FilterChip label="Shared to: All" />
          </div>
        </div>

        {/* Calendar + Sidebar */}
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 min-w-0 overflow-y-auto border-r border-gray-200">
            {currentView === 'week' ? <WeekView /> : <MonthView />}
          </div>

          {/* Sidebar */}
          <div className="w-60 bg-white flex-shrink-0">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-1">
              {['goals', 'moments', 'drafts'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setSidebarTab(tab)}
                  className={'flex-1 py-3 border-none bg-transparent cursor-pointer text-xs font-medium capitalize transition-colors ' +
                    (sidebarTab === tab ? 'border-b-2' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700')}
                  style={sidebarTab === tab ? { color: '#003dda', borderBottomColor: '#003dda' } : {}}
                >
                  {tab}
                </button>
              ))}
            </div>

            {sidebarTab === 'goals' && (
              <div className="p-3.5">
                <div className="flex items-center gap-1.5 mb-3.5">
                  <Target size={15} style={{ color: '#003dda' }} />
                  <span className="text-[13px] font-semibold text-gray-900">Goals</span>
                </div>

                {/* Goal card */}
                <div className="bg-gray-50 rounded-xl p-3.5 mb-3 border border-gray-200">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center mb-2.5" style={{ background: 'linear-gradient(135deg,#22c55e,#003dda)' }}>
                    <Target size={17} className="text-white" />
                  </div>
                  <p className="text-xs text-gray-500 m-0 mb-3 leading-relaxed">
                    Set a goal, track progress and learn helpful tips for your success.
                  </p>
                  <button
                    className="w-full py-2 rounded-lg text-xs font-medium text-white border-none cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ background: '#003dda' }}
                  >
                    Start new goal
                  </button>
                </div>

                {/* Boost card */}
                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap size={13} className="text-amber-400" />
                    <span className="text-xs font-medium text-gray-800">Boost a post</span>
                  </div>
                  <p className="text-xs text-gray-500 m-0 mb-3 leading-relaxed">
                    Reach audiences that don't follow you yet.
                  </p>
                  <button className="w-full py-2 rounded-lg bg-gray-50 text-gray-800 border border-gray-200 text-xs font-medium cursor-pointer hover:bg-gray-100 transition-colors">
                    Boost
                  </button>
                </div>

                {scheduledItems.length > 0 && (
                  <div className="mt-3 px-3 py-2.5 rounded-lg border" style={{ background: '#eff4ff', borderColor: 'rgba(0,61,218,0.18)' }}>
                    <div className="text-[11px] font-semibold mb-0.5" style={{ color: '#003dda' }}>
                      {scheduledItems.length} post{scheduledItems.length !== 1 ? 's' : ''} scheduled
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Across {uniquePlatformCount} platform{uniquePlatformCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>
            )}

            {sidebarTab === 'moments' && (
              <div className="px-3.5 py-8 text-center text-[13px] text-gray-400">No moments yet</div>
            )}
            {sidebarTab === 'drafts' && (
              <div className="px-3.5 py-8 text-center text-[13px] text-gray-400">No drafts</div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-[90%] max-w-[480px] border border-gray-200 overflow-hidden shadow-xl">
            <div className="px-5 pt-4.5 pb-3.5 border-b border-gray-200 flex justify-between items-start">
              <div>
                <h2 className="m-0 text-base font-semibold text-gray-900">Schedule {selectedAd?.name || 'post'}</h2>
                <p className="mt-1 mb-0 text-xs text-gray-500">Set publish date and time per platform.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-700 p-0.5 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-3.5 max-h-[55vh] overflow-y-auto">
              {Object.entries(PLATFORM_CONFIG).map(([platform, cfg]) => (
                <div key={platform} className="mb-3.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <PlatformBadge platform={platform} size={18} />
                    <span className="text-xs font-medium text-gray-900">{cfg.label}</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={formValues[`${platform}_date`] || ''}
                      onChange={e => setFormValues(v => ({ ...v, [`${platform}_date`]: e.target.value }))}
                      className="flex-1 px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 bg-white text-gray-900 outline-none focus:border-blue-400"
                    />
                    <input
                      type="time"
                      value={formValues[`${platform}_time`] || ''}
                      onChange={e => setFormValues(v => ({ ...v, [`${platform}_time`]: e.target.value }))}
                      className="w-[110px] px-2.5 py-1.5 rounded-lg text-xs border border-gray-200 bg-white text-gray-900 outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-gray-200 flex gap-2">
              <button
                onClick={handleSchedule}
                className="flex-1 py-2 rounded-lg text-xs font-medium text-white border-none cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background: '#003dda' }}
              >
                Schedule all
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 rounded-lg bg-gray-50 text-gray-800 border border-gray-200 text-xs font-medium cursor-pointer hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}