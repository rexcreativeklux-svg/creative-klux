import { BrandProvider } from "@/context/BrandContext";
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
        {/* Inter – variable font, super fast & beautiful */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>

      <body>
        <ThemeProvider>
          <AuthProvider>
            <BrandProvider>
              <ReusableFunctionsProvider>{children}</ReusableFunctionsProvider>
            </BrandProvider>
          </AuthProvider>
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>

        {/* Woxelo Live Chat */}
        <Script
          src="https://app.woxelo.com/livechat/settings.js"
          data-widget="6uqcR8AH5v77dtTXz1buTLJh7rWYGXs0eICS2n3s"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
