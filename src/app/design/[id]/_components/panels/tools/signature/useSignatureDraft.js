"use client";

import { useState } from "react";
import { DEFAULT_SIGNATURE_FONT } from "./signatureFonts";

/**
 * useSignatureDraft — the in-progress signature behind the Create tabs.
 *
 * One draft across all three tabs, so switching Text → Upload → Text doesn't
 * lose what you typed. `ready` says whether the active tab has enough to add.
 */
export default function useSignatureDraft() {
  const [name, setName] = useState("");
  const [fontFamily, setFontFamily] = useState(DEFAULT_SIGNATURE_FONT);
  const [color, setColor] = useState("#111827");
  const [file, setFile] = useState(null);
  // Draw: each stroke is { points: [{x,y}], color, width }. Color is captured
  // per stroke so changing the ink mid-drawing does the expected thing.
  const [strokes, setStrokes] = useState([]);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [save, setSave] = useState(true);

  /** Is the given tab's input complete enough to add? */
  const ready = (tab) => {
    if (tab === "text") return name.trim().length > 0;
    if (tab === "upload") return Boolean(file);
    if (tab === "draw") return strokes.length > 0;
    return false;
  };

  return {
    name,
    setName,
    fontFamily,
    setFontFamily,
    color,
    setColor,
    file,
    setFile,
    strokes,
    setStrokes,
    strokeWidth,
    setStrokeWidth,
    save,
    setSave,
    ready,
  };
}
