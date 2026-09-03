"use client";

import { useEffect, useState } from "react";
import { fetchTemplates, peekTemplates, PER_PAGE } from "./videoTemplates";

/**
 * Pexels templates for one category.
 *
 * Cache hits are resolved DURING RENDER, not from the effect: flipping back to a
 * category you've already seen must not flash a row of skeletons, and setting
 * state from an effect to achieve that is a cascading render. The effect only
 * ever fires the request; state is tagged with the key it belongs to, so "still
 * loading" and "these results are for the previous category" both fall out of
 * the derived return instead of needing a clear.
 *
 * `enabled: false` turns the hook into a no-op that fetches nothing and reports
 * "not loading" — for callers that render the same browser over a STATIC
 * catalog (Product Staging) instead of a Pexels search. The hook still has to be
 * called unconditionally, hence a flag rather than a conditional call site.
 *
 * @param {object} opts
 * @param {"videos"|"photos"} opts.kind
 * @param {string} [opts.category]
 * @param {number} [opts.perPage]
 * @param {boolean} [opts.enabled=true] When false, never fetches.
 * @returns {{ items: Array, loading: boolean, error: string|null, retry: () => void }}
 */
export default function useTemplates({
  kind,
  category = "All",
  perPage = PER_PAGE,
  enabled = true,
}) {
  // `attempt` belongs to the STATE key, never to the cache key: bumping it has
  // to invalidate "these results are current" without invalidating the cache
  // itself. Because a failure caches nothing, the retry re-fetches; because the
  // key changed, the derived return below flips back to loading first.
  const [attempt, setAttempt] = useState(0);
  const key = `${kind}:${category}:${perPage}:${attempt}`;
  const [state, setState] = useState({ key: "", items: [], error: null });

  useEffect(() => {
    // Disabled — the caller supplies its own items; never touch the network.
    if (!enabled) return;
    // Already in the module cache — the derived return below serves it.
    if (peekTemplates({ kind, category, perPage })) return;

    // Aborts on a fast tab flick so a slow earlier category can't land on top
    // of the one the user is actually looking at.
    const controller = new AbortController();

    fetchTemplates({ kind, category, perPage, signal: controller.signal })
      .then((items) => {
        if (!controller.signal.aborted) setState({ key, items, error: null });
      })
      .catch((err) => {
        if (!controller.signal.aborted)
          setState({
            key,
            items: [],
            error: err?.message || "Couldn't load templates",
          });
      });

    return () => controller.abort();
  }, [key, kind, category, perPage, enabled]);

  const retry = () => setAttempt((n) => n + 1);

  // Disabled: nothing is in flight and nothing ever will be, so never report
  // loading — a static caller would otherwise be stuck on skeletons forever.
  if (!enabled) return { items: [], loading: false, error: null, retry };

  const cached = peekTemplates({ kind, category, perPage });
  if (cached) return { items: cached, loading: false, error: null, retry };

  // In flight, or state still belongs to the category we just navigated away
  // from.
  if (state.key !== key)
    return { items: [], loading: true, error: null, retry };

  return { items: state.items, loading: false, error: state.error, retry };
}
