"use client";

/**
 * useInlineRename — rename a copilot in place, wherever it is listed.
 *
 * Used by the cards on /copilot/all and by the sidebar's Recents rail, because
 * the fiddly parts are identical in both and a second copy is how two renames
 * come to behave differently.
 *
 * ⚠️ ESCAPE MUST NOT COMMIT. Leaving the field fires blur, and blur is what
 * saves — so cancelling with Escape would immediately be undone by the blur it
 * causes. `cancelled` is a ref rather than state for the same reason: the blur
 * handler runs before a re-render could tell it anything.
 *
 * The name is trimmed, and an empty box or an unchanged name just closes the
 * editor — neither is worth a request, and an empty one would ask the server to
 * accept a nameless copilot.
 */

import { useRef, useState } from "react";
import { reportFailure, updateCopilot } from "../_data/copilots";

export function useInlineRename() {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const cancelled = useRef(false);

  const start = (copilot) => {
    setEditingId(copilot.id);
    setDraft(copilot.name);
    cancelled.current = false;
  };

  const stop = () => {
    setEditingId(null);
    setDraft("");
    setSaving(false);
  };

  const commit = async (copilot) => {
    if (cancelled.current || saving) return;

    const name = draft.trim();
    if (!name || name === copilot.name) {
      stop();
      return;
    }

    setSaving(true);
    try {
      await updateCopilot(copilot.id, { name });
    } catch (err) {
      // The store has already rolled the name back; this says why.
      reportFailure(err, "Couldn't rename this copilot");
    } finally {
      stop();
    }
  };

  const onKeyDown = (event, copilot) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit(copilot);
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelled.current = true;
      stop();
    }
  };

  return { editingId, draft, setDraft, saving, start, stop, commit, onKeyDown };
}

/** Shared look for the inline field, so the two lists match. */
export const RENAME_INPUT_CLASS =
  "w-full min-w-0 rounded-md border border-blue-400 bg-surface px-1.5 py-0.5 text-[15px] font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/20";
