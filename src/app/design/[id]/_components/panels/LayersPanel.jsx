"use client";

import React from "react";
import LayersTab from "./position/LayersTab";

/**
 * LayersPanel — the rail's Layers tab.
 *
 * The list itself is the Position panel's Layers tab, rendered here as well. It
 * used to be a second, separate implementation: same stack, different rows,
 * different affordances (that one couldn't drag to restack; this one had no
 * previews), and the two answered "what order are these in?" differently as soon
 * as either changed. One list, two doors.
 */
export default function LayersPanel({ editor }) {
  return <LayersTab editor={editor} element={editor?.selectedElement} />;
}
