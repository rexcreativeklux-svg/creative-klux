"use client";

// /ads-content/* — loading UI for the section (publishing, calendar, analytics).
//
// Nests inside ads-content/layout.jsx, so SectionLayout's secondary sidebar is
// already drawn; only the content column belongs here.

import { SectionPageSkeleton } from "@/app/(components)/skeletons/PageSkeleton";

export default function Loading() {
  return <SectionPageSkeleton stats={4} panels={2} />;
}
