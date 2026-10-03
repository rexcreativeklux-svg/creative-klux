// Generates the link-preview card and the app icons from the real logo files.
//
//   npm run og-image
//
// Outputs (all committed — re-run only when the brand or copy changes):
//   public/og-image.jpg          1200×630 JPEG — og:image / twitter:image
//   public/icon-192.png          web manifest icon
//   public/icon-512.png          web manifest icon (also the JSON-LD logo)
//   public/icon-maskable-512.png manifest "maskable" icon (logo inside the safe zone)
//   public/apple-touch-icon.png  180×180, opaque (iOS ignores transparency)
//
// Why JPEG at 1200×630: WhatsApp is the strictest preview scraper — it drops
// WebP/SVG and oversized images silently. If you change the copy, keep it in
// step with SITE in src/(lib)/site.js.
//
// Text is rendered by librsvg (inside sharp) with whatever system font matches
// the font-family stack below, so output can differ slightly between machines.
// Look at the result after regenerating.

import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = (f) => path.join(root, "public", f);

// Brand palette — the auth showcase tags (AuthShowcasePanel.jsx).
const BLUE = "#1447e6";
const SKY = "#0ea5e9";
const INDIGO = "#6366f1";
const VIOLET = "#8b5cf6";
const NAVY = "#070b1a";

const FONT = "Inter, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
const W = 1200;
const H = 630;
const X = 80; // left safe margin

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const CHIPS = [
  ["Ad Creatives", BLUE],
  ["Social Posts", INDIGO],
  ["Brand Design", SKY],
  ["Magic Studio", VIOLET],
];

function chipsSvg(y) {
  let x = X;
  return CHIPS.map(([label, color]) => {
    const w = Math.round(label.length * 11.2 + 44);
    const out = `
      <rect x="${x}" y="${y}" width="${w}" height="44" rx="22" fill="${color}" fill-opacity="0.16" stroke="${color}" stroke-opacity="0.7"/>
      <circle cx="${x + 20}" cy="${y + 22}" r="5" fill="${color}"/>
      <text x="${x + 32}" y="${y + 29}" font-family="${FONT}" font-size="19" font-weight="600" fill="#ffffff" fill-opacity="0.92">${esc(label)}</text>`;
    x += w + 12;
    return out;
  }).join("");
}

const background = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="g1" cx="0.82" cy="0.18" r="0.55">
      <stop offset="0" stop-color="${BLUE}" stop-opacity="0.5"/>
      <stop offset="1" stop-color="${BLUE}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="0.95" cy="0.95" r="0.5">
      <stop offset="0" stop-color="${VIOLET}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${VIOLET}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g3" cx="0.05" cy="1" r="0.45">
      <stop offset="0" stop-color="${SKY}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${SKY}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="hl" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#5b8cff"/>
      <stop offset="1" stop-color="#38bdf8"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" fill="none" stroke="#ffffff" stroke-opacity="0.045"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="${NAVY}"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#g1)"/>
  <rect width="${W}" height="${H}" fill="url(#g2)"/>
  <rect width="${W}" height="${H}" fill="url(#g3)"/>

  <text font-family="${FONT}" font-weight="800" font-size="78" letter-spacing="-2" fill="#ffffff">
    <tspan x="${X}" y="262">Launch ads that</tspan>
    <tspan x="${X}" y="350" fill="url(#hl)">stop the scroll.</tspan>
  </text>
  <text font-family="${FONT}" font-size="28" fill="#ffffff" fill-opacity="0.68">
    <tspan x="${X}" y="414">AI ads, social posts and brand design —</tspan>
    <tspan x="${X}" y="452">create and publish from one workspace.</tspan>
  </text>

  ${chipsSvg(500)}

  <text x="${W - X}" y="${H - 40}" text-anchor="end" font-family="${FONT}" font-size="20" font-weight="600" fill="#ffffff" fill-opacity="0.55">app.creativeklux.com</text>
</svg>`;

async function main() {
  // logo-white.svg is a Canva export with a light background box baked in
  // (full-viewBox #ffffff and #f4f4f4 paths) — strip it so the white wordmark
  // sits on the dark card.
  const wordmarkSvg = (await readFile(pub("logo-white.svg"), "utf8")).replace(
    /<path fill="#(?:ffffff|f4f4f4)" d="M 0\.988281 0 L 149\.011719 0[^>]*\/>/g,
    "",
  );
  const wordmark = await sharp(Buffer.from(wordmarkSvg), { density: 600 })
    .resize({ height: 80 })
    .png()
    .toBuffer();

  // The logo mark, oversized, bleeding off the right edge, with a soft halo so
  // the blue reads against the blue glow behind it.
  const markSize = 470;
  const markSvg = await readFile(pub("logoblue.svg"));
  const mark = await sharp(markSvg, { density: 900 })
    .resize(markSize, markSize)
    .modulate({ brightness: 1.25 })
    .png()
    .toBuffer();
  const halo = await sharp(markSvg, { density: 300 })
    .resize(markSize, markSize)
    .extend({ top: 60, bottom: 60, left: 60, right: 60, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .tint("#7aa2ff")
    .blur(40)
    .ensureAlpha()
    .linear([1, 1, 1, 0.55], [0, 0, 0, 0])
    .png()
    .toBuffer();
  const markLeft = W - markSize + 30;
  const markTop = 60;

  await sharp(Buffer.from(background))
    .composite([
      { input: halo, left: markLeft - 60, top: markTop - 60 },
      { input: mark, left: markLeft, top: markTop },
      { input: wordmark, left: X - 4, top: 62 },
    ])
    .flatten({ background: NAVY })
    .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(pub("og-image.jpg"));

  // ── Icons ──────────────────────────────────────────────────────────────────
  const icon = (size, pad, bg) =>
    sharp(markSvg, { density: 1200 })
      .resize(size - pad * 2, size - pad * 2)
      .extend({ top: pad, bottom: pad, left: pad, right: pad, background: bg })
      .flatten(bg.alpha === 0 ? false : { background: bg })
      .png({ compressionLevel: 9 });

  const clear = { r: 0, g: 0, b: 0, alpha: 0 };
  const white = { r: 255, g: 255, b: 255, alpha: 1 };
  await icon(192, 8, clear).toFile(pub("icon-192.png"));
  await icon(512, 20, clear).toFile(pub("icon-512.png"));
  await icon(512, 92, white).toFile(pub("icon-maskable-512.png")); // ~80% safe zone
  await icon(180, 22, white).toFile(pub("apple-touch-icon.png"));

  const meta = await sharp(pub("og-image.jpg")).metadata();
  const { size } = await import("node:fs").then((fs) => fs.statSync(pub("og-image.jpg")));
  console.log(`og-image.jpg ${meta.format} ${meta.width}x${meta.height} ${(size / 1024).toFixed(0)}KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
