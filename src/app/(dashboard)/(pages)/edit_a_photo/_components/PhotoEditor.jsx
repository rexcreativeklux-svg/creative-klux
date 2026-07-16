import { useState, useRef, useEffect, Fragment } from "react";
import EditorTopBar from "./EditorTopBar";
import BeforeAfterView from "./BeforeAfterView";
import ImageToolbar from "./ImageToolbar";
import ImagePanel from "./ImagePanel";
import TextPanel from "./TextPanel";
import { Slider, FILTERS } from "./editorShared";
import AiBackgroundsPanel from "./AiBackgroundsPanel";
import CustomBackgroundPanel from "./CustomBackgroundPanel";
import RecentUploadsCarousel from "./RecentUploadsCarousel";
import RecentUploadsPanel from "./RecentUploadsPanel";
import HScrollRow from "./HScrollRow";
import BackgroundLibrary from "./BackgroundLibrary";
import BackgroundCategoryPanel from "./BackgroundCategoryPanel";
import InfinitePexelsGrid from "./InfinitePexelsGrid";
import ColorBackgroundPanel from "./ColorBackgroundPanel";
import {
  removeBackground as engineRemoveBackground,
  disposeSegmentationWorker,
} from "@/(lib)/ai-engine/tasks/removeBackground";
import {
  X,
  Undo,
  Plus,
  ChevronRight,
  AlignCenter,
  AlignVerticalJustifyCenter,
  Scissors,
  Pencil,
  Sun,
  Layers,
  Box,
  LayoutTemplate,
  Sparkles,
  SlidersHorizontal,
  ImageIcon,
  Type,
  Loader2,
  FlipHorizontal,
  FlipVertical,
  Upload,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  RotateCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { brandedFileName } from "@/utils/downloadName";

const topTools = [
  { id: "insert", label: "Insert", icon: Plus },
  { id: "brandit", label: "Brand Kit", icon: ImageIcon },
  { id: "addtext", label: "Add text", icon: Type },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "backgrounds", label: "Backgrounds", icon: Box },
  { id: "layers", label: "Layers", icon: Layers },
  // AI Shadows hidden until an image-in→image-out AI service is wired (no backend yet).
  // The manual Shadows panel (drop + floor/cast) covers the non-AI cases.
  // { id: 'aishadows', label: 'AI Shadows', icon: Sun },
  { id: "resize", label: "Resize", icon: SlidersHorizontal },
];

// Logical design-canvas size (matches the preview box). Exports render at 2×.
const CANVAS_W = 520;
const CANVAS_H = 440;
const EXPORT_SCALE = 2;

// Shadow colour swatches for the Photoroom-style shadow panel.
// hex (#rgb / #rrggbb) → rgba() string at the given alpha. Lets the shadow take an
// arbitrary colour instead of being hardcoded black.
const hexToRgba = (hex, alpha = 1) => {
  let h = String(hex || "#000000").replace("#", "");
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return `rgba(0,0,0,${alpha})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

// ── Brand Kit fonts (curated Google Fonts; loaded on demand) ──────────────
const BRAND_FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Raleway",
  "Oswald",
  "Merriweather",
  "Playfair Display",
  "Nunito",
  "Work Sans",
  "DM Sans",
  "Source Sans 3",
  "Rubik",
  "Bebas Neue",
  "Anton",
  "Pacifico",
  "Lobster",
  "Dancing Script",
  "Caveat",
  "Archivo",
  "Manrope",
  "Quicksand",
  "Josefin Sans",
  "Mulish",
  "Karla",
  "Space Grotesk",
  "Libre Baskerville",
  "PT Serif",
  "Abril Fatface",
  "Comfortaa",
  "Teko",
  "Fredoka",
  "Cormorant Garamond",
];
const googleFontHref = (family) =>
  `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@400;700&display=swap`;

// Inject a Google Fonts <link> once per family (idempotent). Returns a promise
// that resolves when the face is usable, so canvas export renders the right font.
const loadWebFont = (family) => {
  if (typeof document === "undefined" || !family) return Promise.resolve();
  const id = `ck-font-${family.replace(/\s+/g, "-").toLowerCase()}`;
  if (!document.getElementById(id)) {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = googleFontHref(family);
    document.head.appendChild(link);
  }
  return document.fonts?.load
    ? document.fonts
        .load(`16px "${family}"`)
        .then(() => document.fonts.load(`700 16px "${family}"`))
        .catch(() => {})
    : Promise.resolve();
};

// ── Add-text style presets (Photoroom-style "text styles") ────────────────
// Each becomes a text layer; fonts come from BRAND_FONTS so loadWebFont works.
const TEXT_STYLE_CATEGORIES = ["All", "Celebration", "Labels", "Sale", "Promo"];
const TEXT_STYLES = [
  {
    id: "new",
    text: "NEW",
    category: "Labels",
    fontFamily: "Anton",
    fontWeight: "400",
    color: "#ffffff",
    bgColor: "#111111",
    radius: 4,
    fontSize: 44,
    w: 170,
    h: 66,
  },
  {
    id: "natural",
    text: "Natural",
    category: "Labels",
    fontFamily: "Dancing Script",
    fontWeight: "700",
    color: "#c9a27a",
    fontSize: 50,
    w: 240,
    h: 72,
  },
  {
    id: "medium",
    text: "MEDIUM",
    category: "Labels",
    fontFamily: "Oswald",
    fontWeight: "700",
    color: "#ffffff",
    bgColor: "#3b5b73",
    radius: 4,
    fontSize: 40,
    w: 240,
    h: 74,
  },
  {
    id: "hbd",
    text: "Happy\nBirthday!",
    category: "Celebration",
    fontFamily: "Pacifico",
    fontWeight: "400",
    color: "#f4a6b0",
    bgColor: "#fdecee",
    radius: 14,
    fontSize: 30,
    w: 230,
    h: 120,
  },
  {
    id: "large",
    text: "LARGE",
    category: "Labels",
    fontFamily: "Archivo",
    fontWeight: "700",
    color: "#111827",
    bgColor: "#e5e7eb",
    radius: 6,
    fontSize: 46,
    w: 240,
    h: 82,
  },
  {
    id: "today",
    text: "TODAY",
    category: "Labels",
    fontFamily: "Josefin Sans",
    fontWeight: "400",
    color: "#111827",
    fontSize: 48,
    w: 240,
    h: 72,
  },
  {
    id: "healthy",
    text: "Healthy",
    category: "Labels",
    fontFamily: "Playfair Display",
    fontWeight: "700",
    color: "#f0a08a",
    fontSize: 50,
    w: 240,
    h: 72,
  },
  {
    id: "tagus",
    text: "Tag us",
    category: "Promo",
    fontFamily: "Cormorant Garamond",
    fontWeight: "700",
    color: "#6b6b5a",
    bgColor: "#e8e4d8",
    radius: 999,
    fontSize: 32,
    w: 120,
    h: 120,
  },
  {
    id: "signmeup",
    text: "Sign me up!",
    category: "Promo",
    fontFamily: "Caveat",
    fontWeight: "700",
    color: "#111827",
    fontSize: 46,
    w: 240,
    h: 72,
  },
  {
    id: "tagus2",
    text: "TAG US",
    category: "Promo",
    fontFamily: "Oswald",
    fontWeight: "700",
    color: "#111827",
    fontSize: 50,
    w: 240,
    h: 72,
  },
  {
    id: "likeshare",
    text: "Like & Share",
    category: "Celebration",
    fontFamily: "Lobster",
    fontWeight: "400",
    color: "#2f7d6b",
    fontSize: 42,
    w: 320,
    h: 72,
  },
  {
    id: "thankyou",
    text: "Thank you",
    category: "Celebration",
    fontFamily: "Pacifico",
    fontWeight: "400",
    color: "#8aa9d6",
    fontSize: 42,
    w: 280,
    h: 72,
  },
  {
    id: "sale",
    text: "SALE",
    category: "Sale",
    fontFamily: "Anton",
    fontWeight: "400",
    color: "#ffffff",
    bgColor: "#ef4444",
    radius: 6,
    fontSize: 50,
    w: 210,
    h: 76,
  },
  {
    id: "off",
    text: "50% OFF",
    category: "Sale",
    fontFamily: "Archivo",
    fontWeight: "700",
    color: "#ef4444",
    fontSize: 44,
    w: 240,
    h: 72,
  },
  {
    id: "hotdeal",
    text: "HOT DEAL",
    category: "Sale",
    fontFamily: "Oswald",
    fontWeight: "700",
    color: "#ffffff",
    bgColor: "#f97316",
    radius: 6,
    fontSize: 38,
    w: 250,
    h: 74,
  },
  {
    id: "congrats",
    text: "Congrats!",
    category: "Celebration",
    fontFamily: "Dancing Script",
    fontWeight: "700",
    color: "#7c3aed",
    fontSize: 50,
    w: 260,
    h: 72,
  },
];

// Default fill for a freshly-inserted vector (shape / sticker / etc.). Colour is
// no longer chosen before insert — it's recolored afterwards in the Image panel.
const DEFAULT_INSERT_COLOR = "#7c3aed";
// 5-point star in a 0..100 viewbox (used for preview + export).
const STAR_POINTS = [
  [50, 2],
  [61, 35],
  [98, 35],
  [68, 57],
  [79, 91],
  [50, 70],
  [21, 91],
  [32, 57],
  [2, 35],
  [39, 35],
];
const STAR_PTS_STR = STAR_POINTS.map((p) => p.join(",")).join(" ");

// ── Insert asset library (all drawn from SVG paths / unicode — no licensed art) ──
const BLOBS = [
  "M50 8 C68 8 90 20 90 42 C90 62 80 74 64 84 C50 92 30 92 18 80 C6 68 8 46 16 32 C24 18 34 8 50 8 Z",
  "M52 6 C72 8 86 22 88 42 C90 60 82 70 70 82 C56 96 34 94 20 82 C8 72 10 48 14 34 C18 18 34 4 52 6 Z",
  "M50 10 C66 6 84 16 88 34 C92 52 86 66 74 78 C60 92 38 94 24 82 C10 70 8 48 16 32 C22 18 36 12 50 10 Z",
  "M48 8 C66 4 88 18 90 40 C92 60 76 70 66 84 C54 98 32 92 20 80 C6 66 10 44 16 30 C22 16 34 10 48 8 Z",
];
const ARROWS = [
  "M8 42 L62 42 L62 26 L94 50 L62 74 L62 58 L8 58 Z",
  "M5 38 L58 38 L58 20 L96 50 L58 80 L58 62 L5 62 Z",
  "M30 22 L82 22 L82 74 L66 74 L66 50 L26 84 L16 74 L56 34 L30 34 Z",
];
const LINES = [
  { d: "M6 50 H94", sw: 8 },
  { d: "M6 50 H94", sw: 3 },
  { d: "M6 50 H86 M86 50 L76 42 M86 50 L76 58", sw: 5 },
  {
    d: "M14 50 H86 M14 50 L22 43 M14 50 L22 57 M86 50 L78 43 M86 50 L78 57",
    sw: 4,
  },
];
const BUBBLES = [
  "M12 12 H88 V64 H44 L26 86 L32 64 H12 Z",
  "M50 12 C76 12 92 26 92 44 C92 60 76 74 50 74 C44 74 39 73 34 72 L18 86 L25 68 C14 61 8 53 8 44 C8 26 24 12 50 12 Z",
  "M14 14 H86 A8 8 0 0 1 94 22 V58 A8 8 0 0 1 86 66 H40 L24 84 L30 66 H14 A8 8 0 0 1 6 58 V22 A8 8 0 0 1 14 14 Z",
];
// Extra filled geometric shapes for Classics (0..100 viewBox).
const GEO_SHAPES = [
  "M50 6 L88 28 L88 72 L50 94 L12 72 L12 28 Z", // hexagon
  "M50 6 L92 38 L76 90 L24 90 L8 38 Z", // pentagon
  "M50 6 L90 50 L50 94 L10 50 Z", // diamond
  "M50 86 C20 64 10 44 22 30 C32 18 46 22 50 34 C54 22 68 18 78 30 C90 44 80 64 50 86 Z", // heart
  "M40 10 H60 V40 H90 V60 H60 V90 H40 V60 H10 V40 H40 Z", // plus
  "M32 8 H68 L92 32 V68 L68 92 H32 L8 68 V32 Z", // octagon
];
// Starburst / seal stickers (filled).
const STICKERS = [
  "M50 5 L58 30 L84 22 L70 45 L95 50 L70 55 L84 78 L58 70 L50 95 L42 70 L16 78 L30 55 L5 50 L30 45 L16 22 L42 30 Z",
  "M50 4 L57 26 L80 20 L69 41 L92 50 L69 59 L80 80 L57 74 L50 96 L43 74 L20 80 L31 59 L8 50 L31 41 L20 20 L43 26 Z",
  "M50 8 C60 8 64 2 72 10 C80 2 84 8 84 18 C94 18 92 26 88 32 C96 40 88 46 84 50 C92 58 84 64 82 70 C90 78 80 82 74 82 C74 92 66 90 60 86 C54 96 46 90 42 84 C34 92 28 84 26 78 C16 78 18 68 22 62 C12 56 18 48 24 44 C16 34 26 30 32 30 C30 20 40 20 46 24 C46 14 46 8 50 8 Z",
];
// Sparkles / rings for Wired (filled, decorative).
const WIRED = [
  "M50 8 C54 40 60 46 92 50 C60 54 54 60 50 92 C46 60 40 54 8 50 C40 46 46 40 50 8 Z", // 4-point sparkle
  "M50 12 A38 38 0 1 0 50.1 12 Z M50 32 A18 18 0 1 1 49.9 32 Z", // ring (even-odd)
  "M50 20 L56 44 L80 50 L56 56 L50 80 L44 56 L20 50 L44 44 Z", // small sparkle
];
// Outlined frames (stroke, no fill).
const FRAMES = [
  { d: "M12 12 H88 V88 H12 Z", sw: 6 },
  {
    d: "M24 12 H76 A12 12 0 0 1 88 24 V76 A12 12 0 0 1 76 88 H24 A12 12 0 0 1 12 76 V24 A12 12 0 0 1 24 12 Z",
    sw: 6,
  },
  { d: "M8 50 A42 42 0 1 0 92 50 A42 42 0 1 0 8 50 Z", sw: 6 },
];
// Outlined device silhouettes (stroke, no fill).
const DEVICES = [
  {
    d: "M36 8 H64 A6 6 0 0 1 70 14 V86 A6 6 0 0 1 64 92 H36 A6 6 0 0 1 30 86 V14 A6 6 0 0 1 36 8 Z M44 82 H56",
    sw: 5,
  },
  { d: "M22 22 H78 V62 H22 Z M12 72 H88 L84 80 H16 Z", sw: 5 }, // laptop
  { d: "M14 18 H86 V62 H14 Z M46 62 H54 V78 H46 Z M34 82 H66", sw: 5 }, // monitor
  {
    d: "M28 10 H72 A5 5 0 0 1 77 15 V85 A5 5 0 0 1 72 90 H28 A5 5 0 0 1 23 85 V15 A5 5 0 0 1 28 10 Z",
    sw: 5,
  }, // tablet
];
const INSERT_EMOJIS = [
  "😀",
  "😍",
  "🥳",
  "🔥",
  "✨",
  "💯",
  "❤️",
  "👍",
  "🎉",
  "⭐",
  "🛍️",
  "🏷️",
  "💖",
  "😎",
  "🤩",
  "💎",
  "🌟",
  "⚡",
  "🎁",
  "💸",
  "✅",
  "🚀",
  "👏",
  "🥰",
];
const REACTIONS = [
  "❤️",
  "😍",
  "😂",
  "👍",
  "🔥",
  "🙌",
  "😮",
  "🎉",
  "💯",
  "🥰",
  "👏",
  "😎",
];
const INDEXES = ["1", "2", "3", "4", "5", "6"];
const PROMO = [
  { text: "NEW", fill: "#ef4444" },
  { text: "SALE", fill: "#ef4444" },
  { text: "-20%", fill: "#111827" },
  { text: "-50%", fill: "#111827" },
  { text: "HOT", fill: "#f97316" },
  { text: "FREE", fill: "#22c55e" },
];
const SIZES = ["XXS", "XS", "S", "M", "L", "XL"];

// Insert groups shown as section headings in the Insert panel (Photoroom
// parity). Each category below tags the group it belongs to.
const INSERT_GROUPS = ["Shapes", "Graphics"];

const INSERT_LIBRARY = [
  {
    id: "classics",
    label: "Classics",
    group: "Shapes",
    colorable: true,
    items: [
      { type: "shape", shape: "circle" },
      { type: "shape", shape: "triangle" },
      { type: "shape", shape: "rect" },
      { type: "shape", shape: "star" },
      ...GEO_SHAPES.map((d) => ({ type: "path", d })),
    ],
  },
  {
    id: "blobs",
    label: "Blobs",
    group: "Shapes",
    colorable: true,
    items: BLOBS.map((d) => ({ type: "path", d })),
  },
  {
    id: "stickers",
    label: "Stickers",
    group: "Shapes",
    colorable: true,
    items: STICKERS.map((d) => ({ type: "path", d })),
  },
  {
    id: "wired",
    label: "Wired",
    group: "Shapes",
    colorable: true,
    items: WIRED.map((d) => ({ type: "path", d })),
  },
  {
    id: "arrows",
    label: "Arrows",
    group: "Graphics",
    colorable: true,
    items: ARROWS.map((d) => ({ type: "path", d })),
  },
  {
    id: "frames",
    label: "Frames",
    group: "Graphics",
    colorable: true,
    items: FRAMES.map((f) => ({
      type: "path",
      d: f.d,
      stroke: true,
      strokeWidth: f.sw,
    })),
  },
  {
    id: "devices",
    label: "Devices",
    group: "Graphics",
    colorable: true,
    items: DEVICES.map((f) => ({
      type: "path",
      d: f.d,
      stroke: true,
      strokeWidth: f.sw,
    })),
  },
  {
    id: "lines",
    label: "Measurements",
    group: "Graphics",
    colorable: true,
    items: LINES.map((l) => ({
      type: "path",
      d: l.d,
      stroke: true,
      strokeWidth: l.sw,
      w: 170,
      h: 50,
    })),
  },
  {
    id: "bubbles",
    label: "Speech Bubbles",
    group: "Graphics",
    colorable: true,
    items: BUBBLES.map((d) => ({ type: "path", d, w: 150, h: 130 })),
  },
  {
    id: "emojis",
    label: "Emojis",
    group: "Graphics",
    items: INSERT_EMOJIS.map((e) => ({ type: "emoji", emoji: e })),
  },
  {
    id: "reactions",
    label: "Reactions",
    group: "Graphics",
    items: REACTIONS.map((e) => ({ type: "emoji", emoji: e })),
  },
  {
    id: "indexes",
    label: "Indexes",
    group: "Graphics",
    items: INDEXES.map((t) => ({
      type: "badge",
      fill: "#111827",
      textColor: "#fff",
      text: t,
    })),
  },
  {
    id: "promo",
    label: "Promotions",
    group: "Graphics",
    items: PROMO.map((p) => ({
      type: "badge",
      fill: p.fill,
      textColor: "#fff",
      text: p.text,
    })),
  },
  {
    id: "sizes",
    label: "Sizes",
    group: "Graphics",
    items: SIZES.map((t) => ({
      type: "badge",
      fill: "#111827",
      textColor: "#fff",
      text: t,
    })),
  },
];

// Apply the chosen colour to colourable items (shapes/paths).
function resolveItem(item, color) {
  if (item.type === "shape") return { ...item, fill: color };
  if (item.type === "path")
    return item.stroke
      ? { ...item, stroke: color, fill: "none" }
      : { ...item, fill: color };
  return item;
}

// Imported brand logos/images are external URLs (scraped sites, files.creativeklux.com)
// that usually don't send CORS headers and sometimes block hotlinking. Route them through
// our same-origin proxy so: (1) crossOrigin='anonymous' loads succeed (otherwise the image
// errors out and the layer is never added), and (2) canvas export isn't tainted. Leave
// data:/blob: URLs alone.
const proxiedSrc = (src) =>
  typeof src === "string" && /^https?:/i.test(src)
    ? `/api/proxy-image?url=${encodeURIComponent(src)}`
    : src;

// Shared visual for an item/layer — used by previews, the canvas, everywhere.
function VisualSVG({ spec }) {
  if (spec.type === "image")
    return (
      <img
        src={proxiedSrc(spec.src)}
        draggable={false}
        className="w-full h-full object-contain pointer-events-none"
        alt=""
      />
    );
  if (spec.type === "emoji")
    return (
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        className="pointer-events-none"
      >
        <text
          x="50"
          y="54"
          fontSize="78"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {spec.emoji}
        </text>
      </svg>
    );
  if (spec.type === "badge")
    return (
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        className="pointer-events-none"
      >
        <circle cx="50" cy="50" r="48" fill={spec.fill} />
        <text
          x="50"
          y="53"
          fontSize={spec.text.length > 3 ? 22 : 30}
          fontWeight="700"
          fill={spec.textColor}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="system-ui, sans-serif"
        >
          {spec.text}
        </text>
      </svg>
    );
  if (spec.type === "shape")
    return (
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        className="pointer-events-none"
      >
        {spec.shape === "rect" && (
          <rect x="0" y="0" width="100" height="100" fill={spec.fill} />
        )}
        {spec.shape === "circle" && (
          <ellipse cx="50" cy="50" rx="50" ry="50" fill={spec.fill} />
        )}
        {spec.shape === "triangle" && (
          <polygon points="50,0 100,100 0,100" fill={spec.fill} />
        )}
        {spec.shape === "star" && (
          <polygon points={STAR_PTS_STR} fill={spec.fill} />
        )}
      </svg>
    );
  if (spec.type === "path")
    return (
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        className="pointer-events-none"
      >
        <path
          d={spec.d}
          fill={spec.fill || "none"}
          stroke={spec.stroke || "none"}
          strokeWidth={spec.strokeWidth || 0}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  return null;
}

// Serialize an insert spec (shape / sticker / blob / emoji / badge / path) into
// a standalone SVG data-URL, so it can be added as an *image* layer and get the
// same treatment as any image (floating toolbar + Image panel + effects). The
// markup mirrors VisualSVG exactly. `image` specs are already images and skip
// this entirely.
const escapeXml = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function specToSvgDataUrl(spec) {
  let inner = "";
  if (spec.type === "emoji") {
    inner = `<text x="50" y="54" font-size="78" text-anchor="middle" dominant-baseline="central">${escapeXml(spec.emoji)}</text>`;
  } else if (spec.type === "badge") {
    const fs = (spec.text || "").length > 3 ? 22 : 30;
    inner = `<circle cx="50" cy="50" r="48" fill="${spec.fill}"/><text x="50" y="53" font-size="${fs}" font-weight="700" fill="${spec.textColor}" text-anchor="middle" dominant-baseline="central" font-family="system-ui, sans-serif">${escapeXml(spec.text)}</text>`;
  } else if (spec.type === "shape") {
    if (spec.shape === "rect")
      inner = `<rect x="0" y="0" width="100" height="100" fill="${spec.fill}"/>`;
    else if (spec.shape === "circle")
      inner = `<ellipse cx="50" cy="50" rx="50" ry="50" fill="${spec.fill}"/>`;
    else if (spec.shape === "triangle")
      inner = `<polygon points="50,0 100,100 0,100" fill="${spec.fill}"/>`;
    else if (spec.shape === "star")
      inner = `<polygon points="${STAR_PTS_STR}" fill="${spec.fill}"/>`;
  } else if (spec.type === "path") {
    inner = `<path d="${spec.d}" fill="${spec.fill || "none"}" stroke="${spec.stroke || "none"}" stroke-width="${spec.strokeWidth || 0}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100" preserveAspectRatio="none">${inner}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const loadImageEl = (src) =>
  new Promise((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = reject;
    // Proxy external URLs so the crossOrigin load doesn't fail on missing CORS headers
    // (the cause of imported logos/images silently failing to add).
    i.src = proxiedSrc(src);
  });

// ── Adjust: pixel-level processing ────────────────────────────────────────
// CSS filters can't do Highlights / Shadows / Sharpen / proper Warmth, so the
// Adjust panel bakes its changes straight into the pixels. All sliders are
// 0-centred (range −100…100, except Sharpen 0…100); 0 = no change. Alpha is
// always preserved so the cut-out stays transparent.
const ADJUST_MAXD = 1600; // cap the working resolution so the pass stays fast
const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

const sharpenInPlace = (ctx, w, h, amt) => {
  const src = ctx.getImageData(0, 0, w, h);
  const out = ctx.createImageData(w, h);
  const s = src.data,
    o = out.data;
  const k = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      for (let ch = 0; ch < 3; ch++) {
        let sum = 0,
          ki = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const px = Math.min(w - 1, Math.max(0, x + kx));
            const py = Math.min(h - 1, Math.max(0, y + ky));
            sum += s[(py * w + px) * 4 + ch] * k[ki++];
          }
        }
        const orig = s[idx + ch];
        o[idx + ch] = clamp255(orig + amt * (sum - orig));
      }
      o[idx + 3] = s[idx + 3];
    }
  }
  ctx.putImageData(out, 0, 0);
};

// Returns a canvas with the adjustments baked in (or null if nothing to do).
const processAdjustments = (img, a) => {
  const active =
    a.brightness ||
    a.contrast ||
    a.saturation ||
    a.highlights ||
    a.shadows ||
    a.sharpen ||
    a.hue ||
    a.warmth;
  if (!active) return null;

  let w = img.naturalWidth || img.width || 1;
  let h = img.naturalHeight || img.height || 1;
  const sc = Math.min(1, ADJUST_MAXD / Math.max(w, h));
  w = Math.max(1, Math.round(w * sc));
  h = Math.max(1, Math.round(h * sc));

  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;

  const bAdd = (a.brightness / 100) * 100;
  const C = (a.contrast / 100) * 255;
  const cF = (259 * (C + 255)) / (255 * (259 - C));
  const sF = 1 + a.saturation / 100;
  const hl = a.highlights / 100;
  const sh = a.shadows / 100;
  const warm = a.warmth / 100;
  const doHue = a.hue !== 0;
  const hr = (() => {
    const r = (a.hue * Math.PI) / 180,
      cos = Math.cos(r),
      sin = Math.sin(r);
    return [
      0.213 + cos * 0.787 - sin * 0.213,
      0.715 - cos * 0.715 - sin * 0.715,
      0.072 - cos * 0.072 + sin * 0.928,
      0.213 - cos * 0.213 + sin * 0.143,
      0.715 + cos * 0.285 + sin * 0.14,
      0.072 - cos * 0.072 - sin * 0.283,
      0.213 - cos * 0.213 - sin * 0.787,
      0.715 - cos * 0.715 + sin * 0.715,
      0.072 + cos * 0.928 + sin * 0.072,
    ];
  })();

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue; // skip fully transparent pixels
    let r = d[i],
      g = d[i + 1],
      b = d[i + 2];
    if (doHue) {
      const nr = r * hr[0] + g * hr[1] + b * hr[2];
      const ng = r * hr[3] + g * hr[4] + b * hr[5];
      const nb = r * hr[6] + g * hr[7] + b * hr[8];
      r = nr;
      g = ng;
      b = nb;
    }
    if (warm) {
      r += warm * 40;
      b -= warm * 40;
    }
    if (bAdd) {
      r += bAdd;
      g += bAdd;
      b += bAdd;
    }
    if (a.contrast) {
      r = cF * (r - 128) + 128;
      g = cF * (g - 128) + 128;
      b = cF * (b - 128) + 128;
    }
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    if (a.saturation) {
      r = luma + (r - luma) * sF;
      g = luma + (g - luma) * sF;
      b = luma + (b - luma) * sF;
    }
    if (hl) {
      const wgt = Math.max(0, (luma - 128) / 127);
      const add = hl * wgt * 80;
      r += add;
      g += add;
      b += add;
    }
    if (sh) {
      const wgt = Math.max(0, (128 - luma) / 128);
      const add = sh * wgt * 80;
      r += add;
      g += add;
      b += add;
    }
    d[i] = clamp255(r);
    d[i + 1] = clamp255(g);
    d[i + 2] = clamp255(b);
  }
  ctx.putImageData(id, 0, 0);
  if (a.sharpen > 0) sharpenInPlace(ctx, w, h, a.sharpen / 100);
  return c;
};

// ── Transform: tile + perspective (baked) ──────────────────────────────────
// Repeats the image into an N×N grid (Tile) and applies a keystone/perspective
// warp (Horizontal/Vertical). Done by baking to a sprite so preview == export and
// the existing rotate/scale/flip render path is untouched. Alpha is preserved.
const TRANSFORM_MAXD = 1400;

// Trapezoid (keystone) warp via thin strips. `axis` 'v' tapers top↔bottom using
// horizontal strips; 'h' tapers left↔right using vertical strips. amt −1…1.
const keystone = (srcCanvas, axis, amt) => {
  const w = srcCanvas.width,
    h = srcCanvas.height;
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const o = out.getContext("2d");
  const taper = Math.min(0.85, Math.abs(amt) * 0.85); // max shrink of the far edge
  if (axis === "v") {
    for (let y = 0; y < h; y++) {
      const t = y / (h - 1 || 1); // 0 top → 1 bottom
      // amt>0: bottom narrows; amt<0: top narrows.
      const f = amt >= 0 ? 1 - taper * t : 1 - taper * (1 - t);
      const dw = w * f,
        dx = (w - dw) / 2;
      o.drawImage(srcCanvas, 0, y, w, 1, dx, y, dw, 1);
    }
  } else {
    for (let x = 0; x < w; x++) {
      const t = x / (w - 1 || 1); // 0 left → 1 right
      const f = amt >= 0 ? 1 - taper * t : 1 - taper * (1 - t);
      const dh = h * f,
        dy = (h - dh) / 2;
      o.drawImage(srcCanvas, x, 0, 1, h, x, dy, 1, dh);
    }
  }
  return out;
};

const processTransform = (img, t) => {
  const tiles = Math.max(1, Math.round(t.tile || 1));
  const active = tiles > 1 || t.hPersp || t.vPersp;
  if (!active) return null;

  let w = img.naturalWidth || img.width || 1;
  let h = img.naturalHeight || img.height || 1;
  const sc = Math.min(1, TRANSFORM_MAXD / Math.max(w, h));
  w = Math.max(1, Math.round(w * sc));
  h = Math.max(1, Math.round(h * sc));

  // 1. Tile into an N×N grid.
  let base = document.createElement("canvas");
  base.width = w;
  base.height = h;
  const bctx = base.getContext("2d");
  if (tiles > 1) {
    const cw = w / tiles,
      ch = h / tiles;
    for (let ty = 0; ty < tiles; ty++) {
      for (let tx = 0; tx < tiles; tx++) {
        bctx.drawImage(img, tx * cw, ty * ch, cw, ch);
      }
    }
  } else {
    bctx.drawImage(img, 0, 0, w, h);
  }

  // 2. Perspective (vertical then horizontal keystone).
  let result = base;
  if (t.vPersp) result = keystone(result, "v", t.vPersp / 100);
  if (t.hPersp) result = keystone(result, "h", t.hPersp / 100);
  return result;
};

// ── Blur: baked types ──────────────────────────────────────────────────────
// Gaussian/Box → canvas blur; Pixelate/Square → nearest-neighbour downscale;
// Motion → directional accumulation; Bokeh/Disc → circular (lens) sampling.
const BLUR_MAXD = 1400;
const processBlur = (img, type, amt) => {
  if (!amt || amt <= 0) return null;
  let w = img.naturalWidth || img.width || 1;
  let h = img.naturalHeight || img.height || 1;
  const scd = Math.min(1, BLUR_MAXD / Math.max(w, h));
  w = Math.max(1, Math.round(w * scd));
  h = Math.max(1, Math.round(h * scd));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");

  if (type === "pixelate" || type === "square") {
    const block = Math.max(2, Math.round(amt));
    const sw = Math.max(1, Math.round(w / block));
    const sh = Math.max(1, Math.round(h / block));
    const tmp = document.createElement("canvas");
    tmp.width = sw;
    tmp.height = sh;
    tmp.getContext("2d").drawImage(img, 0, 0, sw, sh);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, sw, sh, 0, 0, w, h);
    return c;
  }
  if (type === "motion") {
    const steps = Math.max(2, Math.round(amt));
    ctx.globalAlpha = 1 / steps;
    for (let i = 0; i < steps; i++) {
      const t = (i / (steps - 1)) * 2 - 1; // -1…1
      ctx.drawImage(img, t * amt, 0, w, h);
    }
    ctx.globalAlpha = 1;
    return c;
  }
  if (type === "bokeh" || type === "disc") {
    const N = 18;
    ctx.globalAlpha = 1 / N;
    for (let i = 0; i < N; i++) {
      const ang = (i / N) * Math.PI * 2;
      ctx.drawImage(img, Math.cos(ang) * amt, Math.sin(ang) * amt, w, h);
    }
    ctx.globalAlpha = 1;
    return c;
  }
  // gaussian / box (box ≈ gaussian for this purpose)
  ctx.filter = `blur(${amt}px)`;
  ctx.drawImage(img, 0, 0, w, h);
  return c;
};

// ── Texture: posterize / line / color (baked) ──────────────────────────────
const TEXTURE_MAXD = 1400;
// TEXTURE_DEFAULTS moved into ./ImagePanel (only used by the Image panel).
const processTexture = (img, type, amt) => {
  if (!amt || amt <= 0) return null;
  let w = img.naturalWidth || img.width || 1;
  let h = img.naturalHeight || img.height || 1;
  const scd = Math.min(1, TEXTURE_MAXD / Math.max(w, h));
  w = Math.max(1, Math.round(w * scd));
  h = Math.max(1, Math.round(h * scd));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;

  if (type === "line") {
    const period = Math.max(2, Math.round(60 / (amt / 10 + 1)));
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (d[i + 3] === 0) continue;
        const luma = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
        const dark = (x % period) / period < 1 - luma;
        const v = dark ? 0 : 255;
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
      }
    }
  } else if (type === "color") {
    const levels = Math.max(
      2,
      Math.min(8, 2 + Math.round(((100 - amt) / 100) * 6)),
    );
    const step = 255 / (levels - 1);
    const sat = 1 + amt / 100;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      let r = Math.round(d[i] / step) * step;
      let g = Math.round(d[i + 1] / step) * step;
      let b = Math.round(d[i + 2] / step) * step;
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      d[i] = clamp255(luma + (r - luma) * sat);
      d[i + 1] = clamp255(luma + (g - luma) * sat);
      d[i + 2] = clamp255(luma + (b - luma) * sat);
    }
  } else {
    // posterize
    const levels = Math.max(2, Math.min(32, Math.round(amt)));
    const step = 255 / (levels - 1);
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      d[i] = clamp255(Math.round(d[i] / step) * step);
      d[i + 1] = clamp255(Math.round(d[i + 1] / step) * step);
      d[i + 2] = clamp255(Math.round(d[i + 2] / step) * step);
    }
  }
  ctx.putImageData(id, 0, 0);
  return c;
};

// Tightest opaque bounds of an image (for content-aware reflection anchoring).
const opaqueBounds = (img, w, h) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h).data;
  let top = h,
    bottom = 0,
    found = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 8) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        found = true;
        break;
      }
    }
  }
  if (!found) return { top: 0, bottom: h - 1 };
  return { top, bottom };
};

// A solid-colour silhouette of an image's opaque pixels — used to paint the
// outline halo and the cast shadow (canvas equivalent of the preview's alpha
// drop-shadow).
const makeSilhouetteCanvas = (img, w, h, color) => {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  const cx = c.getContext("2d");
  cx.drawImage(img, 0, 0, c.width, c.height);
  cx.globalCompositeOperation = "source-in";
  cx.fillStyle = color;
  cx.fillRect(0, 0, c.width, c.height);
  return c;
};

// Floor / cast shadow sprite (silhouette mirrored at the base, squashed by
// Shortness, blurred and faded). Returns { url, pad, spriteW, spriteH } in
// preview px. Shared by the base image and every image layer.
const makeFloorShadowSprite = (img, pw0, ph0, p) => {
  const pw = Math.max(1, Math.round(pw0));
  const ph = Math.max(1, Math.round(ph0));
  const sil = makeSilhouetteCanvas(img, pw, ph, p.shadowColor);
  const vScale = 0.6 * (1 - p.shadowShortness / 100) + 0.08;
  const shadowH = ph * vScale;
  const pad = Math.ceil(p.shadowBlur * 3 + 6);
  const spriteW = pw + pad * 2;
  const spriteH = Math.ceil(shadowH) + pad * 2;
  const c = document.createElement("canvas");
  c.width = spriteW;
  c.height = spriteH;
  const cx = c.getContext("2d");
  cx.translate(pad, pad);
  cx.filter = p.shadowBlur > 0 ? `blur(${p.shadowBlur}px)` : "none";
  cx.save();
  cx.scale(1, -vScale);
  cx.drawImage(sil, 0, -ph, pw, ph);
  cx.restore();
  cx.filter = "none";
  cx.globalCompositeOperation = "destination-in";
  const g = cx.createLinearGradient(0, 0, 0, shadowH);
  g.addColorStop(0, "rgba(0,0,0,1)");
  g.addColorStop(0.7, "rgba(0,0,0,0.45)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  cx.fillStyle = g;
  cx.fillRect(-pad, -pad, spriteW, spriteH);
  cx.globalCompositeOperation = "source-over";
  return { url: c.toDataURL("image/png"), pad, spriteW, spriteH };
};

// Reflection sprite (image mirrored below its real base, faded out). Returns
// { url, topFrac, heightFrac } (fractions of the box height). Shared by base +
// image layers.
const makeReflectionSprite = (img, pw0, ph0) => {
  const pw = Math.max(1, Math.round(pw0));
  const ph = Math.max(1, Math.round(ph0));
  const { top, bottom } = opaqueBounds(img, pw, ph);
  const contentH = Math.max(1, bottom - top + 1);
  const c = document.createElement("canvas");
  c.width = pw;
  c.height = contentH;
  const cx = c.getContext("2d");
  cx.save();
  cx.translate(0, bottom);
  cx.scale(1, -1);
  // Sharp mirror copy (no blur) so the reflection clearly shows the image.
  cx.drawImage(img, 0, 0, pw, ph);
  cx.restore();
  // Mirror-like fade: nearly opaque at the contact edge, tapering gradually so
  // the mirrored image stays clearly readable well down the reflection.
  cx.globalCompositeOperation = "destination-in";
  const g = cx.createLinearGradient(0, 0, 0, contentH);
  g.addColorStop(0, "rgba(0,0,0,0.98)");
  g.addColorStop(0.4, "rgba(0,0,0,0.7)");
  g.addColorStop(0.75, "rgba(0,0,0,0.32)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  cx.fillStyle = g;
  cx.fillRect(0, 0, pw, contentH);
  cx.globalCompositeOperation = "source-over";
  return { url: c.toDataURL("image/png"), topFrac: bottom / ph, heightFrac: contentH / ph };
};

// ── Backgrounds / Resize / Templates data ──
const ckpx = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=600`;
const BG_SOLIDS = [
  "#ffffff",
  "#000000",
  "#f4f4f5",
  "#1e293b",
  "#fde68a",
  "#fca5a5",
  "#a7f3d0",
  "#bfdbfe",
  "#ddd6fe",
  "#fbcfe8",
];
const BG_IMAGES = [
  7897470, 16042675, 3847496, 34658646, 7130564, 2463329, 6793893, 8559014,
].map(ckpx);
const gradientCss = (g) => `linear-gradient(135deg, ${g.from}, ${g.to})`;


// Image-background library (verified Pexels IDs, shared with the bg-remover).
const BG_LIBRARY = [
  {
    category: "Podium",
    ids: [7897470, 16042675, 16059552, 12932574, 12914280, 35073010],
  },
  {
    category: "Minimal",
    ids: [16149990, 6840026, 15067862, 12198526, 8015809, 8015461],
  },
  {
    category: "Surface",
    ids: [34658646, 3847496, 18325786, 7533765, 4705932, 7232667],
  },
  {
    category: "Gradient",
    ids: [7130564, 7135055, 7135028, 7130557, 6985185, 7135024],
  },
  { category: "Texture", ids: [2463329, 3964666, 12901948, 12998745, 247719] },
  {
    category: "Fabric",
    ids: [7794365, 7533979, 6843273, 7988399, 8007352, 7956629],
  },
  {
    category: "Nature",
    ids: [6793893, 27394932, 19215108, 1478450, 30399673, 13246785],
  },
  {
    category: "Paper",
    ids: [8559014, 7457657, 9389596, 7953539, 36135531, 36135526],
  },
].map((g) => ({ category: g.category, images: g.ids.map(ckpx) }));

const RESIZE_PRESETS = [
  { id: "original", label: "Original", w: 520, h: 440 },
  { id: "square", label: "1:1", w: 460, h: 460 },
  { id: "portrait", label: "4:5", w: 416, h: 520 },
  { id: "story", label: "9:16", w: 300, h: 533 },
  { id: "landscape", label: "16:9", w: 540, h: 304 },
  { id: "wide", label: "3:2", w: 540, h: 360 },
];

// ── Resize size presets (Photoroom-style, real target dimensions) ─────────
const RESIZE_GROUPS = [
  {
    title: "Standard",
    items: [
      {
        id: "std-land",
        label: "Landscape",
        w: 2016,
        h: 1512,
        ratio: "4:3",
        color: "#6b7280",
      },
      {
        id: "std-port",
        label: "Portrait",
        w: 1512,
        h: 2016,
        ratio: "3:4",
        color: "#6b7280",
      },
      {
        id: "std-sq",
        label: "Square",
        w: 1512,
        h: 1512,
        ratio: "1:1",
        color: "#6b7280",
      },
    ],
  },
  {
    title: "Social Media sizes",
    items: [
      {
        id: "ig-story",
        label: "Instagram Story",
        w: 1080,
        h: 1920,
        ratio: "9:16",
        color: "#E1306C",
      },
      {
        id: "ig-post",
        label: "Instagram Post",
        w: 1080,
        h: 1080,
        ratio: "1:1",
        color: "#E1306C",
      },
      {
        id: "ig-post45",
        label: "Instagram Post",
        w: 1080,
        h: 1350,
        ratio: "4:5",
        color: "#E1306C",
      },
      {
        id: "ig-reel",
        label: "Instagram Reel",
        w: 1080,
        h: 1920,
        ratio: "9:16",
        color: "#E1306C",
      },
      {
        id: "tt-post",
        label: "TikTok Post",
        w: 1080,
        h: 1920,
        ratio: "9:16",
        color: "#111111",
      },
      {
        id: "tt-thumb",
        label: "TikTok Thumbnail",
        w: 1080,
        h: 1440,
        ratio: "3:4",
        color: "#111111",
      },
      {
        id: "yt-cover",
        label: "Youtube Cover",
        w: 1280,
        h: 720,
        ratio: "16:9",
        color: "#FF0000",
      },
      {
        id: "yt-art",
        label: "Youtube Channel Art",
        w: 2560,
        h: 1440,
        ratio: "16:9",
        color: "#FF0000",
      },
      {
        id: "fb-cover",
        label: "Facebook Cover",
        w: 820,
        h: 312,
        ratio: "2.39:1",
        color: "#1877F2",
      },
      {
        id: "fb-post",
        label: "Facebook Post",
        w: 1200,
        h: 628,
        ratio: "1.85:1",
        color: "#1877F2",
      },
      {
        id: "li-banner",
        label: "LinkedIn Banner",
        w: 820,
        h: 312,
        ratio: "2.39:1",
        color: "#0A66C2",
      },
      {
        id: "li-pfp",
        label: "LinkedIn Profile Picture",
        w: 800,
        h: 800,
        ratio: "1:1",
        color: "#0A66C2",
      },
      {
        id: "wa-sticker",
        label: "WhatsApp Sticker",
        w: 512,
        h: 512,
        ratio: "1:1",
        color: "#25D366",
      },
      {
        id: "pin",
        label: "Pinterest",
        w: 735,
        h: 1102,
        ratio: "2:3",
        color: "#E60023",
      },
      {
        id: "line",
        label: "Line",
        w: 1040,
        h: 1040,
        ratio: "1:1",
        color: "#06C755",
      },
    ],
  },
  {
    title: "Marketplace sizes",
    items: [
      {
        id: "mp-fb",
        label: "Facebook Marketplace",
        w: 1080,
        h: 1080,
        ratio: "1:1",
        color: "#1877F2",
      },
      {
        id: "mp-ebay",
        label: "eBay",
        w: 1600,
        h: 1600,
        ratio: "1:1",
        color: "#E53238",
      },
      {
        id: "mp-posh",
        label: "Poshmark",
        w: 1080,
        h: 1080,
        ratio: "1:1",
        color: "#7f0353",
      },
      {
        id: "mp-depop",
        label: "Depop",
        w: 1280,
        h: 1280,
        ratio: "1:1",
        color: "#FF2300",
      },
      {
        id: "mp-merc",
        label: "Mercari",
        w: 1080,
        h: 1080,
        ratio: "1:1",
        color: "#FF0211",
      },
      {
        id: "mp-ml",
        label: "Mercado Libre",
        w: 1080,
        h: 1080,
        ratio: "1:1",
        color: "#2D3277",
      },
      {
        id: "mp-shopee",
        label: "Shopee",
        w: 1080,
        h: 1080,
        ratio: "1:1",
        color: "#EE4D2D",
      },
      {
        id: "mp-lazada",
        label: "Lazada",
        w: 1080,
        h: 1080,
        ratio: "1:1",
        color: "#F0508C",
      },
      {
        id: "mp-etsy-sq",
        label: "Etsy Square",
        w: 2048,
        h: 2048,
        ratio: "1:1",
        color: "#F1641E",
      },
      {
        id: "mp-etsy-ld",
        label: "Etsy Landscape",
        w: 2700,
        h: 2025,
        ratio: "4:3",
        color: "#F1641E",
      },
      {
        id: "mp-vinted",
        label: "Vinted",
        w: 800,
        h: 600,
        ratio: "4:3",
        color: "#09B1BA",
      },
      {
        id: "mp-amazon",
        label: "Amazon",
        w: 2000,
        h: 2000,
        ratio: "1:1",
        color: "#FF9900",
      },
      {
        id: "mp-shop-sq",
        label: "Shopify Square",
        w: 2048,
        h: 2048,
        ratio: "1:1",
        color: "#95BF47",
      },
      {
        id: "mp-shop-ld",
        label: "Shopify Landscape",
        w: 2000,
        h: 1800,
        ratio: "10:9",
        color: "#95BF47",
      },
      {
        id: "mp-shop-pt",
        label: "Shopify Portrait",
        w: 1600,
        h: 2000,
        ratio: "4:5",
        color: "#95BF47",
      },
    ],
  },
];

// Simple starter templates — each adds a set of overlay layers (+ optional bg).
const TEMPLATES_PRESETS = [
  {
    id: "sale",
    label: "Sale",
    bg: { type: "gradient", from: "#fa709a", to: "#fee140" },
    layers: [
      {
        type: "badge",
        fill: "#ef4444",
        textColor: "#fff",
        text: "SALE",
        w: 96,
        h: 96,
        x: 90,
        y: 90,
      },
      {
        type: "text",
        text: "Up to 50% OFF",
        color: "#111111",
        fontWeight: "800",
        align: "center",
        fontSize: 34,
        w: 300,
        h: 60,
        x: 260,
        y: 380,
      },
    ],
  },
  {
    id: "new",
    label: "New Drop",
    bg: { type: "color", value: "#111827" },
    layers: [
      {
        type: "badge",
        fill: "#22c55e",
        textColor: "#fff",
        text: "NEW",
        w: 90,
        h: 90,
        x: 90,
        y: 90,
      },
      {
        type: "text",
        text: "Just Landed",
        color: "#ffffff",
        fontWeight: "800",
        align: "center",
        fontSize: 36,
        w: 320,
        h: 60,
        x: 260,
        y: 380,
      },
    ],
  },
  {
    id: "headline",
    label: "Headline",
    bg: { type: "none" },
    layers: [
      {
        type: "text",
        text: "Your headline here",
        color: "#111111",
        fontWeight: "800",
        align: "center",
        fontSize: 40,
        w: 380,
        h: 70,
        x: 260,
        y: 70,
      },
      {
        type: "path",
        d: "M6 50 H94",
        stroke: "#7c3aed",
        strokeWidth: 6,
        w: 200,
        h: 30,
        x: 260,
        y: 120,
      },
    ],
  },
];

// ── Photoroom-style Templates (grouped, searchable) ───────────────────────
// Each item carries an `apply` describing the editor-state change it makes.
const STUDIO_BG = [
  {
    id: "st-sage",
    label: "Sage",
    bg: { type: "gradient", from: "#dce7d5", to: "#c4d8bf" },
  },
  {
    id: "st-sky",
    label: "Sky",
    bg: { type: "gradient", from: "#d6e4f0", to: "#bcd4ea" },
  },
  {
    id: "st-blush",
    label: "Blush",
    bg: { type: "gradient", from: "#f6dcd2", to: "#f0c9bd" },
  },
  {
    id: "st-sand",
    label: "Sand",
    bg: { type: "gradient", from: "#efe6d6", to: "#e2d3ba" },
  },
  {
    id: "st-lilac",
    label: "Lilac",
    bg: { type: "gradient", from: "#e4ddf2", to: "#ccbff0" },
  },
  {
    id: "st-slate",
    label: "Slate",
    bg: { type: "gradient", from: "#1e293b", to: "#0f172a" },
  },
  {
    id: "st-peach",
    label: "Peach",
    bg: { type: "gradient", from: "#ffe3d0", to: "#ffc7a8" },
  },
  {
    id: "st-mint",
    label: "Mint",
    bg: { type: "gradient", from: "#d7f5ec", to: "#b6ead9" },
  },
  {
    id: "st-graphite",
    label: "Graphite",
    bg: { type: "gradient", from: "#3a3f47", to: "#22262c" },
  },
  {
    id: "st-cream",
    label: "Cream",
    bg: { type: "gradient", from: "#faf5ea", to: "#efe6d0" },
  },
];
const FILTER_TEMPLATES = [
  { id: "f-gray", label: "Grayscale", filter: "grayscale" },
  { id: "sepia", label: "Sepia", filter: "sepia" },
  { id: "f-warm", label: "Warm", filter: "warm" },
  { id: "f-cool", label: "Cool", filter: "cool" },
  { id: "f-invert", label: "Invert", filter: "invert" },
  { id: "noir", label: "Noir", filter: "noir" },
  { id: "fade", label: "Fade", filter: "fade" },
  { id: "mono", label: "Mono", filter: "mono" },
  { id: "process", label: "Process", filter: "process" },
  { id: "chrome", label: "Chrome", filter: "chrome" },
  { id: "tonal", label: "Tonal", filter: "tonal" },
  { id: "f-blur", label: "Blur", blur: 6 },
];
const SIZE_TEMPLATES = [
  { id: "sz-1-1", label: "Square 1:1", w: 460, h: 460 },
  { id: "sz-4-5", label: "Portrait 4:5", w: 416, h: 520 },
  { id: "sz-9-16", label: "Story 9:16", w: 300, h: 533 },
  { id: "sz-16-9", label: "Wide 16:9", w: 540, h: 304 },
  { id: "sz-3-2", label: "Landscape 3:2", w: 540, h: 360 },
  { id: "sz-2-3", label: "Poster 2:3", w: 360, h: 540 },
  { id: "sz-fb-cover", label: "FB Cover", w: 540, h: 205 },
  { id: "sz-yt-thumb", label: "YouTube 16:9", w: 540, h: 304 },
];
const PROFILE_TEMPLATES = [
  { id: "pf-sunset", label: "Sunset", from: "#f857a6", to: "#ff5858" },
  { id: "pf-ocean", label: "Ocean", from: "#2193b0", to: "#6dd5ed" },
  { id: "pf-grape", label: "Grape", from: "#7f00ff", to: "#e100ff" },
  { id: "pf-lime", label: "Lime", from: "#a8e063", to: "#56ab2f" },
  { id: "pf-gold", label: "Gold", from: "#f7971e", to: "#ffd200" },
  { id: "pf-berry", label: "Berry", from: "#c31432", to: "#240b36" },
];
// Photoroom-style filter presets — each is a CSS filter string that works in the
// preview AND the canvas export (ctx.filter). Applied on top of the baked pixels.
// FILTERS now lives in ./editorShared (shared with ImagePanel).
// Legacy ids still referenced by the Templates "Photo Filters" group.
const FILTER_LEGACY = {
  grayscale: "grayscale(1)",
  warm: "sepia(0.3) saturate(1.4)",
  cool: "hue-rotate(30deg) saturate(0.9)",
  invert: "invert(0.2)",
};
const filterCss = (id) => {
  const f = FILTERS.find((x) => x.id === id);
  return f ? f.css : FILTER_LEGACY[id] || "";
};
// CSS filter string for thumbnail previews.
const staticFilterCss = (name) => filterCss(name) || "none";

const TEMPLATE_GROUPS = [
  {
    title: "Classics",
    items: [
      {
        id: "cl-white",
        label: "White",
        swatch: "#ffffff",
        apply: { bg: { type: "color", value: "#ffffff" }, round: false },
      },
      {
        id: "cl-black",
        label: "Black",
        swatch: "#000000",
        apply: { bg: { type: "color", value: "#000000" }, round: false },
      },
      {
        id: "cl-trans",
        label: "Transparent",
        checker: true,
        apply: { bg: { type: "none" }, round: false },
      },
      {
        id: "cl-orig",
        label: "Original",
        apply: { bg: { type: "none" }, removeBg: false, round: false },
      },
    ],
  },
  {
    title: "Studio",
    items: STUDIO_BG.map((s) => ({
      id: s.id,
      label: s.label,
      apply: { bg: s.bg, round: false },
    })),
  },
  {
    title: "Backgrounds",
    items: BG_IMAGES.map((src, i) => ({
      id: `bg-${i}`,
      label: `Scene ${i + 1}`,
      apply: { bg: { type: "image", src }, round: false },
    })),
  },
  {
    title: "Surfaces",
    items: [
      ...(BG_LIBRARY.find((c) => c.category === "Surface")?.ids || []),
      ...(BG_LIBRARY.find((c) => c.category === "Fabric")?.ids || []),
    ].map((id, i) => ({
      id: `surf-${id}`,
      label: `Surface ${i + 1}`,
      apply: { bg: { type: "image", src: ckpx(id) }, round: false },
    })),
  },
  {
    title: "Photo Filters",
    items: FILTER_TEMPLATES.map((f) => ({
      id: f.id,
      label: f.label,
      apply: { filter: f.filter, blur: f.blur },
    })),
  },
  {
    title: "Sizes",
    items: SIZE_TEMPLATES.map((s) => ({
      id: s.id,
      label: s.label,
      apply: {
        size: { w: s.w, h: s.h },
        bg: { type: "color", value: "#ffffff" },
        round: false,
      },
    })),
  },
  {
    title: "Profile Pics",
    items: PROFILE_TEMPLATES.map((p) => ({
      id: p.id,
      label: p.label,
      apply: {
        size: { w: 460, h: 460 },
        round: true,
        bg: { type: "gradient", from: p.from, to: p.to },
      },
    })),
  },
  {
    title: "Rounded",
    items: [
      { id: "rd-white", label: "White", bg: { type: "color", value: "#ffffff" } },
      { id: "rd-black", label: "Black", bg: { type: "color", value: "#111827" } },
      {
        id: "rd-sky",
        label: "Sky",
        bg: { type: "gradient", from: "#d6e4f0", to: "#bcd4ea" },
      },
      {
        id: "rd-blush",
        label: "Blush",
        bg: { type: "gradient", from: "#f6dcd2", to: "#f0c9bd" },
      },
      {
        id: "rd-mint",
        label: "Mint",
        bg: { type: "gradient", from: "#d7f5ec", to: "#b6ead9" },
      },
    ].map((r) => ({
      id: r.id,
      label: r.label,
      apply: { size: { w: 460, h: 460 }, round: true, bg: r.bg },
    })),
  },
  {
    title: "Promo",
    items: TEMPLATES_PRESETS.map((t) => ({
      id: `promo-${t.id}`,
      label: t.label,
      apply: { bg: t.bg, layers: t.layers, round: false },
    })),
  },
];

// Toggle / PosField / Slider now live in ./editorShared (shared with ImagePanel).

// ── Per-image effect model ────────────────────────────────────────────────
// Every image (the base image AND every inserted image layer) shares the same
// Image panel. These are the panel-editable effect props with their defaults —
// the base image keeps them as flat component state; an image layer stores them
// on `layer.img`. Geometry (position/size) and source URLs are NOT here (they
// stay base-flat / layer top-level). See the "active image" adapter below.
const IMG_DEFAULTS = {
  removeBg: false,
  // Adjust
  brightness: 0,
  contrast: 0,
  saturation: 0,
  highlights: 0,
  shadowsAdj: 0,
  sharpen: 0,
  hue: 0,
  warmth: 0,
  adjOpacity: 100,
  // Transform
  rotation: 0,
  flipH: false,
  flipV: false,
  scale: 100,
  tile: 1,
  hPersp: 0,
  vPersp: 0,
  // Blur + filter + texture
  blurAmount: 0,
  blurType: "gaussian",
  selectedFilter: "none",
  textureType: "posterize",
  textureAmount: 10,
  // Shadow
  shadowBlur: 10,
  shadowOpacity: 50,
  shadowColor: "#000000",
  shadowX: 0,
  shadowY: 12,
  shadowMode: "drop",
  shadowShortness: 50,
  // Outline
  outlineColor: "#7c3aed",
  outlineWidth: 3,
  outlineBlur: 0,
  // Reflection
  reflectionOpacity: 75,
  reflectionGap: 0,
  reflectionX: 0,
  reflectionAngle: 0,
  // Blend
  blendMode: "normal",
  toggles: {
    shadows: false,
    outline: false,
    reflection: false,
    blur: false,
    filter: false,
    texture: false,
  },
};

// Outline halo directions (8-way stacked drop-shadows tracing the alpha edge).
const OUTLINE_DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

// CSS filter string for an image given its effect props. Shared by the base
// image preview and every image layer so they render identically.
//   bakeAdjust=true  (base): the Adjust sliders are already baked into the
//                    pixels (adjustedUrl), so only the Filter preset + outline
//                    + drop-shadow are emitted.
//   bakeAdjust=false (layers, Phase 1): the CSS-expressible Adjust subset
//                    (brightness/contrast/saturation/hue) is emitted inline so
//                    it previews live without a bake pipeline.
function buildImageFilter(p, { bakeAdjust = true } = {}) {
  const parts = [];
  if (p.toggles?.filter) {
    const f = filterCss(p.selectedFilter);
    if (f) parts.push(f);
  }
  if (!bakeAdjust) {
    if (p.brightness) parts.push(`brightness(${1 + p.brightness / 100})`);
    if (p.contrast) parts.push(`contrast(${1 + p.contrast / 100})`);
    if (p.saturation) parts.push(`saturate(${1 + p.saturation / 100})`);
    if (p.hue) parts.push(`hue-rotate(${p.hue}deg)`);
  }
  if (p.toggles?.outline) {
    for (const [dx, dy] of OUTLINE_DIRS)
      parts.push(
        `drop-shadow(${dx * p.outlineWidth}px ${dy * p.outlineWidth}px ${p.outlineBlur}px ${p.outlineColor})`,
      );
  }
  if (p.toggles?.shadows && p.shadowMode === "drop")
    parts.push(
      `drop-shadow(${p.shadowX}px ${p.shadowY}px ${p.shadowBlur * 2}px ${hexToRgba(p.shadowColor, p.shadowOpacity / 100)})`,
    );
  return parts.join(" ");
}

// CSS filter for a text layer's Adjust panel. Only the CSS-expressible subset
// previews live (brightness/contrast/saturation/hue + a warmth approximation);
// highlights/shadows/sharpen/blend are stored on the layer but need a bake pass.
function textAdjustFilter(l) {
  const parts = [];
  if (l.brightness) parts.push(`brightness(${1 + l.brightness / 100})`);
  if (l.contrast) parts.push(`contrast(${1 + l.contrast / 100})`);
  if (l.saturation) parts.push(`saturate(${1 + l.saturation / 100})`);
  if (l.hue) parts.push(`hue-rotate(${l.hue}deg)`);
  if (l.warmth > 0) parts.push(`sepia(${(l.warmth / 100) * 0.6})`);
  else if (l.warmth < 0) parts.push(`hue-rotate(${(l.warmth / 100) * 40}deg)`);
  return parts.join(" ");
}

// Full CSS filter for a text layer: Adjust subset + the Outline panel's Blur,
// rendered as a soft glow of the outline colour around the glyphs.
function textFilter(l) {
  const parts = [];
  const adj = textAdjustFilter(l);
  if (adj) parts.push(adj);
  if (l.outlineOn && (l.outlineBlur ?? 0) > 0)
    parts.push(
      `drop-shadow(0 0 ${l.outlineBlur}px ${l.outlineColor || "#000000"})`,
    );
  return parts.join(" ");
}

// CSS text-shadow for a text layer's Shadows panel. Shortness shrinks the drop
// distance (higher = shorter/closer), Move nudges it via shadowX/shadowY.
function buildTextShadow(l) {
  if (!l.shadowOn) return undefined;
  const drop = ((100 - (l.shadowShortness ?? 45)) / 100) * 36;
  const x = l.shadowX ?? 0;
  const y = (l.shadowY ?? 0) + drop;
  const blur = l.shadowBlur ?? 6;
  const color = hexToRgba(
    l.shadowColor || "#000000",
    (l.shadowOpacity ?? 70) / 100,
  );
  // Two stacked casts read more prominently than a single soft one.
  return `${x}px ${y}px ${blur}px ${color}, ${x}px ${y}px ${blur * 2 + 2}px ${color}`;
}

// CSS transform for a text layer's inner content: the Transform panel's H/V
// perspective (previewed live via CSS perspective/rotate). Flip lives on the
// outer positioned box (alongside rotation) so it mirrors the whole box; Tile is
// stored on the layer but needs a bake pass, like the image panel defers it.
function textTransform(l) {
  const parts = [];
  if (l.hPersp || l.vPersp)
    parts.push(
      `perspective(800px) rotateY(${((l.hPersp || 0) / 100) * 40}deg) rotateX(${(-(l.vPersp || 0) / 100) * 40}deg)`,
    );
  return parts.join(" ");
}

// CSS transform for an image. The base bakes uniform scale into its box, so it
// passes includeScale=false and keeps rotate on the <img>; an image layer keeps
// rotate on its container (with the resize handles) and previews scale via CSS.
function buildImageTransform(
  p,
  { includeRotate = true, includeScale = false } = {},
) {
  const parts = [];
  if (includeRotate) parts.push(`rotate(${p.rotation || 0}deg)`);
  parts.push(`scaleX(${p.flipH ? -1 : 1})`);
  parts.push(`scaleY(${p.flipV ? -1 : 1})`);
  if (includeScale) parts.push(`scale(${(p.scale ?? 100) / 100})`);
  return parts.join(" ");
}

// Does an image's props need the (async, pixel-level) bake pipeline?
// Covers the effects that can't be expressed as a CSS filter: the full Adjust
// set, tile/perspective, blur and texture. (Filter preset, outline, drop shadow,
// blend, opacity, flip, scale are CSS/canvas and handled without a bake.)
function layerNeedsBake(p) {
  return !!(
    p.brightness ||
    p.contrast ||
    p.saturation ||
    p.highlights ||
    p.shadowsAdj ||
    p.sharpen ||
    p.hue ||
    p.warmth ||
    p.tile > 1 ||
    p.hPersp ||
    p.vPersp ||
    (p.toggles?.blur && p.blurAmount > 0) ||
    (p.toggles?.texture && p.textureAmount > 0)
  );
}

// Bake an image's pixel-level effects into a PNG data URL, mirroring the base
// image's chained pipeline (adjust → tile/perspective → blur → texture). Used
// for both the live preview of image layers and their export, so a layer looks
// the same as the base image would with the same settings. Returns the original
// src when nothing needs baking.
async function computeRenderSrc(srcUrl, p) {
  let src = srcUrl;
  if (
    p.brightness ||
    p.contrast ||
    p.saturation ||
    p.highlights ||
    p.shadowsAdj ||
    p.sharpen ||
    p.hue ||
    p.warmth
  ) {
    const img = await loadImageEl(src);
    const c = processAdjustments(img, {
      brightness: p.brightness,
      contrast: p.contrast,
      saturation: p.saturation,
      highlights: p.highlights,
      shadows: p.shadowsAdj,
      sharpen: p.sharpen,
      hue: p.hue,
      warmth: p.warmth,
    });
    if (c) src = c.toDataURL("image/png");
  }
  if (p.tile > 1 || p.hPersp || p.vPersp) {
    const img = await loadImageEl(src);
    const c = processTransform(img, {
      tile: p.tile,
      hPersp: p.hPersp,
      vPersp: p.vPersp,
    });
    if (c) src = c.toDataURL("image/png");
  }
  if (p.toggles?.blur && p.blurAmount > 0) {
    const img = await loadImageEl(src);
    const c = processBlur(img, p.blurType, p.blurAmount);
    if (c) src = c.toDataURL("image/png");
  }
  if (p.toggles?.texture && p.textureAmount > 0) {
    const img = await loadImageEl(src);
    const c = processTexture(img, p.textureType, p.textureAmount);
    if (c) src = c.toDataURL("image/png");
  }
  return src;
}

export default function PhotoEditor({ mode, onClose, initialImageUrl }) {
  const { uploadMedia, myImages = [], activeBrand, sendUrl, user } = useAuth();
  // Avatar initial from the signed-in user's name (falls back to email).
  const userInitial = (user?.name || user?.email || "?")
    .trim()
    .charAt(0)
    .toUpperCase();
  const [compareOpen, setCompareOpen] = useState(false); // Before/After overlay (panels button)
  const [subjectRemoved, setSubjectRemoved] = useState(false); // deleted the image → transparent canvas + Background panel
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);
  const insertFileRef = useRef(null);
  const layerReplaceRef = useRef(null); // replace a selected image layer's src
  const [saving, setSaving] = useState(false);

  // ── Layer system (overlay elements on top of the base image) ──────────
  const [layers, setLayers] = useState([]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [editingLayerId, setEditingLayerId] = useState(null); // text layer being edited inline
  const [activeTool, setActiveTool] = useState(null); // null = image-edit panel; 'insert' = Insert panel
  const [insertCat, setInsertCat] = useState(null); // open category id within the Insert panel
  const layerDragRef = useRef(null);

  // ── Brand Kit (logos / colour palettes / fonts) ───────────────────────
  // Seeded from the API brand, extended by the user, persisted per-brand in
  // localStorage (backend has no multi-asset brand-kit storage yet).
  const [kit, setKit] = useState(null); // { logos:[url], palettes:[{id,name,colors:[]}], fonts:[family] }
  const kitLoadedRef = useRef(false);
  const [kitTab, setKitTab] = useState("logos"); // logos | colors | fonts | import
  const [kitUrl, setKitUrl] = useState("");
  const [kitImporting, setKitImporting] = useState(false);
  const [fontQuery, setFontQuery] = useState("");
  const kitLogoInputRef = useRef(null);

  // ── Add Text panel ────────────────────────────────────────────────────
  const [textStyleCat, setTextStyleCat] = useState("All");
  const [textStyleQuery, setTextStyleQuery] = useState("");
  const kitStorageKey = `ck_brandkit_${activeBrand?.id || "none"}`;

  const seedKitFromBrand = (b) => ({
    logos: b?.logo ? [b.logo] : [],
    palettes: [
      {
        id: "brand",
        name: b?.name || "Brand colors",
        colors: [b?.primary_color, b?.secondary_color].filter(Boolean),
      },
    ].filter((p) => p.colors.length),
    fonts: b?.fonts ? [b.fonts] : [],
  });

  // Load (or seed) the kit whenever the active brand changes.
  useEffect(() => {
    kitLoadedRef.current = false;
    let next = null;
    try {
      const stored = localStorage.getItem(kitStorageKey);
      if (stored) next = JSON.parse(stored);
    } catch {
      /* ignore */
    }
    if (!next) next = seedKitFromBrand(activeBrand);
    // Normalise shape.
    next = {
      logos: Array.isArray(next.logos) ? next.logos : [],
      palettes:
        Array.isArray(next.palettes) && next.palettes.length
          ? next.palettes
          : seedKitFromBrand(activeBrand).palettes,
      fonts: Array.isArray(next.fonts) ? next.fonts : [],
    };
    setKit(next);
    // Pre-load any saved fonts so they render immediately.
    next.fonts.forEach((f) => loadWebFont(f));
    kitLoadedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBrand?.id]);

  // Persist on change (after the initial load).
  useEffect(() => {
    if (!kit || !kitLoadedRef.current) return;
    try {
      localStorage.setItem(kitStorageKey, JSON.stringify(kit));
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kit]);

  // Preload preset + kit fonts when the Add Text panel opens so previews render.
  useEffect(() => {
    if (activeTool !== "addtext") return;
    TEXT_STYLES.forEach((s) => s.fontFamily && loadWebFont(s.fontFamily));
    (kit?.fonts || []).forEach((f) => loadWebFont(f));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool]);

  // Load recent resize presets once.
  useEffect(() => {
    try {
      const s = localStorage.getItem("ck_resize_recent");
      if (s) setRecentSizes(JSON.parse(s));
    } catch {
      /* ignore */
    }
  }, []);

  // Canvas background (behind the cut-out) + canvas size (Resize).
  const [canvasBg, setCanvasBg] = useState({ type: "none" }); // {type:'color',value} | {type:'gradient',from,to} | {type:'image',src}
  const [canvasSize, setCanvasSize] = useState({ w: CANVAS_W, h: CANVAS_H });
  const [canvasRound, setCanvasRound] = useState(false); // circular clip (Profile Pics)
  const [exportSize, setExportSize] = useState(null); // real output dims {w,h} (Resize); null = 2× preview
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false); // Download format dropdown (PNG/JPEG)
  const [templateQuery, setTemplateQuery] = useState("");
  const [templateCat, setTemplateCat] = useState(null); // open group title (See all)

  // Base image box model (preview px) — drives 8-handle resize + export.
  const [imgW, setImgW] = useState(null);
  const [imgH, setImgH] = useState(null);
  // Base-image crop window: {cw,ch,cx,cy} content size + offset inside the box,
  // or null for "content fills the box" (no crop). Side handles crop, corners
  // scale — same model as image layers.
  const [imgCrop, setImgCrop] = useState(null);
  const [imgHidden, setImgHidden] = useState(false);
  const imgFitRef = useRef({ w: 0, h: 0 }); // fitted size at load (for the Scale slider)
  const imgResizeRef = useRef(null);

  // ── Resize panel ──────────────────────────────────────────────────────
  const [resizeQuery, setResizeQuery] = useState("");
  const [pendingResize, setPendingResize] = useState(null);
  const [showCustomSize, setShowCustomSize] = useState(false);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [recentSizes, setRecentSizes] = useState([]);

  // ── Backgrounds panel ─────────────────────────────────────────────────
  const [bgTab, setBgTab] = useState("color"); // 'color' | 'image'
  const [bgSearchQuery, setBgSearchQuery] = useState("");
  const [bgCategory, setBgCategory] = useState(null); // opened library category
  const [bgQueryDebounced, setBgQueryDebounced] = useState("");
  const bgFileRef = useRef(null);

  // Debounce the background search box (state set only inside the timer, so it
  // never runs synchronously in the effect). The debounced value drives the
  // infinite results grid, which remounts per query via its key.
  useEffect(() => {
    const t = setTimeout(() => setBgQueryDebounced(bgSearchQuery.trim()), 400);
    return () => clearTimeout(t);
  }, [bgSearchQuery]);

  // Edit Cutout (manual eraser)
  const [cutoutOpen, setCutoutOpen] = useState(false);
  const [cutoutTarget, setCutoutTarget] = useState(null); // null = base, else layerId
  const [brushSize, setBrushSize] = useState(40);
  const cutoutCanvasRef = useRef(null);
  const cutoutDrawing = useRef(false);
  const [originalUrl, setOriginalUrl] = useState(initialImageUrl || null);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [removeBg, setRemoveBg] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [selected, setSelected] = useState(!!initialImageUrl);
  const [aiPrompt, setAiPrompt] = useState("");
  const [applyingAi, setApplyingAi] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState(null);

  // Adjust settings
  // Adjust — all 0-centred (Photoroom-style); 0 = no change. Baked into pixels.
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [highlights, setHighlights] = useState(0);
  const [shadowsAdj, setShadowsAdj] = useState(0);
  const [sharpen, setSharpen] = useState(0);
  const [hue, setHue] = useState(0);
  const [warmth, setWarmth] = useState(0);
  const [adjOpacity, setAdjOpacity] = useState(100);
  const [adjustedUrl, setAdjustedUrl] = useState(null); // baked-adjustments PNG (null = none)

  // Transform
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [scale, setScale] = useState(100);
  const [tile, setTile] = useState(1); // 1 = no tiling, N = N×N grid
  const [hPersp, setHPersp] = useState(0); // horizontal perspective (-100…100)
  const [vPersp, setVPersp] = useState(0); // vertical perspective (-100…100)
  const [transformedSrc, setTransformedSrc] = useState(null); // baked tile + perspective

  // Shadow (Photoroom-style: drop vs. floor/cast, colour, offset, shortness)
  const [shadowBlur, setShadowBlur] = useState(10);
  const [shadowOpacity, setShadowOpacity] = useState(50);
  const [shadowColor, setShadowColor] = useState("#000000");
  const [shadowX, setShadowX] = useState(0); // px offset (drop) / horizontal nudge (floor)
  const [shadowY, setShadowY] = useState(12); // px offset (drop) / vertical nudge (floor)
  const [shadowMode, setShadowMode] = useState("drop"); // 'drop' | 'floor'
  const [shadowShortness, setShadowShortness] = useState(50); // floor cast length (0 long → 100 short)
  const [floorShadow, setFloorShadow] = useState(null); // { url, pad, spriteW, spriteH } generated sprite

  // Outline (silhouette halo) — width / colour / blur, like Photoroom.
  const [outlineColor, setOutlineColor] = useState("#7c3aed");
  const [outlineWidth, setOutlineWidth] = useState(3);
  const [outlineBlur, setOutlineBlur] = useState(0);

  // Reflection (mirrored copy below the object) — opacity / move / angle.
  const [reflectionOpacity, setReflectionOpacity] = useState(75);
  const [reflectionGap, setReflectionGap] = useState(0); // vertical gap (Move Y)
  const [reflectionX, setReflectionX] = useState(0); // horizontal nudge (Move X)
  const [reflectionAngle, setReflectionAngle] = useState(0);
  const [reflectionSprite, setReflectionSprite] = useState(null); // { url, w, h }

  // Blend mode (product vs. background).
  const [blendMode, setBlendMode] = useState("normal");

  // Blur (Photoroom-style types, baked so all kinds work + export)
  const [blurAmount, setBlurAmount] = useState(0);
  const [blurType, setBlurType] = useState("gaussian");
  const [blurredSrc, setBlurredSrc] = useState(null);

  // Filter
  const [selectedFilter, setSelectedFilter] = useState("none");

  // Toggles
  const [toggles, setToggles] = useState({
    shadows: false,
    outline: false,
    reflection: false,
    blur: false,
    filter: false,
    texture: false,
  });

  // Texture (posterize / line / color) — baked pixel effect.
  const [textureType, setTextureType] = useState("posterize");
  const [textureAmount, setTextureAmount] = useState(10);
  const [texturedSrc, setTexturedSrc] = useState(null);

  // Position (drag + align) — preview-space offset from centre, in px.
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const dragRef = useRef(null);

  // Undo / redo history
  const [history, setHistory] = useState([]);
  const [histIndex, setHistIndex] = useState(-1);
  const histIndexRef = useRef(-1);
  const applyingHistoryRef = useRef(false);
  const histTimerRef = useRef(null);
  useEffect(() => {
    histIndexRef.current = histIndex;
  }, [histIndex]);

  // Adjust + Blur are baked into the image pixels (adjustedUrl / blurredSrc);
  // imageFilter only carries the Filter preset now (gated by its toggle).
  const imageFilter = toggles.filter ? filterCss(selectedFilter) : "";

  // Shadow / outline that hug the cut-out SILHOUETTE (the shoe), not the
  // rectangular image box. CSS box-shadow + CSS outline trace the box; an
  // alpha-aware `drop-shadow` traces the transparent edge instead. Shared by the
  // live preview and the canvas export so they stay in sync.
  // (OUTLINE_DIRS now lives at module scope — shared with buildImageFilter.)
  const effectsFilter = [
    // Outline: stacked drop-shadows trace the alpha edge (8 directions). Width =
    // offset distance, Blur = softness/glow, Color = the halo colour.
    ...(toggles.outline
      ? OUTLINE_DIRS.map(
          ([dx, dy]) =>
            `drop-shadow(${dx * outlineWidth}px ${dy * outlineWidth}px ${outlineBlur}px ${outlineColor})`,
        )
      : []),
    // Soft DROP shadow: follows the silhouette (matches the canvas export).
    // Floor/cast shadow is a separate generated sprite (see floorShadow), not a filter.
    ...(toggles.shadows && shadowMode === "drop"
      ? [
          `drop-shadow(${shadowX}px ${shadowY}px ${shadowBlur * 2}px ${hexToRgba(shadowColor, shadowOpacity / 100)})`,
        ]
      : []),
  ].join(" ");

  const imageFilterWithEffects = [imageFilter, effectsFilter]
    .filter(Boolean)
    .join(" ");

  const imageTransform = [
    `translate(${posX}px, ${posY}px)`,
    `rotate(${rotation}deg)`,
    `scaleX(${flipH ? -1 : 1})`,
    `scale(${scale / 100})`,
  ].join(" ");

  const displayImage = processedUrl || originalUrl;

  // The image everything renders from: the baked-adjustments version when any
  // Adjust slider is non-default, else the raw display image.
  const baseImageSrc = adjustedUrl || displayImage;

  // ── Adjust: bake the pixel changes (debounced) ────────────────────────
  useEffect(() => {
    const allDefault = !(
      brightness ||
      contrast ||
      saturation ||
      highlights ||
      shadowsAdj ||
      sharpen ||
      hue ||
      warmth
    );
    if (!displayImage || allDefault) {
      setAdjustedUrl(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const img = await loadImageEl(displayImage);
        if (cancelled) return;
        const c = processAdjustments(img, {
          brightness,
          contrast,
          saturation,
          highlights,
          shadows: shadowsAdj,
          sharpen,
          hue,
          warmth,
        });
        if (!cancelled) setAdjustedUrl(c ? c.toDataURL("image/png") : null);
      } catch {
        if (!cancelled) setAdjustedUrl(null);
      }
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [
    displayImage,
    brightness,
    contrast,
    saturation,
    highlights,
    shadowsAdj,
    sharpen,
    hue,
    warmth,
  ]);

  // ── Transform: bake tile + perspective (debounced) ────────────────────
  useEffect(() => {
    const none = !(tile > 1 || hPersp || vPersp);
    if (!baseImageSrc || none) {
      setTransformedSrc(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const img = await loadImageEl(baseImageSrc);
        if (cancelled) return;
        const c = processTransform(img, { tile, hPersp, vPersp });
        if (!cancelled) setTransformedSrc(c ? c.toDataURL("image/png") : null);
      } catch {
        if (!cancelled) setTransformedSrc(null);
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [baseImageSrc, tile, hPersp, vPersp]);

  // Source after transform/adjust, before blur.
  const preBlurSrc = transformedSrc || baseImageSrc;

  // ── Blur: bake the selected type (debounced) ──────────────────────────
  useEffect(() => {
    if (!preBlurSrc || !toggles.blur || blurAmount <= 0) {
      setBlurredSrc(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const img = await loadImageEl(preBlurSrc);
        if (cancelled) return;
        const c = processBlur(img, blurType, blurAmount);
        if (!cancelled) setBlurredSrc(c ? c.toDataURL("image/png") : null);
      } catch {
        if (!cancelled) setBlurredSrc(null);
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [preBlurSrc, toggles.blur, blurType, blurAmount]);

  // Source after blur, before texture.
  const preTextureSrc = toggles.blur && blurredSrc ? blurredSrc : preBlurSrc;

  // ── Texture: bake the selected effect (debounced) ─────────────────────
  useEffect(() => {
    if (!preTextureSrc || !toggles.texture || textureAmount <= 0) {
      setTexturedSrc(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const img = await loadImageEl(preTextureSrc);
        if (cancelled) return;
        const c = processTexture(img, textureType, textureAmount);
        if (!cancelled) setTexturedSrc(c ? c.toDataURL("image/png") : null);
      } catch {
        if (!cancelled) setTexturedSrc(null);
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [preTextureSrc, toggles.texture, textureType, textureAmount]);

  // What the product renders from: texture → blur → transform → adjust → raw.
  const renderSrc =
    toggles.texture && texturedSrc ? texturedSrc : preTextureSrc;

  // ── Floor / cast shadow sprite ────────────────────────────────────────
  // A drop-shadow can't do the "shadow on the ground" look — that needs the
  // silhouette mirrored at the base, vertically squashed (Shortness), blurred and
  // faded. We bake it to a PNG sprite here (preview-space px) and reuse the same
  // sprite for the canvas export, so preview == download. Regenerated only while
  // Floor mode is active and a setting that affects the shape changes.
  useEffect(() => {
    let cancelled = false;
    if (
      !displayImage ||
      !toggles.shadows ||
      shadowMode !== "floor" ||
      imgW == null ||
      imgH == null
    ) {
      setFloorShadow(null);
      return;
    }
    (async () => {
      try {
        const img = await loadImageEl(renderSrc);
        if (cancelled) return;
        const sprite = makeFloorShadowSprite(img, imgW, imgH, {
          shadowColor,
          shadowBlur,
          shadowShortness,
        });
        if (!cancelled) setFloorShadow(sprite);
      } catch {
        if (!cancelled) setFloorShadow(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    renderSrc,
    toggles.shadows,
    shadowMode,
    shadowColor,
    shadowBlur,
    shadowShortness,
    imgW,
    imgH,
  ]);

  // ── Reflection sprite ─────────────────────────────────────────────────
  // The mirrored image below the object, faded out. Baked from renderSrc (so it
  // reflects every adjustment/transform on the product) and anchored to the
  // product's REAL base (lowest opaque row) — not the box bottom — so gap 0 sits
  // flush against the shoe instead of leaving the empty box space as a gap.
  useEffect(() => {
    let cancelled = false;
    if (!renderSrc || !toggles.reflection || imgW == null || imgH == null) {
      setReflectionSprite(null);
      return;
    }
    (async () => {
      try {
        const img = await loadImageEl(renderSrc);
        if (cancelled) return;
        if (!cancelled)
          setReflectionSprite(makeReflectionSprite(img, imgW, imgH));
      } catch {
        if (!cancelled) setReflectionSprite(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [renderSrc, toggles.reflection, imgW, imgH]);

  // ── Undo / redo history ───────────────────────────────────────────────
  const snapKey = JSON.stringify({
    originalUrl,
    processedUrl,
    removeBg,
    brightness,
    contrast,
    saturation,
    highlights,
    shadowsAdj,
    sharpen,
    hue,
    warmth,
    adjOpacity,
    rotation,
    flipH,
    flipV,
    scale,
    tile,
    hPersp,
    vPersp,
    blurAmount,
    blurType,
    selectedFilter,
    textureType,
    textureAmount,
    shadowBlur,
    shadowOpacity,
    shadowColor,
    shadowX,
    shadowY,
    shadowMode,
    shadowShortness,
    outlineColor,
    outlineWidth,
    outlineBlur,
    reflectionOpacity,
    reflectionGap,
    reflectionX,
    reflectionAngle,
    blendMode,
    posX,
    posY,
    toggles,
    layers,
    canvasBg,
    canvasSize,
    canvasRound,
    exportSize,
    imgW,
    imgH,
    imgCrop,
    imgHidden,
  });

  useEffect(() => {
    // Skip the change we just caused by applying a history snapshot.
    if (applyingHistoryRef.current) {
      applyingHistoryRef.current = false;
      return;
    }
    clearTimeout(histTimerRef.current);
    histTimerRef.current = setTimeout(() => {
      setHistory((prev) => {
        const base = prev.slice(0, histIndexRef.current + 1);
        if (base.length && JSON.stringify(base[base.length - 1]) === snapKey)
          return prev;
        const next = [...base, JSON.parse(snapKey)];
        setHistIndex(next.length - 1);
        return next;
      });
    }, 300);
    return () => clearTimeout(histTimerRef.current);
  }, [snapKey]);

  const applySnapshot = (s) => {
    applyingHistoryRef.current = true;
    setOriginalUrl(s.originalUrl);
    setProcessedUrl(s.processedUrl);
    setRemoveBg(s.removeBg);
    setBrightness(s.brightness);
    setContrast(s.contrast);
    setSaturation(s.saturation);
    if (s.highlights !== undefined) setHighlights(s.highlights);
    if (s.shadowsAdj !== undefined) setShadowsAdj(s.shadowsAdj);
    if (s.sharpen !== undefined) setSharpen(s.sharpen);
    if (s.hue !== undefined) setHue(s.hue);
    if (s.warmth !== undefined) setWarmth(s.warmth);
    if (s.adjOpacity !== undefined) setAdjOpacity(s.adjOpacity);
    setRotation(s.rotation);
    setFlipH(s.flipH);
    if (s.flipV !== undefined) setFlipV(s.flipV);
    setScale(s.scale);
    if (s.tile !== undefined) setTile(s.tile);
    if (s.hPersp !== undefined) setHPersp(s.hPersp);
    if (s.vPersp !== undefined) setVPersp(s.vPersp);
    setBlurAmount(s.blurAmount);
    if (s.blurType !== undefined) setBlurType(s.blurType);
    if (s.textureType !== undefined) setTextureType(s.textureType);
    if (s.textureAmount !== undefined) setTextureAmount(s.textureAmount);
    setSelectedFilter(s.selectedFilter);
    setShadowBlur(s.shadowBlur);
    setShadowOpacity(s.shadowOpacity);
    if (s.shadowColor !== undefined) setShadowColor(s.shadowColor);
    if (s.shadowX !== undefined) setShadowX(s.shadowX);
    if (s.shadowY !== undefined) setShadowY(s.shadowY);
    if (s.shadowMode !== undefined) setShadowMode(s.shadowMode);
    if (s.shadowShortness !== undefined) setShadowShortness(s.shadowShortness);
    if (s.outlineColor !== undefined) setOutlineColor(s.outlineColor);
    if (s.outlineWidth !== undefined) setOutlineWidth(s.outlineWidth);
    if (s.outlineBlur !== undefined) setOutlineBlur(s.outlineBlur);
    if (s.reflectionOpacity !== undefined)
      setReflectionOpacity(s.reflectionOpacity);
    if (s.reflectionGap !== undefined) setReflectionGap(s.reflectionGap);
    if (s.reflectionX !== undefined) setReflectionX(s.reflectionX);
    if (s.reflectionAngle !== undefined) setReflectionAngle(s.reflectionAngle);
    if (s.blendMode !== undefined) setBlendMode(s.blendMode);
    setPosX(s.posX);
    setPosY(s.posY);
    setToggles({ ...s.toggles });
    setLayers(s.layers ? JSON.parse(JSON.stringify(s.layers)) : []);
    if (s.canvasBg) setCanvasBg(s.canvasBg);
    if (s.canvasSize) setCanvasSize(s.canvasSize);
    setCanvasRound(!!s.canvasRound);
    setExportSize(s.exportSize || null);
    if (s.imgW !== undefined) setImgW(s.imgW);
    if (s.imgH !== undefined) setImgH(s.imgH);
    setImgCrop(s.imgCrop || null);
    setImgHidden(!!s.imgHidden);
  };

  const canUndo = histIndex > 0;
  const canRedo = histIndex >= 0 && histIndex < history.length - 1;
  const handleUndo = () => {
    if (!canUndo) return;
    const i = histIndex - 1;
    applySnapshot(history[i]);
    setHistIndex(i);
  };
  const handleRedo = () => {
    if (!canRedo) return;
    const i = histIndex + 1;
    applySnapshot(history[i]);
    setHistIndex(i);
  };

  // ── Drag to move (powers Align) ───────────────────────────────────────
  const onImgPointerDown = (e) => {
    e.stopPropagation();
    setSelected(true);
    setSelectedLayerId(null);
    dragRef.current = { sx: e.clientX, sy: e.clientY, bx: posX, by: posY };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onImgPointerMove = (e) => {
    if (!dragRef.current) return;
    setPosX(dragRef.current.bx + (e.clientX - dragRef.current.sx));
    setPosY(dragRef.current.by + (e.clientY - dragRef.current.sy));
  };
  const onImgPointerUp = (e) => {
    dragRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  // ── Top-tool bar ──────────────────────────────────────────────────────
  const handleTopTool = (id) => {
    if (id === "insert") {
      setInsertCat(null);
      setActiveTool((t) => (t === "insert" ? null : "insert"));
      return;
    }
    if (id === "addtext") {
      setActiveTool((t) => (t === "addtext" ? null : "addtext"));
      return;
    }
    if (id === "aishadows") {
      setActiveTool(null);
      setToggles((p) => ({ ...p, shadows: true }));
      setExpandedPanel("shadows");
      return;
    }
    if (
      id === "backgrounds" ||
      id === "resize" ||
      id === "brandit" ||
      id === "templates" ||
      id === "layers"
    ) {
      setActiveTool((t) => (t === id ? null : id));
      return;
    }
    toast.info("This tool is coming soon.");
  };

  // Brand it: drop the active brand's logo as a layer.
  const addBrandLogo = () => {
    if (!activeBrand?.logo) {
      toast.info("No brand logo found. Set one in your Brand Kit.");
      return;
    }
    addImageLayer(activeBrand.logo);
  };

  // ── Brand Kit helpers ─────────────────────────────────────────────────
  const addLogosToKit = (urls) => {
    const list = (Array.isArray(urls) ? urls : [urls]).filter(Boolean);
    if (!list.length) return;
    setKit((k) => ({
      ...k,
      logos: Array.from(new Set([...(k?.logos || []), ...list])),
    }));
  };
  const removeLogoFromKit = (url) =>
    setKit((k) => ({ ...k, logos: (k?.logos || []).filter((u) => u !== url) }));

  const onKitLogoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    const t = toast.loading(
      files.length > 1 ? "Uploading logos…" : "Uploading logo…",
    );
    try {
      const urls = [];
      for (const f of files) {
        const res = await uploadMedia(f);
        const url =
          res?.url || res?.data?.url || res?.image_url || res?.data?.image_url;
        if (url) urls.push(url);
      }
      if (urls.length) {
        addLogosToKit(urls);
        toast.success("Logo added to brand kit", { id: t });
      } else toast.error("Upload failed", { id: t });
    } catch {
      toast.error("Upload failed", { id: t });
    }
  };

  // Colour clicked in the kit → text colour if a text layer is selected,
  // otherwise apply it as the canvas background.
  const applyKitColor = (c) => {
    if (selectedLayer?.type === "text") {
      updateLayer(selectedLayer.id, { color: c });
      toast.success("Text colour applied");
    } else {
      setCanvasBg({ type: "color", value: c });
      toast.success("Background applied");
    }
  };
  const addColorToPalette = (paletteId, color) => {
    if (!color) return;
    setKit((k) => ({
      ...k,
      palettes: (k?.palettes || []).map((p) =>
        p.id === paletteId
          ? { ...p, colors: Array.from(new Set([...p.colors, color])) }
          : p,
      ),
    }));
  };
  const removeColorFromPalette = (paletteId, color) =>
    setKit((k) => ({
      ...k,
      palettes: (k?.palettes || []).map((p) =>
        p.id === paletteId
          ? { ...p, colors: p.colors.filter((c) => c !== color) }
          : p,
      ),
    }));
  const addPalette = () =>
    setKit((k) => ({
      ...k,
      palettes: [
        ...(k?.palettes || []),
        { id: genId(), name: "Untitled palette", colors: [] },
      ],
    }));
  const removePalette = (paletteId) =>
    setKit((k) => ({
      ...k,
      palettes: (k?.palettes || []).filter((p) => p.id !== paletteId),
    }));

  const addFontToKit = async (family) => {
    await loadWebFont(family);
    setKit((k) => ({
      ...k,
      fonts: Array.from(new Set([...(k?.fonts || []), family])),
    }));
    toast.success(`${family} added`);
  };
  const removeFontFromKit = (family) =>
    setKit((k) => ({
      ...k,
      fonts: (k?.fonts || []).filter((f) => f !== family),
    }));

  // Apply a kit font to the selected text layer (loads the webfont first).
  const applyKitFont = async (family) => {
    if (selectedLayer?.type !== "text") {
      toast.info("Select a text layer first");
      return;
    }
    await loadWebFont(family);
    updateLayer(selectedLayer.id, { fontFamily: family });
    toast.success(`Font set to ${family}`);
  };

  // Import a brand from a URL → seed logos / palette / fonts.
  const handleKitImport = async () => {
    const url = kitUrl.trim();
    if (!url) return;
    setKitImporting(true);
    const t = toast.loading("Importing brand…");
    try {
      const result = await sendUrl(url);
      if (!result?.ok) throw new Error(result?.message || "Import failed");
      const d = result.data?.data || result.data || {};
      const logos = [
        d.logo || d.logo_url,
        ...(Array.isArray(d.images) ? d.images.slice(0, 10) : []),
      ].filter((u) => typeof u === "string" && u.startsWith("http"));
      if (logos.length) addLogosToKit(logos);
      const colors = [d.primary_color, d.secondary_color].filter(Boolean);
      if (colors.length) {
        setKit((k) => ({
          ...k,
          palettes: [
            {
              id: genId(),
              name: d.name || "Imported",
              colors: Array.from(new Set(colors)),
            },
            ...(k?.palettes || []),
          ],
        }));
      }
      toast.success("Brand imported", { id: t });
      setKitUrl("");
      setKitTab("logos");
    } catch (err) {
      toast.error(err.message || "Import failed", { id: t });
    } finally {
      setKitImporting(false);
    }
  };

  // Templates: apply a preset (sets background + adds layers).
  const applyTemplate = (tpl) => {
    if (tpl.bg) setCanvasBg(tpl.bg.type === "none" ? { type: "none" } : tpl.bg);
    setLayers((prev) => [
      ...prev,
      ...tpl.layers.map((l, i) => ({
        id: `l_${Date.now().toString(36)}_${i}`,
        rotation: 0,
        ...l,
      })),
    ]);
    setActiveTool(null);
    toast.success(`${tpl.label} template applied`);
  };

  // Photoroom-style template item → apply its bundle of editor changes.
  const applyTemplateItem = (item) => {
    const a = item.apply || {};
    if (a.bg) setCanvasBg(a.bg);
    if (a.size) setCanvasSize(a.size);
    if (a.round !== undefined) setCanvasRound(a.round);
    if (a.removeBg === false) setRemoveBg(false);
    if (a.filter !== undefined) {
      setSelectedFilter(a.filter);
      setToggles((p) => ({ ...p, filter: !!a.filter && a.filter !== "none" }));
    }
    if (a.blur !== undefined) {
      setBlurAmount(a.blur);
      setToggles((p) => ({ ...p, blur: a.blur > 0, filter: false }));
      setSelectedFilter("none");
    }
    if (a.adjust) {
      if (a.adjust.brightness != null) setBrightness(a.adjust.brightness);
      if (a.adjust.contrast != null) setContrast(a.adjust.contrast);
      if (a.adjust.saturation != null) setSaturation(a.adjust.saturation);
    }
    if (a.layers)
      setLayers((prev) => [
        ...prev,
        ...a.layers.map((l, i) => ({
          id: `${genId()}_${i}`,
          rotation: 0,
          ...l,
        })),
      ]);
    toast.success(`${item.label} applied`);
  };

  // Thumbnail background for a template card.
  const thumbBgStyle = (item) => {
    const a = item.apply || {};
    if (item.checker)
      return {
        backgroundImage:
          "linear-gradient(45deg,#ddd 25%,transparent 25%),linear-gradient(-45deg,#ddd 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ddd 75%),linear-gradient(-45deg,transparent 75%,#ddd 75%)",
        backgroundSize: "12px 12px",
        backgroundPosition: "0 0,0 6px,6px -6px,-6px 0",
        backgroundColor: "#fff",
      };
    if (a.bg?.type === "color") return { background: a.bg.value };
    if (a.bg?.type === "gradient") return { background: gradientCss(a.bg) };
    if (a.bg?.type === "image") return { backgroundColor: "#eee" };
    return { background: "#fff" };
  };
  // CSS filter applied to the product preview in a template card.
  const thumbFilter = (item) => {
    const a = item.apply || {};
    const parts = [];
    if (a.filter) parts.push(staticFilterCss(a.filter));
    if (a.blur) parts.push(`blur(${Math.max(1, a.blur / 3)}px)`);
    if (a.adjust) {
      if (a.adjust.brightness)
        parts.push(`brightness(${a.adjust.brightness}%)`);
      if (a.adjust.contrast) parts.push(`contrast(${a.adjust.contrast}%)`);
      if (a.adjust.saturation) parts.push(`saturate(${a.adjust.saturation}%)`);
    }
    return parts.join(" ") || "none";
  };
  // A single template thumbnail. `fixed` sizes it for the horizontal carousel;
  // otherwise it fills a grid cell (the See-all / search grid).
  const templateCard = (item, fixed) => (
    <button
      key={item.id}
      onClick={() => applyTemplateItem(item)}
      title={item.label}
      className={`group cursor-pointer ${fixed ? "shrink-0 w-[92px]" : ""}`}
    >
      <div
        className={`relative rounded-xl overflow-hidden border border-gray-200 group-hover:border-blue-400 flex items-center justify-center ${
          fixed ? "w-[92px] h-[92px]" : "aspect-square"
        }`}
        style={{
          ...thumbBgStyle(item),
          ...(item.apply?.round ? { borderRadius: "9999px" } : {}),
        }}
      >
        {item.apply?.bg?.type === "image" && (
          <img
            src={item.apply.bg.src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {displayImage ? (
          <img
            src={displayImage}
            alt=""
            className="relative max-w-[78%] max-h-[78%] object-contain"
            style={{ filter: thumbFilter(item) }}
          />
        ) : (
          <ImageIcon className="relative w-5 h-5 text-gray-300" />
        )}
      </div>
      <span className="block text-[10px] text-gray-500 text-center mt-1 truncate">
        {item.label}
      </span>
    </button>
  );

  // ── Resize helpers ────────────────────────────────────────────────────
  // Fit real target dims into the preview box (cap ≈ CANVAS_W) keeping ratio.
  const fitPreview = (w, h) => {
    const cap = 520;
    const r = w / h;
    return r >= 1
      ? { w: cap, h: Math.round(cap / r) }
      : { w: Math.round(cap * r), h: cap };
  };
  const pushRecent = (item) =>
    setRecentSizes((prev) => {
      const next = [
        {
          label: item.label,
          w: item.w,
          h: item.h,
          ratio: item.ratio,
          color: item.color,
        },
        ...prev.filter(
          (p) => !(p.w === item.w && p.h === item.h && p.label === item.label),
        ),
      ].slice(0, 5);
      try {
        localStorage.setItem("ck_resize_recent", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  const applyResize = (item) => {
    const p = fitPreview(item.w, item.h);
    setCanvasSize(p);
    setExportSize({ w: item.w, h: item.h });
    setCanvasRound(false);
    pushRecent(item);
    setPendingResize(null);
    setActiveTool(null);
    toast.success(`Resized to ${item.w}×${item.h}`);
  };
  const clearRecent = () => {
    setRecentSizes([]);
    try {
      localStorage.removeItem("ck_resize_recent");
    } catch {
      /* ignore */
    }
  };

  // ── Backgrounds helpers ───────────────────────────────────────────────
  const onBgFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCanvasBg({ type: "image", src: URL.createObjectURL(file) });
  };
  // ── Layers ────────────────────────────────────────────────────────────
  const genId = () =>
    `l_${Date.now().toString(36)}_${Math.round(performance.now() * 1000) % 100000}`;

  const addLayer = (layer) => {
    const id = genId();
    setLayers((prev) => [...prev, { id, rotation: 0, ...layer }]);
    setSelectedLayerId(id);
    setSelected(false); // deselect base image
  };
  const addItem = (item, { label, colorable } = {}) => {
    const defaults = {
      image: 200,
      emoji: 90,
      shape: 120,
      path: 120,
      badge: 90,
    };
    const d = defaults[item.type] || 120;
    const base = {
      type: "image",
      insertLabel: label,
      x: canvasSize.w / 2,
      y: canvasSize.h / 2,
      w: item.w || d,
      h: item.h || d,
    };
    // Real images keep their src. Vector specs are serialized to an SVG data-URL;
    // the raw spec + colorable flag ride along so the Image panel can recolor it
    // (see recolorActiveInsert). Every insert is an image layer, so any selected
    // insert gets the image toolbar + Image panel titled by its sub-group.
    if (item.type === "image") {
      addLayer({ ...base, src: item.src });
      return;
    }
    const color = colorable ? DEFAULT_INSERT_COLOR : undefined;
    const resolved = colorable ? resolveItem(item, color) : item;
    addLayer({
      ...base,
      src: specToSvgDataUrl(resolved),
      insertSpec: item,
      insertColorable: !!colorable,
      insertColor: color,
    });
  };
  const insertTextLayer = (fields = {}, { edit = false } = {}) => {
    const id = genId();
    setLayers((prev) => [
      ...prev,
      {
        id,
        type: "text",
        text: "Your text",
        color: "#111111",
        fontWeight: "700",
        align: "center",
        fontSize: 36,
        x: canvasSize.w / 2,
        y: canvasSize.h / 2,
        w: 260,
        h: 70,
        rotation: 0,
        ...fields,
      },
    ]);
    setSelectedLayerId(id);
    setSelected(false);
    if (edit) setEditingLayerId(id);
    return id;
  };
  const addText = () => insertTextLayer({}, { edit: true });
  // Add a styled preset from the Add Text panel.
  const addTextStyle = async (s) => {
    if (s.fontFamily) await loadWebFont(s.fontFamily);
    insertTextLayer({
      text: s.text,
      color: s.color,
      fontWeight: s.fontWeight,
      align: s.align || "center",
      fontSize: s.fontSize,
      fontFamily: s.fontFamily,
      bgColor: s.bgColor,
      radius: s.radius,
      w: s.w,
      h: s.h,
    });
  };
  // Add a fresh text layer pre-set to a brand-kit font.
  const addTextWithFont = async (family) => {
    await loadWebFont(family);
    insertTextLayer({ fontFamily: family }, { edit: true });
  };
  const addImageLayer = async (src) => {
    try {
      const im = await loadImageEl(src);
      const ratio = im.naturalWidth / im.naturalHeight || 1;
      const base = 200;
      const w = ratio >= 1 ? base : Math.round(base * ratio);
      const h = ratio >= 1 ? Math.round(base / ratio) : base;
      addLayer({ type: "image", src, x: CANVAS_W / 2, y: CANVAS_H / 2, w, h });
    } catch {
      toast.error("Could not load that image");
    }
  };
  const updateLayer = (id, patch) =>
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    );
  const deleteLayer = (id) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    setSelectedLayerId((s) => (s === id ? null : s));
    setEditingLayerId((s) => (s === id ? null : s));
  };
  const duplicateLayer = (id) => {
    const src = layers.find((l) => l.id === id);
    if (!src) return;
    const nid = genId();
    setLayers((prev) => [
      ...prev,
      { ...src, id: nid, x: src.x + 20, y: src.y + 20 },
    ]);
    setSelectedLayerId(nid);
  };
  const reorderLayer = (id, dir) => {
    setLayers((prev) => {
      const i = prev.findIndex((l) => l.id === id);
      if (i < 0) return prev;
      const next = [...prev];
      const [item] = next.splice(i, 1);
      if (dir === "front") next.push(item);
      else next.unshift(item);
      return next;
    });
  };

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;

  // Recolor the selected vector insert: re-resolve its stored spec with the new
  // colour and re-serialize the SVG src. Only affects colourable inserts.
  const recolorActiveInsert = (color) => {
    const l = selectedLayer;
    if (!l || l.type !== "image" || !l.insertColorable || !l.insertSpec) return;
    updateLayer(l.id, {
      src: specToSvgDataUrl(resolveItem(l.insertSpec, color)),
      insertColor: color,
    });
  };

  // ── "Active image" adapter ────────────────────────────────────────────
  // The Image panel + floating toolbar operate on whichever image is selected:
  // the base image (flat state) or a selected image layer (layer.img). This
  // adapter lets the SAME panel JSX read/write either one.
  const activeImageKind =
    selectedLayer?.type === "image"
      ? "layer"
      : selected && displayImage
        ? "base"
        : null;

  // All base effect props gathered into one object (mirrors IMG_DEFAULTS keys).
  const flatImgProps = {
    removeBg,
    brightness,
    contrast,
    saturation,
    highlights,
    shadowsAdj,
    sharpen,
    hue,
    warmth,
    adjOpacity,
    rotation,
    flipH,
    flipV,
    scale,
    tile,
    hPersp,
    vPersp,
    blurAmount,
    blurType,
    selectedFilter,
    textureType,
    textureAmount,
    shadowBlur,
    shadowOpacity,
    shadowColor,
    shadowX,
    shadowY,
    shadowMode,
    shadowShortness,
    outlineColor,
    outlineWidth,
    outlineBlur,
    reflectionOpacity,
    reflectionGap,
    reflectionX,
    reflectionAngle,
    blendMode,
    toggles,
  };

  // Props of the currently-active image. For a layer, `rotation` lives on the
  // layer itself (it drives the selection box + handles), the rest on layer.img.
  const activeImg =
    activeImageKind === "layer"
      ? {
          ...IMG_DEFAULTS,
          ...(selectedLayer.img || {}),
          rotation: selectedLayer.rotation || 0,
        }
      : flatImgProps;

  // key → flat setter (base path). `scale` resizes the box via setBaseScale.
  const IMG_SETTERS = {
    removeBg: setRemoveBg,
    brightness: setBrightness,
    contrast: setContrast,
    saturation: setSaturation,
    highlights: setHighlights,
    shadowsAdj: setShadowsAdj,
    sharpen: setSharpen,
    hue: setHue,
    warmth: setWarmth,
    adjOpacity: setAdjOpacity,
    rotation: setRotation,
    flipH: setFlipH,
    flipV: setFlipV,
    // Wrapper (not a direct ref): setBaseScale is declared later in the
    // component, so referencing it directly here would hit the temporal dead
    // zone. The arrow defers the lookup to call time.
    scale: (v) => setBaseScale(v),
    tile: setTile,
    hPersp: setHPersp,
    vPersp: setVPersp,
    blurAmount: setBlurAmount,
    blurType: setBlurType,
    selectedFilter: setSelectedFilter,
    textureType: setTextureType,
    textureAmount: setTextureAmount,
    shadowBlur: setShadowBlur,
    shadowOpacity: setShadowOpacity,
    shadowColor: setShadowColor,
    shadowX: setShadowX,
    shadowY: setShadowY,
    shadowMode: setShadowMode,
    shadowShortness: setShadowShortness,
    outlineColor: setOutlineColor,
    outlineWidth: setOutlineWidth,
    outlineBlur: setOutlineBlur,
    reflectionOpacity: setReflectionOpacity,
    reflectionGap: setReflectionGap,
    reflectionX: setReflectionX,
    reflectionAngle: setReflectionAngle,
    blendMode: setBlendMode,
    toggles: setToggles,
  };

  // Write a patch to the active image (base flat setters, or layer.img / layer).
  // The layer branch merges functionally off the latest layer state so several
  // updateActiveImg() calls in one handler (e.g. "Reset adjustments") compose
  // instead of clobbering each other from a stale render snapshot.
  const updateActiveImg = (patch) => {
    if (activeImageKind === "layer") {
      const { rotation: rot, ...imgPatch } = patch;
      const id = selectedLayer.id;
      setLayers((prev) =>
        prev.map((l) => {
          if (l.id !== id) return l;
          const next = { ...l };
          if (rot !== undefined) next.rotation = rot;
          next.img = { ...IMG_DEFAULTS, ...(l.img || {}), ...imgPatch };
          return next;
        }),
      );
    } else {
      Object.entries(patch).forEach(([k, v]) => IMG_SETTERS[k]?.(v));
    }
  };

  // ── Move Shadow: drag on the canvas to reposition the active image's
  // shadow (Shadows → Move). 2D = flat offset (drop), 3D = perspective (floor);
  // both nudge shadowX/shadowY, which the drop filter and floor sprite read.
  const [moveShadow, setMoveShadow] = useState({ open: false, mode: "2d" });
  const shadowDragRef = useRef(null);
  const onShadowMoveDown = (e) => {
    e.stopPropagation();
    shadowDragRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      bx: activeImg?.shadowX ?? 0,
      by: activeImg?.shadowY ?? 0,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onShadowMoveMove = (e) => {
    if (!shadowDragRef.current) return;
    const d = shadowDragRef.current;
    updateActiveImg({
      shadowX: Math.round(d.bx + (e.clientX - d.sx)),
      shadowY: Math.round(d.by + (e.clientY - d.sy)),
    });
  };
  const onShadowMoveUp = (e) => {
    const d = shadowDragRef.current;
    shadowDragRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    // A click (no real drag) exits Move → back to the Image panel.
    if (d && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 5)
      setMoveShadow((s) => ({ ...s, open: false }));
  };

  // ── Move Reflection: drag on the canvas to change the reflection's aspect
  // (Reflection → Move). Horizontal drag → reflectionX, vertical → reflectionGap.
  const [moveReflection, setMoveReflection] = useState({ open: false });
  const reflDragRef = useRef(null);
  const onReflMoveDown = (e) => {
    e.stopPropagation();
    reflDragRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      bx: activeImg?.reflectionX ?? 0,
      by: activeImg?.reflectionGap ?? 0,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onReflMoveMove = (e) => {
    if (!reflDragRef.current) return;
    const d = reflDragRef.current;
    updateActiveImg({
      reflectionX: Math.round(d.bx + (e.clientX - d.sx)),
      reflectionGap: Math.round(d.by + (e.clientY - d.sy)),
    });
  };
  const onReflMoveUp = (e) => {
    const d = reflDragRef.current;
    reflDragRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    // A click (no real drag) exits Move → back to the Image panel.
    if (d && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 5)
      setMoveReflection({ open: false });
  };

  // ── Move Text Shadow: drag on the canvas to reposition the selected text
  // layer's shadow (text Shadows → Move). Nudges shadowX/shadowY, which
  // buildTextShadow reads. A click (no drag) exits Move → back to the panel.
  const [moveTextShadow, setMoveTextShadow] = useState({
    open: false,
    mode: "2d",
  });
  const textShadowDragRef = useRef(null);
  const onTextShadowMoveDown = (e) => {
    e.stopPropagation();
    textShadowDragRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      bx: selectedLayer?.shadowX ?? 0,
      by: selectedLayer?.shadowY ?? 0,
      id: selectedLayerId,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onTextShadowMoveMove = (e) => {
    const d = textShadowDragRef.current;
    if (!d) return;
    updateLayer(d.id, {
      shadowX: Math.round(d.bx + (e.clientX - d.sx)),
      shadowY: Math.round(d.by + (e.clientY - d.sy)),
    });
  };
  const onTextShadowMoveUp = (e) => {
    const d = textShadowDragRef.current;
    textShadowDragRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (d && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 5)
      setMoveTextShadow((s) => ({ ...s, open: false }));
  };

  // ── Move Text Reflection: drag on the canvas to change the reflection's
  // aspect (text Reflection → Move). Horizontal → reflectionX, vertical → gap.
  const [moveTextReflection, setMoveTextReflection] = useState({ open: false });
  const textReflDragRef = useRef(null);
  const onTextReflMoveDown = (e) => {
    e.stopPropagation();
    textReflDragRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      bx: selectedLayer?.reflectionX ?? 0,
      by: selectedLayer?.reflectionGap ?? 0,
      id: selectedLayerId,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onTextReflMoveMove = (e) => {
    const d = textReflDragRef.current;
    if (!d) return;
    updateLayer(d.id, {
      reflectionX: Math.round(d.bx + (e.clientX - d.sx)),
      reflectionGap: Math.round(d.by + (e.clientY - d.sy)),
    });
  };
  const onTextReflMoveUp = (e) => {
    const d = textReflDragRef.current;
    textReflDragRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (d && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 5)
      setMoveTextReflection({ open: false });
  };

  // Apply a Style preset to the currently-selected text layer (from TextPanel).
  const applyTextStyle = async (s) => {
    if (!selectedLayer || selectedLayer.type !== "text") return;
    if (s.fontFamily) await loadWebFont(s.fontFamily);
    updateLayer(selectedLayer.id, {
      color: s.color,
      fontWeight: s.fontWeight,
      align: s.align || selectedLayer.align,
      fontSize: s.fontSize,
      fontFamily: s.fontFamily,
      bgColor: s.bgColor,
      radius: s.radius,
    });
  };

  // Only Phase-1 CSS-expressible effects apply live to an image layer. The rest
  // (blur, texture, tile, perspective, highlights, reflection, floor shadow,
  // remove-bg, cutout) bake/composite at export — Phase 2. This flags a control
  // that won't visibly change a layer yet, so it can show an "on export" hint.
  const layerDeferredEffects = activeImageKind === "layer";

  // Thumbnail source + presence for the panel header / enable-disable checks.
  const activeSrc =
    activeImageKind === "layer" ? selectedLayer.src : originalUrl;
  const hasActiveImage =
    activeImageKind === "layer" ? true : !!displayImage;

  // "Align to canvas" — base nudges its offset to 0; a layer snaps to centre.
  const alignActiveCenter = () => {
    if (activeImageKind === "layer")
      updateLayer(selectedLayer.id, { x: canvasSize.w / 2 });
    else setPosX(0);
  };
  const alignActiveMiddle = () => {
    if (activeImageKind === "layer")
      updateLayer(selectedLayer.id, { y: canvasSize.h / 2 });
    else setPosY(0);
  };

  // Geometry of the active image in preview px (for the floating toolbar).
  const activeImgGeom = () => {
    if (activeImageKind === "layer") {
      return {
        left: selectedLayer.x - selectedLayer.w / 2,
        top: selectedLayer.y - selectedLayer.h / 2,
        w: selectedLayer.w,
        h: selectedLayer.h,
      };
    }
    return {
      left: canvasSize.w / 2 + posX - imgW / 2,
      top: canvasSize.h / 2 + posY - imgH / 2,
      w: imgW,
      h: imgH,
    };
  };

  // ── Per-layer render cache ────────────────────────────────────────────
  // Image layers preview/export through the same pipeline as the base image:
  // pixel-level effects (Adjust, blur, texture, tile/perspective) baked into a
  // PNG, plus the floor-shadow and reflection SPRITES. We cache one entry per
  // layer, keyed by everything that affects those outputs, and recompute
  // (debounced) only when the key changes. bakedVersion bumps to re-render once
  // a fresh result lands. Entry: { key, url, floor, reflection }.
  const bakedCacheRef = useRef(new Map());
  const [bakedVersion, setBakedVersion] = useState(0);

  const layerNeedsFloor = (p) =>
    !!(p.toggles?.shadows && p.shadowMode === "floor");
  const layerNeedsRefl = (p) => !!p.toggles?.reflection;

  const bakedKey = (l) => {
    const p = { ...IMG_DEFAULTS, ...(l.img || {}) };
    return JSON.stringify({
      src: l.src,
      w: Math.round(l.w),
      h: Math.round(l.h),
      b: p.brightness,
      c: p.contrast,
      s: p.saturation,
      hl: p.highlights,
      sa: p.shadowsAdj,
      sh: p.sharpen,
      hu: p.hue,
      wa: p.warmth,
      ti: p.tile,
      hp: p.hPersp,
      vp: p.vPersp,
      bl: p.toggles?.blur ? [p.blurType, p.blurAmount] : 0,
      tx: p.toggles?.texture ? [p.textureType, p.textureAmount] : 0,
      fl: layerNeedsFloor(p)
        ? [p.shadowColor, p.shadowBlur, p.shadowShortness]
        : 0,
      rf: layerNeedsRefl(p) ? 1 : 0,
    });
  };

  const cacheEntryFor = (l) => {
    const cur = bakedCacheRef.current.get(l.id);
    return cur && cur.key === bakedKey(l) ? cur : null;
  };
  // Baked src for a layer's preview (falls back to the raw src until ready).
  const bakedSrcFor = (l) => {
    const p = { ...IMG_DEFAULTS, ...(l.img || {}) };
    if (!layerNeedsBake(p)) return l.src;
    return cacheEntryFor(l)?.url || l.src;
  };
  const layerFloorFor = (l) => cacheEntryFor(l)?.floor || null;
  const layerReflectionFor = (l) => cacheEntryFor(l)?.reflection || null;

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      const cache = bakedCacheRef.current;
      const liveIds = new Set();
      let changed = false;
      for (const l of layers) {
        if (l.type !== "image") continue;
        liveIds.add(l.id);
        const p = { ...IMG_DEFAULTS, ...(l.img || {}) };
        const cur = cache.get(l.id);
        const needsBake = layerNeedsBake(p);
        const needsFloor = layerNeedsFloor(p);
        const needsRefl = layerNeedsRefl(p);
        if (!needsBake && !needsFloor && !needsRefl) {
          if (cur) {
            cache.delete(l.id);
            changed = true;
          }
          continue;
        }
        const key = bakedKey(l);
        if (cur && cur.key === key) continue;
        const url = needsBake ? await computeRenderSrc(l.src, p) : l.src;
        if (cancelled) return;
        let floor = null,
          reflection = null;
        if (needsFloor || needsRefl) {
          const im = await loadImageEl(url);
          if (cancelled) return;
          if (needsFloor) floor = makeFloorShadowSprite(im, l.w, l.h, p);
          if (needsRefl) reflection = makeReflectionSprite(im, l.w, l.h);
        }
        cache.set(l.id, { key, url: needsBake ? url : null, floor, reflection });
        changed = true;
      }
      // Drop cache entries for removed layers.
      for (const id of cache.keys())
        if (!liveIds.has(id)) {
          cache.delete(id);
          changed = true;
        }
      if (changed && !cancelled) setBakedVersion((v) => v + 1);
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [layers]);

  // Drag a layer (pointer events on its box)
  const onLayerPointerDown = (e, layer) => {
    e.stopPropagation();
    setSelectedLayerId(layer.id);
    setSelected(false);
    // Selecting an image or text layer closes any open tool panel (Insert, Add
    // Text, etc.) so its editing panel appears right away — even on a drag.
    if (layer.type === "image" || layer.type === "text") setActiveTool(null);
    // While a text layer is being edited, let clicks reach the editor (no drag).
    if (editingLayerId === layer.id) return;
    layerDragRef.current = {
      id: layer.id,
      mode: "move",
      sx: e.clientX,
      sy: e.clientY,
      bx: layer.x,
      by: layer.y,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onLayerPointerMove = (e) => {
    const d = layerDragRef.current;
    if (!d || d.mode !== "move") return;
    updateLayer(d.id, {
      x: d.bx + (e.clientX - d.sx),
      y: d.by + (e.clientY - d.sy),
    });
  };
  const onLayerPointerUp = (e) => {
    layerDragRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  // ── Rotate handle (base image + every layer) ──────────────────────────
  // Drag the ⟳ handle around the object's centre to rotate it. The centre is
  // captured from the selection box's bounding rect at pointer-down (rotation is
  // about centre, so it stays put). Writes rotation state → the Position angle
  // stays in sync automatically.
  const rotateRef = useRef(null);
  const onRotateDown = (e, kind, id) => {
    e.stopPropagation();
    const box = e.currentTarget.parentElement;
    const r = box.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const startAngle =
      (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
    const startRot =
      kind === "base" ? rotation : layers.find((l) => l.id === id)?.rotation || 0;
    rotateRef.current = { kind, id, cx, cy, startAngle, startRot };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onRotateMove = (e) => {
    const d = rotateRef.current;
    if (!d) return;
    const a = (Math.atan2(e.clientY - d.cy, e.clientX - d.cx) * 180) / Math.PI;
    let rot = Math.round(d.startRot + (a - d.startAngle));
    rot = (((rot + 180) % 360) + 360) % 360 - 180; // normalize to -180..180
    if (d.kind === "base") setRotation(rot);
    else updateLayer(d.id, { rotation: rot });
  };
  const onRotateUp = (e) => {
    rotateRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };
  // ── Shared 8-direction resize geometry ────────────────────────────────
  // k ∈ tl,tc,tr,ml,mr,bl,bc,br. start={w,h,cx,cy}. Corners keep aspect when
  // lockAspect; edges stretch a single axis. Opposite edge/corner stays put.
  const HANDLES = ["tl", "tc", "tr", "ml", "mr", "bl", "bc", "br"];
  const handleCursor = (k) =>
    k === "tl" || k === "br"
      ? "nwse-resize"
      : k === "tr" || k === "bl"
        ? "nesw-resize"
        : k === "tc" || k === "bc"
          ? "ns-resize"
          : "ew-resize";
  const geomResize = (k, dx, dy, start, lockAspect) => {
    const hr = k.includes("l") ? -1 : k.includes("r") ? 1 : 0;
    const vr = k.includes("t") ? -1 : k.includes("b") ? 1 : 0;
    let w = start.w,
      h = start.h;
    if (hr && vr && lockAspect) {
      const fw = (start.w + hr * dx) / start.w;
      const fh = (start.h + vr * dy) / start.h;
      const f = Math.max(0.05, (fw + fh) / 2);
      w = Math.max(20, start.w * f);
      h = Math.max(20, start.h * f);
    } else {
      if (hr) w = Math.max(20, start.w + hr * dx);
      if (vr) h = Math.max(20, start.h + vr * dy);
    }
    return {
      w,
      h,
      cx: start.cx + (hr * (w - start.w)) / 2,
      cy: start.cy + (vr * (h - start.h)) / 2,
    };
  };

  // ── Base image resize ─────────────────────────────────────────────────
  const onImageLoad = (e) => {
    if (imgW != null && imgH != null) return; // already sized
    const nat = {
      w: e.target.naturalWidth || 1,
      h: e.target.naturalHeight || 1,
    };
    // Canvas takes the image's own aspect ratio (capped to the preview box) and
    // the image fills it — the opened image IS the canvas.
    const box = fitPreview(nat.w, nat.h);
    setCanvasSize(box);
    setExportSize({ w: nat.w, h: nat.h }); // export at the image's native resolution
    imgFitRef.current = { w: box.w, h: box.h };
    setImgW(box.w);
    setImgH(box.h);
    setImgCrop(null);
    setPosX(0);
    setPosY(0);
    setScale(100);
  };
  const onImgResizeDown = (e, k) => {
    e.stopPropagation();
    setSelected(true);
    const c0 = imgCrop || { cw: imgW, ch: imgH, cx: 0, cy: 0 };
    imgResizeRef.current = {
      k,
      sx: e.clientX,
      sy: e.clientY,
      w0: imgW,
      h0: imgH,
      cx0: canvasSize.w / 2 + posX,
      cy0: canvasSize.h / 2 + posY,
      cw0: c0.cw,
      ch0: c0.ch,
      crx0: c0.cx,
      cry0: c0.cy,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onImgResizeMove = (e) => {
    const d = imgResizeRef.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    const hasH = d.k.includes("l") || d.k.includes("r");
    const hasV = d.k.includes("t") || d.k.includes("b");
    // Corner → proportional scale of box + content.
    if (hasH && hasV) {
      const r = geomResize(
        d.k,
        dx,
        dy,
        { w: d.w0, h: d.h0, cx: d.cx0, cy: d.cy0 },
        true,
      );
      const f = d.w0 ? r.w / d.w0 : 1;
      setImgW(r.w);
      setImgH(r.h);
      setPosX(r.cx - canvasSize.w / 2);
      setPosY(r.cy - canvasSize.h / 2);
      setImgCrop({
        cw: d.cw0 * f,
        ch: d.ch0 * f,
        cx: d.crx0 * f,
        cy: d.cry0 * f,
      });
      if (imgFitRef.current.w)
        setScale(Math.round((r.w / imgFitRef.current.w) * 100));
      return;
    }
    // Side → crop: move the box edge, shift content so it stays put; clamp so the
    // box can't reveal past the image.
    let w = d.w0;
    let h = d.h0;
    let cx = d.cx0;
    let cy = d.cy0;
    let cropX = d.crx0;
    let cropY = d.cry0;
    const hr = d.k.includes("l") ? -1 : d.k.includes("r") ? 1 : 0;
    const vr = d.k.includes("t") ? -1 : d.k.includes("b") ? 1 : 0;
    if (hr) {
      w = Math.min(d.cw0, Math.max(20, d.w0 + hr * dx));
      cx = d.cx0 + (hr * (w - d.w0)) / 2;
      cropX = d.crx0 + (d.cx0 - d.w0 / 2 - (cx - w / 2));
      cropX = Math.min(0, Math.max(w - d.cw0, cropX));
    }
    if (vr) {
      h = Math.min(d.ch0, Math.max(20, d.h0 + vr * dy));
      cy = d.cy0 + (vr * (h - d.h0)) / 2;
      cropY = d.cry0 + (d.cy0 - d.h0 / 2 - (cy - h / 2));
      cropY = Math.min(0, Math.max(h - d.ch0, cropY));
    }
    setImgW(w);
    setImgH(h);
    setPosX(cx - canvasSize.w / 2);
    setPosY(cy - canvasSize.h / 2);
    setImgCrop({ cw: d.cw0, ch: d.ch0, cx: cropX, cy: cropY });
  };
  const onImgResizeUp = (e) => {
    imgResizeRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  // Scale slider → uniform-scale the base box from its fitted size. Clears any
  // crop (the slider re-fits the whole image).
  const setBaseScale = (v) => {
    setScale(v);
    if (imgFitRef.current.w) {
      setImgW((imgFitRef.current.w * v) / 100);
      setImgH((imgFitRef.current.h * v) / 100);
      setImgCrop(null);
    }
  };

  // ── Layer resize (8 handles) ──────────────────────────────────────────
  const onResizePointerDown = (e, layer, k = "br") => {
    e.stopPropagation();
    layerDragRef.current = {
      id: layer.id,
      mode: "resize",
      k,
      sx: e.clientX,
      sy: e.clientY,
      w0: layer.w,
      h0: layer.h,
      cx0: layer.x,
      cy0: layer.y,
      fs0: layer.fontSize,
      // Crop window start (image layers): content size + its offset in the box.
      cw0: layer.cropW ?? layer.w,
      ch0: layer.cropH ?? layer.h,
      crx0: layer.cropX ?? 0,
      cry0: layer.cropY ?? 0,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onResizePointerMove = (e) => {
    const d = layerDragRef.current;
    if (!d || d.mode !== "resize") return;
    const layer = layers.find((l) => l.id === d.id);
    if (!layer) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;

    // Image layers: corner handles SCALE (box + content together, aspect-locked);
    // side handles CROP (box edge moves, content stays put — a window onto the
    // image). Content always keeps the image's aspect, so it never distorts.
    if (layer.type === "image") {
      const hasH = d.k.includes("l") || d.k.includes("r");
      const hasV = d.k.includes("t") || d.k.includes("b");
      if (hasH && hasV) {
        const r = geomResize(
          d.k,
          dx,
          dy,
          { w: d.w0, h: d.h0, cx: d.cx0, cy: d.cy0 },
          true,
        );
        const f = d.w0 ? r.w / d.w0 : 1;
        updateLayer(d.id, {
          w: r.w,
          h: r.h,
          x: r.cx,
          y: r.cy,
          cropW: d.cw0 * f,
          cropH: d.ch0 * f,
          cropX: d.crx0 * f,
          cropY: d.cry0 * f,
        });
        return;
      }
      // Side crop.
      let w = d.w0;
      let h = d.h0;
      let cx = d.cx0;
      let cy = d.cy0;
      let cropX = d.crx0;
      let cropY = d.cry0;
      const hr = d.k.includes("l") ? -1 : d.k.includes("r") ? 1 : 0;
      const vr = d.k.includes("t") ? -1 : d.k.includes("b") ? 1 : 0;
      if (hr) {
        // Box can't exceed the content width (no empty reveal past the image).
        w = Math.min(d.cw0, Math.max(20, d.w0 + hr * dx));
        cx = d.cx0 + (hr * (w - d.w0)) / 2;
        cropX = d.crx0 + (d.cx0 - d.w0 / 2 - (cx - w / 2));
        cropX = Math.min(0, Math.max(w - d.cw0, cropX));
      }
      if (vr) {
        h = Math.min(d.ch0, Math.max(20, d.h0 + vr * dy));
        cy = d.cy0 + (vr * (h - d.h0)) / 2;
        cropY = d.cry0 + (d.cy0 - d.h0 / 2 - (cy - h / 2));
        cropY = Math.min(0, Math.max(h - d.ch0, cropY));
      }
      updateLayer(d.id, {
        w,
        h,
        x: cx,
        y: cy,
        cropX,
        cropY,
        cropW: d.cw0,
        cropH: d.ch0,
      });
      return;
    }

    // Text / other layers: plain resize (corner scales the font).
    const lock = layer.type !== "text" && layer.type !== "shape";
    const r = geomResize(
      d.k,
      dx,
      dy,
      { w: d.w0, h: d.h0, cx: d.cx0, cy: d.cy0 },
      lock,
    );
    const patch = { w: r.w, h: r.h, x: r.cx, y: r.cy };
    if (layer.type === "text" && d.fs0 && d.k.length === 2)
      patch.fontSize = Math.max(8, Math.round(d.fs0 * (r.w / d.w0)));
    updateLayer(d.id, patch);
  };

  // Reorder a layer up/down one step (z-order) for the Layers panel.
  const moveLayer = (id, dir) => {
    setLayers((prev) => {
      const i = prev.findIndex((l) => l.id === id);
      if (i < 0) return prev;
      const j = dir === "up" ? i + 1 : i - 1;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };
  const toggleLayerHidden = (id) =>
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, hidden: !l.hidden } : l)),
    );

  const handleInsertFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    addImageLayer(URL.createObjectURL(file));
    e.target.value = "";
  };

  // Replace the currently-selected image layer's source (keeps its effects/box).
  const handleLayerReplace = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || selectedLayer?.type !== "image") return;
    updateLayer(selectedLayer.id, { src: URL.createObjectURL(file) });
  };

  // ── Share ─────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!displayImage) {
      toast.error("Add an image first");
      return;
    }
    try {
      const blob = await exportBlob();
      if (!blob) throw new Error("Export failed");
      const file = new File([blob], "product-studio.png", {
        type: "image/png",
      });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Product photo" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "product-studio.png";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast.info("Sharing not supported here — downloaded instead.");
      }
    } catch (err) {
      if (err?.name === "AbortError") return; // user dismissed the share sheet
      console.error("Share error:", err);
      toast.error("Could not share image");
    }
  };

  useEffect(() => {
    if (!initialImageUrl) {
      // Clear the timer on cleanup so React StrictMode's double-mount in dev
      // doesn't fire .click() twice (which reopens the picker after the first pick).
      const t = setTimeout(() => fileInputRef.current?.click(), 100);
      return () => clearTimeout(t);
    }
  }, []);

  // ── Edit Cutout (brush eraser) ────────────────────────────────────────
  const openCutout = () => {
    const isLayer = activeImageKind === "layer";
    const src = isLayer ? selectedLayer.src : displayImage;
    if (!src) {
      toast.error("Add an image first");
      return;
    }
    setCutoutTarget(isLayer ? selectedLayer.id : null);
    setCutoutOpen(true);
  };
  const drawCutoutBase = async () => {
    try {
      const tLayer = cutoutTarget
        ? layers.find((l) => l.id === cutoutTarget)
        : null;
      const src = tLayer ? tLayer.src : displayImage;
      const img = await loadImageEl(src);
      const cv = cutoutCanvasRef.current;
      if (!cv) return;
      const cap = 1600;
      let w = img.naturalWidth || img.width,
        h = img.naturalHeight || img.height;
      if (Math.max(w, h) > cap) {
        const r = cap / Math.max(w, h);
        w = Math.round(w * r);
        h = Math.round(h * r);
      }
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext("2d");
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
    } catch {
      toast.error("Could not load image for editing");
    }
  };
  useEffect(() => {
    if (cutoutOpen) drawCutoutBase();
  }, [cutoutOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const eraseAt = (e) => {
    const cv = cutoutCanvasRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const sx = cv.width / rect.width;
    const x = (e.clientX - rect.left) * sx;
    const y = (e.clientY - rect.top) * (cv.height / rect.height);
    const ctx = cv.getContext("2d");
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, (brushSize * sx) / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  };
  const applyCutout = () => {
    const cv = cutoutCanvasRef.current;
    if (!cv) return;
    cv.toBlob((blob) => {
      if (!blob) {
        toast.error("Could not apply");
        return;
      }
      const url = URL.createObjectURL(blob);
      if (cutoutTarget) {
        // Image layer: the erased PNG becomes its new src (keep the original so
        // Remove-background can still restore it).
        setLayers((prev) =>
          prev.map((l) =>
            l.id === cutoutTarget
              ? { ...l, src: url, _origSrc: l._origSrc || l.src }
              : l,
          ),
        );
      } else {
        setProcessedUrl(url);
        setRemoveBg(true);
      }
      setCutoutOpen(false);
      toast.success("Cutout updated");
    }, "image/png");
  };

  // Delete/Backspace removes the selected overlay layer (not while typing).
  useEffect(() => {
    const onKey = (e) => {
      if (!selectedLayerId) return;
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable)
        return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteLayer(selectedLayerId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedLayerId]);

  // Free the on-device segmentation worker + model session when the editor
  // closes, so no AI RAM is held while it's not in use.
  useEffect(
    () => () => {
      disposeSegmentationWorker();
    },
    [],
  );

  // Core background removal via the on-device AI engine (ONNX U²-Net in a Web
  // Worker, WebGPU→WASM, cached model). Accepts a File/Blob or an image URL.
  const runBgRemoval = async (imageSource) => {
    setProcessing(true);
    setProcessingProgress(0);
    try {
      const { blob } = await engineRemoveBackground(imageSource, {
        onProgress: ({ pct }) => setProcessingProgress(pct || 0),
      });
      const resultUrl = URL.createObjectURL(blob);
      setProcessedUrl(resultUrl);
      setRemoveBg(true);
      toast.success("Background removed!");
    } catch (err) {
      console.error("Background removal error:", err);
      toast.error("Background removal failed");
    } finally {
      setProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    setProcessedUrl(null);
    setRemoveBg(false);
    setSubjectRemoved(false);
    setSelected(true);
    setImgW(null);
    setImgH(null); // refit the new image to its own ratio
    setPosX(0);
    setPosY(0);
    setScale(100);

    // Every opened image gets its background removed first.
    await runBgRemoval(url);
  };

  // Delete the subject: keep the (image-sized) canvas as a transparent surface
  // and drop the selection so the Background panel shows.
  const handleDeleteImage = () => {
    setOriginalUrl(null);
    setProcessedUrl(null);
    setSelected(false);
    setRemoveBg(false);
    setImgW(null);
    setImgH(null);
    setSubjectRemoved(true);
    setCanvasBg({ type: "none" });
    setActiveTool(null);
  };

  // Auto-remove the background of the image the editor opened with
  // (initialImageUrl), so an opened image always lands as a clean cutout.
  // Ref-guarded so React StrictMode's double-mount doesn't run it twice.
  const didAutoRemoveRef = useRef(false);
  useEffect(() => {
    if (initialImageUrl && !didAutoRemoveRef.current) {
      didAutoRemoveRef.current = true;
      runBgRemoval(initialImageUrl);
    }
    // Mount-only: acts on the image the editor was opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Background removal for a selected image LAYER. Removing bg replaces the
  // layer's src with the cutout PNG and remembers the original so toggling off
  // restores it. (Base-image bg-removal uses runBgRemoval + processedUrl.)
  const runLayerBgRemoval = async (layer) => {
    const orig = layer._origSrc || layer.src;
    const tId = toast.loading("Removing background…");
    try {
      const { blob } = await engineRemoveBackground(orig, {});
      const url = URL.createObjectURL(blob);
      setLayers((prev) =>
        prev.map((l) =>
          l.id === layer.id
            ? {
                ...l,
                src: url,
                _origSrc: orig,
                img: { ...IMG_DEFAULTS, ...(l.img || {}), removeBg: true },
              }
            : l,
        ),
      );
      toast.success("Background removed!", { id: tId });
    } catch (err) {
      console.error("Layer background removal error:", err);
      toast.error("Background removal failed", { id: tId });
    }
  };

  const handleRemoveBgToggle = async (val) => {
    // Image layer: work on the layer, not the base image.
    if (activeImageKind === "layer") {
      const layer = selectedLayer;
      if (val) {
        await runLayerBgRemoval(layer);
      } else {
        setLayers((prev) =>
          prev.map((l) =>
            l.id === layer.id
              ? {
                  ...l,
                  src: l._origSrc || l.src,
                  img: { ...IMG_DEFAULTS, ...(l.img || {}), removeBg: false },
                }
              : l,
          ),
        );
      }
      return;
    }
    if (val && originalUrl) {
      await runBgRemoval(originalUrl);
    } else {
      setProcessedUrl(null);
      setRemoveBg(false);
    }
  };

  const handleAiApply = async () => {
    if (!aiPrompt.trim() || !displayImage) return;
    // AI image editing needs a backend generation endpoint that isn't wired up yet.
    toast.info("AI editing is coming soon — not available yet.");
  };

  // Composite the image + every active edit (filters, adjust, transform, flip,
  // blur, shadow, outline) onto a canvas and return a PNG blob. Keeps the
  // cut-out transparency when "Remove background" is on.
  // makeSilhouetteCanvas / makeFloorShadowSprite / makeReflectionSprite now live
  // at module scope (shared with the per-layer sprite pipeline).

  const renderToCanvas = async (format = "png") => {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = proxiedSrc(renderSrc);
    });

    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const s = scale / 100;
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));

    // Bounding box of the scaled + rotated image, plus padding for shadow/outline.
    const ew = w * s;
    const eh = h * s;
    const bw = ew * cos + eh * sin;
    const bh = ew * sin + eh * cos;
    const shadowPad = toggles.shadows ? shadowBlur * 3 + 10 : 0;
    const outlinePad = toggles.outline ? 12 : 0;
    const pad = Math.max(shadowPad, outlinePad, 2);

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(bw + pad * 2);
    canvas.height = Math.ceil(bh + pad * 2);
    const ctx = canvas.getContext("2d");

    // JPEG has no alpha — paint a white matte first so the cut-out's transparent
    // pixels don't encode as black. (PNG keeps transparency.)
    if (format === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rad);
    ctx.scale(flipH ? -s : s, flipV ? -s : s);

    // Soft DROP shadow (follows the alpha silhouette). Floor mode is handled by
    // the frame exporter (renderFrameToCanvas), so this path only sees drop mode.
    if (toggles.shadows && shadowMode === "drop") {
      ctx.save();
      ctx.shadowColor = hexToRgba(shadowColor, shadowOpacity / 100);
      ctx.shadowBlur = shadowBlur * 2;
      ctx.shadowOffsetX = shadowX;
      ctx.shadowOffsetY = shadowY;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    }

    // Outline — silhouette halo hugging the cut-out (matches the preview's
    // drop-shadow outline), not a rectangle around the image bounds.
    if (toggles.outline) {
      const sil = makeSilhouetteCanvas(img, w, h, outlineColor);
      const r = outlineWidth / s; // outline width in image space (ctx is scaled by s)
      ctx.save();
      if (outlineBlur > 0) ctx.filter = `blur(${outlineBlur / s}px)`;
      for (const [dx, dy] of OUTLINE_DIRS) {
        ctx.drawImage(sil, -w / 2 + dx * r, -h / 2 + dy * r, w, h);
      }
      ctx.restore();
    }

    // The image itself, with the same CSS filter string used for preview.
    ctx.filter = imageFilter || "none";
    ctx.globalAlpha = adjOpacity / 100;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.globalAlpha = 1;

    const mime = format === "jpeg" ? "image/jpeg" : "image/png";
    return await new Promise((resolve) => canvas.toBlob(resolve, mime, 0.92));
  };

  // Draw an image layer's floor-shadow + reflection sprites (export), mirroring
  // the base image's sprite draw. Positioned in canvas (preview-px × sc) space.
  const drawLayerSprites = async (ctx, layer, sc) => {
    const p = { ...IMG_DEFAULTS, ...(layer.img || {}) };
    const needsFloor = layerNeedsFloor(p);
    const needsRefl = layerNeedsRefl(p);
    if (!needsFloor && !needsRefl) return;
    const rSrc = layerNeedsBake(p)
      ? await computeRenderSrc(layer.src, p)
      : layer.src;
    const im = await loadImageEl(rSrc);
    const left0 = layer.x - layer.w / 2;
    const top0 = layer.y - layer.h / 2;
    if (needsFloor) {
      const sprite = makeFloorShadowSprite(im, layer.w, layer.h, p);
      const sh = await loadImageEl(sprite.url);
      ctx.save();
      ctx.globalAlpha = p.shadowOpacity / 100;
      ctx.drawImage(
        sh,
        (left0 - sprite.pad + p.shadowX) * sc,
        (top0 + layer.h - sprite.pad + p.shadowY) * sc,
        sprite.spriteW * sc,
        sprite.spriteH * sc,
      );
      ctx.restore();
    }
    if (needsRefl) {
      const sprite = makeReflectionSprite(im, layer.w, layer.h);
      const rf = await loadImageEl(sprite.url);
      const left = (left0 + p.reflectionX) * sc;
      const top = (top0 + sprite.topFrac * layer.h + p.reflectionGap) * sc;
      const rw = layer.w * sc,
        rh = sprite.heightFrac * layer.h * sc;
      ctx.save();
      ctx.globalAlpha = p.reflectionOpacity / 100;
      ctx.translate(left + rw / 2, top);
      ctx.scale(p.flipH ? -1 : 1, 1);
      ctx.rotate(((-(layer.rotation || 0) + p.reflectionAngle) * Math.PI) / 180);
      ctx.drawImage(rf, -rw / 2, 0, rw, rh);
      ctx.restore();
    }
  };

  // Draw a single overlay layer onto a canvas context (export). `sc` = export scale.
  const drawLayer = async (ctx, layer, sc) => {
    ctx.save();
    ctx.translate(layer.x * sc, layer.y * sc);
    ctx.rotate(((layer.rotation || 0) * Math.PI) / 180);
    const w = layer.w * sc,
      h = layer.h * sc;
    if (layer.type === "image") {
      // Match the base image's export path: bake pixel effects, then apply the
      // CSS-equivalent effects on the canvas (flip, scale, drop shadow, outline,
      // filter preset, opacity, blend). Rotation is already applied on ctx above.
      const li = { ...IMG_DEFAULTS, ...(layer.img || {}) };
      const rSrc = layerNeedsBake(li)
        ? await computeRenderSrc(layer.src, li)
        : layer.src;
      const im = await loadImageEl(rSrc);
      const s = (li.scale ?? 100) / 100;
      ctx.scale(li.flipH ? -1 : 1, li.flipV ? -1 : 1);
      // Crop window: the visible box (w×h) clips the content, drawn at
      // cropW×cropH offset by cropX/cropY (defaults to filling the box).
      const cropW = (layer.cropW ?? layer.w) * sc;
      const cropH = (layer.cropH ?? layer.h) * sc;
      const cropX = (layer.cropX ?? 0) * sc;
      const cropY = (layer.cropY ?? 0) * sc;
      const cLeft = (-w / 2 + cropX) * s;
      const cTop = (-h / 2 + cropY) * s;
      const cWd = cropW * s;
      const cHd = cropH * s;
      // Soft drop shadow (silhouette-following), like the base image. Drawn
      // unclipped so the shadow can extend past the crop box.
      if (li.toggles?.shadows && li.shadowMode === "drop") {
        ctx.save();
        ctx.shadowColor = hexToRgba(li.shadowColor, li.shadowOpacity / 100);
        ctx.shadowBlur = li.shadowBlur * 2 * sc;
        ctx.shadowOffsetX = li.shadowX * sc;
        ctx.shadowOffsetY = li.shadowY * sc;
        ctx.drawImage(im, cLeft, cTop, cWd, cHd);
        ctx.restore();
      }
      // Outline halo hugging the cut-out.
      if (li.toggles?.outline) {
        const sil = makeSilhouetteCanvas(im, cWd, cHd, li.outlineColor);
        const r = li.outlineWidth * sc;
        ctx.save();
        if (li.outlineBlur > 0) ctx.filter = `blur(${li.outlineBlur * sc}px)`;
        for (const [dx, dy] of OUTLINE_DIRS)
          ctx.drawImage(sil, cLeft + dx * r, cTop + dy * r, cWd, cHd);
        ctx.restore();
      }
      ctx.filter =
        (li.toggles?.filter ? filterCss(li.selectedFilter) : "") || "none";
      ctx.globalAlpha = (li.adjOpacity ?? 100) / 100;
      ctx.globalCompositeOperation =
        li.blendMode === "normal" ? "source-over" : li.blendMode;
      // Clip to the visible box, then draw the (possibly larger) content.
      ctx.save();
      ctx.beginPath();
      ctx.rect(-w / 2, -h / 2, w, h);
      ctx.clip();
      ctx.drawImage(im, cLeft, cTop, cWd, cHd);
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    } else if (layer.type === "emoji") {
      ctx.font = `${h * 0.78}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(layer.emoji, 0, h * 0.04);
    } else if (layer.type === "badge") {
      ctx.fillStyle = layer.fill || "#111827";
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = layer.textColor || "#fff";
      const fs = ((layer.text.length > 3 ? 22 : 30) / 100) * h;
      ctx.font = `700 ${fs}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(layer.text, 0, h * 0.03);
    } else if (layer.type === "text") {
      const fs = (layer.fontSize || 36) * sc;
      const fam = layer.fontFamily ? `'${layer.fontFamily}', ` : "";
      if (layer.fontFamily) {
        try {
          await document.fonts.load(
            `${layer.fontWeight || 700} ${fs}px '${layer.fontFamily}'`,
          );
        } catch {
          /* ignore */
        }
      }
      ctx.font = `${layer.fontWeight || 700} ${fs}px ${fam}'DM Sans', system-ui, sans-serif`;
      ctx.textBaseline = "top";
      const lh = fs * 1.15;
      const hasBg = !!layer.bgColor;
      // Background pill (matches the live preview's bg/padding).
      const padX = hasBg ? 12 * sc : 0;
      const padY = hasBg ? 4 * sc : 0;
      if (hasBg) {
        const r = Math.min((layer.radius ?? 8) * sc, w / 2, h / 2);
        ctx.fillStyle = layer.bgColor;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-w / 2, -h / 2, w, h, r);
        else ctx.rect(-w / 2, -h / 2, w, h);
        ctx.fill();
      }
      ctx.fillStyle = layer.color || "#111111";
      const innerW = w - 2 * padX;
      // Word-wrap to the (inner) box width, honouring explicit line breaks.
      const lines = [];
      for (const para of String(layer.text || "").split("\n")) {
        const words = para.split(/\s+/).filter(Boolean);
        if (!words.length) {
          lines.push("");
          continue;
        }
        let line = "";
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > innerW && line) {
            lines.push(line);
            line = word;
          } else line = test;
        }
        lines.push(line);
      }
      const align = layer.align || "left";
      ctx.textAlign =
        align === "center" ? "center" : align === "right" ? "right" : "left";
      const tx =
        align === "center"
          ? 0
          : align === "right"
            ? w / 2 - padX
            : -w / 2 + padX;
      // With a bg pill, vertically centre the text block; otherwise top-anchor.
      const startY = hasBg ? -(lines.length * lh) / 2 : -h / 2 + padY;
      lines.forEach((ln, i) => ctx.fillText(ln, tx, startY + i * lh));
    } else if (layer.type === "path") {
      ctx.save();
      ctx.translate(-w / 2, -h / 2);
      ctx.scale(w / 100, h / 100);
      const p = new Path2D(layer.d);
      if (layer.stroke && layer.stroke !== "none") {
        ctx.strokeStyle = layer.stroke;
        ctx.lineWidth = layer.strokeWidth || 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke(p);
      }
      if (layer.fill && layer.fill !== "none") {
        ctx.fillStyle = layer.fill;
        ctx.fill(p);
      }
      ctx.restore();
    } else if (layer.type === "shape") {
      ctx.fillStyle = layer.fill || "#7c3aed";
      if (layer.shape === "rect") {
        ctx.fillRect(-w / 2, -h / 2, w, h);
      } else if (layer.shape === "circle") {
        ctx.beginPath();
        ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (layer.shape === "triangle") {
        ctx.beginPath();
        ctx.moveTo(0, -h / 2);
        ctx.lineTo(w / 2, h / 2);
        ctx.lineTo(-w / 2, h / 2);
        ctx.closePath();
        ctx.fill();
      } else if (layer.shape === "star") {
        ctx.beginPath();
        STAR_POINTS.forEach(([px, py], idx) => {
          const X = (px / 100 - 0.5) * w,
            Y = (py / 100 - 0.5) * h;
          idx === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
        });
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  };

  // Composite the whole design frame (base image + overlay layers) at export scale.
  const renderFrameToCanvas = async (format = "png") => {
    // When a Resize target is set, scale so output = exportSize; else 2× preview.
    const sc = exportSize ? exportSize.w / canvasSize.w : EXPORT_SCALE;
    const W = Math.round(canvasSize.w * sc),
      H = Math.round(canvasSize.h * sc);
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // JPEG has no alpha — paint a white matte over the whole canvas first (before the
    // round clip, so even circular exports get white corners) so transparent areas
    // don't encode as black. PNG keeps transparency.
    if (format === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);
    }

    // Circular clip for Profile Pics — corners stay transparent.
    if (canvasRound) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(W / 2, H / 2, W / 2, H / 2, 0, 0, Math.PI * 2);
      ctx.clip();
    }

    // Canvas background (behind everything).
    if (canvasBg.type === "color") {
      ctx.fillStyle = canvasBg.value;
      ctx.fillRect(0, 0, W, H);
    } else if (canvasBg.type === "gradient") {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, canvasBg.from);
      g.addColorStop(1, canvasBg.to);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    } else if (canvasBg.type === "image") {
      try {
        const bg = await loadImageEl(canvasBg.src);
        // cover-fit
        const ir = bg.naturalWidth / bg.naturalHeight,
          cr = W / H;
        let dw = W,
          dh = H,
          dx = 0,
          dy = 0;
        if (ir > cr) {
          dh = H;
          dw = H * ir;
          dx = (W - dw) / 2;
        } else {
          dw = W;
          dh = W / ir;
          dy = (H - dh) / 2;
        }
        ctx.drawImage(bg, dx, dy, dw, dh);
      } catch {
        /* ignore bg load failure */
      }
    }

    // Floor / cast shadow sprite (behind the product, drawn unrotated like the preview).
    if (
      displayImage &&
      !imgHidden &&
      imgW != null &&
      imgH != null &&
      toggles.shadows &&
      shadowMode === "floor" &&
      floorShadow
    ) {
      try {
        const sh = await loadImageEl(floorShadow.url);
        const left =
          (canvasSize.w / 2 + posX - imgW / 2 - floorShadow.pad + shadowX) * sc;
        const top =
          (canvasSize.h / 2 +
            posY -
            imgH / 2 +
            imgH -
            floorShadow.pad +
            shadowY) *
          sc;
        ctx.save();
        ctx.globalAlpha = shadowOpacity / 100;
        ctx.drawImage(
          sh,
          left,
          top,
          floorShadow.spriteW * sc,
          floorShadow.spriteH * sc,
        );
        ctx.restore();
      } catch {
        /* ignore floor-shadow draw failure */
      }
    }

    // Reflection sprite (anchored at the product's real base; mirrors flip + rotation like the preview).
    if (
      displayImage &&
      !imgHidden &&
      imgW != null &&
      imgH != null &&
      toggles.reflection &&
      reflectionSprite
    ) {
      try {
        const rf = await loadImageEl(reflectionSprite.url);
        const left = (canvasSize.w / 2 + posX - imgW / 2 + reflectionX) * sc;
        const top =
          (canvasSize.h / 2 +
            posY -
            imgH / 2 +
            reflectionSprite.topFrac * imgH +
            reflectionGap) *
          sc;
        const rw = imgW * sc,
          rh = reflectionSprite.heightFrac * imgH * sc;
        ctx.save();
        ctx.globalAlpha = reflectionOpacity / 100;
        ctx.translate(left + rw / 2, top);
        ctx.scale(flipH ? -1 : 1, 1);
        ctx.rotate(((-rotation + reflectionAngle) * Math.PI) / 180);
        ctx.drawImage(rf, -rw / 2, 0, rw, rh);
        ctx.restore();
      } catch {
        /* ignore reflection draw failure */
      }
    }

    // Base image, placed where it appears in the preview (box model).
    if (displayImage && !imgHidden && imgW != null && imgH != null) {
      const im = await loadImageEl(renderSrc);
      const dw = imgW * sc,
        dh = imgH * sc;
      // Crop window: the box (dw×dh) clips the content, drawn at cw×ch offset by
      // cx/cy (defaults to filling the box).
      const c = imgCrop || { cw: imgW, ch: imgH, cx: 0, cy: 0 };
      const cropW = c.cw * sc,
        cropH = c.ch * sc;
      const cLeft = -dw / 2 + c.cx * sc,
        cTop = -dh / 2 + c.cy * sc;
      ctx.save();
      ctx.translate(
        (canvasSize.w / 2 + posX) * sc,
        (canvasSize.h / 2 + posY) * sc,
      );
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      // Soft DROP shadow (follows the silhouette). Drawn unclipped so it can
      // extend past the crop box. Floor mode handled above.
      if (toggles.shadows && shadowMode === "drop") {
        ctx.save();
        ctx.shadowColor = hexToRgba(shadowColor, shadowOpacity / 100);
        ctx.shadowBlur = shadowBlur * 2 * sc;
        ctx.shadowOffsetX = shadowX * sc;
        ctx.shadowOffsetY = shadowY * sc;
        ctx.drawImage(im, cLeft, cTop, cropW, cropH);
        ctx.restore();
      }
      // Outline — silhouette halo hugging the cut-out (matches the preview).
      if (toggles.outline) {
        const sil = makeSilhouetteCanvas(im, cropW, cropH, outlineColor);
        const r = outlineWidth * sc;
        ctx.save();
        if (outlineBlur > 0) ctx.filter = `blur(${outlineBlur * sc}px)`;
        for (const [dx, dy] of OUTLINE_DIRS) {
          ctx.drawImage(sil, cLeft + dx * r, cTop + dy * r, cropW, cropH);
        }
        ctx.restore();
      }
      ctx.filter = imageFilter || "none";
      ctx.globalAlpha = adjOpacity / 100;
      ctx.globalCompositeOperation =
        blendMode === "normal" ? "source-over" : blendMode;
      // Clip to the visible box, then draw the (possibly larger) content.
      ctx.save();
      ctx.beginPath();
      ctx.rect(-dw / 2, -dh / 2, dw, dh);
      ctx.clip();
      ctx.drawImage(im, cLeft, cTop, cropW, cropH);
      ctx.restore();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
    }

    for (const layer of layers) {
      if (layer.hidden) continue;
      // Floor/reflection sprites sit behind their image layer (canvas space).
      if (layer.type === "image") await drawLayerSprites(ctx, layer, sc);
      await drawLayer(ctx, layer, sc);
    }
    if (canvasRound) ctx.restore();
    const mime = format === "jpeg" ? "image/jpeg" : "image/png";
    return await new Promise((resolve) => canvas.toBlob(resolve, mime, 0.92));
  };

  // Pick the right exporter: frame (layers / background / resized / round) vs. tight product crop.
  const exportBlob = async (format = "png") => {
    // Non-uniform (edge-stretched) base image must use the frame compositor;
    // uniform scaling stays on the high-res tight-crop path.
    const fit = imgFitRef.current;
    const distorted =
      imgW != null &&
      imgH != null &&
      fit.w &&
      Math.abs(imgW / imgH - fit.w / fit.h) > 0.01;
    const floorShadowActive = toggles.shadows && shadowMode === "floor";
    const framed =
      layers.length > 0 ||
      canvasBg.type !== "none" ||
      canvasRound ||
      exportSize ||
      distorted ||
      floorShadowActive ||
      toggles.reflection ||
      blendMode !== "normal" ||
      canvasSize.w !== CANVAS_W ||
      canvasSize.h !== CANVAS_H;
    return framed ? renderFrameToCanvas(format) : renderToCanvas(format);
  };

  const handleDownload = async (format = "png") => {
    if (!displayImage) return;
    try {
      const blob = await exportBlob(format);
      if (!blob) throw new Error("Export failed");
      const ext = format === "jpeg" ? "jpg" : "png";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = brandedFileName(ext);
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Could not export image");
    }
  };

  // Save the edited image to the user's Image Gallery (/gallery).
  const handleSave = async () => {
    if (!displayImage || saving) return;
    setSaving(true);
    try {
      const blob = await exportBlob();
      if (!blob) throw new Error("Export failed");
      const file = new File([blob], brandedFileName("png"), {
        type: "image/png",
      });
      await uploadMedia(file);
      toast.success("Saved to your Image Gallery");
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err?.message || "Could not save image");
    } finally {
      setSaving(false);
    }
  };

  const handleRetouchRelight = (type) => {
    if (!displayImage) {
      toast.error("Upload an image first");
      return;
    }
    // Both just brighten the image in steps (each click adds more — "varying
    // degrees"). Light On brightens harder; Retouch is a gentler lift plus a
    // little contrast for a cleaner look. Capped so it can't blow out.
    const atMax = brightness >= 100;
    if (atMax) {
      toast.info(type === "light" ? "Maximum light on" : "Maximum retouch");
      return;
    }
    if (type === "light") {
      setBrightness((b) => Math.min(100, (b || 0) + 15));
      toast.success("Light On");
    } else {
      setBrightness((b) => Math.min(100, (b || 0) + 8));
      setContrast((c) => Math.min(100, (c || 0) + 5));
      toast.success("Retouched");
    }
  };

  const togglePanel = (id) => setExpandedPanel((p) => (p === id ? null : id));

  // Canvas box background driven by the Backgrounds tool.
  const boxBackground =
    canvasBg.type === "color"
      ? { background: canvasBg.value }
      : canvasBg.type === "gradient"
        ? { background: gradientCss(canvasBg) }
        : canvasBg.type === "image"
          ? { backgroundColor: "#fff" }
          : removeBg || subjectRemoved
            ? {
                background:
                  "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0",
                backgroundColor: "#f0f0f0",
              }
            : { background: "white" };

  // Small preview of the current background for panel headers (color / gradient /
  // image thumbnail, or a checkerboard when transparent) — so the header reflects
  // what's on the canvas instead of always showing an empty swatch.
  const bgSwatchStyle =
    canvasBg.type === "color"
      ? { background: canvasBg.value }
      : canvasBg.type === "gradient"
        ? { background: gradientCss(canvasBg) }
        : canvasBg.type === "image"
          ? {
              backgroundImage: `url(${canvasBg.src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {
              background:
                "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
              backgroundSize: "10px 10px",
              backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0",
              backgroundColor: "#f0f0f0",
            };

  return (
    <div className="fixed inset-0 z-[100] flex">
      <div
        className="bg-[#efefef] dark:bg-canvas flex flex-col overflow-hidden text-gray-900 w-full h-full"
        onClick={() => setSelected(false)}
      >
        {/* Top Bar */}
        <EditorTopBar
          onClose={onClose}
          onUndo={handleUndo}
          canUndo={canUndo}
          onRedo={handleRedo}
          canRedo={canRedo}
          tools={topTools}
          onToolClick={handleTopTool}
          canExport={!!displayImage}
          userInitial={userInitial}
          userEmail={user?.email}
          userName={user?.name}
          onMenuAction={(id) => {
            const labels = {
              video: "Generate video",
              duplicate: "Duplicate",
              template: "Turn into Template",
              delete: "Delete",
            };
            toast(`${labels[id] || id} — coming soon`);
          }}
          onTogglePanel={() => {
            if (!displayImage) {
              toast.error("Add an image first");
              return;
            }
            setCompareOpen(true);
          }}
          downloadMenuOpen={downloadMenuOpen}
          setDownloadMenuOpen={setDownloadMenuOpen}
          onDownload={handleDownload}
          onShare={handleShare}
        />

        {compareOpen && (
          <BeforeAfterView
            beforeSrc={originalUrl}
            afterSrc={displayImage}
            backgroundStyle={boxBackground}
            backgroundImage={
              canvasBg.type === "image" ? canvasBg.src : null
            }
            onClose={() => setCompareOpen(false)}
          />
        )}

        {/* Main */}
        <div className="flex flex-1 overflow-hidden">
          {/* Canvas */}
          <div
            className="flex-1 flex flex-col items-center justify-center relative p-8"
            onClick={() => setSelected(false)}
          >
            <div
              className="relative"
              style={{ width: canvasSize.w, height: canvasSize.h }}
            >
            <div
              className="absolute inset-0 rounded-lg shadow-sm overflow-hidden"
              style={{
                ...boxBackground,
                ...(canvasRound ? { borderRadius: "50%" } : {}),
              }}
              onClick={(e) => {
                if (!displayImage && !subjectRemoved) {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }
              }}
            >
              {canvasBg.type === "image" && (
                <img
                  src={canvasBg.src}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  style={{ zIndex: 0 }}
                />
              )}
              {!displayImage && !processing && !subjectRemoved ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 transition-colors">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                    <ImageIcon className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-gray-500 font-medium">
                    Click to upload a photo
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    PNG, JPG, WEBP supported
                  </p>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Move Shadow / Move Reflection: drag layer over the canvas
                      that nudges the active image's shadow offset or reflection
                      aspect (Shadows → Move / Reflection → Move). */}
                  {(moveShadow.open || moveReflection.open) &&
                    displayImage &&
                    !imgHidden && (
                      <div
                        onPointerDown={
                          moveReflection.open ? onReflMoveDown : onShadowMoveDown
                        }
                        onPointerMove={
                          moveReflection.open ? onReflMoveMove : onShadowMoveMove
                        }
                        onPointerUp={
                          moveReflection.open ? onReflMoveUp : onShadowMoveUp
                        }
                        className="absolute inset-0 z-[30]"
                        style={{ cursor: "move", touchAction: "none" }}
                      />
                    )}
                  {/* Move Text Shadow: drag anywhere on the canvas to nudge the
                      selected text layer's shadow offset. */}
                  {moveTextShadow.open && (
                    <div
                      onPointerDown={onTextShadowMoveDown}
                      onPointerMove={onTextShadowMoveMove}
                      onPointerUp={onTextShadowMoveUp}
                      className="absolute inset-0 z-[30]"
                      style={{ cursor: "move", touchAction: "none" }}
                    />
                  )}
                  {/* Move Text Reflection: drag to change the reflection aspect. */}
                  {moveTextReflection.open && (
                    <div
                      onPointerDown={onTextReflMoveDown}
                      onPointerMove={onTextReflMoveMove}
                      onPointerUp={onTextReflMoveUp}
                      className="absolute inset-0 z-[30]"
                      style={{ cursor: "move", touchAction: "none" }}
                    />
                  )}
                  {/* Floor / cast shadow (sits behind the product) */}
                  {!processing &&
                    displayImage &&
                    !imgHidden &&
                    toggles.shadows &&
                    shadowMode === "floor" &&
                    floorShadow &&
                    imgW != null &&
                    imgH != null && (
                      <img
                        src={floorShadow.url}
                        alt=""
                        draggable={false}
                        style={{
                          position: "absolute",
                          left:
                            canvasSize.w / 2 +
                            posX -
                            imgW / 2 -
                            floorShadow.pad +
                            shadowX,
                          top:
                            canvasSize.h / 2 +
                            posY -
                            imgH / 2 +
                            imgH -
                            floorShadow.pad +
                            shadowY,
                          width: floorShadow.spriteW,
                          height: floorShadow.spriteH,
                          opacity: shadowOpacity / 100,
                          pointerEvents: "none",
                          zIndex: 3,
                        }}
                      />
                    )}
                  {/* Reflection (mirrored copy below the product) */}
                  {!processing &&
                    displayImage &&
                    !imgHidden &&
                    toggles.reflection &&
                    reflectionSprite &&
                    imgW != null &&
                    imgH != null && (
                      <img
                        src={reflectionSprite.url}
                        alt=""
                        draggable={false}
                        style={{
                          position: "absolute",
                          left:
                            canvasSize.w / 2 + posX - imgW / 2 + reflectionX,
                          // Anchor at the product's real base (topFrac), not the box bottom.
                          top:
                            canvasSize.h / 2 +
                            posY -
                            imgH / 2 +
                            reflectionSprite.topFrac * imgH +
                            reflectionGap,
                          width: imgW,
                          height: reflectionSprite.heightFrac * imgH,
                          opacity: reflectionOpacity / 100,
                          // Mirror the product's flip + rotation so the reflection tracks it.
                          transform: `scaleX(${flipH ? -1 : 1}) rotate(${-rotation + reflectionAngle}deg)`,
                          transformOrigin: "top center",
                          pointerEvents: "none",
                          zIndex: 2,
                        }}
                      />
                    )}
                  {processing ? (
                    <div className="flex flex-col items-center gap-3 w-48">
                      <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                      <p className="text-gray-500 text-sm font-medium">
                        Removing background…
                      </p>
                      {processingProgress > 0 && (
                        <>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${processingProgress}%` }}
                            />
                          </div>
                          <p className="text-gray-500 text-xs">
                            {processingProgress}%
                          </p>
                        </>
                      )}
                      {processingProgress === 0 && (
                        <p className="text-gray-500 text-xs">Loading model…</p>
                      )}
                    </div>
                  ) : (
                    displayImage &&
                    !imgHidden &&
                    (() => {
                      const baseReady = imgW != null && imgH != null;
                      return (
                        <div
                          className={`absolute ${selected ? "outline outline-blue-500" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(true);
                            setActiveTool(null); // show the Object panel
                          }}
                          onPointerDown={onImgPointerDown}
                          onPointerMove={onImgPointerMove}
                          onPointerUp={onImgPointerUp}
                          style={
                            baseReady
                              ? {
                                  left: canvasSize.w / 2 + posX - imgW / 2,
                                  top: canvasSize.h / 2 + posY - imgH / 2,
                                  width: imgW,
                                  height: imgH,
                                  cursor: "move",
                                  touchAction: "none",
                                  zIndex: 4,
                                }
                              : {
                                  left: "50%",
                                  top: "50%",
                                  transform: "translate(-50%,-50%)",
                                  maxWidth: "78%",
                                  maxHeight: 340,
                                  cursor: "move",
                                  touchAction: "none",
                                  zIndex: 4,
                                }
                          }
                        >
                          {selected && baseReady && (
                            <>
                              {HANDLES.map((k) => (
                                <div
                                  key={k}
                                  onPointerDown={(e) => onImgResizeDown(e, k)}
                                  onPointerMove={onImgResizeMove}
                                  onPointerUp={onImgResizeUp}
                                  className="absolute w-3 h-3 bg-surface border-2 border-blue-500 rounded-sm z-10"
                                  style={{
                                    left: k.includes("l")
                                      ? "0%"
                                      : k.includes("r")
                                        ? "100%"
                                        : "50%",
                                    top: k.includes("t")
                                      ? "0%"
                                      : k.includes("b")
                                        ? "100%"
                                        : "50%",
                                    transform: "translate(-50%,-50%)",
                                    cursor: handleCursor(k),
                                    touchAction: "none",
                                  }}
                                />
                              ))}
                              <button
                                onPointerDown={(e) =>
                                  onRotateDown(e, "base", null)
                                }
                                onPointerMove={onRotateMove}
                                onPointerUp={onRotateUp}
                                title="Rotate"
                                className="absolute -right-9 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-surface border border-gray-200 shadow flex items-center justify-center text-blue-600 cursor-grab active:cursor-grabbing z-10"
                                style={{ touchAction: "none" }}
                              >
                                <RotateCw className="w-3.5 h-3.5" />
                              </button>
                              {/* Selection toolbar is rendered outside the clipped
                                  canvas box (see ImageToolbar below). */}
                            </>
                          )}
                          {baseReady ? (
                            // Crop window: the box (imgW×imgH) clips the content
                            // (drawn at cw×ch offset by cx/cy). The filter/opacity/
                            // blend/transform live on the WRAPPER so shadow + outline
                            // hug the cropped shape and extend past the box.
                            (() => {
                              const c = imgCrop || {
                                cw: imgW,
                                ch: imgH,
                                cx: 0,
                                cy: 0,
                              };
                              return (
                                <div
                                  className="absolute inset-0 overflow-hidden"
                                  style={{
                                    filter: imageFilterWithEffects,
                                    opacity: adjOpacity / 100,
                                    mixBlendMode:
                                      blendMode === "normal"
                                        ? undefined
                                        : blendMode,
                                    transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                                    transformOrigin: "center",
                                  }}
                                >
                                  <img
                                    ref={imgRef}
                                    src={renderSrc}
                                    alt="product"
                                    draggable={false}
                                    onLoad={onImageLoad}
                                    // Default object-fit (fill) matches the old
                                    // base render; content box keeps the aspect.
                                    className="absolute block max-w-none"
                                    style={{
                                      left: c.cx,
                                      top: c.cy,
                                      width: c.cw,
                                      height: c.ch,
                                    }}
                                  />
                                </div>
                              );
                            })()
                          ) : (
                            <img
                              ref={imgRef}
                              src={renderSrc}
                              alt="product"
                              draggable={false}
                              onLoad={onImageLoad}
                              className="block w-full h-full"
                              style={{
                                objectFit: "contain",
                                maxWidth: "100%",
                                maxHeight: 340,
                                filter: imageFilterWithEffects,
                                opacity: adjOpacity / 100,
                                mixBlendMode:
                                  blendMode === "normal" ? undefined : blendMode,
                                transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                                transformOrigin: "center",
                              }}
                            />
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

              {/* Overlay layers (Insert) */}
              {layers.map((layer) => {
                if (layer.hidden) return null;
                const isSel = layer.id === selectedLayerId;
                const isText = layer.type === "text";
                const isImage = layer.type === "image";
                const isEditing = layer.id === editingLayerId;
                // Per-image-layer sprites (floor shadow / reflection), the same
                // way the base image renders them — positioned in canvas space.
                const li = isImage
                  ? { ...IMG_DEFAULTS, ...(layer.img || {}) }
                  : null;
                const floorSprite = isImage ? layerFloorFor(layer) : null;
                const reflSprite = isImage ? layerReflectionFor(layer) : null;
                const textStyle = {
                  color: layer.color,
                  fontWeight: layer.fontWeight,
                  fontSize: layer.fontSize,
                  lineHeight: layer.lineHeight ?? 1.15,
                  letterSpacing:
                    layer.letterSpacing != null
                      ? `${layer.letterSpacing}px`
                      : undefined,
                  whiteSpace:
                    layer.autoWidth || layer.wrap === false
                      ? "nowrap"
                      : "pre-wrap",
                  transform: textTransform(layer) || undefined,
                  // Adjust panel + Outline blur — the CSS-expressible subset.
                  filter: textFilter(layer) || undefined,
                  textShadow: buildTextShadow(layer),
                  // Outline panel — crisp stroke hugging the glyphs.
                  WebkitTextStroke:
                    layer.outlineOn && (layer.outlineWidth ?? 0) > 0
                      ? `${(layer.outlineWidth ?? 0) * 0.3}px ${layer.outlineColor || "#000000"}`
                      : undefined,
                  opacity:
                    layer.opacity != null ? layer.opacity / 100 : undefined,
                  textAlign: layer.align,
                  fontFamily: layer.fontFamily
                    ? `'${layer.fontFamily}', 'DM Sans', sans-serif`
                    : undefined,
                  ...(layer.bgColor
                    ? {
                        background: layer.bgColor,
                        borderRadius: layer.radius ?? 8,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems:
                          layer.align === "left"
                            ? "flex-start"
                            : layer.align === "right"
                              ? "flex-end"
                              : "center",
                        padding: "4px 12px",
                      }
                    : {}),
                };
                // Text Reflection — a faded, vertically-mirrored copy rendered
                // below the text (Reflection panel). Move nudges reflectionX/gap,
                // Angle skews it. The mask fades it out away from the text.
                const showTextRefl =
                  isText && layer.reflectionOn && !isEditing;
                const reflMask =
                  "linear-gradient(to top, rgba(0,0,0,0.95), transparent 78%)";
                return (
                  <Fragment key={layer.id}>
                  {showTextRefl && (
                    <div
                      style={{
                        position: "absolute",
                        left: layer.x - layer.w / 2 + (layer.reflectionX || 0),
                        top: layer.y + layer.h / 2 + (layer.reflectionGap || 0),
                        width: layer.w,
                        height: layer.h,
                        transform: `rotate(${layer.rotation || 0}deg) scaleY(-1) rotate(${layer.reflectionAngle || 0}deg)`,
                        transformOrigin: "top center",
                        opacity: (layer.reflectionOpacity ?? 80) / 100,
                        WebkitMaskImage: reflMask,
                        maskImage: reflMask,
                        color: layer.color,
                        fontWeight: layer.fontWeight,
                        fontSize: layer.fontSize,
                        lineHeight: layer.lineHeight ?? 1.15,
                        letterSpacing:
                          layer.letterSpacing != null
                            ? `${layer.letterSpacing}px`
                            : undefined,
                        textAlign: layer.align,
                        fontFamily: layer.fontFamily
                          ? `'${layer.fontFamily}', 'DM Sans', sans-serif`
                          : undefined,
                        whiteSpace:
                          layer.autoWidth || layer.wrap === false
                            ? "nowrap"
                            : "pre-wrap",
                        pointerEvents: "none",
                        overflow: "hidden",
                        zIndex: 4,
                      }}
                    >
                      {layer.text}
                    </div>
                  )}
                  {floorSprite && (
                    <img
                      src={floorSprite.url}
                      alt=""
                      draggable={false}
                      style={{
                        position: "absolute",
                        left:
                          layer.x - layer.w / 2 - floorSprite.pad + li.shadowX,
                        top:
                          layer.y + layer.h / 2 - floorSprite.pad + li.shadowY,
                        width: floorSprite.spriteW,
                        height: floorSprite.spriteH,
                        opacity: li.shadowOpacity / 100,
                        pointerEvents: "none",
                        zIndex: 4,
                      }}
                    />
                  )}
                  {reflSprite && (
                    <img
                      src={reflSprite.url}
                      alt=""
                      draggable={false}
                      style={{
                        position: "absolute",
                        left: layer.x - layer.w / 2 + li.reflectionX,
                        top:
                          layer.y -
                          layer.h / 2 +
                          reflSprite.topFrac * layer.h +
                          li.reflectionGap,
                        width: layer.w,
                        height: reflSprite.heightFrac * layer.h,
                        opacity: li.reflectionOpacity / 100,
                        transform: `scaleX(${li.flipH ? -1 : 1}) rotate(${-(layer.rotation || 0) + li.reflectionAngle}deg)`,
                        transformOrigin: "top center",
                        pointerEvents: "none",
                        zIndex: 4,
                      }}
                    />
                  )}
                  <div
                    onPointerDown={(e) => onLayerPointerDown(e, layer)}
                    onPointerMove={onLayerPointerMove}
                    onPointerUp={onLayerPointerUp}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLayerId(layer.id);
                      // Clicking an image layer closes whatever tool panel is
                      // open (e.g. Insert) so its Image panel shows immediately.
                      if (isImage) setActiveTool(null);
                    }}
                    onDoubleClick={
                      isText
                        ? (e) => {
                            e.stopPropagation();
                            setSelectedLayerId(layer.id);
                            setEditingLayerId(layer.id);
                          }
                        : undefined
                    }
                    className={`absolute select-none ${isSel ? "outline outline-blue-500" : ""}`}
                    style={{
                      left: layer.x - layer.w / 2,
                      top: layer.y - layer.h / 2,
                      width: layer.w,
                      height: layer.h,
                      // Text flip mirrors the whole box here (image layers flip
                      // their inner <img> instead, so gate on isText).
                      transform: `rotate(${layer.rotation || 0}deg)${
                        isText && (layer.flipH || layer.flipV)
                          ? ` scaleX(${layer.flipH ? -1 : 1}) scaleY(${layer.flipV ? -1 : 1})`
                          : ""
                      }`,
                      cursor: isEditing ? "text" : "move",
                      touchAction: "none",
                      zIndex: 5,
                    }}
                  >
                    {isText ? (
                      isEditing ? (
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          ref={(el) => {
                            if (!el || el.getAttribute("data-init")) return;
                            el.setAttribute("data-init", "1");
                            el.textContent = layer.text;
                            el.focus();
                            const r = document.createRange();
                            r.selectNodeContents(el);
                            r.collapse(false);
                            const s = window.getSelection();
                            s.removeAllRanges();
                            s.addRange(r);
                          }}
                          onInput={(e) =>
                            updateLayer(layer.id, {
                              text: e.currentTarget.textContent,
                            })
                          }
                          onBlur={() => setEditingLayerId(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") e.currentTarget.blur();
                          }}
                          className="w-full h-full outline-none whitespace-pre-wrap -break-words overflow-hidden cursor-text"
                          style={textStyle}
                        />
                      ) : layer.curve ? (
                        (() => {
                          // Curved text: lay the string along a quadratic arc.
                          const w = layer.w;
                          const h = layer.h;
                          const bend = (layer.curve / 100) * (h * 0.9);
                          const baseY = layer.curve >= 0 ? h * 0.72 : h * 0.28;
                          const pid = `curve-${layer.id}`;
                          return (
                            <svg
                              width={w}
                              height={h}
                              viewBox={`0 0 ${w} ${h}`}
                              className="w-full h-full overflow-visible pointer-events-none"
                            >
                              <defs>
                                <path
                                  id={pid}
                                  d={`M 0 ${baseY} Q ${w / 2} ${baseY - bend} ${w} ${baseY}`}
                                  fill="none"
                                />
                              </defs>
                              <text
                                fill={layer.color}
                                fontWeight={layer.fontWeight}
                                fontSize={layer.fontSize}
                                letterSpacing={layer.letterSpacing ?? 0}
                                style={{
                                  fontFamily: layer.fontFamily
                                    ? `'${layer.fontFamily}', 'DM Sans', sans-serif`
                                    : undefined,
                                }}
                              >
                                <textPath
                                  href={`#${pid}`}
                                  startOffset="50%"
                                  textAnchor="middle"
                                >
                                  {layer.text}
                                </textPath>
                              </text>
                            </svg>
                          );
                        })()
                      ) : (
                        <div
                          className="w-full h-full whitespace-pre-wrap wrap-break-word overflow-hidden pointer-events-none"
                          style={textStyle}
                        >
                          {layer.text}
                        </div>
                      )
                    ) : layer.type === "image" ? (
                      // Image layers render through the same pipeline as the base
                      // image: pixel-level effects (full Adjust, blur, texture,
                      // tile/perspective) are baked into the src, and the CSS
                      // ones (filter preset, outline, drop shadow, blend, opacity,
                      // flip, scale) are applied on top. Rotation stays on the
                      // container above (with the selection handles).
                      (() => {
                        const li = { ...IMG_DEFAULTS, ...(layer.img || {}) };
                        // Crop window: the box (w×h) clips the content, which is
                        // the image drawn at cropW×cropH offset by cropX/cropY.
                        // Defaults (content = box) render exactly like before.
                        const cw = layer.cropW ?? layer.w;
                        const ch = layer.cropH ?? layer.h;
                        const cox = layer.cropX ?? 0;
                        const coy = layer.cropY ?? 0;
                        return (
                          // Filter/opacity/blend live on the WRAPPER so shadow +
                          // outline hug the cropped shape and extend past the box;
                          // the img just crops (flip/scale stay on the img).
                          <div
                            className="absolute inset-0 overflow-hidden pointer-events-none"
                            style={{
                              filter: buildImageFilter(li, { bakeAdjust: true }),
                              opacity: (li.adjOpacity ?? 100) / 100,
                              mixBlendMode:
                                li.blendMode === "normal"
                                  ? undefined
                                  : li.blendMode,
                            }}
                          >
                            <img
                              src={proxiedSrc(bakedSrcFor(layer))}
                              draggable={false}
                              alt=""
                              className="absolute object-cover max-w-none"
                              style={{
                                left: cox,
                                top: coy,
                                width: cw,
                                height: ch,
                                transform: buildImageTransform(li, {
                                  includeRotate: false,
                                  includeScale: true,
                                }),
                              }}
                            />
                          </div>
                        );
                      })()
                    ) : (
                      <VisualSVG spec={layer} />
                    )}
                    {isSel && (
                      <>
                        {/* Image AND text layers use the shared floating
                            ImageToolbar (edit/delete/⋯); hide this inline strip
                            for them — keep it for emoji/shape. */}
                        {!isImage && !isText && (
                          <div
                            className="absolute -top-10 left-0 flex items-center gap-1 bg-surface rounded-lg shadow px-1.5 py-1 whitespace-nowrap"
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                          {isText && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingLayerId(layer.id);
                                }}
                                className="p-1 hover:bg-gray-100 rounded text-gray-500 cursor-pointer"
                                title="Edit text"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateLayer(layer.id, {
                                    fontWeight:
                                      layer.fontWeight === "700"
                                        ? "400"
                                        : "700",
                                  });
                                }}
                                className={`px-1.5 rounded hover:bg-gray-100 cursor-pointer text-sm font-bold ${layer.fontWeight === "700" ? "text-blue-600" : "text-gray-500"}`}
                                title="Bold"
                              >
                                B
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateLayer(layer.id, {
                                    fontSize: Math.max(10, layer.fontSize - 4),
                                  });
                                }}
                                className="px-1 rounded hover:bg-gray-100 cursor-pointer text-gray-500 text-xs"
                                title="Smaller"
                              >
                                A−
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateLayer(layer.id, {
                                    fontSize: layer.fontSize + 4,
                                  });
                                }}
                                className="px-1 rounded hover:bg-gray-100 cursor-pointer text-gray-500 text-sm"
                                title="Larger"
                              >
                                A+
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const o = ["left", "center", "right"];
                                  updateLayer(layer.id, {
                                    align: o[(o.indexOf(layer.align) + 1) % 3],
                                  });
                                }}
                                className="px-1 rounded hover:bg-gray-100 cursor-pointer text-gray-500 text-xs"
                                title="Align"
                              >
                                {layer.align === "left"
                                  ? "⯇"
                                  : layer.align === "right"
                                    ? "⯈"
                                    : "≡"}
                              </button>
                              {[
                                "#111111",
                                "#ffffff",
                                "#ef4444",
                                "#2563eb",
                                "#22c55e",
                                "#eab308",
                                "#7c3aed",
                              ].map((c) => (
                                <button
                                  key={c}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateLayer(layer.id, { color: c });
                                  }}
                                  className="w-4 h-4 rounded-full border border-gray-300 cursor-pointer"
                                  style={{ background: c }}
                                  title={c}
                                />
                              ))}
                              <span className="w-px h-4 bg-gray-200 mx-0.5" />
                            </>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateLayer(layer.id);
                            }}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 cursor-pointer"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLayer(layer.id);
                            }}
                            className="p-1 hover:bg-gray-100 rounded text-red-500 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          </div>
                        )}
                        {!isEditing &&
                          HANDLES.map((k) => (
                            <div
                              key={k}
                              onPointerDown={(e) =>
                                onResizePointerDown(e, layer, k)
                              }
                              onPointerMove={onResizePointerMove}
                              onPointerUp={onLayerPointerUp}
                              className="absolute w-3 h-3 bg-surface border-2 border-blue-500 rounded-sm z-10"
                              style={{
                                left: k.includes("l")
                                  ? "0%"
                                  : k.includes("r")
                                    ? "100%"
                                    : "50%",
                                top: k.includes("t")
                                  ? "0%"
                                  : k.includes("b")
                                    ? "100%"
                                    : "50%",
                                transform: "translate(-50%,-50%)",
                                cursor: handleCursor(k),
                                touchAction: "none",
                              }}
                            />
                          ))}
                        {!isEditing && (
                          <button
                            onPointerDown={(e) =>
                              onRotateDown(e, "layer", layer.id)
                            }
                            onPointerMove={onRotateMove}
                            onPointerUp={onRotateUp}
                            title="Rotate"
                            className="absolute -right-9 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-surface border border-gray-200 shadow flex items-center justify-center text-blue-600 cursor-grab active:cursor-grabbing z-10"
                            style={{ touchAction: "none" }}
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  </Fragment>
                );
              })}
            </div>
              {/* Selection toolbar — rendered OUTSIDE the clipped canvas box so it
                  stays visible even when the image fills/overflows the corners.
                  Shown for the base image AND any selected image layer, wired to
                  whichever is active. */}
              {activeImageKind &&
                (() => {
                  const g = activeImgGeom();
                  if (g.w == null || g.h == null) return null;
                  const isLayer = activeImageKind === "layer";
                  return (
                    <ImageToolbar
                      style={{ left: g.left, top: g.top - 48 }}
                      onDelete={
                        isLayer
                          ? () => deleteLayer(selectedLayer.id)
                          : handleDeleteImage
                      }
                      onDuplicate={
                        isLayer
                          ? () => duplicateLayer(selectedLayer.id)
                          : () => toast("Duplicate — coming soon")
                      }
                      onLayersOrder={() => setActiveTool("layers")}
                      onBringFront={
                        isLayer
                          ? () => reorderLayer(selectedLayer.id, "front")
                          : () => toast("The base image stays at the back")
                      }
                      onSendBack={
                        isLayer
                          ? () => reorderLayer(selectedLayer.id, "back")
                          : () => toast("The base image stays at the back")
                      }
                      onReplace={
                        isLayer
                          ? () => {
                              layerReplaceRef.current?.click();
                            }
                          : () => fileInputRef.current?.click()
                      }
                      onEditCutout={openCutout}
                      onRetouch={() => toast("Retouch — coming soon")}
                      hiddenItems={isLayer ? ["retouch"] : []}
                    />
                  );
                })()}
              {/* Text layers get the same floating toolbar (Edit / Delete / ⋯),
                  hidden while the text is being edited inline. */}
              {selectedLayer?.type === "text" &&
                editingLayerId !== selectedLayer.id &&
                (() => {
                  const l = selectedLayer;
                  return (
                    <ImageToolbar
                      style={{ left: l.x - l.w / 2, top: l.y - l.h / 2 - 48 }}
                      onEdit={() => setEditingLayerId(l.id)}
                      onDelete={() => deleteLayer(l.id)}
                      onDuplicate={() => duplicateLayer(l.id)}
                      onLayersOrder={() => setActiveTool("layers")}
                      onBringFront={() => reorderLayer(l.id, "front")}
                      onSendBack={() => reorderLayer(l.id, "back")}
                      hiddenItems={["replace", "cutout", "retouch"]}
                    />
                  );
                })()}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={insertFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleInsertFile}
            />
            <input
              ref={layerReplaceRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLayerReplace}
            />

            {/* AI prompt */}
            <div
              className="mt-5 flex items-center gap-2 bg-surface rounded-full border border-gray-200 shadow-sm px-4 py-2.5 w-96"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe a change…"
                className="flex-1 text-sm text-gray-500 outline-none bg-transparent"
                onKeyDown={(e) => e.key === "Enter" && handleAiApply()}
              />
              <button
                onClick={handleAiApply}
                disabled={applyingAi || !aiPrompt.trim() || !displayImage}
                className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40"
              >
                {applyingAi ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <span className="text-white font-bold text-sm">↑</span>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel */}
          <div
            className="w-84 bg-surface border-l border-gray-200 flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {activeTool === "layers" ? (
              (() => {
                const layerLabel = (l) =>
                  l.type === "text"
                    ? l.text || "Text"
                    : l.type === "image"
                      ? "Image"
                      : l.type === "emoji"
                        ? l.emoji
                        : l.type === "badge"
                          ? l.text || "Badge"
                          : l.type === "shape"
                            ? "Shape"
                            : "Graphic";
                const row = (opts) => (
                  <div
                    key={opts.key}
                    onClick={opts.onSelect}
                    className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer ${opts.active ? "bg-blue-50 ring-1 ring-blue-400" : "hover:bg-gray-100"}`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        opts.onToggleHidden();
                      }}
                      className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer shrink-0"
                      title={opts.hidden ? "Show" : "Hide"}
                    >
                      {opts.hidden ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <span className="w-8 h-8 rounded-md border border-gray-200 bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                      {opts.thumb}
                    </span>
                    <span
                      className={`flex-1 text-sm truncate ${opts.hidden ? "text-gray-400" : "text-gray-800"}`}
                    >
                      {opts.label}
                    </span>
                    {opts.controls}
                  </div>
                );
                return (
                  <div className="flex flex-col max-h-full">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <span className="font-semibold text-base text-gray-900">
                        Layers
                      </span>
                      <button
                        onClick={() => setActiveTool(null)}
                        className="p-1 rounded hover:bg-gray-100 cursor-pointer"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-1">
                      {!displayImage && layers.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-8">
                          No layers yet. Add an image, text or graphics.
                        </p>
                      )}
                      {/* Overlay layers (front first) */}
                      {[...layers].reverse().map((l) =>
                        row({
                          key: l.id,
                          active: l.id === selectedLayerId,
                          hidden: l.hidden,
                          label: layerLabel(l),
                          thumb:
                            l.type === "image" ? (
                              <img
                                src={l.src}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : l.type === "text" ? (
                              <Type className="w-4 h-4 text-gray-400" />
                            ) : (
                              <VisualSVG spec={l} />
                            ),
                          onSelect: () => {
                            setSelectedLayerId(l.id);
                            setSelected(false);
                          },
                          onToggleHidden: () => toggleLayerHidden(l.id),
                          controls: (
                            <span className="flex items-center shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveLayer(l.id, "up");
                                }}
                                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                                title="Bring forward"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveLayer(l.id, "down");
                                }}
                                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                                title="Send backward"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateLayer(l.id);
                                }}
                                className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                                title="Duplicate"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteLayer(l.id);
                                }}
                                className="p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ),
                        }),
                      )}
                      {/* Base product image (bottom of stack) */}
                      {displayImage &&
                        row({
                          key: "base",
                          active: selected,
                          hidden: imgHidden,
                          label: "Product image",
                          thumb: (
                            <img
                              src={displayImage}
                              alt=""
                              className="w-full h-full object-contain"
                            />
                          ),
                          onSelect: () => {
                            setSelected(true);
                            setSelectedLayerId(null);
                          },
                          onToggleHidden: () => setImgHidden((v) => !v),
                          controls: (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                              }}
                              className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer text-xs font-medium"
                              title="Replace"
                            >
                              Replace
                            </button>
                          ),
                        })}
                    </div>
                  </div>
                );
              })()
            ) : activeTool === "addtext" ? (
              <div className="flex flex-col max-h-full">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="font-semibold text-base text-gray-900">
                    Add Text
                  </span>
                  <button
                    onClick={() => setActiveTool(null)}
                    className="p-1 rounded hover:bg-gray-100 cursor-pointer"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="p-4 overflow-y-auto">
                  {/* Add plain text */}
                  <button
                    onClick={addText}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add text
                  </button>

                  {/* Search */}
                  <div className="relative mt-3">
                    <input
                      value={textStyleQuery}
                      onChange={(e) => setTextStyleQuery(e.target.value)}
                      placeholder="Search text styles"
                      className="w-full pl-3 pr-3 py-2.5 rounded-xl bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                    />
                  </div>

                  {/* Brand kit fonts */}
                  {(kit?.fonts || []).length > 0 && (
                    <div className="mt-5">
                      <p className="text-xs font-semibold text-gray-600 mb-2">
                        Brand kit
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {kit.fonts.map((f) => (
                          <button
                            key={f}
                            onClick={() => addTextWithFont(f)}
                            onMouseEnter={() => loadWebFont(f)}
                            className="h-20 rounded-xl border border-gray-200 hover:border-blue-400 flex flex-col items-center justify-center px-2 cursor-pointer"
                          >
                            <span
                              className="text-xl text-gray-900 truncate max-w-full"
                              style={{
                                fontFamily: `'${f}', sans-serif`,
                                fontWeight: 700,
                              }}
                            >
                              {f}
                            </span>
                            <span
                              className="text-xs text-gray-400 truncate max-w-full"
                              style={{ fontFamily: `'${f}', sans-serif` }}
                            >
                              Regular
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All styles */}
                  <div className="mt-5">
                    <p className="text-xs font-semibold text-gray-600 mb-2">
                      All styles
                    </p>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3">
                      {TEXT_STYLE_CATEGORIES.map((c) => (
                        <button
                          key={c}
                          onClick={() => setTextStyleCat(c)}
                          className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full cursor-pointer ${textStyleCat === c ? "bg-gray-900 text-gray-50" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {TEXT_STYLES.filter(
                        (s) =>
                          textStyleCat === "All" || s.category === textStyleCat,
                      )
                        .filter((s) =>
                          s.text
                            .toLowerCase()
                            .includes(textStyleQuery.toLowerCase()),
                        )
                        .map((s) => (
                          <button
                            key={s.id}
                            onClick={() => addTextStyle(s)}
                            title={`Add "${s.text.replace(/\n/g, " ")}"`}
                            className="h-24 rounded-xl border border-gray-200 hover:border-blue-400 bg-surface flex items-center justify-center p-2 overflow-hidden cursor-pointer"
                          >
                            <span
                              className="text-center leading-tight whitespace-pre-line"
                              style={{
                                fontFamily: `'${s.fontFamily}', sans-serif`,
                                fontWeight: s.fontWeight,
                                color: s.color,
                                fontSize: Math.min(s.fontSize, 24),
                                ...(s.bgColor
                                  ? {
                                      background: s.bgColor,
                                      borderRadius: s.radius >= 999 ? 999 : 6,
                                      padding:
                                        s.radius >= 999
                                          ? "14px 12px"
                                          : "4px 10px",
                                    }
                                  : {}),
                              }}
                            >
                              {s.text}
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTool === "insert" ? (
              <div className="flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <span className="font-semibold text-base text-gray-900">
                    Insert
                  </span>
                  <button
                    onClick={() => setActiveTool(null)}
                    className="p-1 rounded hover:bg-gray-100 cursor-pointer"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                {insertCat ? (
                  (() => {
                    /* ── Category detail: show all items, pick one ── */
                    const cat = INSERT_LIBRARY.find((c) => c.id === insertCat);
                    if (!cat) return null;
                    return (
                      <div className="p-4">
                        <button
                          onClick={() => setInsertCat(null)}
                          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-3 cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4 rotate-180" />{" "}
                          {cat.label}
                        </button>
                        <div className="grid grid-cols-4 gap-2">
                          {cat.items.map((it, i) => {
                            // Preview in the default colour; the real colour is
                            // chosen after insert in the Image panel.
                            const preview = cat.colorable
                              ? resolveItem(it, DEFAULT_INSERT_COLOR)
                              : it;
                            return (
                              <button
                                key={i}
                                onClick={() =>
                                  addItem(it, {
                                    label: cat.label,
                                    colorable: cat.colorable,
                                  })
                                }
                                className="aspect-square flex items-center justify-center p-1.5 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
                              >
                                <VisualSVG spec={preview} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  /* ── Category list: AI / upload / recent + category cards ── */
                  <div className="p-4 space-y-5">
                    <button
                      onClick={() =>
                        toast.info("AI image generation is coming soon.")
                      }
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer"
                      style={{
                        background: "linear-gradient(135deg,#7c3aed,#a855f7)",
                      }}
                    >
                      <Sparkles className="w-4 h-4" /> Generate an image with AI
                    </button>
                    <button
                      onClick={() => insertFileRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                    >
                      <Upload className="w-4 h-4" /> Drop a file or select an
                      image
                    </button>
                    {/* Recent uploads from the gallery — chevron carousel that
                        fades in on hover; "See all" opens the full gallery. */}
                    <RecentUploadsCarousel
                      images={myImages}
                      onSelect={(src) => addImageLayer(src)}
                      onSeeAll={() => setActiveTool("insertuploads")}
                    />
                    {/* Grouped sub-groups: a heading (Shapes / Graphics) with a
                        2-column grid of category cards under it. */}
                    {INSERT_GROUPS.map((groupName) => {
                      const cats = INSERT_LIBRARY.filter(
                        (c) => c.group === groupName,
                      );
                      if (!cats.length) return null;
                      return (
                        <div key={groupName}>
                          <p className="text-sm font-bold text-gray-900 mb-2">
                            {groupName}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {cats.map((cat) => (
                              <button
                                key={cat.id}
                                onClick={() => setInsertCat(cat.id)}
                                className="text-left border border-gray-200 rounded-xl p-2.5 hover:border-blue-400 hover:bg-blue-50/40 transition-colors cursor-pointer"
                              >
                                <span className="block text-xs font-semibold text-gray-900 mb-2 truncate">
                                  {cat.label}
                                </span>
                                <div className="grid grid-cols-4 gap-1">
                                  {cat.items.slice(0, 4).map((it, i) => (
                                    <div
                                      key={i}
                                      className="aspect-square flex items-center justify-center p-1 bg-gray-100 rounded-md"
                                    >
                                      <VisualSVG
                                        spec={
                                          cat.colorable
                                            ? resolveItem(
                                                it,
                                                DEFAULT_INSERT_COLOR,
                                              )
                                            : it
                                        }
                                      />
                                    </div>
                                  ))}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : activeTool === "backgrounds" ||
              (!activeTool &&
                !selected &&
                activeImageKind !== "layer" &&
                selectedLayer?.type !== "text") ? (
              // Background root: shown when the Backgrounds tool is opened from the
              // top bar OR as the background context (nothing selected). Offers the
              // three ways to fill the canvas (matches Photoroom's panel). A
              // selected image LAYER / text layer skips this to its own panel.
              <div className="flex flex-col max-h-full">
                <div className="flex items-center gap-3 px-4 py-4">
                  <span
                    className="w-9 h-9 rounded-lg border border-gray-200 shrink-0 bg-center bg-cover"
                    style={bgSwatchStyle}
                  />
                  <span className="font-semibold text-base text-gray-900">
                    {canvasBg.type === "none"
                      ? "Transparent Background"
                      : "Background"}
                  </span>
                </div>
                <div className="px-4 pb-4 space-y-3">
                  <button
                    onClick={() => setActiveTool("aibg")}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <Layers className="w-5 h-5 shrink-0" /> Add an AI background
                  </button>
                  <button
                    onClick={() => {
                      setActiveTool("bgimages");
                      setBgCategory(null);
                    }}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:border-blue-400 transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-5 h-5 shrink-0" /> Add image as
                    background
                  </button>
                  <button
                    onClick={() => {
                      setActiveTool("colorbg");
                      setCanvasBg({ type: "color", value: "#ffffff" });
                    }}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:border-blue-400 transition-colors cursor-pointer"
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-gray-200 shrink-0"
                      style={{
                        background:
                          "conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)",
                      }}
                    />
                    Add a solid color
                  </button>
                </div>
                {/* Bg image picker (also lives in the full panel) */}
                <input
                  ref={bgFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onBgFileChange}
                />
              </div>
            ) : activeTool === "aibg" ? (
              <AiBackgroundsPanel
                onApply={(url) => {
                  setCanvasBg({ type: "image", src: url });
                }}
                onClose={() => setActiveTool(null)}
                onCreate={() => setActiveTool("custombg")}
              />
            ) : activeTool === "custombg" ? (
              <CustomBackgroundPanel
                onBack={() => setActiveTool("aibg")}
                onApply={(url) => {
                  setCanvasBg({ type: "image", src: url });
                }}
                onGenerate={() =>
                  toast("Background generation — coming soon")
                }
              />
            ) : activeTool === "recentuploads" ? (
              <RecentUploadsPanel
                images={myImages}
                selectedSrc={canvasBg.type === "image" ? canvasBg.src : null}
                onSelect={(src) => setCanvasBg({ type: "image", src })}
                onBack={() => setActiveTool("bgimages")}
              />
            ) : activeTool === "insertuploads" ? (
              // Insert flow: "See all" opens the gallery; picking inserts an
              // image layer (rather than setting the canvas background).
              <RecentUploadsPanel
                images={myImages}
                onSelect={(src) => addImageLayer(src)}
                onBack={() => setActiveTool("insert")}
              />
            ) : activeTool === "colorbg" ? (
              <ColorBackgroundPanel
                canvasBg={canvasBg}
                onApply={(bg) => setCanvasBg(bg)}
                palettes={kit?.palettes || []}
                removeBg={removeBg}
                canRemoveBg={!!originalUrl && !processing}
                onRemoveBg={() => handleRemoveBgToggle(!removeBg)}
                onAiBg={() => setActiveTool("aibg")}
                onImageBg={() => {
                  setActiveTool("bgimages");
                  setBgCategory(null);
                }}
                onInspiration={() => setActiveTool("custombg")}
                onSave={() => toast("Saved to your backgrounds — coming soon")}
              />
            ) : activeTool === "bgimages" ? (
              bgCategory ? (
                <BackgroundCategoryPanel
                  category={bgCategory}
                  onBack={() => setBgCategory(null)}
                  onApply={(src) => setCanvasBg({ type: "image", src })}
                  selectedSrc={
                    canvasBg.type === "image" ? canvasBg.src : null
                  }
                />
              ) : (
                <div className="flex flex-col max-h-full">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-8 h-8 rounded-lg border border-gray-200 shrink-0 bg-center bg-cover"
                        style={bgSwatchStyle}
                      />
                      <span className="font-semibold text-base text-gray-900">
                        Background
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTool(null);
                        setBgCategory(null);
                      }}
                      className="p-1 rounded hover:bg-gray-100 cursor-pointer"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    {/* Upload */}
                    <button
                      onClick={() => bgFileRef.current?.click()}
                      className="w-full flex flex-col items-center justify-center gap-2 py-10 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                    >
                      <Upload className="w-6 h-6" />
                      <span>
                        Drop a file or{" "}
                        <span className="text-blue-600 font-semibold">
                          select an image
                        </span>
                      </span>
                    </button>
                    <input
                      ref={bgFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onBgFileChange}
                    />

                    {/* Recent uploads (horizontal carousel + See all) */}
                    <RecentUploadsCarousel
                      images={myImages}
                      selectedSrc={
                        canvasBg.type === "image" ? canvasBg.src : null
                      }
                      onSelect={(src) => setCanvasBg({ type: "image", src })}
                      onSeeAll={() => setActiveTool("recentuploads")}
                    />

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        value={bgSearchQuery}
                        onChange={(e) => setBgSearchQuery(e.target.value)}
                        placeholder="Search backgrounds"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                      />
                    </div>

                    {/* Search results (infinite) OR the grouped library */}
                    {bgQueryDebounced ? (
                      <InfinitePexelsGrid
                        key={bgQueryDebounced}
                        query={bgQueryDebounced}
                        onApply={(src) =>
                          setCanvasBg({ type: "image", src })
                        }
                        selectedSrc={
                          canvasBg.type === "image" ? canvasBg.src : null
                        }
                      />
                    ) : (
                      <BackgroundLibrary
                        onOpenCategory={(cat) => setBgCategory(cat)}
                      />
                    )}
                  </div>
                </div>
              )
            ) : activeTool === "resize" ? (
              (() => {
                const q = resizeQuery.trim().toLowerCase();
                const isActive = (item) =>
                  exportSize &&
                  exportSize.w === item.w &&
                  exportSize.h === item.h;
                const isPending = (item) =>
                  pendingResize &&
                  pendingResize.w === item.w &&
                  pendingResize.h === item.h &&
                  pendingResize.label === item.label;
                const resizeRow = (item, key) => (
                  <button
                    key={key}
                    onClick={() => setPendingResize(item)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer ${isPending(item) ? "bg-blue-50 ring-1 ring-blue-400" : isActive(item) ? "bg-gray-100" : "hover:bg-gray-100"}`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: item.color || "#6b7280" }}
                      >
                        {item.label[0]}
                      </span>
                      <span className="text-sm text-gray-800 truncate">
                        {item.label}
                      </span>
                    </span>
                    <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                      {item.w} × {item.h}
                      {item.ratio ? `, ${item.ratio}` : ""}
                    </span>
                  </button>
                );
                return (
                  <div className="flex flex-col max-h-full">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <span className="font-semibold text-base text-gray-900">
                        Resize
                      </span>
                      <button
                        onClick={() => setActiveTool(null)}
                        className="p-1 rounded hover:bg-gray-100 cursor-pointer"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <div className="px-4 pt-3">
                      <input
                        value={resizeQuery}
                        onChange={(e) => setResizeQuery(e.target.value)}
                        placeholder="Search size presets"
                        className="w-full px-3 py-2.5 rounded-xl bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                      {/* Custom size */}
                      <div>
                        <button
                          onClick={() => setShowCustomSize((v) => !v)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-gray-100 cursor-pointer"
                        >
                          <span className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center text-gray-500 shrink-0">
                            <SlidersHorizontal className="w-4 h-4" />
                          </span>
                          <span className="text-sm text-gray-800">
                            Custom size
                          </span>
                        </button>
                        {showCustomSize && (
                          <div className="flex items-center gap-2 mt-2 px-2.5">
                            <input
                              type="number"
                              value={customW}
                              onChange={(e) => setCustomW(e.target.value)}
                              placeholder="W"
                              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 bg-surface text-gray-800"
                            />
                            <span className="text-gray-400">×</span>
                            <input
                              type="number"
                              value={customH}
                              onChange={(e) => setCustomH(e.target.value)}
                              placeholder="H"
                              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 bg-surface text-gray-800"
                            />
                            <button
                              onClick={() => {
                                const w = parseInt(customW, 10),
                                  h = parseInt(customH, 10);
                                if (w > 0 && h > 0)
                                  setPendingResize({
                                    label: "Custom",
                                    w,
                                    h,
                                    ratio: "",
                                    color: "#6b7280",
                                  });
                              }}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                            >
                              Set
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Recent */}
                      {!q && recentSizes.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-semibold text-gray-600">
                              Recent
                            </p>
                            <button
                              onClick={clearRecent}
                              className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer"
                            >
                              clear
                            </button>
                          </div>
                          {recentSizes.map((item, i) =>
                            resizeRow(item, `recent-${i}`),
                          )}
                        </div>
                      )}

                      {/* Groups */}
                      {RESIZE_GROUPS.map((group) => {
                        const items = group.items.filter(
                          (i) => !q || i.label.toLowerCase().includes(q),
                        );
                        if (!items.length) return null;
                        return (
                          <div key={group.title}>
                            <p className="text-xs font-semibold text-gray-600 mb-1">
                              {group.title}
                            </p>
                            {items.map((item) => resizeRow(item, item.id))}
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 p-3 space-y-2">
                      <button
                        onClick={() =>
                          pendingResize && applyResize(pendingResize)
                        }
                        disabled={!pendingResize}
                        className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                      >
                        Resize
                      </button>
                      <button
                        onClick={() => {
                          setPendingResize(null);
                          setActiveTool(null);
                        }}
                        className="w-full py-2.5 rounded-xl text-blue-600 text-sm font-semibold hover:bg-blue-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : activeTool === "brandit" ? (
              <div className="flex flex-col max-h-full">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="font-semibold text-base text-gray-900">
                    Brand Kit
                  </span>
                  <button
                    onClick={() => setActiveTool(null)}
                    className="p-1 rounded hover:bg-gray-100 cursor-pointer"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* Active brand header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                  {activeBrand?.logo ? (
                    <img
                      src={activeBrand.logo}
                      alt=""
                      className="w-9 h-9 rounded-lg object-contain border border-gray-200 bg-surface"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {activeBrand?.name || "No brand selected"}
                    </p>
                    <p className="text-[11px] text-gray-400">Active brand</p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 px-3 pt-3">
                  {[
                    { id: "logos", label: "Logos" },
                    { id: "colors", label: "Colors" },
                    { id: "fonts", label: "Fonts" },
                    { id: "import", label: "Import" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setKitTab(t.id)}
                      className={`flex-1 text-xs font-semibold py-1.5 rounded-lg cursor-pointer ${kitTab === t.id ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="p-4 overflow-y-auto">
                  {/* ── Logos ── */}
                  {kitTab === "logos" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-600">
                          Logos ({(kit?.logos || []).length})
                        </p>
                        <button
                          onClick={() => kitLogoInputRef.current?.click()}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>
                      <input
                        ref={kitLogoInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={onKitLogoUpload}
                      />
                      {(kit?.logos || []).length === 0 ? (
                        <p className="text-[11px] text-gray-400">
                          No logos yet. Upload one or import from a URL.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {(kit?.logos || []).map((url) => (
                            <div
                              key={url}
                              className="group relative aspect-square rounded-xl border border-gray-200 bg-surface flex items-center justify-center overflow-hidden"
                            >
                              <img
                                src={url}
                                alt=""
                                className="max-w-[80%] max-h-[80%] object-contain"
                              />
                              <button
                                onClick={() => addImageLayer(url)}
                                title="Add to canvas"
                                className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                              >
                                <span className="flex items-center gap-1 text-xs font-semibold text-white">
                                  <Plus className="w-3.5 h-3.5" /> Add
                                </span>
                              </button>
                              <button
                                onClick={() => removeLogoFromKit(url)}
                                title="Remove"
                                className="absolute top-1 right-1 p-1 rounded-full bg-surface/90 text-red-500 opacity-0 group-hover:opacity-100 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Colors ── */}
                  {kitTab === "colors" && (
                    <div className="space-y-4">
                      <p className="text-[11px] text-gray-400">
                        Click a swatch to apply it — to the selected text layer,
                        or the canvas background.
                      </p>
                      {(kit?.palettes || []).map((p) => (
                        <div key={p.id}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-gray-600 truncate">
                              {p.name}
                            </p>
                            {p.id !== "brand" && (
                              <button
                                onClick={() => removePalette(p.id)}
                                className="text-gray-300 hover:text-red-500 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {p.colors.map((c) => (
                              <div key={c} className="group relative">
                                <button
                                  onClick={() => applyKitColor(c)}
                                  title={c}
                                  className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer"
                                  style={{ background: c }}
                                />
                                <button
                                  onClick={() =>
                                    removeColorFromPalette(p.id, c)
                                  }
                                  title="Remove"
                                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-surface border border-gray-200 text-red-500 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ))}
                            <label
                              className="w-9 h-9 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer"
                              title="Add color"
                            >
                              <Plus className="w-4 h-4" />
                              <input
                                type="color"
                                className="sr-only"
                                onChange={(e) =>
                                  addColorToPalette(p.id, e.target.value)
                                }
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={addPalette}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:border-blue-400 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> New palette
                      </button>
                    </div>
                  )}

                  {/* ── Fonts ── */}
                  {kitTab === "fonts" && (
                    <div className="space-y-4">
                      {(kit?.fonts || []).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-2">
                            Brand fonts ({kit.fonts.length})
                          </p>
                          <div className="space-y-1.5">
                            {kit.fonts.map((f) => (
                              <div
                                key={f}
                                className="group flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200"
                              >
                                <button
                                  onClick={() => applyKitFont(f)}
                                  className="text-sm text-gray-800 truncate cursor-pointer text-left flex-1"
                                  style={{ fontFamily: `'${f}', sans-serif` }}
                                  title="Apply to selected text"
                                >
                                  {f}
                                </button>
                                <button
                                  onClick={() => removeFontFromKit(f)}
                                  className="text-gray-300 hover:text-red-500 cursor-pointer ml-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-1.5">
                            Select a text layer, then click a font to apply it.
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-2">
                          Add a font
                        </p>
                        <input
                          value={fontQuery}
                          onChange={(e) => setFontQuery(e.target.value)}
                          placeholder="Search fonts…"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm mb-2 outline-none focus:border-blue-400 bg-surface text-gray-800"
                        />
                        <div className="space-y-1 max-h-64 overflow-y-auto">
                          {BRAND_FONTS.filter((f) =>
                            f.toLowerCase().includes(fontQuery.toLowerCase()),
                          ).map((f) => {
                            const added = (kit?.fonts || []).includes(f);
                            return (
                              <button
                                key={f}
                                onClick={() => addFontToKit(f)}
                                disabled={added}
                                onMouseEnter={() => loadWebFont(f)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 text-sm text-gray-700 cursor-pointer disabled:opacity-40 disabled:cursor-default"
                              >
                                <span
                                  style={{ fontFamily: `'${f}', sans-serif` }}
                                  className="truncate"
                                >
                                  {f}
                                </span>
                                {added ? (
                                  <span className="text-[11px] text-green-600">
                                    Added
                                  </span>
                                ) : (
                                  <Plus className="w-3.5 h-3.5 text-gray-400" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Import ── */}
                  {kitTab === "import" && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-800">
                        Import your brand
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Fetch logos, colors and images directly from your
                        website.
                      </p>
                      <input
                        value={kitUrl}
                        onChange={(e) => setKitUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleKitImport();
                        }}
                        placeholder="https://yourbrand.com"
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 bg-surface text-gray-800"
                      />
                      <button
                        onClick={handleKitImport}
                        disabled={kitImporting || !kitUrl.trim()}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {kitImporting && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        {kitImporting ? "Importing…" : "Import"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : activeTool === "templates" ? (
              <div className="flex flex-col max-h-full">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="font-semibold text-base text-gray-900">
                    Templates
                  </span>
                  <button
                    onClick={() => {
                      setActiveTool(null);
                      setTemplateCat(null);
                    }}
                    className="p-1 rounded hover:bg-gray-100 cursor-pointer"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                {templateCat ? (
                  (() => {
                    /* ── See all: full grid for one group ── */
                    const group = TEMPLATE_GROUPS.find(
                      (g) => g.title === templateCat,
                    );
                    if (!group) return null;
                    return (
                      <div className="p-4 overflow-y-auto">
                        <button
                          onClick={() => setTemplateCat(null)}
                          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-3 cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4 rotate-180" />{" "}
                          {group.title}
                        </button>
                        <div className="grid grid-cols-3 gap-2">
                          {group.items.map((item) => templateCard(item, false))}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <>
                    <div className="px-4 pt-3">
                      <input
                        value={templateQuery}
                        onChange={(e) => setTemplateQuery(e.target.value)}
                        placeholder="Search templates"
                        className="w-full px-3 py-2.5 rounded-xl bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                      />
                    </div>
                    <div className="p-4 space-y-5 overflow-y-auto">
                      {TEMPLATE_GROUPS.map((group) => {
                        const q = templateQuery.trim().toLowerCase();
                        const items = group.items.filter(
                          (i) =>
                            !q ||
                            i.label.toLowerCase().includes(q) ||
                            group.title.toLowerCase().includes(q),
                        );
                        if (!items.length) return null;
                        // Searching → show all matches in a grid; otherwise a
                        // horizontal carousel with scroll arrows + See all.
                        if (q) {
                          return (
                            <div key={group.title}>
                              <p className="text-xs font-semibold text-gray-600 mb-2">
                                {group.title}
                              </p>
                              <div className="grid grid-cols-3 gap-2">
                                {items.map((item) => templateCard(item, false))}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <HScrollRow
                            key={group.title}
                            title={group.title}
                            itemsKey={group.items.length}
                            onSeeAll={
                              group.items.length > 3
                                ? () => setTemplateCat(group.title)
                                : undefined
                            }
                          >
                            {group.items.map((item) => templateCard(item, true))}
                          </HScrollRow>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ) : selectedLayer?.type === "text" ? (
              // The Text panel — shown whenever a text layer is selected.
              <TextPanel
                selectedLayer={selectedLayer}
                selectedLayerId={selectedLayerId}
                updateLayer={updateLayer}
                handleSave={handleSave}
                saving={saving}
                fonts={BRAND_FONTS}
                loadWebFont={loadWebFont}
                textStyles={TEXT_STYLES}
                applyTextStyle={applyTextStyle}
                canvasSize={canvasSize}
                reorderLayer={reorderLayer}
                duplicateLayer={duplicateLayer}
                deleteLayer={deleteLayer}
                moveTextShadow={moveTextShadow}
                setMoveTextShadow={setMoveTextShadow}
                moveTextReflection={moveTextReflection}
                setMoveTextReflection={setMoveTextReflection}
              />
            ) : (
              // The Image panel — one component shared by the base image and
              // every inserted image layer (see ImagePanel + the activeImg adapter).
              <ImagePanel
                activeImg={activeImg}
                updateActiveImg={updateActiveImg}
                activeImageKind={activeImageKind}
                selectedLayer={selectedLayer}
                selectedLayerId={selectedLayerId}
                canvasSize={canvasSize}
                updateLayer={updateLayer}
                reorderLayer={reorderLayer}
                duplicateLayer={duplicateLayer}
                base={{
                  posX,
                  posY,
                  imgW,
                  imgH,
                  displayImage,
                  setPosX,
                  setPosY,
                  setImgW,
                  setImgH,
                }}
                activeSrc={activeSrc}
                activeTitle={
                  activeImageKind === "layer"
                    ? selectedLayer?.insertLabel || "Image"
                    : "Image"
                }
                insertColorable={
                  activeImageKind === "layer" && !!selectedLayer?.insertColorable
                }
                insertColor={selectedLayer?.insertColor}
                onInsertRecolor={recolorActiveInsert}
                hasActiveImage={hasActiveImage}
                alignActiveCenter={alignActiveCenter}
                alignActiveMiddle={alignActiveMiddle}
                handleSave={handleSave}
                saving={saving}
                applyingAi={applyingAi}
                handleRetouchRelight={handleRetouchRelight}
                removeBg={removeBg}
                handleRemoveBgToggle={handleRemoveBgToggle}
                openCutout={openCutout}
                fileInputRef={fileInputRef}
                layerReplaceRef={layerReplaceRef}
                expandedPanel={expandedPanel}
                togglePanel={togglePanel}
                setExpandedPanel={setExpandedPanel}
                moveShadow={moveShadow}
                setMoveShadow={setMoveShadow}
                moveReflection={moveReflection}
                setMoveReflection={setMoveReflection}
                onDeleteActive={() =>
                  activeImageKind === "layer"
                    ? deleteLayer(selectedLayer.id)
                    : handleDeleteImage()
                }
              />
            )}
          </div>
        </div>
      </div>

      {cutoutOpen && (
        <div
          className="fixed inset-0 z-[140] bg-black/70 flex flex-col items-center justify-center gap-4 p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 bg-surface rounded-xl px-4 py-2 shadow">
            <span className="text-sm font-semibold text-gray-800">
              Edit Cutout — brush to erase
            </span>
            <span className="text-xs text-gray-500">Brush</span>
            <input
              type="range"
              min={8}
              max={120}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-32 accent-blue-600"
            />
            <span className="text-xs text-gray-500 w-8">{brushSize}</span>
          </div>
          <div
            className="rounded-lg overflow-hidden"
            style={{
              backgroundImage:
                "linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)",
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0,0 10px,10px -10px,-10px 0",
              backgroundColor: "#f0f0f0",
            }}
          >
            <canvas
              ref={cutoutCanvasRef}
              className="block max-w-[78vw] max-h-[62vh] cursor-crosshair touch-none"
              onPointerDown={(e) => {
                cutoutDrawing.current = true;
                e.currentTarget.setPointerCapture?.(e.pointerId);
                eraseAt(e);
              }}
              onPointerMove={(e) => {
                if (cutoutDrawing.current) eraseAt(e);
              }}
              onPointerUp={(e) => {
                cutoutDrawing.current = false;
                e.currentTarget.releasePointerCapture?.(e.pointerId);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={drawCutoutBase}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 bg-surface hover:bg-gray-100 cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={() => setCutoutOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 bg-surface hover:bg-gray-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={applyCutout}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
