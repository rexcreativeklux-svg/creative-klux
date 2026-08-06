"use client";

import React, { useLayoutEffect, useRef } from "react";

/**
 * MagicOptionDropdown — an option chooser ("Visual style", "Aspect ratio", …)
 * as a floating panel anchored to its row, the same shape the Magic Studio modal
 * uses (FloatingPanel in MagicStudioModal.jsx).
 *
 * The editor's panel column is 300px and the option cards want ~340–380px to
 * read properly, so the panel is `fixed` and opens BESIDE the row — over the
 * canvas — flipping to the other side when it would run past the viewport edge.
 *
 * Desktop only. Below `lg` the sidebar is a bottom sheet and there's nowhere to
 * fly out to, so the row expands in place instead (see MagicToolTab).
 *
 * Position is written straight onto the node in a layout effect rather than held
 * in state: it depends on measuring the panel itself, so state would mean a
 * second render every time it opens (and the panel is painted only once the
 * numbers are known — it starts hidden, never flashing at the wrong spot).
 *
 * The anchor arrives as the caller's ref MAP plus the key to look up, not as an
 * element: that keeps the parent from reading `ref.current` while rendering,
 * which is both a React rule and a lint error here. The lookup happens in the
 * effect, where refs are fair game.
 *
 * Props: { anchorRefs, anchorKey, width, onClose, children }
 */
export default function MagicOptionDropdown({
  anchorRefs,
  anchorKey,
  width = 340,
  onClose,
  children,
}) {
  const panelRef = useRef(null);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    const anchorEl = anchorRefs?.current?.[anchorKey];
    if (!anchorEl || !panel) return;

    const place = () => {
      const r = anchorEl.getBoundingClientRect();
      const pw = panel.offsetWidth || width;
      const ph = panel.offsetHeight;
      const margin = 12;

      // Prefer the canvas side of the row; flip back over the panel if the
      // window is too narrow for it, then clamp so it can't leave the viewport.
      let left = r.right + 8;
      if (left + pw > window.innerWidth - margin) left = r.left - pw - 8;
      left = Math.max(margin, Math.min(left, window.innerWidth - pw - margin));

      // Top-aligned with its row, pulled up when a tall panel would overflow.
      const top = Math.max(
        margin,
        Math.min(r.top, window.innerHeight - ph - margin),
      );

      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
      panel.style.visibility = "visible";
    };

    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [anchorRefs, anchorKey, width]);

  return (
    <>
      {/* Click-anywhere-else catcher, under the panel and over everything else. */}
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div
        ref={panelRef}
        style={{ width, visibility: "hidden" }}
        className="hide-scrollbar fixed z-60 max-h-[85vh] overflow-y-auto rounded-xl border border-gray-200 bg-surface shadow-2xl"
      >
        {children}
      </div>
    </>
  );
}
