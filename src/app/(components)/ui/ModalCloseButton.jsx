"use client";

/**
 * ModalCloseButton — the ✕ every dialog in the app closes with.
 *
 * ResponsiveModal draws this in its own header, so most dialogs never touch it.
 * It is a separate component for the ones that pass `hideHeader` and draw their
 * own chrome (the invite dialog's coloured panel runs the full height, the
 * feedback dialog's heading is larger than the standard bar) — those still need
 * a ✕ that looks and behaves like every other ✕, rather than a hand-rolled one
 * that drifts a shade of grey away from the rest.
 *
 * @param {Object} props
 * @param {() => void} props.onClick
 * @param {string} [props.className]  Positioning — these dialogs place it
 *   absolutely over their content; ResponsiveModal lets it sit in flow.
 * @param {string} [props.label="Close"]  Accessible name.
 */

import { X } from "lucide-react";

export default function ModalCloseButton({
  onClick,
  className = "",
  label = "Close",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`ck-tap shrink-0 cursor-pointer rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 ${className}`}
    >
      <X className="h-5 w-5" />
    </button>
  );
}
