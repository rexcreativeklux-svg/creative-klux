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
} from "../_data/copilots";

/**
 * @param {Object} copilot A row from ../_data/copilots.
 * @returns {Array} Items for <ResultActionsMenu actions={…} />.
 */
export function buildCopilotActions(copilot) {
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
      onClick: () => {
        toggleFavorite(id);
        toast.success(
          favorite ? `${name} removed from favorites` : `${name} added to favorites`,
        );
      },
    },
    { label: "Share", icon: Share2, onClick: () => notifyPending("Sharing") },
    { separator: true },
    { label: "Rename", icon: Pencil, onClick: () => notifyPending("Renaming") },
    {
      label: "Clone copilot",
      icon: CopyPlus,
      onClick: () => {
        cloneCopilot(id);
        toast.success(`${name} cloned`);
      },
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
      onClick: () => {
        removeCopilot(id);
        toast.success(`${name} deleted`);
      },
    },
  ];
}
