"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  Search,
  LayoutGrid,
  List,
  Star,
  Trash2,
  Plus,
  Copy,
  Pencil,
  X,
  Check,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Send,
  CalendarClock,
  ScanSearch,
  TrendingUp,
  Wand2,
  RefreshCw,
  CheckSquare,
  Square,
  AlertTriangle,
  Loader2,
  Edit2,
  FileText,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Toast from "@/app/(components)/Toast";
import PublishModal from "@/app/(components)/PublishModal";
// The app's edge-anchored panel primitive — the same one the mobile nav uses.
// Brings the scrim, Escape, focus trap, swipe-to-dismiss, the notch insets and
// (the reason it's here) a width that cannot exceed the screen.
import Drawer from "@/app/(components)/ui/Drawer";
// Shared, read-only renderer — the exact one the editor (/design/[id]) uses to
// paint and export. Reused here so creatives previews/exports match the editor.
import {
  renderDesignToCanvas,
  renderDesignToBlob,
} from "@/(lib)/design/renderDesign";
// Shared branded download helper — names files creativeklux-<word>-<time>.<ext>,
// the same naming used by the photo editor (edit_a_photo/PhotoEditor).
import { downloadBlob } from "@/utils/downloadName";
import { toast } from "sonner";
import { useBreakpoint } from "@/utils/useMediaQuery";

// ── DesignCanvas ──────────────────────────────────────────────────────────────
// Read-only preview. Paints via the SAME renderer the editor uses
// (renderDesignToCanvas) so a creative's thumbnail matches exactly what opens in
// /design/[id] — including web-font loading, library shapes, background images,
// and text layout. No editing behavior is pulled in; this is pure paint.
//
// `fit` is for the fixed-size frames (the card's 16:9 tile, the table's 56×40
// thumb): the canvas is sized to fit INSIDE the box on both axes instead of
// being stretched to its width, so a portrait design is scaled down rather than
// having its top and bottom cropped away. Off by default, because the detail
// panel deliberately renders at full width with no height limit — and there a
// percentage max-height would resolve against an auto-height parent anyway.
function DesignCanvas({ variation, fit = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !variation?.canvas) return;

    let cancelled = false;
    (async () => {
      try {
        const off = await renderDesignToCanvas({
          canvas: variation.canvas,
          elements: variation.elements || [],
        });
        if (cancelled || !canvasRef.current) return;
        const target = canvasRef.current;
        target.width = off.width;
        target.height = off.height;
        const ctx = target.getContext("2d");
        ctx.clearRect(0, 0, off.width, off.height);
        ctx.drawImage(off, 0, 0);
      } catch {
        /* leave the canvas blank if rendering fails */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [variation]);

  if (!variation?.canvas) return null;

  return (
    <canvas
      ref={canvasRef}
      style={
        fit
          ? {
              // Both caps + auto sizing is the replaced-element equivalent of
              // `object-contain`: the browser shrinks the canvas until it fits
              // the box on both axes, keeping the design's own aspect ratio.
              maxWidth: "100%",
              maxHeight: "100%",
              width: "auto",
              height: "auto",
              display: "block",
            }
          : {
              width: "100%",
              height: "auto",
              display: "block",
            }
      }
    />
  );
}

// ── Normalize a raw design from the API ──────────────────────────────────────
function normalizeDesign(raw) {
  let parsed = raw.canvas;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = null;
    }
  }

  let canvasData = null;
  let elements = [];

  if (parsed && typeof parsed === "object") {
    if (parsed.canvas && Array.isArray(parsed.elements)) {
      canvasData = parsed.canvas;
      elements = parsed.elements;
    } else if (parsed.width && parsed.height) {
      canvasData = parsed;
    }
  }

  let copy = raw.copy || {};
  if (typeof copy === "string") {
    try {
      copy = JSON.parse(copy);
    } catch {
      copy = { body: copy };
    }
  }

  return {
    // Preserve every field the endpoint returned (s3_key, status, thumbnail,
    // sub_type, created_at, updated_at, user_id, fav, …) so nothing is dropped;
    // the transformed fields below override the raw ones where shapes differ.
    ...raw,
    id: raw.id,
    name: raw.name || "Untitled Design",
    type: raw.sub_type || raw.type || "image",
    category: raw.type || "ads",
    date: raw.created_at
      ? new Date(raw.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "—",
    // Backend returns `fav` as 1/0 — map it to the boolean the UI uses.
    favorite: Number(raw.fav ?? raw.favorite) === 1,
    score: raw.score || 0,
    copy,
    canvas: canvasData || { width: 800, height: 450, background: "#ffffff" },
    elements,
    brand_id: raw.brand_id,
    // Endpoint returns `thumbnail`, not `image_url` — fall back so previews work.
    image: raw.image_url || raw.thumbnail || null,
  };
}

// ── Filter structure — flat, no nested subtypes ───────────────────────────────
// Maps filter key → the type/category values from the API that belong to it
const FILTER_TYPE_MAP = {
  ads: ["ads"],
  social: ["social"],
  design: ["card", "banner", "designer", "design"],
  magic_studio: [
    "magic",
    "magic_studio",
    "text to image",
    "text to video",
    "image to variations",
    "audio to text",
  ],
};

const FILTER_GROUPS = [
  { label: "All", key: "all" },
  { label: "Ads", key: "ads" },
  { label: "Social", key: "social" },
  { label: "Design", key: "design" },
  // { label: "Magic Studio", key: "magic_studio" },
  { label: "★ Favorites", key: "favorites" },
];

/**
 * Does one creative belong to a filter tab?
 *
 * Shared by the visible list AND the tab counts so the two are decided by the
 * same rule — if they drifted, a tab would advertise a number that clicking it
 * doesn't produce.
 *
 * @param {{type: string, category: string, favorite: boolean}} creative
 * @param {string} filterKey One of FILTER_GROUPS' keys.
 */
const matchesFilter = (creative, filterKey) => {
  if (filterKey === "all") return true;
  if (filterKey === "favorites") return !!creative.favorite;
  const allowed = FILTER_TYPE_MAP[filterKey] || [];
  return (
    allowed.includes((creative.type || "").toLowerCase()) ||
    allowed.includes((creative.category || "").toLowerCase())
  );
};

/**
 * Does one creative match the search box? Name, type and tagline.
 *
 * @param {{name: string, type: string, copy?: {tagline?: string}}} creative
 * @param {string} term Raw search input; empty matches everything.
 */
const matchesSearch = (creative, term) => {
  const query = term.trim().toLowerCase();
  if (!query) return true;
  return (
    (creative.name || "").toLowerCase().includes(query) ||
    (creative.type || "").toLowerCase().includes(query) ||
    (creative.copy?.tagline || "").toLowerCase().includes(query)
  );
};

const TYPE_COLOR = {
  ads: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
    dot: "bg-blue-500",
  },
  social: {
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    border: "border-indigo-100",
    dot: "bg-indigo-500",
  },
  card: {
    bg: "bg-violet-50",
    text: "text-violet-600",
    border: "border-violet-100",
    dot: "bg-violet-500",
  },
  banner: {
    bg: "bg-teal-50",
    text: "text-teal-600",
    border: "border-teal-100",
    dot: "bg-teal-500",
  },
  image: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
    dot: "bg-blue-400",
  },
  video: {
    bg: "bg-cyan-50",
    text: "text-cyan-600",
    border: "border-cyan-100",
    dot: "bg-cyan-500",
  },
  poster: {
    bg: "bg-fuchsia-50",
    text: "text-fuchsia-700",
    border: "border-fuchsia-100",
    dot: "bg-fuchsia-600",
  },
  flyer: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-100",
    dot: "bg-violet-600",
  },
};
const DEFAULT_COLOR = {
  bg: "bg-gray-50",
  text: "text-gray-600",
  border: "border-gray-200",
  dot: "bg-gray-400",
};

// Default rows per page when the user has no saved choice.
const DEFAULT_PER_PAGE = 12;
// "Show N" presets — N is how many to show PER PAGE. The server paginates, so
// any size keeps paging as long as the brand has more than one page of designs.
const FETCH_OPTIONS = [12, 24, 48, 96];
// localStorage key remembering the user's page-size choice across visits.
const PER_PAGE_STORAGE_KEY = "ck_creatives_per_page";
// Bounds for the page size so a typed value can't request 0 or thousands.
const MIN_FETCH = 1;
const MAX_FETCH = 500;

/* ── Why everything is filtered on the CLIENT ────────────────────────────────
   GET /creative-designs accepts brand_id, per_page and page only. Passing
   `type`, `fav` or `search` was tried and the endpoint ignores them — every tab
   came back with the brand's full count and searching never changed the total.
   So the page loads the brand's designs ONCE (all pages, see loadDesigns) and
   does the filtering, searching, counting and paging here. If those params ever
   land server-side, this is the code to replace.                             */

/** Rows fetched per request while pulling the full set. */
const FETCH_PAGE_SIZE = 200;

/** Safety stop for the fetch-everything loop (200 × 50 = 10,000 designs). */
const MAX_FETCH_PAGES = 50;

/** Marker for a gap in the page list. */
const ELLIPSIS = "…";

/* How many page numbers sit either side of the current one. A phone can hold
   roughly "‹ 1 … 4 … 6 ›" beside the range label before the pager wraps onto a
   second line, so below `xs` the window collapses to the current page alone. */
const PAGER_SPAN = { compact: 0, roomy: 1 };

/**
 * The page numbers to actually render.
 *
 * The server decides how many pages exist, and a big brand can have dozens —
 * rendering one button each would overflow the bar. This keeps first and last
 * always reachable, shows a window around the current page, and drops an
 * ellipsis wherever numbers were skipped.
 *
 * @param {number} current  Current page (1-based).
 * @param {number} total    Total pages.
 * @param {number} [span]   How many neighbours to show either side. The page
 *   passes 0 on a phone, where a full row of numbers wrapped the pager onto a
 *   second line (see PAGER_SPAN below).
 * @returns {(number|string)[]} e.g. [1, "…", 6, 7, 8, "…", 42]
 */
function buildPageWindow(current, total, span = 1) {
  // How many pages still fit without needing gaps: first + last + the window
  // either side of the current page + one number in place of each gap. Derived
  // from `span` rather than hardcoded, so the compact pager starts collapsing
  // at 5 pages while the roomy one still lists all 7.
  const maxWithoutGaps = 2 * span + 5;
  if (total <= maxWithoutGaps) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set([1, total]);
  for (let p = current - span; p <= current + span; p += 1) {
    if (p > 1 && p < total) pages.add(p);
  }

  const ordered = [...pages].sort((a, b) => a - b);
  const withGaps = [];
  ordered.forEach((p, index) => {
    if (index > 0 && p - ordered[index - 1] > 1) withGaps.push(ELLIPSIS);
    withGaps.push(p);
  });
  return withGaps;
}

// Clamp any value to a whole number within [MIN_FETCH, MAX_FETCH]; 0/NaN → null.
const clampFetch = (n) => {
  const v = Math.round(Number(n) || 0);
  if (!v || v < MIN_FETCH) return null;
  return Math.min(MAX_FETCH, v);
};

// Read the user's saved load count (any valid number, not just a preset).
const readSavedPerPage = () => {
  if (typeof window === "undefined") return DEFAULT_PER_PAGE;
  return (
    clampFetch(window.localStorage.getItem(PER_PAGE_STORAGE_KEY)) ??
    DEFAULT_PER_PAGE
  );
};

// ── Load-count control ────────────────────────────────────────────────────────
// A "Show N" dropdown that lists preset amounts AND lets the user type a custom
// number (native <select> can't accept typing, so this is a small popover).
function LoadCountSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(String(value));
  const ref = useRef(null);

  // Close on outside click; snap the field back to the applied value.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setText(String(value));
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, value]);

  const commit = (n) => {
    onChange(n);
    setOpen(false);
  };

  return (
    // No `ml-auto` here: the toolbar groups this with the select toggle and the
    // view switcher and pushes the whole cluster right, so they stay on one line.
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setText(String(value)); // reflect the applied value when reopening
          setOpen((o) => !o);
        }}
        title="How many to show per page"
        className="flex items-center gap-1.5 bg-gray-100 text-xs font-semibold text-gray-600 rounded-xl px-2.5 py-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer sm:gap-2 sm:px-3"
      >
        Show {value}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-surface border border-gray-200 rounded-xl shadow-lg py-1 z-50">
          {/* Type a custom amount */}
          <div className="px-2 pb-1.5 mb-1 border-b border-gray-100">
            <input
              type="number"
              autoFocus
              value={text}
              min={MIN_FETCH}
              max={MAX_FETCH}
              placeholder="Custom…"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit(text);
              }}
              className="w-full bg-gray-100 text-xs font-semibold text-gray-600 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Preset amounts */}
          {options.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => commit(n)}
              className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-gray-100 cursor-pointer transition ${n === value ? "text-blue-600" : "text-gray-600"}`}
            >
              Show {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Create actions ────────────────────────────────────────────────────────────
// The ways to start a creative, declared ONCE. The desktop button pair and the
// mobile "+" menu both render from this list, so a route added here shows up in
// both and the two can't drift apart.
//
// `buttonClass` is only the desktop button's colourway — shape, padding and
// motion live on the shared class string at the call site.
const CREATE_ACTIONS = [
  {
    href: "/studio/create-from-url",
    label: "Create from URL",
    description: "Pull copy, colours and images straight from a web page.",
    buttonClass:
      "bg-gray-900 hover:bg-gray-800 text-gray-50 border border-gray-200 font-medium",
  },
  // Create using Scraive — kept out of the UI for now.
  // {
  //   href: "/studio/create-from-url?engine=redesign",
  //   label: "Create using Scraive",
  //   description: "Redesign an existing page with the Scraive engine.",
  //   buttonClass: "bg-violet-600 hover:bg-violet-700 text-white font-medium",
  // },
  // Instant Creation — kept out of the UI for now.
  // {
  //   href: "/",
  //   label: "Instant Creation",
  //   description: "Jump straight into a one-click creative.",
  //   buttonClass:
  //     "border border-gray-300 hover:bg-gray-200 text-gray-900 font-medium",
  // },
  {
    href: "/studio/select",
    label: "Custom Creation",
    description: "Start from a template or a blank canvas.",
    buttonClass: "bg-blue-600 hover:bg-blue-700 text-white font-semibold",
  },
];

// ── Create menu (phones) ──────────────────────────────────────────────────────
// Two "Create …" buttons are ~420px of content. On a 360px phone they took a
// full row of their own directly under the title, and between them the header
// ate half the first screen before a single design was visible.
//
// Nothing is removed — the same destinations open from one "+", so the header
// collapses to a single line and the grid starts near the top. From `sm` up the
// buttons are shown inline as before and this is hidden.
function CreateMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside tap and on Escape. The panel floats over the grid, so
  // leaving it open would otherwise swallow the next tap on a card.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0 sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Create a new design"
        className="ck-tap flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition-transform duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      >
        {/* The icon rotates into an "×" so the button reads as a toggle. */}
        <Plus
          className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-45" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 w-60 max-w-[75vw] overflow-hidden rounded-xl border border-gray-200 bg-surface shadow-lg py-1 z-50"
        >
          {CREATE_ACTIONS.map(({ href, label, description }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 hover:bg-gray-50 transition"
            >
              <span className="block text-sm font-semibold text-gray-800">
                {label}
              </span>
              <span className="block mt-0.5 text-2xs text-gray-400 leading-snug">
                {description}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CreativesPage() {
  const {
    fetchDesigns,
    activeBrandId,
    brandsLoading,
    deleteDesignById,
    bulkDeleteDesigns,
    updateDesignById,
    toggleDesignFavorite,
  } = useAuth();

  const [creatives, setCreatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  // The table view only exists from `md` up (see the toggle below).
  const isWideEnoughForTable = useBreakpoint("md");
  // Below `xs` (480px) the pager shares its line with the range label and can
  // only hold a handful of controls, so it drops to the narrow page window.
  const isWideEnoughForFullPager = useBreakpoint("xs");
  const [viewMode, setViewMode] = useState("grid");
  // Rows per PAGE (user-selectable), restored from their saved choice. Paging
  // is done here over the full set, so the pager appears whenever the current
  // filter holds more than this many — at every size, not just the large ones.
  const [fetchCount, setFetchCount] = useState(readSavedPerPage);
  const [selectedId, setSelectedId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [page, setPage] = useState(1);
  const [bulkSelected, setBulkSelected] = useState([]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [publishTarget, setPublishTarget] = useState(null);
  const [publishStartSchedule, setPublishStartSchedule] = useState(false);

  // Toast state
  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "success",
  });
  const showToast = (message, type = "success") =>
    setToast({ open: true, message, type });
  const closeToast = () => setToast((prev) => ({ ...prev, open: false }));

  // ── Load EVERY design for the brand ─────────────────────────────────────────
  // The endpoint can't filter or search (see the note at the top), so the tabs,
  // the search box and the counts can only be right if the whole set is here.
  // Page 1 tells us how many pages exist; any remainder is fetched in parallel.
  //
  // Deliberately NOT re-run when the tab, search or page size changes — those
  // are all client-side now, so refetching would be wasted work.
  const loadDesigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const first = await fetchDesigns(FETCH_PAGE_SIZE, 1);
      if (!first) {
        setCreatives([]);
        return;
      }

      let rows = first.data;
      const pageCount = Math.min(first.last_page || 1, MAX_FETCH_PAGES);

      if (pageCount > 1) {
        const rest = await Promise.all(
          Array.from({ length: pageCount - 1 }, (_, i) =>
            fetchDesigns(FETCH_PAGE_SIZE, i + 2),
          ),
        );
        rows = rows.concat(...rest.map((r) => r?.data || []));
      }

      if (first.last_page > MAX_FETCH_PAGES) {
        console.warn(
          `⚠️ [creatives] brand has ${first.last_page} pages; loaded the first ${MAX_FETCH_PAGES} (${rows.length} of ${first.total}). Counts and filters cover only what was loaded.`,
        );
      }

      console.log(`✅ [creatives] loaded ${rows.length} of ${first.total} designs`);
      setCreatives(rows.map(normalizeDesign));
    } catch {
      setError("Failed to load designs.");
      setCreatives([]);
    } finally {
      setLoading(false);
    }
  }, [fetchDesigns, activeBrandId]);

  useEffect(() => {
    if (!activeBrandId) {
      // The active brand may still be hydrating from localStorage (fetchBrands).
      // Keep showing the loading state until brands finish resolving — otherwise
      // we briefly flash the "No designs" empty state before the brand loads.
      if (brandsLoading) {
        setLoading(true);
        return;
      }
      setCreatives([]);
      setLoading(false);
      return;
    }
    loadDesigns();
  }, [loadDesigns, activeBrandId, brandsLoading]);

  // Change the page size, remember it, and jump back to page 1.
  // Clamped to a sane range so a typed value can't request 0 or thousands.
  const handleFetchCountChange = (n) => {
    const next = clampFetch(n);
    if (!next) return; // invalid/empty — ignore
    setFetchCount(next);
    setPage(1);
    try {
      localStorage.setItem(PER_PAGE_STORAGE_KEY, String(next));
    } catch {
      /* localStorage unavailable (private mode) — non-fatal */
    }
  };

  // ── CRUD wrappers using context ─────────────────────────────────────────────
  const deleteDesign = useCallback(
    async (id) => {
      setActionLoading(true);
      try {
        const res = await deleteDesignById(id);
        if (!res.ok) throw new Error(res.message);
        setCreatives((prev) => prev.filter((c) => c.id !== id));
        if (selectedId === id) setSelectedId(null);
        showToast("Design deleted", "success");
      } catch {
        showToast("Failed to delete design", "error");
      } finally {
        setActionLoading(false);
        setDeleteConfirm(null);
      }
    },
    [deleteDesignById, selectedId],
  );

  const bulkDeleteDesignsLocal = useCallback(
    async (ids) => {
      setActionLoading(true);
      try {
        const res = await bulkDeleteDesigns(ids);
        if (!res.ok) throw new Error(res.message);
        setCreatives((prev) => prev.filter((c) => !ids.includes(c.id)));
        setBulkSelected([]);
        setIsBulkMode(false);
        if (ids.includes(selectedId)) setSelectedId(null);
        showToast(
          `${ids.length} design${ids.length > 1 ? "s" : ""} deleted`,
          "success",
        );
      } catch {
        showToast("Failed to delete designs", "error");
      } finally {
        setActionLoading(false);
        setDeleteConfirm(null);
      }
    },
    [bulkDeleteDesigns, selectedId],
  );

  // ── Edit copy modal state ────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState(null);

  const updateDesignCopy = useCallback(
    async (id, fields) => {
      // fields: { name, copy: { headline, tagline, body, cta } }
      try {
        const res = await updateDesignById(id, {
          name: fields.name,
          copy: JSON.stringify(fields.copy),
        });
        if (!res.ok) throw new Error(res.message);
        setCreatives((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, name: fields.name, copy: fields.copy } : c,
          ),
        );
        showToast("Design updated", "success");
        setEditTarget(null);
      } catch {
        showToast("Failed to update design", "error");
      }
    },
    [updateDesignById],
  );

  const toggleFavorite = useCallback(
    async (id, e) => {
      e?.stopPropagation();

      const target = creatives.find((c) => c.id === id);
      if (!target) return;
      const nextFavorite = !target.favorite;

      // Optimistic flip so the star reacts instantly.
      setCreatives((prev) =>
        prev.map((c) => (c.id === id ? { ...c, favorite: nextFavorite } : c)),
      );

      const res = await toggleDesignFavorite(id, nextFavorite);
      if (!res?.ok) {
        // Revert on failure and let the user know.
        setCreatives((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, favorite: !nextFavorite } : c,
          ),
        );
        showToast(res?.message || "Could not update favorite", "error");
      }
    },
    [creatives, toggleDesignFavorite],
  );

  // ── Filtering ───────────────────────────────────────────────────────────────
  // `creatives` holds every design for the brand, so these see the whole set —
  // the tabs, the search and the counts are all true totals, not page-local.
  const filtered = useMemo(
    () =>
      creatives.filter(
        (c) => matchesSearch(c, search) && matchesFilter(c, activeFilter),
      ),
    [creatives, search, activeFilter],
  );

  /* Per-tab counts, keyed by filter key. The current SEARCH is applied but the
     active TAB deliberately is not, so each tab reports exactly what clicking it
     would show — counting without the search would let a tab read "Ads 12" while
     opening it lists 3. "All" is therefore the brand's real project total. */
  const filterCounts = useMemo(() => {
    const searchMatches = creatives.filter((c) => matchesSearch(c, search));
    return Object.fromEntries(
      FILTER_GROUPS.map(({ key }) => [
        key,
        searchMatches.filter((c) => matchesFilter(c, key)).length,
      ]),
    );
  }, [creatives, search]);

  // ── Paging ──────────────────────────────────────────────────────────────────
  // "Show N" is the page size, so the pager appears whenever the current filter
  // holds more than N — including at N = 12.
  const totalResults = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / fetchCount));
  const paginated = filtered.slice((page - 1) * fetchCount, page * fetchCount);
  const selected = creatives.find((c) => c.id === selectedId) || null;

  /* The detail drawer stays mounted for its 200ms exit animation, but
     `selectedId` is cleared the instant it's dismissed — so the panel would
     slide away blank. Remembering the last id keeps its contents on screen
     until it is gone. Tracked as a primitive id and adjusted during render
     (the same pattern as (dashboard)/layout.js) rather than in an effect. */
  const [lastSelectedId, setLastSelectedId] = useState(null);
  if (selectedId && selectedId !== lastSelectedId) setLastSelectedId(selectedId);
  const panelCreative =
    selected || creatives.find((c) => c.id === lastSelectedId) || null;

  const handleSearch = (v) => {
    setSearch(v);
    setPage(1); // a narrower search usually has fewer pages
  };

  const handleSelect = (id) => {
    if (isBulkMode) {
      setBulkSelected((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      );
    } else {
      setSelectedId((prev) => (prev === id ? null : id));
    }
  };

  const handleCopy = () => {
    if (!selected) return;
    const copy = selected.copy;
    const text =
      typeof copy === "string" ? copy : JSON.stringify(copy, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadDesign = async (c) => {
    try {
      let blob;
      if (c.canvas && c.elements?.length) {
        blob = await renderDesignToPngBlob(c);
      } else if (c.image) {
        const res = await fetch(toProxiedSrc(c.image));
        if (!res.ok) throw new Error("Could not fetch the image.");
        blob = await res.blob();
      } else {
        throw new Error("This design has nothing to download.");
      }

      const ext = blob.type?.includes("jpeg") ? "jpg" : "png";
      // Reusable branded download — creativeklux-<word>-<time>.<ext>.
      downloadBlob(blob, ext);
      showToast("Design downloaded ✓", "success");
    } catch (err) {
      showToast(err?.message || "Download failed. Please try again.", "error");
    }
  };

  const toggleBulkMode = () => {
    setIsBulkMode((v) => !v);
    setBulkSelected([]);
  };
  const selectAll = () => setBulkSelected(paginated.map((c) => c.id));
  const deselectAll = () => setBulkSelected([]);

  // ── Brand still resolving → full-page shimmer ────────────────────────────────
  // While the active brand hydrates (from localStorage / fetchBrands) we don't
  // yet know which designs to show, so the whole page is a shimmer. Once the
  // brand lands we drop straight into the real shell below — the static header
  // and toolbar render immediately and only the card grid keeps a skeleton
  // (see `loading` in the content area) until designs finish loading.
  if (brandsLoading) {
    return <CreativesPageSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertTriangle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-gray-500">{error}</p>
        <button
          onClick={loadDesigns}
          className="flex items-center gap-2 text-sm text-blue-600 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  return (
    // No bottom padding of its own: the pager is the last row and the dashboard
    // layout already reserves the mobile nav + page rhythm underneath. The extra
    // 16px only showed up as dead space between the pager and the bottom bar.
    <div className="flex flex-col justify-between h-full">
      {/* ── Toast ── */}
      <Toast
        message={toast.message}
        isOpen={toast.open}
        onClose={closeToast}
        type={toast.type}
      />

      {/* ── Header ──
          One line at every width. Two "Create …" buttons plus a heading is
          ~420px of content, so below `sm` they collapse behind the single "+"
          (<CreateMenu>) instead of stacking onto a row of their own — that row
          plus the eyebrow was most of what pushed the grid off a phone screen.
          The "LIBRARY" eyebrow is decorative, so it also waits for `sm`. */}
      <div className="flex flex-row items-center justify-between gap-3 pb-2 shrink-0 sm:pb-4">
        <div className="min-w-0">
          <p className="hidden text-2xs font-semibold text-gray-400 uppercase tracking-widest sm:block">
            Library
          </p>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight truncate sm:text-xl">
            My Creations
          </h1>
        </div>

        {/* Phones — same destinations, one button. */}
        <CreateMenu />

        {/* `sm` and up — both buttons inline, rendered from CREATE_ACTIONS. */}
        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          {CREATE_ACTIONS.map(({ href, label, buttonClass }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center justify-center gap-2 whitespace-nowrap text-sm px-4 py-2 rounded-lg transition-all hover:scale-105 duration-200 ${buttonClass}`}
            >
              <Plus className="w-4 h-4 shrink-0" /> {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Bulk action bar ──
          `flex-wrap`: four labels plus the delete button is wider than a 360px
          phone, and without it the row overflowed the page sideways. */}
      {isBulkMode && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl mb-2 shrink-0 sm:py-2.5 sm:mb-3">
          <span className="text-xs font-semibold text-blue-700">
            {bulkSelected.length} selected
          </span>
          <button
            onClick={selectAll}
            className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer transition"
          >
            Select all on page
          </button>
          <button
            onClick={deselectAll}
            className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition"
          >
            Deselect all
          </button>
          {bulkSelected.length > 0 && (
            <button
              onClick={() => setDeleteConfirm("bulk")}
              className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-red-500 border border-red-200 bg-surface px-3 py-1.5 rounded-lg hover:bg-red-50 cursor-pointer transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete {bulkSelected.length}
            </button>
          )}
        </div>
      )}

      {/* ── Toolbar ──
          Two lines on a phone, one wrapping line from `sm` up — the `order-*`
          swap is what does it, so both layouts come out of the same markup:

            phone   [ search ][ select · show N ]
                    [ ←— filter tabs, scrolling —→ ]

            sm+     [ search ][ tabs ] … [ select · show N · view ]

          The tabs scroll horizontally rather than wrapping. Wrapped, "★
          Favorites" dropped onto a second row and cost the grid another ~40px
          of height on exactly the screens that had none to spare. */}
      <div className="py-2 flex flex-wrap items-center gap-2 shrink-0 sm:py-3 sm:gap-3">
        <div className="relative order-1 flex-1 min-w-0 sm:min-w-45 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search creations..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* ── List controls ──
            Bulk-select, page size and (from `md`) the view switcher, kept in
            one cluster so they share a line at every width. The select toggle
            used to sit on its own row above the grid, where it was a whole row
            of height for one 32px button. */}
        <div className="order-2 flex shrink-0 items-center gap-1.5 sm:order-3 sm:ml-auto sm:gap-2">
          <button
            onClick={toggleBulkMode}
            title={isBulkMode ? "Exit select mode" : "Select multiple"}
            aria-label={isBulkMode ? "Exit select mode" : "Select multiple"}
            aria-pressed={isBulkMode}
            className={`ck-tap flex items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${isBulkMode ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200" : "bg-gray-100 text-gray-500 hover:text-gray-700"}`}
          >
            {isBulkMode ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>

          {/* Quantity — pick a preset or type a custom amount (persisted). */}
          <LoadCountSelect
            value={fetchCount}
            options={FETCH_OPTIONS}
            onChange={handleFetchCountChange}
          />

          {/* Hidden below `md`: the list view is an 8-column table that cannot
              be read on a phone, and offering the toggle strands anyone who
              taps it. The branch further down forces the grid at that width
              too, so a preference set on a laptop survives without following
              the user onto a screen it does not work on. */}
          <div className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "grid" ? "bg-surface shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "table" ? "bg-surface shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Flat filter tabs ──
            `w-max` on the inner row is what lets it overflow its scroller
            instead of wrapping; the scrollbar itself is hidden (hide-scrollbar)
            because the pills are visibly cut off, which is affordance enough. */}
        <div className="order-3 w-full overflow-x-auto overflow-y-hidden hide-scrollbar sm:order-2 sm:w-auto">
          <div className="flex w-max items-center gap-1 bg-gray-100 p-1 rounded-xl">
            {FILTER_GROUPS.map((group) => {
              const isActive = activeFilter === group.key;
              // The tab's real count across every design the brand has.
              const count = filterCounts[group.key] ?? 0;
              return (
                <button
                  key={group.key}
                  onClick={() => {
                    setActiveFilter(group.key);
                    setPage(1); // a narrower tab may have fewer pages
                  }}
                  className={`inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${isActive ? "bg-surface text-blue-600 shadow-sm border border-blue-100" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {group.label}
                  {/* Hidden while loading — every count would read 0 and then
                      jump, which looks like a broken empty state.
                      tabular-nums keeps the pill from twitching as digits change. */}
                  {!loading && (
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-2xs font-semibold leading-none tabular-nums ${isActive ? "bg-blue-50 text-blue-600" : "bg-gray-200/80 text-gray-500"}`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ──
          The select toggle that used to sit here now lives in the toolbar's
          control cluster, beside the "Show N" dropdown. */}
      <div className="flex-1 overflow-y-auto pb-1 sm:pb-2 lg:pb-0">
        {loading ? (
          <GridSkeleton count={fetchCount} />
        ) : paginated.length === 0 ? (
          // "No matches" vs "nothing created yet" turns on whether the brand has
          // any designs at all, not on how many survived the current filter.
          <EmptyState hasCreatives={creatives.length > 0} />
        ) : viewMode === "grid" || !isWideEnoughForTable ? (
          <GridView
            creatives={paginated}
            selectedId={selectedId}
            bulkSelected={bulkSelected}
            isBulkMode={isBulkMode}
            onSelect={handleSelect}
            onToggleFavorite={toggleFavorite}
            onDeleteRequest={setDeleteConfirm}
          />
        ) : (
          <TableView
            creatives={paginated}
            selectedId={selectedId}
            bulkSelected={bulkSelected}
            isBulkMode={isBulkMode}
            onSelect={handleSelect}
            onToggleFavorite={toggleFavorite}
            onDeleteRequest={setDeleteConfirm}
          />
        )}
      </div>

      {/* ── Pagination ──
          The page's last row, and the page is a full-height column, so this
          sits on the bottom edge at every width — flush against the mobile nav
          rather than floating with dead space beneath it.

          Everything here stays on ONE line: a narrower page window below `xs`,
          a shortened range label, and smaller controls. Wrapped, this bar was
          three lines tall on a phone and stole them from the grid.

          `lg:-mb-page-y` — desktop only. The dashboard shell pads every page
          with `pb-page-y` (28px at ≥1280), which on a bottom-anchored bar like
          this reads as dead space under the pager rather than page rhythm. The
          negative margin lets the bar reach INTO that padding so it sits flush
          on the viewport's bottom edge, and — because a flex item's outer size
          includes its margins — hands those 28px to the card grid above
          instead. Same trick as `-mx-gutter` on the bleed-to-edge scrollers in
          product-studio/MembersTab, one axis over.

          It cannot cause a scrollbar: the bar's border box then ends exactly on
          the shell's own bottom edge, never past it. Scoped to `lg` so phones
          and tablets keep the padded rhythm they were tuned with, and it lives
          inside the `totalPages > 1` branch, so a single-page library keeps its
          normal bottom padding. */}
      {totalPages > 1 && (
        <div className="shrink-0 flex items-center justify-between gap-2 px-1 py-2 border-t border-gray-100 rounded bg-surface sm:px-3 sm:py-3 lg:py-2 lg:-mb-page-y">
          <p className="text-2xs text-gray-400 whitespace-nowrap sm:text-xs">
            <span className="hidden xs:inline">Showing </span>
            {(page - 1) * fetchCount + 1}–
            {Math.min((page - 1) * fetchCount + paginated.length, totalResults)} of{" "}
            {totalResults}
          </p>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous page"
              className="ck-tap p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {buildPageWindow(
              page,
              totalPages,
              isWideEnoughForFullPager ? PAGER_SPAN.roomy : PAGER_SPAN.compact,
            ).map((p, index) =>
              p === ELLIPSIS ? (
                <span
                  key={`gap-${index}`}
                  className="w-4 text-center text-2xs text-gray-400 select-none sm:w-6 sm:text-xs"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? "page" : undefined}
                  className={`w-7 h-7 rounded-lg text-2xs font-semibold cursor-pointer transition-all sm:w-8 sm:h-8 sm:text-xs ${p === page ? "bg-blue-600 text-white shadow-sm" : "border border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                >
                  {p}
                </button>
              ),
            )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="Next page"
              className="ck-tap p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
            >
              <ChevronLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* ── Detail panel ──
          The app's own right-anchored <Drawer> rather than a hand-rolled fixed
          panel. The old one was a flat `w-105` (420px) at every width: on a
          360px phone it hung 60px past the left edge, so every line inside was
          clipped. Drawer caps itself at 85vw — which also leaves a strip of
          scrim to tap — and brings Escape, a focus trap, swipe-to-dismiss and
          the notch insets that the hand-rolled panel never had.

          `zIndex={50}` preserves the stacking this page already relied on: the
          edit-copy (z-70) and delete-confirm (z-60) modals open FROM the panel
          and must cover it, and Drawer's default of 120 would bury them. */}
      <Drawer
        isOpen={!!selected}
        onClose={() => setSelectedId(null)}
        side="right"
        label="Design details"
        zIndex={50}
        className="w-105"
      >
        {panelCreative && (
          <Sidebar
            creative={panelCreative}
            onClose={() => setSelectedId(null)}
            onToggleFavorite={toggleFavorite}
            onCopy={handleCopy}
            copied={copied}
            onDeleteRequest={setDeleteConfirm}
            onEdit={setEditTarget}
            onPublish={() => {
              setPublishStartSchedule(false);
              setPublishTarget(panelCreative); // capture the creative
              setSelectedId(null); // close the panel
            }}
            onSchedule={() => {
              setPublishStartSchedule(true); // open the modal straight into scheduling
              setPublishTarget(panelCreative);
              setSelectedId(null);
            }}
            onDownload={handleDownloadDesign}
          />
        )}
      </Drawer>

      {/* ── Edit Copy Modal ── */}
      {editTarget && (
        <EditCopyModal
          creative={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={updateDesignCopy}
        />
      )}

      {/* ── Publish Modal ── */}
      {publishTarget && (
        <PublishModal
          creative={publishTarget}
          startInSchedule={publishStartSchedule}
          onClose={() => setPublishTarget(null)}
          showToast={showToast}
        />
      )}

      {/* ── Delete confirm modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-60">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-sm shadow-xl mx-4">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {deleteConfirm === "bulk"
                ? `Delete ${bulkSelected.length} design${bulkSelected.length > 1 ? "s" : ""}?`
                : "Delete design?"}
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  deleteConfirm === "bulk"
                    ? bulkDeleteDesignsLocal(bulkSelected)
                    : deleteDesign(deleteConfirm)
                }
                disabled={actionLoading}
                className="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 cursor-pointer transition flex items-center gap-2"
              >
                {actionLoading && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Skeleton loaders ──────────────────────────────────────────────────────────
// Shimmer placeholder for a single creative card. Mirrors CreativeCard's shape
// (16:9 preview + name/tagline + footer meta) so the layout doesn't jump when
// the real designs land.
const CreativeCardSkeleton = () => (
  <div className="bg-surface rounded-lg border-2 border-gray-100 overflow-hidden flex flex-col animate-pulse">
    {/* Same geometry as the real card's preview — see the note there on why the
        120px floor only applies from `sm`. */}
    <div className="bg-gray-100 aspect-video min-h-20 sm:min-h-30" />
    <div className="flex flex-col flex-1 px-2 pt-2 pb-2 gap-2 sm:px-3 sm:pt-2.5 sm:pb-3">
      <div className="h-3.5 bg-gray-100 rounded w-3/4" />
      <div className="h-2.5 bg-gray-100 rounded w-1/2" />
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 sm:mt-3 sm:pt-2.5">
        <div className="h-2.5 bg-gray-100 rounded w-12" />
        <div className="h-5 bg-gray-100 rounded w-12" />
      </div>
    </div>
  </div>
);

// The one grid definition the cards, the fetch skeleton and the brand-resolving
// skeleton all share — two across on a phone (one was a single card per screen),
// widening to four on a large desktop.
const GRID_COLUMNS =
  "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4";

// Grid of card skeletons — shown in the content area while designs are fetching
// (the brand has already resolved, so the header/toolbar are already visible).
const GridSkeleton = ({ count = DEFAULT_PER_PAGE }) => (
  <div className={GRID_COLUMNS}>
    {Array.from({ length: count }).map((_, i) => (
      <CreativeCardSkeleton key={i} />
    ))}
  </div>
);

// Full-page shimmer shown while the active brand is still resolving. Mimics the
// header, toolbar and card grid so the page fades in place once the brand lands.
const CreativesPageSkeleton = () => (
  <div className="flex flex-col h-full animate-pulse">
    {/* Header — one "+" on a phone, both CTAs from `sm`, matching <CreateMenu>
        and the button pair it stands in for. */}
    <div className="flex items-center justify-between gap-3 pb-2 shrink-0 sm:pb-4">
      <div className="space-y-2">
        <div className="hidden h-2.5 w-16 bg-gray-100 rounded sm:block" />
        <div className="h-6 w-40 bg-gray-100 rounded" />
      </div>
      <div className="h-9 w-9 bg-gray-100 rounded-lg sm:hidden" />
      <div className="hidden gap-3 sm:flex">
        <div className="h-9 w-36 bg-gray-100 rounded-lg" />
        <div className="h-9 w-36 bg-gray-100 rounded-lg" />
      </div>
    </div>
    {/* Toolbar — search + controls on one line, tabs on their own below `sm`. */}
    <div className="py-2 flex flex-wrap items-center gap-2 shrink-0 sm:py-3 sm:gap-3">
      <div className="order-1 h-9 flex-1 min-w-0 bg-gray-100 rounded-md sm:min-w-45 sm:max-w-xs" />
      <div className="order-2 flex shrink-0 items-center gap-1.5 sm:order-3 sm:ml-auto sm:gap-2">
        <div className="h-9 w-9 bg-gray-100 rounded-xl" />
        <div className="h-9 w-24 bg-gray-100 rounded-xl" />
        <div className="hidden h-9 w-20 bg-gray-100 rounded-xl md:block" />
      </div>
      <div className="order-3 h-9 w-full bg-gray-100 rounded-xl sm:order-2 sm:w-80" />
    </div>
    {/* Grid */}
    <div className="flex-1 pt-2">
      <GridSkeleton count={8} />
    </div>
  </div>
);

// ── Grid View ─────────────────────────────────────────────────────────────────
const GridView = ({
  creatives,
  selectedId,
  bulkSelected,
  isBulkMode,
  onSelect,
  onToggleFavorite,
  onDeleteRequest,
}) => (
  <div className={GRID_COLUMNS}>
    {creatives.map((c) => (
      <CreativeCard
        key={c.id}
        creative={c}
        selected={selectedId === c.id}
        bulkChecked={bulkSelected.includes(c.id)}
        isBulkMode={isBulkMode}
        onSelect={() => onSelect(c.id)}
        onToggleFavorite={onToggleFavorite}
        onDeleteRequest={onDeleteRequest}
      />
    ))}
  </div>
);

// ── Card artwork ──────────────────────────────────────────────────────────────
/**
 * What fills a creative card's 16:9 preview frame.
 *
 * Designs are saved in every ratio — 1:1 and 4:5 social posts, 3:1 banners, the
 * odd 16:9 ad — but the frame is fixed. This used to stretch the artwork to the
 * card's WIDTH and let its height fall where it may, so anything taller than
 * 16:9 had its top and bottom cropped off and anything wider sat in a band of
 * grey. The artwork is CONTAINED here instead: the whole design is always
 * visible, and the letterbox around it is filled with a blurred, zoomed copy of
 * the same file — one network request, painted twice — so an off-ratio design
 * reads as a tile in its own colours rather than art floating in grey.
 *
 * Sources are tried in the order this page has always used — backend thumbnail,
 * then a canvas repaint, then any stored image URL — with one change: a source
 * that fails to load now falls THROUGH to the next one. Hiding the broken <img>
 * (the old `onError`) left an empty grey box with nothing to explain it.
 *
 * @param {{creative: object}} props `creative` is a normalizeDesign() result.
 */
const CardArtwork = ({ creative: c }) => {
  // Sources that 404'd or were blocked, so the ladder below can skip them.
  const [failed, setFailed] = useState({ thumbnail: false, image: false });

  const hasCanvas = c.canvas && c.elements?.length > 0;
  const thumbSrc = failed.thumbnail ? null : c.thumbnail;
  const imageSrc = failed.image ? null : c.image;
  // Thumbnail first; the image URL only stands in when there's no canvas to
  // paint — the same priority the card had before.
  const src = thumbSrc || (hasCanvas ? null : imageSrc);

  if (src) {
    const sourceKey = thumbSrc ? "thumbnail" : "image";
    return (
      <>
        {/* Backdrop. Same `src`, so it is served from cache, not fetched again.
            `scale-125` overshoots the frame by more than the blur radius at
            every card width — that overshoot is what stops a soft rim from
            showing along the edges. aria-hidden: it is the picture below. */}
        <img
          src={src}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full scale-125 select-none object-cover opacity-60 blur-lg"
        />
        {/* The design itself — `relative` so it paints ABOVE the absolutely
            positioned backdrop, which would otherwise cover a static sibling. */}
        <img
          src={src}
          alt={c.name}
          loading="lazy"
          decoding="async"
          onError={() => setFailed((prev) => ({ ...prev, [sourceKey]: true }))}
          className="relative h-full w-full object-contain drop-shadow-sm transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </>
    );
  }

  if (hasCanvas) {
    // A canvas can't be blurred into a backdrop the way an <img> can, so this
    // keeps the neutral tile — matched to the studio's TemplateCard — and just
    // makes sure the repaint is scaled to FIT the frame (see DesignCanvas's
    // `fit`) instead of overflowing it.
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-50 p-1.5 sm:p-2">
        <DesignCanvas
          variation={{ canvas: c.canvas, elements: c.elements }}
          fit
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 text-gray-300">
      <Wand2 className="w-8 h-8" />
      <span className="text-xs">No preview</span>
    </div>
  );
};

// ── Card ──────────────────────────────────────────────────────────────────────
const CreativeCard = ({
  creative: c,
  selected,
  bulkChecked,
  isBulkMode,
  onSelect,
  onToggleFavorite,
  onDeleteRequest,
}) => {
  const tc = TYPE_COLOR[c.type?.toLowerCase()] || DEFAULT_COLOR;
  const tagline = c.copy?.tagline || "";

  return (
    <div
      onClick={onSelect}
      className={`group bg-surface rounded-lg border-2 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col relative ${isBulkMode && bulkChecked ? "border-blue-500 shadow-lg shadow-blue-100/60" : selected ? "border-blue-500 shadow-lg shadow-blue-100/60" : "border-gray-100 hover:border-gray-200"}`}
    >
      {/* Bulk checkbox */}
      {isBulkMode && (
        <div
          className={`absolute top-2.5 left-2.5 z-10 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${bulkChecked ? "bg-blue-600 border-blue-600" : "bg-surface/80 border-gray-300"}`}
        >
          {bulkChecked && <Check className="w-3 h-3 text-white" />}
        </div>
      )}

      {/* Canvas / image preview area.
          The 120px floor is a `sm`-and-up rule now. Two cards across on a phone
          makes each ~160px wide, where 16:9 is only ~90px tall — the floor was
          padding every preview with 30px of empty grey and costing a row of
          cards per screen. `aspect-video` alone still can't collapse to zero. */}
      <div className="relative overflow-hidden bg-gray-100 flex items-center justify-center aspect-video min-h-20 sm:min-h-30">
        {/* Thumbnail → canvas repaint → image URL → placeholder, all contained
            in the frame rather than cropped by it. See <CardArtwork>. */}
        <CardArtwork creative={c} />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Type badge — top left. Tighter inset on a phone so it doesn't sit
            across a third of a 160px-wide preview. */}
        <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5">
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-2xs font-bold border backdrop-blur-sm bg-surface/90 ${tc.text} ${tc.border} capitalize sm:gap-1.5 sm:px-2`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
            {c.category}
          </span>
        </div>

        {/* Favorite indicator — top right */}
        {c.favorite && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-surface/90 backdrop-blur-sm rounded-full flex items-center justify-center border border-amber-100 shadow-sm sm:top-2.5 sm:right-2.5 sm:w-6 sm:h-6">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          </div>
        )}

        {/* Score badge — bottom right */}
        {c.score > 0 && (
          <div className="absolute bottom-2 right-2 bg-surface/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-bold text-green-600 border border-green-100">
            ★ {c.score}
          </div>
        )}

        {/* Tagline overlay — bottom left, shown on hover */}
        {tagline && (
          <div className="absolute bottom-2 left-2 right-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <p className="text-[10px] text-white font-medium leading-tight line-clamp-1 drop-shadow-sm">
              {tagline}
            </p>
          </div>
        )}
      </div>

      {/* Card body — tighter padding and rhythm on a phone, where the body used
          to be nearly as tall as the preview it described. */}
      <div className="flex flex-col flex-1 px-2 pt-2 pb-2 sm:px-3 sm:pt-2.5 sm:pb-3">
        <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>

        {/* Tagline always visible below name */}
        {tagline ? (
          <p className="text-2xs text-gray-400 mt-0.5 truncate italic">
            {tagline}
          </p>
        ) : (
          <p className="text-2xs text-gray-300 mt-0.5 truncate capitalize">
            {c.category}
          </p>
        )}

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 sm:mt-3 sm:pt-2.5">
          <div className="flex items-center gap-1 min-w-0 sm:gap-1.5">
            <Clock className="w-3 h-3 text-gray-300 shrink-0" />
            <span className="text-2xs text-gray-400 truncate">{c.date}</span>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(c.id, e);
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-amber-50 transition cursor-pointer"
            >
              <Star
                className={`w-3.5 h-3.5 transition-colors ${c.favorite ? "fill-amber-400 text-amber-400" : "text-gray-300 hover:text-amber-400"}`}
              />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteRequest(c.id);
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-gray-300 hover:text-red-400 transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Table View ────────────────────────────────────────────────────────────────
const TableView = ({
  creatives,
  selectedId,
  bulkSelected,
  isBulkMode,
  onSelect,
  onToggleFavorite,
  onDeleteRequest,
}) => (
  <div className="bg-surface rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/60">
          {isBulkMode && <th className="w-10 px-4 py-3" />}
          <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Creative
          </th>
          <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Tagline
          </th>
          <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Type
          </th>
          <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Score
          </th>
          <th className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Date
          </th>
          <th className="px-4 py-3 w-20" />
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {creatives.map((c) => {
          const tc = TYPE_COLOR[c.type?.toLowerCase()] || DEFAULT_COLOR;
          return (
            <tr
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`cursor-pointer transition-colors ${isBulkMode && bulkSelected.includes(c.id) ? "bg-blue-50" : selectedId === c.id ? "bg-blue-50" : "hover:bg-gray-50/80"}`}
            >
              {isBulkMode && (
                <td className="px-4 py-3">
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center ${bulkSelected.includes(c.id) ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}
                  >
                    {bulkSelected.includes(c.id) && (
                      <Check className="w-2.5 h-2.5 text-white" />
                    )}
                  </div>
                </td>
              )}
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-100 flex items-center justify-center">
                    {c.thumbnail ? (
                      <img
                        src={c.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : c.canvas && c.elements?.length > 0 ? (
                      <DesignCanvas
                        variation={{ canvas: c.canvas, elements: c.elements }}
                        maxW={56}
                        maxH={40}
                      />
                    ) : c.image ? (
                      <img
                        src={c.image}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : (
                      <Wand2 className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                  <span className="font-medium text-gray-800 truncate max-w-40 text-sm">
                    {c.name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-400 text-xs italic max-w-45">
                <span className="truncate block">{c.copy?.tagline || "—"}</span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${tc.bg} ${tc.text} ${tc.border}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
                  {c.type}
                </span>
              </td>
              <td className="px-4 py-3 text-xs font-semibold text-green-600">
                {c.score > 0 ? `★ ${c.score}` : "—"}
              </td>
              <td className="px-4 py-3 text-gray-400 text-xs">{c.date}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(c.id, e);
                    }}
                    className="p-1.5 rounded-lg hover:bg-amber-50 cursor-pointer transition"
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${c.favorite ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRequest(c.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-50 cursor-pointer transition"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-gray-300 hover:text-red-400 transition-colors" />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

// ── Sidebar ───────────────────────────────────────────────────────────────────
/* ─── Design → PNG export helpers ─────────────────────────────── */
// Route external images through the proxy (which sends CORS headers) so the
// export canvas isn't "tainted" and can be read back as a PNG.
const toProxiedSrc = (src) =>
  typeof src === "string" && /^https?:\/\//i.test(src)
    ? `/api/proxy-image?url=${encodeURIComponent(src)}`
    : src;

// Renders a canvas-based design to a full-resolution PNG Blob, using the same
// shared renderer as the editor so the exported PNG matches the on-screen design.
async function renderDesignToPngBlob(c) {
  const canvasData = c.canvas;
  if (!canvasData?.width || !canvasData?.height) {
    throw new Error("This design has no canvas to export.");
  }
  try {
    return await renderDesignToBlob({
      canvas: canvasData,
      elements: c.elements || [],
    });
  } catch {
    throw new Error("Could not export this design.");
  }
}

const Sidebar = ({
  creative: c,
  onClose,
  onToggleFavorite,
  onCopy,
  copied,
  onDeleteRequest,
  onEdit,
  onPublish,
  onSchedule,
  onDownload,
}) => {
  const [downloading, setDownloading] = useState(false);
  const tc = TYPE_COLOR[c.type?.toLowerCase()] || DEFAULT_COLOR;
  const [expandedCopy, setExpandedCopy] = useState(false);

  const copy = c.copy || {};
  const copyEntries =
    typeof copy === "string"
      ? [["content", copy]]
      : Object.entries(copy).filter(([, v]) => v && typeof v === "string");

  const hasCanvas = c.canvas && c.elements?.length > 0;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${tc.bg} ${tc.text} ${tc.border}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
          {c.type}
        </span>
        {/* Favourite / delete / close. `ck-tap-pad` GROWS these to 44px on a
            touchscreen rather than expanding an invisible halo (`ck-tap`) —
            they sit 4px apart, so overlapping halos would hand taps aimed at
            the star to the delete button beside it. Mouse widths are unchanged. */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(c.id, e);
            }}
            aria-label={c.favorite ? "Remove from favorites" : "Add to favorites"}
            className={`ck-tap-pad w-7 h-7 flex items-center justify-center rounded-lg border cursor-pointer transition-all ${c.favorite ? "bg-amber-50 border-amber-200 text-amber-500" : "bg-gray-50 border-gray-200 text-gray-400 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-400"}`}
          >
            <Star
              className={`w-3.5 h-3.5 ${c.favorite ? "fill-amber-400" : ""}`}
            />
          </button>
          <button
            onClick={() => onDeleteRequest(c.id)}
            aria-label="Delete design"
            className="ck-tap-pad w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 cursor-pointer transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            aria-label="Close details"
            className="ck-tap-pad w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition cursor-pointer text-gray-400 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Canvas Preview with hovering Edit button.
            Renders the whole design at full width with no height restriction —
            nothing is clipped; the panel grows to fit the design. */}
        <div
          className="relative bg-gray-50 border-b border-gray-100 flex items-center justify-center group/preview"
          style={{ minHeight: 200 }}
        >
          {/* Prefer the backend thumbnail for the preview; fall back to
              rendering the canvas only when there isn't one. */}
          {c.thumbnail ? (
            <img
              src={c.thumbnail}
              alt={c.name}
              className="w-full h-auto block"
            />
          ) : hasCanvas ? (
            <DesignCanvas
              variation={{ canvas: c.canvas, elements: c.elements }}
            />
          ) : c.image ? (
            <img
              src={c.image}
              alt={c.name}
              className="max-w-full max-h-56 rounded-lg object-contain shadow"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-gray-300 py-8">
              <Wand2 className="w-10 h-10" />
              <span className="text-xs">No preview available</span>
            </div>
          )}
          {/* ── Edit buttons ──
              Revealed on hover on a mouse, ALWAYS shown on a touchscreen: a
              finger cannot hover, so on a phone these two — the only way into
              the editor from here — were invisible and unreachable. The
              `pointer: coarse` gate is the same one `ck-tap` uses, so JS and
              CSS agree on who counts as touch, and a mouse user's view is
              byte-for-byte unchanged.

              The scrim comes with them on touch, since permanently-visible
              buttons have to stay legible over a bright design. */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 px-3 opacity-0 transition-opacity duration-200 cursor-pointer group-hover/preview:opacity-100 pointer-coarse:bg-black/15 pointer-coarse:opacity-100 sm:gap-4">
            {/* Opens the full design editor at /design/[id] */}
            <Link
              href={`/design/${c.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 whitespace-nowrap bg-surface/90 backdrop-blur-sm border border-gray-200 shadow-lg px-3 py-2 hover:scale-105 rounded-lg text-xs font-semibold text-gray-700 hover:bg-surface transition sm:gap-2 sm:px-4 sm:text-sm"
            >
              <Edit2 className="w-3.5 h-3.5 shrink-0" />
              Edit with editor
            </Link>

            {/* Opens the editor with the Klux AI panel already open via the
                `?panel=klux` deep link. */}
            <Link
              href={`/design/${c.id}?panel=klux`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 whitespace-nowrap bg-surface/90 backdrop-blur-sm border border-gray-200 shadow-lg px-3 py-2 hover:scale-105 rounded-lg text-xs font-semibold text-gray-700 hover:bg-surface transition sm:gap-2 sm:px-4 sm:text-sm"
            >
              <Edit2 className="w-3.5 h-3.5 shrink-0" />
              Edit with Ai
            </Link>
          </div>
        </div>

        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Name + edit button */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900 leading-snug flex-1 truncate">
                {c.name}
              </h2>
              <button
                onClick={() => onEdit(c)}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 cursor-pointer transition shrink-0"
                title="Edit copy"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3 text-gray-300" />
              <span className="text-[11px] text-gray-400">{c.date}</span>
            </div>
          </div>

          {/* Tagline if available */}
          {c.copy?.tagline && (
            <p className="text-xs text-gray-500 italic -mt-2">
              {c.copy.tagline}
            </p>
          )}

          {/* Meta grid — three short label/value pairs. Kept at 3 columns:
              they are already inside a card whose width the parent grid
              controls, and the values ("Poster", "★ 8") are short enough to
              hold at a card's narrowest. */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              ["Type", c.type],
              ["Category", c.category],
              ["Score", c.score > 0 ? `★ ${c.score}` : "—"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="bg-gray-50 rounded-xl px-2 py-2 text-center border border-gray-100"
              >
                <p className="text-[9px] text-gray-400 uppercase tracking-wider">
                  {label}
                </p>
                <p className="text-[10px] font-semibold text-gray-700 mt-0.5 truncate capitalize">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Canvas dimensions */}
          {c.canvas && (
            <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 flex items-center justify-between">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                Canvas
              </span>
              <span className="text-[11px] font-mono font-semibold text-gray-600">
                {c.canvas.width} × {c.canvas.height}px
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {/* Three equal buttons across a panel that is only ~300px wide on a
                phone. `whitespace-nowrap` + `min-w-0` keep "Downloading…" on one
                line there instead of wrapping and growing the row's height. */}
            <div className="flex gap-2">
              <button
                onClick={onPublish}
                className="flex-1 min-w-0 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition-all shadow-sm sm:gap-2"
              >
                <Send className="w-3 h-3 shrink-0" /> Publish
              </button>
              <button
                onClick={onSchedule}
                className="flex-1 min-w-0 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold py-2 rounded-lg transition-all sm:gap-2"
              >
                <CalendarClock className="w-3 h-3 shrink-0" /> Schedule
              </button>
              <button
                onClick={async () => {
                  if (downloading) return;
                  setDownloading(true);
                  await onDownload?.(c);
                  setDownloading(false);
                }}
                disabled={downloading}
                className="flex-1 min-w-0 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap border border-gray-200 hover:bg-gray-100 text-gray-800 text-xs font-semibold py-2 rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed sm:gap-2"
              >
                {downloading ? (
                  <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                ) : (
                  <Download className="w-3 h-3 shrink-0" />
                )}
                {downloading ? "Downloading…" : "Download"}
              </button>
            </div>
            {/* <div className="flex gap-2">

            Analyze, Predict and Retouch button commented out based on instructions
              <Link
                href={`/analyze/${c.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-100 transition group"
              >
                <ScanSearch className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
                <span className="text-[11px] font-semibold text-blue-600">
                  Analyze
                </span>
              </Link>
              <Link
                href={`/predict/${c.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-violet-50 hover:bg-violet-100 border border-violet-100 transition group"
              >
                <TrendingUp className="w-4 h-4 text-violet-500 group-hover:text-violet-600" />
                <span className="text-[11px] font-semibold text-violet-600">
                  Predict
                </span>
              </Link>
              <Link
                href={`/retouch/${c.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 transition group"
              >
                <Wand2 className="w-4 h-4 text-emerald-500 group-hover:text-emerald-600" />
                <span className="text-[11px] font-semibold text-emerald-600">
                  Retouch
                </span>
              </Link>
            </div>*/}
          </div>

          {/* Generated Copy */}
          {copyEntries.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-2">
                Generated Copy
              </p>
              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 leading-relaxed border border-gray-100 space-y-2">
                {(expandedCopy ? copyEntries : copyEntries.slice(0, 3)).map(
                  ([key, val]) => (
                    <div key={key}>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400">
                        {key.replace(/_/g, " ")}
                      </span>
                      <p className="mt-0.5 text-gray-700">{val}</p>
                    </div>
                  ),
                )}
                {copyEntries.length > 3 && (
                  <button
                    onClick={() => setExpandedCopy((v) => !v)}
                    className="text-blue-500 hover:text-blue-700 font-semibold text-xs cursor-pointer transition"
                  >
                    {expandedCopy ? "Show less" : "See more"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky footer.
          The bottom padding folds in the iOS home-indicator inset, or the
          "Copy Text" button sits under it on a notched phone. */}
      <div className="shrink-0 px-4 pt-3 pb-[calc(0.75rem+var(--ck-safe-b))] border-t border-gray-100 flex items-center gap-2 bg-surface">
        <button
          onClick={onCopy}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${copied ? "bg-green-50 border-green-200 text-green-600" : "bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"}`}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          {copied ? "Copied!" : "Copy Text"}
        </button>
      </div>
    </>
  );
};

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyState = ({ hasCreatives }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
    <div className="w-44 h-44 select-none">
      <svg
        viewBox="0 0 200 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <path
          d="M55 30 L55 90 L20 150 Q15 160 25 165 L75 165 Q85 160 80 150 L55 90"
          stroke="#d1d5db"
          strokeWidth="4"
          strokeLinecap="round"
          fill="#f3f4f6"
        />
        <ellipse cx="55" cy="30" rx="14" ry="5" fill="#e5e7eb" />
        <line
          x1="100"
          y1="10"
          x2="100"
          y2="55"
          stroke="#d1d5db"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle
          cx="100"
          cy="100"
          r="48"
          fill="#f3f4f6"
          stroke="#d1d5db"
          strokeWidth="4"
        />
        <ellipse cx="100" cy="55" rx="12" ry="5" fill="#e5e7eb" />
        <circle cx="90" cy="105" r="5" fill="#e5e7eb" opacity="0.8" />
        <circle cx="105" cy="115" r="3.5" fill="#e5e7eb" opacity="0.6" />
        <circle cx="95" cy="90" r="3" fill="#e5e7eb" opacity="0.5" />
        <path
          d="M145 35 L145 155 Q145 165 155 165 L185 165 Q195 165 195 155 L195 35 Z"
          stroke="#d1d5db"
          strokeWidth="4"
          fill="#f3f4f6"
        />
        <line
          x1="145"
          y1="35"
          x2="195"
          y2="35"
          stroke="#d1d5db"
          strokeWidth="4"
        />
        <line
          x1="187"
          y1="80"
          x2="195"
          y2="80"
          stroke="#d1d5db"
          strokeWidth="2.5"
        />
        <line
          x1="187"
          y1="105"
          x2="195"
          y2="105"
          stroke="#d1d5db"
          strokeWidth="2.5"
        />
        <line
          x1="187"
          y1="130"
          x2="195"
          y2="130"
          stroke="#d1d5db"
          strokeWidth="2.5"
        />
        <ellipse
          cx="100"
          cy="172"
          rx="85"
          ry="6"
          fill="#e5e7eb"
          opacity="0.5"
        />
      </svg>
    </div>
    <div className="text-center">
      <p className="text-sm text-gray-500">
        {hasCreatives
          ? "No creatives match your search."
          : "No designs have been created yet."}
      </p>
      {!hasCreatives && (
        <p className="text-sm text-gray-400 mt-0.5">
          Click any of the buttons at the top right to get started.
        </p>
      )}
    </div>
  </div>
);

// ── Edit Copy Modal ───────────────────────────────────────────────────────────
const COPY_FIELDS = [
  {
    key: "name",
    label: "Design Name",
    type: "input",
    placeholder: "e.g. Summer Campaign Card",
  },
  {
    key: "headline",
    label: "Headline",
    type: "input",
    placeholder: "e.g. Adventure Awaits",
  },
  {
    key: "tagline",
    label: "Tagline",
    type: "input",
    placeholder: "e.g. Discover your next thrill",
  },
  {
    key: "body",
    label: "Body Copy",
    type: "textarea",
    placeholder: "e.g. Join us for an unforgettable journey…",
  },
  {
    key: "cta",
    label: "Call to Action",
    type: "input",
    placeholder: "e.g. Get Started",
  },
];

function EditCopyModal({ creative, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState({
    name: creative.name || "",
    headline: creative.copy?.headline || "",
    tagline: creative.copy?.tagline || "",
    body: creative.copy?.body || "",
    cta: creative.copy?.cta || "",
  });

  const handleChange = (key, value) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(creative.id, {
      name: fields.name,
      copy: {
        ...creative.copy, // preserve any extra keys like performance_score
        headline: fields.headline,
        tagline: fields.tagline,
        body: fields.body,
        cta: fields.cta,
      },
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-70 px-4">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Edit Copy</h3>
              <p className="text-[10px] text-gray-400">
                Update text content for this design
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition cursor-pointer text-gray-400 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable fields */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {COPY_FIELDS.map(({ key, label, type, placeholder }) => (
            <div key={key}>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                {label}
              </label>
              {type === "textarea" ? (
                <textarea
                  rows={4}
                  value={fields[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none transition placeholder-gray-300"
                />
              ) : (
                <input
                  type="text"
                  value={fields[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition placeholder-gray-300"
                />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer transition flex items-center gap-2 font-semibold"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
