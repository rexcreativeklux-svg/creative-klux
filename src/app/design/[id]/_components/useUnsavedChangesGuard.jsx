"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";

/**
 * useUnsavedChangesGuard — don't let unsaved work leave without asking.
 *
 * The editor autosaves every 15 seconds, which is what made this easy to skip:
 * most of the time a reload costs nothing. But "most of the time" means up to
 * fifteen seconds of work vanishing with no warning at all, and the edits most
 * worth keeping are the ones you just made.
 *
 * ── Two exits, two mechanisms ─────────────────────────────────────────────
 *
 *  • Reload, tab close, window close → the browser's native prompt. Browsers
 *    deliberately allow no custom UI here, and no way to run a save first; the
 *    page may be gone before a request lands. All we get is the prompt.
 *
 *  • In-app navigation (the header's ←) → our own dialog, which CAN offer to
 *    save first. Because that is async, the navigation is deferred and only
 *    runs once the user has chosen.
 *
 * The editor already knows whether it is dirty, so unlike the reference
 * implementation this infers nothing — it is told.
 *
 * @param {object}   params
 * @param {boolean}  params.isDirty  whether there are unsaved changes
 * @param {Function} [params.onSave] enables "Save & leave"; may be async
 * @returns {{ dialog: React.ReactNode, guard: (run: Function) => void }}
 */
export default function useUnsavedChangesGuard({ isDirty, onSave }) {
  // The navigation waiting on an answer: { run }. Null when nothing is pending,
  // which is also what closes the dialog.
  const [pending, setPending] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isDirty) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      // Chrome still wants returnValue set, even though the string is ignored
      // and every browser shows its own wording.
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  /**
   * Run a navigation, asking first if there is anything to lose.
   *
   * Clean designs go straight through — a confirmation that always appears is
   * one people learn to dismiss without reading.
   */
  const guard = useCallback(
    (run) => {
      if (!isDirty) {
        run?.();
        return;
      }
      setPending({ run });
    },
    [isDirty],
  );

  const leave = () => {
    const run = pending?.run;
    setPending(null);
    run?.();
  };

  const saveAndLeave = async () => {
    setSaving(true);
    try {
      await onSave?.();
    } finally {
      setSaving(false);
    }
    // Leaves either way. A failed save has already said so, and trapping
    // someone in the editor over it just removes their choice.
    leave();
  };

  const dialog = pending ? (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-surface p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <TriangleAlert className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Leave without saving?
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              You have changes that haven&apos;t been saved yet. They&apos;ll be
              lost if you leave now.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          {onSave && (
            <button
              onClick={saveAndLeave}
              disabled={saving}
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving…" : "Save & leave"}
            </button>
          )}
          <button
            onClick={leave}
            disabled={saving}
            className="h-10 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 cursor-pointer"
          >
            Leave without saving
          </button>
          <button
            onClick={() => setPending(null)}
            disabled={saving}
            className="h-10 rounded-lg text-sm font-medium text-gray-500 transition hover:bg-gray-50 disabled:opacity-60 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { dialog, guard };
}
