"use client";

// app/(dashboard)/(pages)/loading.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The catch-all loading UI for inner dashboard pages.
//
// It exists so no inner route ever falls back to the HOME skeleton one level up:
// a greeting and a template rail would be a plainly wrong prediction of, say,
// /billing. This draws the neutral inner-page shape instead — heading, toolbar,
// card grid — which is close enough for any page that hasn't earned a bespoke
// skeleton yet.
//
// To give a route its own, drop a loading.jsx next to its page.jsx; the closer
// boundary wins and this one stops applying to it.

import PageSkeleton from "@/app/(components)/skeletons/PageSkeleton";

export default function Loading() {
  return <PageSkeleton />;
}
