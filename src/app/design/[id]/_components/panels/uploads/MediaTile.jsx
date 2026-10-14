"use client";

import React from "react";
import { Film, AudioLines, FileText } from "lucide-react";
import { formatSeconds } from "@/(lib)/design/video";

const TILE =
  "relative w-full aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 cursor-pointer transition hover:border-blue-400";

/**
 * MediaTile — one item in the uploads panel, rendered by media type.
 *
 * Images and videos are insertable. Audio and documents still render so the
 * panel mirrors the gallery, and `onPick` explains why they can't be placed
 * rather than failing silently.
 *
 * Props: { type, src, thumb?, label?, duration?, onPick }
 */
export default function MediaTile({ type, src, thumb, label, duration, onPick }) {
  const title = label || type;

  if (type === "video") {
    return (
      <button onClick={onPick} title={title} className={`${TILE} bg-black`}>
        {/* Length chip, top-left like Canva's — only when the source told us. */}
        {Number(duration) > 0 && (
          <span className="absolute top-1 left-1 z-10 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold tabular-nums">
            {formatSeconds(duration)}
          </span>
        )}
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={title} className="w-full h-full object-cover" />
        ) : (
          <video
            src={src}
            preload="metadata"
            muted
            className="w-full h-full object-cover"
          />
        )}
        <Badge icon={Film} />
      </button>
    );
  }

  if (type === "audio") {
    return (
      <button onClick={onPick} title={title} className={`${TILE} flex flex-col items-center justify-center gap-1 p-2`}>
        <AudioLines className="w-6 h-6 text-gray-400" />
        <span className="text-[9px] text-gray-500 line-clamp-2 text-center leading-tight">
          {title}
        </span>
      </button>
    );
  }

  if (type === "document") {
    return (
      <button onClick={onPick} title={title} className={`${TILE} flex flex-col items-center justify-center gap-1 p-2`}>
        <FileText className="w-6 h-6 text-blue-400" />
        <span className="text-[9px] text-gray-500 line-clamp-2 text-center leading-tight">
          {title}
        </span>
      </button>
    );
  }

  // Images are also draggable — drop one onto a frame or grid cell to fill it.
  const onDragStart = (e) => {
    if (!src) return;
    e.dataTransfer.setData("application/x-ck-image", src);
    e.dataTransfer.setData("text/uri-list", src);
    e.dataTransfer.setData("text/plain", src);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <button
      onClick={onPick}
      title={title}
      draggable
      onDragStart={onDragStart}
      className={TILE}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumb || src}
        alt={title}
        loading="lazy"
        draggable={false}
        className="w-full h-full object-cover"
      />
    </button>
  );
}

/** Corner chip marking a tile that isn't a plain image. */
function Badge({ icon: Icon }) {
  return (
    <span className="absolute bottom-1 right-1 w-5 h-5 rounded-md bg-black/60 flex items-center justify-center">
      <Icon className="w-3 h-3 text-white" />
    </span>
  );
}
