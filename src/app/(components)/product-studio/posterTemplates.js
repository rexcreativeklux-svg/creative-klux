/**
 * POSTER_TEMPLATES — the layout catalog behind the Product Poster tool.
 *
 * Product Poster turns a plain packshot into an advertising poster: the product
 * plus a scene, an atmosphere and room for promotional copy. A template here is
 * one poster LOOK — picking it fills the prompt box with that look's
 * description, and the user edits from there.
 *
 * Because these are posters rather than plain scenes, every prompt names where
 * the headline goes. A generated poster with the product dead-centre and no
 * clear space for text is a poster the user cannot actually use, so "leave
 * empty space at the top for a headline" is part of the look, not a detail.
 *
 * Thumbnails are PINNED Pexels ids, and the three silent-failure traps
 * (wrong extension, dead id, slug filename) are documented at the top of
 * reshapingTemplates.js — read that before adding entries. Every id below was
 * fetched and visually reviewed, and each prompt was written against the photo
 * it sits on.
 *
 * Photos are Pexels (free commercial license, no attribution required).
 */

/** Tabs in the "See all" browser. "All" shows the whole catalog. */
export const POSTER_CATEGORIES = [
  "All",
  "Bold",
  "Minimal",
  "Luxury",
  "Sale",
  "Festive",
  "Tech",
  "Beauty",
];

export const POSTER_TEMPLATES = [
  // ── Bold — saturated colour and movement, for loud campaigns ─────────────
  {
    id: "crimson_satin",
    name: "Crimson Satin",
    category: "Bold",
    pexelsId: 9656152,
    prompt:
      "An advertising poster with the product centered against a deep crimson background, glossy pink and orange satin ribbons sweeping in behind it and catching a bright highlight, dramatic glowing rim light on the product, bold empty space above for a large headline, high-impact campaign poster, photorealistic.",
  },
  {
    id: "grain_sunset",
    name: "Grain Sunset",
    category: "Bold",
    pexelsId: 24509321,
    prompt:
      "An advertising poster with the product against grainy risograph-style arcs of coral, amber and deep indigo sweeping across the frame, heavy print grain texture, warm retro sunset palette, the product crisp against the soft textured ground, clear space in the upper third for a headline, retro-modern campaign poster, photorealistic.",
  },
  {
    id: "motion_blur",
    name: "Motion Blur",
    category: "Bold",
    pexelsId: 20120124,
    prompt:
      "An advertising poster with the product sharp against long-exposure sweeps of marigold, cyan and white streaking diagonally behind it, strong sense of speed and motion, vivid complementary colours, the product held perfectly still at the centre, open space at the bottom for promotional copy, energetic campaign poster, photorealistic.",
  },
  {
    id: "angular_planes",
    name: "Angular Planes",
    category: "Bold",
    pexelsId: 12961888,
    prompt:
      "An advertising poster with the product among intersecting translucent angular planes in dove grey, ochre and a hot coral accent, soft three-dimensional shading and clean edges, contemporary set-design look, the product framed by the planes with clear space beside it for a headline, graphic campaign poster, photorealistic.",
  },

  // ── Minimal — quiet grounds that let the product and the type breathe ────
  {
    id: "pastel_bloom",
    name: "Pastel Bloom",
    category: "Minimal",
    pexelsId: 9656153,
    prompt:
      "An advertising poster with the product on a softly blurred background of overlapping blush, lilac and peach circles, gentle out-of-focus gradients, very soft diffused light, calm pastel palette, the product crisp and centred with generous quiet space above for a headline, understated lifestyle poster, photorealistic.",
  },
  {
    id: "cream_fold",
    name: "Cream Fold",
    category: "Minimal",
    pexelsId: 2268543,
    prompt:
      "An advertising poster with the product on an off-white ground crossed by a single taupe angular fold radiating from a point behind it, smooth matte surfaces, soft even light, restrained cream and greige palette, large areas of empty space for a headline and body copy, refined minimal poster, photorealistic.",
  },
  {
    id: "concrete_facade",
    name: "Concrete Facade",
    category: "Minimal",
    pexelsId: 34968620,
    prompt:
      "An advertising poster with the product against a pale grey ribbed concrete facade, two navy-rimmed porthole windows and a corrugated metal shutter forming a clean geometric composition behind it, flat overcast daylight, architectural stillness, wide empty wall space for a headline, modern minimal poster, photorealistic.",
  },
  {
    id: "gallery_frame",
    name: "Gallery Frame",
    category: "Minimal",
    pexelsId: 15585620,
    ext: "png",
    prompt:
      "An advertising poster presented as a slim walnut picture frame with a wide white mount leaning against an off-white wall, the product displayed inside the frame, a soft shadow beneath, warm gallery lighting, quiet and premium, room inside the mount for a short headline, art-print style poster, photorealistic.",
  },

  // ── Luxury — dark grounds, metal and light for premium positioning ───────
  {
    id: "black_gold_marble",
    name: "Black Gold Marble",
    category: "Luxury",
    pexelsId: 11285437,
    ext: "png",
    prompt:
      "An advertising poster with the product on black marble shot through with copper and gold veining, a single soft spotlight raking across the polished stone, deep shadows and warm metallic glints, dramatic dark luxury palette, empty dark space above for elegant serif copy, premium campaign poster, photorealistic.",
  },
  {
    id: "floating_gold",
    name: "Floating Gold",
    category: "Luxury",
    pexelsId: 9977650,
    prompt:
      "An advertising poster with the product suspended in a warm bronze haze surrounded by polished gold cubes floating at different depths, soft golden light and gentle reflections, dreamlike weightless composition, rich amber and brass palette, clear space in the lower half for a headline, premium campaign poster, photorealistic.",
  },
  {
    id: "champagne_star",
    name: "Champagne Star",
    category: "Luxury",
    pexelsId: 2268538,
    prompt:
      "An advertising poster with the product at the centre of a champagne satin eight-point starburst radiating outward across an ivory ground, smooth silky gradients and fine radiating lines, soft glowing light, elegant cream and gold palette, symmetrical composition with space at the base for copy, luxury campaign poster, photorealistic.",
  },
  {
    id: "ember_streak",
    name: "Ember Streak",
    category: "Luxury",
    pexelsId: 36487456,
    prompt:
      "An advertising poster with the product silhouetted against a dark plum and slate background split by a single vertical incandescent orange light streak, dramatic glow and long vertical motion blur, moody high-contrast palette, the product edge-lit by the streak, generous dark space for a headline, cinematic luxury poster, photorealistic.",
  },

  // ── Sale — high-energy promotional grounds ───────────────────────────────
  {
    id: "red_room",
    name: "Red Room",
    category: "Sale",
    pexelsId: 20003244,
    prompt:
      "An advertising poster with the product in a fully saturated scarlet room, red walls and a glossy red table filling the frame, a model in a cream knit top holding a bright orange paper shopping bag beside it, punchy even light, monochrome red palette with one orange accent, bold space for a large sale headline, promotional campaign poster, photorealistic.",
  },
  {
    id: "bold_red_still_life",
    name: "Bold Red",
    category: "Sale",
    pexelsId: 19869755,
    prompt:
      "An advertising poster with the product staged on stacked jade-green cushions against a clean white sweep, bright red leather accessories arranged around it, crisp studio lighting with soft shadows, punchy red-and-green colour blocking, clear white space above for a headline, retail promotion poster, photorealistic.",
  },
  {
    id: "neon_script",
    name: "Neon Script",
    category: "Sale",
    pexelsId: 6091046,
    prompt:
      "An advertising poster with the product in front of a textured grey plaster wall lit by glowing pink neon script tubing, soft pink light spilling onto the wall and the product, urban night-time mood, grey and hot-pink palette, empty wall space beside the neon for a headline, modern promotional poster, photorealistic.",
  },
  {
    id: "amber_curve",
    name: "Amber Curve",
    category: "Sale",
    pexelsId: 33938628,
    prompt:
      "An advertising poster with the product against a glowing amber and tangerine folded paper curve sweeping through the frame, warm gradient light bleeding across the fold, rich orange monochrome palette, the product bright against the deepest part of the curve, open warm space for a bold headline, energetic promotional poster, photorealistic.",
  },

  // ── Festive — seasonal and celebration grounds ───────────────────────────
  {
    id: "bauble_frame",
    name: "Bauble Frame",
    category: "Festive",
    pexelsId: 19507868,
    prompt:
      "An advertising poster with the product centred on a white ground framed by clusters of gold and silver Christmas baubles at the edges, rose-gold confetti flecks scattered across the surface, bright even light with crisp small shadows, festive metallic palette, the whole middle left open for a headline, seasonal campaign poster, photorealistic.",
  },
  {
    id: "gold_glitter",
    name: "Gold Glitter",
    category: "Festive",
    pexelsId: 9524448,
    prompt:
      "An advertising poster with the product on a soft pink surface beside three gold glitter baubles, the rear ones falling out of focus, warm sparkling highlights across the glitter, shallow depth of field, pink and gold party palette, soft space above for a short headline, celebratory seasonal poster, photorealistic.",
  },
  {
    id: "confetti_burst",
    name: "Confetti Burst",
    category: "Festive",
    pexelsId: 1594927,
    prompt:
      "An advertising poster with the product on a bright white paper surface strewn with multicoloured confetti slivers scattering outward, crisp overhead light with tiny sharp shadows, playful primary-colour palette against white, clean white space around the product for a headline, celebration campaign poster, photorealistic.",
  },
  {
    id: "gift_bows",
    name: "Gift Bows",
    category: "Festive",
    pexelsId: 19507872,
    prompt:
      "An advertising poster with the product on a white ground alongside gold and pink foil gift bows, long hard shadows of curling ribbon streaking across the surface and black confetti flecks scattered about, bright directional light, graphic gifting palette, clear white space for a headline, seasonal promotion poster, photorealistic.",
  },

  // ── Tech — engineered, glowing and precise ───────────────────────────────
  {
    id: "circuit_glow",
    name: "Circuit Glow",
    category: "Tech",
    pexelsId: 34023220,
    prompt:
      "An advertising poster with the product above an isometric field of dark metallic cubes threaded with glowing red-orange light streaks, precise repeating geometry receding into shadow, cool dark greys against hot light trails, the product rim-lit by the glow, dark space above for a headline, futuristic tech poster, photorealistic.",
  },
  {
    id: "sci_fi_panel",
    name: "Sci-Fi Panel",
    category: "Tech",
    pexelsId: 4549831,
    ext: "png",
    prompt:
      "An advertising poster with the product mounted on a machined white and teal sci-fi panel densely detailed with vents, plates and connectors, crisp clean studio light, cool white-and-cyan palette, the product presented like precision hardware, a clear plate area for a headline, engineered tech poster, photorealistic.",
  },
  {
    id: "iridescent_loop",
    name: "Iridescent Loop",
    category: "Tech",
    pexelsId: 9999717,
    prompt:
      "An advertising poster with the product beside a glassy iridescent twisted loop floating on a cobalt blue gradient, smooth three-dimensional shading with violet and teal colour shifts across the surface, soft studio reflections, saturated blue palette, open blue space for a headline, modern tech-brand poster, photorealistic.",
  },
  {
    id: "red_light_geometry",
    name: "Red Light Geometry",
    category: "Tech",
    pexelsId: 34769279,
    prompt:
      "An advertising poster with the product in a dusky mauve corridor where bronze polyhedra float in mid-air and a bar of red neon light runs through the scene, soft shadows and a strong red glow, moody magenta and bronze palette, the product catching the neon edge light, dark space for a headline, dramatic tech poster, photorealistic.",
  },

  // ── Beauty — colour, texture and skin-adjacent softness ─────────────────
  {
    id: "hot_pink",
    name: "Hot Pink",
    category: "Beauty",
    pexelsId: 3373725,
    prompt:
      "An advertising poster with the product laid diagonally on a fully saturated magenta seamless background, hard flat frontal light and a tight crisp shadow, glossy surfaces against the matte ground, single-colour hot pink palette, bold empty pink space for a headline, punchy beauty campaign poster, photorealistic.",
  },
  {
    id: "lip_swatches",
    name: "Lip Swatches",
    category: "Beauty",
    pexelsId: 3373741,
    prompt:
      "An advertising poster with the product on a blush pink ground alongside thick crimson and nude cream swatches smeared in clean horizontal strokes, applicators laid neatly at the edges, bright even light, tonal pink and red palette, tidy graphic layout with room for a headline, cosmetics campaign poster, photorealistic.",
  },
  {
    id: "pastel_marble",
    name: "Pastel Marble",
    category: "Beauty",
    pexelsId: 5112007,
    prompt:
      "An advertising poster with the product on pale marbled paper swirling in pink, lilac and mint, delicate feathered ink patterns filling the frame, soft diffused light, dreamy pastel palette, the product crisp against the soft swirls with light space for a headline, gentle beauty poster, photorealistic.",
  },
  {
    id: "dew_petal",
    name: "Dew Petal",
    category: "Beauty",
    pexelsId: 447193,
    prompt:
      "An advertising poster with the product nestled among wide pink lily petals beaded with fresh dew, deep green blades behind, soft natural daylight and delicate water droplets catching the light, fresh botanical pink-and-green palette, room above the bloom for a headline, natural beauty poster, photorealistic.",
  },
];

/** id → entry, so the picker can pull a template's prompt without a scan. */
export const POSTER_TEMPLATES_BY_ID = Object.fromEntries(
  POSTER_TEMPLATES.map((t) => [t.id, t]),
);
