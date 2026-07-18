"use client";

import React from "react";
import { getMediaTypeMeta, classifyMediaType } from "@/app/(components)/gallery/mediaTypes";
import useInfiniteScroll from "@/app/(components)/gallery/useInfiniteScroll";
import GallerySkeleton from "@/app/(components)/gallery/GallerySkeleton";
import MediaGrid from "./MediaGrid";
import MediaTile from "./MediaTile";

/**
 * GalleryList — the user's own uploads for the active tab, straight from
 * /gallery via useGalleryMedia. Paginated: scrolling to the bottom loads the
 * next page, with skeletons that match the panel's 2-up grid.
 *
 * Props: {
 *   items, loading, loadingMore, hasMore,
 *   typeId, onPick: (type, src) => void, onLoadMore: () => void,
 * }
 */
export default function GalleryList({
  items,
  loading,
  loadingMore = false,
  hasMore = false,
  typeId,
  onPick,
  onLoadMore,
}) {
  const { label, icon: Icon } = getMediaTypeMeta(typeId);

  // Sentinel resolves to the editor panel's own scroll container automatically.
  const sentinelRef = useInfiniteScroll({
    onLoadMore,
    hasMore,
    loading: loadingMore,
  });

  return (
    <>
      <MediaGrid
        loading={loading}
        isEmpty={!items?.length}
        empty={
          <div className="flex flex-col items-center gap-2 py-10 text-gray-300">
            <Icon className="w-8 h-8" />
            <p className="text-xs text-gray-400">No {label.toLowerCase()} yet</p>
          </div>
        }
      >
        {items?.map((item) => {
          const type = classifyMediaType(item);
          return (
            <MediaTile
              key={item.id ?? item.src}
              type={type}
              src={item.src}
              thumb={item.thumbnail || item.thumb}
              label={item.filename || item.alt}
              onPick={() => onPick(type, item.src)}
            />
          );
        })}
        {/* Load-more skeletons flow inside the same 2-up grid. */}
        {loadingMore && <GallerySkeleton type={typeId} count={4} />}
      </MediaGrid>

      {/* Sentinel — only while there are items and more pages to fetch. */}
      {hasMore && !!items?.length && (
        <div ref={sentinelRef} className="h-px w-full" />
      )}
    </>
  );
}
