"use client";

/**
 * useBrandColorApply — where a picked colour lands. A shape takes it as `fill`;
 * text takes both `fill` and `color` (the two renderers read different keys);
 * with nothing selected it becomes the page background.
 *
 * Returns { applyColor, target } — `target` describes where the next click will
 * land, for the hint under the swatches.
 */
export default function useBrandColorApply({ editor, setBackground }) {
  const sel = editor?.selectedElement;

  const applyColor = (color) => {
    if (sel?.type === "shape") {
      editor.updateElement(sel.id, { fill: color }, { record: true });
    } else if (sel?.type === "text") {
      editor.updateElement(sel.id, { fill: color, color }, { record: true });
    } else {
      setBackground(color);
    }
  };

  const target =
    sel?.type === "shape" || sel?.type === "text"
      ? "the selected element"
      : "the page background";

  return { applyColor, target };
}
