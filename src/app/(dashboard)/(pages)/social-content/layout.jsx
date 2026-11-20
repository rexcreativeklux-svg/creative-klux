"use client";

/**
 * Social Content section layout (/social-content/*)
 * The connected social accounts, "+ More connections", then Publishing /
 * Calendar / Analytics — see ContentSectionShell. Pages read the picked
 * account with useSocialPlatform().
 */

import { Share2, Calendar, Activity } from "lucide-react";
import ContentSectionShell from "@/app/(components)/content/ContentSectionShell";
import {
  SOCIAL_NETWORKS,
  SocialPlatformContext,
} from "@/app/(components)/content/socialPlatformScope";

const NAV_ITEMS = [
  { label: "Publishing", href: "/social-content/publishing", icon: Share2 },
  { label: "Calendar", href: "/social-content/calendar", icon: Calendar },
  { label: "Analytics", href: "/social-content/analytics", icon: Activity },
];

export default function SocialContentLayout({ children }) {
  return (
    <ContentSectionShell
      title="Social Content"
      kind="social"
      navItems={NAV_ITEMS}
      networks={SOCIAL_NETWORKS}
      Context={SocialPlatformContext}
    >
      {children}
    </ContentSectionShell>
  );
}
