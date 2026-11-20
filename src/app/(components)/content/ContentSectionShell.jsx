"use client";

/**
 * ContentSectionShell — the Social Content and Ads Content sidebar, laid out
 * like Metricool's:
 *
 *   ACCOUNTS
 *     All accounts
 *     <each connected account — network, account name from the backend>
 *     [ + More connections ]   → the Manage connections pop-up
 *   ─────────
 *   Publishing / Calendar / Analytics
 *
 * Picking an account scopes all three pages to it: the choice lives in the URL
 * (`?platform=`), so it carries across the page links (each keeps the query)
 * and survives a reload. "All accounts" drops the param. Pages read it through
 * useSocialPlatform() / useAdsPlatform() — see socialPlatformScope.js.
 *
 * Only CONNECTED accounts are listed; everything else is connected from the
 * pop-up. After a connect or disconnect there, the section's page is mounted
 * afresh so it reloads against the new set of accounts.
 *
 * useSearchParams needs a Suspense boundary for static prerendering; the
 * fallback is the same shell with nothing picked, so nothing jumps.
 */

import { Fragment, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import SectionLayout from "@/app/(components)/SectionLayout";
import ManageConnectionsModal from "@/app/(components)/integrations/ManageConnectionsModal";
import { useIntegrationCatalogue } from "@/app/(components)/integrations/useIntegrationCatalogue";
import { scopeIn } from "./socialPlatformScope";

const notify = (message, type) =>
  type === "error" ? toast.error(message) : toast.success(message);

/**
 * @param {object} props
 * @param {string} props.title           "Social Content" / "Ads Content"
 * @param {"social"|"ads"} props.kind     Which group leads the pop-up.
 * @param {Array<{label: string, href: string, icon: React.ElementType}>} props.navItems
 * @param {Array<{id: string, label: string, Icon: React.ElementType, color: string}>} props.networks
 * @param {React.Context<string>} props.Context  Provides the picked id to pages.
 */
function ScopedShell({ title, kind, navItems, networks, Context, allOption = true, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const platform = useMemo(() => scopeIn(networks), [networks])(
    searchParams.get("platform"),
  );

  const catalogue = useIntegrationCatalogue({ notify });
  const { byPlatform, loading } = catalogue;

  // The connected accounts, in the section's network order, each named by the
  // account the backend says is connected.
  const connected = networks
    .map((n) => ({ network: n, row: byPlatform.get(n.id) }))
    .filter(({ row }) => row?.connected);

  // A fingerprint of what's connected — compared across the pop-up's lifetime
  // to know whether the page underneath needs to reload.
  const signature = connected.map(({ network, row }) => `${network.id}:${row.accountLabel}`).join("|");
  const [modalOpen, setModalOpen] = useState(false);
  const [pageKey, setPageKey] = useState(0);
  const openedWith = useRef(signature);

  const openModal = useCallback(() => {
    openedWith.current = signature;
    setModalOpen(true);
  }, [signature]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    if (openedWith.current !== signature) setPageKey((k) => k + 1);
  }, [signature]);

  const onPick = useCallback(
    (id) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id === "all") params.delete("platform");
      else params.set("platform", id);
      const qs = params.toString();
      console.log(`🔎 [${kind}] scoped to ${id}`);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams, kind],
  );

  // Without an "All accounts" row, a page always shows one network: when none
  // is picked (or the picked one isn't connected), open the first connected.
  const firstConnected = connected[0]?.network.id;
  const needsPick =
    !allOption && !loading && firstConnected && !connected.some(({ network }) => network.id === platform);
  useEffect(() => {
    if (needsPick) onPick(firstConnected);
  }, [needsPick, firstConnected, onPick]);

  const query = platform === "all" ? "" : `?platform=${platform}`;
  const items = navItems.map((item) => ({ ...item, href: item.href + query }));

  const accounts = {
    heading: "Accounts",
    value: platform,
    onChange: onPick,
    loading,
    emptyText: "No accounts connected yet.",
    options: connected.length
      ? [
          ...(allOption ? [{ id: "all", label: "All accounts", Icon: LayoutGrid }] : []),
          ...connected.map(({ network, row }) => ({
            id: network.id,
            label: network.label,
            sublabel: row.accountLabel || undefined,
            Icon: network.Icon,
            color: network.color,
          })),
        ]
      : [],
    action: { label: "More connections", onClick: openModal },
  };

  return (
    <Context.Provider value={platform}>
      <SectionLayout title={title} items={items} accounts={accounts}>
        <Fragment key={pageKey}>{children}</Fragment>
      </SectionLayout>
      <ManageConnectionsModal
        isOpen={modalOpen}
        onClose={closeModal}
        catalogue={catalogue}
        first={kind}
      />
    </Context.Provider>
  );
}

export default function ContentSectionShell(props) {
  const { title, navItems, Context, children } = props;
  return (
    <Suspense
      fallback={
        <Context.Provider value="all">
          <SectionLayout
            title={title}
            items={navItems}
            accounts={{
              heading: "Accounts",
              value: "all",
              onChange: () => {},
              loading: true,
              options: [],
            }}
          >
            {children}
          </SectionLayout>
        </Context.Provider>
      }
    >
      <ScopedShell {...props} />
    </Suspense>
  );
}
