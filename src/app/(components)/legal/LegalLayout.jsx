/**
 * LegalLayout + typography helpers
 * ---------------------------------------------------------------------------
 * Shared chrome and styling for the public legal documents (Terms of Service,
 * Privacy Policy). Server component — pure markup, no client JS — so each page
 * can export its own SEO `metadata`.
 *
 * Because the app sets `body { overflow: hidden }` globally (see globals.css),
 * a normal document-flow page would NOT scroll. This layout therefore owns its
 * own full-viewport scroll container (`fixed inset-0 overflow-y-auto`).
 *
 * Usage:
 *   <LegalLayout title="Privacy Policy" updated="July 17, 2026"
 *                summary="…" toc={[{ id: "info", label: "1. Information" }]}>
 *     <Section id="info" title="1. Information we collect">
 *       <P>…</P>
 *       <Bullets items={["…", "…"]} />
 *     </Section>
 *   </LegalLayout>
 */

import Link from "next/link";

// ─── Typography helpers (keep every legal page visually consistent) ───────────

export function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-24 mb-10">
      <h2 className="text-[19px] sm:text-[21px] font-bold text-gray-900 tracking-tight mb-3">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function SubHeading({ children }) {
  return (
    <h3 className="text-[14.5px] font-semibold text-gray-800 mt-5 mb-1">
      {children}
    </h3>
  );
}

export function P({ children }) {
  return (
    <p className="text-[14px] leading-[1.75] text-gray-500">{children}</p>
  );
}

export function Bullets({ items }) {
  return (
    <ul className="space-y-2 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2.5 text-[14px] leading-[1.7] text-gray-500">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1447e6]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function LegalLayout({ title, updated, summary, toc, children }) {
  return (
    <div className="fixed inset-0 overflow-y-auto bg-page scroll-smooth">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 sm:px-8 h-15">
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
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden sm:inline text-[13px] font-medium text-gray-500 hover:text-gray-900 no-underline transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#1447e6] px-3.5 py-2 text-[13px] font-semibold text-white no-underline transition-colors hover:bg-[#0f3bbf]"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-6xl px-5 sm:px-8 pb-24">
        {/* Hero */}
        <div className="border-b border-gray-100 pt-12 pb-9 sm:pt-16 sm:pb-11">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-gray-400 hover:text-gray-700 no-underline transition-colors mb-6"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 18l-6-6 6-6"
              />
            </svg>
            Back to Creative Klux
          </Link>
          <h1
            className="text-[30px] sm:text-[40px] font-bold tracking-tight text-gray-900 leading-tight"
            style={{ fontFamily: "Geist, sans-serif" }}
          >
            {title}
          </h1>
          <p className="mt-2 text-[13px] text-gray-400">
            Last updated: <span className="text-gray-500">{updated}</span>
          </p>
          {summary && (
            <p className="mt-5 max-w-2xl text-[14.5px] leading-[1.75] text-gray-500">
              {summary}
            </p>
          )}
        </div>

        {/* Two-column: sticky TOC + article */}
        <div className="flex flex-col lg:flex-row gap-10 xl:gap-16 pt-10">
          {/* Table of contents */}
          {toc?.length > 0 && (
            <aside className="lg:w-56 xl:w-64 shrink-0">
              <nav className="lg:sticky lg:top-24">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  On this page
                </p>
                <ul className="space-y-1.5 border-l border-gray-100">
                  {toc.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="block -ml-px border-l-2 border-transparent pl-4 py-0.5 text-[13px] leading-snug text-gray-400 no-underline transition-colors hover:border-[#1447e6] hover:text-gray-900"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          )}

          {/* Article */}
          <article className="min-w-0 flex-1 max-w-3xl">{children}</article>
        </div>

        {/* Footer */}
        <footer className="mt-16 border-t border-gray-100 pt-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-[12.5px] text-gray-400">
              © {new Date().getFullYear()} Creative Klux. All rights reserved.
            </p>
            <div className="flex items-center gap-5 text-[12.5px] font-medium">
              <Link
                href="/terms"
                className="text-gray-500 hover:text-gray-900 no-underline transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-gray-500 hover:text-gray-900 no-underline transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/login"
                className="text-gray-500 hover:text-gray-900 no-underline transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
