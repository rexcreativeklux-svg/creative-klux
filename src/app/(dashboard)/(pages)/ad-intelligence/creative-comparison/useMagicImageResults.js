"use client";

/**
 * useMagicImageResults — the user's recent Magic Studio pictures, for Creative
 * Comparison's "Magic Studio" tab.
 *
 * A Magic Studio result is NOT a creative: it lives in that tool's generation
 * history (kept 30 days), not in /creative-designs. So this reads the history of
 * every tool that makes pictures, keeps the finished images, and merges them
 * newest first. Each result is already a hosted URL, which the comparison
 * endpoint takes as `image_url_a` / `image_url_b` — nothing is downloaded or
 * re-uploaded to compare it.
 *
 * Fetched once on mount. A tool whose history fails to load is skipped rather
 * than failing the whole tab — the rest are still worth comparing.
 */

import { useEffect, useState } from "react";
import { getMagicHistory } from "@/(lib)/magic-studio-api";
import { toolById } from "@/app/(dashboard)/(pages)/magic-studio/magicTools";

/**
 * Backend history enums of the tools whose results can be pictures. The persona
 * generator also writes text and video, which the type filter below drops.
 */
const IMAGE_TOOLS = [
  "image-design",
  "social-design",
  "ad-design",
  "text_to_image",
  "image_to_variations",
  "persona_generator",
];

/** How many results the tab lists — a picker, not an archive. */
const LIMIT = 40;

/**
 * @param {{ enabled?: boolean }} [opts] Pass `enabled: false` when logged out.
 * @returns {{ items: Array<{id, url, label, createdAt}>, loading: boolean }}
 */
export default function useMagicImageResults({ enabled = true } = {}) {
  const [state, setState] = useState({ items: [], loading: enabled });

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    (async () => {
      const lists = await Promise.all(
        IMAGE_TOOLS.map((tool) =>
          getMagicHistory(tool).catch((err) => {
            console.warn(`⚠️ [comparison] ${tool} history skipped:`, err?.message);
            return [];
          }),
        ),
      );
      if (!alive) return;
      const items = lists
        .flat()
        .filter((item) => !item.pending && item.type === "image" && item.url)
        .sort(
          (a, b) =>
            (new Date(b.createdAt).getTime() || 0) -
            (new Date(a.createdAt).getTime() || 0),
        )
        .slice(0, LIMIT)
        .map((item) => ({
          id: item.id,
          url: item.url,
          label: toolById(item.tool)?.label || "Magic Studio",
          createdAt: item.createdAt,
        }));
      setState({ items, loading: false });
    })();
    return () => {
      alive = false;
    };
  }, [enabled]);

  return state;
}
