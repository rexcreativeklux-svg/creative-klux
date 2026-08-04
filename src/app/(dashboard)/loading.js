"use client";

// app/(dashboard)/loading.js
// ─────────────────────────────────────────────────────────────────────────────
// Loading UI for "/" — the AI interface home.
//
// loading.js nests INSIDE layout.js, so the real Sidebar and Header are already
// on screen when this renders and only the content area needs filling. That is
// why HomeSkeleton draws no chrome of its own.
//
// Scope: this boundary covers this segment's page plus any child segment without
// a closer loading file. Every route under (pages) has one — the group's own
// generic fallback at minimum — so in practice this is the home page only.

import HomeSkeleton from "@/app/(components)/skeletons/HomeSkeleton";

export default function Loading() {
  return <HomeSkeleton />;
}
