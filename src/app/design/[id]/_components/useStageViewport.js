"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useStageViewport — zoom and pan for the editor's stage.
 *
 * ── The model ─────────────────────────────────────────────────────────────
 *
 * The stage is a native scroll container. Its child is a sizer box holding the
 * SCALED footprint of the artboard (canvas size × zoom), and inside that sits
 * the artboard at natural size under a `scale(zoom)` transform. So the browser
 * gives us scrollbars on both axes when the design overflows, centres it while
 * it fits, and panning is just `scrollLeft` / `scrollTop` — no pan offsets to
 * keep in state, and nothing to drift out of step when the side panels open.
 *
 * That is why nothing here translates the stage itself. It only ever moves
 * scroll position, which means every overlay that reads a bounding rect keeps
 * working untouched.
 *
 * ── Why the listeners are attached by hand ────────────────────────────────
 *
 * `wheel` has to be non-passive to call preventDefault, and React attaches its
 * own listeners passively — so `onWheel` in JSX cannot stop the browser's page
 * zoom. Panning listens on `window` for move/up so a drag that leaves the stage
 * still finishes, which a React handler on the element would miss.
 *
 * Touch is deliberately absent: two-finger pinch is already handled on the
 * stage's pointer events, and a second implementation here would fight it.
 */

/** How close a wheel notch gets you: fraction of current zoom per unit delta. */
const WHEEL_SENSITIVITY = 0.0015;
/** Keyboard / button zoom step. */
const STEP = 0.1;

export default function useStageViewport({
  wrapRef,
  zoom,
  setZoom,
  fitZoom,
  minZoom,
  maxZoom,
  // True when the user is typing — space must scroll nothing and pan nothing
  // while a text box has the caret.
  disabled = false,
}) {
  const [panning, setPanning] = useState(false);

  // Read by handlers that must not re-subscribe when these change: re-attaching
  // a wheel listener on every zoom change would drop notches mid-gesture.
  //
  // Refreshed from an effect, and declared before the listeners below so it is
  // filled first — nothing can read it earlier, since every reader is an event
  // handler and the listeners are attached after this runs.
  const state = useRef({});
  useEffect(() => {
    state.current = { zoom, setZoom, fitZoom, minZoom, maxZoom, disabled };
  });

  const clamp = (z) =>
    Math.min(state.current.maxZoom, Math.max(state.current.minZoom, z));

  // ── Ctrl/⌘ + wheel → zoom toward the cursor ─────────────────────────────
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const onWheel = (e) => {
      // Without a modifier this is an ordinary scroll, and the container should
      // do exactly what it would anywhere else. Trackpad pinch arrives as a
      // wheel event with ctrlKey set, so it lands here too — for free.
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();

      const { zoom: current, setZoom: apply } = state.current;
      const rect = wrap.getBoundingClientRect();
      // Where the pointer is within the viewport, and what content sits under
      // it right now. Keeping that same content point under the cursor after
      // the scale is what makes zooming feel like it is aimed rather than
      // recentring on the middle of the page.
      const viewX = e.clientX - rect.left;
      const viewY = e.clientY - rect.top;
      const contentX = wrap.scrollLeft + viewX;
      const contentY = wrap.scrollTop + viewY;

      const next = clamp(current + -e.deltaY * WHEEL_SENSITIVITY * current);
      if (next === current) return;
      apply(next);

      // After the sizer has been re-laid-out at the new scale. Reading the
      // ratio from `next` rather than from state keeps this correct even if
      // several notches land in one frame.
      requestAnimationFrame(() => {
        const ratio = next / current;
        wrap.scrollLeft = contentX * ratio - viewX;
        wrap.scrollTop = contentY * ratio - viewY;
      });
    };

    wrap.addEventListener("wheel", onWheel, { passive: false });
    return () => wrap.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Space / middle-mouse / alt + drag → pan ─────────────────────────────
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    let spaceHeld = false;
    let drag = null;

    const onKeyDown = (e) => {
      if (e.code !== "Space" || state.current.disabled) return;
      const t = e.target;
      if (
        /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) ||
        t.isContentEditable
      ) {
        return;
      }
      spaceHeld = true;
      // Space would otherwise scroll the container a page at a time while the
      // user is only arming a pan.
      e.preventDefault();
      wrap.style.cursor = "grab";
    };

    const onKeyUp = (e) => {
      if (e.code !== "Space") return;
      spaceHeld = false;
      if (!drag) wrap.style.cursor = "";
    };

    // Alt and space both pan; the middle button pans on its own. Alt is worth
    // having because it needs no keyboard focus in the page, and space is the
    // one every other design tool uses.
    const onMouseDown = (e) => {
      if (state.current.disabled) return;
      const wants =
        e.button === 1 || (e.button === 0 && (spaceHeld || e.altKey));
      if (!wants) return;

      e.preventDefault();
      // Stopped in the CAPTURE phase, before the event can reach the artboard.
      // Without this an alt-drag would pan and start a marquee at the same time:
      // React delegates its listeners to the app root, so a bubble-phase stop
      // here is racing an implementation detail, while a capture-phase one
      // cannot be reached at all.
      e.stopPropagation();
      drag = {
        x: e.clientX,
        y: e.clientY,
        left: wrap.scrollLeft,
        top: wrap.scrollTop,
      };
      setPanning(true);
      wrap.style.cursor = "grabbing";
    };

    const onMouseMove = (e) => {
      if (!drag) return;
      wrap.scrollLeft = drag.left - (e.clientX - drag.x);
      wrap.scrollTop = drag.top - (e.clientY - drag.y);
    };

    const onMouseUp = () => {
      if (!drag) return;
      drag = null;
      setPanning(false);
      // Back to grab (not default) when space is still down, so releasing the
      // button mid-pan does not look like the mode ended.
      wrap.style.cursor = spaceHeld ? "grab" : "";
    };

    // Losing the window mid-drag must not leave the stage stuck in pan mode.
    const onBlur = () => {
      spaceHeld = false;
      onMouseUp();
      wrap.style.cursor = "";
    };

    wrap.addEventListener("mousedown", onMouseDown, true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("blur", onBlur);
    return () => {
      wrap.removeEventListener("mousedown", onMouseDown, true);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("blur", onBlur);
      wrap.style.cursor = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Ctrl/⌘ + 0 / 1 / + / − ──────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey) || state.current.disabled) return;
      const { zoom: current, setZoom: apply, fitZoom: fit } = state.current;

      switch (e.key) {
        case "0":
          e.preventDefault();
          fit?.();
          break;
        case "1":
          e.preventDefault();
          apply(clamp(1));
          break;
        case "+":
        case "=":
          e.preventDefault();
          apply(clamp(current + STEP));
          break;
        case "-":
          e.preventDefault();
          apply(clamp(current - STEP));
          break;
        default:
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { panning };
}
