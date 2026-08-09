"use client";

/**
 * ToolbarChip — a labelled chip in the composer's toolbar and the panel it opens.
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ THE PANEL IS PORTALLED TO <body> AND POSITIONED `fixed`, and that is not
 * decoration — it is the only thing that makes it visible at all.
 *
 * The toolbar this chip sits in is `overflow-x-auto` so a tool with five options
 * scrolls sideways instead of growing the composer into three rows. But CSS
 * resolves `overflow-x: auto` with a visible `overflow-y` to `auto` on BOTH
 * axes: the row clips vertically as well, so a panel rendered as a child — even
 * one absolutely positioned above the chip — is trimmed to the height of the
 * toolbar and left scrollable inside a 34px strip. It looks like the panel
 * "opens too low" and nothing in it can be clicked.
 *
 * Escaping to <body> also clears the second trap: the composer sits inside
 * SectionLayout's `overflow-hidden` canvas box, which would clip a tall panel
 * against the top of the page even without the toolbar's own clipping.
 *
 * Placement is MEASURED, not assumed. The panel opens upward — the composer is
 * on the bottom edge of the canvas, so there is nothing below to open into — and
 * is capped to the room actually above the chip so a long list scrolls inside
 * that cap instead of running off the top of the screen. It re-measures on
 * scroll and resize, because `fixed` doesn't follow a trigger that moves, and
 * this one moves: the toolbar scrolls sideways.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

/** Gap between the chip and its panel. */
const PANEL_GAP = 8;
/** Breathing room kept between the panel and the edges of the viewport. */
const VIEWPORT_MARGIN = 12;
/** The app header is fixed and paints over content — treat its underside as the
 *  top of the world. Same 4rem the dashboard reserves. */
const APP_HEADER_HEIGHT = 64;
/** Tallest the panel ever gets, however much room there is. */
const MAX_PANEL_HEIGHT = 340;

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onToggle
 * @param {() => void} props.onClose  Outside click / Escape.
 * @param {string} props.label The setting's name, e.g. "Visual style".
 *
 *   ⚠️ THE CURRENT VALUE IS NOT SHOWN ON THE TRIGGER. A chip reading "Visual
 *   style · Photorealistic" is more than twice the width of one reading "Visual
 *   style", and a tool with four options then fills the composer and starts
 *   scrolling — so the settings push each other out of view exactly when you
 *   want to compare them. The chip names the setting; the open panel is where
 *   the current choice is marked, with a tick. Same reasoning as the model
 *   menu's fixed "Model" trigger.
 * @param {number} [props.width]      Panel width in px — the option's own
 *   `width` from the config, since a grid of style cards needs more room than a
 *   list of aspect ratios.
 * @param {React.ReactNode} props.children The panel's contents.
 */
export default function ToolbarChip({
  open,
  onToggle,
  onClose,
  label,
  width = 340,
  children,
}) {
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  // Stays null until the first measurement, so the panel never paints at the
  // wrong spot for a frame. It survives a close/re-open — re-opening starts from
  // the last known good placement and corrects itself on the next frame.
  const [placement, setPlacement] = useState({
    maxHeight: MAX_PANEL_HEIGHT,
    position: null,
  });

  const measure = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const spaceAbove =
      rect.top - PANEL_GAP - APP_HEADER_HEIGHT - VIEWPORT_MARGIN;

    // Hug the chip's left edge, then nudge back inside the viewport — a chip
    // near the right of a scrolled toolbar would otherwise push the panel off.
    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(rect.left, window.innerWidth - width - VIEWPORT_MARGIN),
    );

    setPlacement({
      maxHeight: Math.min(MAX_PANEL_HEIGHT, Math.max(spaceAbove, 0)),
      // Anchored by `bottom`, so the panel's own height never has to be known
      // before it can be placed.
      position: { left, bottom: window.innerHeight - rect.top + PANEL_GAP },
    });
  }, [width]);

  useEffect(() => {
    if (!open) return;

    measure();
    window.addEventListener("resize", measure);
    // Capture phase: the toolbar's own sideways scroll doesn't bubble.
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, measure]);

  // Close on outside click / Escape. The panel lives in a portal, so "outside"
  // has to test the trigger AND the panel — testing a shared wrapper would count
  // every click on an option as an outside click and close the panel on
  // mousedown, before the option's own click ever landed.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event) => {
      const inside =
        triggerRef.current?.contains(event.target) ||
        panelRef.current?.contains(event.target);
      if (!inside) onClose?.();
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose?.();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const panel = (
    <div
      ref={panelRef}
      className="thin-scrollbar fixed z-9999 overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-surface shadow-xl"
      style={{
        ...placement.position,
        width,
        maxHeight: placement.maxHeight,
        visibility: placement.position ? "visible" : "hidden",
      }}
    >
      {children}
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={onToggle}
        aria-haspopup="true"
        aria-expanded={open}
        className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
          open
            ? "bg-gray-100 text-gray-900"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <span className="whitespace-nowrap">{label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(panel, document.body)
        : null}
    </>
  );
}
