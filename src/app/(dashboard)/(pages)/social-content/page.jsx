"use client";

/**
 * /social-content — one network's page (see NetworkInsightsPage), for the
 * network picked in the sidebar (?platform=). The section shell picks the
 * first connected network when none is in the URL, so "all" only shows for
 * the moment before that lands, or when nothing is connected.
 */

import NetworkInsightsPage from "@/app/(components)/insights/NetworkInsightsPage";
import { useSocialPlatform } from "@/app/(components)/content/socialPlatformScope";
import { PublishingSkeleton } from "@/app/(components)/skeletons/ContentSectionSkeletons";

export default function SocialContentPage() {
  const { platform, scoped } = useSocialPlatform();
  if (!scoped) return <PublishingSkeleton />;
  // Keyed by network so switching starts from a clean page.
  return <NetworkInsightsPage key={platform} platform={platform} />;
}
