import { pageMetadata } from "@/(lib)/site";

// SEO metadata for the public sign-in page. The page itself is a client
// component, so its metadata lives here in the server layout.
export const metadata = pageMetadata({
  title: "Sign In to Your AI Creative Workspace",
  socialTitle: "Sign in to Creative Klux",
  description:
    "Sign in to Creative Klux to create AI ad creatives, social posts and brand designs, then schedule and publish them across every platform you manage.",
  path: "/login",
});

export default function LoginLayout({ children }) {
  return <>{children}</>;
}
