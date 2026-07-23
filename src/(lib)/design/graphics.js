/**
 * Graphics — the "graphic" element type: curated decorative multi-colour vectors
 * (sparkles, badges, doodles…). Unlike shapes (single-fill, recoloured per
 * element), a graphic bakes its own colours, so it reads as an illustration.
 *
 * Like charts, a graphic is a self-contained SVG rendered ONCE: the editor shows
 * it as an <img>, the PNG export rasterizes the same SVG — no drawing logic is
 * duplicated. Each entry is inner markup on a 100×100 viewBox (unless noted).
 */

export const GRAPHICS = [
  {
    key: "sparkles",
    label: "Sparkles",
    inner: `
      <path d="M50 14 C54 40 60 46 86 50 C60 54 54 60 50 86 C46 60 40 54 14 50 C40 46 46 40 50 14 Z" fill="#fbbf24"/>
      <path d="M80 8 C82 18 84 20 94 22 C84 24 82 26 80 36 C78 26 76 24 66 22 C76 20 78 18 80 8 Z" fill="#f59e0b"/>
      <path d="M22 62 C24 72 26 74 36 76 C26 78 24 80 22 90 C20 80 18 78 8 76 C18 74 20 72 22 62 Z" fill="#fcd34d"/>`,
  },
  {
    key: "star",
    label: "Star",
    inner: `<path d="M50 6 L61.8 38.2 L96 38.2 L67 59.5 L79 94 L50 72.4 L21 94 L33 59.5 L4 38.2 L38.2 38.2 Z" fill="#facc15" stroke="#eab308" stroke-width="2"/>`,
  },
  {
    key: "heart",
    label: "Heart",
    inner: `<path d="M50 88 C16 62 4 44 4 26 C4 12 16 4 28 8 C38 11 46 20 50 28 C54 20 62 11 72 8 C84 4 96 12 96 26 C96 44 84 62 50 88 Z" fill="#f43f5e"/>`,
  },
  {
    key: "bolt",
    label: "Bolt",
    inner: `<path d="M56 4 L20 56 H44 L40 96 L80 40 H54 Z" fill="#f59e0b" stroke="#d97706" stroke-width="2" stroke-linejoin="round"/>`,
  },
  {
    key: "check-badge",
    label: "Check",
    inner: `
      <circle cx="50" cy="50" r="42" fill="#22c55e"/>
      <path d="M32 52 L45 65 L70 36" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  {
    key: "sun",
    label: "Sun",
    inner: `
      <g stroke="#f59e0b" stroke-width="6" stroke-linecap="round">
        <line x1="50" y1="6" x2="50" y2="20"/>
        <line x1="50" y1="80" x2="50" y2="94"/>
        <line x1="6" y1="50" x2="20" y2="50"/>
        <line x1="80" y1="50" x2="94" y2="50"/>
        <line x1="19" y1="19" x2="29" y2="29"/>
        <line x1="71" y1="71" x2="81" y2="81"/>
        <line x1="81" y1="19" x2="71" y2="29"/>
        <line x1="29" y1="71" x2="19" y2="81"/>
      </g>
      <circle cx="50" cy="50" r="20" fill="#fbbf24"/>`,
  },
  {
    key: "arrow-doodle",
    label: "Arrow",
    inner: `
      <path d="M10 30 C40 20 70 30 84 60" fill="none" stroke="#6366f1" stroke-width="6" stroke-linecap="round"/>
      <path d="M84 60 L70 54 M84 60 L80 45" fill="none" stroke="#6366f1" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  {
    key: "underline",
    label: "Underline",
    inner: `<path d="M8 62 C34 52 66 52 92 60 C70 58 40 60 12 70 C36 66 66 66 90 72" fill="none" stroke="#6366f1" stroke-width="6" stroke-linecap="round"/>`,
  },
  {
    key: "quote",
    label: "Quote",
    inner: `
      <path d="M14 66 V44 C14 30 24 22 40 22 V34 C32 34 28 38 28 46 H40 V66 Z" fill="#c4b5fd"/>
      <path d="M56 66 V44 C56 30 66 22 82 22 V34 C74 34 70 38 70 46 H82 V66 Z" fill="#a78bfa"/>`,
  },
  {
    key: "pin",
    label: "Pin",
    inner: `
      <path d="M50 92 C50 92 80 58 80 38 A30 30 0 1 0 20 38 C20 58 50 92 50 92 Z" fill="#ef4444"/>
      <circle cx="50" cy="38" r="12" fill="#ffffff"/>`,
  },
  {
    key: "confetti",
    label: "Confetti",
    inner: `
      <rect x="14" y="20" width="12" height="12" rx="2" fill="#6366f1" transform="rotate(20 20 26)"/>
      <rect x="70" y="16" width="12" height="12" rx="2" fill="#22c55e" transform="rotate(-15 76 22)"/>
      <circle cx="82" cy="60" r="7" fill="#f59e0b"/>
      <circle cx="24" cy="70" r="7" fill="#ec4899"/>
      <rect x="48" y="66" width="12" height="12" rx="2" fill="#06b6d4" transform="rotate(35 54 72)"/>
      <circle cx="52" cy="24" r="6" fill="#facc15"/>`,
  },
  {
    key: "flower",
    label: "Flower",
    inner: `
      <g fill="#f9a8d4">
        <circle cx="50" cy="26" r="15"/>
        <circle cx="50" cy="74" r="15"/>
        <circle cx="26" cy="50" r="15"/>
        <circle cx="74" cy="50" r="15"/>
      </g>
      <circle cx="50" cy="50" r="14" fill="#fbbf24"/>`,
  },
];

const GRAPHIC_MAP = Object.fromEntries(GRAPHICS.map((g) => [g.key, g]));

/** Geometry ({ key, label, viewBox?, inner }) for a graphic key. */
export const graphicDef = (key) => GRAPHIC_MAP[key] || GRAPHICS[0];

/** The graphic as a standalone SVG string, stretched to fill the given box. */
export function graphicSVG(el) {
  const def = graphicDef(el.graphic);
  const [vw, vh] = def.viewBox || [100, 100];
  const w = Math.max(1, Math.round(el.width || vw));
  const h = Math.max(1, Math.round(el.height || vh));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${vw} ${vh}" preserveAspectRatio="none">${def.inner}</svg>`;
}

/** Fit-to-box SVG (keeps aspect) — used for the small panel previews. */
export function graphicPreviewSVG(key) {
  const def = graphicDef(key);
  const [vw, vh] = def.viewBox || [100, 100];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${vh}" preserveAspectRatio="xMidYMid meet">${def.inner}</svg>`;
}

export const graphicSVGDataURL = (el) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(graphicSVG(el))}`;

export const graphicPreviewDataURL = (key) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(graphicPreviewSVG(key))}`;
