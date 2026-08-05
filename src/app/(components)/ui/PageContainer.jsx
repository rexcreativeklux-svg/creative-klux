"use client";

// app/(components)/ui/PageContainer.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The standard frame around a page's content: fluid side gutters, fluid
// vertical rhythm, clearance for the fixed header above and the mobile bottom
// nav below.
//
// ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
// The dashboard layout wrapped every page in a flat `px-9 pt-24` — 36px
// gutters and 96px of top padding at EVERY width, including a 360px phone,
// where that alone eats a fifth of the screen.
//
// Both numbers are now tokens (see globals.css): `px-page` ramps 12 → 36px
// with the viewport and `pt-header` tracks the header's own fluid height.
// Change the header's height in one place and the clearance follows.
//
// The mobile bottom bar is deliberately NOT this component's problem: `main`
// in (dashboard)/layout.js shortens the scroll viewport by --spacing-nav, so
// no page — framed here or not, scrolling as a whole or in a nested pane —
// can put content under the bar.
//
// ── THE TWO PADDINGS THAT ARE NOT INTERCHANGEABLE ───────────────────────────
// `pt-header` clears the FIXED header, which overlays the scroll area — it is
// structural and every scrolling page needs it.
// `py-page` is the page's own breathing room.
// They stack; `topPadding="none"` drops only the first, for a page that draws
// its own full-bleed hero under the header (the home page does this).
//
// ── USAGE ───────────────────────────────────────────────────────────────────
//   export default function BillingPage() {
//     return (
//       <PageContainer title="Plans and billing">
//         …
//       </PageContainer>
//     );
//   }

/**
 * Max content width. Static map — Tailwind cannot generate `max-w-${n}`.
 * `wide` is the default because most pages here are grids and tables that
 * benefit from the room; `prose` is for text-led pages (legal, help).
 */
const WIDTH_CLASS = {
  prose: "max-w-3xl",
  narrow: "max-w-5xl",
  wide: "max-w-7xl",
  full: "max-w-none",
};

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string}  [props.title]        Optional page heading, rendered fluidly.
 * @param {React.ReactNode} [props.actions] Right-aligned controls beside the
 *   title. Wraps below it on narrow screens rather than squeezing the heading.
 * @param {React.ReactNode} [props.description] Sub-heading under the title.
 * @param {keyof typeof WIDTH_CLASS} [props.width="wide"]
 * @param {"header"|"none"} [props.topPadding="header"] "none" for pages that
 *   draw their own content under the fixed header.
 * @param {boolean} [props.center=true]  Centre the content column.
 * @param {string}  [props.className]    Extra classes on the outer wrapper.
 */
export default function PageContainer({
  children,
  title,
  actions,
  description,
  width = "wide",
  topPadding = "header",
  center = true,
  className = "",
}) {
  // Three paddings, each doing one job:
  //   px-gutter  fluid side gutters (12 → 36px)
  //   pt-*       clears the FIXED header, plus the page's own top rhythm
  //   pb-page-y  the page's own bottom rhythm — and only that. The mobile
  //              bottom nav is NOT cleared here: `main` in
  //              (dashboard)/layout.js ends the scroll viewport at the bar's
  //              top edge for every route, so repeating it would leave a
  //              bar-height gap under the last row.
  return (
    <div
      className={`
        px-gutter
        ${topPadding === "header" ? "pt-[calc(var(--spacing-header)+var(--spacing-page-y))]" : "pt-page-y"}
        pb-page-y
        ${className}
      `}
    >
      <div className={`${WIDTH_CLASS[width] || WIDTH_CLASS.wide} ${center ? "mx-auto" : ""}`}>
        {(title || actions || description) && (
          <header className="mb-section flex flex-col gap-stack sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              {title && (
                <h1 className="truncate text-2xl font-bold tracking-tight text-gray-900">
                  {title}
                </h1>
              )}
              {description && (
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              )}
            </div>
            {/* shrink-0 so a long title truncates instead of crushing the
                buttons — on a phone these stack anyway (flex-col above). */}
            {actions && (
              <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
            )}
          </header>
        )}
        {children}
      </div>
    </div>
  );
}
