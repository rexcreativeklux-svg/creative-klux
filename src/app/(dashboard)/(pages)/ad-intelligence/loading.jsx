"use client";

// /ad-intelligence/* — loading UI for the section and all five tools.
//
// This nests inside ad-intelligence/layout.jsx, so SectionLayout's secondary
// sidebar is already on screen and only the content column is drawn here.

import { SectionPageSkeleton } from "@/app/(components)/skeletons/PageSkeleton";

export default function Loading() {
  return <SectionPageSkeleton stats={4} panels={2} />;
}
