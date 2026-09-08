"use client";

/**
 * buildCopilotActions — the ⋯ menu for ONE copilot, in one place.
 *
 * Both the grid card and (when it grows one) the sidebar row open the same
 * shared {@link ResultActionsMenu}, so the only thing that needs sharing is the
 * ordered action list. Building it here means the menu cannot end up with a
 * different order, a different icon, or a "Delete" that skips the store on one
 * surface and not the other.
 *
 * ⚠️ THERE IS NO API YET. The actions split three ways:
 *   • real, and local — favorite / clone / delete mutate the mock store, so the
 *     sidebar reflects them the moment the card does;
 *   • real, and browser-side — Copy copilot ID hits the clipboard;
 *   • honest placeholders — anything that needs a server (folders, sharing,
 *     rename, settings) says so in a toast rather than silently doing nothing.
 * A dead menu item the user clicks twice before giving up is worse than one that
 * tells them what it is waiting for.
 */

import {
  FolderInput,
  Star,
  StarOff,
  Share2,
  Pencil,
  CopyPlus,
  Hash,
  Settings,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  toggleFavorite,
  cloneCopilot,
  removeCopilot,
  notifyPending,
  reportFailure,
} from "../_data/copilots";

/**
 * Run a write and say what happened.
 *
 * ⚠️ THE SUCCESS TOAST WAITS FOR THE SERVER. These used to fire immediately
 * beside a local array mutation, which was honest while the store was a mock and
 * is a lie now that it is a request — "deleted" next to a row that came back is
 * worse than no message at all.
 */
const run = (promise, done, failed) =>
  Promise.resolve(promise)
    .then(() => toast.success(done))
    .catch((err) => reportFailure(err, failed));

/**
 * @param {Object} copilot A row from ../_data/copilots.
 * @param {Object} [handlers]
 * @param {(copilot: Object) => void} [handlers.onRename]  Puts the row's title
 *   into an editable field. Passed in rather than handled here because the field
 *   belongs to whichever list drew the row — see useInlineRename. Without it,
 *   Rename says it is still waiting on the backend, which is now only true of
 *   the items that genuinely are.
 * @returns {Array} Items for <ResultActionsMenu actions={…} />.
 */
export function buildCopilotActions(copilot, { onRename } = {}) {
  const { id, name, favorite } = copilot;
  return [
    {
      label: "Move to folder",
      icon: FolderInput,
      onClick: () => notifyPending("Folders"),
    },
    {
      label: favorite ? "Remove from favorites" : "Add to favorites",
      icon: favorite ? StarOff : Star,
      onClick: () =>
        run(
          toggleFavorite(id),
          favorite
            ? `${name} removed from favorites`
            : `${name} added to favorites`,
          "Couldn't update favorites",
        ),
    },
    { label: "Share", icon: Share2, onClick: () => notifyPending("Sharing") },
    { separator: true },
    {
      label: "Rename",
      icon: Pencil,
      onClick: () =>
        onRename ? onRename(copilot) : notifyPending("Renaming"),
    },
    {
      label: "Clone copilot",
      icon: CopyPlus,
      onClick: () =>
        run(cloneCopilot(id), `${name} cloned`, "Couldn't clone this copilot"),
    },
    {
      label: "Copy copilot ID",
      icon: Hash,
      onClick: () => {
        navigator.clipboard.writeText(id);
        toast.success("Copilot ID copied");
      },
    },
    {
      label: "Copilot settings",
      icon: Settings,
      onClick: () => notifyPending("Copilot settings"),
    },
    { separator: true },
    {
      label: "Delete",
      icon: Trash2,
      danger: true,
      onClick: () =>
        run(removeCopilot(id), `${name} deleted`, "Couldn't delete this copilot"),
    },
  ];
}
