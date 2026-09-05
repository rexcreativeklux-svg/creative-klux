"use client";

/**
 * Per-tool configs for the shared {@link OnDeviceToolModal}. Each entry supplies
 * only what differs between tools: the title, sample before/after art + copy,
 * the engine hook that does the work, and (optionally) custom result/extra
 * renderers. The modal owns the whole flow (upload, size/quality, skeleton,
 * action bar, cancel, toasts, animations).
 *
 * `backendFirst` picks which engine LEADS — the one knob that decides a tool's
 * whole character:
 *   • true  → Generate calls /product-studio/generate and only touches the
 *     on-device engine if that call never landed (offline/timeout/5xx). Costs a
 *     credit and needs a login. See OnDeviceToolModal's `runBackend`.
 *   • false → the tool is on-device ONLY: nothing is uploaded, nothing is
 *     charged, and it works for guests. The backend is not involved at all.
 *
 * Flipping the flag is the whole migration: the modal reads it for the footer
 * action, the prompt/brand-style fields (backend-only inputs) and the fallback.
 */

import useProductBeautifier from "@/(lib)/ai-engine/hooks/useProductBeautifier";
import useFlatLay from "@/(lib)/ai-engine/hooks/useFlatLay";
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
    hasGenerate: true,
    // Backend leads: the picked photo goes to `product_beautifier` and the
    // on-device engine is the safety net for an unreachable/faulting API.
    backendFirst: true,
    generateLabel: "Generate photorealistic",
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

  // Ghost Mannequin is now an API-only tool with its own modal
  // (GhostMannequinModal) + generation history — it no longer runs on-device, so
  // it lives outside this on-device config.

  flatlay: {
    title: "Flat Lay",
    toolId: "flatlay",
    filePrefix: "klux-flatlay",
    useTool: useFlatLay,
    defaultSize: "square",
    defaultQuality: "High",
    hasGenerate: true,
    // On-device ONLY — deliberately not backend-first. This tool's product IS
    // the interactive arrange surface below: `grabObjects` splits the cutout
    // into individually draggable items and the swatch row re-flattens them
    // live. A backend render is a single flat image, so leading with it would
    // leave FlatLayArrange with nothing to drag and the swatches inert. Footer
    // "Generate" therefore runs the local pipeline.
    backendFirst: false,
    generateLabel: "Generate flat lay",
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
