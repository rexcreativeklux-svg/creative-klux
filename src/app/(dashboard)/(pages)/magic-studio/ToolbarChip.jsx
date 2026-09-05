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
 * @param {React.ComponentType} [props.icon] Lucide component. WITH ONE, THE
 *   CHIP GOES ICON-ONLY: `label` stops being drawn and becomes the tooltip and
 *   the accessible name instead. Six settings at ~90px of text each overran the
 *   composer on the tools that have the most of them, which is the whole reason
 *   the row scrolls; at ~30px each they all fit and nothing has to scroll to be
 *   reachable. The chevron goes too — an icon button that opens something is
 *   already legible as one, and the caret was half the remaining width.
 * @param {string} [props.badge] A short piece of text drawn INSTEAD of an icon
 *   glyph — for the settings whose value is the only useful label ("3x").
 * @param {boolean} [props.attention] This chip holds something REQUIRED that
 *   hasn't been answered. Tints the trigger and puts a dot on its corner.
 *
 *   ⚠️ THE ONLY THING MARKING A REQUIRED SETTING IN A ROW OF ICONS. These chips
 *   deliberately don't show their values (see above), which is fine for a
 *   setting that has a sensible default and wrong for one with no default and no
 *   way to proceed — a run blocked on it looks identical to a run that is ready.
 *   The dot is what makes the difference visible before the send button is
 *   pressed rather than after.
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
  icon: Icon,
  badge,
  attention = false,
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

    // ⚠️ THE WIDTH IS A REQUEST, NOT A GUARANTEE. A panel wide enough for three
    // 16:9 template cards is wider than a phone, and clamping only the LEFT edge
    // would pin it at the margin and let it run off the right instead. Narrow it
    // to what there is room for and let its own grid reflow inside.
    const panelWidth = Math.min(width, window.innerWidth - VIEWPORT_MARGIN * 2);

    // Hug the chip's left edge, then nudge back inside the viewport — a chip
    // near the right of a scrolled toolbar would otherwise push the panel off.
    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(rect.left, window.innerWidth - panelWidth - VIEWPORT_MARGIN),
    );

    setPlacement({
      maxHeight: Math.min(MAX_PANEL_HEIGHT, Math.max(spaceAbove, 0)),
      width: panelWidth,
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

  // Icon-only chips are square and get no caret; a text chip keeps the caret,
  // which is the only thing marking a word in a row as something that opens.
  const compact = !!Icon || !!badge;

  const panel = (
    <div
      ref={panelRef}
      className="thin-scrollbar fixed z-9999 overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-surface shadow-xl"
      style={{
        ...placement.position,
        // The measured width, which is the requested one capped to the viewport
        // — see measure(). Falls back to the request before the first measure,
        // while the panel is still hidden anyway.
        width: placement.width ?? width,
        maxHeight: placement.maxHeight,
        visibility: placement.position ? "visible" : "hidden",
      }}
    >
      {/* ⚠️ THE ONLY PLACE AN ICON CHIP'S SETTING IS NAMED IN WRITING. A
          tooltip needs a hover and never appears on a touch screen, so without
          this the panel of styles that just opened is a grid of pictures with
          nothing saying which of the six controls produced it. `sticky` so it
          survives the panel's own scroll on the long lists. */}
      {compact && (
        <p className="sticky top-0 z-10 border-b border-gray-100 bg-surface px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </p>
      )}
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
        // The label is the accessible name once it stops being drawn — an
        // icon-only button with no `aria-label` announces as "button".
        // The dot is a colour, so the state it marks is spelled out for anyone
        // who can't see it — in the accessible name and the tooltip both.
        aria-label={
          compact ? (attention ? `${label} (required)` : label) : undefined
        }
        aria-expanded={open}
        title={attention ? `${label} — required` : compact ? label : undefined}
        // `relative` unconditionally: the dot is positioned against this.
        className={`relative flex shrink-0 cursor-pointer items-center justify-center rounded-lg text-xs font-medium transition-colors ${
          compact ? "h-8 min-w-8 px-1.5" : "gap-1.5 px-2.5 py-1.5"
        } ${
          open
            ? "bg-gray-100 text-gray-900"
            : attention
              ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        {attention && (
          <span
            aria-hidden="true"
            // `ring-surface` rather than a plain border: the dot overhangs the
            // chip's corner and needs to read against the composer behind it as
            // well as against the chip's own tint.
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-surface"
          />
        )}
        {badge ? (
          <span className="whitespace-nowrap tabular-nums">{badge}</span>
        ) : Icon ? (
          <Icon className="h-4 w-4 shrink-0" />
        ) : (
          <>
            <span className="whitespace-nowrap">{label}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </>
        )}
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(panel, document.body)
        : null}
    </>
  );
}
