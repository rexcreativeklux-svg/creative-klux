"use client";

/**
 * Which part of the app a workflow runs in — the icon every workflow card
 * carries, whether or not it touches an outside platform.
 *
 * ⚠️ WHY THIS EXISTS. A card's icon row used to be its `platforms` alone, so a
 * brand-kit audit, a background cleanup or a library score — real work, just
 * work that never leaves the app — drew an empty row and read as a card someone
 * forgot to finish. The row is answering "what does this touch?", and for those
 * workflows the honest answer was never "nothing"; it was Brand Kits, Product
 * Studio, Magic Studio.
 *
 * ⚠️ DERIVED FROM THE CATEGORY, NOT HAND-TAGGED PER IDEA. The categories in
 * ./ideas.js already ARE the product surfaces, one each, in sidebar order — so
 * the mapping is a fact about the taxonomy rather than 36 fields to keep in
 * step. Icons match the primary sidebar's, so a workflow's badge is the same
 * glyph as the nav item it would send you to.
 *
 * Shape matches (lib)/integrations/platforms.jsx — `name`, `Icon`, `iconBg` —
 * so a surface and a platform can be rendered by near-identical chips.
 */

import {
  Palette,
  Share2,
  Megaphone,
  Brain,
  BookImage,
  Sparkles,
} from "lucide-react";

/**
 * `blurb` is what the surface lets a copilot DO, in one line — it is the body of
 * the cards on the Plugins screen's Skills tab. Written as capability ("build
 * and audit brand kits"), not as a page description, because that tab is
 * answering "what can this copilot reach for?" rather than "where would this
 * take me?".
 */
export const CATEGORY_SURFACES = {
  Brand: {
    name: "Brand Kits",
    Icon: Palette,
    iconBg: "#2563eb",
    blurb: "Read your kit's colors, fonts, logo and voice — and flag work that drifts from them.",
  },
  Social: {
    name: "Social Content",
    Icon: Share2,
    iconBg: "#059669",
    blurb: "Draft posts, size them per platform, and load them into your calendar.",
  },
  Ads: {
    name: "Ads Content",
    Icon: Megaphone,
    iconBg: "#f97316",
    blurb: "Build ad sets, variants and headlines, and stage them ready to run.",
  },
  Performance: {
    name: "Ad Intelligence",
    Icon: Brain,
    iconBg: "#e11d48",
    blurb: "Score creatives, watch competitors, and call which ad to scale or cut.",
  },
  Product: {
    name: "Product Studio",
    Icon: BookImage,
    iconBg: "#7c3aed",
    blurb: "Clean up product photos, stage them in bulk, and turn them into video.",
  },
  Studio: {
    name: "Magic Studio",
    Icon: Sparkles,
    iconBg: "#0891b2",
    blurb: "Generate images, voiceovers and video from a prompt or a script.",
  },
};
