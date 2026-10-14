"use client";

import React, { useRef, useState } from "react";
import { ArrowLeft, Upload, X } from "lucide-react";
import PanelSearchInput from "../panels/shared/PanelSearchInput";
import MediaTile from "../panels/uploads/MediaTile";
import usePexelsSearch from "../panels/uploads/usePexelsSearch";
import useVideoSources from "./useVideoSources";

/**
 * ReplaceVideoPanel — Canva's Replace for a video: pick new footage for the
 * selected video from anywhere you already have it, in sections:
 *
 *   Your uploads · From your creatives · AI generated · Trending · People · …
 *
 * Each section shows its first few and "See all" opens the whole of it; the
 * search box searches stock video instead. "Upload a video" replaces it with a
 * file from your device. Whatever is picked keeps the video's box, look and
 * place in the stack (DesignEditor's replaceVideo).
 *
 * Props: { editor, onReplace: (id, source) => void, onClose }
 */
const PREVIEW_COUNT = 4;

export default function ReplaceVideoPanel({ editor, onReplace, onClose }) {
  const el = editor?.selectedElement;
  const isVideo = el?.type === "video";
  const [query, setQuery] = useState("");
  const [openSection, setOpenSection] = useState(null); // a section id, or null
  const fileRef = useRef(null);
  const sources = useVideoSources();
  const q = query.trim();
  const search = usePexelsSearch({ query: q, type: "video" });

  const pick = (item) =>
    onReplace?.(el.id, { src: item.src, poster: item.thumb, duration: item.duration });

  // Your own media first, then stock — the order you'd look in.
  const sections = [
    { id: "uploads", title: "Your uploads", ...sources.uploads },
    { id: "creatives", title: "From your creatives", ...sources.creatives },
    { id: "ai", title: "AI generated", ...sources.ai },
    ...sources.stock,
  ];
  const open = sections.find((s) => s.id === openSection);

  return (
    <section className="w-full h-[55dvh] shrink-0 bg-surface border-t border-gray-200 rounded-t-2xl shadow-2xl flex flex-col lg:w-75 lg:h-auto lg:rounded-none lg:shadow-none lg:border-t-0 lg:border-r">
      <header className="h-12 shrink-0 flex items-center gap-1 px-2 border-b border-gray-100">
        {open && (
          <button
            onClick={() => setOpenSection(null)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 cursor-pointer transition"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <h2 className="flex-1 px-2 text-sm font-bold text-gray-800">
          {open ? open.title : "Replace"}
        </h2>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {!isVideo ? (
        <p className="px-4 py-6 text-xs text-gray-400">Select a video to replace it.</p>
      ) : open ? (
        <div className="flex-1 overflow-y-auto p-3">
          <Grid items={open.items} loading={open.loading} onPick={pick} />
          {open.id === "uploads" && open.hasMore && (
            <button
              onClick={open.loadMore}
              className="mt-3 w-full h-9 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer transition"
            >
              Load more
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-5">
          <PanelSearchInput value={query} onChange={setQuery} placeholder="Search videos" />

          <button
            onClick={() => fileRef.current?.click()}
            className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 cursor-pointer transition"
          >
            <Upload className="w-4 h-4" />
            Upload a video
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onReplace?.(el.id, f);
              e.target.value = "";
            }}
          />

          {q ? (
            search.error ? (
              <p className="text-xs text-red-500 text-center py-6">
                Couldn’t search videos — {search.error}.
              </p>
            ) : (
              <Grid
                items={search.results.map((r) => ({
                  id: `search-${r.id}`,
                  src: r.full,
                  thumb: r.thumb,
                  duration: r.duration,
                  label: r.alt,
                }))}
                loading={search.loading}
                onPick={pick}
                empty={`No videos for “${q}”.`}
              />
            )
          ) : (
            sections.map((s) =>
              // An empty finished section is left out, not shown as a hole.
              !s.loading && !s.items.length ? null : (
                <div key={s.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">{s.title}</p>
                    {s.items.length > PREVIEW_COUNT && (
                      <button
                        onClick={() => setOpenSection(s.id)}
                        className="text-xs font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
                      >
                        See all
                      </button>
                    )}
                  </div>
                  <Grid
                    items={s.items.slice(0, PREVIEW_COUNT)}
                    loading={s.loading}
                    onPick={pick}
                  />
                </div>
              ),
            )
          )}
        </div>
      )}
    </section>
  );
}

/** Two-up grid of video tiles, with skeletons while its list loads. */
function Grid({ items, loading, onPick, empty }) {
  if (loading && !items.length) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: PREVIEW_COUNT }, (_, i) => (
          <span key={i} className="aspect-square rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }
  if (!items.length) {
    return <p className="text-xs text-gray-400 text-center py-6">{empty || "Nothing here yet."}</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((it) => (
        <MediaTile
          key={it.id}
          type="video"
          src={it.src}
          thumb={it.thumb}
          duration={it.duration}
          label={it.label}
          onPick={() => onPick(it)}
        />
      ))}
    </div>
  );
}
