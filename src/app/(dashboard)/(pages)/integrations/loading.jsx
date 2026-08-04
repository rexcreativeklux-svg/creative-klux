"use client";

// /integrations — loading UI.
// Mirrors page.jsx: heading, the blue "How it works" banner, then the two
// platform sections. The banner is drawn for real — its copy is static, so
// there is nothing to wait for and greying it out would only lose information.

import { Info } from "lucide-react";
import Skeleton from "@/app/(components)/skeletons/Skeleton";
import IntegrationsSkeleton from "@/app/(components)/integrations/IntegrationsSkeleton";

export default function Loading() {
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1">
        {/* Page header */}
        <div className="mb-8 flex flex-col gap-2">
          <Skeleton className="h-7 w-44 rounded-md" />
          <Skeleton className="h-3 w-full max-w-xl" tone="soft" />
        </div>

        {/* How it works banner — real, since its content is static */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#c7d9fd] bg-[#eff4ff] px-4 py-3.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#155dfc]" />
          <p className="text-sm leading-relaxed text-[#1e40af]">
            <span className="font-semibold">How it works: </span>
            Click <span className="font-medium italic">Connect</span> on any
            platform. A popup opens where you log in and approve permissions.
            Your credentials are saved automatically to your active brand.
          </p>
        </div>

        <IntegrationsSkeleton />
      </div>
    </div>
  );
}
