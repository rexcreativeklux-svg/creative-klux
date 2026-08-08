"use client";

// app/(components)/appearance/AppearancePanel.jsx
// ─────────────────────────────────────────────────────────────────────────────
// What the Appearance button opens:
//
//     ┌──────────────────────────────┐
//     │ Appearance                 ✕ │
//     │ ☀ Theme                      │
//     │ [  ☀  │  ▫  │  ☾  ]          │
//     ├──────────────────────────────┤
//     │ 🎨 Skins                     │
//     │ ┌────────┐  ┌────────┐       │
//     │ │ swatch │  │ swatch │       │  ← scrolls
//     │ └────────┘  └────────┘       │
//     │  Default     Emerald Nebula  │
//     └──────────────────────────────┘
//
// Theme and skin are two different settings and both live here: the theme
// decides whether a skin shows its light or its dark treatment, so putting the
// toggle anywhere else would leave half of every skin unreachable from the
// place you choose skins.
//
// ⚠️ NO OVERLAY BEHIND THIS, and no dimming. A skin changes the whole app, so
// the app IS the preview — the panel deliberately floats over a live page you
// can watch repaint as you click through the tiles. Anything that greys the
// page out takes the only preview there is with it.
//
// The swatches paint themselves from the same CSS the skin does (.ck-skin-*, in
// app/skins.css), so no colour is written twice and a tile cannot be wrong
// about the skin it stands for.

import { useState } from "react";
import { Brush, Check, ImageIcon, Palette, SunMedium, X } from "lucide-react";
import ThemeSegmented from "./ThemeSegmented";
import WallpaperPicker from "./WallpaperPicker";
import { DEFAULT_SKIN_ID, SKINS, useSkin } from "./skins";

/**
 * The two halves of "appearance", as a switch rather than a scroll.
 *
 * ⚠️ Which tab is showing is deliberately NOT persisted. A skin and an image
 * are both still applied whichever tab is open — this only decides which
 * picker you are looking at, and reopening the panel on Skins is the right
 * default every time because that is the choice that changes the most.
 */
const TABS = [
  { id: "skins", label: "Skins", icon: Palette },
  { id: "art", label: "Art", icon: Brush },
  { id: "images", label: "Images", icon: ImageIcon },
];

/**
 * @param {object} props
 * @param {React.CSSProperties} props.style Placement — the trigger measures
 *   itself and hands this down; see AppearanceButton.
 * @param {() => void} props.onClose
 */
export default function AppearancePanel({ style, onClose }) {
  const [skin, setSkin] = useSkin();
  const [tab, setTab] = useState(TABS[0].id);

  return (
    <div
      role="dialog"
      aria-label="Appearance"
      style={style}
      // z-60 so it clears the backdrop (z-55) it shares a stacking context
      // with, and the overlay sidebar the trigger sits in.
      className="animate-ck-fade-in fixed z-60 flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-[0_24px_60px_-18px_rgba(0,0,0,0.35)]"
    >
      {/* ── Header + theme ─────────────────────────────────────────────────
          Fixed at the top of the panel: the skins list below is the only part
          that scrolls, so the theme control never leaves the panel. */}
      <div className="shrink-0 px-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold tracking-tight text-gray-900">
            Appearance
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-gray-400">
          {/* h-* AND w-*: lucide hard-codes height="24" on its <svg>, so a
              width-only class letterboxes the glyph. */}
          <SunMedium className="h-3.5 w-3.5" />
          Theme
        </div>
        <div className="mt-2">
          <ThemeSegmented full />
        </div>
      </div>

      <div className="mt-4 h-px shrink-0 bg-gray-200" />

      {/* ── Skins | Images ─────────────────────────────────────────────────
          Side by side and mutually exclusive, rather than stacked in one
          scroll. They answer different questions ("what colour is this app"
          vs "what is behind it"), and stacked they read as one long list
          where the second half is only reachable by scrolling past
          eighteen tiles.
          The same pill group as the theme control above, so the panel has one
          idea of what a choice-of-several looks like. */}
      <div className="shrink-0 px-4 pt-3.5">
        <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = id === tab;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-pressed={active}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full py-1.5 text-[11px] font-medium transition-all ${
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                }`}
              >
                {/* h-* AND w-*: lucide hard-codes height="24" on its <svg>, so
                    a width-only class letterboxes the glyph. */}
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* The only scrolling region, so any tab can grow without the panel
          growing past the window.
          ⚠️ The `key` is what makes Art and Images separate pickers rather
          than one that keeps the other's results: same component, different
          mode, so without it React reuses the instance and switching tabs
          would show the previous tab's photos under the new tab's control
          until its first fetch landed. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
        {tab === "art" || tab === "images" ? (
          <WallpaperPicker key={tab} mode={tab === "art" ? "art" : "search"} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {SKINS.map(({ id, label }) => {
              const active = id === skin;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSkin(id)}
                  aria-pressed={active}
                  className="group cursor-pointer text-left"
                >
                  {/* The swatch. `data-skin` on the tile ITSELF is what makes it
                      paint in that skin's colours — the CSS keys off the
                      attribute, not off <html>, so a preview is the real thing
                      rendered small. Default carries NO attribute, so it falls
                      back to the live tokens and previews the app as it is. */}
                  <span
                    data-skin={id === DEFAULT_SKIN_ID ? undefined : id}
                    className={`ck-skin-swatch relative block aspect-4/3 w-full overflow-hidden rounded-xl border transition-all duration-200 group-hover:-translate-y-0.5 ${
                      active
                        ? "border-blue-600 ring-2 ring-blue-600/35"
                        : "border-gray-200 group-hover:border-gray-300"
                    }`}
                  >
                    {/* A little card, a line of "text" and an accent dot: the
                        thing being chosen is a UI, not a wallpaper, and this is
                        what shows that panels go pale in one skin and near-black
                        in another. */}
                    <span className="ck-skin-swatch-card absolute inset-x-2.5 bottom-2.5 top-1/2 rounded-md border p-1.5">
                      <span className="ck-skin-swatch-line block h-1 w-2/3 rounded-full" />
                      <span className="ck-skin-swatch-dot mt-1.5 block h-2 w-2 rounded-full" />
                    </span>

                    {active && (
                      <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </span>

                  <span
                    className={`mt-1.5 block truncate text-[11px] ${
                      active
                        ? "font-semibold text-gray-900"
                        : "font-medium text-gray-600 group-hover:text-gray-900"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
