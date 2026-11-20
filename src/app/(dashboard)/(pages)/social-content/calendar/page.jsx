/**
 * Publishing, Calendar and Analytics are one page per network now — see
 * /social-content (NetworkInsightsPage). This address forwards there,
 * keeping the network picked in the sidebar.
 */

import { redirect } from "next/navigation";

export default async function Forward({ searchParams }) {
  const { platform } = (await searchParams) || {};
  redirect(platform ? `/social-content?platform=${encodeURIComponent(platform)}` : "/social-content");
}
