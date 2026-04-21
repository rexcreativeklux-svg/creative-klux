'use client';

import React from 'react';

const Sh = ({ w, h, rounded = '4px', className = '', style = {} }) => (
  <div
    className={`animate-shimmer ${className}`}
    style={{
      width: w,
      height: h,
      borderRadius: rounded,
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '600px 100%',
      ...style,
    }}
  />
);

export default function DashboardSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50" style={{ fontFamily: 'var(--font-sans)' }}>

      {/* Sidebar - matches 72px icon-only sidebar */}
      <nav className="hidden md:flex flex-col justify-between h-screen w-[72px] bg-white border-r border-gray-100">
        <div className="flex flex-col items-center pt-5 gap-1">
          {/* Logo */}
          <div className="w-9 h-9 rounded-lg bg-gray-200 animate-pulse mb-5" />
          {/* Nav items */}
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex flex-col items-center px-1 py-2 w-full gap-1">
              <div className="w-5 h-5 rounded bg-gray-200 animate-pulse" />
              <div className="h-2 rounded bg-gray-200 animate-pulse" style={{ width: `${40 + (i % 3) * 10}px` }} />
            </div>
          ))}
        </div>
        <div className="mb-6 flex flex-col items-center gap-0 w-full border-t border-gray-100 pt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center px-1 py-2 w-full gap-1">
              <div className="w-5 h-5 rounded bg-gray-200 animate-pulse" />
              <div className="h-2 w-10 rounded bg-gray-200 animate-pulse" />
            </div>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
          <div className="w-7 h-7 rounded-md bg-gray-200 animate-pulse" />
          <div className="w-44 h-9 rounded-lg bg-gray-200 animate-pulse" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">

          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-3 w-14 rounded bg-gray-200 animate-pulse" />
                  <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
                </div>
                <div className="h-7 w-16 rounded bg-gray-200 animate-pulse mb-2" />
                <div className="h-2.5 w-12 rounded bg-gray-200 animate-pulse" />
              </div>
            ))}
          </div>

          {/* Sales report + right panel */}
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 300px' }}>

            {/* Sales report */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
                <div className="flex gap-2">
                  {['Daily', 'Monthly', 'Yearly'].map((t) => (
                    <div key={t} className="h-7 w-14 rounded-md bg-gray-200 animate-pulse" />
                  ))}
                </div>
              </div>
              {/* Bar chart */}
              <div className="flex items-end gap-1.5 h-36">
                {[70, 90, 65, 95, 75, 85, 60, 80, 90, 70, 85, 95].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                    <div
                      className="w-full rounded-t bg-gray-200 animate-pulse"
                      style={{ height: `${h}%` }}
                    />
                    <div className="h-2 w-8 rounded bg-gray-200 animate-pulse mt-1" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right stats */}
            <div className="flex flex-col gap-3">
              {/* Earning */}
              <div className="bg-white border border-gray-100 rounded-xl p-4 flex-1">
                <div className="h-3 w-14 rounded bg-gray-200 animate-pulse mb-2" />
                <div className="h-6 w-16 rounded bg-gray-200 animate-pulse mb-3" />
                <div className="flex items-end gap-1 h-14">
                  {[50, 80, 40, 90, 30, 70, 60].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gray-200 animate-pulse"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              {/* Current Rating */}
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse shrink-0" />
                  <div>
                    <div className="h-3 w-24 rounded bg-gray-200 animate-pulse mb-2" />
                    <div className="h-5 w-16 rounded bg-gray-200 animate-pulse" />
                  </div>
                </div>
              </div>
              {/* Orders */}
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="h-3 w-12 rounded bg-gray-200 animate-pulse mb-2" />
                <div className="h-5 w-16 rounded bg-gray-200 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Closed Orders + Balance card */}
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 300px' }}>
            <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse shrink-0" />
              <div className="h-3 w-28 rounded bg-gray-200 animate-pulse" />
            </div>
            <div className="bg-gray-200 rounded-xl p-4 flex flex-col gap-3">
              <div className="h-7 w-20 rounded bg-gray-200 animate-pulse" />
              <div className="h-3 w-28 rounded bg-gray-200 animate-pulse" />
              <div className="h-10 w-full rounded-lg bg-gray-200 animate-pulse mt-1" />
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            {/* Table header row */}
            <div className="flex items-center justify-between mb-5">
              <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
              <div className="flex gap-2">
                <div className="h-8 w-24 rounded-lg bg-gray-200 animate-pulse" />
                <div className="h-8 w-28 rounded-lg bg-gray-200 animate-pulse" />
                <div className="h-8 w-40 rounded-lg bg-gray-200 animate-pulse" />
                <div className="h-8 w-8 rounded bg-gray-200 animate-pulse" />
                <div className="h-8 w-8 rounded bg-gray-200 animate-pulse" />
              </div>
            </div>
            {/* Column headers */}
            <div className="grid gap-3 pb-3 border-b border-gray-100 mb-2"
              style={{ gridTemplateColumns: '24px 2fr 1fr 48px 1fr 1fr 1fr 32px' }}>
              {[24, 80, 70, 48, 40, 60, 70, 24].map((w, i) => (
                <div key={i} className="h-2.5 rounded bg-gray-200 animate-pulse" style={{ width: `${w}px`, maxWidth: '100%' }} />
              ))}
            </div>
            {/* Rows */}
            {[1, 2, 3].map((row) => (
              <div
                key={row}
                className="grid gap-3 items-center py-3 border-b border-gray-50"
                style={{ gridTemplateColumns: '24px 2fr 1fr 48px 1fr 1fr 1fr 32px' }}
              >
                <div className="w-4 h-4 rounded bg-gray-200 animate-pulse" />
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-gray-200 animate-pulse shrink-0" />
                  <div>
                    <div className="h-3 w-24 rounded bg-gray-200 animate-pulse mb-1.5" />
                    <div className="h-2.5 w-6 rounded bg-gray-200 animate-pulse" />
                  </div>
                </div>
                <div className="h-3 w-16 rounded bg-gray-200 animate-pulse" />
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                <div className="h-3 w-10 rounded bg-gray-200 animate-pulse" />
                <div className="h-5 w-14 rounded-full bg-gray-200 animate-pulse" />
                <div className="h-3 w-12 rounded bg-gray-200 animate-pulse" />
                <div className="w-6 h-6 rounded bg-gray-200 animate-pulse" />
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}