"use client";

/**
 * Social Content section layout (/social-content/*)
 * Wraps the social pages (Publishing / Calendar / Analytics) in the shared
 * SectionLayout shell so they all share the same secondary sidebar.
 *
 * The sidebar also lists every social network the app supports. Picking one
 * scopes all three pages to it: the choice lives in the URL (`?platform=`), so
 * it carries across the page links (each keeps the query) and survives a
 * reload. "All networks" drops the param. Pages read it through
 * useSocialPlatform() — see socialPlatformScope.js.
 *
 * useSearchParams needs a Suspense boundary for static prerendering; the
 * fallback is the same shell with no network picked, so nothing jumps.
 */

import { Suspense, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SectionLayout from "@/app/(components)/SectionLayout";
import { Share2, Calendar, Activity, LayoutGrid } from "lucide-react";
import {
  SOCIAL_NETWORKS,
  SocialPlatformContext,
  toScope,
} from "@/app/(components)/content/socialPlatformScope";
import { useIntegrationCatalogue } from "@/app/(components)/integrations/useIntegrationCatalogue";

const NAV_ITEMS = [
  { label: "Publishing", href: "/social-content/publishing", icon: Share2 },
  { label: "Calendar", href: "/social-content/calendar", icon: Calendar },
  { label: "Analytics", href: "/social-content/analytics", icon: Activity },
];

/** The section shell, scoped to `platform`. */
function Shell({ platform, onPick, connectedIds, children }) {
  const query = platform === "all" ? "" : `?platform=${platform}`;
  const items = NAV_ITEMS.map((item) => ({ ...item, href: item.href + query }));

  const filter = {
    heading: "Networks",
    value: platform,
    onChange: onPick,
    options: [
      { id: "all", label: "All networks", Icon: LayoutGrid },
      // Connected networks first, then the rest; each group keeps its
      // SOCIAL_NETWORKS order (Array.sort is stable).
      ...SOCIAL_NETWORKS.map((n) => {
        const connected = connectedIds ? connectedIds.has(n.id) : true;
        return {
          id: n.id,
          label: n.label,
          Icon: n.Icon,
          color: n.color,
          connected,
          dim: !connected,
          hint: connected ? undefined : "Not connected",
        };
      })
        .sort((a, b) => Number(b.connected) - Number(a.connected))
        .map(({ connected, ...option }) => option),
    ],
  };

  return (
    <SocialPlatformContext.Provider value={platform}>
      <SectionLayout title="Social Content" items={items} filter={filter}>
        {children}
      </SectionLayout>
    </SocialPlatformContext.Provider>
  );
}

function ScopedShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const platform = toScope(searchParams.get("platform"));

  // Which networks are connected — only to dim the rest in the list; every
  // network stays pickable (its page then says it isn't connected).
  const { byPlatform, loading } = useIntegrationCatalogue();
  const connectedIds = loading
    ? null
    : new Set([...byPlatform.values()].filter((r) => r.connected).map((r) => r.id));

  const onPick = useCallback(
    (id) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id === "all") params.delete("platform");
      else params.set("platform", id);
      const qs = params.toString();
      console.log(`🔎 [social] scoped to ${id}`);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  return (
    <Shell platform={platform} onPick={onPick} connectedIds={connectedIds}>
      {children}
    </Shell>
  );
}

export default function SocialContentLayout({ children }) {
  return (
    <Suspense
      fallback={
        <Shell platform="all" onPick={() => {}} connectedIds={null}>
          {children}
        </Shell>
      }
    >
      <ScopedShell>{children}</ScopedShell>
    </Suspense>
  );
}
