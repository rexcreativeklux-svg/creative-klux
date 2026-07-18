/**
 * AuthShell
 * ---------------------------------------------------------------------------
 * The width-capped form card shared by every auth screen (login, register,
 * forgot/change password, verify email): an optional heading plus the page's
 * form body (passed as `children`).
 *
 * The outer frame — the animated showcase panel, the mobile brand header, the
 * two-column split, and the scroll area — lives in `app/(auth)/layout.jsx`, so
 * it persists across auth navigations and isn't repeated per page. This card is
 * what each page returns into that layout's form area.
 *
 * Centring: the layout's form area is a scrollable flex column; `my-auto` here
 * absorbs the free space to centre the card when it's shorter than the area,
 * and collapses to 0 so the card scrolls from the top when it's taller. Auto
 * margins are used (instead of a percentage min-height) because they work
 * reliably inside a flex scroll container regardless of content length.
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
    // Capped width so it doesn't stretch on ultrawide screens; my-auto centres
    // it vertically within the layout's scrollable form area.
    <div className="w-full max-w-100 my-auto py-12">
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
  );
}
