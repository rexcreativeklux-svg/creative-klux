'use client';

import React from 'react';

const Pulse = ({ w, h, rounded = '6px', className = '', style = {} }) => (
  <div
    className={`animate-pulse bg-gray-200 ${className}`}
    style={{ width: w, height: h, borderRadius: rounded, flexShrink: 0, ...style }}
  />
);

export default function DashboardSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50" style={{ fontFamily: 'var(--font-sans)' }}>

      {/* ── Sidebar: wide with label text, matching screenshot ── */}
      <nav className="hidden md:flex flex-col justify-between h-screen bg-surface border-r border-gray-100 shrink-0" style={{ width: 188 }}>
        {/* Logo */}
        <div>
          <div className="flex items-center gap-2 px-5 py-5">
            <Pulse w={24} h={24} rounded="6px" />
            <Pulse w={90} h={14} />
          </div>

          {/* OVERVIEW label */}
          <div className="px-5 mb-2">
            <Pulse w={56} h={9} />
          </div>
          {/* Dashboard (active) */}
          <div className="mx-3 mb-1 flex items-center gap-2.5 px-3 py-2 rounded-lg bg-blue-50">
            <Pulse w={16} h={16} rounded="4px" style={{ background: '#c7d8fc' }} />
            <Pulse w={64} h={11} style={{ background: '#c7d8fc' }} />
          </div>

          {/* CREATE label */}
          <div className="px-5 mt-4 mb-2">
            <Pulse w={44} h={9} />
          </div>
          {['Brand Kits', 'Creative Studio', 'Product Photos'].map((_, i) => (
            <div key={i} className="mx-3 mb-0.5 flex items-center gap-2.5 px-3 py-2 rounded-lg">
              <Pulse w={16} h={16} rounded="4px" />
              <Pulse w={[60, 96, 84][i]} h={11} />
            </div>
          ))}

          {/* MANAGE label */}
          <div className="px-5 mt-4 mb-2">
            <Pulse w={52} h={9} />
          </div>
          {[88, 76, 68].map((w, i) => (
            <div key={i} className="mx-3 mb-0.5 flex items-center gap-2.5 px-3 py-2 rounded-lg">
              <Pulse w={16} h={16} rounded="4px" />
              <Pulse w={w} h={11} />
            </div>
          ))}

          {/* AI TOOLS label */}
          <div className="px-5 mt-4 mb-2">
            <Pulse w={52} h={9} />
          </div>
          {[96, 60, 72, 72, 112, 72].map((w, i) => (
            <div key={i} className="mx-3 mb-0.5 flex items-center gap-2.5 px-3 py-2 rounded-lg">
              <Pulse w={16} h={16} rounded="4px" />
              <Pulse w={w} h={11} />
            </div>
          ))}
        </div>

        {/* Bottom user */}
        <div className="border-t border-gray-100 px-4 py-4 flex items-center gap-3">
          <Pulse w={36} h={36} rounded="50%" />
          <div className="flex flex-col gap-1.5">
            <Pulse w={72} h={11} />
            <Pulse w={52} h={9} />
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar: back arrow left, workspace dropdown right */}
        <div className="h-14 bg-surface border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
          <Pulse w={28} h={28} rounded="8px" />
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5">
            <Pulse w={24} h={24} rounded="50%" />
            <Pulse w={60} h={12} />
            <Pulse w={14} h={14} rounded="3px" />
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

          {/* Welcome heading */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Pulse w={180} h={22} rounded="6px" />
              <Pulse w={24} h={24} rounded="4px" />
            </div>
            <Pulse w={220} h={13} />
          </div>

          {/* 7-column stat cards */}
          <div className="grid grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="bg-surface border border-gray-100 rounded-xl p-4 flex flex-col gap-2">
                <Pulse w={28} h={28} rounded="8px" />
                <Pulse w={24} h={20} rounded="4px" />
                <Pulse w={64} h={11} />
              </div>
            ))}
          </div>

          {/* Chart + Quick Create panel */}
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 320px' }}>

            {/* Weekly Activity line chart */}
            <div className="bg-surface border border-gray-100 rounded-xl p-5">
              <div className="flex flex-col gap-1 mb-5">
                <Pulse w={120} h={16} />
                <Pulse w={180} h={11} />
              </div>

              {/* Y-axis + chart area */}
              <div className="flex gap-3" style={{ height: 200 }}>
                {/* Y labels */}
                <div className="flex flex-col justify-between pb-5">
                  {[8, 6, 4, 2, 0].map((v) => (
                    <Pulse key={v} w={12} h={9} />
                  ))}
                </div>
                {/* Chart lines (fake) */}
                <div className="flex-1 relative border-b border-l border-gray-100">
                  {/* Horizontal grid lines */}
                  {[20, 40, 60, 80].map((top) => (
                    <div key={top} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: `${top}%` }} />
                  ))}
                  {/* Fake orange curve via gradient bar */}
                  <div className="absolute inset-0 flex items-end pb-1 px-4">
                    <Pulse w="100%" h="55%" rounded="6px" style={{ opacity: 0.25 }} />
                  </div>
                </div>
              </div>

              {/* X-axis labels */}
              <div className="flex justify-between mt-2 pl-8">
                {Array.from({ length: 15 }).map((_, i) => (
                  <Pulse key={i} w={28} h={9} />
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 justify-center">
                {[80, 28, 44, 52, 40].map((w, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <Pulse w={24} h={9} rounded="4px" />
                    <Pulse w={w} h={9} />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Create panel */}
            <div className="bg-surface border border-gray-100 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Pulse w={20} h={20} rounded="4px" />
                  <Pulse w={90} h={15} />
                </div>
                <Pulse w={140} h={11} />
              </div>

              {/* 3 quick-create options */}
              {[
                [120, 160],
                [96, 176],
                [80, 152],
              ].map(([lw, rw], i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200">
                  <Pulse w={36} h={36} rounded="10px" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <Pulse w={lw} h={12} />
                    <Pulse w={rw} h={10} />
                  </div>
                  <Pulse w={14} h={14} rounded="3px" />
                </div>
              ))}

              {/* Open Full Studio CTA */}
              <Pulse w="100%" h={48} rounded="12px" style={{ background: '#e5c5f5', marginTop: 'auto' }} />
            </div>
          </div>

          {/* Recent Designs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Pulse w={120} h={16} />
              <Pulse w={56} h={12} />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-gray-100 bg-surface">
                  <Pulse w="100%" h={180} rounded="0" />
                  <div className="p-3 flex flex-col gap-1.5">
                    <Pulse w="70%" h={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}