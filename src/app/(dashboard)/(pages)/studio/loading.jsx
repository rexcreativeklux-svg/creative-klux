"use client";

// /studio and /studio/create-from-url — loading UI.
//
// NOT the whole studio segment: /studio/ai-chat-page and /studio/select are
// full-bleed and shaped nothing like this, so each carries its own loading.jsx
// and takes precedence over this one.
//
// The shape lives in StudioSkeleton because the page's own Suspense boundary
// (around useSearchParams) renders it too — see studio/page.jsx.

import StudioSkeleton from "@/app/(components)/skeletons/StudioSkeleton";

export default function Loading() {
  return <StudioSkeleton />;
}
