"use client";

// app/(components)/appearance/AppearanceButton.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The palette button in the sidebar's foot row, and the panel it opens.
//
//     THEME  [ ☀ ▫ ☾ ]  🎨   ← the button; the panel flies out from it
//
// It owns the OPEN STATE and where the panel is anchored, and nothing else —
// what the panel contains is AppearancePanel, and what a skin does is skins.css.
//
// ⚠️ The panel is FIXED-positioned against the trigger's measured rect, not
// absolutely positioned inside this button. The sidebar is `overflow-hidden`
// (Sidebar.jsx) and only 60px wide when collapsed, so an absolute panel would
// be clipped to a sliver. This is the same escape ThemeSwitcher's drop-up used
// to make, for the same reason.

import { useEffect, useRef, useState } from "react";
import { Palette } from "lucide-react";
import AppearancePanel from "./AppearancePanel";

/** The panel's width, in px. Here rather than only in a class because the
 *  flip-and-clamp maths below has to know it. */
const PANEL_WIDTH = 300;

/** Breathing room between the panel and the viewport edge / the trigger. */
const GAP = 10;

/**
 * @param {object} props
 * @param {"sm"|"lg"} [props.size] `sm` (28px) sits beside the theme pills in the
 *   expanded rail; `lg` (36px) is the collapsed rail, where it is the only
 *   control in the row and matches the sizing the theme trigger used to have.
 */
export default function AppearanceButton({ size = "sm" }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ left: 0, bottom: 0 });
  const triggerRef = useRef(null);

  /**
   * Measure the trigger and place the panel above it, opening to the right.
   *
   * Clamped to the viewport on BOTH axes. The trigger lives at the very bottom
   * of a full-height sidebar, so the panel is always taller than the space
   * under it — `bottom` anchors it upward from just above the trigger, and the
   * panel's own max-height stops it running off the top on a short window.
   */
  const place = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.min(
      rect.left,
      Math.max(GAP, window.innerWidth - PANEL_WIDTH - GAP),
    );
    setCoords({ left, bottom: window.innerHeight - rect.top + GAP });
  };

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    place();
    setOpen(true);
    console.log("🎨 [appearance] panel opened");
  };

  // Escape closes, and so does a resize — re-measuring on every resize frame
  // would be the alternative, and a panel that quietly walks away from its
  // button while the window moves is worse than one that closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onResize = () => setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const box = size === "lg" ? "h-9 w-9" : "h-7 w-7";
  const glyph = size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        title="Appearance"
        aria-label="Appearance"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-all ${box} ${
          open
            ? "bg-blue-600 text-white shadow-sm"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        <Palette className={glyph} />
      </button>

      {open && (
        <>
          {/* Backdrop. Transparent and unstyled — it exists to catch the click
              that dismisses, not to dim the app, because the whole point of
              the panel is watching the app behind it change as you pick. */}
          <div
            className="fixed inset-0 z-55"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <AppearancePanel
            style={{ left: coords.left, bottom: coords.bottom, width: PANEL_WIDTH }}
            onClose={() => setOpen(false)}
          />
        </>
      )}
    </>
  );
}
