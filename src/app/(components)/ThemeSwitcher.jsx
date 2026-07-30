"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Sun, Monitor, Moon } from "lucide-react";

// Theme switcher (sun / system / moon), driven by next-themes.
//   <ThemeSwitcher />            // full row with "THEME" label
//   <ThemeSwitcher collapsed />  // icons only, for the collapsed sidebar

const OPTIONS = [
  { id: "light", icon: Sun, label: "Light" },
  { id: "system", icon: Monitor, label: "System" },
  { id: "dark", icon: Moon, label: "Dark" },
];

export default function ThemeSwitcher({ collapsed = false }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Drop-up menu open state — only used by the collapsed variant.
  const [menuOpen, setMenuOpen] = useState(false);
  // Trigger position for the fixed-positioned drop-up (escapes the sidebar's
  // overflow-hidden clipping so the menu isn't cut off when collapsed).
  const triggerRef = useRef(null);
  const [coords, setCoords] = useState({ left: 0, bottom: 0 });
  useEffect(() => setMounted(true), []);
  // Avoid a hydration mismatch — don't highlight until mounted.
  const current = mounted ? theme : undefined;

  // Icon for the currently active theme (falls back to System pre-mount).
  const CurrentIcon = (OPTIONS.find((o) => o.id === current) ?? OPTIONS[1]).icon;

  const control = (
    <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
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
            className={`flex items-center justify-center w-7 h-7 rounded-full transition-all cursor-pointer ${
              active
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        );
      })}
    </div>
  );

  // Collapsed sidebar: show a single current-theme icon that opens a
  // drop-up menu of the options — mirrors the user dropdown behaviour.
  // The menu uses fixed positioning (anchored to the trigger) so it isn't
  // clipped by the sidebar's overflow-hidden while collapsed.
  const openMenu = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setCoords({ left: rect.left, bottom: window.innerHeight - rect.top + 8 });
    }
    setMenuOpen(true);
  };

  if (collapsed) {
    return (
      // h-(--ck-rail-row): both variants are pinned to the same height so this
      // row's top border stays on the line the home page's template rail lines
      // itself up with. See the --ck-rail-* note in globals.css.
      <div className="relative flex h-(--ck-rail-row) items-center justify-center px-2">
        {/* Backdrop — closes menu when clicking outside */}
        {menuOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
        )}

        {/* Drop-up options menu */}
        {menuOpen && (
          <div
            style={{ left: coords.left, bottom: coords.bottom }}
            className="fixed z-50 w-36 rounded-xl bg-surface border border-gray-200 shadow-xl py-1.5"
          >
            {OPTIONS.map(({ id, icon: Icon, label }) => {
              const active = current === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setTheme(id);
                    setMenuOpen(false);
                  }}
                  aria-pressed={active}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors cursor-pointer ${
                    active
                      ? "text-blue-600 font-semibold"
                      : "text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Trigger — current theme icon */}
        <button
          ref={triggerRef}
          type="button"
          onClick={() => (menuOpen ? setMenuOpen(false) : openMenu())}
          title="Theme"
          aria-label="Theme"
          className={`flex items-center justify-center w-9 h-9 rounded-full text-gray-500 transition-all cursor-pointer ${
            menuOpen ? "bg-gray-100" : "hover:bg-gray-100"
          }`}
        >
          <CurrentIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-(--ck-rail-row) items-center justify-between px-3">
      <span className="text-[10px] font-medium uppercase tracking-widest text-gray-400">
        Theme
      </span>
      {control}
    </div>
  );
}
