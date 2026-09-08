"use client";

/**
 * A nudge from the thread to the history panel: "there is a conversation now."
 *
 * ⚠️ WHY THIS EXISTS. The panel refetches when the open conversation changes,
 * which covers clicking between threads. It does NOT cover the moment that
 * matters most: sending the first message in a brand new thread. The server
 * creates the conversation on that send, but the URL's `?c=` is the id we minted
 * locally and does not change — so the panel would go on saying "No
 * conversations yet" about a conversation the user is looking at, until a
 * reload.
 *
 * The two live on opposite sides of the layout (the panel is in the shell, the
 * thread is the page), so this is the smallest thing that can join them without
 * a provider wrapping the workspace.
 */

import { useSyncExternalStore } from "react";

let version = 0;
const listeners = new Set();

/** Say the set of conversations changed. Safe to call more than once. */
export function conversationsChanged() {
  version += 1;
  listeners.forEach((fn) => fn());
}

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const snapshot = () => version;
// The server render has no listeners and never bumps, so it is always 0.
const serverSnapshot = () => 0;

/** Re-renders when a conversation is created; use it as a refetch key. */
export function useConversationsVersion() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
