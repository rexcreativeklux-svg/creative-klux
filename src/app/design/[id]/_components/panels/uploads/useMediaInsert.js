"use client";

import { toast } from "sonner";

/**
 * useMediaInsert — the one rule for what a click on a media tile does.
 *
 * A design is composed to a static PNG and the editor has no video/audio/
 * document element type, so only images can be placed. Everything else says so
 * out loud instead of failing quietly. Keeping this in one place means the
 * gallery list and the stock list can't answer that question differently.
 */
export default function useMediaInsert({ insert }) {
  const CANT_PLACE = {
    video: "Videos can’t be added to a design yet — designs export as images.",
    audio: "Audio can’t be added to a design — there’s nothing to show on the canvas.",
    document: "Documents can’t be added to a design yet.",
  };

  /** @param {string} type @param {string} src */
  const pick = (type, src) => {
    if (type !== "image") {
      toast.info(CANT_PLACE[type] || "That file can’t be added to a design.");
      return;
    }
    if (!src) {
      toast.error("That image has no usable URL.");
      return;
    }
    insert.imageUrl(src);
  };

  return { pick };
}
