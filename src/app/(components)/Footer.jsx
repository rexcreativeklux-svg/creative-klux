"use client";

/**
 * Copyright line at the end of every padded dashboard page (see
 * (dashboard)/layout.js). The year is read at render so it never goes stale.
 *
 * Height is pinned to --ck-rail-foot so its top border lines up with the
 * sidebar account block's, and -mx-gutter cancels the page gutter so the rule
 * runs edge to edge across the content area.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="shrink-0 -mx-gutter h-(--ck-rail-foot) px-gutter flex items-center justify-center border-t border-gray-200 text-center text-xs text-gray-500">
      © {year} Creativeklux. A product of Netsprin Enterprises. All rights
      reserved.
    </footer>
  );
}
