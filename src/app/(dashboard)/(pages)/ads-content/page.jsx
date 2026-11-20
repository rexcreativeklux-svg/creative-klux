"use client";

/**
 * /ads-content — one ad network's page (see AdsInsightsPage), for the network
 * picked in the sidebar (?platform=). The section shell picks the first
 * connected ad network when none is in the URL.
 */

import AdsInsightsPage from "@/app/(components)/insights/AdsInsightsPage";
import { useAdsPlatform } from "@/app/(components)/content/socialPlatformScope";
import { PublishingSkeleton } from "@/app/(components)/skeletons/ContentSectionSkeletons";

export default function AdsContentPage() {
  const { platform, scoped } = useAdsPlatform();
  if (!scoped) return <PublishingSkeleton />;
  // Keyed by network so switching starts from a clean page.
  return <AdsInsightsPage key={platform} platform={platform} />;
}
