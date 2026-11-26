"use client";

// useOpenFromUrl — open one row's details from a link, e.g. Home's top posts
// (`/social-content?platform=facebook&post=<row id>`) and ad campaigns
// (`/ads-content?platform=meta_ads&campaign=<row id>`). The id is the row `id`
// fetchLivePostsFromConnectedAccounts gives every post and campaign.
//
// Waits for the page's list to load, opens the row once, and drops the param
// from the URL so closing the panel and reloading doesn't open it again.

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/**
 * @param {string} param     Query param holding the row id ("post" / "campaign").
 * @param {Array<{id: string}>} rows  The page's loaded rows.
 * @param {boolean} ready    True once `rows` is this page's finished list.
 * @param {(row: object) => void} open  Opens the row's details panel.
 * @param {string} missing   Toast when the row isn't in the list.
 */
export default function useOpenFromUrl(param, rows, ready, open, missing) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const wanted = searchParams.get(param);
  const handled = useRef(null);
  // Held in refs so a new function each render doesn't re-run the effect.
  const openRef = useRef(open);
  const missingRef = useRef(missing);
  useEffect(() => {
    openRef.current = open;
    missingRef.current = missing;
  });

  useEffect(() => {
    if (!wanted || !ready || handled.current === wanted) return;
    handled.current = wanted;
    const row = rows.find((r) => String(r.id) === wanted);
    if (row) openRef.current(row);
    else toast.error(missingRef.current);
    const next = new URLSearchParams(searchParams.toString());
    next.delete(param);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [wanted, ready, rows, param, searchParams, router, pathname]);
}
