"use client";

// app/(components)/appearance/ThemeSegmented.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The sun / system / moon pill group, on its own.
//
// TWO callers, which is the whole reason it is a file: the sidebar's foot row
// shows it inline (ThemeSwitcher) and the Appearance panel shows it under its
// "Theme" heading. One implementation, so the two can't drift into different
// controls for the same setting.
//
// ⚠️ It lives HERE rather than in ThemeSwitcher, where it started, to keep the
// imports acyclic: ThemeSwitcher renders AppearanceButton, which renders
// AppearancePanel, which needs this. Exporting it from ThemeSwitcher closed
// that loop — ESM tolerates the cycle, but a bundler reordering it or HMR
// re-evaluating one side is a broken control at runtime for no gain.

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Sun, Monitor, Moon } from "lucide-react";

const OPTIONS = [
  { id: "light", icon: Sun, label: "Light" },
  { id: "system", icon: Monitor, label: "System" },
  { id: "dark", icon: Moon, label: "Dark" },
];

/**
 * False while the server's HTML is being hydrated, true from the first client
 * render after it — which is exactly when it becomes safe to read the theme.
 *
 * The theme is resolved from localStorage and the OS, neither of which the
 * server can see, so highlighting a pill before this flips would be telling
 * React a different tree than the one it sent. The subscribe callback never
 * fires because nothing external changes: the two snapshot functions
 * disagreeing IS the signal, and React re-renders once when it notices.
 *
 * (This was `useState(false)` + `useEffect(() => setMounted(true))`, which does
 * the same job by deliberately causing the cascading render React's lint rule
 * exists to catch.)
 */
const NEVER_CHANGES = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    NEVER_CHANGES,
    () => true,
    () => false,
  );

/**
 * @param {object} props
 * @param {boolean} [props.full] Stretch each pill to share the width evenly —
 *   what the panel wants, where the group is a section rather than a trailing
 *   control on a row.
 */
export default function ThemeSegmented({ full = false }) {
  const { theme, setTheme } = useTheme();
  // Avoid a hydration mismatch — don't highlight until hydrated.
  const current = useHydrated() ? theme : undefined;

  return (
    <div
      className={`flex items-center gap-1 rounded-full bg-gray-100 p-1 ${
        full ? "w-full" : ""
      }`}
    >
      {OPTIONS.map(({ id, icon: Icon, label }) => {
        const active = current === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            title={label}
            aria-label={label}
            aria-pressed={active}
            className={`flex h-7 cursor-pointer items-center justify-center rounded-full transition-all ${
              full ? "flex-1" : "w-7"
            } ${
              active
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            }`}
          >
            {/* h-* AND w-*: lucide hard-codes height="24" on its <svg>, so a
                width-only class letterboxes the glyph. */}
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
