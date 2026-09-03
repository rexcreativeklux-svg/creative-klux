/**
 * POD_TEMPLATES — the pattern catalog behind the AI POD (print-on-demand) tool.
 *
 * AI POD prints a pattern ONTO the user's product: the generated artwork has to
 * wrap the garment or object convincingly, following its material, folds,
 * lighting and perspective. So unlike the other two catalogs, a template here
 * describes ARTWORK rather than a scene, and every prompt ends by asking for the
 * print to sit on the product's real surface rather than float above it —
 * otherwise the result reads as a flat sticker pasted on a photo.
 *
 * Picking a template fills the prompt box with that pattern's description; the
 * user edits from there. The optional Reference Pattern image (see
 * promptToolConfigs) rides ALONGSIDE the prompt — it never replaces it.
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
export const POD_CATEGORIES = [
  "All",
  "Floral",
  "Geometric",
  "Abstract",
  "Vintage",
  "Streetwear",
  "Nature",
  "Typography",
];

/**
 * Appended to every template prompt. The single most common POD failure is a
 * pattern that looks pasted on, so this is stated once here rather than
 * retyped (and eventually forgotten) in twenty-eight prompts.
 */
export const POD_SURFACE_INSTRUCTION =
  "Print this pattern onto the product itself, following the shape, folds, seams and curvature of its surface, matching the product's existing lighting, shadows and perspective so the print looks genuinely manufactured into the material rather than pasted on top.";

export const POD_TEMPLATES = [
  // ── Floral — botanical prints ────────────────────────────────────────────
  {
    id: "scattered_petals",
    name: "Scattered Petals",
    category: "Floral",
    pexelsId: 8079590,
    prompt:
      "A scattered floral print of magenta, coral and orange bougainvillea bracts spaced evenly across a clean off-white ground, each bloom crisp and flat-lit with its own small soft shadow, airy and open with plenty of background showing between the flowers, fresh summer botanical pattern.",
  },
  {
    id: "pressed_botanicals",
    name: "Pressed Botanicals",
    category: "Floral",
    pexelsId: 20868516,
    prompt:
      "A dense pressed-flower collage print of overlapping brown skeleton leaves, golden dried blossoms and translucent petals packed edge to edge, warm sepia and amber palette with fine visible veining, soft diffused light, vintage herbarium pattern.",
  },
  {
    id: "heather_field",
    name: "Heather Field",
    category: "Floral",
    pexelsId: 3875111,
    prompt:
      "An all-over print of dense dark green foliage scattered with tiny bright pink heather blooms, deep shadowed background between the leaves making the flowers glow, rich contrast, moody botanical pattern with fine detail.",
  },
  {
    id: "deep_green_leaves",
    name: "Deep Green Leaves",
    category: "Floral",
    pexelsId: 10611115,
    prompt:
      "An all-over print of glossy deep-green rounded leaves overlapping in layers, soft highlights along the leaf veins and darker green shadows between them, saturated emerald palette, lush tropical foliage pattern.",
  },

  // ── Geometric — repeats, grids and kaleidoscopes ─────────────────────────
  {
    id: "kaleidoscope_triangles",
    name: "Kaleidoscope Triangles",
    category: "Geometric",
    pexelsId: 2157884,
    prompt:
      "A symmetrical kaleidoscopic print of interlocking triangles and stepped bars in teal, steel blue and cream, thin burnt-orange outlines separating the shapes against a near-black ground, precise mirrored repeat, bold retro geometric pattern.",
  },
  {
    id: "teal_hexagon",
    name: "Teal Hexagon",
    category: "Geometric",
    pexelsId: 2268540,
    prompt:
      "A tiled print of large hexagonal medallions on a deep teal ground, each ringed with black dots and pale cream chevrons radiating from a small central star, precise repeating tessellation, ornate geometric pattern.",
  },
  {
    id: "star_grid",
    name: "Star Grid",
    category: "Geometric",
    pexelsId: 16276175,
    prompt:
      "A fine repeating grid of small navy asterisk stars evenly spaced across a smooth sky-blue gradient that lightens toward the top, delicate line weight and generous space between motifs, clean minimal geometric pattern.",
  },
  {
    id: "concentric_arcs",
    name: "Concentric Arcs",
    category: "Geometric",
    pexelsId: 2157895,
    prompt:
      "A print of broad concentric arcs sweeping across the frame in cerulean blue, white and deep maroon, smooth painterly banding with subtle grain, bold curved rainbow-stripe repeat, striking retro geometric pattern.",
  },

  // ── Abstract — paint, ink and marbling ───────────────────────────────────
  {
    id: "painted_strokes",
    name: "Painted Strokes",
    category: "Abstract",
    pexelsId: 3590683,
    prompt:
      "An abstract print of thick horizontal brushstrokes in tangerine, cobalt, violet and gold dragged across a white canvas, visible bristle marks, dry-brush gaps and raw canvas weave showing through, energetic expressive painted pattern.",
  },
  {
    id: "ink_and_gold",
    name: "Ink & Gold",
    category: "Abstract",
    pexelsId: 5506217,
    prompt:
      "An abstract print of an indigo alcohol-ink bloom spreading across textured white paper, soft feathered edges, pooling darker cores and scattered metallic gold flecks and droplets, generous white space around the bloom, elegant fluid-art pattern.",
  },
  {
    id: "marbled_pastel",
    name: "Marbled Pastel",
    category: "Abstract",
    pexelsId: 4391611,
    prompt:
      "An abstract marbled print swirling in pink, turquoise, lilac and lemon with white channels running between the colours, soft feathered blending and fine speckling, dreamy pastel palette, suminagashi marbling pattern.",
  },
  {
    id: "acrylic_swirl",
    name: "Acrylic Swirl",
    category: "Abstract",
    pexelsId: 5109755,
    prompt:
      "An abstract print of tight concentric rings of oxblood, slate blue, cream and black rippling outward from an off-centre core, glossy poured-acrylic texture with fine cell detail, rich moody palette, fluid-pour pattern.",
  },

  // ── Vintage — heritage ornament and aged surfaces ────────────────────────
  {
    id: "ink_on_kraft",
    name: "Ink on Kraft",
    category: "Vintage",
    pexelsId: 19582307,
    prompt:
      "A print of a single bold black dry-brush ink mark sitting on creased kraft paper, visible bristle streaks and dragged edges, warm brown paper texture with soft fold lines, restrained sumi-e ink pattern with lots of empty paper.",
  },
  {
    id: "wood_mandala",
    name: "Wood Mandala",
    category: "Vintage",
    pexelsId: 2158428,
    prompt:
      "A symmetrical mandala print built from walnut wood grain, concentric rings of chocolate, tan and honey radiating from a small central rosette into a star-shaped border, warm monochrome brown palette, ornate marquetry pattern.",
  },
  {
    id: "azulejo_tile",
    name: "Azulejo Tile",
    category: "Vintage",
    pexelsId: 5438789,
    prompt:
      "A hand-painted ceramic tile print in cobalt blue, emerald green, gold and white, repeating sunburst medallions and curling scrollwork with visible glaze brushwork and slight irregularity, rich saturated Portuguese azulejo pattern.",
  },
  {
    id: "plaster_rosette",
    name: "Plaster Rosette",
    category: "Vintage",
    pexelsId: 11033316,
    prompt:
      "A tonal print of ornate white plaster relief — a central acanthus ceiling rosette ringed with beaded mouldings and corner medallions — soft raking light picking out the carved depth, cream-on-cream palette, neoclassical architectural pattern.",
  },

  // ── Streetwear — murals, spray and painted walls ─────────────────────────
  {
    id: "shutter_mural",
    name: "Shutter Mural",
    category: "Streetwear",
    pexelsId: 29184089,
    prompt:
      "A cartoon street-art print of a melting ice cream cone dripping between fluffy clouds with falling raindrops, bold black outlines and flat fills in cyan, white, red and orange over horizontal shutter ribbing, playful graffiti mural pattern.",
  },
  {
    id: "mural_portrait",
    name: "Mural Portrait",
    category: "Streetwear",
    pexelsId: 2122520,
    prompt:
      "A large painted mural-style print of a stylised face in soft peach and pink tones with a bright teal brushstroke across one cheek, clean airbrushed gradients and confident line work, contemporary street-art portrait pattern.",
  },
  {
    id: "spray_grid",
    name: "Spray Grid",
    category: "Streetwear",
    pexelsId: 25036937,
    prompt:
      "A print of magenta and coral spray paint blasted over a grid of slate-blue blocks and mustard bars on rough plaster, soft overspray halos, drips and visible wall texture, raw urban graffiti pattern.",
  },
  {
    id: "painted_concrete",
    name: "Painted Concrete",
    category: "Streetwear",
    pexelsId: 1694980,
    prompt:
      "A print of overlapping blocks of blush pink, dove grey, pale blue and white roller paint on weathered concrete, hard rectangular edges with slight bleed and visible surface pitting, muted urban colour-block pattern.",
  },

  // ── Nature — landscape and elemental prints ──────────────────────────────
  {
    id: "misty_peaks",
    name: "Misty Peaks",
    category: "Nature",
    pexelsId: 4780731,
    prompt:
      "A print of layered mountain ridges receding into blue-grey haze, each range paler than the one in front, pale sky above and dark scree in the foreground, cool tonal blue palette, minimal atmospheric landscape artwork.",
  },
  {
    id: "cloud_forest",
    name: "Cloud Forest",
    category: "Nature",
    pexelsId: 10008613,
    prompt:
      "A print of dense forested mountain slopes half swallowed by low white cloud, dark evergreen ridges cutting diagonally across the frame, muted green and grey palette, moody atmospheric landscape artwork.",
  },
  {
    id: "ocean_foam",
    name: "Ocean Foam",
    category: "Nature",
    pexelsId: 26744963,
    prompt:
      "A print of deep sapphire ocean water crossed by lacework trails of white foam, viewed from directly above, rippling surface texture and turquoise shallows breaking through, saturated blue-and-white palette, aerial seascape artwork.",
  },
  {
    id: "lone_tree_ridge",
    name: "Lone Tree Ridge",
    category: "Nature",
    pexelsId: 29252535,
    prompt:
      "A print of a snow-dusted rock ridge under a deep teal sky with a single bare silhouetted tree standing against it, warm golden light on the stone and cool shadow below, high-contrast alpine palette, dramatic landscape artwork.",
  },

  // ── Typography — letterform-led prints ───────────────────────────────────
  {
    id: "letterform_3d",
    name: "3D Letterform",
    category: "Typography",
    pexelsId: 11300439,
    prompt:
      "A typographic print of a single bold extruded three-dimensional letterform in matte white standing on a soft grey ground, gentle gradient shading across its faces and a soft shadow behind, sculptural minimal type artwork with lots of empty space.",
  },
  {
    id: "reclaimed_letters",
    name: "Reclaimed Letters",
    category: "Typography",
    pexelsId: 34935972,
    prompt:
      "A typographic print of weathered reclaimed timber letters and numerals in chipped teal, red and bare wood, stacked and leaning at different angles with visible grain and flaking paint, warm rustic salvage-yard type artwork.",
  },
  {
    id: "cut_paper_type",
    name: "Cut Paper Type",
    category: "Typography",
    pexelsId: 6288282,
    prompt:
      "A typographic print of bold mint-green cut-paper letters laid on a deep teal-blue textured ground, slightly uneven hand-cut edges and small soft paper shadows, flat graphic two-colour type artwork.",
  },
  {
    id: "letterpress",
    name: "Letterpress",
    category: "Typography",
    pexelsId: 4140908,
    prompt:
      "A typographic print in a vintage letterpress style — engraved metal and wooden type blocks, deeply impressed inky letterforms and ornamental borders against aged paper, warm brown and charcoal palette, traditional printshop type artwork.",
  },
];

/** id → entry, so the picker can pull a template's prompt without a scan. */
export const POD_TEMPLATES_BY_ID = Object.fromEntries(
  POD_TEMPLATES.map((t) => [t.id, t]),
);
