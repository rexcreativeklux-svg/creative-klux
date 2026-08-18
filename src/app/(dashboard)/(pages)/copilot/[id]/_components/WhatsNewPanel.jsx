"use client";

/**
 * WhatsNewPanel — the changelog behind "What's new" in the workspace panel's
 * footer.
 *
 * ⚠️ A POPOVER, NOT A DIALOG. Every other footer item opens a ResponsiveModal,
 * and this one deliberately does not: a changelog is something you glance at
 * beside the app and dismiss, not a task you stop to do. Anchoring it to the
 * row that opened it keeps the workspace visible behind it, which a centred
 * modal over a dimmed page would not.
 *
 * ⚠️ IT IS EMPTY, AND THAT IS THE HONEST STATE. There is no changelog feed yet,
 * and seeding it with invented release notes would put words in the product's
 * mouth about work nobody shipped. When the feed lands, the entries render in
 * the scroll area below the header — the panel is already sized and scrolling
 * for them.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {{ bottom: number, right: number }} [props.anchor]  Viewport rect of the
 *   row that opened it, snapshotted at click time by CopilotWorkspaceLayout.
 */

import { createPortal } from "react-dom";
import { useEffect } from "react";

/** Panel width, and the breathing room kept from the anchor and the viewport. */
const WIDTH = 360;
const GAP = 8;

export default function WhatsNewPanel({ isOpen, onClose, anchor }) {
  // ── Escape to close ───────────────────────────────────────────
  // The backdrop below covers the pointer; this covers the keyboard. A popover
  // does not trap focus the way ResponsiveModal does — the page behind it stays
  // usable, which is the point of it being a popover.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !anchor) return null;

  // ⚠️ Viewport read during render rather than in an effect. The body only
  // renders once the panel is OPEN, which only happens on a click, so the
  // server never renders it and there is no hydration pair to mismatch. It is
  // a snapshot: a resize while the panel is open leaves it where it was, which
  // is fine for something dismissed on the next click anywhere.
  //
  // Sits to the RIGHT of the rail and grows UPWARD from the row's baseline —
  // the footer is at the bottom of the panel, so a popover hanging downward
  // would open off the bottom of the screen. Clamped so a collapsed rail on a
  // narrow window cannot push it off the right edge.
  const left = Math.max(
    GAP,
    Math.min(anchor.right + GAP, window.innerWidth - WIDTH - GAP),
  );
  const bottom = Math.max(GAP, window.innerHeight - anchor.bottom);
  const maxHeight = anchor.bottom - GAP * 2;

  return createPortal(
    <>
      {/* Same transparent-backdrop outside-click trick as DropdownMenu: it
          cannot miss a click the way a document listener can when something
          between here and the document stops propagation. */}
      {/* Z 100 is the app's dialog layer (see ResponsiveModal's zIndex note) —
          set inline for the same reason it is there: page chrome runs to 60, so
          anything less would open behind the header. The panel comes after the
          backdrop in the DOM, so it stacks above it at the same level. */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 100 }}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label="What's new"
        style={{ left, bottom, width: WIDTH, maxHeight, zIndex: 100 }}
        className="fixed flex h-104 max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-surface shadow-2xl animate-ck-dialog-in"
      >
        <p className="shrink-0 border-b border-gray-200 px-4 py-3.5 text-[15px] font-semibold text-gray-900">
          What&apos;s New in Copilot
        </p>
        <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-8">
          <p className="text-sm text-gray-400">No Copilot updates yet.</p>
        </div>
      </div>
    </>,
    document.body,
  );
}
