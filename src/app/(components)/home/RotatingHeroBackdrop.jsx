"use client";

// app/(components)/home/RotatingHeroBackdrop.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The backdrop behind the home page hero: one of HERO_BACKDROPS, chosen by the
// clock. Replaced the ambient video backdrop that used to sit here — same job,
// no download, no autoplay policy to lose to, no decode on a mid-range laptop.
//
// Which frame is a pure function of the current time — the backdrop advances one
// step every HERO_BACKDROP_SETTINGS.intervalMs and wraps at the end of the list.
// Two consequences, both deliberate:
//
//   • a reload does not change it. Refreshing during a window shows the same
//     backdrop, because nothing is drawn or stored to be re-drawn.
//   • everyone sees the same one. The window is measured in UTC, so every
//     visitor anywhere is on the same backdrop at the same moment, and the
//     change happens for all of them together.
//
// See useRotatingIndex for how the window is computed.
//
// Every frame is a still image — nothing inside one moves. The only motion is
// the cross-fade from one frame to the next, so the hero reads as a background
// that changes rather than a background that animates. Resolving the opening
// frame is the exception: it swaps with no fade, since it happens as the page
// appears.
//
// Self-contained: it clips itself and paints its own band gradient, so a hero
// only has to render it as the first child of a `relative` container.
//
//     <RotatingHeroBackdrop />
//
// Deliberately takes no timing props at the call site: how fast it changes, how
// long it fades, whether it rotates at all and how strong the colours are are
// all set once in HERO_BACKDROP_SETTINGS (heroBackdrops.js).
//
// All frames stay mounted and are cross-faded by opacity. Mounting on demand
// would save an idle element or two, but a freshly-mounted element has no
// previous opacity to transition *from*, so the incoming backdrop would pop in
// while the old one faded — no cross-fade at all. The frames are plain CSS
// gradients with nothing to lay out, and a browser doesn't paint a fully
// transparent layer, so keeping them costs close to nothing.
//
// Under prefers-reduced-motion nothing is scheduled (see useRotatingIndex), so
// the backdrop drawn on arrival is the one that stays up — one still image for
// the whole visit, with no cross-fade ever shown. It is still the right one for
// the current window, so these users stay in step with everyone else; they just
// do not watch it change.

import HeroBackdrop from "./HeroBackdrop";
import { HERO_BACKDROPS, HERO_BACKDROP_SETTINGS } from "./heroBackdrops";
import { useRotatingIndex } from "./useRotatingIndex";

/**
 * @param {object} props
 * @param {object[]} [props.backdrops] Frame pool. Defaults to HERO_BACKDROPS.
 * @param {boolean}  [props.rotate]    Escape hatch — see HERO_BACKDROP_SETTINGS.
 * @param {number}   [props.intervalMs]
 * @param {number}   [props.fadeMs]
 * @param {string}   [props.className] Extra positioning classes for the wrapper.
 */
export default function RotatingHeroBackdrop({
  backdrops = HERO_BACKDROPS,
  // Timing is not configured here. It comes from HERO_BACKDROP_SETTINGS in
  // heroBackdrops.js, so there is one place to change how the hero behaves
  // rather than a number per call site. These props exist only for a page
  // that deliberately wants to differ from the app-wide setting.
  rotate = HERO_BACKDROP_SETTINGS.rotate,
  intervalMs = HERO_BACKDROP_SETTINGS.intervalMs,
  fadeMs = HERO_BACKDROP_SETTINGS.fadeMs,
  className = "",
}) {
  const { index, instant } = useRotatingIndex(backdrops.length, {
    intervalMs,
    enabled: rotate,
  });

  return (
    // `isolate` is load-bearing, not decoration. The frames below carry z-index
    // so the incoming one stacks over the outgoing one; without a stacking
    // context here those z-indexes would escape into the hero's own context and
    // the active frame would paint OVER the greeting and the composer, which are
    // positioned but z-index:auto. Isolating keeps the ordering internal, so the
    // hero's markup needs no z-index of its own.
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 isolate overflow-hidden ${className}`}
    >
      {backdrops.map((backdrop, i) => {
        const isActive = i === index;
        return (
          <HeroBackdrop
            key={backdrop.id}
            backdrop={backdrop}
            style={{
              opacity: isActive ? 1 : 0,
              // No fade for the opening pick — see useRotatingIndex.
              transition: instant ? "none" : `opacity ${fadeMs}ms ease-in-out`,
              // The incoming frame sits on top, so the outgoing one fades out
              // behind it instead of the two thinning through each other to the
              // page underneath.
              zIndex: isActive ? 1 : 0,
            }}
          />
        );
      })}
    </div>
  );
}
