// app/(dashboard)/(pages)/studio/ai-chat-page/designActions.js
//
// What the ⋯ menu on a preview card does — Preview, Edit, Publish, Download —
// for BOTH kinds of design the chat shows:
//
//   · Magic Designs carry a hosted file (the image layer's src, or `v.src` for
//     a video), so they are downloaded / previewed / published from that URL,
//     exactly like a Magic Studio history tile.
//   · Creatives (redesign / create-design) are only a { canvas, elements } layout.
//     There is no file until one is painted, so each action renders it first —
//     with the Scraive text conversion, the same way DesignCanvas paints it.

import {
  renderDesignToBlob,
  renderDesignToDataUrl,
} from "@/(lib)/design/renderDesign";
import { fromScraiveElements } from "@/(lib)/design/scraiveCompat";
import {
  downloadImageUrl,
  galleryFileMeta,
} from "@/app/(components)/product-studio/saveToGallery";

/** Is this a Magic Design (a hosted file), rather than a layout to paint? */
export const isMagicVariation = (v) => v?.source === "magic";

/** "image" | "video" — what a Magic Design's file is. */
export const mediaTypeOf = (v) => (v?.kind === "video" ? "video" : "image");

/** A Magic Design's hosted file URL, or null for a creative. */
export function hostedUrlOf(v) {
  if (!isMagicVariation(v)) return null;
  if (v.kind === "video") return v.src || null;
  return v.elements?.find((el) => el.type === "image")?.src || null;
}

/** File extension / MIME / gallery category for a Magic Design's file. */
export const galleryMetaFor = (v) =>
  galleryFileMeta(hostedUrlOf(v), mediaTypeOf(v));

/**
 * The { canvas, elements } to paint — in OUR element format. A redesign is a
 * Scraive layout, and handing its raw elements to the renderer re-centres its
 * text; this is the same conversion DesignCanvas and saveDesign apply.
 */
export function paintableDesign(v) {
  return {
    canvas: v.canvas,
    elements: fromScraiveElements(v.elements || [], {
      text: v.source === "scraive",
    }),
  };
}

/** The creative type saveDesign is given — see the Save button's note. */
export const saveTypeFor = (creativeType) =>
  !creativeType || creativeType === "general" ? "ads" : creativeType;

/**
 * Which platforms PublishModal offers. A Magic result is "all", as in Magic
 * Studio; a creative follows the chat it was made in.
 */
export function publishCategoryFor(v, creativeType) {
  if (isMagicVariation(v)) return "all";
  if (creativeType === "ads_creative") return "ads";
  if (creativeType === "social_creative") return "social";
  return "all";
}

/**
 * Something the Lightbox can show: the hosted file for a Magic Design, a
 * painted PNG for a creative. Null when a creative won't paint.
 */
export async function lightboxItemFor(v) {
  const url = hostedUrlOf(v);
  if (url) return { id: v.id, url, type: mediaTypeOf(v), alt: v.name, variation: v };
  const painted = await renderDesignToDataUrl(paintableDesign(v), {
    type: "image/png",
  });
  return painted
    ? { id: v.id, url: painted, type: "image", alt: v.name, variation: v }
    : null;
}

/** Download a design as a real file. Throws with a readable message. */
export async function downloadVariation(v) {
  const url = hostedUrlOf(v);
  if (url) {
    const { ext } = galleryMetaFor(v);
    await downloadImageUrl(url, { filePrefix: "magic", ext });
    return;
  }

  const blob = await renderDesignToBlob(paintableDesign(v));
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  const slug = String(v.name || "design")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  a.download = `${slug || "design"}-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

/**
 * The id of the design row a single-design saveDesign() just created.
 *
 * POST /creative-designs answers (confirmed against the live API):
 *   { message: "1 creative(s) saved successfully.",
 *     creatives: [ { id: 311, name, canvas, thumbnail, … } ] }
 * — one row per design sent, in order. The `data` wrapper the OTHER design
 * endpoints use is still accepted, in case this one is brought in line; null
 * makes the caller look the row up by name instead (see saveOne).
 */
export function savedDesignId(data) {
  const payload = data?.data ?? data;
  const row = Array.isArray(payload)
    ? payload[0]
    : Array.isArray(payload?.creatives)
      ? payload.creatives[0]
      : payload;
  return row?.id ?? null;
}
