"use client";

/**
 * Ads Content section layout (/ads-content)
 * The connected ad accounts and "+ More connections" — see
 * ContentSectionShell. No page tabs and no "All accounts" row: each ad
 * network has one page with its own tabs (AdsInsightsPage), and the first
 * connected one opens when none is picked.
 */

import ContentSectionShell from "@/app/(components)/content/ContentSectionShell";
import {
  AD_NETWORKS,
  AdsPlatformContext,
} from "@/app/(components)/content/socialPlatformScope";

export default function AdsContentLayout({ children }) {
  return (
    <ContentSectionShell
      title="Ads Content"
      kind="ads"
      navItems={[]}
      networks={AD_NETWORKS}
      Context={AdsPlatformContext}
      allOption={false}
    >
      {children}
    </ContentSectionShell>
  );
}
