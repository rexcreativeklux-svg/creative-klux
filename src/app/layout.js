// app/layout.js
import "@/app/globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

export const metadata = {
  title: "My App",
  description: "A Next.js app with authentication and branding",
};