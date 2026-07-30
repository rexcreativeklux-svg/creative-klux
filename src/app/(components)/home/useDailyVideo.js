"use client";

// app/(components)/home/useDailyVideo.js
// ─────────────────────────────────────────────────────────────────────────────
// Picks which background clip a user sees, and moves them to the next one once
// a day.
//
// The clock is PER USER, not a calendar day: we remember which clip was picked
// and the moment it was picked, then roll over only once 24 hours have passed
// since that moment. So a visitor who first lands at 11pm keeps that clip until
// 11pm the next day, rather than having it swap an hour later.
//
//   visit Mon 09:00 → clip A   (stored: index 0, since Mon 09:00)
//   refresh Mon 15:00 → clip A   (6h — nothing to do)
//   visit Tue 10:00 → clip B   (25h — advance one, restamp to Tue 10:00)
//
// Rolling over always advances by exactly ONE, however long the user was away,
// so the clip is guaranteed to be different from the one they last saw. (Adding
// the elapsed number of days instead could land back on the same index when the
// gap happens to be a multiple of the list length.)
//
// Nothing here runs during render: the first paint has no pick at all (returns
// null) and the choice is made in an effect after mount. localStorage isn't
// available on the server, so resolving it during render would hydrate one clip
// on the server and a different one on the client.

import { useEffect, useState } from "react";

/** localStorage key holding `{ index, since }`. */
const STORAGE_KEY = "ck:home-video";

/** How long one clip stays with a user before the next visit rolls it over. */
const ROTATE_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * Read the saved pick, or null when there isn't a usable one.
 * Treats absent, malformed and future-dated (system clock moved backwards)
 * entries all the same way — start fresh.
 * @returns {{index: number, since: number} | null}
 */
function readSavedPick() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const saved = JSON.parse(raw);
    const valid =
      Number.isInteger(saved?.index) &&
      saved.index >= 0 &&
      Number.isFinite(saved?.since) &&
      saved.since > 0 &&
      saved.since <= Date.now();

    if (!valid) {
      console.warn("⚠️ [home-video] ignoring unusable saved pick:", saved);
      return null;
    }
    return { index: saved.index, since: saved.since };
  } catch (error) {
    // Private mode, disabled storage, or corrupt JSON — all non-fatal.
    console.warn("⚠️ [home-video] couldn't read the saved pick:", error);
    return null;
  }
}

/**
 * Persist a pick. Failing to save is survivable — the user simply gets a fresh
 * pick next visit instead of a remembered one — so this never throws.
 * @param {{index: number, since: number}} pick
 */
function saveSavedPick(pick) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pick));
  } catch (error) {
    console.warn("⚠️ [home-video] couldn't save the pick:", error);
  }
}

/**
 * Choose the clip for this visit.
 *
 * @param {string[]} videos The full list — see backgroundVideos.js.
 * @returns {{src: string, index: number} | null} null until mounted, or when
 *   the list is empty. Callers should treat null as "show the fallback".
 */
export default function useDailyVideo(videos = []) {
  const [pick, setPick] = useState(null);

  useEffect(() => {
    const count = videos.length;
    if (count === 0) {
      // Nothing to choose from — leave `pick` at its initial null so the
      // caller keeps showing the gradient.
      console.warn("⚠️ [home-video] no clips configured — staying on the gradient");
      return;
    }

    const now = Date.now();
    const saved = readSavedPick();

    let next;
    if (!saved) {
      next = { index: 0, since: now };
      console.log("🎬 [home-video] first visit — starting on clip 1");
    } else if (now - saved.since >= ROTATE_AFTER_MS) {
      // `% count` on the way in as well, so shortening the list can't strand a
      // saved index past the end.
      next = { index: (saved.index + 1) % count, since: now };
      const hours = Math.floor((now - saved.since) / 3_600_000);
      console.log(
        `🎬 [home-video] ${hours}h since the last change — moving to clip ${next.index + 1} of ${count}`,
      );
    } else {
      next = saved;
      const hoursLeft = Math.ceil((ROTATE_AFTER_MS - (now - saved.since)) / 3_600_000);
      console.log(
        `🎬 [home-video] staying on clip ${(saved.index % count) + 1} of ${count} — ${hoursLeft}h to go`,
      );
    }

    if (next !== saved) saveSavedPick(next);

    const index = next.index % count;
    setPick({ src: videos[index], index });
  }, [videos]);

  return pick;
}
