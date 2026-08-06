"use client";

// app/(components)/ui/OptionSheet.jsx
/**
 * OptionSheet — the MOBILE form of an in-modal picker.
 * ─────────────────────────────────────────────────────────────────────────────
 * Below `lg`, the studio modals swap their side-anchored `FloatingPanel` /
 * `DropdownBelow` popovers for this bottom sheet. A 340–460px popover anchored
 * beside its trigger is wider than a 360px phone, so it ended up clamped over
 * the form it belongs to — the sheet gives every picker (visual style, ratios,
 * voices, quality, size, "switch tool") the full width and its own scroll.
 *
 * Used by BOTH studios, from one place each:
 *   • Magic Studio   → MagicStudioModal picks it directly per option row
 *   • Product Studio → product-studio/FloatingPanels.jsx renders it in place of
 *     the anchored panel, so every modal that opens a dropdown gets it for free
 *
 * Deliberately NOT <ResponsiveModal>: that primitive switches form at `md` and
 * owns a header/footer/focus-trap contract meant for task dialogs. This is a
 * picker layer that opens ON TOP of an already-open modal, only below `lg`, and
 * closes the moment a value is chosen. It shares the house sheet LOOK (grab
 * handle, rounded top, swipe-to-dismiss, safe-area padding) so the two read as
 * the same UI.
 *
 * Render it inside an <AnimatePresence> for the exit to play. Escape belongs to
 * the owning modal (which should close an open sheet before closing itself).
 *
 * @example
 * <AnimatePresence>
 *   {open && (
 *     <OptionSheet key="style" title="Visual style" onClose={close}>
 *       <PanelBody … />
 *     </OptionSheet>
 *   )}
 * </AnimatePresence>
 */

import { motion, useDragControls } from "framer-motion";
import { X } from "lucide-react";

/** Drag the sheet down this far (px) — or flick it faster than
 *  FLICK_VELOCITY (px/s) — to dismiss. Matches ResponsiveModal's feel. */
const DISMISS_DISTANCE = 110;
const FLICK_VELOCITY = 500;

/**
 * @param {object} props
 * @param {string} [props.title]         Sheet heading (usually the option label).
 * @param {string} [props.subtitle]      Optional one-line hint under the title.
 * @param {() => void} props.onClose     Close on ✕, backdrop tap, or swipe down.
 * @param {React.ReactNode} props.children  Sheet body (scrolls).
 */
export default function OptionSheet({ title, subtitle, onClose, children }) {
  // Drag is started by the grab handle / header only (dragListener={false}), so
  // a long list inside the body still scrolls normally instead of dragging the
  // whole sheet off the screen.
  const dragControls = useDragControls();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.16 } }}
      exit={{ opacity: 0, transition: { duration: 0.14 } }}
      className="fixed inset-0 z-230 flex items-end justify-center lg:hidden"
    >
      {/* Backdrop — tapping it dismisses without touching the parent modal. */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title || "Options"}
        initial={{ y: "100%" }}
        animate={{
          y: 0,
          transition: { type: "tween", duration: 0.22, ease: "easeOut" },
        }}
        exit={{
          y: "100%",
          transition: { type: "tween", duration: 0.18, ease: "easeIn" },
        }}
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > DISMISS_DISTANCE || info.velocity.y > FLICK_VELOCITY) {
            console.log("👆 [magic-studio] option sheet dismissed by swipe");
            onClose?.();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full flex flex-col bg-surface rounded-t-2xl shadow-2xl overflow-hidden max-h-[85dvh] pb-(--ck-safe-b)"
      >
        {/* Grab handle + heading — also the swipe target. */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="shrink-0 touch-none cursor-grab active:cursor-grabbing"
        >
          <div className="flex justify-center pt-2.5 pb-1" aria-hidden="true">
            <span className="h-1 w-9 rounded-full bg-gray-300" />
          </div>
          <div className="flex items-center justify-between gap-3 px-4 pb-3">
            <span className="min-w-0">
              {title && (
                <span className="block truncate text-sm font-semibold text-gray-900">
                  {title}
                </span>
              )}
              {subtitle && (
                <span className="block truncate text-[11px] text-gray-400">
                  {subtitle}
                </span>
              )}
            </span>
            <button
              onClick={onClose}
              aria-label="Close"
              className="ck-tap shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-gray-100">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
