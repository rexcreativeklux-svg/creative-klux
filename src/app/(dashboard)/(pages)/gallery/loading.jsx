"use client";

// /gallery — loading UI.
// Mirrors ImageGallery: the blue banner (drawn for real, since its colour is
// fixed and a grey slab there would read as a broken header), the media-type
// tab row with its two actions, then a masonry of image tiles — the image tab
// is the one the page opens on.

import Skeleton from "@/app/(components)/skeletons/Skeleton";

/** Uneven heights, so the columns stagger the way a real masonry does. */
const TILE_HEIGHTS = [180, 240, 150, 280, 200, 160, 260, 190, 230, 170, 210, 250];

export default function Loading() {
  // Matches ImageGallery's own frame exactly — a skeleton whose padding
  // differs from the real page makes the content jump on hand-off.
  return (
    <div className="min-h-full px-gutter py-page-y">
      {/* Header banner — real chrome, placeholder content */}
      <header className="mb-6 rounded-xl bg-blue-600 px-card py-5 shadow-lg sm:px-8 sm:py-6">
        <div className="flex items-center gap-3">
          <Skeleton w={30} h={30} className="rounded-md bg-white/30" tone="soft" />
          <div className="flex flex-col gap-2">
            <Skeleton h={18} w={150} className="bg-white/30" tone="soft" />
            <Skeleton h={11} w={300} className="max-w-full bg-white/20" tone="soft" />
          </div>
        </div>
      </header>

      {/* Toolbar: media-type tabs + Search stock / Upload */}
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="flex items-center gap-2">
          {[84, 78, 76, 92].map((width, index) => (
            <Skeleton key={index} h={34} w={width} className="rounded-lg" tone="soft" />
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-lg" tone="soft" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Masonry — same column counts and gaps as galleryGridClass("image") */}
      <div className="columns-2 gap-3 space-y-3 sm:columns-3 md:columns-4 lg:columns-5">
        {TILE_HEIGHTS.map((height, index) => (
          <Skeleton
            key={index}
            h={height}
            className="w-full break-inside-avoid rounded-2xl"
            tone="soft"
          />
        ))}
      </div>
    </div>
  );
}
