"use client";

/**
 * useStickToBottom — keep a scrolling thread parked on its newest message.
 *
 * A chat that renders at scrollTop 0 opens on the oldest thing said and leaves
 * everything since below the fold, behind the pinned composer. Every message
 * sent then LOOKS swallowed by the textarea until the user scrolls, and a
 * refresh reads as "where did my conversation go?". The newest turn is the one
 * being read, so that is where the view starts.
 *
 * ⚠️ STUCK IS A REF, NOT STATE. It changes on every scroll event; in state it
 * would re-render the whole thread as the user drags the bar, and this decides
 * nothing that is drawn.
 *
 * ⚠️ The pin is driven by a ResizeObserver on the CONTENT, not by a `messages`
 * dependency. A turn is not done growing when it is added — Markdown tables,
 * a font settling, an answer replacing its three dots all change the height
 * after the commit that added the message, and each of those would otherwise
 * leave the view a few hundred pixels short of the bottom it just scrolled to.
 * Anything that makes the thread taller re-pins it.
 *
 * Scrolling UP releases the pin while the user reads back. Sending re-takes it,
 * and so does an answer landing — the caller calls `pinToBottom` for both, so
 * the newest message is always what's on screen when it arrives.
 *
 * @param {boolean} enabled  Whether the scrolling thread is on screen. ⚠️ The
 *   caller renders a loading state and an empty hero before the thread exists,
 *   so the refs are null for those commits; this flipping to true is what
 *   attaches the observer to the elements once they are there.
 */

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

/**
 * ⚠️ LAYOUT effect, so the opening scroll happens BEFORE the browser paints.
 * The thread mounts on a promise settling (the history read), and a plain
 * effect is scheduled after that commit has been painted — long enough to show
 * the top of the conversation for a frame and then snap away from it, which is
 * the flash this hook exists to remove. Falls back on the server, where
 * useLayoutEffect does nothing but warn.
 */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * How far off the foot still counts as being at it. Generous on purpose: a
 * couple of lines of slack means a user who nudged the wheel, or a browser that
 * lands a pixel short, is still treated as watching the live end of the thread.
 */
const STICK_THRESHOLD = 120;

export default function useStickToBottom(enabled) {
  const viewportRef = useRef(null);
  const contentRef = useRef(null);
  // Starts true so the very first paint lands on the newest message rather than
  // scrolling there from the top, which reads as the page jumping.
  const stuckRef = useRef(true);

  const scrollToEnd = useCallback(() => {
    const el = viewportRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  /**
   * Take the pin back and go to the newest message — for sending, where the
   * user has just added the thing they want to see, wherever they were reading.
   *
   * ⚠️ Setting the flag matters more than the scroll: this is called before
   * React has committed the new turn, so the scroll here only reaches the
   * bottom as it stands, and the ResizeObserver below does the rest once the
   * message is actually in the DOM.
   */
  const pinToBottom = useCallback(() => {
    stuckRef.current = true;
    scrollToEnd();
  }, [scrollToEnd]);

  /**
   * Wired to the viewport's onScroll: the user scrolling UP is what releases it.
   *
   * ⚠️ DIRECTION, NOT DISTANCE. Our own scrollToEnd fires a scroll event too,
   * and it is dispatched on the next frame — after React has already committed
   * the turn that was just sent. Measured then, the view sits a whole message
   * short of the new bottom, so a distance check read our own scroll as the
   * user leaving and dropped the pin before the ResizeObserver could use it.
   * Scrolling to the end only ever moves down, so only a move up can release.
   */
  const lastTopRef = useRef(0);
  const onScroll = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const top = el.scrollTop;
    const atFoot = el.scrollHeight - top - el.clientHeight <= STICK_THRESHOLD;
    if (atFoot) stuckRef.current = true;
    else if (top < lastTopRef.current) stuckRef.current = false;
    lastTopRef.current = top;
  }, []);

  useIsomorphicLayoutEffect(() => {
    const content = contentRef.current;
    if (!enabled || !content) return undefined;

    // The opening position — before any observer, so a reload is at the foot of
    // the thread on the first frame the user sees.
    scrollToEnd();

    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => {
      if (stuckRef.current) scrollToEnd();
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [enabled, scrollToEnd]);

  // ⚠️ Destructure this at the call site. Reaching through the returned object
  // for a ref (`thread.viewportRef`) during render is what react-hooks/refs
  // rejects, even when the ref is only being handed to JSX.
  return { viewportRef, contentRef, onScroll, pinToBottom };
}
