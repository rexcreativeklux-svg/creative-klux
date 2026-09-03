/**
 * Shared data for the Product Studio modals (Virtual Model, Product Staging,
 * Ghost Mannequin, Video Generator, and the on-device Beautifier / Flat Lay).
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
  {
    id: "video",
    name: "Video Generator",
    Icon: Video,
    color: "bg-indigo-100 text-indigo-600",
    img: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=240&q=80",
  },
];

// Shown under "Recently used" in the tool switcher.
export const RECENT_TOOL_IDS = ["virtual", "staging"];

// ── Aspect-ratio sizes ──────────────────────────────────────────────────────
// Full set for the image tools; VIDEO_SIZES is the reduced set the Video
// Generator supports.
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
