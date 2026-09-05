/**
 * videoEffectTemplates.js
 * ─────────────────────────────────────────────────────────────────────────────
 * VIDEO_EFFECT_TEMPLATES — the template catalog behind Magic Studio's Video
 * Effects tool.
 *
 * A template is a MATCHED PAIR: a source still and the prompt that turns it into
 * the clip shown on hover. Applying one fills the prompt box AND selects that
 * still as the tool's input, so a first-time user can press Generate immediately
 * and get back the thing they were shown. They are free to swap the image for
 * their own afterwards — the prompt is a starting point, not a contract.
 *
 * ── ⚠️ THIS IS WHY THE PROMPTS NAME THEIR SUBJECT ───────────────────────────
 * Every other catalog in this app (videoEffects before it, productVideoTemplates,
 * stagingTemplates) writes "the subject" / "the product" and never names what is
 * in the thumbnail, because the picture being animated is the USER'S. Here the
 * template supplies the picture too, so "the fox turns its head" describes the
 * exact frame it is applied to. Keep that rule the moment a template stops
 * carrying an image.
 *
 * ── ⚠️ THE ASSETS ARE PLACEHOLDERS, AND THEY ARE NOT OURS ────────────────────
 * The stills and clips under /public/templates/video-effects are cutout.pro's
 * published image-to-video showcase, pulled in to build and review this UI
 * against real content. They are stand-ins for our own model's output and MUST
 * be replaced with clips we generated before this ships anywhere public — they
 * are someone else's work, and one of them is a pixel-art homage to a franchise
 * that is very much still enforced.
 *
 * Replacing them is a file swap: keep the names (`s1.jpeg`/`s1.mp4` …) and drop
 * ours in, or repoint `asset()` at a CDN. Nothing else in this file changes.
 *
 * ── The prompts ─────────────────────────────────────────────────────────────
 * Rewritten rather than copied, to the structure the rest of the app's catalogs
 * use — what the subject does, the camera move, the light, then the mood — and
 * trimmed of the things that only made sense on someone else's page: model-
 * comparison notes, and the two "generate a second shot" briefs, which ask for
 * something a single-clip tool cannot do.
 *
 * ── Adding a template ───────────────────────────────────────────────────────
 * 1. Put the still and its result clip in /public/templates/video-effects.
 * 2. Add an entry with a unique `value`, a `label`, a short `desc`, a `category`
 *    from CATEGORY_ORDER, an `icon`, and a prompt written to the rules above.
 * It appears in the picker automatically.
 */

import {
  Bike,
  Brush,
  Building2,
  Dog,
  Droplet,
  Flower2,
  Gamepad2,
  Heart,
  Mountain,
  Rabbit,
  Rocket,
  Search,
  Smile,
  Stars,
  Wand2,
  Waves,
  Wind,
} from "lucide-react";

/**
 * Where the template media lives.
 *
 * Served from /public rather than a user's gallery on purpose: a gallery item
 * belongs to ONE account, and these have to be the same for everyone who opens
 * the tool. It is also what makes the swap for our own renders a file copy.
 */
const asset = (file) => `/templates/video-effects/${file}`;

/**
 * The value meaning "I'll write my own words".
 *
 * ⚠️ EXPORTED, AND THREE PLACES KEY OFF IT. It is the catalog's default, it is
 * the one card that seeds NOTHING into the prompt box or the image slot, and it
 * is what makes the prompt required rather than optional — applying a real
 * template fills the box for you, so only this one can leave it empty.
 */
export const CUSTOM_EFFECT = "custom";

/**
 * Display order for the categories.
 *
 * ⚠️ ORDER ONLY — the categories themselves are derived from the catalog below,
 * so one listed here with no templates never renders. A hand-maintained list is
 * one deletion away from an empty group that reads as a broken feature.
 */
export const CATEGORY_ORDER = [
  "Camera moves",
  "Portraits",
  "Nature",
  "Time-lapse",
  "Stylised",
];

/** The catalog, grouped by category so a new entry has an obvious home. */
const CATALOG = [
  // ── Camera moves ──────────────────────────────────────────────────────────
  {
    value: "rain_cyclist",
    label: "Puddle Splash",
    desc: "Tracking shot, slow motion",
    category: "Camera moves",
    icon: Bike,
    image: asset("s4.jpeg"),
    video: asset("s4.mp4"),
    prompt:
      "The cyclist rides through the puddle and the water throws up in a high arc, individual droplets hanging in the air before they fall. The camera tracks alongside at wheel height, holding the rider centred. Neon signage reflects off the wet road and off every droplet; the light is cold and the street is dark around it. Cinematic slow motion, dusk, high contrast.",
  },
  {
    value: "desert_dancer",
    label: "Dune Orbit",
    desc: "Low orbit, silk in the wind",
    category: "Camera moves",
    icon: Wind,
    image: asset("s5.jpeg"),
    video: asset("s5.mp4"),
    prompt:
      "The dancer turns slowly on the crest of the dune and the silk robes catch the wind, lifting and folding in long fluid arcs around them. The camera orbits from a low angle, keeping the figure against the sky as the empty desert opens up behind. Warm low sun rakes across the sand and lights the fabric from behind. Wide, epic, unhurried.",
  },
  {
    value: "canyon_flight",
    label: "Drone Chase",
    desc: "Aerial descent at speed",
    category: "Camera moves",
    icon: Mountain,
    image: asset("v4.jpeg"),
    video: asset("v4.mp4"),
    prompt:
      "The kayak runs the canyon at full speed, bouncing and swaying with the water rather than gliding over it, waves breaking against the hull and the rock walls. The camera drops rapidly from above and settles into a chase directly behind, holding tight through the turns. Hard daylight overhead, deep shadow in the canyon. Fast, physical, exhilarating.",
  },
  {
    value: "dolly_zoom",
    label: "Dolly Zoom",
    desc: "Vertigo push on a fixed subject",
    category: "Camera moves",
    icon: Search,
    image: asset("v6.jpeg"),
    video: asset("v6.mp4"),
    prompt:
      "The figure holds still and steady in frame while the alley behind him stretches and distorts — the camera pushes in as the lens widens, so his size never changes and the background pulls away from him. Hard side light, deep shadow, haze in the air. Tense and disorienting, a classic vertigo shot.",
  },

  // ── Portraits ─────────────────────────────────────────────────────────────
  {
    value: "head_turn",
    label: "Turn and Smile",
    desc: "Slow turn to camera",
    category: "Portraits",
    icon: Smile,
    image: asset("s2.jpeg"),
    video: asset("s2.mp4"),
    prompt:
      "She completes the turn toward the camera in one smooth, natural movement, and as she arrives a warm smile spreads across her face, her eyes creasing with it. The camera holds a steady close shot. Soft light picks out the hair as it swings and settles, and catches the shine in her eyes. Slow motion, gentle, unforced.",
  },
  {
    value: "embrace",
    label: "Tender Kiss",
    desc: "Close, affectionate beat",
    category: "Portraits",
    icon: Heart,
    image: asset("s3.jpeg"),
    video: asset("s3.mp4"),
    prompt:
      "The person behind leans in and kisses the other softly on one cheek, then the other, both of them smiling into it. The camera holds a close two-shot and drifts almost imperceptibly closer. Warm, soft light with no hard shadows. Intimate and unhurried, natural micro-expressions throughout.",
  },
  {
    value: "teardrop",
    label: "Teardrop",
    desc: "Super slow motion, one tear",
    category: "Portraits",
    icon: Droplet,
    image: asset("v5.jpeg"),
    video: asset("v5.mp4"),
    prompt:
      "A single tear leaves the corner of the eye and rolls the whole way down, following the lines of the face, while the mouth lifts into the faintest smile. The camera holds a locked-off close-up. Dust drifts through a shaft of low light, clearly visible at this speed. Super slow motion, poetic, the expression continuous and unbroken.",
  },
  {
    value: "dog_run",
    label: "Off the Lead",
    desc: "Play in the grass",
    category: "Portraits",
    icon: Dog,
    image: asset("v8.jpeg"),
    video: asset("v8.mp4"),
    prompt:
      "She lets the dog go and it bounds forward and rolls over in the grass, tail going, while she laughs and turns after a butterfly. The camera follows loosely at their height, handheld and easy. Late golden light across the field, long soft shadows. Joyful and natural, faces and coat markings staying exactly as they are.",
  },

  // ── Nature ────────────────────────────────────────────────────────────────
  {
    value: "wave_crash",
    label: "Wave on Rock",
    desc: "Slow-motion impact",
    category: "Nature",
    icon: Waves,
    image: asset("s6.jpeg"),
    video: asset("s6.mp4"),
    prompt:
      "The wave hits the cliff and explodes upward into white foam, the spray breaking apart into thousands of separate droplets that hang and then fall. The camera holds wide and steady, letting the water fill the frame. Low sun behind the spray turns every droplet into a point of light against the dark rock. Slow motion, powerful, elemental.",
  },
  {
    value: "forest_hop",
    label: "Forest Dash",
    desc: "Low tracking chase",
    category: "Nature",
    icon: Rabbit,
    image: asset("s7.jpeg"),
    video: asset("s7.mp4"),
    prompt:
      "The rabbit hops through the undergrowth, pauses with its ears twitching, then bolts — weaving between stems as the camera chases it. The camera stays low, at the animal's own height, moving with it. Sunlight comes through the canopy in shifting patches across the forest floor. Quick, alert, alive.",
  },

  // ── Time-lapse ────────────────────────────────────────────────────────────
  {
    value: "city_timelapse",
    label: "Crossing, Dusk to Dawn",
    desc: "Fixed-camera time-lapse",
    category: "Time-lapse",
    icon: Building2,
    image: asset("v1.jpeg"),
    video: asset("v1.mp4"),
    prompt:
      "Traffic and pedestrians blur into continuous light trails as the crossing runs from sunset through the dark of midnight and into pale dawn. The camera never moves and the buildings never shift — only the light does: windows coming on and going out, the sky sliding from blue to black to grey. Time-lapse, stable, hypnotic.",
  },
  {
    value: "bloom",
    label: "Bloom",
    desc: "A bud opening, time-lapse",
    category: "Time-lapse",
    icon: Flower2,
    image: asset("v2.jpeg"),
    video: asset("v2.mp4"),
    prompt:
      "The closed bud opens petal by petal until the flower stands fully open, the movement continuous and smooth with no jump or stutter anywhere in it. The camera holds a still close shot. Soft even light, the background falling away to nothing. Time-lapse, delicate, patient.",
  },
  {
    value: "star_arc",
    label: "Star Trails",
    desc: "Slow arc under moving stars",
    category: "Time-lapse",
    icon: Stars,
    image: asset("v3.jpeg"),
    video: asset("v3.mp4"),
    prompt:
      "The stars and the Milky Way wheel overhead at a visible pace, drawing long trails across the sky, while the tree stands motionless beneath them. The camera arcs around it extremely slowly. Ambient light on the ground shifts as the moon climbs. Time-lapse, vast, still.",
  },

  // ── Stylised ──────────────────────────────────────────────────────────────
  {
    value: "pixel_runner",
    label: "Side-Scroller",
    desc: "Retro platformer run",
    category: "Stylised",
    icon: Gamepad2,
    image: asset("s1.jpeg"),
    video: asset("s1.mp4"),
    prompt:
      "The character runs steadily to the right through one hand-painted level after another, never stopping and never turning back, with the bouncing rhythm of a platformer. The camera scrolls sideways to keep pace. Bright, flat retro pixel art with a game HUD across the top. Playful and relentlessly forward-moving.",
  },
  {
    value: "watercolor_fox",
    label: "Watercolour",
    desc: "Painted, in soft focus",
    category: "Stylised",
    icon: Brush,
    image: asset("s8.jpeg"),
    video: asset("s8.mp4"),
    prompt:
      "The fox turns its head slowly and settles, and the dew on the leaves around it shimmers as it moves. The camera creeps in toward its eyes. Everything is rendered as watercolour — soft brushstrokes, colours bleeding into one another, mist between the trees. Quiet, painterly, gently alive.",
  },
  {
    value: "astronaut_drift",
    label: "First Contact",
    desc: "Light ripples from a touch",
    category: "Stylised",
    icon: Rocket,
    image: asset("v7.jpeg"),
    video: asset("v7.mp4"),
    prompt:
      "The astronaut reaches out and touches the mushroom, and rings of light ripple outward through the whole cluster in response, one after another. The camera pushes in slowly on the point of contact. The glow is the only real light source, throwing colour up onto the visor and the suit. Otherworldly, hushed, wondrous.",
  },
];

/**
 * Every template, plus the "write your own" card that leads the list.
 *
 * ⚠️ CUSTOM IS FIRST AND IT IS THE DEFAULT. An untouched composer must not
 * arrive with somebody else's words already in the box and somebody else's photo
 * already selected. It carries no `image` and no `video` on purpose: the card's
 * icon ground is the designed state for "there is no picture of this".
 */
export const VIDEO_EFFECT_TEMPLATES = [
  {
    value: CUSTOM_EFFECT,
    label: "Write your own",
    desc: "Describe the motion yourself",
    category: null,
    icon: Wand2,
  },
  ...CATEGORY_ORDER.flatMap((category) =>
    CATALOG.filter((template) => template.category === category),
  ),
];

/** One template by its value, or null. */
export const templateByValue = (value) =>
  VIDEO_EFFECT_TEMPLATES.find((template) => template.value === value) || null;

/**
 * The words a template seeds into the prompt box — "" for the custom card.
 * Used by the config's `promptFrom` wiring.
 */
export const effectPrompt = (value) => templateByValue(value)?.prompt || "";

/**
 * The still a template selects as the tool's source image — "" for the custom
 * card, which must leave whatever the user already picked alone. Used by the
 * config's `imageFrom` wiring.
 */
export const effectImage = (value) => templateByValue(value)?.image || "";

// ── Drift check ──────────────────────────────────────────────────────────────
// A category on an entry that CATEGORY_ORDER doesn't list would silently drop
// that template from the picker — VIDEO_EFFECT_TEMPLATES is built by walking the
// order, so anything outside it is filtered away with no error. Dev-only.
if (process.env.NODE_ENV !== "production") {
  const known = new Set(CATEGORY_ORDER);
  const orphans = CATALOG.filter((template) => !known.has(template.category));
  if (orphans.length > 0) {
    console.warn(
      `⚠️ [magic-studio] video templates with an unlisted category: ${orphans
        .map((template) => template.value)
        .join(", ")} — add it to CATEGORY_ORDER in videoEffectTemplates.js`,
    );
  }
}
