"use client";

// app/(components)/skeletons/AppShellSkeleton.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The whole-window skeleton: a stand-in sidebar, a stand-in header, and a slot
// for whatever page skeleton belongs in the content area.
//
// WHEN THIS IS THE RIGHT ONE. Only when the real chrome isn't mounted yet —
// i.e. ProtectedRoute while the auth check is in flight, which is the one moment
// the layout returns this INSTEAD of <Sidebar/> + <Header/>. Once the user is
// resolved, the real chrome stays mounted across every navigation, so route-level
// loading.js files must skeleton the CONTENT ONLY and never reach for this.
//
// EVERY MEASUREMENT HERE MIRRORS THE REAL CHROME, and the two have to stay in
// sync or the hand-off visibly jumps:
//   Sidebar.jsx   w-56 open / w-15 collapsed · h-16 logo row · nav rows px-3 py-2.5
//                 · THEME row h-(--ck-rail-row) · account block h-(--ck-rail-foot)
//   Header.jsx    h-16, px-6, bg-surface, .border-custom
//
// The header is drawn in the flex flow rather than `fixed` like the real one.
// It lands on exactly the same pixels (the real header's left-56/left-15 offset
// is precisely the sidebar width) without needing the z-index or the offset.
//
// Sidebar width follows the user's saved preference, read the same way
// (dashboard)/layout.js reads it, so the skeleton opens at the width the real
// sidebar is about to render at instead of snapping a moment later.

import { useState } from "react";
import Skeleton from "./Skeleton";

/** How many nav rows to draw — matches the Apps tab's item count in Sidebar.jsx. */
const NAV_ROWS = 8;

/** Label widths, in px, so the rail reads as words rather than a stack of bars. */
const NAV_LABEL_WIDTHS = [72, 64, 96, 92, 86, 96, 84, 100];

/** The saved sidebar state, defaulting open exactly as the real layout does. */
function useSavedSidebarOpen() {
  const [isOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const saved = localStorage.getItem("sidebarOpen");
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  return isOpen;
}

/**
 * @param {object} props
 * @param {React.ReactNode} props.children  The page skeleton for the content area.
 * @param {boolean} [props.padded]          Apply the layout's default page frame
 *                                          (px-gutter + page rhythm + mobile
 *                                          bottom-nav clearance). Off for
 *                                          full-bleed pages.
 */
export default function AppShellSkeleton({ children, padded = true }) {
  const isOpen = useSavedSidebarOpen();

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-page">
      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <nav
        className={`hidden h-[100dvh] shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-surface lg:flex ${
          isOpen ? "w-56" : "w-15"
        }`}
      >
        {/* Logo row */}
        <div
          className={`flex h-header shrink-0 items-center border-b border-gray-200 ${
            isOpen ? "px-4" : "justify-center px-0"
          }`}
        >
          <Skeleton w={28} h={28} className="rounded-lg" />
          {isOpen && <Skeleton className="ml-2 h-3.5 w-24" />}
        </div>

        {/* Apps / Copilot tab switcher */}
        <div className={`shrink-0 pt-3 ${isOpen ? "px-3" : "px-2"}`}>
          <div
            className={`gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1 ${
              isOpen ? "grid grid-cols-2" : "flex flex-col"
            }`}
          >
            <Skeleton className="h-7 rounded-lg" tone="soft" />
            <Skeleton className="h-7 rounded-lg" tone="soft" />
          </div>
        </div>

        {/* Nav rows */}
        <div
          className={`flex flex-1 flex-col gap-1 overflow-hidden py-3 ${
            isOpen ? "px-3" : "px-2"
          }`}
        >
          {Array.from({ length: NAV_ROWS }).map((_, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 rounded-xl py-2.5 ${
                isOpen ? "px-3" : "justify-center px-0"
              }`}
            >
              <Skeleton w={18} h={18} className="rounded-md" />
              {isOpen && (
                <Skeleton h={11} w={NAV_LABEL_WIDTHS[index]} tone="soft" />
              )}
            </div>
          ))}
        </div>

        {/* THEME row — height pinned to the same var the real switcher uses */}
        <div
          className={`flex h-(--ck-rail-row) shrink-0 items-center border-t border-gray-200 ${
            isOpen ? "px-3" : "justify-center px-2"
          }`}
        >
          <Skeleton className={isOpen ? "h-7 w-full rounded-lg" : "h-7 w-7 rounded-lg"} tone="soft" />
        </div>

        {/* Account block */}
        <div
          className={`flex h-(--ck-rail-foot) shrink-0 items-center gap-2.5 border-t border-gray-200 ${
            isOpen ? "px-3" : "justify-center px-2"
          }`}
        >
          <Skeleton w={34} h={34} className="rounded-full" />
          {isOpen && (
            <div className="flex flex-col gap-1.5">
              <Skeleton h={11} w={78} />
              <Skeleton h={9} w={54} tone="soft" />
            </div>
          )}
        </div>
      </nav>

      {/* ── Main column ─────────────────────────────────────────────────────
          pb-nav mirrors `main` in (dashboard)/layout.js: the content area stops
          at the fixed mobile bar instead of running under it. */}
      <div className="flex h-full flex-1 flex-col overflow-hidden pb-nav lg:pb-0">
        {/* Header — same height, padding and shadow as the real one */}
        <div className="border-custom flex h-header shrink-0 items-center justify-between bg-surface px-gutter">
          <Skeleton w={36} h={36} className="rounded-lg" tone="soft" />
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <Skeleton w={24} h={24} className="rounded-full" />
            <Skeleton h={12} w={72} tone="soft" />
            <Skeleton w={14} h={14} className="rounded" tone="soft" />
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto bg-page">
          {/* Mirrors the frame (dashboard)/layout.js applies to padded routes,
              with ONE deliberate difference: the real header is `fixed` and so
              overlays the scroll area, which is why the layout adds the header's
              height to its top padding. This skeleton's header is IN THE FLOW
              and has already taken that space, so only the page rhythm is
              needed here. Matching it exactly would double the gap and make the
              hand-off to the real page jump. */}
          <div className={`h-full ${padded ? "px-gutter pt-page-y pb-page-y" : ""}`}>
            {children}
          </div>
        </div>
      </div>

      {/* ── Mobile bottom nav ─────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t border-gray-200 bg-surface h-nav pb-(--ck-safe-b) lg:hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex shrink-0 flex-col items-center gap-1 p-1.5">
            <Skeleton w={20} h={20} className="rounded-md" />
            <Skeleton h={8} w={34} tone="soft" />
          </div>
        ))}
      </nav>
    </div>
  );
}
