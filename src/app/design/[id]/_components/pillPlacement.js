"use client";

import { useLayoutEffect, useState } from "react";

/**
 * pillPlacement — where the selection's action pill sits.
 *
 * ABOVE the selection, which is where every editor of this kind puts it: below,
 * it lands on whatever you are about to drag the bottom handle onto, and on a
 * tall element it can be a screen away from the toolbar you were just using.
 *
 * The exception is a selection near the top of the page, where above would put
 * the pill under the floating context bar — so it flips below there. The two
 * surfaces that draw a pill (SelectionChrome for one element, SelectionOverlay
 * for many) anchor it differently, so they position it themselves; what lives
 * here is the DECISION and the gap, which are the parts that must agree.
 */

/** On-screen gap between the selection box and its pill, in CSS pixels. */
export const PILL_GAP = 10;

// The pill's own height, for working out whether it fits above. A constant
// rather than a measurement: measuring it would mean rendering it in the wrong
// place for a frame first, and it only changes when the pill's design does.
const PILL_HEIGHT = 40;

/**
 * The highest a pill may be placed, in VIEWPORT coordinates: the editor header
 * (55px) plus the context bar floating below it at `top-3`. Above this it would
 * slide under the toolbar.
 */
const MIN_TOP = 112;

/**
 * Which side of the selection the pill goes on — above unless there is no room.
 *
 * Measured against the VIEWPORT, not the artboard. The first version of this
 * compared `el.y * zoom` against a constant, which asks "how far is this from
 * the top of the page?" — the wrong question. The artboard itself sits some way
 * down the stage, so an element at the very top of the page usually has plenty
 * of clear space above it, and that version flipped the pill underneath for a
 * whole band of elements that had room. Where the toolbar actually is, is a
 * screen fact, so it takes a screen measurement.
 *
 * @param {object} ref  ref to the selection's box element
 * @param {number} [reserved=0] screen px already spoken for directly above the
 *   selection — the rotate handle, for a single element. A multi-selection has
 *   none, which is why this is the caller's answer and not a constant here.
 */
export function usePillSide(ref, reserved = 0) {
  const [below, setBelow] = useState(false);

  // No dep array: this has to re-measure whenever the element moves, resizes or
  // the stage zooms, and all of those arrive as an ordinary re-render.
  //
  // set-state-in-effect is disabled deliberately. Reading layout and reacting to
  // it is what a layout effect is FOR, and there is no earlier moment to do it:
  // the answer depends on where the browser put the box. The setState is guarded
  // by an equality check, so it settles after one extra pass and does not loop.
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const top = node.getBoundingClientRect().top;
    const next = top - (PILL_HEIGHT + PILL_GAP + reserved) < MIN_TOP;
    setBelow((prev) => (prev === next ? prev : next));
  });

  return below;
}
