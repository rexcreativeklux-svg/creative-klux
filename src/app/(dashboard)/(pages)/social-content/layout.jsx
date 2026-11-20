"use client";

/**
 * Social Content section layout (/social-content)
 * The connected social accounts and "+ More connections" — see
 * ContentSectionShell. There are no page tabs: each network has one page with
 * its own tabs (NetworkInsightsPage), and no "All accounts" row — the first
 * connected network opens when none is picked. Pages read the picked network
 * with useSocialPlatform().
 */

import ContentSectionShell from "@/app/(components)/content/ContentSectionShell";
import {
  SOCIAL_NETWORKS,
  SocialPlatformContext,
} from "@/app/(components)/content/socialPlatformScope";

export default function SocialContentLayout({ children }) {
  return (
    <ContentSectionShell
      title="Social Content"
      kind="social"
      navItems={[]}
      networks={SOCIAL_NETWORKS}
      Context={SocialPlatformContext}
      allOption={false}
    >
      {children}
    </ContentSectionShell>
  );
}
