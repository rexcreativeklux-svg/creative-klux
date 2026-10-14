"use client";

import { toast } from "sonner";

/**
 * useMediaInsert — the one rule for what a click on a media tile does.
 *
 * Images and videos go onto the page; the editor has no audio or document
 * element type yet, so those say so out loud instead of failing quietly.
 * Keeping this in one place means the gallery list and the stock list can't
 * answer that question differently.
 */
export default function useMediaInsert({ insert }) {
  const CANT_PLACE = {
    audio: "Audio can’t be added to a design yet.",
    document: "Documents can’t be added to a design yet.",
  };

  /**
   * @param {string} type
   * @param {string} src
   * @param {{ thumb?: string, duration?: number }} [extra] What the source
   *   already knows about a video — saves capturing a poster of our own.
   */
  const pick = (type, src, extra = {}) => {
    if (type !== "image" && type !== "video") {
      toast.info(CANT_PLACE[type] || "That file can’t be added to a design.");
      return;
    }
    if (!src) {
      toast.error(`That ${type} has no usable URL.`);
      return;
    }
    if (type === "video") {
      insert.videoUrl(src, { poster: extra.thumb, duration: extra.duration });
      return;
    }
    insert.imageUrl(src);
  };

  return { pick };
}
