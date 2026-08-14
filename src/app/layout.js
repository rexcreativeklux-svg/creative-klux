import "@/app/globals.css";
import { ReusableFunctionsProvider } from "@/context/ReusableFunctions";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeProvider";
import { Toaster } from "sonner";
import Script from "next/script";

export const metadata = {
  title: "Creative Klux",
  description:
    "Creative Klux is the all-in-one platform for creators, managers & brands. Get stunning templates, AI-generated content, design tools, client dashboards, and monetization — all in one place.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inter – variable font, super fast & beautiful.
            Manrope rides along in the same request as the display face for the
            home hero (`font-manrope`, see --font-manrope in globals.css) — one
            stylesheet, so it costs no extra round trip. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Manrope:wght@200..800&display=swap"
          rel="stylesheet"
        />

        {/* The skin AND the wallpaper, applied BEFORE FIRST PAINT.
            Both re-point the palette (app/skins.css), so restoring them in a
            React effect would show every returning user a flash of the default
            app first. This runs synchronously in <head>, the same trick
            next-themes uses for the dark class right above it.
            A stored skin id that no longer has CSS simply matches no rule, so
            an unknown value degrades to the default appearance rather than a
            broken one — and skins.js re-validates it against SKINS on read.
            The wallpaper URL is quoted into a CSS declaration, so it is
            VALIDATED against the same five rules as isSafeUrl() in
            appearance/wallpapers.js — a URL has to be accepted identically on
            boot and on click, or a background would apply and then vanish on
            the next reload. It checks rather than strips, and the backslash is
            matched via fromCharCode(92) rather than an escape, because this
            string is escaped twice on its way here (template literal, then
            JSX) and the first version of it silently ate every letter "s" in
            the URL.
            ⚠️ Keep both keys in step with STORAGE_KEY in appearance/skins.js
            and appearance/wallpapers.js. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var r=document.documentElement,s=localStorage.getItem("ck:skin");if(s&&s!=="default")r.setAttribute("data-skin",s);var w=localStorage.getItem("ck:wallpaper");if(w){var u=String(JSON.parse(w).url||"");var ok=u&&u.indexOf('"')<0&&u.indexOf("'")<0&&u.indexOf(")")<0&&u.indexOf(" ")<0&&u.indexOf(String.fromCharCode(92))<0;if(ok){r.style.setProperty("--ck-wallpaper",'url("'+u+'")');r.setAttribute("data-wallpaper","")}}}catch(e){}`,
          }}
        />
      </head>

      <body>
        <ThemeProvider>
          <AuthProvider>
            <ReusableFunctionsProvider>{children}</ReusableFunctionsProvider>
          </AuthProvider>
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>

        {/* Pixel Code for https://app.woxelo.com/ — live chat widget (loads after hydration) */}
        <Script
          id="woxelo-livechat"
          src="https://app.woxelo.com/livechat/settings.js"
          data-widget="6rpUkQ2nZaDjndk3ZkdDYt3F8IBtevo8FdilkR9T"
          strategy="afterInteractive"
        />
        {/* END Pixel Code */}
      </body>
    </html>
  );
}
