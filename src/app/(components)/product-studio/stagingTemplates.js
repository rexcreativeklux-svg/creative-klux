/**
 * STAGING_TEMPLATES — the scene catalog behind Product Staging's template
 * picker.
 *
 * A template is a ready-made product-scene look. Picking one fills the prompt
 * box with its `prompt` — the scene description that tells the generator where
 * to place the product — and the user can edit it freely from there.
 *
 * ── Why the thumbnails are PINNED Pexels ids ────────────────────────────────
 * The Video Generator's shelf SEARCHES Pexels at runtime, which is right for it:
 * any clip that matches "elegant dress" is a fine motion template. Staging can't
 * work that way — each tile also carries a written prompt, and a prompt only
 * means anything if it describes the exact photo above it. A search result that
 * reshuffles every session would drift away from its own description.
 *
 * So every entry pins one reviewed photo by id. `pxsq(pexelsId)` builds the
 * thumbnail URL from it (see constants.js) — no fetch, no API quota, no
 * loading state, and the picker renders identically offline. The prompt for
 * each was written against that specific photo.
 *
 * ── Adding a template ───────────────────────────────────────────────────────
 * 1. Find a photo on Pexels and note its numeric id.
 * 2. Add an entry with a unique `id`, a `category` from STAGING_CATEGORIES,
 *    and a `prompt` that describes THAT photo's surface, light and mood.
 * It appears in the row and the "See all" browser automatically.
 *
 * Photos are Pexels (free commercial license, no attribution required, stable
 * hotlinkable CDN URLs) — the same source the app already uses for the video
 * templates and the Virtual Model backgrounds.
 */

/** Tabs in the "See all" browser. "All" shows the whole catalog. */
export const STAGING_CATEGORIES = [
  "All",
  "Studio",
  "Luxury",
  "Nature",
  "Kitchen",
  "Lifestyle",
  "Bold",
  "Fresh",
  "Seasonal",
  "Beach",
];

export const STAGING_TEMPLATES = [
  // ── Studio — seamless backdrops, podiums and pure light ──────────────────
  {
    id: "arch_podium",
    name: "Arch Podium",
    category: "Studio",
    pexelsId: 7911758,
    prompt:
      "The product centered on a rounded cream pedestal in front of a sculpted beige archway, seamless sand-toned backdrop, soft diffused studio light with a gentle shadow pooling at the base, calm minimal gallery mood, premium product photography, photorealistic.",
  },
  {
    id: "stepped_podium",
    name: "Stepped Podium",
    category: "Studio",
    pexelsId: 36339062,
    prompt:
      "The product resting on a stack of white stepped stone platforms, a slender dried blossom branch arcing behind it, soft off-white seamless background, gentle directional light and a delicate shadow, refined minimal skincare aesthetic, premium product photography, photorealistic.",
  },
  {
    id: "pastel_blocks",
    name: "Pastel Blocks",
    category: "Studio",
    pexelsId: 32032943,
    prompt:
      "The product displayed among pastel blue and pink geometric blocks — cubes, a cone and a small yellow sphere — on a soft blue studio backdrop, even bright lighting with clean soft shadows, playful modern set-design look, editorial product photography, photorealistic.",
  },
  {
    id: "hard_light",
    name: "Hard Light",
    category: "Studio",
    pexelsId: 19117855,
    prompt:
      "The product on a smooth off-white surface cut by a hard diagonal beam of window light, crisp geometric shadow falling across the frame, bright airy minimalism with strong contrast, modern beauty product photography, photorealistic.",
  },
  {
    id: "sunlit_wall",
    name: "Sunlit Wall",
    category: "Studio",
    pexelsId: 38986382,
    prompt:
      "The product standing on a warm wooden ledge against a plain sunlit wall, strong afternoon sunbeam raking across the surface and casting a long crisp shadow, quiet architectural minimalism, natural-light product photography, photorealistic.",
  },
  {
    id: "fern_shadow",
    name: "Fern Shadow",
    category: "Studio",
    pexelsId: 7941793,
    prompt:
      "The product on a pale grey seamless surface beside a single fern frond, its fine feathered shadow stretching across the backdrop, soft cool daylight, serene minimal composition with lots of negative space, fine-art product photography, photorealistic.",
  },
  {
    id: "color_ledge",
    name: "Color Ledge",
    category: "Studio",
    pexelsId: 35976902,
    prompt:
      "The product placed on a clean white geometric ledge with a bold violet ribbon of color sweeping through the frame behind it, bright even studio lighting, crisp shadow under the product, contemporary graphic beauty campaign look, photorealistic.",
  },
  {
    id: "concrete_slab",
    name: "Concrete Slab",
    category: "Studio",
    pexelsId: 11255123,
    prompt:
      "The product sitting on a raw grey concrete slab, matching concrete wall behind it, soft overcast light with a low contact shadow, cool industrial minimalism, understated premium product photography, photorealistic.",
  },
  {
    id: "glass_minimal",
    name: "Clear Minimal",
    category: "Studio",
    pexelsId: 31561395,
    prompt:
      "The product on a pure white surface beside slender clear glassware, bright shadowless studio lighting, an airy high-key composition with plenty of empty space around the product, clean catalogue product photography, photorealistic.",
  },

  // ── Luxury — marble, gold, deep tones and spotlights ──────────────────────
  {
    id: "marble_gallery",
    name: "Marble Gallery",
    category: "Luxury",
    pexelsId: 26509874,
    prompt:
      "The product on a low round white marble plinth in a bright gallery space with veined marble walls, soft diffused daylight, elegant restrained composition with a subtle reflection on the polished floor, high-end product photography, photorealistic.",
  },
  {
    id: "marble_luxe",
    name: "Marble Luxe",
    category: "Luxury",
    pexelsId: 26593542,
    prompt:
      "The product presented on a slim brass-framed stand atop a pale marble pedestal, softly lit marble backdrop, warm gold accents against cool grey veining, refined luxury boutique styling, high-end product photography, photorealistic.",
  },
  {
    id: "gold_fluted",
    name: "Gold & Fluted Glass",
    category: "Luxury",
    pexelsId: 16722501,
    prompt:
      "The product on a glossy white surface beside fluted ribbed glass and polished gold cylinders, a soft round mirror catching a reflection behind it, warm golden highlights on a bright neutral background, opulent perfume-campaign styling, photorealistic.",
  },
  {
    id: "amber_spotlight",
    name: "Amber Spotlight",
    category: "Luxury",
    pexelsId: 36339051,
    prompt:
      "The product elevated on a dark matte plinth under a single warm amber spotlight, deep brown-to-black gradient background, dramatic falloff with a soft glow behind the silhouette, moody premium fragrance advertising, photorealistic.",
  },
  {
    id: "gemstone_slab",
    name: "Gemstone Slab",
    category: "Luxury",
    pexelsId: 38684712,
    prompt:
      "The product resting on a rough natural stone slab beside an iridescent labradorite gemstone, warm sand-toned background scattered with tiny pearls, soft directional light picking up the mineral sheen, earthy luxury styling, photorealistic.",
  },
  {
    id: "crimson_bottle",
    name: "Crimson Dark",
    category: "Luxury",
    pexelsId: 18904411,
    prompt:
      "The product standing in a pool of deep crimson light against an almost-black background, rich red rim light tracing its edges, heavy cinematic shadow, bold dramatic premium advertising, photorealistic.",
  },
  {
    id: "lavender_marble",
    name: "Lavender Marble",
    category: "Luxury",
    pexelsId: 27433872,
    prompt:
      "The product on a cream marble surface surrounded by fresh lavender sprigs, dried chamomile and a small ceramic cup, soft natural window light, calm spa-like elegance in muted purple and ivory tones, lifestyle product photography, photorealistic.",
  },
  {
    id: "black_void",
    name: "Black Void",
    category: "Luxury",
    pexelsId: 28859429,
    prompt:
      "The product isolated against a pure black background, precise controlled lighting sculpting its edges and surface detail, no visible surface or horizon, striking high-contrast technical hero shot, photorealistic.",
  },
  {
    id: "gold_gift_set",
    name: "Gold Gift Set",
    category: "Luxury",
    pexelsId: 38821127,
    prompt:
      "The product presented in an open kraft-and-gold gift box on a warm champagne background scattered with small golden ornaments, soft even light, polished gifting-season presentation, premium packaging photography, photorealistic.",
  },

  // ── Nature — leaves, stone, botanicals and organic light ──────────────────
  {
    id: "golden_leaves",
    name: "Golden Leaves",
    category: "Nature",
    pexelsId: 29723780,
    prompt:
      "The product among broad green pothos leaves against a warm amber wall, low golden sunlight throwing soft leaf shadows behind it, glowing tropical warmth, organic lifestyle product photography, photorealistic.",
  },
  {
    id: "ochre_shadow",
    name: "Ochre Shadow",
    category: "Nature",
    pexelsId: 14317928,
    prompt:
      "The product on a textured ochre plaster wall surface with sunlit ivy casting sharp green shadows across it, strong warm daylight, mediterranean summer mood, natural-light product photography, photorealistic.",
  },
  {
    id: "palm_shadow",
    name: "Palm Shadow",
    category: "Nature",
    pexelsId: 7330788,
    prompt:
      "The product against a soft dusty-mauve wall with a large palm frond shadow falling diagonally across it, gentle warm sunlight, calm minimal tropical mood in muted tones, editorial product photography, photorealistic.",
  },
  {
    id: "tropical_silhouette",
    name: "Tropical Silhouette",
    category: "Nature",
    pexelsId: 37936133,
    prompt:
      "The product framed by large dark monstera leaves backlit by warm evening sun, deep green silhouettes against a glowing amber background, lush atmospheric depth, natural product photography, photorealistic.",
  },
  {
    id: "dappled_light",
    name: "Dappled Light",
    category: "Nature",
    pexelsId: 30933242,
    prompt:
      "The product on a soft white textile surface with translucent dried honesty seed pods beside it, dappled window light scattering delicate shadows across the frame, quiet poetic stillness, fine-art product photography, photorealistic.",
  },
  {
    id: "stone_rest",
    name: "Stone Rest",
    category: "Nature",
    pexelsId: 5912001,
    prompt:
      "The product leaning against a chunk of rough white stone on a warm sand-colored background, single soft directional light casting a long gentle shadow, raw natural minimalism, clean skincare product photography, photorealistic.",
  },
  {
    id: "wildflower",
    name: "Wildflower",
    category: "Nature",
    pexelsId: 37602789,
    prompt:
      "The product beside a small glass jar of purple wildflowers on a muted teal surface, crisp sunlight throwing a lacy flower shadow across the background, fresh botanical simplicity, natural-light product photography, photorealistic.",
  },
  {
    id: "blossom_branch",
    name: "Blossom Branch",
    category: "Nature",
    pexelsId: 13306275,
    prompt:
      "The product on a bright white surface with a branch of pink cherry blossom arcing across the frame, soft spring daylight and faint blossom shadows, delicate fresh seasonal mood, minimal product photography, photorealistic.",
  },
  {
    id: "zen_bonsai",
    name: "Zen Bonsai",
    category: "Nature",
    pexelsId: 33537353,
    prompt:
      "The product on a clean white pedestal beside a small yellow-leaved bonsai in a dark ceramic pot, soft even studio light, calm balanced japandi styling with a pale neutral background, minimal product photography, photorealistic.",
  },
  {
    id: "leaf_study",
    name: "Leaf Study",
    category: "Nature",
    pexelsId: 34912250,
    prompt:
      "The product on a warm taupe textured surface beside a striped blue-green tradescantia leaf, soft raking light bringing out the surface grain, muted earthy palette, quiet botanical still life, photorealistic.",
  },

  // ── Kitchen — counters, tables, food styling ──────────────────────────────
  {
    id: "kitchen_window",
    name: "Kitchen Window",
    category: "Kitchen",
    pexelsId: 12699966,
    prompt:
      "The product on a bright kitchen counter beside potted herbs, a ceramic mug and fresh eggs, soft daylight streaming through the window behind, lived-in cozy home-kitchen atmosphere, lifestyle product photography, photorealistic.",
  },
  {
    id: "kitchen_shelf",
    name: "Kitchen Shelf",
    category: "Kitchen",
    pexelsId: 16033792,
    prompt:
      "The product on a light wooden kitchen counter beside patterned ceramic mugs on a wooden stand and a wooden crate, soft bright daylight, clean scandinavian kitchen styling, lifestyle product photography, photorealistic.",
  },
  {
    id: "morning_table",
    name: "Morning Table",
    category: "Kitchen",
    pexelsId: 33843874,
    prompt:
      "The product on a breakfast table beside a floral porcelain teapot, a cup of coffee and fresh bread rolls on a wooden board, warm morning light, inviting homely breakfast scene, lifestyle product photography, photorealistic.",
  },
  {
    id: "espresso_bar",
    name: "Espresso Bar",
    category: "Kitchen",
    pexelsId: 7736770,
    prompt:
      "The product on a dark espresso-bar counter beside heavy tumbler glasses catching a rich coffee pour, moody low-key lighting with warm highlights on the metal machine behind, premium café atmosphere, product photography, photorealistic.",
  },
  {
    id: "baking_table",
    name: "Baking Table",
    category: "Kitchen",
    pexelsId: 16620746,
    prompt:
      "The product on a rustic wooden table surrounded by dried pasta, cracked eggs in a wooden bowl and a whisk, warm overhead light, hearty homemade cooking mood shot from above, food-styling product photography, photorealistic.",
  },
  {
    id: "wooden_board",
    name: "Wooden Board",
    category: "Kitchen",
    pexelsId: 23948793,
    prompt:
      "The product on a light wooden serving board over a blue-checked linen cloth, soft natural daylight, clean artisanal food-market styling shot from above, food product photography, photorealistic.",
  },
  {
    id: "rustic_table",
    name: "Rustic Table",
    category: "Kitchen",
    pexelsId: 29463558,
    prompt:
      "The product on a dark rustic wooden table with fresh rosemary, whole peppercorns, a pepper mill and a dark ceramic dish around it, moody low warm light, rich farmhouse kitchen mood, food product photography, photorealistic.",
  },
  {
    id: "cozy_tea",
    name: "Cozy Tea",
    category: "Kitchen",
    pexelsId: 3750870,
    prompt:
      "The product beside a glass cup of lemon tea, pine cones and soft cotton stems on a pale knitted blanket, gentle diffused daylight, warm comforting winter-at-home mood, lifestyle product photography, photorealistic.",
  },

  // ── Lifestyle — desks, homes, vanities ───────────────────────────────────
  {
    id: "pink_desk",
    name: "Pink Desk",
    category: "Lifestyle",
    pexelsId: 29765807,
    prompt:
      "The product on a soft pink desk surface surrounded by pastel stationery, a white keyboard, paper clips and dried pink flowers, bright even overhead light, cheerful flat-lay workspace styling shot from above, lifestyle product photography, photorealistic.",
  },
  {
    id: "tech_desk",
    name: "Tech Desk",
    category: "Lifestyle",
    pexelsId: 3568521,
    prompt:
      "The product on a grey concrete desk among a laptop, magazines, a watch, headphones and a cup of black coffee, cool even lighting, modern masculine flat-lay workspace shot from above, lifestyle product photography, photorealistic.",
  },
  {
    id: "console_table",
    name: "Console Table",
    category: "Lifestyle",
    pexelsId: 20035935,
    prompt:
      "The product on a slim mid-century wooden console table beside a white vase of flowers and a small vintage clock, soft daylight against a pale terrazzo wall, calm modern interior styling, lifestyle product photography, photorealistic.",
  },
  {
    id: "knit_cozy",
    name: "Knit & Candles",
    category: "Lifestyle",
    pexelsId: 17680281,
    prompt:
      "The product on a chunky grey knitted blanket among small unlit candles, dried pine cones, eucalyptus sprigs and a cup of tea, soft warm indoor light, hygge autumn-at-home mood shot from above, lifestyle product photography, photorealistic.",
  },
  {
    id: "warm_tray",
    name: "Warm Tray",
    category: "Lifestyle",
    pexelsId: 34318768,
    prompt:
      "The product on a wooden tray with a glass teapot, a lit candle and a warm cup of tea, soft golden lamplight against cushions and linen, intimate evening-at-home atmosphere, lifestyle product photography, photorealistic.",
  },
  {
    id: "candlelit",
    name: "Candlelit",
    category: "Lifestyle",
    pexelsId: 38489194,
    prompt:
      "The product beside a single lit candle in an otherwise dark room, warm flickering candlelight as the only source, deep shadows falling away into black, intimate moody atmosphere, low-key product photography, photorealistic.",
  },
  {
    id: "apothecary",
    name: "Apothecary",
    category: "Lifestyle",
    pexelsId: 39281910,
    prompt:
      "The product on a pale stone counter in front of softly blurred wooden apothecary shelves lined with amber bottles, warm ambient light and dried grasses to one side, artisanal skincare-lab atmosphere, lifestyle product photography, photorealistic.",
  },
  {
    id: "silk_vanity",
    name: "Silk Vanity",
    category: "Lifestyle",
    pexelsId: 3750640,
    prompt:
      "The product on softly draped cream silk beside a makeup compact, brushes and a sprig of dried greenery, gentle diffused light picking up the fabric folds, elegant feminine vanity styling shot from above, beauty product photography, photorealistic.",
  },
  {
    id: "draped_silk",
    name: "Draped Silk",
    category: "Lifestyle",
    pexelsId: 6223482,
    prompt:
      "The product standing on soft folds of beige draped satin fabric, warm even light gliding along the curves of the cloth, luxurious tactile neutral-toned backdrop, elegant beauty product photography, photorealistic.",
  },
  {
    id: "linen_roses",
    name: "Linen & Roses",
    category: "Lifestyle",
    pexelsId: 15325501,
    prompt:
      "The product beside a loose bunch of pale pink roses against a wrinkled off-white linen backdrop, soft muted daylight, romantic understated still-life mood, editorial product photography, photorealistic.",
  },

  // ── Bold — saturated color, graphic shadows, pop ─────────────────────────
  {
    id: "golden_yellow",
    name: "Golden Yellow",
    category: "Bold",
    pexelsId: 7440924,
    prompt:
      "The product on a vivid golden-yellow seamless background beside dark speckled ceramic bowls, hard directional light casting a crisp defined shadow, bold saturated color-block composition, graphic product photography, photorealistic.",
  },
  {
    id: "peach_pop",
    name: "Peach Pop",
    category: "Bold",
    pexelsId: 28893012,
    prompt:
      "The product on a white ledge against a bright peach background, hard sunlight throwing a sharp colored shadow across the surface, punchy fresh summer color-blocking, vibrant product photography, photorealistic.",
  },
  {
    id: "terracotta_warmth",
    name: "Terracotta Warmth",
    category: "Bold",
    pexelsId: 29904622,
    prompt:
      "The product on a rich terracotta surface with cream ceramic forms stacked beside it, warm low sunlight and a long soft shadow, earthy saturated color contrast, sculptural product photography, photorealistic.",
  },
  {
    id: "coral_plinth",
    name: "Coral Plinth",
    category: "Bold",
    pexelsId: 27046135,
    prompt:
      "The product raised on a rough concrete block against a glowing coral-orange gradient background with a palm frond at the edge, bright hard light, bold tropical fashion-campaign energy, editorial product photography, photorealistic.",
  },
  {
    id: "iridescent_pop",
    name: "Iridescent Pop",
    category: "Bold",
    pexelsId: 30676121,
    prompt:
      "The product on a lilac surface against a hot pink gradient background, iridescent pearlescent highlights rippling across its surface, bright even light, playful modern candy-colored styling, vibrant product photography, photorealistic.",
  },
  {
    id: "sky_petal",
    name: "Sky Petal",
    category: "Bold",
    pexelsId: 20690094,
    prompt:
      "The product against a clear pale-blue background with a single peach poppy blossom beside it, soft bright light and a faint shadow, airy two-tone minimalism, fresh graphic product photography, photorealistic.",
  },
  {
    id: "lattice_shadow",
    name: "Lattice Shadow",
    category: "Bold",
    pexelsId: 30801252,
    prompt:
      "The product lying on a grey concrete surface with a bright criss-cross lattice of hard sunlight falling across it, strong graphic light-and-shadow pattern, contemporary urban minimalism, striking product photography, photorealistic.",
  },
  {
    id: "shell_terracotta",
    name: "Shell & Terracotta",
    category: "Bold",
    pexelsId: 38746783,
    prompt:
      "The product against a warm terracotta background beside a pale ridged seashell, soft directional light and a gentle shadow, muted coastal color-block minimalism, refined product photography, photorealistic.",
  },
  {
    id: "pink_flat_lay",
    name: "Pink Flat Lay",
    category: "Bold",
    pexelsId: 25906586,
    prompt:
      "The product arranged in a repeating diagonal pattern with glossy pink and red cosmetics on a soft pink background, bright even light, playful graphic beauty flat lay shot from above, vibrant product photography, photorealistic.",
  },

  // ── Fresh — water, ice, splashes ─────────────────────────────────────────
  {
    id: "pink_splash",
    name: "Pink Splash",
    category: "Fresh",
    pexelsId: 24602064,
    prompt:
      "The product standing on a wet glass shelf just above rippling water, a bright pink background scattered with suspended water droplets, crisp flash lighting freezing the spray, refreshing hydration-campaign look, product photography, photorealistic.",
  },
  {
    id: "rose_water",
    name: "Rose Water",
    category: "Fresh",
    pexelsId: 5113049,
    prompt:
      "The product half submerged in shallow rose-pink water, sunlight refracting into shifting caustic patterns across the surface around it, dreamy weightless feel, fresh product photography, photorealistic.",
  },
  {
    id: "liquid_gold",
    name: "Liquid Gold",
    category: "Fresh",
    pexelsId: 14656279,
    prompt:
      "The product immersed in shimmering golden water, warm light fracturing into rippling highlights all around it, rich luxurious liquid texture, glowing premium product photography, photorealistic.",
  },
  {
    id: "on_ice",
    name: "On Ice",
    category: "Fresh",
    pexelsId: 36238538,
    prompt:
      "The product resting against a thick block of clear cracked ice on a pale grey surface, cool diffused light glinting through the ice, crisp cold sensation with faint meltwater, refreshing product photography, photorealistic.",
  },
  {
    id: "fresh_splash",
    name: "Fresh Splash",
    category: "Fresh",
    pexelsId: 33579054,
    prompt:
      "The product dropping into clear water against a clean white background, a crown of frozen splash and droplets bursting around it, ultra-crisp high-speed flash capture, energetic freshness, product photography, photorealistic.",
  },
  {
    id: "dark_splash",
    name: "Dark Splash",
    category: "Fresh",
    pexelsId: 6593237,
    prompt:
      "The product hitting the surface of water against a pure black background, a bright arc of splash and scattered droplets frozen mid-air, dramatic rim-lit high-speed capture, bold product photography, photorealistic.",
  },
  {
    id: "dark_berries",
    name: "Dark Berries",
    category: "Fresh",
    pexelsId: 33651543,
    prompt:
      "The product among plump water-beaded blueberries on a deep navy surface, moody low-key light with cool highlights on every droplet, rich saturated freshness, dramatic food product photography, photorealistic.",
  },
  {
    id: "petal_fall",
    name: "Petal Fall",
    category: "Fresh",
    pexelsId: 4841179,
    prompt:
      "The product on a clean white surface with soft pink petals fanning out from it as if poured, gentle even light and the faintest shadow, delicate airy beauty composition shot from above, minimal product photography, photorealistic.",
  },

  // ── Seasonal — festive and gifting ───────────────────────────────────────
  {
    id: "festive_red",
    name: "Festive Red",
    category: "Seasonal",
    pexelsId: 29569495,
    prompt:
      "The product beside a glossy red gift box tied with a satin ribbon, sprigs of holly and red berries around it on a deep red background, warm festive lighting, celebratory holiday gifting mood, product photography, photorealistic.",
  },
  {
    id: "christmas_tree",
    name: "Under the Tree",
    category: "Seasonal",
    pexelsId: 29463065,
    prompt:
      "The product among wrapped red and gold gifts, baubles and candy canes at the foot of a lush green christmas tree, warm cozy lighting with soft bokeh, classic holiday scene, festive product photography, photorealistic.",
  },
  {
    id: "emerald_gifts",
    name: "Emerald Gifts",
    category: "Seasonal",
    pexelsId: 19608064,
    prompt:
      "The product among deep emerald-green gift boxes with cream tags and gold twine, low moody lighting with rich shadow, elegant modern christmas gifting styling, premium product photography, photorealistic.",
  },
  {
    id: "winter_cozy",
    name: "Winter Cozy",
    category: "Seasonal",
    pexelsId: 19859578,
    prompt:
      "The product beside a mug of hot cocoa, an open book, pine cones and a patterned knitted scarf, soft warm indoor light, snug winter-afternoon mood shot from above, lifestyle product photography, photorealistic.",
  },
  {
    id: "holiday_bake",
    name: "Holiday Bake",
    category: "Seasonal",
    pexelsId: 35134317,
    prompt:
      "The product on a dark slate surface dusted with flour among gingerbread stars, cinnamon sticks and a piping bag, warm low light, rustic christmas baking scene shot from above, food product photography, photorealistic.",
  },
  {
    id: "red_sparkle",
    name: "Red Sparkle",
    category: "Seasonal",
    pexelsId: 29569499,
    prompt:
      "The product on a saturated red background with fine chains and starburst sparkles radiating around it, crisp specular highlights, glamorous festive jewelry-campaign styling shot from above, product photography, photorealistic.",
  },

  // ── Beach — sand, sun and summer ─────────────────────────────────────────
  {
    id: "sand_jewels",
    name: "Sand & Gold",
    category: "Beach",
    pexelsId: 38054095,
    prompt:
      "The product half-nestled in fine golden beach sand with delicate gold chains and tiny shells scattered around it, warm low sunlight raking across the grains, sun-drenched summer holiday mood, product photography, photorealistic.",
  },
  {
    id: "seaside_sand",
    name: "Seaside",
    category: "Beach",
    pexelsId: 17399542,
    prompt:
      "The product standing in soft beach sand with the turquoise sea and clear blue sky softly blurred behind it, bright natural sunlight, breezy coastal holiday atmosphere, lifestyle product photography, photorealistic.",
  },
  {
    id: "beach_flatlay",
    name: "Beach Flat Lay",
    category: "Beach",
    pexelsId: 2098848,
    prompt:
      "The product on warm beach sand beside a straw sun hat, espadrilles, an open magazine and fresh peaches, bright midday sun, relaxed summer flat lay shot from above, lifestyle product photography, photorealistic.",
  },
  {
    id: "fine_sand",
    name: "Fine Sand",
    category: "Beach",
    pexelsId: 28388345,
    prompt:
      "The product set into smooth pale beach sand, soft footprint impressions and gentle ripples across the surface around it, warm diffused sunlight and a soft shadow, calm minimal coastal styling, product photography, photorealistic.",
  },
  {
    id: "golden_shore",
    name: "Golden Shore",
    category: "Beach",
    pexelsId: 2128270,
    prompt:
      "The product on wet golden sand right at the edge of a receding wave, white sea foam curling beside it, bright natural sunlight and a glossy reflection on the damp sand, fresh coastal energy, product photography, photorealistic.",
  },
];

/** Lookup by id — the modal resolves the selected template on every render. */
export const STAGING_TEMPLATES_BY_ID = Object.fromEntries(
  STAGING_TEMPLATES.map((t) => [t.id, t]),
);
