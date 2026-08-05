"use client";

// app/(components)/studio/ComposerDropdown.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The small drop-up menu used twice in the prompt composer — once for the model
// picker, once for the Build/Plan mode picker — and once more by ActivityChart
// for its period picker. One component so they all stay visually and
// behaviourally identical.
//
// Two things make this more than a `position:absolute` panel:
//
//   1. It is PORTALLED to <body>. The composer's glass skin uses backdrop-blur
//      and the hero blocks animate with transforms — both create stacking
//      contexts, which trapped the menu's z-index inside the composer and let
//      the later quick-start cards paint straight over it. Escaping to body is
//      the only reliable fix (MessageAttachments does the same for its
//      lightbox). Position is therefore `fixed`, measured off the trigger.
//
//   2. Placement is MEASURED against the viewport. The menu is capped to the
//      room actually available on that side — never sliding under the app's
//      fixed header — and flips to the opposite side when the preferred one is
//      too cramped. A long list (the model picker is 14 entries) then scrolls
//      inside that cap instead of running off the top of the screen with its
//      first options stranded behind the header.
//
// Closes on outside click, on Escape, and on selection. Colours come from the
// app's theme tokens (bg-surface / gray-*), so it follows light and dark without
// a single hard-coded hex — the `dark` class lives on <html>, so portalling to
// <body> keeps theming intact.

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

/** Menu width in px. MUST match the `w-56` class on the panel below. */
const MENU_WIDTH = 224;
/** Gap between the trigger and the menu. */
const MENU_GAP = 8;
/** Breathing room kept between the menu and the edges of the viewport. */
const VIEWPORT_MARGIN = 12;
/** The app header is `fixed … h-16` and paints over page content, so the menu
 *  treats the space beneath it as the top of the world. Same 4rem the dashboard
 *  page reserves with `pt-16`. */
const APP_HEADER_HEIGHT = 64;
/** Tallest the menu ever gets, however much room there is. */
const MAX_MENU_HEIGHT = 320;
/** A side with less room than this is too cramped to be worth opening into. */
const MIN_MENU_HEIGHT = 176;

/**
 * @param {object} props
 * @param {{id: string, label: string, description?: string}[]} props.options
 * @param {string} props.value            Currently selected option id.
 * @param {(id: string) => void} props.onChange
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {"up"|"down"} [props.drop]      PREFERRED menu direction — the menu
 *   flips to the other side when this one can't fit a usable list. Default "up".
 * @param {"left"|"right"} [props.align]  Which trigger edge the menu hugs — use
 *   "right" when the trigger sits near a container's right edge so the menu
 *   opens inward. It is nudged back inside the viewport either way. Default "left".
 * @param {string} [props.ariaLabel]      Accessible name for the trigger.
 * @param {React.ComponentType<{className?: string}>} [props.icon] Optional leading icon.
 */
export default function ComposerDropdown({
  options,
  value,
  onChange,
  open,
  onOpenChange,
  drop = "up",
  align = "left",
  ariaLabel,
  icon: Icon,
}) {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const selected = options.find((option) => option.id === value) || options[0];

  // Resolved placement: the fixed-position coords plus the height cap. `position`
  // stays null until the first measurement, so the menu never paints at the
  // wrong spot or a height the viewport can't hold (same trick as
  // ResultActionsMenu). It survives close/re-open — a re-open starts from the
  // last known good placement and corrects itself on the next frame.
  const [placement, setPlacement] = useState({
    maxHeight: MAX_MENU_HEIGHT,
    position: null,
  });

  const measure = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const spaceAbove = rect.top - MENU_GAP - APP_HEADER_HEIGHT - VIEWPORT_MARGIN;
    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP - VIEWPORT_MARGIN;

    const preferred = drop === "up" ? spaceAbove : spaceBelow;
    const opposite = drop === "up" ? spaceBelow : spaceAbove;
    // Only flip when the preferred side genuinely can't show a usable list AND
    // the other side is roomier — otherwise the menu would jump about for a few
    // pixels' gain.
    const flip = preferred < MIN_MENU_HEIGHT && opposite > preferred;
    const opensUp = flip ? drop === "down" : drop === "up";

    // Hug the requested trigger edge, then nudge back inside the viewport so a
    // narrow screen can't push the menu off the side.
    const hugged = align === "right" ? rect.right - MENU_WIDTH : rect.left;
    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(hugged, window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN),
    );

    setPlacement({
      maxHeight: Math.min(MAX_MENU_HEIGHT, Math.max(flip ? opposite : preferred, 0)),
      // Anchoring upward by `bottom` means the height never has to be known.
      position: opensUp
        ? { left, bottom: window.innerHeight - rect.top + MENU_GAP }
        : { left, top: rect.bottom + MENU_GAP },
    });
  }, [drop, align]);

  // Measure on open, and keep it honest while it stays open — the menu is
  // `fixed`, so any scroll or resize moves the trigger out from under it.
  useEffect(() => {
    if (!open) return;

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, measure]);

  // Close on outside click / Escape while open. The menu lives in a portal, so
  // "outside" has to test the trigger AND the menu — testing a shared wrapper
  // would count every click on an option as an outside click, closing the menu
  // on mousedown before the option's click ever landed.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event) => {
      const inside =
        triggerRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target);
      if (!inside) onOpenChange(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onOpenChange(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  // `thin-scrollbar` (globals.css) swaps the chunky OS scrollbar with its
  // stepper arrows for a slim one, so a 14-entry list can still advertise that
  // there's more below without shouting about it.
  const menu = (
    <div
      ref={menuRef}
      role="listbox"
      className="thin-scrollbar fixed z-9999 w-56 overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-surface py-1 shadow-xl"
      style={{
        ...placement.position,
        maxHeight: placement.maxHeight,
        visibility: placement.position ? "visible" : "hidden",
      }}
    >
      {options.map((option) => {
        const active = option.id === selected?.id;
        return (
          <button
            key={option.id}
            type="button"
            role="option"
            aria-selected={active}
            onClick={() => {
              onChange(option.id);
              onOpenChange(false);
            }}
            className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors cursor-pointer hover:bg-gray-100"
          >
            <div className="min-w-0 flex-1">
              <p
                className={`text-xs ${
                  active ? "font-semibold text-blue-600" : "font-medium text-gray-900"
                }`}
              >
                {option.label}
              </p>
              {/* {option.description && (
                <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
                  {option.description}
                </p>
              )} */}
            </div>
            {active && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
          open
            ? "bg-gray-100 text-gray-900"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        <span className="whitespace-nowrap">{selected?.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(menu, document.body)
        : null}
    </div>
  );
}
