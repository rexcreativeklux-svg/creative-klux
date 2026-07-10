// Shared size/quality parameters for the on-device Product Photos tools.
// Kept in one place so Beautifier, Ghost Mannequin and Flat Lay stay consistent
// with each other and with the size/quality pickers the modals already show.

/** Aspect ratios keyed by the modal's size ids (mirrors the existing SIZES list). */
export const SIZE_RATIOS = {
  original: { w: 1, h: 1 }, // treated as square when we have no source ratio
  portrait_9_16: { w: 9, h: 16 },
  portrait_3_4: { w: 3, h: 4 },
  portrait_2_3: { w: 2, h: 3 },
  square: { w: 1, h: 1 },
  landscape_3_2: { w: 3, h: 2 },
  landscape_4_3: { w: 4, h: 3 },
  landscape_16_9: { w: 16, h: 9 },
};

/** Human labels + resolution chips for the quality picker (Standard/High/Ultra). */
export const QUALITY_RES = { Standard: "1K", High: "2K", Ultra: "4K" };

/**
 * Which background-removal model tier a quality setting uses: the tiny fast
 * model for Standard, the higher-quality edges model otherwise. (The device's
 * own low-RAM check can still downgrade further inside the task.)
 *
 * @param {"Standard"|"High"|"Ultra"} quality
 * @returns {"u2netp"|"silueta"|undefined} undefined = let the device decide.
 */
export function qualityToModelKey(quality) {
  if (quality === "Standard") return "u2netp";
  if (quality === "High" || quality === "Ultra") return "silueta";
  return undefined;
}
