"use client";

import useTextInsert from "../shared/useTextInsert";
import { comboFontQueries, comboOnPage } from "./templates/buildCombo";
import { lookById, lookContent, lookElement, lookPatch } from "./looks/lookStyle";

/**
 * How long a pick waits for its faces before measuring anyway. Boxes hug their
 * words, so measuring in the fallback face would size them for the wrong font —
 * but a stalled request mustn't make the click do nothing.
 */
const FONT_WAIT_MS = 4000;

/** Resolve once these faces (CSS font shorthands) have loaded, or the wait runs out. */
function fontsReady(queries) {
  if (typeof document === "undefined" || !document.fonts || !queries.length) return Promise.resolve();
  const loads = Promise.all(queries.map((q) => document.fonts.load(q).catch(() => null)));
  return Promise.race([loads, new Promise((resolve) => setTimeout(resolve, FONT_WAIT_MS))]);
}

/**
 * useTextTools — what the Text panel does, in one place:
 *   applyFont   restyle the selected text, or drop a heading in that font
 *   applyLook   dress the selected text in an Effects look, or add new text wearing it
 *   removeLook  take the look off the selected text
 *   insertCombo drop a Templates design as its separate parts, all selected
 *
 * Returns { selectedText, activeLook, applyFont, applyLook, removeLook, insertCombo }.
 */
export default function useTextTools({ insert, editor }) {
  const { selectedText, applyFont } = useTextInsert({ insert, editor });
  const activeLook = lookById(selectedText?.textLook?.id);

  const applyLook = async (look) => {
    const family = look.base.fontFamily;
    const query = `${look.base.fontStyle || "normal"} ${look.base.fontWeight || 400} 40px '${family}'`;

    if (selectedText) {
      const words = selectedText.content ?? selectedText.text ?? "";
      const patch = lookPatch(look, selectedText.fontSize || 40, words);
      editor.updateElement(selectedText.id, { ...patch, text: patch.content }, { record: true });
      return;
    }

    await fontsReady([query]);
    const { width, height } = editor.canvas;
    const fontSize = Math.max(24, Math.round(Math.min(width, height) * 0.09));
    editor.addElement(
      lookElement(look, { content: lookContent(look), fontSize, cx: width / 2, cy: height / 2 }),
    );
  };

  const removeLook = () => {
    if (!selectedText) return;
    editor.updateElement(selectedText.id, { textLook: null, textEffect: null }, { record: true });
  };

  const insertCombo = async (combo) => {
    await fontsReady(comboFontQueries(combo));
    editor.addElements(comboOnPage(combo, editor.canvas));
  };

  return { selectedText, activeLook, applyFont, applyLook, removeLook, insertCombo };
}
