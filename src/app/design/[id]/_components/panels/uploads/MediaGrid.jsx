"use client";

import React from "react";
import GallerySkeleton from "@/app/(components)/gallery/GallerySkeleton";

/**
 * MediaGrid — two-up tile grid with the loading and empty states every uploads
 * list needs. Tiles are supplied by the caller so the gallery and stock lists
 * share one layout.
 *
 * While loading it shows shimmer tiles (GallerySkeleton) that match the real
 * grid, so results fade in place instead of replacing a spinner.
 *
 * Props: { loading, isEmpty, empty: ReactNode, skeletonType, children }
 */
export default function MediaGrid({
  loading,
  isEmpty,
  empty,
  skeletonType = "image",
  children,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <GallerySkeleton type={skeletonType} masonry={false} count={6} />
      </div>
    );
  }

  if (isEmpty) return empty;

  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}
