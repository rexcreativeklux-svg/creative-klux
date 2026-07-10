"use client";

/**
 * Per-tool configs for the shared {@link OnDeviceToolModal}. Each entry supplies
 * only what differs between tools: the title, sample before/after art + copy,
 * the engine hook that does the work, and (optionally) custom result/extra
 * renderers. The modal owns the whole flow (upload, size/quality, skeleton,
 * action bar, cancel, toasts, animations).
 */

import useProductBeautifier from "@/(lib)/ai-engine/hooks/useProductBeautifier";
import useGhostMannequin from "@/(lib)/ai-engine/hooks/useGhostMannequin";
import useFlatLay from "@/(lib)/ai-engine/hooks/useFlatLay";
import Mannequin3DView from "./Mannequin3DView";
import FlatLayArrange from "./FlatLayArrange";

// Pexels CDN helper (free license, stable URLs) — matches the other modals.
const px = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&h=600`;

export const ON_DEVICE_TOOLS = {
  beautifier: {
    title: "Product Beautifier",
    toolId: "beautifier",
    filePrefix: "klux-beautified",
    useTool: useProductBeautifier,
    defaultSize: "square",
    defaultQuality: "High",
    hasGenerate: true, // refine the on-device result to photoreal on the backend
    sample: {
      before: px(4856500),
      after: px(33245825),
      headline: "Get a polished, professional product image",
      subtext: "We remove the background and sharpen your product — clean and ready to sell.",
    },
  },

  mannequin: {
    title: "Ghost Mannequin",
    toolId: "mannequin",
    filePrefix: "klux-mannequin",
    useTool: useGhostMannequin,
    defaultSize: "portrait_3_4",
    defaultQuality: "High",
    hasGenerate: true, // refine the 3D preview to a photoreal worn render
    sample: {
      before: px(4109759),
      after: px(37595197),
      headline: "See your garment in an interactive 3D view",
      subtext: "We build a real depth view you can tilt-look — then refine it to a photoreal render.",
    },
    // The interactive 3D view already fills the space (you look around with the
    // cursor), so it opts out of the zoom control.
    hasZoom: false,
    // Mount the interactive WebGL 2.5D view; falls back to the flat framed image.
    renderResult: ({ tool, resultImage }) => (
      <Mannequin3DView cutoutUrl={tool.cutoutUrl} depthUrl={tool.depthUrl} fallbackSrc={resultImage} />
    ),
  },

  flatlay: {
    title: "Flat Lay",
    toolId: "flatlay",
    filePrefix: "klux-flatlay",
    useTool: useFlatLay,
    defaultSize: "square",
    defaultQuality: "High",
    // Interactive layout: re-run on size/quality (don't restore a flat cached
    // blob, which would lose the draggable layers).
    noResultCache: true,
    sample: {
      before: px(10597861),
      after: px(8408556),
      headline: "Grab every product and arrange your flat lay",
      subtext: "Upload a photo of several items — we cut each one out so you can drag them into place.",
    },
    // Custom result: the interactive arrange surface (drag/scale each item).
    renderResult: ({ tool }) => <FlatLayArrange tool={tool} />,
  },
};

/** The tool ids handled by the on-device modal (used by the page router). */
export const ON_DEVICE_TOOL_IDS = Object.keys(ON_DEVICE_TOOLS);
