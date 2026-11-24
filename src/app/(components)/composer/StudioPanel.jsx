"use client";

// app/(components)/composer/StudioMediaPicker.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The "Magic Studio ›" and "Creative Studio ›" flyouts in the composer's Add
// multimedia menu — the same panel as "Stock images ›", filled with what the
// app has already made instead of Pexels. A click puts it in the post.
//
//   magic     every Magic Studio tool's history (POST /magic-studio/history,
//             one call per tool), images and videos only, newest first. These
//             are hosted files, so a pick goes straight in through `onPick`.
//   creative  the brand's saved designs (GET /creative-designs, a page at a
//             time). A design is a layout, not a file, so a pick is painted to
//             a PNG and handed to `onFile` — the composer uploads it the same
//             way it uploads a file from the computer.
//
// ⚠️ ONLY SAVED DESIGNS. A design generated in Creative Studio's chat and never
// saved lives only in that tab's memory; there is nothing on the server to list.
//
// The flyout opens on HOVER, so it's mounted and unmounted as the pointer
// crosses the menu. Each studio's list is kept for a couple of minutes at module
// level, or every pass over the row would re-ask a dozen endpoints.

import { useEffect, useMemo, useState } from "react";
import { ImageOff, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { getMagicHistory } from "@/(lib)/magic-studio-api";
import { MAGIC_STUDIO_CONFIGS } from "@/app/(dashboard)/(pages)/magic-studio/magicStudioConfigs";
import { normalizeDesign, toProxiedSrc, DesignCanvas } from "@/app/(components)/creatives/DesignDetailsPanel";
import { designToBlob } from "@/app/(dashboard)/(pages)/creatives/CreativesBulkBar";
import { withFileTimeout } from "@/app/(components)/product-studio/saveToGallery";
import { useAuth } from "@/context/AuthContext";

const DESIGN_PAGE_SIZE = 24;
const CACHE_MS = 2 * 60 * 1000;

/**
 * Every Magic Studio tool that keeps server-side history and can make an image
 * or a video. Voice, audio and copy tools are left out — nothing in them can be
 * posted as media, so asking would only slow the list.
 */
const MAGIC_TOOLS = Object.values(MAGIC_STUDIO_CONFIGS)
  .filter((c) => c?.historyTool && !["audio", "text"].includes(c.resultType))
  .map((c) => ({ tool: c.historyTool, title: c.title }));

const newestFirst = (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0);

/** The chips at the top of each flyout, and what each one keeps. */
const MAGIC_FILTERS = [
  ["all", "All", () => true],
  ["ads", "Ads", (it) => it.tool === "ad-design"],
  ["social", "Social", (it) => it.tool === "social-design"],
  ["image", "Images", (it) => it.type === "image" && !["ad-design", "social-design"].includes(it.tool)],
  ["video", "Videos", (it) => it.type === "video"],
];
const DESIGN_FILTERS = [
  ["all", "All", () => true],
  ["ads", "Ads", (d) => d.category === "ads"],
  ["social", "Social", (d) => d.category === "social"],
  ["design", "Design", (d) => d.category === "design"],
];

const fileSlug = (name) =>
  String(name || "design")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "design";

// ── Data ─────────────────────────────────────────────────────────────────────

/** Magic Studio's list, kept between openings: { at, items, failed, waiting }. */
let magicCache = null;

/**
 * Magic Studio: every tool's finished images and videos, newest first. Each
 * tool's history is its own request and the slowest took ~10s, so the grid
 * fills in as each one answers. `waiting` is how many haven't answered yet.
 */
function useMagicItems() {
  // Decided once, when the flyout mounts: the cached list if it's recent,
  // otherwise a fresh load (`cached: false` tells the effect to fetch).
  const [state, setState] = useState(() =>
    magicCache && Date.now() - magicCache.at < CACHE_MS
      ? { ...magicCache, cached: true }
      : { at: 0, items: [], failed: 0, waiting: MAGIC_TOOLS.length, cached: false },
  );
  const cached = state.cached;

  useEffect(() => {
    if (cached) return;
    let alive = true;
    // Built here as well as in state, so the cache is complete even if the
    // flyout closes before every tool has answered.
    const run = { at: Date.now(), items: [], failed: 0, waiting: MAGIC_TOOLS.length };
    const settle = (patch) => {
      Object.assign(run, patch(run));
      // Kept only when every tool answered — a half list would stick for minutes.
      if (run.waiting === 0 && run.failed === 0) magicCache = { ...run };
      if (alive) setState({ ...run, cached: false });
    };
    MAGIC_TOOLS.forEach(({ tool, title }) => {
      getMagicHistory(tool).then(
        (list) =>
          settle((r) => {
            const found = list
              .filter((it) => !it.pending && it.url && (it.type === "image" || it.type === "video"))
              .map((it) => ({ ...it, tool, toolTitle: title }));
            return {
              waiting: r.waiting - 1,
              items: found.length ? [...r.items, ...found].sort(newestFirst) : r.items,
            };
          }),
        () => settle((r) => ({ waiting: r.waiting - 1, failed: r.failed + 1 })),
      );
    });
    return () => {
      alive = false;
    };
  }, [cached]);

  return state;
}

/** Saved designs, kept between openings, per brand. */
let designCache = null; // { brandId, at, items, page, more }

/** What a fetched page of designs does to the list (or the error when it failed). */
const applyDesignPage = (page, res) => (s) => {
  if (!res) return { ...s, loading: false, error: "Couldn't load your designs." };
  const rows = (res.data || []).map(normalizeDesign);
  const lastPage = res.last_page || 1;
  return {
    ...s,
    loading: false,
    error: null,
    items: page === 1 ? rows : [...s.items, ...rows],
    page,
    more: page < lastPage,
  };
};

/** Creative Studio: the brand's saved designs, a page at a time. */
function useDesignItems() {
  const { fetchDesigns, activeBrandId } = useAuth();
  // Decided once, when the flyout mounts — see useMagicItems.
  const [state, setState] = useState(() =>
    designCache && designCache.brandId === activeBrandId && Date.now() - designCache.at < CACHE_MS
      ? { ...designCache, loading: false, error: null, cached: true }
      : { loading: true, error: null, items: [], page: 0, more: false, cached: false },
  );
  const cached = state.cached;

  // Every loaded page is mirrored to the cache, so reopening shows the same list.
  useEffect(() => {
    if (!state.loading && !state.error && state.page > 0)
      designCache = { brandId: activeBrandId, at: designCache?.at ?? state.loadedAt, items: state.items, page: state.page, more: state.more };
  }, [state, activeBrandId]);

  useEffect(() => {
    if (cached) return;
    let alive = true;
    fetchDesigns?.(DESIGN_PAGE_SIZE, 1).then((res) => {
      if (!alive) return;
      designCache = null; // a new list, with its own age
      setState((s) => ({ ...applyDesignPage(1, res)(s), loadedAt: Date.now() }));
    });
    return () => {
      alive = false;
    };
  }, [cached, fetchDesigns]);

  const loadMore = async () => {
    const page = state.page + 1;
    setState((s) => ({ ...s, loading: true, error: null }));
    setState(applyDesignPage(page, await fetchDesigns?.(DESIGN_PAGE_SIZE, page)));
  };

  return { ...state, loadMore };
}

// ── The panel ────────────────────────────────────────────────────────────────

/** One thumbnail in the grid — a click adds it. */
function Thumb({ onClick, busy, disabled, title, badge, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="group relative h-24 cursor-pointer overflow-hidden rounded-lg bg-gray-100 disabled:cursor-wait"
    >
      {children}
      {badge && (
        <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded bg-black/60 px-1 py-0.5 text-[9px] font-semibold text-white">
          {badge}
        </span>
      )}
      {busy && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white">
          <Loader2 className="h-5 w-5 animate-spin" />
        </span>
      )}
      <span className="absolute inset-0 ring-2 ring-inset ring-transparent transition-colors group-hover:ring-[#003dda]" />
    </button>
  );
}

const Skeletons = () => (
  <div className="grid grid-cols-2 gap-2">
    {Array.from({ length: 6 }, (_, i) => (
      <span key={i} className="block h-24 animate-pulse rounded-lg bg-gray-100" />
    ))}
  </div>
);

const Empty = ({ children }) => (
  <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
    <ImageOff className="h-6 w-6 text-gray-300" />
    <p className="text-xs text-gray-500">{children}</p>
  </div>
);

/** The chips row — where the stock panels have their search box. */
function Chips({ filters, value, onChange, counts }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 p-2.5">
      {filters.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
            value === id ? "border-[#003dda] bg-blue-50 text-[#003dda]" : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          {label}
          {counts && <span className="ml-1 tabular-nums text-gray-400">{counts[id]}</span>}
        </button>
      ))}
    </div>
  );
}

function MagicPanel({ onPick, imagesOnly }) {
  const { items, failed, waiting } = useMagicItems();
  const filters = imagesOnly ? MAGIC_FILTERS.filter(([id]) => id !== "video") : MAGIC_FILTERS;
  const [filter, setFilter] = useState("all");
  const usable = useMemo(() => (imagesOnly ? items.filter((it) => it.type === "image") : items), [items, imagesOnly]);
  const keep = filters.find(([id]) => id === filter)[2];
  const shown = usable.filter(keep);
  const counts = waiting === 0 ? Object.fromEntries(filters.map(([id, , f]) => [id, usable.filter(f).length])) : null;

  return (
    <>
      <Chips filters={filters} value={filter} onChange={setFilter} counts={counts} />
      <div className="h-80 overflow-y-auto p-2">
        {shown.length === 0 ? (
          waiting > 0 ? (
            <Skeletons />
          ) : (
            <Empty>
              {failed === MAGIC_TOOLS.length
                ? "Couldn't load your Magic Studio history."
                : filter === "all"
                  ? "Nothing generated in Magic Studio yet."
                  : "Nothing here yet."}
            </Empty>
          )
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {shown.map((it) => (
              <Thumb
                key={it.id}
                title={it.prompt ? `${it.toolTitle} — ${it.prompt}` : it.toolTitle}
                badge={
                  it.type === "video" ? (
                    <>
                      <Play className="h-2 w-2 fill-current" /> VIDEO
                    </>
                  ) : null
                }
                onClick={() =>
                  onPick({
                    type: it.type,
                    url: it.url,
                    previewUrl: it.url,
                    name: `magic-${String(it.id).replace(/[^a-z0-9]+/gi, "-")}.${it.type === "video" ? "mp4" : "png"}`,
                  })
                }
              >
                {it.type === "video" && !it.thumbnail ? (
                  <video src={`${it.url}#t=0.1`} muted playsInline preload="metadata" className="h-full w-full bg-black object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.thumbnail || it.url}
                    alt={it.prompt || ""}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                )}
              </Thumb>
            ))}
          </div>
        )}
      </div>
      <p className="flex items-center justify-end gap-1.5 border-t border-gray-100 px-3 py-1.5 text-[10px] text-gray-400">
        {waiting > 0 && shown.length > 0 && (
          <>
            <Loader2 className="h-3 w-3 animate-spin" /> Loading more ·
          </>
        )}
        From your Magic Studio
      </p>
    </>
  );
}

function CreativePanel({ onFile, onDone }) {
  const designs = useDesignItems();
  const [filter, setFilter] = useState("all");
  const [preparing, setPreparing] = useState(null); // design id being painted
  const keep = DESIGN_FILTERS.find(([id]) => id === filter)[2];
  const shown = designs.items.filter(keep);

  const add = async (design) => {
    setPreparing(design.id);
    try {
      const blob = await withFileTimeout(designToBlob(design));
      const ext = blob.type?.includes("jpeg") ? "jpg" : "png";
      // The design's copy goes along, for the composer to fill the text from.
      onFile(new File([blob], `${fileSlug(design.name)}.${ext}`, { type: blob.type || "image/png" }), {
        copy: design.copy,
      });
      onDone();
    } catch (err) {
      console.error("❌ [creative studio flyout] couldn't paint design:", design.id, err);
      toast.error("Couldn't prepare that design. Please try again.");
      setPreparing(null);
    }
  };

  return (
    <>
      <Chips filters={DESIGN_FILTERS} value={filter} onChange={setFilter} />
      <div className="h-80 overflow-y-auto p-2">
        {designs.loading && designs.items.length === 0 ? (
          <Skeletons />
        ) : designs.error && designs.items.length === 0 ? (
          <Empty>{designs.error}</Empty>
        ) : shown.length === 0 && !designs.more ? (
          <Empty>{filter === "all" ? "No saved designs yet. Save one in Creative Studio and it shows up here." : "No saved designs of this kind."}</Empty>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {shown.map((d) => (
                <Thumb
                  key={d.id}
                  title={d.name}
                  busy={preparing === d.id}
                  disabled={preparing != null}
                  onClick={() => add(d)}
                >
                  {d.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={toProxiedSrc(d.image)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center p-1">
                      <DesignCanvas variation={d} fit />
                    </span>
                  )}
                </Thumb>
              ))}
            </div>
            {designs.more && (
              <button
                type="button"
                onClick={designs.loadMore}
                disabled={designs.loading}
                className="mx-auto mt-2 flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[#003dda] transition-colors hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60"
              >
                {designs.loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Load more
              </button>
            )}
          </>
        )}
      </div>
      <p className="border-t border-gray-100 px-3 py-1.5 text-right text-[10px] text-gray-400">
        Your saved designs · added as an image
      </p>
    </>
  );
}

/**
 * @param {object} props
 * @param {"magic"|"creative"} props.source
 * @param {(media: {type, url, previewUrl?, name?}) => void} props.onPick A hosted file.
 * @param {(file: File, extra?: {copy?: object}) => void} props.onFile A painted
 *   design (and its copy), for the composer to upload.
 * @param {() => void} props.onDone Close the menu once something's been added.
 * @param {boolean} [props.imagesOnly] Leave videos out.
 */
export default function StudioPanel({ source, onPick, onFile, onDone, imagesOnly = false }) {
  return (
    <div className="flex w-80 flex-col overflow-hidden rounded-xl border border-gray-200 bg-surface shadow-xl">
      {source === "magic" ? (
        <MagicPanel onPick={onPick} imagesOnly={imagesOnly} />
      ) : (
        <CreativePanel onFile={onFile} onDone={onDone} />
      )}
    </div>
  );
}
