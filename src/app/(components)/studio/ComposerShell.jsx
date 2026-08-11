"use client";

// app/(components)/studio/ComposerShell.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The tabbed tray a prompt composer sits INSIDE.
//
//     ╭─────────╮╭─────────────╮╭───────────╮
//     │ Ai Chat ││ Import Site ││ Brand Kit │       ← the strip, SITTING ON it
//     ├─────────╯╰─────────────╯╰───────────┴─────╮
//     │ ╭───────────────────────────────────────╮ │ ← THE TRAY (milky, see-thru)
//     │ │ Describe your idea…                   │ │ ← the input (opaque white)
//     │ │ Model │ +                   🎙   ↑    │ │
//     │ ╰───────────────────────────────────────╯ │
//     ╰───────────────────────────────────────────╯
//        ↑ ONE left edge: the first tab's curve, straight down, the tray's curve
//
// THREE SURFACES, and the whole design is the order of them:
//
//     the input   opaque white. The brightest thing here and the only opaque
//                 one, because it is what you write on.
//     the tray    a MILKY translucent rim around that input, 6px on all four
//                 sides, running up into the tab strip. This is the thing that
//                 makes the tabs and the input read as one object rather than a
//                 control sitting on a box — the tabs are the tray, grown into
//                 handles. Take it away and the assembly falls into two pieces.
//     the hero    whatever is behind, showing through the tray and tinting it.
//
// ⚠️ THE ASSEMBLY IS A FOLDER, and its outline is the thing to protect. The tabs
// sit ON the tray — their bottom edge IS its top edge — and the strip starts at
// the tray's left edge, so the two share one continuous left side: the curve at
// the TOP OF THE FIRST TAB, a straight run down past the join, then the tray's
// bottom-left curve. That profile is why the tray's TOP-LEFT corner is square
// (see TRAY_SHAPE) — a curve there would leave the first tab's square
// bottom-left hanging over open air and cut a notch of hero backdrop out from
// under it, and the tab covers that corner in every state anyway.
//
// ⚠️ WHICH MAKES THE FIRST TAB LOAD-BEARING, and it is the easiest thing here to
// break. It has to cover that corner whether or not it is selected. Two numbers
// keep it there, and both were once set to values that failed:
//
//   the lift    an unselected tab sits LOWER (see the movement note). At 7px it
//               visibly detached from the corner and left the square edge bare
//               below it, which read as a sharp nick rather than a folder. 3px
//               reads as a tab sitting back; it does not open a hole.
//   the fill    it has to stay close enough to the tray's that the corner under
//               it doesn't change colour and draw the join. See the ladder.
//
// Three rules follow, and all three are easy to break by accident:
//
//   1. THE SELECTED TAB AND THE TRAY ARE THE SAME SURFACE — one fill (SHELL_FILL
//      below), used by both, so the tab looks like the tray growing a handle
//      rather than like a separate control resting on it. Their edges MEET
//      rather than overlap: the tab row carries no negative margin against the
//      tray, so the row's bottom edge IS the tray's top edge. (An overlap
//      between two translucent layers stacks their alphas into a brighter band,
//      which is exactly the seam this component exists to hide.)
//
//   2. THE TABS ARE SEPARATED, not stacked. A few pixels of daylight between
//      them, so each reads as its own tab. Nothing overlaps anything — but the
//      bottom of that daylight carries a small bump of TRAY (the connectors in
//      the row), leaning toward whichever tab is live, so the strip reads as one
//      shelf the tray grows into rather than three chips over the sky. It is a
//      swell along the bottom edge, NOT a column filling the gap: fill the whole
//      gap and the join becomes a divider. Widen the gap and the bumps follow it
//      automatically.
//
//   3. THE STRIP STARTS AT THE START and ends well short of the far edge. Its
//      left edge IS the tray's left edge — no inset, which is what makes the one
//      continuous left side above. Three tabs come to well under half the
//      composer's width, so the rightmost can never reach the tray's top-RIGHT
//      corner, which is rounded and has no tab to hide behind.
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
//   HOVERING lifts. An unselected tab is SHORTER — its fill is pushed down so it
//   stands a little lower than the selected one — and hovering raises it most of
//   the way back. It never arrives: the last pixel belongs to the tab that is
//   actually selected, so hover reads as an invitation rather than a selection.
//   That lift is a `translateY` on the fill, and the row CLIPS its own overflow,
//   so what moves off the bottom is cut at exactly the tray's top edge. The join
//   therefore cannot tear open, however far a tab is pushed down.
//
//   ⚠️ It is 3px, and it is small ON PURPOSE — see the load-bearing note above.
//   The whole travel has to stay smaller than the eye's tolerance for "these two
//   tabs are the same shape", because the leftmost one is holding the assembly's
//   corner whether it is selected or not.
//
// Both are slow enough to read — a slide is ~450ms and a lift ~380ms. They were
// half that at first and the whole strip felt like it was snapping between
// states rather than moving between them.
//
// ── Colours: THREE STEPS, and the order is the whole design ──────────────────
//
//   the input        opaque bg-surface — white. The brightest thing here, and
//                    the only opaque one, because it's what you write on.
//   tray + selected  SHELL_FILL, 58% — the milky step. NOT white: bright enough
//                    to read as the rim around the input, tinted enough to be a
//                    step below it. ONE constant for both; see rule 1.
//   other tabs       34% (46% under the cursor) — the dimmest step, so an
//                    unselected tab sits back toward the page.
//
// ⚠️ THE DISTANCE BETWEEN THE BOTTOM TWO STEPS IS THE SELECTION CUE. It is the
// only thing that answers "which tab am I on" at a glance — the label's weight
// and the 3px lift are both too quiet to carry it alone. 58% against 34% is a
// wide, obvious gap and it is meant to be: at 44% the two steps were close
// enough that the strip read as three identical tabs, which is precisely the
// complaint that produced this number.
//
// ⚠️ The bottom step has been wrong in both directions. At 20% (38% hovered) —
// set when the hero was a near-white wash — it was too little to draw a tab at
// all against the blue hero: the strip read as words floating over the backdrop
// with no shape under them, and `text-gray-500` on it measured 4.07:1, under the
// 4.5:1 AA floor for 12–13px text. At 44% it drew a tab but stopped saying which
// one was live. 34% is between them, and closer to the floor than the ceiling —
// if the hero's backdrop gets stronger, check the label contrast before moving
// this down any further.
//
// All three are the SAME token at different opacities (bg-surface, which flips
// with the theme), so whatever is behind the shell tints them and the ladder
// holds in light and dark without one hard-coded colour.
//
// ⚠️ Which is also why the shell needs something behind it. Dropped onto a plain
// white page, translucent white over white is white — all three steps collapse
// into one flat sheet and both the rim and the strip disappear. The home hero
// paints a light-blue wash for exactly this reason, and the alphas above are
// calibrated against it: see heroDimLayer in home/heroBackdrops.js before
// changing either side.
//
// ⚠️ NO backdrop-blur on the tray or the tabs, on purpose. backdrop-filter
// samples the backdrop PER ELEMENT, so two translucent boxes that merely touch
// each other resolve slightly different colours along the join and draw a faint
// line down the exact seam rule 1 works to hide. A flat translucent fill has no
// such problem, and the input inside the tray is opaque anyway, so the blur was
// never carrying any legibility.

/**
 * The strip's geometry, declared once as CSS variables on the row. FOUR numbers
 * per breakpoint and they are tied together — change one and check the rest:
 *
 *              inset   width   gap   step (= width + gap)
 *   below sm      0      96      4     100
 *   sm and up     0     148      6     154
 *
 * `gap` is a variable rather than a plain `gap-1` utility because the CONNECTORS
 * are sized off it (see the row) — the strip's daylight has to be the same
 * number in the flex gap and in the spans that fill it, or the tray colour
 * between two tabs sits a pixel proud of the gap it is filling.
 *
 *   inset  how far the strip starts in from the tray's left edge. ZERO — the
 *          first tab's left edge and the tray's are the same line, which is what
 *          gives the assembly one continuous left side (rule 3). It is kept as a
 *          variable rather than deleted because the slider's travel is written
 *          off it. ⚠️ Anything above 0 uncovers the tray's square top-left
 *          corner; put the radius back at the same time — see TRAY_SHAPE.
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
 * Fixed widths rather than `flex-1`, deliberately — see rule 2. Three tabs come
 * to 296px / 456px, well inside the composer either way.
 */
const ROW_METRICS =
  "[--ck-tab-inset:0px] [--ck-tab-w:96px] [--ck-tab-gap:4px] [--ck-tab-step:100px] [--ck-tab-r:15px] sm:[--ck-tab-w:148px] sm:[--ck-tab-gap:6px] sm:[--ck-tab-step:154px]";

/**
 * The tabs' shape — TOP corners only. A tab hands its bottom edge off to the
 * tray, so rounding that end would round it away from the surface it is supposed
 * to be continuous with. The radius is the INPUT's, not the tray's: at the top
 * of the assembly the tab is the outermost thing, in the same way the input is
 * the outermost thing inside the tray, and matching them keeps one curve
 * throughout. (The tray's own 21px belongs to the corner that has 6px of rim
 * outside it.)
 *
 * The value lives in ROW_METRICS as `--ck-tab-r` rather than inline here,
 * because the CONNECTORS start exactly one radius down from the top of the strip
 * and the two must not drift apart — see the row.
 */
const TAB_SHAPE = "rounded-t-(--ck-tab-r)";

/**
 * The tray's shape. Top-left SQUARE, the other three rounded — the strip starts
 * flush against that corner and covers it in every state, and a curve under an
 * overhanging tab shows as a notch of hero backdrop. Squared, the first tab's
 * left edge and the tray's are one line: the folder outline this whole component
 * is drawing. See the ⚠️ at the top of the file.
 * ⚠️ Tied to `--ck-tab-inset:0`. They move together or not at all.
 */
const TRAY_SHAPE = "rounded-[21px] rounded-tl-none";

/**
 * The rim of tray you see around the input, on all four sides. ⚠️ It is the
 * whole reason the tray exists — drop it to zero and the tray is a border the
 * input covers, so the strip loses the surface it is supposed to be part of.
 * Keep it in step with the two radii: TRAY_SHAPE's 21px minus this 6px is the
 * input's 15px, which is what makes the two curves concentric rather than
 * nested. See PANEL_VARIANTS.inset in PromptComposer.jsx.
 */
const TRAY_PAD = "p-1.5";

/**
 * The tray's fill, and the selected tab's. ONE constant used in both places —
 * they have to be identical to the last percent or the join between them stops
 * being invisible (rule 1). The milky middle step; see the colour note above.
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
const FILL_RESTING =
  "translate-y-[3px] bg-surface/34 group-hover:translate-y-[1px] group-hover:bg-surface/46";
const LABEL_SELECTED = "translate-y-0";
const LABEL_RESTING = "translate-y-[1.5px] group-hover:translate-y-[0.5px]";

/**
 * @param {object} props
 * @param {Array<{id: string, label: string, icon?: React.ComponentType<{className?: string}>}>} props.tabs
 * @param {string} props.value           Id of the selected tab.
 * @param {(id: string) => void} props.onChange  Fired only when a DIFFERENT tab
 *   is clicked, so a call site can treat every call as a real change.
 * @param {boolean} [props.elevated]     Lift the whole shell — the home page
 *   drives this from the composer's focus, so the assembly rises as one object
 *   instead of the input growing a shadow of its own.
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
          NO margin against the tray below — the two touch, and that join is
          rule 1. overflow-hidden is load-bearing: it clips a lifted tab's
          overhang at exactly the tray's top edge, which is what lets the fills
          move at all without tearing the join open. Nothing in the strip needs
          to escape it (which is also why the focus cue is an inset ring, not an
          outer one). */}
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={`relative flex h-10 items-stretch gap-(--ck-tab-gap) overflow-hidden pl-(--ck-tab-inset) sm:h-11 ${ROW_METRICS}`}
      >
        {/* ── Connectors ────────────────────────────────────────────────────
            The tray, rising into the daylight between two tabs so the strip
            reads as one shelf growing out of it rather than as three chips
            floating over the hero.

            ⚠️ A LITTLE BUMP, not a post. This filled the gap from one radius
            below the top all the way down at first, and that is far too much —
            a 25px column of tray between every pair of tabs stops being a join
            and becomes a divider, which is the opposite of what it is for. It
            is 8px now, sitting on the bottom edge, so it reads as the tray
            swelling up between two tabs and settling again.

            ⚠️ AND IT TAPERS TOWARD WHICHEVER TAB IS LIVE. The taper is a SHAPE,
            not a fade: one corner takes a `100%` radius, which on a box this
            small is a quarter-ellipse spanning the whole span — full height
            against the active tab's edge, curving away to nothing by the time
            it reaches the neighbour. So the bump grows out of the selected tab
            and thins into the next one, and it swaps sides when the selection
            moves. (A left-to-right opacity gradient was the first attempt and
            it just looked like a smudge; the eye reads the silhouette here, not
            the alpha.) `index` is the gap AFTER tab `index`, so the active tab
            is on this gap's left whenever its index is at or before it.

            Position is the same arithmetic as the slider's, one term longer:
            the gap after tab i starts at inset + width + step × i. z-10 keeps
            them under every fill — nothing overlaps them, this is just so a
            future layer can't slip beneath. */}
        {tabs.slice(0, -1).map((tab, index) => (
          <span
            key={`join-${tab.id}`}
            aria-hidden="true"
            className={`pointer-events-none absolute bottom-0 z-10 h-2 w-(--ck-tab-gap) sm:h-2.5 ${SHELL_FILL} ${
              selectedIndex <= index ? "rounded-tr-[100%]" : "rounded-tl-[100%]"
            }`}
            style={{
              left: `calc(var(--ck-tab-inset) + var(--ck-tab-w) + var(--ck-tab-step) * ${index})`,
            }}
          />
        ))}
        {/* ── The selected tab ──────────────────────────────────────────────
            One element for the whole row, slid into place. SHELL_FILL — the
            tray's own colour, so the two read as one surface (rule 1). NO shadow
            on it: this is a handle continuous with the tray, not a pill floating
            over it, and an edge here would draw the join it exists to hide.
            z-30 puts it over every resting fill it passes on the way — but under
            the labels (z-40), so no label is ever washed out mid-flight. */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 left-0 z-30 w-(--ck-tab-w) transition-transform duration-450 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${TAB_SHAPE} ${SHELL_FILL}`}
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
                className={`absolute inset-0 transition-[transform,opacity,background-color] duration-380 ease-out motion-reduce:transition-none ${TAB_SHAPE} ${
                  selected
                    ? `${FILL_SELECTED} opacity-0 delay-150`
                    : `${FILL_RESTING} opacity-100 delay-0`
                }`}
              />

              {/* Label. Rides the same lift as the fill, so a tab moves as one
                  piece. z-40 keeps it above the slider passing underneath. */}
              <span
                className={`relative z-40 flex min-w-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] leading-none transition-[transform,color] duration-380 ease-out group-focus-visible:ring-2 group-focus-visible:ring-blue-500/45 motion-reduce:transition-none sm:text-[13px] ${
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
          the two read as one object. Top-left square, the other three rounded —
          the strip starts flush against that corner and hides it (see
          TRAY_SHAPE and the folder note at the top).

          TRAY_PAD is the milky rim around the input, and it is the point of the
          whole element — see that constant before touching it.

          NO BORDER — the selected tab would need the same border and the two
          outlines that close would read as a seam. THE SHADOW IS THE EDGE, and
          it is a big ambient one rather than a tight rim: this floats on a
          photographic blue hero and has to be lifted off it on ALL FOUR sides.
          `0 2px 16px -4px` at 10% was invisible against that backdrop — the
          assembly read as a white shape cut out of the sky.

          TWO LAYERS in each state, and they do different jobs:
            the tight one   a few px of contact shade, so the tray meets the hero
                            rather than hovering over it.
            the broad one   the ambient lift. Its blur is what reaches out to the
                            sides; the y-offset is what puts most of it below.

          ⚠️ The NEGATIVE SPREAD on the broad layer is load-bearing. The tab strip
          sits on this element's top edge, and the tray is z-40 — above the tabs
          — so anything the shadow throws UPWARD lands across the bottom of the
          strip and dirties the join. Spread pulls the whole shadow back in by
          20px against a 24px y-offset, which leaves nothing above the top edge
          while still clearing the sides. Raise the blur without raising the
          spread to match and a grey band appears under the tabs.

          Still the ONLY shadow in the assembly, and it belongs here rather than
          on the input, so the whole object lifts as one thing — soft at rest,
          the deep blue lift once the user starts typing. */}
      <div
        className={`relative z-40 transition-shadow duration-300 motion-reduce:transition-none ${TRAY_SHAPE} ${TRAY_PAD} ${SHELL_FILL} ${
          elevated
            ? "shadow-[0_4px_10px_-4px_rgba(0,61,218,0.14),0_32px_80px_-22px_rgba(0,61,218,0.45)]"
            : "shadow-[0_2px_8px_-3px_rgba(16,24,40,0.10),0_24px_64px_-20px_rgba(16,24,40,0.35)]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
