"use client";

/**
 * Ads Content section layout (/ads-content/*)
 * The connected ad accounts, "+ More connections", then Publishing /
 * Calendar / Analytics — see ContentSectionShell. Pages read the picked
 * account with useAdsPlatform().
 */

import { Megaphone, Calendar, Activity } from "lucide-react";
import ContentSectionShell from "@/app/(components)/content/ContentSectionShell";
import {
  AD_NETWORKS,
  AdsPlatformContext,
} from "@/app/(components)/content/socialPlatformScope";

const NAV_ITEMS = [
  { label: "Publishing", href: "/ads-content/publishing", icon: Megaphone },
  { label: "Calendar", href: "/ads-content/calendar", icon: Calendar },
  { label: "Analytics", href: "/ads-content/analytics", icon: Activity },
];

export default function AdsContentLayout({ children }) {
  return (
    <ContentSectionShell
      title="Ads Content"
      kind="ads"
      navItems={NAV_ITEMS}
      networks={AD_NETWORKS}
      Context={AdsPlatformContext}
    >
      {children}
    </ContentSectionShell>
  );
}
