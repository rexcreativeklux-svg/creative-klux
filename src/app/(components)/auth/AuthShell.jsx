/**
 * AuthShell
 * ---------------------------------------------------------------------------
 * The inner form column shared by every auth screen (login, register,
 * forgot/change password, verify email). It renders the mobile logo, an
 * optional heading, and a width-capped, vertically-centred card for the page's
 * form body (passed as `children`).
 *
 * The outer frame — the animated showcase panel, the two-column split, and the
 * scroll container — lives in `app/(auth)/layout.jsx`, so it persists across
 * auth navigations and isn't repeated per page. This component is what each
 * page returns into that layout's form column.
 *
 * `min-h-full` makes this block at least the column's (viewport) height so
 * `justify-center` centres the form for every length; when a form is taller
 * than the viewport it grows past it and scrolls from the top (the layout's
 * block column owns `overflow-y-auto`). The column MUST be a block — not a flex
 * container — for this percentage min-height to resolve.
 *
 * @param {string}                    [title]     Heading above the form.
 * @param {string|React.ReactNode}    [subtitle]  Muted line under the heading.
 * @param {React.ReactNode}           children    The form body.
 *
 * @example
 *   <AuthShell title="Welcome back" subtitle="Sign in to your account.">
 *     <form>…</form>
 *   </AuthShell>
 */

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-8 sm:px-12 xl:px-20 py-12">
      {/* Mobile logo (the showcase panel carries the brand on desktop) */}
      <div className="flex lg:hidden items-center gap-2 mb-10 self-start">
        <img src="/logoblue.svg" alt="Logo" className="w-7 h-7" />
        <span className="text-lg font-bold text-gray-900">Creative Klux</span>
      </div>

      {/* Card — capped width so it doesn't stretch on ultrawide screens */}
      <div className="w-full max-w-100">
        {(title || subtitle) && (
          <div className="mb-7">
            {title && (
              <h1
                className="text-[26px] font-bold text-gray-900 tracking-tight leading-tight mb-1.5"
                style={{ fontFamily: "Geist, sans-serif" }}
              >
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-[13.5px] text-gray-400">{subtitle}</p>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
