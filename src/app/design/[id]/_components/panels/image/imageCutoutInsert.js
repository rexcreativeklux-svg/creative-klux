"use client";

/**
 * imageCutoutInsert — what Magic Grab and Auto-select both need once their
 * model has finished: put the result on the canvas as its own element.
 *
 * A cut-out lands at the SOURCE element's exact box, not centred on the
 * artboard the way a fresh upload is (see `insertImageUrl` in DesignEditor).
 * That is the whole illusion of "lifting the subject out" — it has to sit
 * directly over where it came from, so nothing appears to move until it's
 * dragged. Centring it would read as a paste, not a lift.
 *
 * Colocated under panels/image: every caller is one of that folder's tool
 * sections (MagicGrabSection, AutoSelectSection). GrabTextSection's insert is
 * a different enough shape (a text element, inset rather than overlaid) that
 * it gets its own small function here too, but shares nothing with the image
 * path.
 */

import { uploadDurableUrl } from "./persistBlob";

/**
 * Place a cut-out over `source`'s box, showing it immediately as a local blob
 * URL and then swapping in the durable upload — the id is selected either way.
 *
 * @param {object} editor      useDesignEditor() return value
 * @param {object} source      the element the cut-out was lifted from
 * @param {Blob} blob          transparent PNG
 * @param {(file: File) => Promise<any>} uploadMedia
 * @param {string} [label]     alt text
 * @returns {string} the new element's id
 */
export function insertImageCutout(editor, source, blob, uploadMedia, label = "Cut-out") {
  const localUrl = URL.createObjectURL(blob);
  const id = editor.addElement({
    type: "image",
    src: localUrl,
    originalSrc: localUrl,
    alt: label,
    x: source.x,
    y: source.y,
    width: source.width,
    height: source.height,
    rotation: source.rotation || 0,
    // The cut-out covers the same box as its source, so it has to fit the same
    // way — a different mode would crop the subject just isolated.
    objectFit: source.objectFit || "cover",
  });

  // addElement already committed one undo step with the local blob as src —
  // the durable swap rides on top of it as a second, non-recorded step (same
  // shape as commitBlobToElement, but skipping its own local-blob step since
  // this element didn't exist a moment ago for that step to apply to).
  // Fire-and-forget: the cut-out is already on the canvas and selected, so the
  // caller doesn't wait on the upload.
  uploadDurableUrl(uploadMedia, blob, "cutout.png").then((url) => {
    if (url) editor.updateElement(id, { src: url, originalSrc: url }, { record: false });
  });

  return id;
}

/**
 * Place OCR'd text as a real text element, inset from the source's top-left so
 * it's immediately visible rather than hidden behind the photo it came from.
 *
 * @param {object} editor
 * @param {object} source
 * @param {string} text
 * @returns {string|null} the new element's id, or null for empty text
 */
export function insertGrabbedText(editor, source, text) {
  const content = (text || "").trim();
  if (!content) return null;

  const width = Math.max(160, Math.round((source?.width || 400) * 0.8));
  // Roughly a line per 40 characters — a starting box; the text element
  // re-measures itself as soon as it renders, same as every other text insert.
  const height = Math.max(48, Math.ceil(content.length / 40) * 28);

  return editor.addElement({
    type: "text",
    content,
    text: content,
    x: (source?.x ?? 0) + 16,
    y: (source?.y ?? 0) + 16,
    width,
    height,
    fontSize: 24,
    fontWeight: "normal",
    fill: "#111111",
    textAlign: "left",
  });
}
