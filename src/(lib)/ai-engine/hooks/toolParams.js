// Shared size/quality parameters for the on-device Product Photos tools.
// Kept in one place so Beautifier, Ghost Mannequin and Flat Lay stay consistent
// with each other and with the size/quality pickers the modals already show.

import { deviceMemoryGB, pickExecutionProviders } from "../core/device";

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
 * Which background-removal model tier a quality setting uses — a real visible
 * ladder: Standard → u2netp (fast), Advanced → silueta (good edges),
 * Premium → isnet (best-in-class edges, 1024px input).
 *
 * Async because the Premium pick is capability-gated: IS-Net is ~179 MB of
 * fp32 weights at a 1024px input, so it's only offered when the device has
 * WebGPU and more than 4 GB of RAM — everywhere else Premium quietly uses the
 * Advanced cutout (the resolution/upscaler/finish upgrades still apply).
 *
 * @param {"Standard"|"High"|"Ultra"} quality
 * @returns {Promise<"u2netp"|"silueta"|"isnet"|undefined>} undefined = let the
 *   device decide.
 */
export async function qualityToModelKey(quality) {
  if (quality === "Standard") return "u2netp";
  if (quality === "High") return "silueta";
  if (quality === "Ultra") {
    const mem = deviceMemoryGB();
    if (mem !== null && mem <= 4) {
      console.log(`📉 AI engine: ~${mem} GB RAM — Premium uses the Advanced cutout (silueta)`);
      return "silueta";
    }
    const providers = await pickExecutionProviders();
    if (!providers.includes("webgpu")) {
      console.log("📉 AI engine: no WebGPU — Premium uses the Advanced cutout (silueta)");
      return "silueta";
    }
    return "isnet";
  }
  return undefined;
}
