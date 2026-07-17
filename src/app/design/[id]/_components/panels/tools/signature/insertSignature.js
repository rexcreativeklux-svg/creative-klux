/**
 * How a signature lands on the canvas — one rule, shared by the saved list and
 * the Create flow so they can't diverge.
 *
 * A text signature goes on as a TEXT element, not a rasterised image: it stays
 * crisp at any zoom, exports through the normal text path, and needs no upload
 * (which matters while storage quota is a hard limit). Uploaded and drawn
 * signatures are genuinely images and go on as image elements.
 *
 * @param {{kind: "text"|"image", name?, fontFamily?, color?, src?}} sig
 * @param {object} insert — the editor's insert API
 */
export function insertSignature(sig, insert) {
  if (sig.kind === "image") {
    if (sig.src) insert.imageUrl(sig.src);
    return;
  }

  insert.text({
    content: sig.name,
    fontFamily: sig.fontFamily,
    fill: sig.color,
    fontSize: 64,
    fontWeight: 400,
    textAlign: "center",
  });
}
