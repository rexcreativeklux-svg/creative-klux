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
//   1. THE SELECTED TAB AND THE TRAY ARE THE SAME SURFACE — one fill (SHELL_FILL
//      below), used by both, so the tab looks like the tray growing a handle
//      rather than like a separate card resting on it. Their edges MEET rather
//      than overlap: the tab row carries no negative margin against the tray, so
//      the row's bottom edge IS the tray's top edge. (An overlap between two
//      translucent layers stacks their alphas into a brighter band, which is
//      exactly the seam this component exists to hide.)
//
//   2. THE TABS ARE SEPARATED, not stacked. A few pixels of daylight between
//      them, and the whole strip inset from the tray's left edge, so each tab
//      reads as its own card. Nothing overlaps anything, which is also why the
//      tray keeps a radius on all four corners — no tab sits over one.
//
//   3. THE STRIP ALWAYS ENDS SHORT OF THE TRAY. Three tabs come to well under
//      half the composer's width, so the rightmost one can never reach the
//      tray's rounded top-right corner and cut a notch out from under itself.
//
// ── The movement ─────────────────────────────────────────────────────────────
// TWO THINGS MOVE, and they are deliberately different animations.
//
//   CLICKING slides. The selected tab is ONE element for the whole strip — not a
//   per-tab background that switches on — and it TRAVELS to whichever tab was
//   picked, riding over the tabs and the gaps it passes. Every tab is the same
//   width and the gap between them is fixed, so the distance is exactly
//   `inset + index × step` with no measuring and no layout effect: all three
//   numbers are CSS variables declared on the row, and the slide is a plain
//   `translateX` off them. The tab it lands on fades its own resting fill out as
//   the slider arrives; the one it left fades back in.
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
// ── Colours: THREE STEPS, and the order is the whole design ──────────────────
//
//   the input        opaque bg-surface — white. The brightest thing here, and
//                    the only opaque one, because it's what you write on.
//   tray + selected  SHELL_FILL, 58% — NOT white. Bright enough to read as the
//                    frame around the input, tinted enough to be a step below it.
//   other tabs       36% (48% under the cursor) — the dimmest step, so an
//                    unselected tab sits back toward the page.
//
// ⚠️ The bottom step was 20% (38% hovered), and that was set when the hero was a
// near-white wash. Against the ruled, blue hero it now sits on, 20% white was
// too little to draw a tab at all: the strip read as two words floating over the
// backdrop with no shape under them, and `text-gray-500` on it measured 4.07:1 —
// under the 4.5:1 AA floor for 12–13px text. The step is still a clear third
// place behind the tray's 58%; it just draws a tab now. If the hero's backdrop
// gets stronger again, this is the number that has to move with it.
//
// All three are the SAME token at different opacities (bg-surface, which flips
// with the theme), so whatever is behind the shell tints them and the ladder
// holds in light and dark without one hard-coded colour.
//
// ⚠️ Which is also why the shell needs something behind it. Dropped onto a plain
// white page, translucent white over white is white — all three steps collapse
// into one flat sheet. The home hero paints a light-blue wash for exactly this
// reason, and the alphas above are calibrated against it: see heroDimLayer in
// home/heroBackdrops.js before changing either side.
//
// ⚠️ NO backdrop-blur on the tray or the tabs, on purpose. backdrop-filter
// samples the backdrop PER ELEMENT, so two blurred boxes that merely touch each
// other resolve slightly different colours along the join and draw a faint line
// down the exact seam rule 1 works to hide. A flat translucent fill has no such
// problem, and the composer inside the tray is opaque anyway, so the blur was
// never carrying any legibility.

/**
 * The strip's geometry, declared once as CSS variables on the row. FOUR numbers
 * per breakpoint and they are tied together — change one and check the rest:
 *
 *              inset   width   gap   step (= width + gap)
 *   below sm     16      96      4     100
 *   sm and up    16     148      6     154
 *
 *   inset  how far the strip starts in from the tray's left edge. The same at
 *          both sizes, and NOT less than it: the tray's corner radius is 21px,
 *          so a strip that started nearer the edge would leave a sliver of the
 *          corner's curve showing under the leftmost tab. At 16px the curve has
 *          dropped less than a pixel by the time the tab begins.
 *   gap    the daylight between two tabs (a flex `gap`, see the row).
 *   step   the slider's travel per tab. Get it wrong and the selected tab drifts
 *          off the label it belongs to — a drift that only shows at the far end
 *          of the row, which is exactly where nobody looks first.
 *
 * `inset` is in the slider's travel as well as the row's padding, because the
 * slider is absolutely positioned: `left-0` resolves against the row's PADDING
 * BOX and so ignores that padding entirely. Without adding it back the slider
 * would sit one inset to the left of every tab.
 *
 * Fixed widths rather than `flex-1`, deliberately — see rule 3. Three tabs come
 * to 312px / 472px, well inside the composer either way.
 */
const ROW_METRICS =
  "[--ck-tab-inset:16px] [--ck-tab-w:96px] [--ck-tab-step:100px] sm:[--ck-tab-w:148px] sm:[--ck-tab-step:154px]";

/** Shared corner radius for the tabs — the tray's, minus its padding. */
const TAB_SHAPE = "rounded-t-[15px]";

/**
 * The tray's fill, and the selected tab's. ONE constant used in both places —
 * they have to be identical to the last percent or the join between them stops
 * being invisible (rule 1). Middle step of the three; see the colour note above.
 */
const SHELL_FILL = "bg-surface/58";

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
        className={`relative flex h-10 items-stretch gap-1 overflow-hidden pl-(--ck-tab-inset) sm:h-11 sm:gap-1.5 ${ROW_METRICS}`}
      >
        {/* ── The selected tab ──────────────────────────────────────────────
            One element for the whole row, slid into place. SHELL_FILL — the
            tray's own colour, so the two read as one surface (rule 1).
            z-30 puts it over every resting fill it passes on the way — but under
            the labels (z-40), so no label is ever washed out mid-flight. */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 left-0 z-30 w-(--ck-tab-w) transition-transform duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${TAB_SHAPE} ${SHELL_FILL}`}
          style={{
            transform: `translateX(calc(var(--ck-tab-inset) + var(--ck-tab-step) * ${selectedIndex}))`,
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
              className="group relative flex w-(--ck-tab-w) shrink-0 cursor-pointer items-center justify-center outline-none"
            >
              {/* The resting fill — what an UNSELECTED tab shows. It fades out
                  as the slider arrives and back in as it leaves, so the handover
                  is a cross-fade rather than a swap.
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
                    : `${FILL_RESTING} bg-surface/36 opacity-100 delay-0 group-hover:bg-surface/48`
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
                    // gray-600, not the gray-500 this was: 6.4:1 against the
                    // resting fill where 500 measured 4.07:1. An unselected tab
                    // still sits back — that is the WEIGHT and the lift's job,
                    // and neither of them costs any legibility. Hover goes all
                    // the way to gray-900 so the label a cursor is on matches
                    // the one that is actually selected.
                    : "font-medium text-gray-600 group-hover:text-gray-900"
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
          Meets the selected tab edge to edge along its top, which is what makes
          the two read as one object. All four corners are rounded — the strip is
          inset from this edge, so no tab sits over one (rule 2).
          The padding is the rim you see around the composer on all four sides;
          keep it in step with the composer's own radius (tray radius − padding)
          or the corners will look nested rather than concentric.
          The shadow is the ONLY one in the assembly, and it belongs here rather
          than on the input: the whole object lifts when the user starts typing,
          and sits perfectly flat until then. */}
      <div
        className={`relative z-40 rounded-[21px] p-1.5 transition-shadow duration-300 motion-reduce:transition-none ${SHELL_FILL} ${
          elevated ? "shadow-[0_28px_70px_-24px_rgba(0,61,218,0.42)]" : "shadow-none"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
