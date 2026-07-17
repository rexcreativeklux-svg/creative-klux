"use client";

/**
 * Font library for the editor.
 *
 * Each font: { name, family (CSS font-family with fallback), google (URL name),
 * category }. `family` is what we store on a text element's fontFamily and what
 * both the DOM render and canvas export use.
 *
 * ensureEditorFontsLoaded() injects ONE combined Google Fonts <link> (all
 * families in a single request) so previews, the canvas, and the PNG export all
 * have the fonts available. waitForFonts() lets the exporter block until the
 * specific families it needs are actually ready.
 */

const sans = (name, google = name) => ({
  name,
  google,
  family: `'${name}', sans-serif`,
  category: "sans",
});
const serif = (name, google = name) => ({
  name,
  google,
  family: `'${name}', serif`,
  category: "serif",
});
const display = (name, google = name) => ({
  name,
  google,
  family: `'${name}', cursive`,
  category: "display",
});

export const EDITOR_FONTS = [
  sans("Inter"),
  sans("Poppins"),
  sans("Montserrat"),
  sans("Roboto"),
  sans("Open Sans"),
  sans("Lato"),
  sans("Raleway"),
  sans("Work Sans"),
  sans("Nunito"),
  sans("Rubik"),
  sans("Oswald"),
  sans("Bebas Neue"),
  sans("Anton"),
  sans("Archivo"),
  sans("Josefin Sans"),
  sans("Fredoka"),
  sans("Righteous"),
  serif("Playfair Display"),
  serif("Merriweather"),
  serif("Lora"),
  serif("PT Serif"),
  serif("DM Serif Display"),
  serif("Cormorant Garamond"),
  serif("Libre Baskerville"),
  serif("Abril Fatface"),
  display("Pacifico"),
  display("Lobster"),
  display("Dancing Script"),
  display("Caveat"),
  display("Great Vibes"),
  display("Sacramento"),
  display("Satisfy"),
  display("Permanent Marker"),
  display("Bungee"),
];

/**
 * Pre-styled text presets (Canva's "Font combinations").
 *
 * Each preset is ONE text element, so it carries one font — a text element has a
 * single fontFamily and the editor has no element grouping, so Canva's two-font
 * pairings ("COMING SOON" over a script "Stay Tuned") can't be one preset. These
 * are single-font looks; pairing means dropping two and styling the second.
 *
 * Every fontFamily here must exist in EDITOR_FONTS above, or the preset silently
 * renders in the browser's fallback font.
 */
export const FONT_COMBINATIONS = [
  // Editorial & elegant
  { name: "Golden Hour", content: "GOLDEN HOUR", fontFamily: "'Playfair Display', serif", fontSize: 60, fontWeight: 700, fill: "#b45309", textAlign: "center", letterSpacing: 3 },
  { name: "Elegant Title", content: "Title", fontFamily: "'DM Serif Display', serif", fontSize: 72, fontWeight: 400, fill: "#111111", textAlign: "center" },
  { name: "Business Model", content: "BUSINESS MODEL", fontFamily: "'Cormorant Garamond', serif", fontSize: 52, fontWeight: 700, fill: "#111111", textAlign: "center", letterSpacing: 4 },
  { name: "Behind Our Brand", content: "behind our BRAND", fontFamily: "'Libre Baskerville', serif", fontSize: 44, fontWeight: 400, fill: "#1f2937", textAlign: "center" },
  { name: "Coming Soon", content: "COMING SOON", fontFamily: "'Merriweather', serif", fontSize: 48, fontWeight: 700, fill: "#7f1d1d", textAlign: "center" },
  { name: "Spring Collection", content: "Spring Collection", fontFamily: "'Lora', serif", fontSize: 52, fontWeight: 700, fill: "#15803d", textAlign: "center" },
  { name: "Pixel", content: "Pixel", fontFamily: "'Playfair Display', serif", fontSize: 68, fontWeight: 700, fill: "#1e3a8a", textAlign: "center" },

  // Bold & loud
  { name: "Order Now", content: "Order Now!", fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, fontWeight: 400, fill: "#0ea5e9", textAlign: "center" },
  { name: "Bold Moves", content: "BOLD moves", fontFamily: "'Anton', sans-serif", fontSize: 60, fontWeight: 400, fill: "#f97316", textAlign: "center" },
  { name: "Vintage", content: "VINTAGE", fontFamily: "'Oswald', sans-serif", fontSize: 56, fontWeight: 700, fill: "#1e3a8a", textAlign: "center", letterSpacing: 2 },
  { name: "Tattoo Studio", content: "TATTOO", fontFamily: "'Abril Fatface', serif", fontSize: 64, fontWeight: 400, fill: "#111111", textAlign: "center", letterSpacing: 4 },
  { name: "Happy Birthday", content: "HAPPY BIRTHDAY", fontFamily: "'Anton', sans-serif", fontSize: 48, fontWeight: 400, fill: "#111111", textAlign: "center", letterSpacing: 1 },
  { name: "Big Sale", content: "SALE!", fontFamily: "'Permanent Marker', cursive", fontSize: 72, fontWeight: 400, fill: "#dc2626", textAlign: "center" },

  // Retro & playful
  { name: "Retro", content: "RETRO", fontFamily: "'Bungee', cursive", fontSize: 64, fontWeight: 400, fill: "#ef4444", textAlign: "center", letterSpacing: 3 },
  { name: "Glow", content: "GLOW", fontFamily: "'Bungee', cursive", fontSize: 64, fontWeight: 400, fill: "#d946ef", textAlign: "center", letterSpacing: 2 },
  { name: "Now Open", content: "NOW OPEN", fontFamily: "'Righteous', sans-serif", fontSize: 56, fontWeight: 400, fill: "#7c3aed", textAlign: "center" },
  { name: "Like & Subscribe", content: "LIKE & SUBSCRIBE", fontFamily: "'Fredoka', sans-serif", fontSize: 44, fontWeight: 700, fill: "#f59e0b", textAlign: "center" },
  { name: "Comic Cartoon", content: "COMIC CARTOON", fontFamily: "'Fredoka', sans-serif", fontSize: 44, fontWeight: 700, fill: "#06b6d4", textAlign: "center" },
  { name: "Nice To Meet You", content: "nice to meet you!", fontFamily: "'Fredoka', sans-serif", fontSize: 48, fontWeight: 600, fill: "#fb923c", textAlign: "center" },

  // Script & handwritten
  { name: "Sweet", content: "Sweet", fontFamily: "'Dancing Script', cursive", fontSize: 72, fontWeight: 700, fill: "#ec4899", textAlign: "center" },
  { name: "Groovy", content: "Groovy", fontFamily: "'Pacifico', cursive", fontSize: 64, fontWeight: 400, fill: "#ef4444", textAlign: "center" },
  { name: "Shine & Sparkle", content: "Shine & Sparkle!", fontFamily: "'Lobster', cursive", fontSize: 56, fontWeight: 400, fill: "#ec4899", textAlign: "center" },
  { name: "Sparkle", content: "Sparkle", fontFamily: "'Great Vibes', cursive", fontSize: 72, fontWeight: 400, fill: "#f59e0b", textAlign: "center" },
  { name: "Thank You", content: "Thank you!", fontFamily: "'Satisfy', cursive", fontSize: 64, fontWeight: 400, fill: "#fb7185", textAlign: "center" },
  { name: "Engaged", content: "engaged!", fontFamily: "'Dancing Script', cursive", fontSize: 72, fontWeight: 700, fill: "#111111", textAlign: "center" },
  { name: "Bride & Groom", content: "Bride & Groom", fontFamily: "'Cormorant Garamond', serif", fontSize: 56, fontWeight: 600, fill: "#14532d", textAlign: "center" },
  { name: "Handwritten Note", content: "shares are appreciated!", fontFamily: "'Caveat', cursive", fontSize: 48, fontWeight: 700, fill: "#16a34a", textAlign: "center" },
];

/**
 * Build the combined Google Fonts css2 href for all families.
 * Note: no explicit weight axis — many display fonts (Pacifico, Bebas Neue,
 * Anton…) ship 400 only, and one unsupported weight makes css2 reject the
 * ENTIRE combined request. Plain families always resolve; bold uses faux-bold.
 */
function googleFontsHref() {
  const fams = EDITOR_FONTS.map(
    (f) => `family=${f.google.replace(/ /g, "+")}`,
  ).join("&");
  return `https://fonts.googleapis.com/css2?${fams}&display=swap`;
}

let injected = false;
/** Inject the combined fonts stylesheet once (idempotent). */
export function ensureEditorFontsLoaded() {
  if (injected || typeof document === "undefined") return;
  injected = true;
  const id = "ck-editor-fonts";
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = googleFontsHref();
  document.head.appendChild(link);
}

/**
 * Wait until the given font-family strings are usable (for canvas export).
 * Best-effort: resolves after loads settle or a short timeout.
 */
export async function waitForFonts(families, sizes = [16, 700]) {
  if (typeof document === "undefined" || !document.fonts) return;
  ensureEditorFontsLoaded();
  const uniq = [...new Set(families.filter(Boolean))];
  await Promise.all(
    uniq.flatMap((fam) =>
      [400, 700].map((w) =>
        document.fonts.load(`${w} 24px ${fam}`).catch(() => {}),
      ),
    ),
  );
}
