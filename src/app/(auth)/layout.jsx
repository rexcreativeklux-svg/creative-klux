// app/(auth)/layout.jsx
"use client";

import "@/app/globals.css"; // Import global styles for Tailwind
import { useAuth } from "@/context/AuthContext";
import AuthShowcasePanel from "@/app/(components)/auth/AuthShowcasePanel";

/**
 * Shared layout for all auth screens (login, register, forgot/change password,
 * verify email).
 *
 * It owns the whole auth frame so individual pages don't repeat it:
 *   • the animated showcase panel (desktop) — mounted here so it persists and
 *     keeps playing as the user moves between auth routes,
 *   • the two-column split, and
 *   • the scrollable form column that each page's content flows into.
 *
 * Note: globals.css sets `body { overflow: hidden }`, so the form column owns
 * its own `overflow-y-auto`. Each page returns an <AuthShell> (the inner card)
 * as its content.
 */
function AuthContent({ children }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-page">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-[#1447e6] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    // Full viewport, no page scroll — the form column scrolls on its own.
    <div className="fixed inset-0 flex flex-row-reverse bg-surface overflow-hidden">
      {/* Visual showcase (desktop only) */}
      <AuthShowcasePanel />

      {/* Form column — scrolls independently */}
      <div className="w-full lg:w-1/2 h-full flex flex-col overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

export default function AuthLayout({ children }) {
  return <AuthContent>{children}</AuthContent>;
}
