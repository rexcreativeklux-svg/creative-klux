// app/(dashboard)/(pages)/studio/ai-chat-page/useLeaveGuard.js
// ─────────────────────────────────────────────────────────────────────────────
// Warn before the chat's designs are thrown away by leaving the page.
//
// The preview pane is held in memory only, so a back or a refresh loses every
// design in it. While `active` is true:
//
//   · BACK (browser button, gesture, or the header's router.back()) — an extra
//     history entry for this same URL sits on top, so back lands on it rather
//     than leaving. The popstate is caught in the CAPTURE phase and stopped
//     before Next.js's own listener sees it, the entry is put back, and
//     `onAttempt("back")` asks the user. `leave("back")` then really goes.
//   · F5 / Ctrl+R / ⌘R — caught as keys, so they get the same modal and
//     `leave("reload")` reloads.
//   · The browser's own reload button or closing the tab — no page can show
//     its own modal there; `beforeunload` makes the browser ask instead.

import { useCallback, useEffect, useRef } from "react";

const GUARD_KEY = "__ckLeaveGuard";

/**
 * @param {boolean} active      True while there is something to lose.
 * @param {(kind: "back"|"reload") => void} onAttempt Open the confirm modal.
 * @param {() => void} [onNoHistory] Where to go when there's nothing to go back to.
 * @returns {(kind: "back"|"reload") => void} leave — call from the modal's Confirm.
 */
export function useLeaveGuard(active, onAttempt, onNoHistory) {
  const leavingRef = useRef(false);
  const guardedRef = useRef(false); // our extra entry is on the stack
  const onAttemptRef = useRef(onAttempt);
  const onNoHistoryRef = useRef(onNoHistory);
  // What to restore after a caught back: this page's entry as Next.js last
  // wrote it. Refreshed after every render, because its router.replace (as a
  // session starts) rewrites the URL and state of the entry we're on.
  const snapshotRef = useRef(null);
  useEffect(() => {
    onAttemptRef.current = onAttempt;
    onNoHistoryRef.current = onNoHistory;
    if (guardedRef.current && !leavingRef.current) {
      snapshotRef.current = { state: window.history.state, href: window.location.href };
    }
  });

  // Push the guard entry once there's something to protect. It is not popped
  // when `active` turns off — it's the same URL, so it only costs one no-op
  // back step, and removing it would itself fire a popstate mid-navigation.
  useEffect(() => {
    if (!active || guardedRef.current) return;
    guardedRef.current = true;
    snapshotRef.current = { state: window.history.state, href: window.location.href };
    window.history.pushState(
      { ...(window.history.state || {}), [GUARD_KEY]: true },
      "",
      window.location.href,
    );
  }, [active]);

  useEffect(() => {
    if (!active) return;

    const onPopState = (event) => {
      if (leavingRef.current) return; // a confirmed leave — let Next.js have it
      event.stopImmediatePropagation();
      const snapshot = snapshotRef.current;
      window.history.pushState(
        { ...(snapshot?.state || {}), [GUARD_KEY]: true },
        "",
        snapshot?.href || window.location.href,
      );
      onAttemptRef.current?.("back");
    };

    const onKeyDown = (event) => {
      const reload =
        event.key === "F5" ||
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "r");
      if (!reload || leavingRef.current) return;
      event.preventDefault();
      onAttemptRef.current?.("reload");
    };

    const onBeforeUnload = (event) => {
      if (leavingRef.current) return;
      event.preventDefault();
      event.returnValue = ""; // older Chrome / Safari need it set
    };

    window.addEventListener("popstate", onPopState, { capture: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("popstate", onPopState, { capture: true });
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [active]);

  return useCallback((kind) => {
    leavingRef.current = true;
    if (kind === "reload") {
      window.location.reload();
      return;
    }
    // Two steps: past our guard entry, then past this page itself.
    const href = window.location.href;
    window.history.go(-2);
    // Opened straight into this page (new tab) — there's nowhere back to go.
    setTimeout(() => {
      if (window.location.href === href) onNoHistoryRef.current?.();
    }, 400);
  }, []);
}
