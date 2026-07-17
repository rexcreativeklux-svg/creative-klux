"use client";

import React from "react";
import { getMediaTypeMeta, classifyMediaType } from "@/app/(components)/gallery/mediaTypes";
import MediaGrid from "./MediaGrid";
import MediaTile from "./MediaTile";

/**
 * GalleryList — the user's own uploads for the active tab, straight from
 * /gallery via useGalleryMedia.
 *
 * Props: { items, loading, typeId, onPick: (type, src) => void }
 */
export default function GalleryList({ items, loading, typeId, onPick }) {
  const { label, icon: Icon } = getMediaTypeMeta(typeId);

  return (
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
    </MediaGrid>
  );
}
