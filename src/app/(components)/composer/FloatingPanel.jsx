"use client";

// app/(components)/composer/FloatingPanel.jsx
// ─────────────────────────────────────────────────────────────────────────────
// A toolbar menu/panel drawn on top of everything, anchored to its button.
//
// The composer's edit column scrolls, so a panel positioned inside it is
// clipped at that column's edge whatever its z-index — the emoji picker and
// the stock grid disappeared under the errors box. This portals the panel to
// <body> with fixed positioning instead, above the composer (z 90), placed
// under its button — or above it when there isn't room below — and kept
// inside the window. It follows the button on scroll and resize.
//
// Positioning writes straight to the element's style (no state), so it adds
// no re-renders.

import { useLayoutEffect } from "react";
import { createPortal } from "react-dom";

const GAP = 8;
const MARGIN = 8;

/**
 * @param {object} props
 * @param {React.RefObject<HTMLElement>} props.anchorRef  The button it hangs from.
 * @param {React.RefObject<HTMLElement>} props.panelRef   Set on the panel — the
 *   caller uses it too, so a click inside counts as inside.
 * @param {string} [props.className]
 * @param {number} [props.zIndex=110]
 */
export default function FloatingPanel({ anchorRef, panelRef, className = "", zIndex = 110, children }) {
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const place = () => {
      const anchor = anchorRef.current?.getBoundingClientRect();
      if (!anchor) return;
      const { offsetWidth: w, offsetHeight: h } = panel;
      const below = window.innerHeight - anchor.bottom;
      const above = anchor.top;
      // Below the button by default; above when it only fits there (or fits
      // better there) — the editor's toolbar can sit low in the window.
      const top =
        below >= h + GAP + MARGIN || below >= above
          ? Math.min(anchor.bottom + GAP, window.innerHeight - h - MARGIN)
          : Math.max(MARGIN, anchor.top - h - GAP);
      const left = Math.max(MARGIN, Math.min(anchor.left, window.innerWidth - w - MARGIN));
      panel.style.top = `${Math.max(MARGIN, top)}px`;
      panel.style.left = `${left}px`;
      panel.style.visibility = "visible";
    };
    place();
    const resize = new ResizeObserver(place);
    resize.observe(panel);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true); // any scroll container
    return () => {
      resize.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchorRef, panelRef]);

  return createPortal(
    <div
      ref={panelRef}
      className={className}
      style={{ position: "fixed", top: 0, left: 0, zIndex, visibility: "hidden" }}
    >
      {children}
    </div>,
    document.body,
  );
}
