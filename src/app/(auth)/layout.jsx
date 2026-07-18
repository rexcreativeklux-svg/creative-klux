// app/(auth)/layout.jsx
"use client";

import "@/app/globals.css"; // Import global styles for Tailwind
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AuthShowcasePanel from "@/app/(components)/auth/AuthShowcasePanel";

/**
 * Shared layout for all auth screens (login, register, forgot/change password,
 * verify email).
 *
 * It owns the whole auth frame so individual pages don't repeat it:
 *   • the animated showcase panel (desktop) — mounted here so it persists and
 *     keeps playing as the user moves between auth routes,
 *   • a fixed brand header on mobile (the panel carries the brand on desktop),
 *   • the two-column split, and
 *   • the scrollable form area that each page's content flows into.
 *
 * Note: globals.css sets `body { overflow: hidden }`, so the form area owns its
 * own `overflow-y-auto`. Each page returns an <AuthShell> (the inner card) as
 * its content, centred within that area.
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
    // Full viewport, no page scroll — the form area scrolls on its own.
    <div className="fixed inset-0 flex flex-row-reverse bg-surface overflow-hidden">
      {/* Visual showcase (desktop only) */}
      <AuthShowcasePanel />

      {/* Form column: a fixed mobile header + a scrollable, centred form area. */}
      <div className="w-full lg:w-1/2 h-full flex flex-col">
        {/* Mobile header — on desktop the showcase panel carries the brand. */}
        <header className="lg:hidden shrink-0 flex items-center justify-between h-15 px-5 sm:px-8 border-b border-gray-100 bg-surface">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <img
              src="/logoblue.svg"
              alt="Creative Klux"
              className="w-7 h-7 shrink-0"
            />
            <span
              className="text-[15px] font-semibold text-gray-900"
              style={{ fontFamily: "Geist, sans-serif" }}
            >
              Creative Klux
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1 text-[12.5px] text-gray-400 hover:text-gray-700 no-underline transition-colors"
          >
            <ChevronLeft size={13} />
            Back to site
          </Link>
        </header>

        {/* Scrollable, vertically-centred form area. `min-h-0` lets this flex
            child shrink so it can scroll; centring is handled by the page's
            <AuthShell> via auto-margins. */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center px-6 sm:px-12 xl:px-20">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }) {
  return <AuthContent>{children}</AuthContent>;
}
