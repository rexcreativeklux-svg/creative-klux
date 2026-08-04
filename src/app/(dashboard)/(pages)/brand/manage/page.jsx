/**
 * Brand management page.
 * ──────────────────────────────────────────────────────────────────────────────
 * Tabbed settings surface for the active brand (== brand here). Tabs are
 * driven by TAB_CONFIG; each tab's panel is a colocated component under
 * ./components, and the API layer lives in ./lib/useManageApi. Everything is
 * scoped to the currently-active brand from AuthContext.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { SkeletonForm } from "@/app/(components)/skeletons/PageSkeleton";
import { TAB_CONFIG } from "./config/manageConfig";
import TabsNav from "./components/TabsNav";
import ComingSoon from "./components/ComingSoon";
import BasicInfoTab from "./components/BasicInfoTab";
import MembersTab from "./components/MembersTab";
import AllocationTab from "./components/AllocationTab";
import IntegrationsTab from "./components/IntegrationsTab";

export default function ManageBrandPage() {
  const { activeBrand, activeBrandId, brandsLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(TAB_CONFIG[0].id);

  const current = TAB_CONFIG.find((t) => t.id === activeTab) || TAB_CONFIG[0];

  const renderPanel = () => {
    switch (current.type) {
      // `key={activeBrandId}` remounts the panel when the active brand changes,
      // so switching brands from the header takes effect here immediately.
      case "basic":
        return <BasicInfoTab key={activeBrandId} brand={activeBrand} />;
      case "members":
        return <MembersTab key={activeBrandId} brandId={activeBrandId} />;
      case "allocation":
        return (
          <AllocationTab
            key={activeBrandId}
            brandId={activeBrandId}
            brand={activeBrand}
          />
        );
      case "integrations":
        return <IntegrationsTab />;
      case "comingSoon":
        return (
          <ComingSoon
            title={current.coming?.title || current.label}
            description={current.coming?.description || ""}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="flex w-full flex-col gap-6 px-1 py-2 sm:px-3"
    >
      {/* Page header */}
      <div className="flex items-start gap-3">
        {/* <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500">
          <Building2 className="h-5 w-5" />
        </div> */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
            Brand Settings
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage members, allocation, and configuration for this brand.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <TabsNav tabs={TAB_CONFIG} activeId={activeTab} onChange={setActiveTab} />

      {/* Body */}
      {brandsLoading ? (
        /* The panel that's about to render, not a spinner. TAB_CONFIG's first
           tab is Basic Info — a form — and the tab bar above is already
           interactive, so previewing that form is both accurate and steadier
           than a centred spinner collapsing into a full-height panel. */
        <SkeletonForm fields={5} />
      ) : !activeBrandId ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-surface py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-400">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="font-semibold text-gray-700">No active brand</p>
          <p className="max-w-xs text-sm text-gray-400">
            Select a brand to manage its members, allocation, and settings.
          </p>
          <Link
            href="/brand/reuse"
            className="mt-1 rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Choose a brand
          </Link>
        </div>
      ) : (
        renderPanel()
      )}
    </div>
  );
}
