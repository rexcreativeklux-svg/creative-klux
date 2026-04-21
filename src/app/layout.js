import { BrandProvider } from "@/context/BrandContext";
import "@/app/globals.css";
import { ReusableFunctionsProvider } from "@/context/ReusableFunctions";
import { AuthProvider, useAuth } from "@/context/AuthContext";


export const metadata = {
  title: "Creative Klux",
  description: "Creative Klux is the all-in-one platform for creators, managers & brands. Get stunning templates, AI-generated content, design tools, client dashboards, and monetization — all in one place.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Inter – variable font, super fast & beautiful */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>

      <body>
        <AuthProvider>
          <BrandProvider>
              <ReusableFunctionsProvider>
                {children}
              </ReusableFunctionsProvider>
          </BrandProvider>
        </AuthProvider>
      </body>
    </html>

  );
}
