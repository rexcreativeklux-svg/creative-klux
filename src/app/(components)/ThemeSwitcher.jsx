"use client";

import AppearanceButton from "./appearance/AppearanceButton";
import ThemeSegmented from "./appearance/ThemeSegmented";

// The sidebar's foot row: theme, and the button that opens Appearance.
//   <ThemeSwitcher />            // full row with "THEME" label
//   <ThemeSwitcher collapsed />  // icons only, for the collapsed sidebar
//
// Both controls are imported, not defined here: the pill group is shared with
// the Appearance panel (appearance/ThemeSegmented), and the panel itself
// belongs to the button that opens it. What is left is this row's LAYOUT.
//
// ⚠️ The row's HEIGHT is load-bearing — both variants are pinned to
// --ck-rail-row because the home page's template rail lines its hairlines up
// with this row's top border. Whatever goes in here has to fit that height;
// see the --ck-rail-* note in globals.css before adding to it.
//
// ── Why the collapsed rail shows Appearance and not the theme ────────────────
// The collapsed rail is 60px wide (`w-15` in Sidebar.jsx) with 8px of padding a
// side, which is room for one 36px control — not two. So the rail shows the one
// that CONTAINS the other: the Appearance panel carries the same sun/system/moon
// control at its top, so the theme is one tap further away rather than gone.
// (This replaced a drop-up menu that did the same job for the theme alone.)
// The expanded row still shows both, with the theme control inline.

export default function ThemeSwitcher({ collapsed = false }) {
  // Collapsed rail: one control, and it is Appearance — see the note at the
  // top of this file for why the theme control doesn't get the slot.
  if (collapsed) {
    return (
      // h-(--ck-rail-row): both variants are pinned to the same height so this
      // row's top border stays on the line the home page's template rail lines
      // itself up with. See the --ck-rail-* note in globals.css.
      <div className="flex h-(--ck-rail-row) items-center justify-center px-2">
        <AppearanceButton size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-(--ck-rail-row) items-center justify-between gap-2 px-3">
      <span className="text-[10px] font-medium uppercase tracking-widest text-gray-400">
        Theme
      </span>
      {/* Theme, then Appearance beside it. Both fit at the expanded rail's
          224px: the label, three 28px pills and one 28px button. */}
      <div className="flex items-center gap-1.5">
        <ThemeSegmented />
        <AppearanceButton />
      </div>
    </div>
  );
}
