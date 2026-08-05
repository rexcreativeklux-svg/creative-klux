"use client";

// app/(components)/ui/Drawer.jsx
// ─────────────────────────────────────────────────────────────────────────────
// An edge-anchored slide-in panel with a scrim. Built for the mobile nav — it
// hosts the real <Sidebar> below `lg`, so the Apps/Copilot tabs, the theme
// switcher and the account block stop being desktop-only — but it knows
// nothing about navigation and works for any off-canvas panel.
//
// ── WHY NOT ResponsiveModal ─────────────────────────────────────────────────
// They look similar and are deliberately separate. A modal is a TASK: it
// interrupts, it owns the screen until resolved, it usually ends in an action
// row. A drawer is a PLACE: it slides in beside the page, you browse it, and
// it closes the moment you pick something. Folding both into one component
// would mean a prop that switches half the behaviour — so they share the
// primitives (portal, focus trap, Escape) and nothing else.
//
// ── BEHAVIOUR ───────────────────────────────────────────────────────────────
//   · slides from `side` ("left" default), scrim fades with it
//   · Escape, scrim click, and a swipe back toward the edge all close it
//   · traps focus while open; returns focus to the trigger on close
//   · portalled, so an ancestor's `transform`/`overflow` cannot clip it
//   · pads for the notch on the leading edge and the home indicator below
//
// Deliberately NOT here: route-change closing. The drawer does not know what
// its contents do, so the owner closes it — see the `onNavigate` wiring in
// (dashboard)/layout.js. Putting a usePathname() effect in here would fire on
// every route change app-wide, including ones the drawer had nothing to do with.
//
// ── USAGE ───────────────────────────────────────────────────────────────────
//   <Drawer isOpen={navOpen} onClose={closeNav} label="Main navigation">
//     <Sidebar … />
//   </Drawer>

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useIsHydrated } from "@/utils/useIsHydrated";

/** Must match the `.animate-ck-drawer-out-*` durations in globals.css. */
const EXIT_MS = 200;

/** Swipe this far back toward the anchored edge (px) to dismiss. */
const DISMISS_DISTANCE = 70;

const SIDE = {
  left: {
    position: "left-0 top-0 h-full",
    enter: "animate-ck-drawer-in-left",
    exit: "animate-ck-drawer-out-left",
    safePad: "pl-(--ck-safe-l)",
    /** A left drawer is dismissed by dragging LEFT, i.e. negative dx. */
    sign: -1,
  },
  right: {
    position: "right-0 top-0 h-full",
    enter: "animate-ck-drawer-in-right",
    exit: "animate-ck-drawer-out-right",
    safePad: "pr-(--ck-safe-r)",
    sign: 1,
  },
};

/**
 * @param {object}   props
 * @param {boolean}  props.isOpen
 * @param {() => void} props.onClose
 * @param {React.ReactNode} props.children
 * @param {"left"|"right"} [props.side="left"]
 * @param {string}   [props.label="Menu"]  Accessible name for the panel.
 * @param {number}   [props.zIndex=120]    Above the app header (50) and the
 *   sidebar's own overlay layers (55–60); below dialogs (100+) is deliberate —
 *   a modal opened FROM the drawer must cover it.
 * @param {string}   [props.className]     Extra classes on the panel.
 */
export default function Drawer({
  isOpen,
  onClose,
  children,
  side = "left",
  label = "Menu",
  zIndex = 120,
  className = "",
}) {
  const config = SIDE[side] || SIDE.left;

  const panelRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const hydrated = useIsHydrated();

  // Presence lags `isOpen` by the exit animation — same split as
  // ResponsiveModal: `rendered` is presence, `isOpen` is direction.
  const [rendered, setRendered] = useState(isOpen);
  const [wasOpen, setWasOpen] = useState(isOpen);

  const [dragX, setDragX] = useState(0);
  const dragRef = useRef(null);

  // Adjusted during render rather than in an effect (React's adjust-state
  // pattern, as used in (dashboard)/layout.js) so the panel is present on the
  // first committed frame and its entrance is not a render late.
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setRendered(true);
      setDragX(0);
    }
  }

  useEffect(() => {
    if (isOpen || !rendered) return;
    const id = setTimeout(() => setRendered(false), EXIT_MS);
    return () => clearTimeout(id);
  }, [isOpen, rendered]);

  const requestClose = useCallback(() => onClose?.(), [onClose]);

  // ── Escape to close ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        requestClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, requestClose]);

  // ── Focus management + trap ──────────────────────────────────────────────
  // Without this, a keyboard user tabbing through an "open" drawer walks
  // straight into the page behind it, which is still fully focusable.
  useEffect(() => {
    if (!isOpen) return;

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const frame = requestAnimationFrame(() => panelRef.current?.focus?.());

    const onKeyDown = (e) => {
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;

      const focusables = panel.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown, true);
      restoreFocusRef.current?.focus?.();
      restoreFocusRef.current = null;
    };
  }, [isOpen]);

  // ── Swipe back toward the edge to dismiss ────────────────────────────────
  // Bound to the panel's own edge strip rather than the whole panel, so a long
  // nav list still scrolls and its links still take taps.
  const onDragStart = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { startX: e.clientX, x: 0 };
  };

  const onDragMove = (e) => {
    if (!dragRef.current) return;
    const raw = e.clientX - dragRef.current.startX;
    // Only travel toward the anchored edge; dragging the other way should not
    // peel the panel off it.
    const dx = config.sign < 0 ? Math.min(0, raw) : Math.max(0, raw);
    dragRef.current.x = dx;
    setDragX(dx);
  };

  const onDragEnd = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    setDragX(0);
    if (drag && Math.abs(drag.x) > DISMISS_DISTANCE) {
      console.log("👆 [drawer] dismissed by swipe");
      requestClose();
    }
  };

  if (!hydrated || !rendered) return null;

  const closing = !isOpen;

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex }} data-ck-drawer="">
      {/* Scrim */}
      <button
        type="button"
        aria-label={`Close ${label.toLowerCase()}`}
        tabIndex={-1}
        onClick={requestClose}
        className={`absolute inset-0 cursor-pointer bg-black/50 backdrop-blur-[2px] ${
          closing ? "animate-ck-fade-out" : "animate-ck-fade-in"
        }`}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        style={dragX ? { transform: `translateX(${dragX}px)`, transition: "none" } : undefined}
        className={`
          absolute flex max-w-[85vw] flex-col overflow-hidden bg-surface shadow-2xl outline-none
          ${config.position}
          ${config.safePad}
          ${closing ? config.exit : config.enter}
          ${className}
        `}
      >
        {/* Swipe strip — a thin, invisible grab area along the panel's inner
            edge. Purely a gesture target, so it is hidden from assistive tech
            (Escape and the scrim already expose the same action). */}
        <div
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          aria-hidden="true"
          className={`absolute inset-y-0 z-10 w-4 touch-none ${side === "left" ? "right-0" : "left-0"}`}
        />
        {children}
      </div>
    </div>,
    document.body,
  );
}
