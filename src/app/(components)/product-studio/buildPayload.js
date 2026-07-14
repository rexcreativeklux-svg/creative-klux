// Assembles the structured "Generate" (photoreal) payload each on-device tool
// sends to the backend, per docs/product-studio-payloads.md. The on-device tools
// prep the image locally; Generate is the optional refinement step that turns the
// prepped result into a photorealistic render on the backend GPU.
//
// NOTE: there is no image-gen service wired yet (the old base44 client was
// removed), so `generateImage` currently throws — the shell surfaces this
// gracefully. This module keeps the payload shape correct so it's drop-in ready
// the moment a backend/endpoint is connected.

/** Quality tier → resolution the backend should target (matches the modals). */
const QUALITY_RES = { Standard: "standard", High: "high", Ultra: "ultra" };

/**
 * Build the Generate payload for a tool.
 *
 * @param {"beautifier"|"mannequin"|"flatlay"} toolId
 * @param {object} ctx
 * @param {string[]} ctx.imageUrls Uploaded prepped-result URL(s).
 * @param {"Standard"|"High"|"Ultra"} ctx.quality
 * @param {string} ctx.sizeId Aspect-ratio id (matches the size picker).
 * @param {string} [ctx.prompt] Optional user refinement text.
 * @param {boolean} [ctx.applyBrandStyle=false]
 * @returns {object} The request body to POST to the generate endpoint.
 */
export function buildPayload(
  toolId,
  { imageUrls, quality, sizeId, prompt = "", applyBrandStyle = false },
) {
  const base = {
    tool: toolId,
    image_urls: imageUrls,
    quality: QUALITY_RES[quality] || "high",
    size: sizeId,
    apply_brand_style: applyBrandStyle,
    prompt,
  };
  // Beautifier / Mannequin / Flat Lay carry only the shared fields today. Extra
  // per-tool fields (e.g. Virtual Model's model/pose) are added by those tools.
  return base;
}
