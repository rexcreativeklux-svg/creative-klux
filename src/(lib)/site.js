// Site-wide SEO / link-preview config — the ONE place the app's public URL,
// name and shared Open Graph fields live. Pages build their metadata through
// pageMetadata() rather than repeating these.
//
// Why a helper: in the Next.js metadata API a child route's `openGraph` (and
// `twitter`) object REPLACES the parent's wholesale — it does not merge. A page
// that sets only an og:title would silently lose the image, and with it the
// WhatsApp / iMessage / Slack preview card. pageMetadata() always re-includes
// the image and the shared fields.

export const SITE = {
  // Canonical host. www.creativeklux.com is the separate marketing site; this
  // app lives on the app. subdomain, which serves 200 with no redirect.
  url: "https://app.creativeklux.com",
  // The company's marketing site — the Organization's home in JSON-LD.
  homepage: "https://www.creativeklux.com",
  name: "Creative Klux",
  title: "Creative Klux — AI Ads, Social Posts & Brand Design",
  tagline: "Launch ads that stop the scroll.",
  description:
    "Create AI ad creatives, social posts and brand designs, then schedule and publish them to every platform — all from one Creative Klux workspace.",
  locale: "en_US",
  themeColor: "#1447e6",
  logo: "/icon-512.png",
  sameAs: [],
};

// public/og-image.jpg — regenerate with `npm run og-image`
// (scripts/generate-og-image.mjs). WhatsApp needs an absolute https JPEG/PNG
// with explicit dimensions; metadataBase turns the path into an absolute URL.
export const OG_IMAGE = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  type: "image/jpeg",
  alt: "Creative Klux — launch ads that stop the scroll. AI ads, social posts and brand design in one workspace.",
};

/**
 * Metadata for a page, with the full OG/Twitter card always included.
 *
 * @param {object}  opts
 * @param {string}  opts.title        Page title; the root template appends " | Creative Klux".
 * @param {string}  opts.description  ~140–160 chars, unique per page.
 * @param {string}  opts.path         Route path, e.g. "/login" — used for canonical and og:url.
 * @param {string}  [opts.socialTitle] Title for the share card (defaults to `title`).
 * @param {boolean} [opts.index=true] false → noindex (still previews fine when shared).
 */
export function pageMetadata({
  title,
  description,
  path,
  socialTitle = title,
  index = true,
}) {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: socialTitle,
      description,
      url: path,
      siteName: SITE.name,
      locale: SITE.locale,
      type: "website",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [OG_IMAGE.url],
    },
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
        }
      : { index: false, follow: true },
  };
}
