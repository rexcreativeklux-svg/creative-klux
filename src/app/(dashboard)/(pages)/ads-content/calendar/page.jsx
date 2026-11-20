/**
 * Publishing, Calendar and Analytics are one page per ad network now — see
 * /ads-content (AdsInsightsPage). This address forwards there, keeping the
 * network picked in the sidebar.
 */

import { redirect } from "next/navigation";

export default async function Forward({ searchParams }) {
  const { platform } = (await searchParams) || {};
  redirect(platform ? `/ads-content?platform=${encodeURIComponent(platform)}` : "/ads-content");
}
