/**
 * Shared data for the Product Studio modals (Virtual Model, Product Staging,
 * Ghost Mannequin, Product Video, and the on-device Beautifier / Flat Lay).
 *
 * These arrays + helpers used to be copy-pasted into every modal; keeping the
 * single source here means a tool, size, or quality-tier change lands in one
 * place. Presentational components that consume this data live alongside it
 * (ToolCard, ToolSwitcherDropdown, QualityDropdown, SizeDropdown).
 */

import {
  User,
  Package,
  Scissors,
  Sparkles,
  Image as ImageIcon,
  LayoutGrid,
  Shirt,
  Layers,
  Video,
  Blend,
  Megaphone,
  Stamp,
} from "lucide-react";

// ── CDN image helpers ──────────────────────────────────────────────────────
// Pexels (free license, stable URLs). `px` resizes by height only (no crop) so
// full figures stay intact; `pxbg` is a cropped landscape thumb for swatches;
// `pxsq` is a cropped square thumb for the staging template tiles.
//
// ⚠️ `ext` IS NOT DECORATION. A Pexels hotlink URL ends in the photo's REAL
// file extension, and while the overwhelming majority are `.jpeg`, a minority
// are `.png` — for those, the `.jpeg` URL 404s and the tile renders as a broken
// image with no error anywhere to explain it (an <img> that 404s is silent).
// These helpers used to hardcode `.jpeg`, which is exactly how five staging
// templates shipped invisible.
//
// So: when you pin a new photo id, check what the API reports as its `src`
// (`GET https://api.pexels.com/v1/photos/<id>` → `src.original`) and pass
// `ext: "png"` if it is not a JPEG. Default stays "jpeg", so every existing
// call site is unchanged.
const pxUrl = (id, ext, params) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.${ext}?auto=compress&cs=tinysrgb&${params}`;

export const px = (id, ext = "jpeg") => pxUrl(id, ext, "h=600");
export const pxbg = (id, ext = "jpeg") =>
  pxUrl(id, ext, "w=320&h=240&fit=crop");
export const pxsq = (id, ext = "jpeg") =>
  pxUrl(id, ext, "w=400&h=400&fit=crop");

// ── Header tool-switcher list (mirrors the product-studio page tools) ───────
// `img` is a real thumbnail; ToolCard falls back to the colored `Icon` tile if
// it fails to load.
export const TOOL_LIST = [
  {
    id: "virtual",
    name: "Virtual Model",
    Icon: User,
    color: "bg-pink-100 text-pink-600",
    img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=240&q=80",
  },
  {
    id: "staging",
    name: "Product Staging",
    Icon: Package,
    color: "bg-amber-100 text-amber-600",
    img: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=240&q=80",
  },
  {
    // `bgremove` is the routing id everywhere (page router, batch, switcher) —
    // only the user-facing label changed to "Auto Design".
    id: "bgremove",
    name: "Auto Design",
    Icon: Scissors,
    color: "bg-red-100 text-red-600",
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=240&q=80",
  },
  {
    id: "beautifier",
    name: "Product Beautifier",
    Icon: Sparkles,
    color: "bg-yellow-100 text-yellow-600",
    img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=240&q=80",
  },
  {
    id: "start",
    name: "Edit with AI",
    Icon: ImageIcon,
    color: "bg-blue-100 text-blue-600",
    img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=240&q=80",
  },
  {
    id: "flatlay",
    name: "Flat Lay",
    Icon: LayoutGrid,
    color: "bg-cyan-100 text-cyan-600",
    img: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=240&q=80",
  },
  {
    id: "mannequin",
    name: "Ghost Mannequin",
    Icon: Shirt,
    color: "bg-emerald-100 text-emerald-600",
    img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=240&q=80",
  },
  {
    id: "batch",
    name: "Batch",
    Icon: Layers,
    color: "bg-purple-100 text-purple-600",
    img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=240&q=80",
  },
  // The three prompt-driven tools (see PromptToolModal / promptToolConfigs).
  // Their thumbnails come from `pxsq` rather than Unsplash simply because these
  // ids were fetched and reviewed alongside the preset catalogs, so they are
  // known-good; ToolCard still falls back to the colored Icon tile either way.
  {
    id: "reshaping",
    name: "Reshaping",
    Icon: Blend,
    color: "bg-teal-100 text-teal-600",
    img: pxsq(39281882),
  },
  {
    id: "poster",
    name: "Product Poster",
    Icon: Megaphone,
    color: "bg-orange-100 text-orange-600",
    img: pxsq(20003244),
  },
  {
    id: "pod",
    name: "AI POD",
    Icon: Stamp,
    color: "bg-fuchsia-100 text-fuchsia-600",
    img: pxsq(2157884),
  },
  // Product Video is deliberately LAST in both this switcher and the tool grid
  // on the Product Studio page — it is the only tool that outputs motion, so it
  // reads as the end of the list rather than as one more photo tool.
  {
    id: "product_video",
    name: "Product Video",
    Icon: Video,
    color: "bg-indigo-100 text-indigo-600",
    img: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=240&q=80",
  },
];

// Shown under "Recently used" in the tool switcher.
export const RECENT_TOOL_IDS = ["virtual", "staging"];

// ── Stock-photo search seed per tool ────────────────────────────────────────
// Every Product Studio tool opens the SAME picker (MediaPickerModal), whose
// Search tab is Pexels. Without a seed each tool showed the identical generic
// brand-fallback results, most of which are useless as that tool's input (a
// lifestyle crowd shot is not something you can ghost-mannequin).
//
// Each entry is the query that tool's picker opens on — phrased as the kind of
// SOURCE image the tool needs, not what it produces. Keep them short: Pexels
// matches keywords, and 2–3 words return far better sets than a sentence.
// Keys are the routing tool ids used by `openTool` / TOOL_LIST / ON_DEVICE_TOOLS.
export const TOOL_STOCK_QUERIES = {
  start: "product photography",
  bgremove: "product white background",
  virtual: "clothing apparel product",
  staging: "product still life",
  mannequin: "shirt on hanger",
  beautifier: "product studio shot",
  flatlay: "flat lay objects",
  product_video: "product showcase",
  reshaping: "product packshot",
  poster: "product bottle packaging",
  // POD prints ONTO a blank item, so the useful source is an unprinted one.
  pod: "blank t shirt mockup",
};

// ── Stock seeds for the SECOND (reference) image slot ───────────────────────
// Reshaping and AI POD take an optional reference image alongside the product,
// and it is a completely different kind of picture — a room, or a pattern. The
// product seed above would fill that picker with packshots, which is exactly
// what the reference is not. Keyed by tool id; tools with no reference slot
// have no entry. See PromptToolModal's `pickerTarget`.
export const TOOL_REFERENCE_STOCK_QUERIES = {
  reshaping: "interior scene styling",
  pod: "seamless pattern design",
};

/**
 * The stock-photo query a tool's media picker should open on.
 *
 * @param {string} toolId one of the ids in {@link TOOL_STOCK_QUERIES}
 * @returns {string} the tool's seed, or a neutral product-photo query for an
 *   unknown id (never empty — an empty seed drops the picker back to the
 *   generic brand fallback).
 */
export const stockQueryForTool = (toolId) =>
  TOOL_STOCK_QUERIES[toolId] || "product photography";

// ── Aspect-ratio sizes ──────────────────────────────────────────────────────
// Full set for the image tools; VIDEO_SIZES is the reduced set Product Video
// supports.
export const SIZES = [
  { id: "original", name: "Original", w: 1, h: 1 },
  { id: "portrait_9_16", name: "Portrait (9:16)", w: 9, h: 16 },
  { id: "portrait_3_4", name: "Portrait (3:4)", w: 3, h: 4 },
  { id: "portrait_2_3", name: "Portrait (2:3)", w: 2, h: 3 },
  { id: "square", name: "Square", w: 1, h: 1 },
  { id: "landscape_3_2", name: "Landscape (3:2)", w: 3, h: 2 },
  { id: "landscape_4_3", name: "Landscape (4:3)", w: 4, h: 3 },
  { id: "landscape_16_9", name: "Landscape (16:9)", w: 16, h: 9 },
];

export const VIDEO_SIZES = [
  { id: "square", name: "Square", w: 1, h: 1 },
  { id: "portrait_9_16", name: "Portrait (9:16)", w: 9, h: 16 },
  { id: "landscape_16_9", name: "Landscape (16:9)", w: 16, h: 9 },
];

// ── Quality tiers ───────────────────────────────────────────────────────────
// Resolution badge shown next to the selected quality (Photoroom-style 1K/2K/4K
// chip). QUALITY_TIERS are the rich cards rendered in the Quality dropdown; `id`
// matches the modal's `quality` state.
export const QUALITY_RES = { Standard: "1K", High: "2K", Ultra: "4K" };

export const QUALITY_TIERS = [
  {
    id: "Ultra",
    name: "Premium",
    tag: "Ultra",
    tagColor: "bg-blue-100 text-blue-700",
    img: px(6780091),
    features: [
      "4k+ resolution",
      "Best product accuracy",
      "Most realistic results",
      "Highest quality",
      "Consumes most credits",
    ],
  },
  {
    id: "High",
    name: "Advanced",
    tag: "Max",
    tagColor: "bg-indigo-100 text-indigo-700",
    img: px(6780038),
    features: [
      "2k resolution",
      "Better product accuracy",
      "Realistic results",
      "High quality",
      "Consumes more credits",
    ],
  },
  {
    id: "Standard",
    name: "Standard",
    tag: "Pro",
    tagColor: "bg-emerald-100 text-emerald-700",
    img: px(6780036),
    features: [
      "1k resolution",
      "Good product accuracy",
      "Fast generations",
      "Consumes less credits",
    ],
  },
];
