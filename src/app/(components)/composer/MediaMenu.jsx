"use client";

// app/(components)/composer/MediaMenu.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The composer's "Add multimedia" button and its menu, laid out like
// Metricool's:
//
//   Add image                 → a file from the computer
//   Add video                 → a file from the computer
//   ───────────
//   My library                → the brand's gallery (MediaPickerModal)
//   Brand images              → the brand's own images
//   Generate with AI          → Magic Studio's stock-image generator
//   ───────────
//   Stock images          ›   → Pexels search, with Pexels' colour filter
//   Stock videos          ›   → Pexels search
//
// Metricool's third group is Adobe Express / Google Drive / Canva — apps the
// app has no connection to, so their place is taken by the app's own sources.
// Stock media comes through the app's /api/pexels proxy (free, the key stays
// on the server). A pick hands back a hosted link the networks can fetch.

import { useEffect, useId, useRef, useState } from "react";
import {
  ChevronRight,
  FolderOpen,
  ImageIcon,
  ImagePlus,
  Images,
  Search,
  Sparkles,
  Video,
  Clapperboard,
} from "lucide-react";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import FloatingPanel from "./FloatingPanel";

// Pexels' named colours (photos only).
const COLORS = [
  ["", "Any colour"],
  ["red", "#ef4444"],
  ["orange", "#f97316"],
  ["yellow", "#eab308"],
  ["green", "#22c55e"],
  ["turquoise", "#14b8a6"],
  ["blue", "#3b82f6"],
  ["violet", "#8b5cf6"],
  ["pink", "#ec4899"],
  ["brown", "#92400e"],
  ["black", "#111827"],
  ["gray", "#9ca3af"],
  ["white", "#ffffff"],
];

const isVideoUrl = (src = "") => /\.(mp4|mov|webm|m4v)(\?|$)/i.test(src);

/** The best mp4 Pexels offers up to 1080p — big enough to post, small enough to fetch. */
function pickVideoFile(video) {
  const files = (video.video_files || []).filter((f) => /mp4/i.test(f.file_type || ""));
  const fit = files.filter((f) => (f.height || 0) <= 1920 && (f.width || 0) <= 1920);
  const pool = fit.length ? fit : files;
  return pool.sort((a, b) => (b.width || 0) - (a.width || 0))[0];
}

/** One flyout: search Pexels, click a result to add it to the post. */
function StockPanel({ kind, onPick }) {
  const [query, setQuery] = useState("");
  const [color, setColor] = useState("");
  const [state, setState] = useState({ loading: true, items: [], error: null });
  const term = query.trim() || "business"; // something to look at before typing

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const params = new URLSearchParams({
          query: term,
          type: kind === "video" ? "videos" : "photos",
          per_page: "24",
        });
        if (color && kind === "image") params.set("color", color);
        const res = await fetch(`/api/pexels?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Pexels search failed");
        const items =
          kind === "video"
            ? (data.videos || [])
                .map((v) => ({ id: v.id, thumb: v.image, file: pickVideoFile(v), by: v.user?.name }))
                .filter((v) => v.file?.link)
            : (data.photos || []).map((p) => ({
                id: p.id,
                thumb: p.src?.medium || p.src?.small,
                full: p.src?.large2x || p.src?.large || p.src?.original,
                by: p.photographer,
                alt: p.alt,
              }));
        if (alive) setState({ loading: false, items, error: null });
      } catch (err) {
        if (alive) setState({ loading: false, items: [], error: err.message });
      }
    }, 350);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [term, color, kind]);

  return (
    <div className="flex w-80 flex-col overflow-hidden rounded-xl border border-gray-200 bg-surface shadow-xl">
      <div className="flex items-center gap-2 border-b border-gray-100 p-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={kind === "video" ? "Search free videos" : "Search free photos"}
            className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-2 text-xs text-gray-800 outline-none focus:border-[#003dda]"
          />
        </div>
        {kind === "image" && (
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            aria-label="Colour"
            className="h-8 cursor-pointer rounded-lg border border-gray-200 bg-gray-50 px-1.5 text-xs text-gray-700 outline-none"
          >
            {COLORS.map(([id, label]) => (
              <option key={id || "any"} value={id}>
                {id ? id.charAt(0).toUpperCase() + id.slice(1) : label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="h-80 overflow-y-auto p-2">
        {state.loading ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} className="block h-24 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : state.error ? (
          <p className="p-4 text-center text-xs text-gray-500">{state.error}</p>
        ) : state.items.length === 0 ? (
          <p className="p-4 text-center text-xs text-gray-500">No results for “{term}”.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {state.items.map((item) => (
              <button
                key={item.id}
                type="button"
                title={item.by ? `${item.alt || ""} — ${item.by} on Pexels` : undefined}
                onClick={() =>
                  kind === "video"
                    ? onPick({ type: "video", url: item.file.link, previewUrl: item.file.link, name: `pexels-${item.id}.mp4` })
                    : onPick({ type: "image", url: item.full, previewUrl: item.thumb, name: `pexels-${item.id}.jpg` })
                }
                className="group relative h-24 cursor-pointer overflow-hidden rounded-lg bg-gray-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.thumb} alt={item.alt || ""} loading="lazy" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" />
                {kind === "video" && (
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-semibold text-white">
                    VIDEO
                  </span>
                )}
                <span className="absolute inset-0 ring-2 ring-inset ring-transparent transition-colors group-hover:ring-[#003dda]" />
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="border-t border-gray-100 px-3 py-1.5 text-right text-[10px] text-gray-400">
        Powered by{" "}
        <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#05a081] hover:underline">
          Pexels
        </a>
      </p>
    </div>
  );
}

/**
 * @param {object} props
 * @param {boolean} [props.disabled]
 * @param {(file: File) => void} props.onFile   A file from the computer (the
 *   composer uploads it).
 * @param {(media: {type, url, previewUrl?, name?}) => void} props.onPick
 *   Already-hosted media (library, stock).
 * @param {object} [props.activeBrand]
 */
export default function MediaMenu({ disabled = false, onFile, onPick, activeBrand }) {
  const [open, setOpen] = useState(false);
  const [flyout, setFlyout] = useState(null); // "image" | "video" | null
  const [picker, setPicker] = useState(null); // MediaPickerModal tab, or null
  const rootRef = useRef(null); // the button's wrapper — the menu's anchor
  const panelRef = useRef(null); // the floating menu (portalled)
  const inputId = useId();

  const close = () => {
    setOpen(false);
    setFlyout(null);
  };

  // Outside click and Escape close the menu — and Escape stops there, so it
  // doesn't also close the composer behind it.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target) && !panelRef.current?.contains(e.target)) close();
    };
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      close();
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  // The hidden file inputs, found by id when a row is clicked.
  function chooseImage() {
    document.getElementById(`${inputId}-image`)?.click();
    close();
  }
  function chooseVideo() {
    document.getElementById(`${inputId}-video`)?.click();
    close();
  }

  const pick = (media) => {
    onPick(media);
    close();
  };

  const item = ({ icon: Icon, label, onClick, sub, active }) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      onMouseEnter={() => setFlyout(sub || null)}
      className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-gray-700 transition-colors hover:bg-gray-100 ${
        active ? "bg-gray-100" : ""
      }`}
    >
      <Icon className="h-4 w-4 shrink-0 text-gray-500" />
      <span className="flex-1">{label}</span>
      {sub && <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
    </button>
  );

  return (
    <div ref={rootRef} className="relative">
      <input
        id={`${inputId}-image`}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = ""; // the same file can be picked again
        }}
      />
      <input
        id={`${inputId}-video`}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        disabled={disabled}
        title="Add multimedia"
        aria-expanded={open}
        className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          open ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        }`}
      >
        <ImagePlus className="h-4.5 w-4.5" />
      </button>

      {open && (
        // Floats above the whole composer (the edit column scrolls and would
        // clip it), under the button — or above it when there's no room below.
        <FloatingPanel anchorRef={rootRef} panelRef={panelRef} className="flex items-start gap-2">
          <div className="w-56 rounded-xl border border-gray-200 bg-surface p-1.5 shadow-xl">
            {item({ icon: ImageIcon, label: "Add image", onClick: chooseImage })}
            {item({ icon: Video, label: "Add video", onClick: chooseVideo })}
            <div className="my-1 border-t border-gray-100" />
            {item({ icon: FolderOpen, label: "My library", onClick: () => { setPicker("library"); close(); } })}
            {item({ icon: Images, label: "Brand images", onClick: () => { setPicker("brand"); close(); } })}
            {item({ icon: Sparkles, label: "Generate with AI", onClick: () => { setPicker("stock"); close(); } })}
            <div className="my-1 border-t border-gray-100" />
            {item({
              icon: Images,
              label: "Stock images",
              sub: "image",
              active: flyout === "image",
              onClick: () => setFlyout("image"),
            })}
            {item({
              icon: Clapperboard,
              label: "Stock videos",
              sub: "video",
              active: flyout === "video",
              onClick: () => setFlyout("video"),
            })}
          </div>
          {flyout && <StockPanel key={flyout} kind={flyout} onPick={pick} />}
        </FloatingPanel>
      )}

      {/* The app's own media — library, brand images, AI generation. */}
      <MediaPickerModal
        isOpen={!!picker}
        initialTab={picker || "library"}
        activeBrand={activeBrand}
        maxSelectable={1}
        onClose={() => setPicker(null)}
        onCancel={() => setPicker(null)}
        onApply={(items, others = []) => {
          const first = items?.[0] || (others[0] ? { src: others[0] } : null);
          setPicker(null);
          const src = first?.src || first?.url;
          if (!src) return;
          const type = first.type === "video" || isVideoUrl(src) ? "video" : "image";
          onPick({ type, url: src, previewUrl: src, name: first.filename || first.name });
        }}
      />
    </div>
  );
}
