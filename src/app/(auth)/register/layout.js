import { pageMetadata } from "@/(lib)/site";

// SEO metadata for the public sign-up page. This is a top-of-funnel landing
// page, so it is intentionally indexable with rich Open Graph / Twitter cards.
export const metadata = pageMetadata({
  title: "Create Your Free Account — 7-Day Trial",
  socialTitle: "Try Creative Klux free for 7 days",
  description:
    "Sign up for Creative Klux free for 7 days. Generate AI ad creatives, design on-brand social posts and publish to every platform from one workspace.",
  path: "/register",
});

export default function RegisterLayout({ children }) {
  return <>{children}</>;
}
