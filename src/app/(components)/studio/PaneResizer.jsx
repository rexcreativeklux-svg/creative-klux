"use client";

// app/(components)/studio/PaneResizer.jsx
// ─────────────────────────────────────────────────────────────────────────────
// A draggable divider for a two-pane split view, plus the hook that owns the
// width behind it. Built for the Studio chat page (chat | preview) but with no
// knowledge of it, so any other split screen can reuse it.
//
// Usage:
//
//   const { containerRef, paneProps, resizerProps } = useResizablePane({
//     storageKey: "ck.studio.chatPaneWidth",
//     defaultWidth: 480,
//   });
//
//   <div ref={containerRef} style={{ display: "flex" }}>
//     <aside {...paneProps} style={{ ...paneProps.style, background: "#fff" }}>…</aside>
//     <PaneResizer {...resizerProps} />
//     <section style={{ flex: 1, minWidth: 0 }}>…</section>
//   </div>
//
// ── TWO WIDTHS, ONE SOURCE OF TRUTH ────────────────────────────────────────
// The hook keeps the width the user ASKED for (`desiredWidth` — the value that
// is persisted) apart from the width actually applied, which is that value
// clamped to whatever the container can currently give. Deriving the applied
// width on every render, rather than writing the clamp back into state, is what
// makes the pane behave:
//   · a narrow window squeezes the pane, and it springs back to the user's own
//     width as soon as there's room again — the setting is never quietly lost
//   · the width is an absolute pixel value at EVERY screen size, so a container
//     that changes around it (the auth skeleton handing over to the real layout,
//     the sidebar collapsing) can never resize the pane on its own
//
// The drag itself listens on `window`, not on the handle, so it keeps tracking
// when the pointer outruns the 9px strip or leaves the document entirely.
//
// Persistence: the settled width goes to localStorage — once per drag, on
// release, never on every frame — so the layout survives a refresh.

import { useCallback, useEffect, useRef, useState } from "react";

/** Read a persisted width, falling back to the default when absent/corrupt. */
function readStoredWidth(storageKey, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === null) return fallback;
    const parsed = Number.parseInt(saved, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  } catch (error) {
    console.error("❌ [pane] couldn't read the saved width:", error);
    return fallback;
  }
}

/**
 * Own the width of one pane in a horizontal split.
 *
 * @param {object} options
 * @param {string} options.storageKey        localStorage key for the settled width.
 * @param {number} options.defaultWidth      Width (px) before the user ever drags.
 * @param {number} [options.minWidth]        Floor for the resizable pane.
 * @param {number} [options.minSiblingWidth] Space always left for the other pane.
 * @param {number} [options.step]            Keyboard nudge, in px.
 * @returns {{
 *   width: number,
 *   resizing: boolean,
 *   containerRef: React.RefObject<HTMLDivElement>,
 *   paneProps: {style: React.CSSProperties},
 *   resizerProps: object,
 * }}
 */
export function useResizablePane({
  storageKey,
  defaultWidth,
  minWidth = 280,
  minSiblingWidth = 280,
  step = 24,
}) {
  const containerRef = useRef(null);
  // What the user asked for. Read straight from localStorage on the first
  // render — the same pattern the dashboard layout uses for the sidebar — so
  // the pane paints at its saved width immediately, with no visible correction.
  const [desiredWidth, setDesiredWidth] = useState(() =>
    readStoredWidth(storageKey, defaultWidth),
  );
  const [containerWidth, setContainerWidth] = useState(0);
  const [resizing, setResizing] = useState(false);

  // Ceiling: never eat into the sibling's minimum. Before the container has been
  // measured there's nothing to clamp against, so the saved width applies as-is.
  const maxWidth = containerWidth
    ? Math.max(minWidth, containerWidth - minSiblingWidth)
    : Number.POSITIVE_INFINITY;
  const width = Math.round(Math.min(Math.max(desiredWidth, minWidth), maxWidth));

  // Measure the container. A ResizeObserver catches everything a window resize
  // listener would miss — the sidebar collapsing, a panel opening beside it.
  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const persist = useCallback(
    (value) => {
      try {
        window.localStorage.setItem(storageKey, String(value));
        console.log(`💾 [pane] saved width ${value}px → ${storageKey}`);
      } catch (error) {
        console.error("❌ [pane] couldn't save the width:", error);
      }
    },
    [storageKey],
  );

  // Mirrors `desiredWidth` so the pointerup listener can save the settled value
  // without re-subscribing on every frame of the drag. Every place that calls
  // setDesiredWidth() updates it too, and all of them are event handlers — the
  // ref is never read or written during render.
  const desiredWidthRef = useRef(desiredWidth);

  // While dragging, the whole document shows the resize cursor and stops
  // selecting text — without this, dragging across the chat highlights it.
  useEffect(() => {
    if (!resizing) return;
    const { style } = document.body;
    const previousCursor = style.cursor;
    const previousSelect = style.userSelect;
    style.cursor = "col-resize";
    style.userSelect = "none";
    return () => {
      style.cursor = previousCursor;
      style.userSelect = previousSelect;
    };
  }, [resizing]);

  // The drag itself. Bound to the window so it survives the pointer leaving the
  // handle — the handle is only 9px wide, and a fast drag outruns it instantly.
  useEffect(() => {
    if (!resizing) return;

    const handleMove = (event) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      // The pane starts at the container's left edge, so its width is simply how
      // far into the container the pointer has travelled.
      const next = Math.round(
        Math.min(Math.max(event.clientX - rect.left, minWidth), maxWidth),
      );
      desiredWidthRef.current = next;
      setDesiredWidth(next);
    };

    const handleEnd = () => {
      setResizing(false);
      persist(desiredWidthRef.current); // one write per drag
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleEnd);
    window.addEventListener("pointercancel", handleEnd);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleEnd);
      window.removeEventListener("pointercancel", handleEnd);
    };
  }, [resizing, minWidth, maxWidth, persist]);

  /** Discrete change (keyboard, reset): move and save in one go. */
  const commit = (value) => {
    const next = Math.round(Math.min(Math.max(value, minWidth), maxWidth));
    desiredWidthRef.current = next;
    setDesiredWidth(next);
    persist(next);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      commit(width - step);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      commit(width + step);
    } else if (event.key === "Home") {
      event.preventDefault();
      commit(defaultWidth);
    }
  };

  return {
    width,
    resizing,
    containerRef,
    paneProps: {
      // A plain pixel width at every breakpoint: nothing about the container can
      // stretch or shrink the pane behind the user's back.
      style: { width, minWidth, flexShrink: 0, flexGrow: 0 },
    },
    resizerProps: {
      resizing,
      ariaValueNow: width,
      ariaValueMin: minWidth,
      ariaValueMax: Number.isFinite(maxWidth) ? maxWidth : undefined,
      onPointerDown: (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return; // left only
        event.preventDefault(); // don't start a text selection or a native drag
        setResizing(true);
      },
      onKeyDown: handleKeyDown,
      onDoubleClick: () => commit(defaultWidth),
    },
  };
}

/**
 * The visible handle. Spread `resizerProps` from useResizablePane() onto it.
 *
 * It is a 9px hit area with a 1px rule down the middle: wide enough to grab
 * comfortably, thin enough to read as a divider rather than a gutter. It doubles
 * as the border between the two panes, so the panes themselves need none.
 *
 * @param {object} props
 * @param {boolean} props.resizing
 * @param {number} props.ariaValueNow
 * @param {number} [props.ariaValueMin]
 * @param {number} [props.ariaValueMax]
 * @param {string} [props.label]     Accessible name, e.g. "Resize the chat panel".
 * @param {string} [props.accentRgb] "r,g,b" tint used on hover/drag.
 */
export default function PaneResizer({
  resizing,
  ariaValueNow,
  ariaValueMin,
  ariaValueMax,
  label = "Resize panel",
  accentRgb = "0,61,218",
  ...handlers
}) {
  const [hovered, setHovered] = useState(false);
  const active = resizing || hovered;

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={ariaValueNow}
      aria-valuemin={ariaValueMin}
      aria-valuemax={ariaValueMax}
      tabIndex={0}
      title="Drag to resize · double-click to reset"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...handlers}
      className="ck-pane-resizer"
      style={{
        display: "flex",
        width: 9,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        cursor: "col-resize",
        touchAction: "none", // the drag wins over the browser's page panning
        background: active ? `rgba(${accentRgb},0.06)` : "transparent",
        transition: "background 0.15s",
        outline: "none",
      }}
    >
      {/* The rule itself — thickens and picks up the accent while in use. */}
      <span
        aria-hidden="true"
        style={{
          width: active ? 2 : 1,
          height: active ? 48 : "100%",
          borderRadius: 2,
          background: active ? `rgba(${accentRgb},0.55)` : "rgba(0,0,0,0.08)",
          transition: "all 0.15s",
          pointerEvents: "none", // the strip owns every pointer event
        }}
      />
    </div>
  );
}
