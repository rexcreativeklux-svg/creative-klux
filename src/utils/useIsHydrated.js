"use client";

// utils/useIsHydrated.js
// ─────────────────────────────────────────────────────────────────────────────
// "Has this component finished hydrating in the browser?" — the guard anything
// that touches `document` at render time needs.
//
// The case that forced it: `createPortal(node, document.body)` runs DURING
// render, and `document` does not exist on the server. The usual fix is a
// `useState(false)` + `useEffect(() => setMounted(true))` pair, but React 19's
// linter correctly rejects that — a setState called synchronously in an effect
// body is a cascading render on every single mount.
//
// useSyncExternalStore expresses the same thing without the extra render pass:
// it hands back the server snapshot (false) during SSR and hydration, then the
// client snapshot (true) afterwards, and React handles the swap. No effect, no
// cascade, no hydration mismatch warning.

import { useSyncExternalStore } from "react";

/** Nothing to subscribe to — hydration happens exactly once and never reverts. */
const noopSubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * True once the component is running in the browser post-hydration.
 *
 * @returns {boolean}
 *
 * @example
 * const hydrated = useIsHydrated();
 * if (!hydrated) return null;
 * return createPortal(<Sheet />, document.body);
 */
export function useIsHydrated() {
  return useSyncExternalStore(noopSubscribe, getClientSnapshot, getServerSnapshot);
}
