import { SITE } from "@/(lib)/site";

// /sitemap.xml — only the indexable public pages. Everything else is behind
// sign-in and noindexed (see app/layout.js). Add a page here when it opts into
// indexing via pageMetadata().
const PUBLIC_PAGES = [
  { path: "/register", priority: 1, changeFrequency: "monthly" },
  { path: "/login", priority: 0.8, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap() {
  return PUBLIC_PAGES.map(({ path, ...rest }) => ({
    url: `${SITE.url}${path}`,
    ...rest,
  }));
}
