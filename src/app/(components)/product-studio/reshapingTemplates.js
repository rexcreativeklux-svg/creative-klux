/**
 * RESHAPING_TEMPLATES — the scene catalog behind the Reshaping tool's template
 * picker.
 *
 * Reshaping drops the user's product into a real e-commerce scene. A template is
 * one ready-made scene look: picking it fills the prompt box with that scene's
 * description, and the user edits from there. The optional Scene Reference image
 * (see promptToolConfigs) rides ALONGSIDE the prompt — it never replaces it.
 *
 * Every thumbnail is a PINNED Pexels id rather than a runtime search, for the
 * reason spelled out at the top of stagingTemplates.js: each tile carries a
 * written prompt, and a prompt only means something if it describes the exact
 * photo above it. Read that file's header before adding entries here — the
 * `ext` rule and the "adding a template" checklist apply identically.
 *
 * ── Three ways a thumbnail can ship broken (all silent) ─────────────────────
 * An <img> that fails reports nothing, so a bad id is just an empty box with a
 * name under it. Guard all three:
 *   1. WRONG EXTENSION — most Pexels photos are `.jpeg`, some are `.png`, and
 *      asking for the wrong one 404s. Hence `ext` on the PNG entries below.
 *   2. DEAD ID — this CDN can answer 200 with a ~27-byte body instead of
 *      failing, so "the request succeeded" is not proof of an image.
 *   3. SLUG FILENAME — older photos are served as
 *      `<descriptive-slug>-<id>.jpeg`, NOT `pexels-photo-<id>.jpeg`. `pxsq()`
 *      only builds the latter, so those ids can never work here no matter what
 *      `ext` says. Id 162396 was dropped from this catalog for exactly that.
 * Every id below was fetched and visually reviewed before being written down,
 * and each prompt was written against the photo it sits on.
 *
 * Photos are Pexels (free commercial license, no attribution required).
 */

/** Tabs in the "See all" browser. "All" shows the whole catalog. */
export const RESHAPING_CATEGORIES = [
  "All",
  "Bathroom",
  "Kitchen",
  "Desk",
  "Outdoor",
  "Retail",
  "Luxury",
  "Minimal",
];

export const RESHAPING_TEMPLATES = [
  // ── Bathroom — vanities, basins and the surfaces beauty products live on ──
  {
    id: "warm_wood_vanity",
    name: "Warm Wood Vanity",
    category: "Bathroom",
    pexelsId: 35209393,
    prompt:
      "The product on a ribbed walnut vanity top against dark veined marble, a lit display niche and a pale ceramic vase of trailing greenery beside it, two lit pillar candles, folded linen towels on the shelf below, warm low-key light with deep soft shadows, intimate spa-hotel mood, premium product photography, photorealistic.",
  },
  {
    id: "classic_marble_vanity",
    name: "Classic Vanity",
    category: "Bathroom",
    pexelsId: 30369259,
    prompt:
      "The product on a white marble vanity counter in a bright classic bathroom, grey-veined marble wall behind, chrome sconces flanking a rounded rectangular mirror, white panelled cabinetry, clean daylight from a side window, crisp and airy, editorial interior product photography, photorealistic.",
  },
  {
    id: "serum_ledge",
    name: "Serum Ledge",
    category: "Bathroom",
    pexelsId: 39281882,
    prompt:
      "The product standing on a cream plaster ledge above a brass studded panel, a sculptural two-sphere stone lamp to one side and a white blossom branch in a ribbed glass vessel behind, warm diffused daylight, soft shadow under the product, refined modern skincare styling, premium product photography, photorealistic.",
  },
  {
    id: "dark_marble_basin",
    name: "Dark Marble Basin",
    category: "Bathroom",
    pexelsId: 29399425,
    prompt:
      "The product on a curved white floating shelf against a charcoal marble tile wall, a smooth white vessel basin and a slim copper tap nearby, even soft light, restrained architectural minimalism with strong dark-light contrast, premium product photography, photorealistic.",
  },

  // ── Kitchen — counters, tables and food-adjacent surfaces ─────────────────
  {
    id: "veined_marble_counter",
    name: "Veined Marble Counter",
    category: "Kitchen",
    pexelsId: 18185916,
    ext: "png",
    prompt:
      "The product on a cream and rust veined marble kitchen island beside a matte black gooseneck tap, ivory panelled cabinetry with slim gold trim behind, warm reflections in the polished stone, soft shallow depth of field, upscale kitchen mood, premium product photography, photorealistic.",
  },
  {
    id: "moody_kitchen_bar",
    name: "Moody Kitchen Bar",
    category: "Kitchen",
    pexelsId: 36573009,
    prompt:
      "The product on a dark stone kitchen bar top, a backlit textured stone backsplash and a slim linear light strip glowing behind it, glassware and a cream espresso machine further along the counter, deep shadows and warm pooled highlights, moody evening atmosphere, premium product photography, photorealistic.",
  },
  {
    id: "rustic_green_door",
    name: "Rustic Still Life",
    category: "Kitchen",
    pexelsId: 7397134,
    prompt:
      "The product on a crimson linen cloth in front of a chipped green painted wooden door, dark glass bottles and a striped kitchen towel arranged around it, an old iron key hanging above, painterly chiaroscuro lighting from one side, old-world still-life mood, fine-art product photography, photorealistic.",
  },
  {
    id: "kitchen_flat_lay",
    name: "Kitchen Flat Lay",
    category: "Kitchen",
    pexelsId: 16767580,
    prompt:
      "Overhead flat lay with the product on a mottled beige stone worktop, a pan of tomato sauce with basil leaves, a bamboo cutting board, a long wooden spoon and a glass of water arranged around it on a striped cloth, soft even daylight, warm homely food-styling mood, top-down product photography, photorealistic.",
  },

  // ── Desk — workspaces, tech and everyday-carry surfaces ───────────────────
  {
    id: "sunlit_wood_desk",
    name: "Sunlit Wood Desk",
    category: "Desk",
    pexelsId: 38986380,
    prompt:
      "The product on a warm walnut desk beside a slim wooden LED lamp casting a soft glow, a small potted grass plant and a cup of coloured pencils nearby, late afternoon sunlight raking across a pale wall with soft leaf shadows, calm focused workspace mood, natural-light product photography, photorealistic.",
  },
  {
    id: "bedside_tech",
    name: "Bedside Tech",
    category: "Desk",
    pexelsId: 4765366,
    prompt:
      "The product on a white lacquered side table with oak legs, a grey fabric notebook, a matte black power bank, white earbuds and a ceramic mug placed around it, a large fiddle-leaf fig leaning in from the left, cool even daylight, clean modern tech-lifestyle mood, product photography, photorealistic.",
  },
  {
    id: "creative_desk",
    name: "Creative Desk",
    category: "Desk",
    pexelsId: 4533076,
    prompt:
      "Overhead flat lay with the product on a white desk surface among a laptop, a slim black keyboard, a camera with a long lens, over-ear headphones and a magazine, monochrome black-and-white styling on a concrete floor, crisp even light, editorial creative-studio mood, top-down product photography, photorealistic.",
  },
  {
    id: "bright_white_desk",
    name: "Bright White Desk",
    category: "Desk",
    pexelsId: 211856,
    prompt:
      "Overhead flat lay with the product on a pure white desk beside a silver laptop, a terrazzo bowl of small orange blooms and a dark pineapple in the corner, generous empty white space around the product, bright shadowless studio light, fresh graphic minimalism, top-down product photography, photorealistic.",
  },

  // ── Outdoor — coastlines, stone and natural light ─────────────────────────
  {
    id: "coral_beach",
    name: "Coral Beach",
    category: "Outdoor",
    pexelsId: 9739236,
    prompt:
      "The product resting low among bleached white coral rubble on a tropical shore, turquoise sea and a white line of surf blurred behind it, hard bright midday sun with crisp shadows, saturated holiday colours, low camera angle, outdoor lifestyle product photography, photorealistic.",
  },
  {
    id: "pebble_cairn",
    name: "Pebble Cairn",
    category: "Outdoor",
    pexelsId: 26888383,
    prompt:
      "The product balanced on a smooth sun-warmed boulder beside a stack of flat grey river pebbles, softly blurred water and rocks behind, gentle natural daylight, calm meditative wellness mood with muted greys and sand tones, outdoor product photography, photorealistic.",
  },
  {
    id: "rocky_shore",
    name: "Rocky Shore",
    category: "Outdoor",
    pexelsId: 34099356,
    prompt:
      "The product set among pale limestone boulders at the waterline, damp sand and calm sea stretching away behind, warm low golden sunlight raking across the rough stone texture, rugged natural mood, outdoor product photography, photorealistic.",
  },
  {
    id: "shoreline_foam",
    name: "Shoreline Foam",
    category: "Outdoor",
    pexelsId: 13722131,
    prompt:
      "The product on wet golden sand at the very edge of the water, a thin line of white foam and soft teal shallows directly behind it, extreme low camera angle with dreamy shallow depth of field, warm hazy light, serene summer mood, outdoor product photography, photorealistic.",
  },

  // ── Retail — shelves, displays and shop interiors ─────────────────────────
  {
    id: "backlit_retail_wall",
    name: "Backlit Retail Wall",
    category: "Retail",
    pexelsId: 27781696,
    prompt:
      "The product on a backlit peach-glowing display shelf in a dark-framed retail wall unit, rows of matching amber bottles and cartons on the shelves around it, herringbone oak flooring below, warm even shelf lighting against a deep charcoal wall, calm premium boutique mood, retail product photography, photorealistic.",
  },
  {
    id: "apothecary_shelves",
    name: "Apothecary Shelves",
    category: "Retail",
    pexelsId: 39004038,
    prompt:
      "The product on a pale timber shelf in a floor-to-ceiling apothecary shelving wall, amber dropper bottles and kraft cartons ranged neatly beside it, concrete pendant lamps hanging above and curved wooden stools below, soft warm daylight, natural minimal store mood, retail product photography, photorealistic.",
  },
  {
    id: "boutique_shelf",
    name: "Boutique Shelf",
    category: "Retail",
    pexelsId: 4255717,
    prompt:
      "The product on a black metal and dark timber shelving unit against wooden shutters, a glass terrarium, a green ceramic jug, a wire script sign and a small letterboard arranged nearby, a potted palm leaning in, warm dim interior light, cosy concept-store mood, lifestyle product photography, photorealistic.",
  },
  {
    id: "concept_store",
    name: "Concept Store",
    category: "Retail",
    pexelsId: 6606355,
    prompt:
      "The product on a wooden display table in an industrial black steel and glass concept store, framed prints and hanging plants on the wall behind, an upright piano to one side and packaged goods ranged along the table, bright natural daylight, curated independent-shop mood, retail product photography, photorealistic.",
  },

  // ── Luxury — satin, silk and precious-material close-ups ──────────────────
  {
    id: "gold_on_satin",
    name: "Gold on Satin",
    category: "Luxury",
    pexelsId: 19644200,
    prompt:
      "The product resting in soft folds of champagne satin, warm sunlight glancing across the fabric and catching the product's edges, extreme close-up with shallow depth of field, rich gold and cream tones, opulent understated luxury, premium product photography, photorealistic.",
  },
  {
    id: "ivory_folds",
    name: "Ivory Folds",
    category: "Luxury",
    pexelsId: 30550128,
    prompt:
      "The product nestled among sculptural ivory fabric folds, matte creamy surface filling the frame behind it, soft raking light picking out every crease, tonal cream-on-cream palette, quiet editorial luxury, premium product photography, photorealistic.",
  },
  {
    id: "silk_shadow",
    name: "Silk Shadow",
    category: "Luxury",
    pexelsId: 8850650,
    prompt:
      "The product on crumpled cream silk with long soft grey shadows falling across the fabric, muted warm neutral palette, gentle directional light from one side, restrained quiet-luxury mood, fine-art product photography, photorealistic.",
  },
  {
    id: "cream_jar_silk",
    name: "Cream on Silk",
    category: "Luxury",
    pexelsId: 19644201,
    prompt:
      "The product lying on smooth ivory satin, a mirror-polished metallic detail catching the light, soft even daylight with delicate fabric shadows, clean white and silver beauty palette, elegant skincare styling, premium product photography, photorealistic.",
  },

  // ── Minimal — plain seamless studio grounds with room for the product ─────
  {
    id: "overhead_beige",
    name: "Overhead Beige",
    category: "Minimal",
    pexelsId: 13779102,
    prompt:
      "Top-down view of the product lying on a soft beige seamless background, its lid set beside it and a couple of small capsules spilling out, a long soft shadow stretching to one side, warm neutral palette and generous empty space, clean supplement-brand styling, product photography, photorealistic.",
  },
  {
    id: "beige_studio",
    name: "Beige Studio",
    category: "Minimal",
    pexelsId: 13779113,
    prompt:
      "The product centered on a warm beige seamless studio background, smooth tonal gradient behind it and a gentle shadow pooling at its base, soft even light, plenty of copy space around the product, clean packaging-shot minimalism, product photography, photorealistic.",
  },
  {
    id: "kraft_and_glass",
    name: "Kraft & Glass",
    category: "Minimal",
    pexelsId: 13787561,
    prompt:
      "The product on a plain white seamless surface beside a kraft paper tube with a blank circular label and a clear glass jar of capsules, flat even studio lighting with barely any shadow, natural white and brown-paper palette, honest packaging-led styling, product photography, photorealistic.",
  },
  {
    id: "blank_label",
    name: "Blank Label",
    category: "Minimal",
    pexelsId: 14029290,
    prompt:
      "The product on a bright white seamless background with a few deep red gummy sweets scattered at its base, crisp soft shadow to one side, clean high-key studio lighting, simple white-and-red palette, straightforward e-commerce packshot styling, product photography, photorealistic.",
  },
];

/** id → entry, so the picker can pull a template's prompt without a scan. */
export const RESHAPING_TEMPLATES_BY_ID = Object.fromEntries(
  RESHAPING_TEMPLATES.map((t) => [t.id, t]),
);
