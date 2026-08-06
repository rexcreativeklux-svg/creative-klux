// app/(components)/home/heroBackdrops.js
// ─────────────────────────────────────────────────────────────────────────────
// HERO_BACKDROPS — the pool of interchangeable home-hero backdrops.
//
// Ported from the Weviy app's hero-sky module and retinted onto CreativeKlux's
// own blue ramp and surface tokens. Keeping the two files the same shape is
// deliberate: a change made in one can be read across to the other.
//
// Each entry is a complete, *still* backdrop: the vertical band gradient the
// hero sits on, plus the pattern and glow layers painted over it. Think of one
// entry as a background image — nothing inside it moves. The only motion in the
// system is RotatingHeroBackdrop cross-fading one entry into the next.
//
// Order here carries no meaning at runtime beyond "next": the rotation walks
// the array one step per window (see useRotatingIndex.js).
//
// HeroBackdrop renders any single one on its own, so a page that wants a fixed
// look can pick it by id:
//
//     <HeroBackdrop backdrop="aurora" />
//
// ── Rules every entry follows ───────────────────────────────────────────────
// • No animation. Frames are static by design (see above).
// • Every colour comes from BRAND below — the app's blue ramp, nothing else.
//   The frames differ by *form* (grid, rings, rays, discs), not by hue, so the
//   rotation never drifts off-brand into mint or amber.
// • Alphas stay low. These sit behind the greeting and the prompt composer; a
//   backdrop that competes with them is wrong however nice it looks alone. If
//   one reads as loud, lower the number — don't restyle it.
// • The band starts at `--color-surface` (so it continues the fixed header it
//   sits directly under) and ends at `--color-page` (so it resolves into the
//   template rail below with no seam). Both are read as live CSS variables
//   rather than copied hexes, so a change to the theme tokens carries here for
//   free and the band can never drift out of sync with the page.
// • Pattern layers are masked top and bottom (PATTERN_MASK) so they dissolve
//   rather than ending on a hard edge.
// • Colour concentrates low and to the edges; the upper middle, where the
//   greeting and composer sit, stays near-plain in every frame.
//
// Adding one: append an object here. Nothing else needs to change — the
// rotator and the fade read off this array's length.

/**
 * ══════════════════════════════════════════════════════════════════════════
 * The dials. Everything tunable about the rotation lives here and nowhere
 * else — pages render <RotatingHeroBackdrop /> with no props and inherit these.
 *
 *   rotate     false draws the current window's backdrop on arrival and keeps
 *              it for the visit — no timer, no further changes.
 *   intervalMs how long a backdrop is held before the next one takes over.
 *   fadeMs     cross-fade length. Keep it well under intervalMs, or a frame
 *              starts leaving before it has finished arriving.
 *   intensity  the volume knob: every alpha in this file is multiplied by it,
 *              per theme. Lower to make the whole set fainter, raise for more
 *              presence.
 *
 *              These are the deliberately-faint values carried over from
 *              Weviy, where they were tuned down to about a third of their
 *              original strength. At full strength the busier frames — the ring
 *              and ray ones especially — read as texture *in front of* the
 *              greeting and the composer rather than behind them, and the eye
 *              kept going to the pattern. The pattern should be something you
 *              notice only if you look for it. Going much lower stops being a
 *              dim and starts being an off switch — at that point prefer
 *              `rotate: false` on a quiet frame over an intensity near zero.
 *
 *              Only the patterns and glows scale — the band gradient is fixed
 *              tints in TINTS below, so the hero keeps its shape and its
 *              seamless landing on the page surface at any intensity.
 * ══════════════════════════════════════════════════════════════════════════
 */
export const HERO_BACKDROP_SETTINGS = {
  rotate: true,
  intervalMs: 5 * 60 * 60 * 1000, // 18000000 — five hours
  fadeMs: 1500,
  intensity: { light: 0.35, dark: 0.28 },
  dim: { light: 0.07, dark: 0.12 },
};

/**
 * The dim — one soft wash of brand blue across the middle of the hero, painted
 * by every frame under its patterns.
 *
 * It exists for ONE reason: the composer's shell is translucent, and the band
 * behind it runs surface → page, which in light mode is white → near-white. A
 * translucent tray over white is white, so the tabs, the tray and the rim around
 * the input all vanished — the assembly only reads when there is something
 * behind it to be translucent AGAINST.
 *
 * That is why this is a wide, soft ellipse centred where the greeting and the
 * composer sit, rather than a flat overlay: it gives that band a tint to sit on
 * while leaving the top edge (under the fixed header) and the bottom edge (where
 * the band lands on the template rail) exactly as they were, so neither seam
 * moves. `dim` above is its volume knob — 0 restores the old, flat hero.
 *
 * @param {boolean} dark Which theme's alpha to use.
 * @returns {string} A CSS `background-image` value.
 */
export const heroDimLayer = (dark) =>
  `radial-gradient(125% 62% at 50% 40%, ${rgba(
    dark ? BRAND.sky : BRAND.deep,
    HERO_BACKDROP_SETTINGS.dim[dark ? "dark" : "light"],
  )} 0%, transparent 72%)`;

/** Where every band starts: the app surface, which is also the header's fill. */
const SURFACE = "var(--color-surface)";

/** Where every band has to land: the page colour the template rail sits on. */
const PAGE = "var(--color-page)";

/** Patterns dissolve under the header and again before the content below. */
const PATTERN_MASK =
  "linear-gradient(to bottom, transparent 0%, #000 18%, #000 62%, transparent 96%)";

/** Glows can start at full strength — they have no hard edge to hide. */
const GLOW_MASK =
  "linear-gradient(to bottom, #000 0%, #000 62%, transparent 96%)";

/**
 * The brand ramp, as raw channels so alpha can be varied per layer.
 * `blue`/`sky`/`pale` are the Tailwind blue-600/400/200 the app already builds
 * its UI from; `deep` is #003DDA, the darker brand blue the old video backdrop's
 * wash used and the one most of the marketing surfaces are keyed to.
 */
const BRAND = {
  blue: "21,93,252", // blue-600  #155dfc — the app's working blue
  deep: "0,61,218", // #003DDA   — the deeper brand blue
  sky: "81,162,255", // blue-400  #51a2ff
  pale: "190,219,255", // blue-200  #bedbff
};

const rgba = (channels, alpha) =>
  `rgba(${channels},${Math.round(alpha * 1000) / 1000})`;

/**
 * Per-theme ink. Layers below ask for `accent`/`accentAlt`/`deep` and get the
 * right end of the ramp for the theme — brand blue reads on white, but on the
 * near-black dark page it disappears, so dark shifts a step lighter.
 *
 * `scale` comes from HERO_BACKDROP_SETTINGS.intensity — every alpha in the file
 * is multiplied by it, so the whole set turns up or down from one number.
 */
const makeInk = ({ accent, accentAlt, deep, hair, scale }) => ({
  accent: (a) => rgba(accent, a * scale),
  accentAlt: (a) => rgba(accentAlt, a * scale),
  deep: (a) => rgba(deep, a * scale),
  /** Hairline for grids, rings and stripes. */
  hair: (a = 1) => rgba(hair, 0.05 * a * scale),
});

const INK = {
  light: makeInk({
    accent: BRAND.blue,
    accentAlt: BRAND.sky,
    deep: BRAND.deep,
    hair: BRAND.deep,
    scale: HERO_BACKDROP_SETTINGS.intensity.light,
  }),
  dark: makeInk({
    accent: BRAND.sky,
    accentAlt: BRAND.pale,
    deep: BRAND.blue,
    hair: BRAND.pale,
    scale: HERO_BACKDROP_SETTINGS.intensity.dark,
  }),
};

const ink = (dark) => (dark ? INK.dark : INK.light);

/** Light band: the header's white, through three tints, out to the page. */
const bandLight = (a, b, c) =>
  `linear-gradient(180deg, ${SURFACE} 0%, ${a} 24%, ${b} 52%, ${c} 78%, ${PAGE} 100%)`;

/** Dark band: two tints, out to the page. Shorter — dark needs less contrast. */
const bandDark = (a, b) =>
  `linear-gradient(180deg, ${a} 0%, ${b} 48%, ${PAGE} 100%)`;

/**
 * Band tints — five near-neighbours on the blue ramp per theme. They exist so
 * the frames aren't literally the same wash underneath, not to introduce new
 * hues: the widest gap here is a couple of degrees of temperature.
 *
 * Light tints sit between #ffffff (surface) and #f7f8fc (page); dark tints sit
 * between #1c1c20 (surface) and #0e0e11 (page), which is why they are so much
 * closer together than the light set — there is far less room to travel.
 */
const TINTS = {
  light: {
    core: ["#fbfcff", "#f3f6fe", "#e9f0fd"],
    indigo: ["#fbfbff", "#f3f4fe", "#e8eafb"],
    sky: ["#fcfdff", "#f2f8ff", "#e6f1fd"],
    steel: ["#fbfcfe", "#f2f4fa", "#e6ebf6"],
    peri: ["#fdfdff", "#f6f6fe", "#eceefb"],
  },
  dark: {
    core: ["#191a20", "#131318"],
    indigo: ["#1a1922", "#141319"],
    sky: ["#171b22", "#121419"],
    steel: ["#191a1e", "#131417"],
    peri: ["#1b1922", "#141419"],
  },
};

const bandOf = (key) => ({
  light: bandLight(...TINTS.light[key]),
  dark: bandDark(...TINTS.dark[key]),
});

/** A repeating pattern layer: masked, never interactive. */
const pattern = (style) => ({
  ...style,
  WebkitMaskImage: PATTERN_MASK,
  maskImage: PATTERN_MASK,
});

/** A soft light layer (blobs, spotlights, bokeh). */
const glow = (style) => ({
  ...style,
  WebkitMaskImage: GLOW_MASK,
  maskImage: GLOW_MASK,
});

export const HERO_BACKDROPS = [
  {
    id: "blueprint",
    label: "Blueprint",
    // The plain ruled grid, and the frame the array starts on — so it is also
    // what SSR renders before the client resolves the current window.
    band: bandOf("core"),
    layers: (dark) => {
      const c = ink(dark);
      const line = c.hair(1.1);
      return [
        pattern({
          backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
          backgroundSize: "48px 48px, 48px 48px",
        }),
        glow({
          backgroundImage: `radial-gradient(65% 45% at 50% 100%, ${c.accent(0.11)} 0%, transparent 72%)`,
        }),
      ];
    },
  },

  {
    id: "graph",
    label: "Graph paper",
    band: bandOf("sky"),
    layers: (dark) => {
      const c = ink(dark);
      const minor = c.hair(0.7);
      const major = c.hair(1.3);
      return [
        pattern({
          backgroundImage: `linear-gradient(${minor} 1px, transparent 1px), linear-gradient(90deg, ${minor} 1px, transparent 1px)`,
          backgroundSize: "24px 24px, 24px 24px",
        }),
        // Every fifth line heavier — the thing that makes graph paper
        // read as graph paper rather than as a plain grid.
        pattern({
          backgroundImage: `linear-gradient(${major} 1px, transparent 1px), linear-gradient(90deg, ${major} 1px, transparent 1px)`,
          backgroundSize: "120px 120px, 120px 120px",
        }),
      ];
    },
  },

  {
    id: "dot-matrix",
    label: "Dot matrix",
    band: bandOf("peri"),
    layers: (dark) => {
      const c = ink(dark);
      return [
        pattern({
          backgroundImage: `radial-gradient(${c.accent(0.1)} 1.4px, transparent 1.5px)`,
          backgroundSize: "26px 26px",
        }),
        // A second, coarser grid offset by half a cell: reads as depth
        // rather than as one flat sheet of dots.
        pattern({
          backgroundImage: `radial-gradient(${c.accent(0.07)} 2.6px, transparent 2.7px)`,
          backgroundSize: "104px 104px",
          backgroundPosition: "52px 52px",
        }),
        glow({
          backgroundImage: `radial-gradient(60% 50% at 78% 96%, ${c.accentAlt(0.12)} 0%, transparent 72%)`,
        }),
      ];
    },
  },

  {
    id: "constellation",
    label: "Constellation",
    band: bandOf("indigo"),
    layers: (dark) => {
      const c = ink(dark);
      return [
        // Sparse "stars": two dot grids at prime-ish spacings, so the
        // repeat is hard to spot at a glance.
        pattern({
          backgroundImage: `radial-gradient(${c.accent(0.13)} 1.5px, transparent 1.6px)`,
          backgroundSize: "87px 91px",
        }),
        pattern({
          backgroundImage: `radial-gradient(${c.accent(0.08)} 1px, transparent 1.1px)`,
          backgroundSize: "43px 37px",
          backgroundPosition: "19px 11px",
        }),
        // The faint lines "between" them.
        pattern({
          backgroundImage: `repeating-linear-gradient(31deg, ${c.hair(0.5)} 0 1px, transparent 1px 118px)`,
        }),
      ];
    },
  },

  {
    id: "aurora",
    label: "Aurora",
    band: bandOf("sky"),
    layers: (dark) => {
      const c = ink(dark);
      return [
        glow({
          backgroundImage: [
            `radial-gradient(55% 50% at 14% 18%, ${c.accent(0.16)} 0%, transparent 70%)`,
            `radial-gradient(50% 46% at 86% 26%, ${c.deep(0.1)} 0%, transparent 72%)`,
            `radial-gradient(80% 60% at 50% 104%, ${c.accentAlt(0.14)} 0%, transparent 75%)`,
          ].join(", "),
        }),
      ];
    },
  },

  {
    id: "mesh",
    label: "Mesh",
    band: bandOf("core"),
    layers: (dark) => {
      const c = ink(dark);
      return [
        glow({
          // Four corner stops — the classic mesh-gradient trick, done
          // with plain radials so there is no canvas or SVG to hydrate.
          backgroundImage: [
            `radial-gradient(45% 45% at 0% 0%, ${c.accent(0.13)} 0%, transparent 70%)`,
            `radial-gradient(45% 45% at 100% 0%, ${c.accentAlt(0.12)} 0%, transparent 70%)`,
            `radial-gradient(55% 55% at 100% 100%, ${c.deep(0.09)} 0%, transparent 70%)`,
            `radial-gradient(55% 55% at 0% 100%, ${c.accent(0.11)} 0%, transparent 70%)`,
          ].join(", "),
        }),
      ];
    },
  },

  {
    id: "rays",
    label: "Rays",
    band: bandOf("peri"),
    layers: (dark) => {
      const c = ink(dark);
      return [
        pattern({
          // Rays fan out from just above the top edge, so the hero sits
          // in the spread rather than at the vanishing point.
          backgroundImage: `repeating-conic-gradient(from 194deg at 50% -18%, ${c.accent(0.05)} 0deg 3.2deg, transparent 3.2deg 11deg)`,
        }),
        glow({
          backgroundImage: `radial-gradient(60% 40% at 50% -5%, ${c.accentAlt(0.12)} 0%, transparent 72%)`,
        }),
      ];
    },
  },

  {
    id: "waves",
    label: "Waves",
    band: bandOf("sky"),
    layers: (dark) => {
      const c = ink(dark);
      return [
        pattern({
          // Concentric arcs centred well below the hero read as long,
          // shallow swells instead of visible circles.
          backgroundImage: `repeating-radial-gradient(130% 62% at 50% 138%, transparent 0 26px, ${c.hair(1.1)} 26px 27px)`,
        }),
        glow({
          backgroundImage: `radial-gradient(80% 45% at 50% 105%, ${c.accent(0.13)} 0%, transparent 72%)`,
        }),
      ];
    },
  },

  {
    id: "ripple",
    label: "Ripple",
    band: bandOf("core"),
    layers: (dark) => {
      const c = ink(dark);
      return [
        pattern({
          // Rings spreading from behind the greeting — tight enough to
          // read as a ripple, not as a target.
          backgroundImage: `repeating-radial-gradient(58% 58% at 50% 6%, transparent 0 33px, ${c.hair(1)} 33px 34px)`,
        }),
        glow({
          backgroundImage: `radial-gradient(50% 40% at 50% 8%, ${c.accent(0.1)} 0%, transparent 70%)`,
        }),
      ];
    },
  },

  {
    id: "topography",
    label: "Topography",
    band: bandOf("steel"),
    layers: (dark) => {
      const c = ink(dark);
      const line = c.hair(1.15);
      return [
        pattern({
          backgroundImage: `repeating-radial-gradient(38% 34% at 26% 34%, transparent 0 17px, ${line} 17px 18px)`,
        }),
        pattern({
          // A second, larger set of rings off to the right — two peaks
          // on a contour map rather than one bullseye.
          backgroundImage: `repeating-radial-gradient(46% 42% at 78% 62%, transparent 0 22px, ${line} 22px 23px)`,
        }),
        glow({
          backgroundImage: `radial-gradient(70% 50% at 50% 100%, ${c.deep(0.08)} 0%, transparent 74%)`,
        }),
      ];
    },
  },

  {
    id: "pinstripe",
    label: "Pinstripe",
    band: bandOf("indigo"),
    layers: (dark) => {
      const c = ink(dark);
      return [
        pattern({
          backgroundImage: `repeating-linear-gradient(45deg, ${c.hair(1)} 0 1px, transparent 1px 13px)`,
        }),
        pattern({
          backgroundImage: `repeating-linear-gradient(-45deg, ${c.hair(0.6)} 0 1px, transparent 1px 52px)`,
        }),
        glow({
          backgroundImage: `radial-gradient(60% 48% at 20% 100%, ${c.accent(0.12)} 0%, transparent 72%)`,
        }),
      ];
    },
  },

  {
    id: "crosshatch",
    label: "Crosshatch",
    band: bandOf("steel"),
    layers: (dark) => {
      const c = ink(dark);
      const line = c.hair(0.8);
      return [
        pattern({
          backgroundImage: [
            `repeating-linear-gradient(45deg, ${line} 0 1px, transparent 1px 11px)`,
            `repeating-linear-gradient(-45deg, ${line} 0 1px, transparent 1px 11px)`,
          ].join(", "),
        }),
        glow({
          backgroundImage: `radial-gradient(70% 50% at 50% 102%, ${c.accentAlt(0.11)} 0%, transparent 74%)`,
        }),
      ];
    },
  },

  {
    id: "weave",
    label: "Weave",
    band: bandOf("peri"),
    layers: (dark) => {
      const c = ink(dark);
      return [
        // Dense warp, sparse weft — the uneven spacing is what reads as
        // fabric instead of as another grid.
        pattern({
          backgroundImage: `repeating-linear-gradient(0deg, ${c.hair(0.75)} 0 1px, transparent 1px 7px)`,
        }),
        pattern({
          backgroundImage: `repeating-linear-gradient(90deg, ${c.hair(1.2)} 0 1px, transparent 1px 29px)`,
        }),
      ];
    },
  },

  {
    id: "isometric",
    label: "Isometric",
    band: bandOf("steel"),
    layers: (dark) => {
      const c = ink(dark);
      const line = c.hair(1);
      return [
        pattern({
          // Three passes at 60°/-60°/vertical make the triangular grid
          // that reads as isometric paper.
          backgroundImage: [
            `repeating-linear-gradient(60deg, ${line} 0 1px, transparent 1px 44px)`,
            `repeating-linear-gradient(-60deg, ${line} 0 1px, transparent 1px 44px)`,
            `repeating-linear-gradient(90deg, ${line} 0 1px, transparent 1px 44px)`,
          ].join(", "),
        }),
        glow({
          backgroundImage: `radial-gradient(55% 45% at 88% 6%, ${c.accentAlt(0.12)} 0%, transparent 72%)`,
        }),
      ];
    },
  },

  {
    id: "bokeh",
    label: "Bokeh",
    band: bandOf("indigo"),
    layers: (dark) => {
      const c = ink(dark);
      return [
        glow({
          backgroundImage: [
            `radial-gradient(circle 120px at 14% 26%, ${c.accent(0.12)} 0%, transparent 70%)`,
            `radial-gradient(circle 70px at 34% 68%, ${c.accentAlt(0.11)} 0%, transparent 70%)`,
            `radial-gradient(circle 160px at 72% 30%, ${c.deep(0.08)} 0%, transparent 70%)`,
            `radial-gradient(circle 90px at 88% 72%, ${c.accent(0.1)} 0%, transparent 70%)`,
            `radial-gradient(circle 52px at 56% 14%, ${c.accentAlt(0.11)} 0%, transparent 70%)`,
          ].join(", "),
        }),
      ];
    },
  },

  {
    id: "spotlight",
    label: "Spotlight",
    band: bandOf("core"),
    layers: (dark) => {
      const c = ink(dark);
      const line = c.hair(0.9);
      return [
        pattern({
          backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
          backgroundSize: "72px 72px, 72px 72px",
        }),
        glow({
          // A wide beam from above centre, which is where the greeting
          // and the composer sit. Light mode lifts to white rather than
          // adding colour there, so the greeting stays crisp.
          backgroundImage: dark
            ? `radial-gradient(70% 55% at 50% 2%, ${c.accent(0.14)} 0%, transparent 70%)`
            : `radial-gradient(70% 55% at 50% 2%, rgba(255,255,255,0.9) 0%, ${c.accent(0.07)} 48%, transparent 74%)`,
        }),
      ];
    },
  },

  {
    id: "horizon",
    label: "Horizon",
    band: bandOf("sky"),
    layers: (dark) => {
      const c = ink(dark);
      return [
        glow({
          // A soft band low in the hero — a horizon line without the
          // hard edge of an actual line.
          backgroundImage: `linear-gradient(180deg, transparent 50%, ${c.accent(0.1)} 68%, transparent 86%)`,
        }),
        glow({
          backgroundImage: `radial-gradient(120% 32% at 50% 74%, ${c.accentAlt(0.12)} 0%, transparent 72%)`,
        }),
      ];
    },
  },

  {
    id: "prism",
    label: "Prism",
    band: bandOf("peri"),
    layers: (dark) => {
      const c = ink(dark);
      return [
        glow({
          // Two wide diagonal bands crossing the hero — light through
          // glass, at an angle nothing else in the set uses.
          backgroundImage: `linear-gradient(118deg, transparent 10%, ${c.accent(0.11)} 26%, transparent 40%, transparent 54%, ${c.accentAlt(0.1)} 68%, transparent 84%)`,
        }),
      ];
    },
  },

  // Not ported from Weviy: "Halo" — three discrete rings centred at 50% 44%,
  // i.e. directly behind the headline and the prompt box. Unlike the other ring
  // frames (Ripple's are tight enough to read as texture, Topography's sit off
  // to the sides), its arcs were widely spaced and landed across the content, so
  // they read as circles drawn over the hero rather than as a background — and
  // dimming did not fix it, because the problem was where the lines were, not
  // how strong. Anything added here should keep the upper middle near-plain.
];

/** Look one up by id — for a page that wants a fixed backdrop, not the rotation. */
export const backdropById = (id) =>
  HERO_BACKDROPS.find((b) => b.id === id) || HERO_BACKDROPS[0];

export default HERO_BACKDROPS;
