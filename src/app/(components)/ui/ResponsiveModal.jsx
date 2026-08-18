"use client";

// app/(components)/ui/ResponsiveModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// One dialog primitive for the whole app: a centred modal on desktop, a bottom
// sheet on phones.
//
// ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
// The app had ~146 hand-rolled dialogs, nearly all of them some variation of
//
//     fixed inset-0 … flex items-center justify-center   +   max-w-md
//
// which on a 375px screen produces a tall floating box with its action buttons
// pushed below the fold and no way to scroll to them. Each one also re-derived
// its own Escape handler, backdrop click and close button, so the behaviour
// drifted between them.
//
// This component owns all of that once. The API deliberately mirrors the
// existing house pattern (`isOpen` / `onClose` / header / scrolling body /
// footer — see gallery/UploadMediaModal.jsx), so migrating a dialog is mostly
// deleting its chrome rather than rewriting its contents.
//
// ── WHAT IT DOES THAT THE HAND-ROLLED ONES DID NOT ──────────────────────────
//   · below `md`, becomes a bottom sheet: full width, rounded top, grab
//     handle, and a swipe-down-to-dismiss gesture
//   · caps at 90dvh — the DYNAMIC viewport unit, so the action row is never
//     hidden behind a phone's browser chrome
//   · footer is sticky and padded past the home indicator, so the primary
//     button is always reachable no matter how long the body is
//   · traps focus while open and hands it back to whatever opened it
//   · renders through a portal, so an ancestor with `transform` or
//     `overflow: hidden` cannot clip or re-anchor it (a real hazard here —
//     the editor and several panels animate transformed containers)
//
// No body scroll-lock: globals.css already pins `body { overflow: hidden }`
// app-wide, so there is nothing behind to lock, and adding one would fight it.
//
// ── USAGE ───────────────────────────────────────────────────────────────────
//   <ResponsiveModal
//     isOpen={open}
//     onClose={close}
//     title="Upload media"
//     icon={CloudUpload}
//     size="2xl"
//     dismissible={!uploading}
//     footer={
//       <>
//         <button onClick={close}>Cancel</button>
//         <button onClick={save}>Upload</button>
//       </>
//     }
//   >
//     …body…
//   </ResponsiveModal>

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMediaQuery } from "@/utils/useMediaQuery";
import { useIsHydrated } from "@/utils/useIsHydrated";
import ModalCloseButton from "./ModalCloseButton";

/**
 * Desktop width cap. Static map rather than `max-w-${size}` because Tailwind
 * scans source text — an interpolated class name is never generated.
 * Names and values match the `max-w-*` scale already used across the app.
 */
const SIZE_CLASS = {
  xs: "md:max-w-xs",
  sm: "md:max-w-sm",
  md: "md:max-w-md",
  lg: "md:max-w-lg",
  xl: "md:max-w-xl",
  "2xl": "md:max-w-2xl",
  "3xl": "md:max-w-3xl",
  "4xl": "md:max-w-4xl",
  "5xl": "md:max-w-5xl",
  "6xl": "md:max-w-6xl",
  "7xl": "md:max-w-7xl",
  full: "md:max-w-[calc(100vw-3rem)]",
};

/**
 * How long the panel stays mounted after `isOpen` goes false, so the exit
 * animation can play out.
 *
 * ⚠️ Must match the duration on `.animate-ck-sheet-out` / `.animate-ck-dialog-out`
 * in globals.css. Too short and the panel is yanked mid-animation; too long and
 * an invisible, fully-interactive panel sits over the page swallowing clicks.
 */
const EXIT_MS = 180;

/** Drag past this many px (or flick faster than FLICK_VELOCITY) to dismiss. */
const DISMISS_DISTANCE = 110;
const FLICK_VELOCITY = 0.5; // px per ms

/**
 * @param {object}   props
 * @param {boolean}  props.isOpen
 * @param {() => void} props.onClose        Called on Escape, backdrop, ✕ and swipe.
 * @param {React.ReactNode} props.children  Body content (scrolls).
 * @param {string}   [props.title]          Header text. Omit for a chrome-less dialog.
 * @param {React.ElementType} [props.icon]  Optional lucide icon beside the title.
 * @param {React.ReactNode} [props.footer]  Sticky action row. Omit for none.
 * @param {keyof typeof SIZE_CLASS} [props.size="md"] Desktop width cap.
 * @param {boolean}  [props.dismissible=true] false blocks Escape/backdrop/swipe
 *   and hides ✕ — for a modal that must not be abandoned mid-flight (an upload
 *   in progress, a payment). `onClose` is still yours to call directly.
 * @param {boolean}  [props.hideHeader=false] Skip the built-in title/✕ bar for a
 *   dialog that draws its own. Escape, the backdrop and the swipe still close
 *   it, and `title` is still used as the dialog's accessible name — but the
 *   caller MUST render a visible close control of its own. Used by the copilot
 *   settings sheet, whose title bar sits over its right-hand pane so the nav
 *   rail beside it can run the full height of the dialog.
 * @param {boolean}  [props.fullHeightSheet=false] Open the sheet at full height
 *   instead of hugging its content — for long lists and pickers.
 * @param {number}   [props.zIndex=100]     Stacking level. The app's layers run:
 *   page chrome 10–60 (header 50, sidebar overlay 55–60), dialogs 100, and the
 *   product-studio tool modals 195–220, which open ON TOP of another modal.
 *   Raise this only for a dialog that must sit above another dialog. Applied
 *   inline because the value is dynamic — Tailwind cannot generate `z-${n}`.
 * @param {string}   [props.className]      Extra classes on the panel.
 * @param {string}   [props.bodyClassName]  Extra classes on the scroll area.
 */
export default function ResponsiveModal({
  isOpen,
  onClose,
  children,
  title,
  icon: Icon,
  footer,
  size = "md",
  dismissible = true,
  hideHeader = false,
  fullHeightSheet = false,
  zIndex = 100,
  className = "",
  bodyClassName = "",
}) {
  const isSheet = !useMediaQuery("(min-width: 768px)", true);

  const panelRef = useRef(null);
  // Whatever had focus before we opened, so it can be handed back on close.
  const restoreFocusRef = useRef(null);
  // useId, not a random string: it is stable across the server and client
  // renders, so aria-labelledby cannot mismatch during hydration.
  const titleId = useId();

  // Portals need a DOM target, which does not exist during SSR.
  const hydrated = useIsHydrated();

  // `isOpen` flips instantly; `rendered` lags behind it by the exit animation
  // so the panel can animate out instead of vanishing. `rendered` is presence,
  // `isOpen` is direction.
  const [rendered, setRendered] = useState(isOpen);
  const [wasOpen, setWasOpen] = useState(isOpen);

  // Live drag offset for the swipe-to-dismiss gesture (px, sheet only).
  const [dragY, setDragY] = useState(0);
  const dragRef = useRef(null);

  // Opening is adjusted DURING render (React's documented adjust-state
  // pattern, used elsewhere in this codebase — see (dashboard)/layout.js)
  // rather than in an effect, so the panel is present on the very first
  // committed frame and its entrance animation is not a render late.
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setRendered(true);
      setDragY(0); // a re-open must not inherit the last drag offset
    }
  }

  // Closing is the async half: hold the panel mounted for the exit animation,
  // then drop it. Safe in an effect because the setState is inside a timeout
  // callback, not called synchronously in the effect body.
  useEffect(() => {
    if (isOpen || !rendered) return;
    const id = setTimeout(() => setRendered(false), EXIT_MS);
    return () => clearTimeout(id);
  }, [isOpen, rendered]);

  const requestClose = useCallback(() => {
    if (!dismissible) return;
    onClose?.();
  }, [dismissible, onClose]);

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

  // ── Focus management ─────────────────────────────────────────────────────
  // Move focus into the panel on open and return it on close. Without this a
  // keyboard or screen-reader user stays parked on the page behind the dialog.
  useEffect(() => {
    if (!isOpen) return;

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Wait a frame so the panel is in the DOM and laid out before focusing.
    const id = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      (first || panel).focus?.();
    });

    return () => {
      cancelAnimationFrame(id);
      restoreFocusRef.current?.focus?.();
      restoreFocusRef.current = null;
    };
  }, [isOpen]);

  // ── Focus trap ───────────────────────────────────────────────────────────
  // Tab from the last focusable wraps to the first and vice versa, so focus
  // cannot wander into the inert page behind the dialog.
  useEffect(() => {
    if (!isOpen) return;
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
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [isOpen]);

  // ── Swipe down to dismiss (sheet only) ───────────────────────────────────
  // Tracked on the grab handle and header rather than the whole panel, so a
  // scrollable body still scrolls normally. Pointer events cover touch and
  // mouse alike, matching what the editor already uses.
  const onDragStart = (e) => {
    if (!isSheet || !dismissible) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { startY: e.clientY, startedAt: e.timeStamp, y: 0 };
  };

  const onDragMove = (e) => {
    if (!dragRef.current) return;
    // Downward only — dragging up should not lift the sheet off its anchor.
    const dy = Math.max(0, e.clientY - dragRef.current.startY);
    dragRef.current.y = dy;
    setDragY(dy);
  };

  const onDragEnd = (e) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;

    const elapsed = Math.max(1, e.timeStamp - drag.startedAt);
    const velocity = drag.y / elapsed;

    if (drag.y > DISMISS_DISTANCE || velocity > FLICK_VELOCITY) {
      console.log("👆 [modal] dismissed by swipe");
      setDragY(0);
      requestClose();
      return;
    }
    setDragY(0); // snap back
  };

  if (!hydrated || !rendered) return null;

  const closing = !isOpen;

  // Sheets sit at the bottom of the screen, dialogs centre in it — `items-end
  // md:items-center` is the whole difference between the two forms.
  // `data-ck-modal` is a hook for "is any dialog open?" checks.
  const dialog = (
    <div
      className="fixed inset-0 flex items-end justify-center md:items-center md:p-6"
      style={{ zIndex }}
      data-ck-modal=""
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={requestClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${
          closing ? "animate-ck-fade-out" : "animate-ck-fade-in"
        } ${dismissible ? "cursor-pointer" : "cursor-default"}`}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        // With the header hidden there is no <h2> to point at, so the same
        // `title` becomes the accessible name directly.
        aria-labelledby={title && !hideHeader ? titleId : undefined}
        aria-label={hideHeader && typeof title === "string" ? title : undefined}
        tabIndex={-1}
        style={dragY ? { transform: `translateY(${dragY}px)`, transition: "none" } : undefined}
        className={`
          relative mt-auto flex w-full flex-col overflow-hidden bg-surface shadow-2xl outline-none
          max-h-[90dvh] rounded-t-2xl
          md:mt-0 md:max-h-[85dvh] md:rounded-2xl
          ${fullHeightSheet ? "h-[90dvh] md:h-auto" : ""}
          ${SIZE_CLASS[size] || SIZE_CLASS.md}
          ${closing ? "animate-ck-sheet-out md:animate-ck-dialog-out" : "animate-ck-sheet-in md:animate-ck-dialog-in"}
          ${className}
        `}
      >
        {/* Grab handle — sheet affordance, and the swipe target. Hidden from
            assistive tech: Escape and the ✕ already cover the same action. */}
        {isSheet && dismissible && (
          <div
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragEnd}
            className="flex shrink-0 cursor-grab touch-none justify-center pt-2.5 pb-1 active:cursor-grabbing md:hidden"
            aria-hidden="true"
          >
            <span className="h-1 w-9 rounded-full bg-gray-300" />
          </div>
        )}

        {/* Header */}
        {!hideHeader && (title || dismissible) && (
          <div
            onPointerDown={isSheet ? onDragStart : undefined}
            onPointerMove={isSheet ? onDragMove : undefined}
            onPointerUp={isSheet ? onDragEnd : undefined}
            onPointerCancel={isSheet ? onDragEnd : undefined}
            className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-card py-3 md:px-5 md:py-4"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              {Icon && <Icon className="h-5 w-5 shrink-0 text-blue-600" />}
              {title && (
                <h2
                  id={titleId}
                  className="truncate text-base font-semibold text-gray-900"
                >
                  {title}
                </h2>
              )}
            </div>

            {dismissible && <ModalCloseButton onClick={requestClose} />}
          </div>
        )}

        {/* Body */}
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain p-card md:p-5 ${bodyClassName}`}
        >
          {children}
        </div>

        {/* Footer — sticky by virtue of being outside the scroll area, and
            padded past the home indicator so the primary action is never
            sitting under it. */}
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-100 px-card py-3 pb-[calc(0.75rem+var(--ck-safe-b))] md:px-5 md:py-3.5 md:pb-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
