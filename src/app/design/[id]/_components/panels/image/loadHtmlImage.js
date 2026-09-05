"use client";

import { proxiedSrc } from "@/(lib)/design/renderDesign";

/**
 * loadHtmlImage — decode a src into an `<img>` element, ready for
 * `drawImage`/`getImageData`.
 *
 * Shared by the tool sections that need pixels rather than just a `src`
 * string to hand a `<img>` tag (Auto-select, Grab Text, Bg Scene): each reads
 * the selected image's own natural size or composites it onto a canvas, and
 * `canvas.getImageData` throws on a cross-origin image that hasn't been
 * requested with CORS — hence routing anything that isn't already a data: URL
 * through the same proxy the stage and exporter use.
 */
export function loadHtmlImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const isData = src.startsWith("data:");
    if (!isData) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load that image."));
    img.src = isData ? src : proxiedSrc(src);
  });
}
