"use client";

/**
 * Positioning primitives shared by every Product Studio modal's dropdowns:
 *
 *   • DropdownBelow  — a panel anchored directly BELOW its trigger (the header
 *     tool switcher).
 *   • FloatingPanel  — a panel anchored to the RIGHT of its trigger, then
 *     clamped into the viewport (flips left / lifts up so it never runs off an
 *     edge). Rendered at a fixed position to escape the sidebar's overflow.
 *
 * Both take an optional `animated` flag. OnDeviceToolModal renders them inside
 * an <AnimatePresence> with `animated` so they fade/scale in and out; the other
 * modals leave it off and get the plain (instant) panel exactly as before — so
 * this extraction changes nothing visually for any existing modal.
 *
 * ── BELOW `lg` BOTH BECOME A BOTTOM SHEET ───────────────────────────────────
 * Anchoring only works when there is somewhere to anchor TO. These panels are
 * 320–460px wide, which is wider than a phone, so on a small screen they were
 * clamped to the viewport edge and dropped on top of the control that opened
 * them. Below `lg` they render <OptionSheet> instead — full width, own scroll,
 * swipe to dismiss. Because every Product Studio dropdown (tool switcher,
 * quality, size, backgrounds, poses…) goes through these two components, that
 * one swap covers all of them; call sites only add a `title` for the sheet
 * header. Desktop is untouched.
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useIsCompact } from "@/utils/useMediaQuery";
import OptionSheet from "@/app/(components)/ui/OptionSheet";

// ── Popover animations (used only when `animated` is set) ──
// DropdownBelow staggers its children in; wrap each child in a
// `<motion.div variants={DROPDOWN_ITEM}>` to opt in to the stagger.
export const DROPDOWN_PANEL = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.18,
      ease: "easeOut",
      staggerChildren: 0.015,
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.98,
    transition: { duration: 0.12, ease: "easeIn" },
  },
};
export const DROPDOWN_ITEM = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.15, ease: "easeOut" } },
};

/**
 * Panel anchored directly below `anchorRef` — a bottom sheet below `lg`. When
 * `animated`, render it inside an <AnimatePresence> so the exit transition plays.
 *
 * @param {object} props
 * @param {React.RefObject} props.anchorRef Trigger element to anchor under.
 * @param {React.ReactNode} props.children
 * @param {number} [props.width=460]
 * @param {boolean} [props.animated=false]
 * @param {string} [props.title]    Heading for the mobile sheet. Ignored on desktop.
 * @param {string} [props.subtitle] Sub-heading for the mobile sheet (e.g. the
 *   current value). Ignored on desktop.
 * @param {() => void} [props.onClose] Close handler for the mobile sheet's ✕ /
 *   backdrop / swipe. Desktop keeps using the caller's own click-away catcher,
 *   so this is only needed to make the sheet dismissible.
 */
export function DropdownBelow({
  anchorRef,
  children,
  width = 460,
  animated = false,
  title,
  subtitle,
  onClose,
}) {
  const isCompact = useIsCompact();
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (anchorRef?.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left });
    }
  }, [anchorRef]);

  // Mobile: there is no room to anchor beside anything — go full-width sheet.
  if (isCompact) {
    return (
      <OptionSheet title={title} subtitle={subtitle} onClose={onClose}>
        <div className="p-3">{children}</div>
      </OptionSheet>
    );
  }

  const className =
    "fixed z-210 bg-surface rounded-2xl shadow-2xl border border-gray-200 p-3 max-h-[80vh] overflow-y-auto";

  if (!animated) {
    return (
      <div
        className={className}
        style={{ top: pos.top, left: pos.left, width }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      variants={DROPDOWN_PANEL}
      initial="hidden"
      animate="show"
      exit="exit"
      className={className}
      style={{ top: pos.top, left: pos.left, width, transformOrigin: "top left" }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </motion.div>
  );
}

/**
 * Panel anchored to the right of `anchorRef`, clamped into the viewport — a
 * bottom sheet below `lg`. When `animated`, render it inside an
 * <AnimatePresence> so the exit transition plays.
 *
 * @param {object} props
 * @param {React.RefObject} props.anchorRef Trigger element to anchor beside.
 * @param {React.ReactNode} props.children
 * @param {number} [props.width=320]
 * @param {boolean} [props.animated=false]
 * @param {string} [props.title]    Heading for the mobile sheet. Ignored on desktop.
 * @param {string} [props.subtitle] Sub-heading for the mobile sheet. Ignored on desktop.
 * @param {() => void} [props.onClose] Close handler for the mobile sheet's ✕ /
 *   backdrop / swipe (desktop keeps the caller's click-away catcher).
 */
export function FloatingPanel({
  anchorRef,
  children,
  width = 320,
  animated = false,
  title,
  subtitle,
  onClose,
}) {
  const isCompact = useIsCompact();
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: -9999, left: -9999 });

  useEffect(() => {
    const a = anchorRef?.current;
    const p = panelRef.current;
    if (!a || !p) return;
    const r = a.getBoundingClientRect();
    const pw = p.offsetWidth || width;
    const ph = p.offsetHeight;
    const margin = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = r.right + 4;
    if (left + pw > vw - margin) left = r.left - pw - 4; // flip to the left of the trigger
    if (left < margin) left = vw - pw - margin; // last resort: pin to right edge
    left = Math.max(margin, left);

    let top = r.top;
    if (top + ph > vh - margin) top = vh - ph - margin; // lift up so the bottom stays visible
    top = Math.max(margin, top);

    setPos({ top, left });
  }, [anchorRef, width]);

  // Mobile: full-width sheet (the panel body brings its own padding, so unlike
  // DropdownBelow there is none added here).
  if (isCompact) {
    return (
      <OptionSheet title={title} subtitle={subtitle} onClose={onClose}>
        {children}
      </OptionSheet>
    );
  }

  const className =
    "fixed z-200 bg-surface rounded-xl shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto";

  if (!animated) {
    return (
      <div
        ref={panelRef}
        className={className}
        style={{ top: pos.top, left: pos.left, width }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, x: -6, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1, transition: { duration: 0.16, ease: "easeOut" } }}
      exit={{ opacity: 0, x: -4, scale: 0.98, transition: { duration: 0.12, ease: "easeIn" } }}
      className={className}
      style={{ top: pos.top, left: pos.left, width, transformOrigin: "left center" }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </motion.div>
  );
}
