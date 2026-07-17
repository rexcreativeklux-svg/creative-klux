// SEO metadata for the public sign-in page. The page itself is a client
// component, so its metadata lives here in the server layout.
export const metadata = {
  metadataBase: new URL("https://app.creativeklux.com"),
  title: "Sign In · Creative Klux",
  description:
    "Sign in to Creative Klux — the all-in-one platform for creators, managers & brands. Access your AI content, design tools, client dashboards, and social publishing in one place.",
  keywords: [
    "Creative Klux login",
    "sign in",
    "log in",
    "creator dashboard",
    "AI content platform",
    "social media tools",
  ],
  applicationName: "Creative Klux",
  authors: [{ name: "Creative Klux" }],
  creator: "Creative Klux",
  publisher: "Creative Klux",
  alternates: { canonical: "/login" },
  openGraph: {
    title: "Sign In to Creative Klux",
    description:
      "Access your creative workspace — AI content, design tools, and social publishing in one place.",
    url: "https://app.creativeklux.com/login",
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
    title: "Sign In to Creative Klux",
    description:
      "Access your creative workspace — AI content, design tools, and social publishing in one place.",
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

export default function LoginLayout({ children }) {
  return <>{children}</>;
}
