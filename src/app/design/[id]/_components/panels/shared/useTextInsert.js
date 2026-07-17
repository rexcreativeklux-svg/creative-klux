"use client";

/**
 * useTextInsert — the Text panel's two-mode behaviour in one place: with a text
 * element selected, picking a font restyles it; with nothing selected, it drops
 * a new heading already in that font.
 *
 * Returns { selectedText, applyFont }.
 */
export default function useTextInsert({ insert, editor }) {
  const selectedText =
    editor.selectedElement?.type === "text" ? editor.selectedElement : null;

  const applyFont = (family) => {
    if (selectedText) {
      editor.updateElement(selectedText.id, { fontFamily: family }, { record: true });
    } else {
      insert.text({
        content: "Add a heading",
        fontSize: 48,
        fontWeight: "bold",
        fontFamily: family,
      });
    }
  };

  return { selectedText, applyFont };
}
