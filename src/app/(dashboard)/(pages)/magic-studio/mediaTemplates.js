/**
 * mediaTemplates.js
 * ─────────────────────────────────────────────────────────────────────────────
 * The Templates canvas for the Image and Video tools — a hundred to a tool, none
 * shared between tools, shuffled on every visit like the stock and design ones.
 *
 * ── ⚠️ THE MEDIA IS PEXELS, NOT OUR OUTPUT ───────────────────────────────────
 * Same standing as textToImageTemplates.js: free-licence clips and photos
 * (pexels.com/license) standing in for our own renders, each with copy written
 * to describe it. Swap in our own generations when we have them.
 *
 * ── ⚠️ LOADED ON DEMAND, ONE TOOL AT A TIME ──────────────────────────────────
 * Nine catalogs of a hundred entries is most of a megabyte of prompt text, and
 * every tool shares one route. Imported up front, opening Text to Audio would
 * download the scripts for Script to Voiceover. So each catalog is its own
 * chunk under ./templates and is fetched when its tool's page mounts — which is
 * why this file exposes a hook rather than the arrays themselves.
 *
 * ── What a template hands the composer ──────────────────────────────────────
 * These tools take more than words, so Use carries more than a prompt:
 *
 *   prompt        what lands in the text box — the prompt, the script, or the
 *                 optional description, whichever that tool's box is
 *   values        option values to set alongside it. ⚠️ Every one must be a
 *                 `value` the tool's own config offers (magicStudioConfigs.jsx)
 *                 — a made-up one is sent as-is and selects nothing in the panel
 *   sourceImage   the picture to select as the tool's source image
 *   sourceVideo   the clip to select as the tool's source video
 *   video         the clip the card plays while it is on screen
 *
 * ── Adding one ──────────────────────────────────────────────────────────────
 * Add an entry to the tool's file under ./templates. A clip needs its Pexels
 * id, real width / height / duration, the `poster` URL without its query
 * string, and one `video` file link — both exactly as the Pexels API returns
 * them, because neither can be rebuilt from the id (the file name carries the
 * rendition's size and frame rate). A photo needs only its id and real size.
 */

import { useEffect, useState } from "react";
import { templatesFor } from "./textToImageTemplates";

/** A Pexels image (a photo, or a clip's poster frame) at a given width. */
const sized = (url, width) => `${url}?auto=compress&cs=tinysrgb&w=${width}`;

const photoUrl = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg`;

/**
 * The composer `ratio` nearest a clip's own shape, so what gets made isn't
 * cropped out of the frame the template showed.
 */
const ratioFor = ({ width, height }) => {
  if (width > height * 1.15) return "landscape";
  if (height > width * 1.15) return "portrait";
  return "square";
};

/**
 * Which tools have a catalog here, and what Use does with an entry's media.
 *
 *   source   "image" — the photo / poster frame becomes the source image
 *            "video" — the clip itself becomes the source video
 *            absent  — the media is only a picture of the result
 *   ratio    set the composer's Aspect ratio from the clip's own shape. Only
 *            on tools that HAVE that option.
 */
const CATALOGS = {
  image_to_variations: {
    load: () => import("./templates/imageToVariations"),
    source: "image",
  },
  persona_generator: {
    load: () => import("./templates/personaGenerator"),
  },
  text_to_video: {
    load: () => import("./templates/textToVideo"),
    ratio: true,
  },
  image_to_video: {
    load: () => import("./templates/imageToVideo"),
    source: "image",
    ratio: true,
  },
  script_to_voiceover: {
    load: () => import("./templates/scriptToVoiceover"),
    ratio: true,
  },
  digital_human: {
    load: () => import("./templates/digitalHuman"),
    source: "image",
  },
  video_effects: {
    load: () => import("./templates/videoEffects"),
    source: "image",
  },
  video_background_remover: {
    load: () => import("./templates/videoBackgroundRemover"),
    source: "video",
  },
  video_enhancer: {
    load: () => import("./templates/videoEnhancer"),
    source: "video",
  },
};

/** A raw catalog entry in the shape the Templates canvas reads. */
const shape = (toolId, spec, entry) => {
  const clip = !!entry.video;
  const still = clip ? entry.poster : photoUrl(entry.pexelsId);
  return {
    ...entry,
    id: `${toolId}-${entry.pexelsId}`,
    thumb: sized(still, 600),
    image: sized(still, 1600),
    source: `https://www.pexels.com/${clip ? "video" : "photo"}/${entry.pexelsId}/`,
    aspect: `${entry.width} / ${entry.height}`,
    formatLabel: entry.formatLabel || null,
    values: {
      ...(spec.ratio ? { ratio: ratioFor(entry) } : {}),
      ...entry.values,
    },
    ...(spec.source === "image" ? { sourceImage: sized(still, 1600) } : {}),
    ...(spec.source === "video" ? { sourceVideo: entry.video } : {}),
  };
};

/** Shaped catalogs, kept so coming back to a tool doesn't reshape or refetch. */
const loaded = new Map();

/**
 * Whether a tool has a Templates canvas at all — known at once, without loading
 * anything, because the page has to decide which canvas to open on before the
 * catalog can possibly have arrived.
 */
export const hasTemplates = (toolId) =>
  !!templatesFor(toolId) || toolId in CATALOGS;

/**
 * A tool's templates: the array, or null while its catalog is on its way (and
 * for good on a tool that has none — ask {@link hasTemplates} to tell which).
 *
 * The stock and design catalogs are bundled and answer on the first render.
 */
export function useToolTemplates(toolId) {
  const bundled = templatesFor(toolId);
  const [fetched, setFetched] = useState(() => loaded.get(toolId) || null);

  useEffect(() => {
    const spec = CATALOGS[toolId];
    if (!spec || loaded.has(toolId)) return undefined;

    // The page remounts per tool, but a slow chunk can still land after the
    // user has moved on — this keeps it from setting state on the way out.
    let live = true;
    spec
      .load()
      .then((module) => {
        const templates = module.default.map((entry) =>
          shape(toolId, spec, entry),
        );
        loaded.set(toolId, templates);
        if (live) setFetched(templates);
      })
      .catch((err) => {
        console.error(`❌ [magic-studio] templates for ${toolId} failed:`, err);
        // An empty canvas rather than a skeleton that never resolves.
        if (live) setFetched([]);
      });
    return () => {
      live = false;
    };
  }, [toolId]);

  return bundled || fetched;
}
