"use client";

// app/(components)/studio/ComposerShell.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The tabbed tray a prompt composer sits INSIDE.
//
//     ╭─────────╮╭────────╮
//     │ Web App ││ Mobile │  Active Brand         ← tab row, tabs overlapping
//     ├─────────╯╰─────────────────────────────╮
//     │  ╭───────────────────────────────────╮ │  ← THE TRAY (pale, translucent)
//     │  │  Describe your idea…              │ │  ← the composer (opaque card)
//     │  ╰───────────────────────────────────╯ │
//     ╰────────────────────────────────────────╯
//
// The whole point is that it reads as ONE object. Three rules do that, and all
// three are easy to break by accident:
//
//   1. THE SELECTED TAB IS THE SAME SURFACE AS THE INPUT — opaque, not the
//      tray's translucent fill. The tab is the sheet the prompt is written on;
//      the tray is the pale frame both of them sit in. Its edge MEETS the tray's
//      rather than overlapping it, so the tab row carries no negative margin
//      against the tray: the row's bottom edge IS the tray's top edge. (An
//      overlap between two translucent layers stacks their alphas into a band
//      that reads as a seam, which is the one thing this component must avoid.)
//
//   2. THE TRAY'S TOP-LEFT CORNER IS SQUARE (`rounded-tl-none`). The leftmost tab
//      is flush with the tray's left edge and always covers that corner down to
//      the tray's top edge — selected or not — so a radius there would cut a
//      notch out from under it. Every other corner is rounded.
//
//   3. TABS OVERLAP EACH OTHER, selected one on top, the rest stacked left over
//      right. That overlap IS translucent-over-translucent, and there it's the
//      point: the darker sliver where two tabs meet is what makes them read as
//      cards in a stack rather than as buttons in a row.
//
// ── The movement ─────────────────────────────────────────────────────────────
// TWO THINGS MOVE, and they are deliberately different animations.
//
//   CLICKING slides. The selected tab is ONE element for the whole strip — not a
//   per-tab background that switches on — and it TRAVELS to whichever tab was
//   picked, riding over the tabs it passes. Every tab is the same width and the
//   overlap is fixed, so the distance is exactly `index × step` with no measuring
//   and no layout effect: both numbers are CSS variables declared on the row, and
//   the slide is a plain `translateX` off them. The tab it lands on fades its own
//   resting fill out as the slider arrives; the one it left fades back in.
//
//   HOVERING lifts. An unselected tab is SHORTER — its fill is pushed down so
//   only part of it shows above the tray — and hovering raises it most of the way
//   back. It never arrives: the last couple of pixels belong to the tab that is
//   actually selected, so hover reads as an invitation rather than a selection.
//   That lift is a `translateY` on the fill, and the row CLIPS its own overflow,
//   so what moves off the bottom is cut at exactly the tray's top edge. The join
//   with the tray therefore cannot tear open, however far a tab is pushed down.
//
// Both are slow enough to read — a slide is ~450ms and a lift ~380ms. They were
// half that at first and the whole strip felt like it was snapping between
// states rather than moving between them.
//
// ── Colours ──────────────────────────────────────────────────────────────────
// Theme tokens only (bg-surface / gray-*), at one solid value and three
// opacities: the selected tab is FULLY opaque like the input it belongs to, the
// tray is 55%, an unselected tab 25%, and 42% under the cursor. Whatever is
// behind the shell tints the translucent three, which is what makes the tray
// read as pale blue on the home hero without a single hard-coded blue.
//
// ⚠️ That also means the shell needs something behind it. Dropped onto a plain
// white page every translucent part of it disappears; the home hero paints a
// soft wash for exactly this reason (heroDimLayer in home/heroBackdrops.js).
//
// ⚠️ NO backdrop-blur on the tray or the tabs, on purpose. backdrop-filter
// samples the backdrop PER ELEMENT, so two blurred boxes that merely touch each
// other resolve slightly different colours along the join and draw a faint line
// down the exact seam rule 1 works to hide. A flat translucent fill has no such
// problem, and the composer inside the tray is opaque anyway, so the blur was
// never carrying any legibility.

/**
 * The strip's geometry, as CSS variables on the row so ONE declaration feeds
 * both the tabs' width and the slider's travel. They must stay consistent:
 *
 *     step = width − overlap        (overlap is the tabs' negative margin)
 *      86  =   96   −   10          below `sm`
 *     120  =  132   −   12          `sm` and up
 *
 * Change a width and change its step, or the slider will drift off the tab it is
 * supposed to be sitting on — a drift that only shows at the far end of the row,
 * which is exactly where nobody looks first.
 *
 * Fixed widths rather than `flex-1`, deliberately: the strip must always end
 * short of the tray's right edge, or the selected tab would cover the tray's
 * rounded top-right corner and open the same notch rule 2 closes on the left.
 */
const ROW_METRICS =
  "[--ck-tab-w:96px] [--ck-tab-step:86px] sm:[--ck-tab-w:132px] sm:[--ck-tab-step:120px]";
const TAB_METRICS = "w-(--ck-tab-w) -ml-2.5 first:ml-0 sm:-ml-3";

/** Shared corner radius for the tabs — the tray's, minus its padding. */
const TAB_SHAPE = "rounded-t-[15px]";

/**
 * The lift, as whole class strings. Tailwind scans SOURCE TEXT for candidates,
 * so a `translate-y-[${n}px]` built from a variable compiles to a class that was
 * never generated and the tab simply wouldn't move. Keep these literal.
 *
 * The label's offsets are half the fill's, which keeps it optically centred in
 * the part of the tab that is actually showing at each height.
 */
const FILL_SELECTED = "translate-y-0";
const FILL_RESTING = "translate-y-[7px] group-hover:translate-y-[2px]";
const LABEL_SELECTED = "translate-y-0";
const LABEL_RESTING = "translate-y-[3px] group-hover:translate-y-[1px]";

/**
 * @param {object} props
 * @param {Array<{id: string, label: string, icon?: React.ComponentType<{className?: string}>}>} props.tabs
 * @param {string} props.value           Id of the selected tab.
 * @param {(id: string) => void} props.onChange  Fired only when a DIFFERENT tab
 *   is clicked, so a call site can treat every call as a real change.
 * @param {boolean} [props.elevated]     Lift the whole shell — the home page
 *   drives this from the composer's focus, so the assembly rises as one object
 *   instead of the input growing a shadow inside its own tray.
 * @param {string} [props.ariaLabel]     Names the tablist for screen readers.
 * @param {string} [props.className]     Extra classes for the outer wrapper —
 *   width, alignment and entrance animation belong to the call site.
 * @param {React.CSSProperties} [props.style] Inline styles for the same wrapper.
 * @param {React.ReactNode} props.children The composer that goes in the tray.
 */
export default function ComposerShell({
  tabs,
  value,
  onChange,
  elevated = false,
  ariaLabel = "Prompt mode",
  className = "",
  style,
  children,
}) {
  // Falls back to the first tab so an unknown `value` parks the slider somewhere
  // sensible rather than at a negative offset off the left of the row.
  const selectedIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === value),
  );

  const selectTab = (tabId) => {
    if (tabId === value) return;
    console.log(`🗂️ [composer-shell] switching to "${tabId}"`);
    onChange?.(tabId);
  };

  return (
    <div className={`relative ${className}`} style={style}>
      {/* ── Tab row ────────────────────────────────────────────────────────
          NO negative margin against the tray below — see rule 1.
          overflow-hidden is load-bearing: it clips a lifted tab's overhang at
          exactly the tray's top edge, which is what lets the fills move at all
          without tearing the join open. Nothing in the strip needs to escape it
          (which is also why the focus cue is an inset ring, not an outer one). */}
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={`relative flex h-10 items-stretch overflow-hidden sm:h-11 ${ROW_METRICS}`}
      >
        {/* ── The selected tab ──────────────────────────────────────────────
            One element for the whole row, slid into place. Opaque bg-surface —
            the input's colour, not the tray's — so the tab reads as the sheet
            you write on and the tray as the frame around it.
            z-30 puts it over every resting fill it passes on the way — but under
            the labels (z-40), so no label is ever washed out mid-flight. */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 left-0 z-30 w-(--ck-tab-w) bg-surface transition-transform duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${TAB_SHAPE}`}
          style={{
            transform: `translateX(calc(var(--ck-tab-step) * ${selectedIndex}))`,
          }}
        />

        {tabs.map((tab, index) => {
          const selected = tab.id === value;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => selectTab(tab.id)}
              // NO z-index on the button itself, on purpose: `position:relative`
              // plus a z-index would open a stacking context and trap the label
              // inside it, below the slider it has to stay above. The two spans
              // carry their own layers instead.
              className={`group relative flex shrink-0 cursor-pointer items-center justify-center outline-none ${TAB_METRICS}`}
            >
              {/* The resting fill — what an UNSELECTED tab shows. It fades out
                  as the slider arrives and back in as it leaves, so the handover
                  is a cross-fade rather than a swap. Stacked left-over-right so
                  each tab's right edge tucks under its neighbour, the way a row
                  of file tabs does.
                  ⚠️ The fade-out is DELAYED and the fade-in is not. Without the
                  delay the tab being selected loses its own fill before the
                  slider has finished travelling to it, and for a moment there is
                  a hole in the strip with the page showing through. Leaving is
                  the opposite case — the fill has to be back before the slider
                  has fully left — so that direction starts at once. */}
              <span
                aria-hidden="true"
                style={{ zIndex: 20 - index }}
                className={`absolute inset-0 transition-[transform,opacity,background-color] duration-[380ms] ease-out motion-reduce:transition-none ${TAB_SHAPE} ${
                  selected
                    ? `${FILL_SELECTED} opacity-0 delay-150`
                    : `${FILL_RESTING} bg-surface/25 opacity-100 delay-0 group-hover:bg-surface/42`
                }`}
              />

              {/* Label. Rides the same lift as the fill, so a tab moves as one
                  piece. z-40 keeps it above the slider passing underneath. */}
              <span
                className={`relative z-40 flex min-w-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] leading-none transition-[transform,color] duration-[380ms] ease-out group-focus-visible:ring-2 group-focus-visible:ring-blue-500/45 motion-reduce:transition-none sm:text-[13px] ${
                  selected ? LABEL_SELECTED : LABEL_RESTING
                } ${
                  selected
                    ? "font-semibold text-gray-900"
                    : "font-medium text-gray-500 group-hover:text-gray-700"
                }`}
              >
                {/* Hidden below `sm`: three labels plus three glyphs don't fit
                    across a phone without truncating every one of them, and the
                    word is what identifies the tab.
                    h-* AND w-*: lucide hard-codes height="24" on its <svg>, so a
                    width-only class letterboxes the glyph. */}
                {Icon && <Icon className="hidden h-4 w-4 shrink-0 sm:block" />}
                <span className="truncate">{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ── The tray ───────────────────────────────────────────────────────
          The same fill as the sliding tab above, meeting it edge to edge, which
          is what makes the two read as one surface.
          rounded-tl-none — see rule 2. The padding is the rim you see around the
          composer on three sides; keep it in step with the composer's own radius
          (tray radius − padding) or the corners will look nested rather than
          concentric.
          The shadow is the ONLY one in the assembly, and it belongs here rather
          than on the input: the whole object lifts when the user starts typing,
          and sits perfectly flat until then. */}
      <div
        className={`relative z-40 rounded-[21px] rounded-tl-none bg-surface/55 p-1.5 transition-shadow duration-300 motion-reduce:transition-none ${
          elevated ? "shadow-[0_28px_70px_-24px_rgba(0,61,218,0.42)]" : "shadow-none"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
