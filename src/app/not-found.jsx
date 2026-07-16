/**
 * Global 404 page.
 * ──────────────────────────────────────────────────────────────────────────────
 * Replaces Next.js's default not-found screen with a sleek, on-brand one.
 * Rendered inside the root layout (so it inherits theme + providers). Server
 * component — no client hooks needed; navigation uses a plain <Link>.
 */

import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-page px-6 text-center">
      <div className="flex w-full max-w-md flex-col items-center">
        {/* Icon badge */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#155dfc]">
          <Search className="h-7 w-7" />
        </div>

        {/* Big 404 */}
        <p className="mt-8 bg-linear-to-r from-[#155dfc] to-[#0ea5e9] bg-clip-text text-7xl font-black tracking-tight text-transparent sm:text-8xl">
          404
        </p>

        <h1 className="mt-4 text-xl font-bold text-gray-900 sm:text-2xl">
          Page not found
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          The page you&rsquo;re looking for doesn&rsquo;t exist, was moved, or is
          no longer available.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#155dfc] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Home className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
