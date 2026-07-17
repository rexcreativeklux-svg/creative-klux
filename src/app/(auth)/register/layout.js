// SEO metadata for the public sign-up page. This is a top-of-funnel landing
// page, so it is intentionally indexable with rich Open Graph / Twitter cards.
export const metadata = {
  metadataBase: new URL("https://app.creativeklux.com"),
  title: "Create Your Free Account · Creative Klux",
  description:
    "Sign up free for Creative Klux — the all-in-one platform for creators, managers & brands. Generate AI content, design stunning creatives, and publish to every platform. Start your 7-day free trial, no license code required.",
  keywords: [
    "Creative Klux sign up",
    "create account",
    "free trial",
    "AI content generator",
    "ad creatives",
    "social media design tool",
    "content creation platform",
    "AI design tool",
  ],
  applicationName: "Creative Klux",
  authors: [{ name: "Creative Klux" }],
  creator: "Creative Klux",
  publisher: "Creative Klux",
  alternates: { canonical: "/register" },
  openGraph: {
    title: "Create Your Free Creative Klux Account",
    description:
      "Join Creative Klux and turn ideas into scroll-stopping creatives. AI content, design tools, and social publishing in one place — free for 7 days.",
    url: "https://app.creativeklux.com/register",
    siteName: "Creative Klux",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/heroimg.png",
        width: 1200,
        height: 630,
        alt: "Creative Klux — the all-in-one creative platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Your Free Creative Klux Account",
    description:
      "AI content, design tools, and social publishing in one place. Start free for 7 days.",
    images: ["/heroimg.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "technology",
};

export default function RegisterLayout({ children }) {
  return <>{children}</>;
}
