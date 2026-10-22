// The Product Studio preset catalogue — every section and tile on the landing
// page, modelled on Photoroom's home screen (measured from its own templates:
// canvas sizes, where the product sits, shadows, colours).
//
// ONE source for both sides: the landing page draws each tile from its entry
// here (StudioPresetTile), and the photo editor applies the same entry when it
// opens with `?preset=<id>` (PhotoEditor → applyStudioPreset). So a tile always
// previews what it makes.
//
// Three kinds of tile, as on Photoroom:
//
//   mode "photo"     Classic, Photo Editing Classics. Asks for a photo first;
//                    the canvas is the photo, its background is removed and
//                    the look goes on top.
//   mode "template"  Studio, Essentials, Trending, Marble & Wood, Professional,
//                    Profile Pics, Minimal Shop, Simple Fashion. Opens STRAIGHT
//                    into the editor with a sample product already placed in
//                    the template's slot; the editor's Replace swaps the user's
//                    photo into that slot (cut out and fitted to the same box).
//   mode "size"      Marketplaces, Social Networks, Blank canvas. An empty
//                    white canvas at the target size; an added photo is cut out
//                    and centred in it.
//
// Preset fields (all optional except id / label / mode):
//   canvas   {w, h} export size in px (template / size)
//   slot     {cx, cy, s} where the product goes — centre as a fraction of the
//            canvas, and `s` the largest share of the canvas it may fill
//   sample   the product a template opens with (a transparent cutout)
//   bg       {type:"color", value} | {type:"image", src, filter} |
//            {type:"photo", filter} (the user's own photo, behind its cutout) |
//            {type:"none"} (transparent)
//   removeBg false keeps the photo whole (Original Image)
//   filter   a filter id on the product (editorShared FILTERS)
//   shadow   {mode:"drop"|"floor", opacity, x, y, blur, shortness} — x / y as
//            a fraction of the canvas width
//   round    circular crop (Profile Pics)
//   texts    [{text, cx, cy, w, size, color, weight, font, bg, radius,
//            align, spacing}] — editable text layers; `size` is the font size
//            as a fraction of the canvas height, `w` the box as a fraction of
//            its width

import { px } from "./presetSections";

const SAMPLE = (name) => `/images/product-studio/samples/${name}.webp`;
export const SAMPLES = {
  sneaker: SAMPLE("sneaker"),
  sneakers: SAMPLE("sneakers"),
  tee: SAMPLE("tee"),
  bag: SAMPLE("bag"),
  headshot: SAMPLE("headshot"),
};

/** The Google Fonts the designs use — loaded by both the page and the editor. */
export const PRESET_FONTS = [
  "Caveat",
  "Special Elite",
  "Anton",
  "Playfair Display",
  "Bebas Neue",
  "DM Sans",
  "Archivo Black",
];

// ── SVG backdrops ──────────────────────────────────────────────────────────
// Designs whose colour blocks sit BEHIND the product are drawn as one SVG and
// used as the canvas background: the editor stacks overlay layers above the
// product, so a panel can only be behind it by being part of the background.

const svgUrl = (w, h, inner) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`,
  )}`;

/** `#rrggbb` mixed toward white (t > 0) or black (t < 0). */
function tint(hex, t) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (v) => Math.round(t >= 0 ? v + (255 - v) * t : v * (1 + t));
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/**
 * Photoroom's studio sweep: the colour, a faint dark falloff at the top and a
 * soft light pool where the product stands.
 */
function studioBackdrop(color, w = 1512, h = 2016) {
  return svgUrl(
    w,
    h,
    `<defs>
      <radialGradient id="top" cx="50%" cy="-8%" r="75%"><stop offset="0" stop-color="#000" stop-opacity="0.07"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <radialGradient id="floor" cx="50%" cy="78%" r="55%"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="${color}"/>
    <rect width="100%" height="100%" fill="url(#top)"/>
    <rect width="100%" height="100%" fill="url(#floor)"/>`,
  );
}

// ── Sections ───────────────────────────────────────────────────────────────

const classic = {
  id: "classic",
  title: "Classic",
  mode: "photo",
  items: [
    { id: "classic-white", label: "White", bg: { type: "color", value: "#ffffff" } },
    { id: "classic-black", label: "Black", bg: { type: "color", value: "#000000" } },
    { id: "classic-transparent", label: "Transparent", bg: { type: "none" } },
    { id: "classic-original", label: "Original Image", bg: { type: "none" }, removeBg: false },
  ],
};

const STUDIO_COLORS = [
  ["white", "Studio white", "#f4f4f3"],
  ["grey", "Studio grey", "#dcdcdc"],
  ["beige", "Studio beige", "#ece3d6"],
  ["yellow", "Studio pastel yellow", "#f6efcd"],
  ["orange", "Studio pastel orange", "#f1d3bd"],
  ["green", "Studio pastel green", "#dbe8d3"],
  ["blue", "Studio pastel blue", "#d8e5f1"],
  ["pink", "Studio pastel pink", "#f3dbe0"],
];

const studio = {
  id: "studio",
  title: "Studio",
  mode: "template",
  items: STUDIO_COLORS.map(([id, label, color]) => ({
    id: `studio-${id}`,
    label,
    swatch: color,
    sample: SAMPLES.sneaker,
    canvas: { w: 1512, h: 2016 },
    slot: { cx: 0.5, cy: 0.69, s: 0.53 },
    bg: { type: "image", src: studioBackdrop(color) },
    shadow: { mode: "floor", opacity: 38, blur: 16, shortness: 72 },
  })),
};

const ESSENTIAL_COLORS = [
  ["transparent", "Transparent", null],
  ["white", "White", "#ffffff"],
  ["n01", "Neutral 01", "#f8f8f8"],
  ["n02", "Neutral 02", "#f2f0ed"],
  ["n03", "Neutral 03", "#ebe7e1"],
  ["n04", "Neutral 04", "#e3ded6"],
  ["n05", "Neutral 05", "#d9d3c9"],
  ["n06", "Neutral 06", "#cdc6ba"],
  ["n07", "Neutral 07", "#bfb7aa"],
  ["n08", "Neutral 08", "#aea597"],
  ["darkgrey", "Dark grey", "#444444"],
  ["black", "Black", "#000000"],
];

const essentials = {
  id: "essentials",
  title: "Essentials",
  mode: "template",
  items: ESSENTIAL_COLORS.map(([id, label, color]) => ({
    id: `essentials-${id}`,
    label,
    swatch: color,
    sample: SAMPLES.tee,
    canvas: { w: 1512, h: 1512 },
    slot: { cx: 0.5, cy: 0.51, s: 0.79 },
    bg: color ? { type: "color", value: color } : { type: "none" },
  })),
};

const photoClassics = {
  id: "photo-classics",
  title: "Photo Editing Classics",
  mode: "photo",
  items: [
    { id: "pec-blur", label: "Blur", preview: "blur", bg: { type: "photo", filter: "blur(10px)" } },
    { id: "pec-splash", label: "Color Splash", preview: "splash", bg: { type: "photo", filter: "grayscale(1)" } },
    {
      id: "pec-motion",
      label: "Motion",
      preview: "motion",
      // CSS has no directional blur; a stronger soft blur with a touch of
      // darkening is the closest a filter string gets to a motion smear.
      bg: { type: "photo", filter: "blur(7px) brightness(0.97)" },
    },
    {
      id: "pec-lowkey",
      label: "Low key",
      preview: "lowkey",
      bg: { type: "photo", filter: "blur(3px) grayscale(1) brightness(0.42) contrast(1.4)" },
      filter: "lowkey",
    },
    {
      id: "pec-highkey",
      label: "High key",
      preview: "highkey",
      bg: { type: "photo", filter: "grayscale(1) brightness(1.45) contrast(0.8)" },
      filter: "highkey",
    },
    {
      id: "pec-sepia",
      label: "Sepia",
      preview: "sepia",
      bg: { type: "photo", filter: "sepia(0.78) contrast(1.05) brightness(1.02)" },
      filter: "sepia",
    },
    {
      id: "pec-bw",
      label: "Black & White",
      preview: "bw",
      bg: { type: "photo", filter: "grayscale(1) contrast(1.1)" },
      filter: "mono",
    },
  ],
};

// ── Trending — finished designs with a product slot ─────────────────────────

const T = (text, cx, cy, size, extra = {}) => ({
  text,
  cx,
  cy,
  size,
  w: 0.86,
  color: "#111111",
  weight: "700",
  align: "center",
  ...extra,
});

const trendingDesigns = [
  {
    id: "tr-sitewide-sale",
    label: "Sitewide Sale",
    sample: SAMPLES.sneaker,
    canvas: { w: 1080, h: 1080 },
    slot: { cx: 0.5, cy: 0.52, s: 0.48 },
    bg: {
      type: "image",
      src: svgUrl(
        1080,
        1080,
        `<rect width="1080" height="1080" fill="#d7e9ee"/>
         <rect x="236" y="196" width="608" height="740" rx="6" fill="#000" opacity="0.08" transform="translate(10 14)"/>
         <rect x="236" y="196" width="608" height="740" rx="6" fill="#ffffff"/>
         <rect x="272" y="232" width="536" height="560" fill="#eef2f3"/>`,
      ),
    },
    shadow: { mode: "drop", opacity: 30, x: 0.008, y: 0.014, blur: 10 },
    texts: [
      T("Sitewide Sale", 0.5, 0.1, 0.1, { font: "Caveat", weight: "500" }),
      T("USE CODE: 25OFF", 0.5, 0.8, 0.045, { font: "Special Elite", weight: "400" }),
    ],
  },
  {
    id: "tr-latest-arrival",
    label: "Latest Arrival",
    sample: SAMPLES.sneakers,
    canvas: { w: 1080, h: 1350 },
    slot: { cx: 0.5, cy: 0.42, s: 0.7 },
    bg: {
      type: "image",
      src: svgUrl(
        1080,
        1350,
        `<rect width="1080" height="1350" fill="#ff5a1f"/>
         <circle cx="540" cy="560" r="400" fill="#ff7a45"/>
         <circle cx="540" cy="560" r="300" fill="#ff9466"/>`,
      ),
    },
    shadow: { mode: "drop", opacity: 35, x: 0.01, y: 0.02, blur: 12 },
    texts: [
      T("NEW COLLECTION", 0.5, 0.07, 0.03, { color: "#ffffff", font: "DM Sans", spacing: 6 }),
      T("LATEST", 0.5, 0.79, 0.11, { color: "#ffffff", font: "Anton", weight: "400" }),
      T("ARRIVAL", 0.5, 0.9, 0.11, { color: "#ffffff", font: "Anton", weight: "400" }),
    ],
  },
  {
    id: "tr-black-friday",
    label: "Black Friday",
    sample: SAMPLES.bag,
    canvas: { w: 1080, h: 1080 },
    slot: { cx: 0.5, cy: 0.56, s: 0.5 },
    bg: {
      type: "image",
      src: svgUrl(
        1080,
        1080,
        `<rect width="1080" height="1080" fill="#0b0b0b"/>
         <circle cx="540" cy="600" r="330" fill="#1f1f1f"/>`,
      ),
    },
    shadow: { mode: "drop", opacity: 60, x: 0, y: 0.02, blur: 18 },
    texts: [
      T("BLACK FRIDAY", 0.5, 0.12, 0.12, { color: "#ffffff", font: "Anton", weight: "400" }),
      T("UP TO 70% OFF", 0.5, 0.9, 0.045, {
        color: "#0b0b0b",
        bg: "#facc15",
        radius: 40,
        w: 0.62,
        font: "Archivo Black",
        weight: "400",
      }),
    ],
  },
  {
    id: "tr-new-in",
    label: "New In",
    sample: SAMPLES.bag,
    canvas: { w: 1080, h: 1350 },
    slot: { cx: 0.5, cy: 0.56, s: 0.55 },
    bg: {
      type: "image",
      src: svgUrl(
        1080,
        1350,
        `<rect width="1080" height="1350" fill="#efe9e1"/>
         <rect x="0" y="1010" width="1080" height="340" fill="#e2d8cb"/>`,
      ),
    },
    shadow: { mode: "floor", opacity: 35, blur: 14, shortness: 80 },
    texts: [
      T("NEW IN", 0.5, 0.1, 0.075, { font: "Playfair Display", weight: "500", spacing: 10 }),
      T("SHOP ONLINE", 0.5, 0.17, 0.022, { font: "DM Sans", weight: "500", spacing: 8, color: "#6b6258" }),
    ],
  },
  {
    id: "tr-summer",
    label: "Summer Collection",
    sample: SAMPLES.sneakers,
    canvas: { w: 1080, h: 1080 },
    slot: { cx: 0.5, cy: 0.5, s: 0.66 },
    bg: {
      type: "image",
      src: svgUrl(
        1080,
        1080,
        `<rect width="1080" height="1080" fill="#2f8f4e"/>
         <circle cx="540" cy="560" r="380" fill="#f7d33c"/>`,
      ),
    },
    shadow: { mode: "drop", opacity: 35, x: 0.01, y: 0.02, blur: 10 },
    texts: [
      T("SUMMER", 0.5, 0.84, 0.09, { color: "#ffffff", font: "Anton", weight: "400" }),
      T("COLLECTION", 0.5, 0.93, 0.04, { color: "#ffffff", font: "DM Sans", weight: "700", spacing: 8 }),
    ],
  },
  {
    id: "tr-back-to-school",
    label: "Back to School",
    sample: SAMPLES.bag,
    canvas: { w: 1080, h: 1350 },
    slot: { cx: 0.5, cy: 0.62, s: 0.55 },
    bg: {
      type: "image",
      src: svgUrl(
        1080,
        1350,
        `<rect width="1080" height="1350" fill="#1d9bd7"/>
         <rect x="90" y="400" width="900" height="860" rx="40" fill="#ffffff" opacity="0.18"/>`,
      ),
    },
    shadow: { mode: "drop", opacity: 35, x: 0.01, y: 0.02, blur: 12 },
    texts: [
      T("BACK TO", 0.5, 0.11, 0.09, { color: "#ffe14d", font: "Archivo Black", weight: "400" }),
      T("SCHOOL SALE", 0.5, 0.2, 0.09, { color: "#ffffff", font: "Archivo Black", weight: "400" }),
    ],
  },
  {
    id: "tr-review",
    label: "Customer Review",
    sample: SAMPLES.tee,
    canvas: { w: 1080, h: 1350 },
    slot: { cx: 0.5, cy: 0.66, s: 0.56 },
    bg: {
      type: "image",
      src: svgUrl(
        1080,
        1350,
        `<rect width="1080" height="1350" fill="#4f6f52"/>
         <rect x="120" y="90" width="840" height="300" rx="28" fill="#ffffff"/>`,
      ),
    },
    shadow: { mode: "floor", opacity: 40, blur: 14, shortness: 78 },
    texts: [
      T("★★★★★", 0.5, 0.115, 0.04, { color: "#f5a524", font: "DM Sans" }),
      T("“So amazing, I love this product. Best purchase this year.”", 0.5, 0.19, 0.034, {
        w: 0.66,
        font: "Playfair Display",
        weight: "500",
      }),
      T("— Sasha C.", 0.5, 0.26, 0.022, { font: "DM Sans", weight: "500", color: "#6b7280" }),
    ],
  },
  {
    id: "tr-minimal-perfume",
    label: "Minimal Studio",
    sample: SAMPLES.sneaker,
    canvas: { w: 1080, h: 1080 },
    slot: { cx: 0.5, cy: 0.6, s: 0.62 },
    bg: { type: "image", src: studioBackdrop("#e9e4dd", 1080, 1080) },
    shadow: { mode: "floor", opacity: 40, blur: 14, shortness: 75 },
    texts: [
      T("Pure Form", 0.3, 0.1, 0.06, { font: "Playfair Display", weight: "500", align: "left", w: 0.5 }),
      T("NEW SEASON ESSENTIALS", 0.3, 0.17, 0.022, {
        font: "DM Sans",
        weight: "500",
        align: "left",
        w: 0.5,
        spacing: 4,
        color: "#6b6258",
      }),
    ],
  },
];

const trending = {
  id: "trending",
  title: "Trending",
  mode: "template",
  items: trendingDesigns,
};

// Marble & Wood — the product standing on a real surface, Photoroom-sized: big
// and a little right of centre, with a firm drop shadow.
const MARBLE_IDS = [4968690, 1906440, 4087266, 34520234, 8251873, 5864348, 8187053, 7814958, 5827769, 12310576];
const marbleWood = {
  id: "marble-wood",
  title: "Marble & Wood",
  mode: "template",
  items: MARBLE_IDS.map((id, i) => ({
    id: `marble-${id}`,
    label: `Texture ${i + 1}`,
    sample: SAMPLES.bag,
    thumb: px(id, 400),
    canvas: { w: 2000, h: 2000 },
    slot: { cx: 0.56, cy: 0.56, s: 0.74 },
    bg: { type: "image", src: px(id, 2000) },
    shadow: { mode: "drop", opacity: 70, x: 0.03, y: 0.038, blur: 10 },
  })),
};

const PROFESSIONAL_COLORS = [
  "#ffffff",
  "#fbfaf8",
  "#f5f2ec",
  "#efece5",
  "#eae5db",
  "#e6ded1",
  "#f0e7dd",
  "#f2e0d4",
  "#eed6c8",
  "#e8cdbd",
  "#dfc0ae",
  "#d3b3a1",
];
const professional = {
  id: "professional",
  title: "Professional Product Visuals",
  mode: "template",
  items: PROFESSIONAL_COLORS.map((color, i) => ({
    id: `pro-${i + 1}`,
    label: `Professional ${i + 1}`,
    swatch: color,
    sample: SAMPLES.tee,
    canvas: { w: 2000, h: 2000 },
    slot: { cx: 0.5, cy: 0.5, s: 0.69 },
    bg: { type: "color", value: color },
    shadow: { mode: "floor", opacity: 45, blur: 10, shortness: 88 },
  })),
};

const PROFILE_COLORS = [
  ["sunset", "#ff7a59"],
  ["violet", "#7c3aed"],
  ["pink", "#ec4899"],
  ["amber", "#f59e0b"],
  ["sky", "#0ea5e9"],
  ["ink", "#111827"],
  ["teal", "#14b8a6"],
  ["lime", "#84cc16"],
  ["red", "#ef4444"],
  ["indigo", "#6366f1"],
  ["slate", "#94a3b8"],
  ["peach", "#fdba8c"],
];
const profile = {
  id: "profile",
  title: "Profile Pictures",
  mode: "template",
  items: PROFILE_COLORS.map(([id, color]) => ({
    id: `profile-${id}`,
    label: id[0].toUpperCase() + id.slice(1),
    swatch: color,
    sample: SAMPLES.headshot,
    canvas: { w: 1080, h: 1080 },
    slot: { cx: 0.5, cy: 0.56, s: 0.92 },
    round: true,
    bg: {
      type: "image",
      src: svgUrl(
        1080,
        1080,
        `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${tint(color, 0.35)}"/><stop offset="1" stop-color="${tint(color, -0.15)}"/></linearGradient></defs><rect width="1080" height="1080" fill="url(#g)"/>`,
      ),
    },
  })),
};

// ── "More" — Photoroom's Minimal Shop and Simple Fashion rails ──────────────

const MINIMAL_COLORS = ["#efe3ea", "#f8dcd4", "#d9efe3", "#eeeeea", "#e3e3e3", "#fde3cf", "#fbf6d8", "#d6eedd", "#f4f4f4", "#e5e9ed", "#ece6dc"];
const minimalShop = {
  id: "minimal-shop",
  title: "Minimal Shop",
  mode: "template",
  items: MINIMAL_COLORS.map((color, i) => ({
    id: `minimal-${i + 1}`,
    label: `Minimal ${i + 1}`,
    swatch: color,
    sample: SAMPLES.bag,
    canvas: { w: 1080, h: 1080 },
    slot: { cx: 0.5, cy: 0.54, s: 0.6 },
    bg: { type: "image", src: studioBackdrop(color, 1080, 1080) },
    shadow: { mode: "floor", opacity: 40, blur: 14, shortness: 78 },
    texts:
      i % 3 === 2
        ? [
            T("ARCHIBALD", 0.5, 0.12, 0.08, { font: "Playfair Display", weight: "500", color: "#ffffff", spacing: 6 }),
            T("COLLECTION AUTUMN / WINTER", 0.5, 0.91, 0.022, { font: "DM Sans", weight: "500", color: "#ffffff", spacing: 4 }),
          ]
        : undefined,
  })),
};

const simpleFashion = {
  id: "simple-fashion",
  title: "Simple Fashion",
  mode: "template",
  items: [
    {
      id: "sf-new-item",
      label: "New Item",
      sample: SAMPLES.bag,
      canvas: { w: 1080, h: 1080 },
      slot: { cx: 0.5, cy: 0.6, s: 0.55 },
      bg: {
        type: "image",
        src: svgUrl(1080, 1080, `<rect width="1080" height="1080" fill="#123f2f"/><ellipse cx="540" cy="880" rx="330" ry="60" fill="#0c2d21"/>`),
      },
      shadow: { mode: "drop", opacity: 45, x: 0, y: 0.015, blur: 12 },
      texts: [
        T("NEW ITEM", 0.5, 0.11, 0.08, { color: "#ffffff", font: "Playfair Display", weight: "500", spacing: 6 }),
        T("Leather Bag  /  $100", 0.5, 0.19, 0.03, { color: "#d6e7df", font: "DM Sans", weight: "500" }),
      ],
    },
    {
      id: "sf-new-in",
      label: "New In",
      sample: SAMPLES.bag,
      canvas: { w: 1080, h: 1080 },
      slot: { cx: 0.5, cy: 0.6, s: 0.58 },
      bg: { type: "image", src: studioBackdrop("#e4e4e4", 1080, 1080) },
      shadow: { mode: "floor", opacity: 40, blur: 14, shortness: 80 },
      texts: [
        T("NEW IN", 0.5, 0.1, 0.07, { font: "Playfair Display", weight: "500", spacing: 10 }),
        T("SHOP ONLINE", 0.5, 0.17, 0.022, { font: "DM Sans", weight: "500", spacing: 8, color: "#6b7280" }),
      ],
    },
    {
      id: "sf-new-tee",
      label: "Essential Tee",
      sample: SAMPLES.tee,
      canvas: { w: 1080, h: 1350 },
      slot: { cx: 0.5, cy: 0.55, s: 0.6 },
      bg: { type: "image", src: studioBackdrop("#f1ece4", 1080, 1350) },
      shadow: { mode: "floor", opacity: 40, blur: 14, shortness: 80 },
      texts: [
        T("THE ESSENTIAL TEE", 0.5, 0.08, 0.04, { font: "Bebas Neue", weight: "400", spacing: 6 }),
        T("$29", 0.5, 0.92, 0.05, { font: "DM Sans", weight: "700" }),
      ],
    },
    {
      id: "sf-step",
      label: "Step Out",
      sample: SAMPLES.sneaker,
      canvas: { w: 1080, h: 1080 },
      slot: { cx: 0.5, cy: 0.55, s: 0.72 },
      bg: {
        type: "image",
        src: svgUrl(1080, 1080, `<rect width="1080" height="1080" fill="#111111"/><rect x="0" y="700" width="1080" height="380" fill="#1c1c1c"/>`),
      },
      shadow: { mode: "drop", opacity: 60, x: 0, y: 0.02, blur: 14 },
      texts: [T("STEP OUT IN STYLE", 0.5, 0.12, 0.06, { color: "#ffffff", font: "Bebas Neue", weight: "400", spacing: 4 })],
    },
  ],
};

// ── Sizes ───────────────────────────────────────────────────────────────────

const ICON = (name) => `/images/resize/${name}.webp`;
const size = (id, label, w, h, icon, listing = false) => ({ id: `size-${id}`, label, w, h, icon, listing });

const marketplaces = {
  id: "marketplaces",
  title: "Marketplaces",
  mode: "size",
  items: [
    size("fb-marketplace", "Facebook Marketplace", 1080, 1080, ICON("facebook"), true),
    size("ebay", "eBay", 1600, 1600, ICON("ebay"), true),
    size("poshmark", "Poshmark", 1080, 1080, null, true),
    size("depop", "Depop", 1280, 1280, null, true),
    size("mercari", "Mercari", 1080, 1080, null, true),
    size("mercadolibre", "Mercado Libre", 1200, 1200, null, true),
    size("shopee", "Shopee", 1024, 1024, null, true),
    size("lazada", "Lazada", 1000, 1000, null, true),
    size("etsy-square", "Etsy Square", 2000, 2000, ICON("etsy"), true),
    size("etsy-landscape", "Etsy Landscape", 2700, 2025, ICON("etsy"), true),
    size("vinted", "Vinted", 1080, 1440, null, true),
    size("amazon", "Amazon", 2000, 2000, ICON("amazon"), true),
    size("shopify", "Shopify", 2048, 2048, ICON("shopify"), true),
  ],
};

const social = {
  id: "social",
  title: "Social Networks",
  mode: "size",
  items: [
    size("ig-story", "Instagram Story", 1080, 1920, ICON("instagram")),
    size("ig-post", "Instagram Post", 1080, 1080, ICON("instagram")),
    size("ig-portrait", "Instagram Portrait", 1080, 1350, ICON("instagram")),
    size("ig-reel", "Instagram Reel", 1080, 1920, ICON("instagram")),
    size("tiktok", "TikTok Post", 1080, 1920, ICON("tiktok")),
    size("yt-thumb", "YouTube Thumbnail", 1280, 720, ICON("youtube")),
    size("yt-art", "YouTube Channel Art", 2560, 1440, ICON("youtube")),
    size("fb-cover", "Facebook Cover", 820, 312, ICON("facebook")),
    size("fb-post", "Facebook Post", 1200, 630, ICON("facebook")),
    size("li-banner", "LinkedIn Banner", 1584, 396, ICON("linkedin")),
    size("li-post", "LinkedIn Post", 1200, 627, ICON("linkedin")),
    size("pinterest", "Pinterest Pin", 1000, 1500, ICON("pinterest")),
    size("x-post", "X Post", 1600, 900, ICON("twitter")),
  ],
};

const blank = {
  id: "blank",
  title: "Start from a blank canvas",
  mode: "size",
  items: [
    { id: "size-custom", label: "Custom size", custom: true },
    size("landscape", "Landscape", 2016, 1512, ICON("landscape")),
    size("portrait", "Portrait", 1512, 2016, ICON("portrait")),
    size("square", "Square", 1512, 1512, ICON("square")),
  ],
};

/**
 * The landing page's rails in order. `fold: true` rails sit behind "Show more",
 * like Photoroom's.
 */
export const STUDIO_SECTIONS = [
  classic,
  studio,
  essentials,
  { ...photoClassics, fold: true },
  { ...trending, fold: true },
  { ...marbleWood, fold: true },
  { ...professional, fold: true },
  { ...profile, fold: true },
  { ...marketplaces, fold: true },
  { ...social, fold: true },
  { ...blank, fold: true },
  { ...minimalShop, fold: true },
  { ...simpleFashion, fold: true },
];

const BY_ID = new Map(
  STUDIO_SECTIONS.flatMap((section) =>
    section.items.map((item) => [item.id, { ...item, mode: section.mode, section: section.id }]),
  ),
);

/**
 * A preset by id, with its section's mode folded in. A custom size travels as
 * `size-custom-<w>x<h>`. Null for an unknown id.
 *
 * @param {string} id
 */
export function studioPresetById(id) {
  if (!id) return null;
  const custom = /^size-custom-(\d+)x(\d+)$/.exec(id);
  if (custom) {
    const w = Number(custom[1]);
    const h = Number(custom[2]);
    return { id, label: `Custom ${w}×${h}`, mode: "size", section: "blank", w, h };
  }
  return BY_ID.get(id) || null;
}

/** Where a tile sends the user. */
export const presetHref = (id) => `/edit_a_photo?mode=start&preset=${encodeURIComponent(id)}`;
