import { EDITOR_FONTS } from "@/(lib)/design/fonts";

// The handwriting/script faces from the editor's library, most signature-like
// first. Drawn from EDITOR_FONTS (rather than listed independently) so they're
// covered by ensureEditorFontsLoaded and can't reference a font we never load.
const SIGNATURE_FONT_NAMES = [
  "Great Vibes",
  "Sacramento",
  "Dancing Script",
  "Satisfy",
  "Caveat",
  "Pacifico",
  "Lobster",
  "Permanent Marker",
];

/** @type {{name: string, family: string}[]} */
export const SIGNATURE_FONTS = SIGNATURE_FONT_NAMES.map((name) =>
  EDITOR_FONTS.find((f) => f.name === name),
).filter(Boolean);

export const DEFAULT_SIGNATURE_FONT = SIGNATURE_FONTS[0]?.family;
