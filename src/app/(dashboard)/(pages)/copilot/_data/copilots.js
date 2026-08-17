"use client";

/**
 * The Copilot catalog — ONE list behind every Copilot surface until the backend
 * lands: the sidebar's Favorites + Recents sections and the /copilot/all grid.
 *
 * ⚠️ THERE IS NO API YET. This module is the stand-in: a seed list plus a tiny
 * module-level store so the surfaces stay in step with each other. Favouriting a
 * copilot on /copilot/all has to light up in the sidebar's Favorites the same
 * instant, and deleting one has to drop it from Recents — two independent
 * `useState` lists would show the user a bug, not a placeholder. When the real
 * endpoints exist, `useCopilots` becomes the data hook and the mutators become
 * requests; nothing that renders needs to change.
 *
 * `useSyncExternalStore` rather than a context provider: the two consumers sit
 * on opposite sides of the dashboard layout (the sidebar and the page), so a
 * provider would have to wrap the whole shell to join them.
 *
 * ⚠️ `editedAgo` is a WRITTEN LABEL, not a timestamp. Seeded dates would read
 * "2 years ago" by next year, and deriving the label from `Date.now()` at render
 * risks a hydration mismatch on the minute boundary. The API will send real
 * timestamps and this field becomes a formatter call.
 *
 * Every copilot here is a standing task this product could actually run — the
 * same rule the starter-idea cards in ./ideas.js follow. A mock copilot that
 * promises work Creative Klux cannot do is worse than one fewer mock.
 *
 * `category` is a key into IDEAS (./ideas.js) — it is what lets a copilot's
 * conversation suggest starters that belong to ITS job rather than a generic
 * set, without a second list of suggestions to keep in step.
 */

import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Palette, CalendarDays, Megaphone, Camera, Radar, Mic } from "lucide-react";

/** How many copilots the sidebar's Recents lists before "View all" takes over. */
export const RECENTS_LIMIT = 3;

/**
 * Say out loud that a control is waiting on the backend.
 *
 * Every Copilot surface has some of these (opening a copilot, folders, sharing,
 * rename, settings), and they should all answer the same way — a control that
 * silently does nothing reads as broken, and the user clicks it twice before
 * giving up. Lives here beside the mock data so it disappears with it.
 *
 * @param {string} label What is missing, capitalised ("Folders", "Sharing").
 */
export const notifyPending = (label) =>
  toast(`${label} lands with the Copilot backend.`);

/**
 * An id for a conversation that does not exist server-side yet.
 *
 * It rides the URL as `?c=` and is the conversation's React `key`, so all it has
 * to be is different from the last one — that is what makes "New conversation"
 * an ordinary navigation instead of a no-op when you are already on the thread.
 *
 * ⚠️ EVENT HANDLERS ONLY, never during render: `Date.now()` is impure, so a
 * render that called it would produce a new key on every pass and remount the
 * conversation under the user. It lives out here rather than inline so the
 * two callers (the panel's New conversation, a workflow's Send to chat) mint
 * them the same way.
 */
export const newConversationId = () => Date.now().toString(36);

// Ordered newest-edited first — the array order IS the recency order, so
// Recents is a `slice`, not a sort. The tints are saturated (not `-50` tints)
// so the avatars read the same in both themes; only the grays are re-pointed in
// dark mode (see the .dark block in globals.css).
const SEED = [
  {
    id: "brand-warden",
    category: "Brand",
    name: "Brand Warden",
    description:
      "Checks the week's new designs against my brand kit and flags the ones that drift.",
    Icon: Palette,
    tint: "bg-blue-600",
    editedAgo: "32 minutes ago",
    favorite: false,
  },
  {
    id: "week-ahead",
    category: "Social",
    name: "Week Ahead",
    description:
      "Drafts seven posts every Thursday and loads them into next week's calendar.",
    Icon: CalendarDays,
    tint: "bg-emerald-600",
    editedAgo: "2 hours ago",
    favorite: false,
  },
  {
    id: "ad-refresher",
    category: "Ads",
    name: "Ad Refresher",
    description:
      "Builds fresh creative variants every two weeks so nothing running goes stale.",
    Icon: Megaphone,
    tint: "bg-orange-500",
    editedAgo: "yesterday",
    favorite: false,
  },
  {
    id: "shelf-ready",
    category: "Product",
    name: "Shelf Ready",
    description:
      "Cleans up every product photo I upload and files the set ready to use.",
    Icon: Camera,
    tint: "bg-violet-600",
    editedAgo: "3 days ago",
    favorite: false,
  },
  {
    id: "rival-watch",
    category: "Performance",
    name: "Rival Watch",
    description:
      "Breaks down the ads my competitors are running and briefs me every Monday.",
    Icon: Radar,
    tint: "bg-rose-500",
    editedAgo: "12 days ago",
    favorite: false,
  },
  {
    id: "voice-desk",
    category: "Studio",
    name: "Voice Desk",
    description:
      "Turns each script I write into a voiceover in the voice I've chosen.",
    Icon: Mic,
    tint: "bg-cyan-600",
    editedAgo: "17 days ago",
    favorite: false,
  },
];

let copilots = SEED;
let cloneCount = 0;
const listeners = new Set();

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

// Identity-stable while nothing has changed, which is what useSyncExternalStore
// needs — returning a fresh array here would re-render on every check.
const snapshot = () => copilots;

const commit = (next) => {
  copilots = next;
  listeners.forEach((fn) => fn());
};

/** The live catalog. Same reference on the server and the first client render. */
export function useCopilots() {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

export function toggleFavorite(id) {
  commit(
    copilots.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c)),
  );
}

/**
 * Patch one copilot — the settings sheet's General panel saving a name or a
 * brief. Local like the rest of this store, which is what makes a rename show
 * up in the sidebar rail the instant the sheet is saved.
 */
export function updateCopilot(id, patch) {
  commit(copilots.map((c) => (c.id === id ? { ...c, ...patch } : c)));
}

export function removeCopilot(id) {
  commit(copilots.filter((c) => c.id !== id));
}

/** Duplicate a copilot to the front of the list (it is now the most recent). */
export function cloneCopilot(id) {
  const source = copilots.find((c) => c.id === id);
  if (!source) return;
  cloneCount += 1;
  commit([
    {
      ...source,
      // A counter, not Math.random/Date.now: the id has to be identical on
      // every render pass for React's keys, and this list is client-only state.
      id: `${source.id}-copy-${cloneCount}`,
      name: `${source.name} copy`,
      editedAgo: "just now",
      favorite: false,
    },
    ...copilots,
  ]);
}
