"use client";

import { useState, useEffect } from "react";
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
  useEffect(() => setMounted(true), []);
  // Avoid a hydration mismatch — don't highlight until mounted.
  const current = mounted ? theme : undefined;

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

  if (collapsed) {
    return <div className="flex justify-center px-2 py-2">{control}</div>;
  }

  return (
    <div className="flex items-center justify-between px-3 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        Theme
      </span>
      {control}
    </div>
  );
}
