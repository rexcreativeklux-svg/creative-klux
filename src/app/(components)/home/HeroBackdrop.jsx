// app/(components)/home/HeroBackdrop.jsx
// ─────────────────────────────────────────────────────────────────────────────
// One hero backdrop, painted as an absolutely-positioned layer.
//
// Drop it as the first child of a `relative` wrapper and keep the hero content
// in a sibling that paints after it. It paints its own band gradient, so the
// wrapper needs no background of its own.
//
//     <HeroBackdrop backdrop="aurora" />
//
// Usually you want RotatingHeroBackdrop instead; this is the single-frame
// building block it stacks, and what a page uses when it wants one fixed look.
//
// ── Why both themes are rendered ────────────────────────────────────────────
// A frame's colours live in inline styles (they're computed gradients, not
// classes), and an inline style can't respond to the `.dark` class. So both
// treatments are emitted and CSS shows one: `dark:hidden` on the light stack,
// `hidden dark:block` on the dark one.
//
// The alternative — reading the theme from ThemeProvider and rendering only the
// matching stack — was rejected on purpose. ThemeProvider starts at "light" and
// only reads localStorage in an effect, so a JS-driven backdrop would paint the
// light band on every load and snap to dark after hydration. Doing it in CSS
// means the right band is on screen from the first paint, and there is no
// hydration mismatch to reconcile either.
//
// The cost is one extra hidden div per frame. `hidden` is `display: none`, so
// the wrong-theme stack is never laid out or painted.

import { backdropById, heroDimLayer } from "./heroBackdrops";

/**
 * @param {object} props
 * @param {string|object} props.backdrop An entry from HERO_BACKDROPS, or its id.
 * @param {string} [props.className]     Extra classes for the wrapper.
 * @param {object} [props.style]         Inline style for the wrapper — this is
 *                                       how RotatingHeroBackdrop drives the
 *                                       cross-fade (opacity + transition).
 */
export default function HeroBackdrop({ backdrop, className = "", style }) {
  const entry = typeof backdrop === "string" ? backdropById(backdrop) : backdrop;
  if (!entry) {
    console.warn("⚠️ [hero-backdrop] no backdrop matched:", backdrop);
    return null;
  }

  return (
    <div
      aria-hidden="true"
      data-backdrop={entry.id}
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={style}
    >
      <ThemeFrame entry={entry} dark={false} className="dark:hidden" />
      <ThemeFrame entry={entry} dark={true} className="hidden dark:block" />
    </div>
  );
}

/**
 * One theme's treatment of a frame: the band, the dim, then its pattern/glow
 * layers.
 * @param {{entry: object, dark: boolean, className: string}} props
 */
function ThemeFrame({ entry, dark, className }) {
  const layers = entry.layers ? entry.layers(dark) : [];

  return (
    <div
      className={`absolute inset-0 ${className}`}
      style={{
        backgroundImage: entry.band[dark ? "dark" : "light"],
        backgroundRepeat: "no-repeat",
        // Stretched rather than pinned to a pixel height, so the band resolves
        // exactly at the hero's bottom edge whatever height the hero ends up
        // with — and the hero's height is a calc() off --ck-rail-top, so it is
        // genuinely not knowable here.
        backgroundSize: "100% 100%",
      }}
    >
      {/* The dim, FIRST — under every pattern, so it tints the band rather than
          washing over the texture painted on it. It's what the composer's
          translucent shell is translucent against; see heroDimLayer's note in
          heroBackdrops.js for why the hero can't stay flat white behind it. */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: heroDimLayer(dark) }}
      />

      {layers.map((layer, i) => (
        <div key={i} className="absolute inset-0" style={layer} />
      ))}
    </div>
  );
}
