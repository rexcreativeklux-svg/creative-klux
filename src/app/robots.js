import { SITE } from "@/(lib)/site";

// /robots.txt. Keeps crawlers out of auth hand-offs, account/billing screens,
// admin impersonation and the API. Everything else is crawlable but carries
// noindex from the root layout unless the page opts in — see app/layout.js.
//
// ⚠️ Don't disallow pages people SHARE (invites, designs, the dashboard):
// Twitterbot and Slackbot obey robots.txt, so a disallowed URL loses its link
// preview card. noindex already keeps those out of search.
export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/oauth-callback",
        "/auth/",
        "/impersonate",
        "/change-password",
        "/verify-email",
        "/billing",
        "/profile",
        "/sessions-and-password",
        "/team",
        "/resell",
        "/custom-domain",
        "/logo-test",
        "/view-loader",
      ],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
