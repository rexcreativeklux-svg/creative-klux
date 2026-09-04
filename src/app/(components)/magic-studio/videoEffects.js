/**
 * videoEffects.js
 * ─────────────────────────────────────────────────────────────────────────────
 * VIDEO_EFFECTS — the effect catalog behind Magic Studio's Video Effects tool.
 *
 * An effect is a ready-made piece of MOTION to apply to a still. Picking one
 * writes its `prompt` into the composer's box, and the user edits it from there.
 *
 * ── ⚠️ THE EFFECT IS A PROMPT, NOT AN ID ────────────────────────────────────
 * Nothing here is sent to the backend as an `effect_id`. The whole template
 * travels inside `prompt`, which is the convention Product Video already settled
 * on for exactly the same reason: an id means the server has to hold a second
 * copy of every look, and the moment a user edits the words the id is a lie
 * about what was actually generated. The words ARE the template.
 *
 * `value` is therefore a UI concern only — it says which card is ticked and
 * which prompt to seed. It never reaches the API, which is what makes renaming
 * one safe in a way that renaming a `visual_style` value is not.
 *
 * ── How the prompts are written ─────────────────────────────────────────────
 * Each names, in this order: what the subject does, the camera move, the
 * lighting and texture, and the mood. Those are the levers a video model
 * responds to, and the order matches the prompt structure the reference
 * effect gallery teaches.
 *
 * They deliberately say "the subject" / "the product" and NEVER name the item in
 * the thumbnail. The thumbnail sells the look; the user's own picture is what
 * gets animated, and "a can of cola" in the prompt fights their bottle of
 * shampoo. This is the same rule productVideoTemplates.js documents, and it is
 * the single easiest one to break when adding an entry.
 *
 * ── Adding an effect ────────────────────────────────────────────────────────
 * 1. Find a LANDSCAPE photo on Pexels that DEMONSTRATES the look (not one that
 *    illustrates its name) and note the numeric id.
 * 2. Check the id resolves: images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg
 * 3. Add it to its category block with a unique `value`, a `label`, a short
 *    `desc`, an `icon` and a `prompt` written to the rules above.
 * It appears in the picker automatically.
 *
 * A dead thumbnail degrades to the card's icon ground rather than to a broken
 * image (see OptionPanelBody's ⚠️), so a photo disappearing is untidy, not
 * broken — which is why every entry carries an `icon` as well as an `img`.
 *
 * Thumbnails are Pexels (free commercial license, no attribution required,
 * stable hotlinkable CDN URLs) — the same source every other picker in the app
 * draws on. Every id below was verified against the CDN.
 */

import {
  Cat,
  Clapperboard,
  Cookie,
  Gem,
  GlassWater,
  PartyPopper,
  Pencil,
  Shapes,
  Signal,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";

/** Pexels CDN helper — mirrors the one in magicStudioConfigs. */
const px = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&h=300`;

/**
 * The value meaning "I'll write my own words".
 *
 * ⚠️ EXPORTED, AND THREE PLACES KEY OFF IT. It is the catalog's default, it is
 * the one card that seeds NOTHING into the prompt box, and it is what makes the
 * prompt required rather than optional — picking a real effect fills the box for
 * you, so only this one can leave it empty. Declared once rather than written as
 * a bare "custom" in the config, the composer and the validator.
 */
export const CUSTOM_EFFECT = "custom";

/**
 * Display order for the categories.
 *
 * ⚠️ ORDER ONLY — the categories themselves are derived from the catalog below,
 * so one listed here with no effects never renders. A hand-maintained list is
 * one deletion away from an empty group that reads as a broken feature.
 */
export const CATEGORY_ORDER = [
  "Ads & E-commerce",
  "Cool Scenes",
  "Playful",
  "Portraits",
];

/** The catalog, grouped by category so a new entry has an obvious home. */
const CATALOG = [
  // ── Ads & E-commerce ──────────────────────────────────────────────────────
  {
    value: "chocolate_pour",
    label: "Chocolate Pour",
    desc: "Glossy liquid cascade",
    category: "Ads & E-commerce",
    icon: Cookie,
    img: px(6035321),
    prompt:
      "Molten chocolate pours over the subject in slow motion and sheets down its sides, pooling glossily at the base. The camera holds a slow push in, tilting slightly down as the pour lands. Warm directional key light rakes across the surface so every ripple catches a highlight; deep shadows behind. Rich, indulgent, appetising — photorealistic food commercial with a slow shutter feel.",
  },
  {
    value: "soda_splash",
    label: "Beverage Splash",
    desc: "Ice-cold burst of water",
    category: "Ads & E-commerce",
    icon: GlassWater,
    img: px(31965470),
    prompt:
      "Water erupts around the subject in a crown of droplets, condensation beading and running down its surface while bubbles stream upward through the splash. The camera whips in fast and then settles, locking off as the droplets hang mid-air. Crisp cold backlight turns each drop into a bright point against a dark gradient. Refreshing and high-energy — photorealistic beverage commercial, extreme slow motion.",
  },
  {
    value: "lipstick_orbit",
    label: "Orbit Reveal",
    desc: "Camera circles the subject",
    category: "Ads & E-commerce",
    icon: Sparkles,
    img: px(7810641),
    prompt:
      "The camera performs a smooth 360-degree orbit around the subject, which stands perfectly still and centred while flowing silk drifts softly in the background behind it. Soft directional studio light sweeps across the surface as the angle changes, picking out the edges. Elegant, premium, unhurried — photorealistic luxury product commercial with shallow depth of field.",
  },
  {
    value: "cheese_pull",
    label: "Stretch Pull",
    desc: "Slow molten stretch",
    category: "Ads & E-commerce",
    icon: Cookie,
    img: px(2741457),
    prompt:
      "The subject is lifted slowly upward and long molten strands stretch and glisten beneath it, thinning as they pull, steam curling off in the warm air. The camera tracks up with the lift and holds. Golden side light rakes across the surface; the background falls to soft warm bokeh. Mouth-watering and tactile — photorealistic food commercial in slow motion.",
  },
  {
    value: "diamond_sparkle",
    label: "Diamond Sparkle",
    desc: "Light catches every facet",
    category: "Ads & E-commerce",
    icon: Gem,
    img: px(12427696),
    prompt:
      "Points of light bloom and travel across the subject as it rotates slowly, each facet catching and releasing a star-shaped flare. The camera drifts in on a slow macro push. A single hard key light rakes across from the side against a deep black backdrop, with fine dust motes drifting through the beam. Opulent and still — photorealistic luxury commercial, crisp specular highlights.",
  },

  // ── Cool Scenes ───────────────────────────────────────────────────────────
  {
    value: "cyberpunk_glitch",
    label: "Cyberpunk Glitch",
    desc: "Neon, scanlines & data",
    category: "Cool Scenes",
    icon: Signal,
    img: px(28122495),
    prompt:
      "The subject holds steady while magenta and cyan neon light washes over it and holographic data streams scroll upward through the frame. Digital glitch artifacts tear briefly across the image and resolve, scanlines rolling top to bottom. The camera pushes in slowly with a faint handheld drift. Rain-slick reflections and volumetric haze behind. Futuristic and electric — cinematic cyberpunk grade, high contrast.",
  },
  {
    value: "comic_book",
    label: "Comic Book",
    desc: "Halftone & bold ink",
    category: "Cool Scenes",
    icon: Clapperboard,
    img: px(6654177),
    prompt:
      "The subject transforms into a bold inked comic-book illustration — heavy black outlines, flat saturated fills and visible halftone dot shading — then begins to move within that style. Speed lines radiate outward from the centre and a burst panel flashes behind it. The camera snaps in on a hard zoom and holds. Punchy, graphic, high-contrast — animated comic panel with paper grain.",
  },
  {
    value: "ice_magic",
    label: "Frost Magic",
    desc: "Ice creeps across the frame",
    category: "Cool Scenes",
    icon: Zap,
    img: px(28122495),
    prompt:
      "Frost creeps outward across the subject from its base, crystalline spines growing over the surface while a cold mist rolls low through the frame and ice particles drift upward. The camera arcs slowly around it. Pale blue rim light picks out each crystal edge against a dark backdrop. Sharp, magical, wintry — cinematic VFX with fine particle detail.",
  },

  // ── Playful ───────────────────────────────────────────────────────────────
  {
    value: "clay_stop_motion",
    label: "Clay Stop Motion",
    desc: "Handmade plasticine look",
    category: "Playful",
    icon: Shapes,
    img: px(35776032),
    prompt:
      "The subject is rendered as a handmade plasticine model — visible fingerprints, soft rounded edges, slightly uneven matte surface — and moves in deliberate stop-motion steps at a reduced frame rate, with a gentle squash and stretch on each beat. The camera holds a locked-off medium shot. Warm practical lighting on a simple craft-paper set. Charming and tactile — claymation, shallow depth of field.",
  },
  {
    value: "plush_toy",
    label: "Plush Toy",
    desc: "Soft fabric & stitching",
    category: "Playful",
    icon: Cat,
    img: px(36993615),
    prompt:
      "The subject becomes a soft plush toy — fuzzy fabric texture, visible stitched seams, button details and a slightly oversized cute proportion — and bounces gently in place, squashing on landing. The camera pushes in slowly to a close-up. Soft warm light with no hard shadows on a pastel backdrop. Cosy, cuddly, oversized-cute — 3D render with fine fibre detail.",
  },

  // ── Portraits ─────────────────────────────────────────────────────────────
  {
    value: "confetti_nod",
    label: "Celebration",
    desc: "Confetti and a smile",
    category: "Portraits",
    icon: PartyPopper,
    img: px(7911315),
    prompt:
      "The subject breaks into a warm natural smile and nods gently while colourful confetti bursts into the frame and drifts slowly down around them, some pieces catching the light as they fall. The camera holds a steady medium shot with a faint push in. Bright golden-hour light with a soft warm glow. Joyful and celebratory — photorealistic with natural facial motion.",
  },
  {
    value: "old_photo_speak",
    label: "Old Photo Revival",
    desc: "A still portrait comes alive",
    category: "Portraits",
    icon: Pencil,
    img: px(14734606),
    prompt:
      "The subject in the aged photograph comes to life — they blink, their expression softens into a gentle smile, and their head turns slightly toward the camera with natural micro-movements. Film grain, faded tones and paper texture are preserved throughout rather than cleaned away. The camera pushes in very slowly. Nostalgic and moving — restored archival footage look, subtle and unexaggerated.",
  },
];

/**
 * Every effect, plus the "write your own" card that leads the list.
 *
 * ⚠️ CUSTOM IS FIRST AND IT IS THE DEFAULT. An untouched composer must not
 * arrive with somebody else's words already in the box — the tool would be
 * generating a chocolate pour for a user who typed nothing and chose nothing.
 * It carries no `img` on purpose: the card's icon ground is the designed state
 * for "there is no picture of this", and a stock photo here would advertise a
 * look this card specifically does not apply.
 */
export const VIDEO_EFFECTS = [
  {
    value: CUSTOM_EFFECT,
    label: "Write your own",
    desc: "Describe the motion yourself",
    category: null,
    icon: Wand2,
  },
  ...CATEGORY_ORDER.flatMap((category) =>
    CATALOG.filter((effect) => effect.category === category),
  ),
];

/** One effect by its value, or null. */
export const effectByValue = (value) =>
  VIDEO_EFFECTS.find((effect) => effect.value === value) || null;

/**
 * The words an effect seeds into the prompt box — "" for the custom card.
 *
 * Used by the composer's `promptFrom` wiring: picking a card calls this and
 * writes the result into the textarea, which is what makes the effect editable
 * rather than a black box.
 */
export const effectPrompt = (value) => effectByValue(value)?.prompt || "";

// ── Drift check ──────────────────────────────────────────────────────────────
// A category on an entry that CATEGORY_ORDER doesn't list would silently drop
// that effect from the picker — VIDEO_EFFECTS is built by walking the order, so
// anything outside it is filtered away with no error. Dev-only.
if (process.env.NODE_ENV !== "production") {
  const known = new Set(CATEGORY_ORDER);
  const orphans = CATALOG.filter((effect) => !known.has(effect.category));
  if (orphans.length > 0) {
    console.warn(
      `⚠️ [magic-studio] video effects with an unlisted category: ${orphans
        .map((effect) => effect.value)
        .join(", ")} — add it to CATEGORY_ORDER in videoEffects.js`,
    );
  }
}
