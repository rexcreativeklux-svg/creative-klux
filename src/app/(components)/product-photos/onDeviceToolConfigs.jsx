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
import BackgroundSwatchRow from "./BackgroundSwatchRow";

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
      subtext: "We color-boost, sharpen and upscale your photo — the product's original background is kept as-is.",
    },
    // No background swatches here: Beautifier only beautifies the product and
    // always keeps the photo's original background (it never removes or swaps
    // it). Background swapping lives in the Background Remover tool instead.
  },

  mannequin: {
    title: "Ghost Mannequin",
    toolId: "mannequin",
    filePrefix: "klux-mannequin",
    useTool: useGhostMannequin,
    defaultSize: "portrait_3_4",
    defaultQuality: "High",
    hasGenerate: true, // refine the 3D preview to a photoreal worn render
    // API-only for now: the on-device 3D pipeline is disabled — the user picks
    // an image (nothing runs) then hits "Generate photorealistic" to render via
    // the backend. Flip this off to bring back the on-device 3D preview below.
    apiOnly: true,
    sample: {
      before: px(4109759),
      after: px(37595197),
      headline: "See your garment in an interactive 3D view",
      subtext: "We build a real depth mesh you can drag-rotate — then refine it to a photoreal render.",
    },
    // Zoom is live in the 2D view; the 3D canvas ("mannequin-3d") is excluded
    // from pan AND wheel — there the pointer rotates the garment instead.
    zoomExcluded: ["mannequin-3d"],
    wheelExcluded: ["mannequin-3d"],
    // Mount the interactive WebGL 3D view (drag-rotate mesh, 2D/3D toggle);
    // falls back to the flat framed image.
    renderResult: ({ tool, resultImage }) => (
      <Mannequin3DView
        setAngleExporter={tool.setAngleExporter}
        cutoutUrl={tool.cutoutUrl}
        depthUrl={tool.depthUrl}
        fallbackSrc={resultImage}
      />
    ),
  },

  flatlay: {
    title: "Flat Lay",
    toolId: "flatlay",
    filePrefix: "klux-flatlay",
    useTool: useFlatLay,
    defaultSize: "square",
    defaultQuality: "High",
    hasGenerate: true, // refine the arranged flat lay to photoreal on the backend
    // Item drags and the context menu must never pan the zoom surface.
    zoomExcluded: ["flatlay-item", "flatlay-menu"],
    sample: {
      before: px(10597861),
      after: px(8408556),
      headline: "Grab every product and arrange your flat lay",
      subtext: "Upload a photo of several items — we cut each one out so you can drag them into place.",
    },
    // Custom result: the interactive arrange surface (drag/scale each item).
    renderResult: ({ tool }) => <FlatLayArrange tool={tool} />,
    // Floating swatch row under the canvas: matched + curated plain backgrounds
    // (right-click an item for its own transparent download).
    renderOverlay: ({ tool, busy }) => (
      <BackgroundSwatchRow
        backgrounds={tool.backgrounds}
        value={tool.background}
        onChange={tool.setBackground}
        disabled={busy}
        showAuto={false}
      />
    ),
  },
};

/** The tool ids handled by the on-device modal (used by the page router). */
export const ON_DEVICE_TOOL_IDS = Object.keys(ON_DEVICE_TOOLS);
