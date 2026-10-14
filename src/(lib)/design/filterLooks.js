/**
 * Filter looks — Canva's named filters, grouped the way its "See all" view
 * groups them (Natural, Warm, Cool, …).
 *
 * Every look is a CSS filter string, which is what keeps it honest: the same
 * string styles the element on the stage and is handed to `ctx.filter` by the
 * exporter, so what you pick is what downloads. The cost is that CSS filters
 * can't tint selectively — `hue-rotate` turns EVERY colour, not just a cast —
 * so a coloured cast is made one of two ways:
 *
 *   warm  — `sepia`, which pushes toward orange without rotating anything;
 *   tinted — desaturate first (grayscale/partial), then `sepia` + `hue-rotate`,
 *            which rotates only the cast, since there is little colour left.
 *
 * Ids are prefixed `look-` so they can share `el.filter` with the older image
 * presets in imageAdjust.js (which also have a "noir" and a "fade").
 */

const look = (id, label, css) => ({ id: `look-${id}`, label, css });

export const FILTER_LOOK_GROUPS = [
  {
    id: "natural",
    label: "Natural",
    looks: [
      look("fresco", "Fresco", "brightness(1.05) contrast(0.92) saturate(0.85) hue-rotate(-6deg)"),
      look("belvedere", "Belvedere", "contrast(1.08) saturate(0.9) sepia(0.1)"),
      look("flint", "Flint", "brightness(1.04) contrast(0.88) saturate(0.7)"),
      look("luna", "Luna", "brightness(1.06) contrast(0.9) saturate(0.8) hue-rotate(-10deg)"),
      look("aero", "Aero", "brightness(1.08) saturate(0.75) sepia(0.06)"),
      look("myst", "Myst", "contrast(0.85) brightness(0.9) saturate(0.6) hue-rotate(-8deg)"),
    ],
  },
  {
    id: "warm",
    label: "Warm",
    looks: [
      look("bali", "Bali", "sepia(0.15) saturate(1.1) brightness(1.04)"),
      look("capri", "Capri", "sepia(0.2) saturate(1.15) hue-rotate(-8deg)"),
      look("latte", "Latte", "sepia(0.35) brightness(1.05) contrast(0.95)"),
      look("bronz", "Bronz", "sepia(0.5) saturate(1.4) brightness(1.05)"),
      look("sandi", "Sandi", "sepia(0.45) saturate(1.6) hue-rotate(-12deg)"),
      look("sangri", "Sangri", "sepia(0.3) saturate(1.3) hue-rotate(-25deg)"),
    ],
  },
  {
    id: "cool",
    label: "Cool",
    looks: [
      look("scandi", "Scandi", "hue-rotate(-8deg) saturate(0.85) brightness(1.05)"),
      look("nordic", "Nordic", "hue-rotate(-14deg) saturate(0.8) contrast(1.05)"),
      look("astro", "Astro", "hue-rotate(-20deg) saturate(0.9) brightness(0.98)"),
      look("arctic", "Arctic", "grayscale(0.35) sepia(0.3) hue-rotate(170deg) saturate(1.4) brightness(1.06)"),
      look("polar", "Polar", "grayscale(0.45) sepia(0.45) hue-rotate(180deg) saturate(1.8) brightness(1.05)"),
      look("tundra", "Tundra", "grayscale(0.3) sepia(0.2) hue-rotate(130deg) saturate(1.2) brightness(1.1)"),
    ],
  },
  {
    id: "vivid",
    label: "Vivid",
    looks: [
      look("chroma", "Chroma", "saturate(1.6) contrast(1.1)"),
      look("rustiq", "Rustiq", "saturate(1.4) sepia(0.15) contrast(1.1)"),
      look("eldar", "Eldar", "saturate(1.3) contrast(1.2) brightness(0.95)"),
      look("zeal", "Zeal", "saturate(1.8) hue-rotate(-6deg)"),
      look("aria", "Aria", "saturate(1.5) brightness(1.08)"),
      look("stark", "Stark", "contrast(1.35) saturate(1.3)"),
    ],
  },
  {
    id: "soft",
    label: "Soft",
    looks: [
      look("aura", "Aura", "brightness(1.1) contrast(0.85) saturate(0.85)"),
      look("hazel", "Hazel", "sepia(0.2) contrast(0.88) brightness(1.06)"),
      look("whimsi", "Whimsi", "grayscale(0.2) sepia(0.2) hue-rotate(-40deg) brightness(1.08) contrast(0.9)"),
      look("rose", "Rose", "grayscale(0.35) sepia(0.4) hue-rotate(-45deg) saturate(1.5) brightness(1.06) contrast(0.9)"),
      look("oceanic", "Oceanic", "grayscale(0.35) sepia(0.35) hue-rotate(80deg) saturate(1.1) contrast(0.88) brightness(1.04)"),
      look("nimbus", "Nimbus", "grayscale(0.35) sepia(0.4) hue-rotate(210deg) saturate(1.4) brightness(1.08) contrast(0.88)"),
    ],
  },
  {
    id: "vintage",
    label: "Vintage",
    looks: [
      look("vinto", "Vinto", "sepia(0.25) contrast(0.9) saturate(0.85)"),
      look("fade", "Fade", "contrast(0.8) brightness(1.1) saturate(0.75)"),
      look("antiq", "Antiq", "sepia(0.55) contrast(0.92) brightness(1.02)"),
      look("nostalg", "Nostalg", "sepia(0.35) saturate(1.2) contrast(0.9) brightness(1.05)"),
      look("dream", "Dream", "grayscale(0.2) sepia(0.2) hue-rotate(160deg) brightness(1.12) contrast(0.85)"),
      look("retro", "Retro", "grayscale(0.2) sepia(0.3) hue-rotate(50deg) contrast(1.1) saturate(1.1)"),
    ],
  },
  {
    id: "mono",
    label: "Mono",
    looks: [
      look("classic", "Classic", "grayscale(1)"),
      look("ink", "Ink", "grayscale(1) contrast(1.3)"),
      look("noir", "Noir", "grayscale(1) contrast(1.5) brightness(0.9)"),
      look("film", "Film", "grayscale(1) contrast(0.85) brightness(1.08)"),
      look("newspaper", "Newspaper", "grayscale(1) contrast(1.1) brightness(0.8)"),
      look("slate", "Slate", "grayscale(1) sepia(0.2) hue-rotate(170deg) saturate(1.5)"),
    ],
  },
  {
    id: "colorpop",
    label: "Color Pop",
    looks: [
      look("outrun", "Outrun", "sepia(0.6) saturate(2.4) hue-rotate(-15deg) contrast(1.1)"),
      look("heatwave", "Heatwave", "sepia(0.7) saturate(3) hue-rotate(-30deg)"),
      look("amethyst", "Amethyst", "grayscale(1) sepia(0.4) hue-rotate(220deg) saturate(2) brightness(1.1)"),
      look("minty", "Minty", "grayscale(0.5) sepia(0.5) hue-rotate(80deg) saturate(1.8)"),
      look("hibiscus", "Hibiscus", "grayscale(0.4) sepia(0.4) hue-rotate(150deg) saturate(1.6)"),
      look("poster", "Poster", "contrast(1.6) saturate(1.5)"),
      look("xpro-minus", "X-Pro -", "hue-rotate(-20deg) contrast(1.25) saturate(1.4) brightness(0.95)"),
      look("xpro-plus", "X-Pro +", "sepia(0.3) contrast(1.3) saturate(1.6) brightness(1.05)"),
    ],
  },
];

/** "None" — clears the look. Shown first, on its own, like Canva's. */
export const NO_LOOK = { id: "none", label: "None", css: "" };

const BY_ID = new Map(
  FILTER_LOOK_GROUPS.flatMap((g) => g.looks).map((l) => [l.id, l]),
);

/** The CSS for a look id, or "" for none / an id that isn't a look. */
export function lookCssById(id) {
  return BY_ID.get(id)?.css || "";
}

/** The first few looks, for the panel's strip. */
export const FEATURED_LOOKS = [NO_LOOK, ...FILTER_LOOK_GROUPS[0].looks.slice(0, 5)];
