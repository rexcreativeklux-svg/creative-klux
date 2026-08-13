"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

/**
 * ConfirmDialog — a small, reusable, theme-aware confirmation modal to replace
 * native window.confirm(). Controlled: render it with `open` and handle
 * onConfirm / onCancel. Esc or backdrop click cancels.
 *
 * Pass `busy` while an async confirm is in flight — it locks both buttons and
 * the dismiss paths so a slow delete can't be fired twice or cancelled halfway.
 *
 * <ConfirmDialog
 *   open={!!pending}
 *   title="Replace design?"
 *   message="This swaps the whole canvas."
 *   confirmLabel="Replace"
 *   variant="danger"
 *   onConfirm={...}
 *   onCancel={...}
 * />
 */
export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default", // 'default' | 'danger'
  busy = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (busy) return;
      if (e.key === "Escape") onCancel?.();
      if (e.key === "Enter") onConfirm?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel, onConfirm]);

  if (!open) return null;

  const confirmClasses =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-blue-600 hover:bg-blue-700";

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (busy) return;
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl bg-surface shadow-2xl border border-gray-200 overflow-hidden"
      >
        <div className="flex items-start gap-3 p-5">
          <div
            className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${
              variant === "danger"
                ? "bg-red-50 text-red-500"
                : "bg-blue-50 text-blue-500"
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900">{title}</h3>
            {message && (
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                {message}
              </p>
            )}
          </div>
          <button
            onClick={onCancel}
            disabled={busy}
            className="w-7 h-7 -mt-1 -mr-1 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer transition shrink-0 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-4 h-9 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer transition disabled:opacity-40 disabled:pointer-events-none"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            disabled={busy}
            className={`px-4 h-9 rounded-lg text-sm font-semibold text-white cursor-pointer transition inline-flex items-center gap-2 disabled:opacity-70 disabled:pointer-events-none ${confirmClasses}`}
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
