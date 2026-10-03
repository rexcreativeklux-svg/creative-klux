/**
 * textToImageTemplates.js
 * ─────────────────────────────────────────────────────────────────────────────
 * The Templates canvas for Text to Image — a picture and the prompt that
 * describes it. "Use" drops the prompt into the composer; the picture is there
 * so you can see what you're choosing before you choose it.
 *
 * ── ⚠️ THE PICTURES ARE PEXELS PHOTOS, NOT OUR OUTPUT ────────────────────────
 * They are free-licence stock (pexels.com/license) standing in for renders from
 * our own model, and each prompt was written to describe its photo rather than
 * the other way round. Swap in our own generations when we have them — keep the
 * entry, replace `image`, and the prompt will already match.
 *
 * Every photo was picked from the Pexels API with no brand, logo or franchise
 * in frame, so a template never seeds a trademark into someone's prompt.
 *
 * ── Adding one ──────────────────────────────────────────────────────────────
 * Take the photo's id from its pexels.com URL, fill in its real width and height
 * (the card reserves that shape before the image loads, so the grid doesn't
 * jump), and write the prompt the way the others are: subject, setting, light,
 * then the mood or medium.
 *
 * Social Design and Ads Design have catalogs of their own — designs with copy
 * on them, not bare photos. Those live in designTemplates.js and are shaped
 * here alongside this one.
 */

import { AD_CATALOG, SOCIAL_CATALOG } from "./designTemplates";

/**
 * A Pexels CDN URL at a given width. Pexels resizes on the fly, so the grid
 * pulls a card-sized file and the viewer a screen-sized one from the same id.
 */
const pexels = (id, width) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;

const CATALOG = [
  {
    id: "noir-portrait",
    pexelsId: 34921744,
    width: 4288,
    height: 6432,
    credit: "David Barahona",
    prompt:
      "Full-length fashion portrait of a woman in a sleek black dress, standing with one hand on her hip and a confident gaze. Seamless dark backdrop, a single soft key light from the left carving her silhouette out of the shadow. Moody, elegant, high-end editorial photography.",
  },
  {
    id: "golden-chrono",
    pexelsId: 10591429,
    width: 3640,
    height: 5432,
    credit: "Behrouz Alimardani",
    prompt:
      "Macro product shot of a gold chronograph watch on a brown leather strap, the dial crisp with fine engraved detail. Dark, warm background, a narrow strip of light raking across the polished case. Luxury advertising photography, shallow depth of field.",
  },
  {
    id: "brownie-pour",
    pexelsId: 31745180,
    width: 4128,
    height: 5504,
    credit: "Nadin Sh",
    prompt:
      "Warm caramel sauce being poured over a fudgy chocolate brownie topped with a scoop of vanilla ice cream, caught mid-drip. Rustic plate, soft window light from behind making the sauce glow. Indulgent food photography, close-up, rich browns and creams.",
  },
  {
    id: "neon-alley",
    pexelsId: 26732100,
    width: 3648,
    height: 5472,
    credit: "Elina Volkova",
    prompt:
      "An empty narrow city alley at night, lit by glowing neon signs and a single street lamp, wet pavement reflecting the colours. Deep shadows, a light haze in the air. Cinematic, moody urban atmosphere, shot on a 35mm lens.",
  },
  {
    id: "lake-sunrise",
    pexelsId: 6114008,
    width: 4000,
    height: 6000,
    credit: "Guillaume Hankenne",
    prompt:
      "Golden sunrise over a calm alpine lake, the sun breaking over the mountain ridge and laying a path of light across the still water. Soft mist on the far shore, clear sky fading from gold to pale blue. Serene landscape photography, wide angle.",
  },
  {
    id: "floating-sneakers",
    pexelsId: 12628400,
    width: 4000,
    height: 6000,
    credit: "HamZa NOUASRIA",
    prompt:
      "A pair of clean white sneakers floating in mid-air against a deep charcoal backdrop, laces loose, one angled slightly above the other. Crisp studio lighting with soft shadows. Minimalist product advertising, sharp detail, high contrast.",
  },
  {
    id: "tabby-portrait",
    pexelsId: 39497325,
    width: 2961,
    height: 4442,
    credit: "luian C",
    prompt:
      "Close-up portrait of a fluffy tabby cat looking just past the camera, every whisker and stripe in sharp focus. Deep navy blue studio background, soft directional light. Pet portrait photography, calm and regal.",
  },
  {
    id: "shell-serum",
    pexelsId: 20171275,
    width: 3290,
    height: 5848,
    credit: "KÜBRA TOKUR",
    prompt:
      "A minimalist glass skincare bottle resting on a pearly seashell, scattered with delicate white petals. Dark, moody background with a soft spotlight on the product. Elegant beauty product photography, clean and luxurious.",
  },
  {
    id: "red-suit",
    pexelsId: 38290948,
    width: 5464,
    height: 8196,
    credit: "Esra Saltürk",
    prompt:
      "Street-style fashion editorial of a model in a tailored bright red suit holding a magazine, posing against a clean urban backdrop. Natural overcast daylight, bold colour against neutral surroundings. Magazine-cover photography, confident and chic.",
  },
  {
    id: "snow-cabins",
    pexelsId: 10754168,
    width: 3226,
    height: 3456,
    credit: "Nikolaeva Nastia",
    prompt:
      "Cozy wooden cabins buried in fresh snow among tall pine trees, warm light glowing from the windows. Quiet winter afternoon, soft falling snow, cool blue shadows. Peaceful, storybook winter scene.",
  },
  {
    id: "cappuccino",
    pexelsId: 6747870,
    width: 3024,
    height: 4032,
    credit: "Rania Alsahabi",
    prompt:
      "Top-down close-up of a cappuccino with a delicate latte-art leaf, on a black saucer with a small teaspoon. Soft natural daylight, creamy foam texture in sharp detail. Cafe lifestyle photography, warm and inviting.",
  },
  {
    id: "navy-living-room",
    pexelsId: 30386991,
    width: 4000,
    height: 6000,
    credit: "Huy Phan",
    prompt:
      "A stylish modern living room with a deep navy velvet sofa, lush indoor plants and contemporary decor. Bright natural light from large windows, warm wood floor. Interior design photography, airy and inviting.",
  },
  {
    id: "spiral-3d",
    pexelsId: 31687154,
    width: 2160,
    height: 3840,
    credit: "Mahmoud Ramadan",
    prompt:
      "Abstract 3D render of vibrant pink and orange ribbons spiralling through space against a bright cobalt blue background. Glossy surfaces, soft studio lighting, smooth gradients. Playful, bold, modern digital art.",
  },
  {
    id: "stacked-burger",
    pexelsId: 5179783,
    width: 3456,
    height: 5184,
    credit: "Lucas Andrade",
    prompt:
      "A towering double cheeseburger with crispy bacon and melted cheese, shot from a low angle against a vivid blue sky. Bright daylight, juicy glistening detail. Bold, fun fast-food advertising photography.",
  },
  {
    id: "forest-retriever",
    pexelsId: 33800404,
    width: 5484,
    height: 8225,
    credit: "Tommes Frites",
    prompt:
      "A golden retriever standing alert in a sunlit forest clearing, ears perked, looking toward the camera. Warm golden-hour light filtering through the trees, soft green bokeh behind. Joyful pet photography, natural and vivid.",
  },
  {
    id: "rustic-perfume",
    pexelsId: 15096784,
    width: 3777,
    height: 5665,
    credit: "Dhally Romy",
    prompt:
      "A luxurious glass perfume bottle standing on weathered rustic wood, light catching the facets of the glass. Warm, soft side light and a dark blurred background. Elegant fragrance advertising photography.",
  },
  {
    id: "ocean-foam",
    pexelsId: 36097310,
    width: 3123,
    height: 4684,
    credit: "Marina Grechko",
    prompt:
      "Aerial top-down view of turquoise ocean waves breaking into lace-like white foam patterns over deep blue water. Bright midday sun, crisp texture in every ripple. Abstract nature photography, drone shot, vivid and refreshing.",
  },
  {
    id: "sushi-platter",
    pexelsId: 10562410,
    width: 4000,
    height: 6000,
    credit: "Maria Buloczka",
    prompt:
      "An elegant assortment of nigiri and maki sushi on a black slate platter with wasabi and pickled ginger. Dark moody background, soft overhead light making the fish glisten. Fine-dining food photography, clean and refined.",
  },
  {
    id: "sahara-dunes",
    pexelsId: 37818878,
    width: 3024,
    height: 4032,
    credit: "Emre Koşak",
    prompt:
      "Rolling golden sand dunes in the Sahara at sunrise, sharp ridgelines casting long soft shadows across rippled sand. Warm low sun, pale clear sky. Minimal, serene desert landscape photography.",
  },
  {
    id: "northern-lights",
    pexelsId: 10194246,
    width: 3535,
    height: 5302,
    credit: "Nikita Grishin",
    prompt:
      "Green and violet northern lights swirling across a dark star-filled sky above a quiet snowy horizon. Long exposure, deep blues, glowing ribbons of light. Mystical night-sky photography, awe-inspiring.",
  },
  {
    id: "pastel-bouquet",
    pexelsId: 4522910,
    width: 2000,
    height: 3000,
    credit: "Polina Tankilevitch",
    prompt:
      "A vibrant floral arrangement of spring blooms in a clear glass vase against a soft pastel green wall. Even, diffused daylight, gentle shadows. Fresh, cheerful still-life photography with a modern minimal feel.",
  },
  {
    id: "yellow-corner",
    pexelsId: 29544833,
    width: 3899,
    height: 5999,
    credit: "Nathan Marcam",
    prompt:
      "The sharp corner of a bright yellow modern building rising into a cloudless deep blue sky, shot from below. Hard sunlight, bold geometric lines, strong colour contrast. Minimalist architectural photography.",
  },
  {
    id: "ridge-hiker",
    pexelsId: 17256138,
    width: 3120,
    height: 4160,
    credit: "Anto",
    prompt:
      "A lone hiker in an orange hoodie standing on a rocky mountain ridge under a dramatic cloudy sky, valleys falling away below. Moody natural light, sense of scale and freedom. Adventure travel photography.",
  },
  {
    id: "macaron-mirror",
    pexelsId: 38876021,
    width: 4303,
    height: 6454,
    credit: "Travel with Lenses",
    prompt:
      "Pastel French macarons arranged with sprigs of eucalyptus on a glossy reflective surface. Soft diffused light, delicate colours of pink, mint and lavender. Elegant patisserie photography, light and airy.",
  },
  {
    id: "rain-window",
    pexelsId: 14503515,
    width: 2552,
    height: 3769,
    credit: "Linken Van Zyl",
    prompt:
      "Close-up of raindrops on a window glass at dusk, glowing city lights blurred into warm bokeh behind. Cool blue and amber tones, quiet melancholy mood. Cinematic, atmospheric photography.",
  },
  {
    id: "astronaut-profile",
    pexelsId: 7170772,
    width: 2333,
    height: 3500,
    credit: "cottonbro studio",
    prompt:
      "Profile portrait of a person in a white astronaut suit and helmet against a pure black background, one hard light catching the visor and the folds of the suit. Minimal, dramatic, cinematic sci-fi photography.",
  },
  {
    id: "mountain-switchbacks",
    pexelsId: 9674293,
    width: 3211,
    height: 5091,
    credit: "Nadezhda Moryak",
    prompt:
      "Aerial drone view of a road winding in tight switchbacks down a green mountainside, tiny cars on the bends. Soft overcast light, rich greens and grey rock. Epic travel photography, top-down perspective.",
  },
  {
    id: "shrimp-ramen",
    pexelsId: 28701168,
    width: 5464,
    height: 8192,
    credit: "Valeria Boltneva",
    prompt:
      "Close-up of a steaming bowl of shrimp ramen with a halved soft-boiled egg, springy noodles and scallions in a rich golden broth. Warm side light, chopsticks resting on the rim. Appetising Japanese food photography.",
  },
  {
    id: "vintage-car-cobbles",
    pexelsId: 17497742,
    width: 3940,
    height: 5926,
    credit: "Rodrigo Gabotto",
    prompt:
      "A classic vintage car parked on an old cobblestone street, seen from behind, chrome bumper gleaming. Weathered pastel facades on either side, soft afternoon light. Nostalgic travel photography with a retro film look.",
  },
  {
    id: "palm-shoreline",
    pexelsId: 31377612,
    width: 4000,
    height: 6000,
    credit: "Priscila Almeida",
    prompt:
      "A quiet tropical beach lined with leaning coconut palms, gentle turquoise waves rolling onto pale sand. Bright, hazy midday light. Serene, airy travel photography, vertical frame.",
  },
  {
    id: "jellyfish-deep",
    pexelsId: 10027304,
    width: 3510,
    height: 6240,
    credit: "Cristian Muduc",
    prompt:
      "Translucent jellyfish drifting through deep dark blue water, their trailing tentacles softly glowing. Inky background, delicate light through the bells. Ethereal, otherworldly underwater photography.",
  },
  {
    id: "golden-woodland-trail",
    pexelsId: 14259743,
    width: 3942,
    height: 7008,
    credit: "Masood Aslami",
    prompt:
      "A woodland trail disappearing into a tunnel of golden autumn trees, fallen leaves carpeting the path. Warm soft light filtering through the canopy. Peaceful, nostalgic seasonal landscape photography.",
  },
  {
    id: "night-skyline",
    pexelsId: 16898413,
    width: 4000,
    height: 6000,
    credit: "el jusuf",
    prompt:
      "A dense city skyline at night, glass skyscrapers lit floor by floor against a deep blue sky. Long exposure, glowing windows, crisp verticals. Modern urban photography, cool tones.",
  },
  {
    id: "honeycomb-drip",
    pexelsId: 8851478,
    width: 3024,
    height: 4032,
    credit: "Yulia Ilina",
    prompt:
      "Golden honey dripping slowly from a glistening honeycomb on a dark background. Low warm backlight making the honey glow amber. Rich, sticky, macro food photography.",
  },
  {
    id: "flamingo-preen",
    pexelsId: 31741304,
    width: 3672,
    height: 3819,
    credit: "Chinstrap",
    prompt:
      "Close-up of a vibrant pink flamingo preening its feathers, neck curved in an elegant S. Soft natural daylight, blurred pastel background. Graceful wildlife photography, candy-pink tones.",
  },
  {
    id: "lavender-evening",
    pexelsId: 4936400,
    width: 2848,
    height: 4272,
    credit: "Mercedes Muñoz Rosón",
    prompt:
      "Endless rows of purple lavender stretching toward the horizon under a gentle evening sky. Soft fading light, dreamy haze. Tranquil countryside landscape photography.",
  },
  {
    id: "barista-portafilter",
    pexelsId: 12420819,
    width: 2000,
    height: 3000,
    credit: "Vitaly Gorbachev",
    prompt:
      "A barista holding a portafilter in a cosy café, espresso machine glinting behind. Warm ambient light, shallow depth of field. Authentic coffee-culture lifestyle photography.",
  },
  {
    id: "elder-smile",
    pexelsId: 11511809,
    width: 3264,
    height: 4897,
    credit: "Mehmet Turgut Kirkgoz",
    prompt:
      "Close-up portrait of a smiling elderly man in a hat, every deep wrinkle telling a story, eyes bright with warmth. Soft natural light, muted background. Intimate, characterful documentary portrait.",
  },
  {
    id: "fern-waterfall",
    pexelsId: 31271946,
    width: 4640,
    height: 6960,
    credit: "Vasilis Karkalas",
    prompt:
      "A tall waterfall pouring into a quiet jungle pool, lush green ferns framing the foreground. Diffused light, silky long-exposure water. Lush, tranquil nature photography.",
  },
  {
    id: "strawberry-splash",
    pexelsId: 8493276,
    width: 4000,
    height: 6000,
    credit: "Vilnis Husko",
    prompt:
      "Ripe strawberries splashing into a glass of sparkling wine, droplets frozen mid-air against a pure black background. High-speed flash, glossy reds. Dramatic beverage advertising photography.",
  },
  {
    id: "ballet-stage",
    pexelsId: 17029900,
    width: 4016,
    height: 6016,
    credit: "Rubén Ostria Baltazar",
    prompt:
      "A ballet dancer holding a graceful pose on a dark stage, a single spotlight tracing the line of her arms and tutu. Moody theatrical light. Elegant performance photography.",
  },
  {
    id: "fox-snowfall",
    pexelsId: 35986458,
    width: 4672,
    height: 5779,
    credit: "G N",
    prompt:
      "A red fox sitting calmly in falling snow, thick russet fur dusted with flakes, gazing past the camera. Soft winter light, muted background. Intimate wildlife photography.",
  },
  {
    id: "spiral-stair",
    pexelsId: 38548305,
    width: 3869,
    height: 5837,
    credit: "Raven Zhou",
    prompt:
      "A sleek white spiral staircase curling up the face of a clean modern building, sharp geometric shadows. Bright even daylight, minimal palette. Contemporary architectural photography.",
  },
  {
    id: "balloons-sunset",
    pexelsId: 10244848,
    width: 2756,
    height: 4135,
    credit: "Rahime Gül",
    prompt:
      "Dozens of hot air balloons floating over rocky valleys at sunrise, the sky glowing vivid orange. Warm haze, silhouetted landscape. Magical, wide travel photography.",
  },
  {
    id: "smoke-swirl",
    pexelsId: 30320904,
    width: 3456,
    height: 5184,
    credit: "Landiva Weber",
    prompt:
      "Abstract swirls of vivid purple and green smoke twisting through the frame like liquid silk. Soft studio light, smooth gradients. Dreamy, artistic abstract background.",
  },
  {
    id: "bonsai",
    pexelsId: 17146325,
    width: 4000,
    height: 6000,
    credit: "Jon Mangold",
    prompt:
      "A carefully groomed bonsai tree in a shallow ceramic pot, set against a rustic weathered wooden wall. Soft natural light, earthy tones. Calm, mindful still-life photography.",
  },
  {
    id: "croissant-coffee",
    pexelsId: 3806365,
    width: 2336,
    height: 3504,
    credit: "Larissa Megale",
    prompt:
      "Fresh golden croissants on a plate beside a cup of coffee on a cosy autumn table. Soft window light, warm creams and browns. Inviting breakfast lifestyle photography.",
  },
  {
    id: "lightning-bolts",
    pexelsId: 29350450,
    width: 1953,
    height: 3472,
    credit: "Salem Raju",
    prompt:
      "Several forked lightning bolts splitting a stormy night sky, clouds lit violet from within. Long exposure, deep blues. Powerful, dramatic weather photography.",
  },
  {
    id: "neon-umbrellas",
    pexelsId: 31667358,
    width: 3721,
    height: 4651,
    credit: "Alexander London",
    prompt:
      "A busy city street at night, people under umbrellas walking past glowing neon signs, the wet pavement reflecting every colour. Moody rain, shallow depth of field. Cinematic street photography.",
  },
  {
    id: "galloping-horse",
    pexelsId: 20468914,
    width: 4431,
    height: 5931,
    credit: "Aykut Kılıç",
    prompt:
      "A horse galloping freely across an open field, mane flying, hooves kicking up dust. Crisp focus, natural soft light. Powerful, dynamic equine photography.",
  },
  {
    id: "sakura-night",
    pexelsId: 36867508,
    width: 4672,
    height: 7008,
    credit: "maxed. RAW",
    prompt:
      "Cherry blossoms glowing pink over a quiet city street at night, petals lit by streetlamps and passing headlights. Soft bokeh, cool shadows. Romantic, cinematic urban photography.",
  },
  {
    id: "vineyard-sunset",
    pexelsId: 20151794,
    width: 4000,
    height: 6000,
    credit: "Nano Erdozain",
    prompt:
      "A woman holding a glass of red wine among lush vineyard rows at sunset, warm golden light in her hair. Soft backlight, relaxed mood. Aspirational lifestyle photography.",
  },
  {
    id: "black-sand-waves",
    pexelsId: 29353508,
    width: 4000,
    height: 6000,
    credit: "Hub JACQU",
    prompt:
      "Aerial view of white ocean waves rolling onto a black volcanic sand beach, the foam tracing lace patterns on the dark shore. Cool overcast light, stark contrast. Minimal, dramatic drone landscape photography.",
  },
  {
    id: "dew-drop-leaf",
    pexelsId: 16086657,
    width: 2296,
    height: 4080,
    credit: "Akshansh Singh",
    prompt:
      "Macro shot of a single dew drop resting on a textured green leaf, the tiny world inside it refracted and sharp. Soft natural light, creamy background blur. Fresh, detailed nature macro photography.",
  },
  {
    id: "peacock-feathers",
    pexelsId: 10141411,
    width: 3376,
    height: 6000,
    credit: "julia lee",
    prompt:
      "Close-up of peacock feathers fanned in shimmering blues, greens and gold, every barb in fine detail. Soft even light, rich jewel tones. Luxurious abstract nature photography.",
  },
  {
    id: "desert-dust-road",
    pexelsId: 20272807,
    width: 4419,
    height: 6628,
    credit: "Kyle Miller",
    prompt:
      "A lone vehicle kicking up dust on a desert road at sunset, telephone poles marching toward distant hills. Warm low sun, hazy golden air. Cinematic Americana road-trip photography.",
  },
  {
    id: "berry-pancakes",
    pexelsId: 35200922,
    width: 3072,
    height: 4096,
    credit: "atelierbyvineeth . . .",
    prompt:
      "A stack of fluffy pancakes topped with fresh blueberries and raspberries, syrup running down the sides. Warm soft light, close-up. Inviting breakfast food photography.",
  },
  {
    id: "venice-gondolas",
    pexelsId: 20068237,
    width: 4000,
    height: 6000,
    credit: "Ozan Tabakoğlu",
    prompt:
      "A quiet Venetian canal lined with moored gondolas and weathered historic facades, reflections rippling in the green water. Soft daylight, warm terracotta tones. Romantic travel photography.",
  },
  {
    id: "eagle-owl",
    pexelsId: 31205580,
    width: 4800,
    height: 7200,
    credit: "Arian Fernandez",
    prompt:
      "Close-up portrait of a Eurasian eagle-owl with piercing orange eyes and tufted ears, every feather textured. Soft natural light, muted background. Striking wildlife portrait photography.",
  },
  {
    id: "rice-terraces",
    pexelsId: 28747444,
    width: 5304,
    height: 7952,
    credit: "chiến bá",
    prompt:
      "Lush green rice terraces stepping down a hillside toward a small rustic hut, mountains rising behind. Soft morning light, vivid greens. Tranquil rural landscape photography.",
  },
  {
    id: "neon-club-portrait",
    pexelsId: 19830276,
    width: 4000,
    height: 6000,
    credit: "Daniil Kondrashin",
    prompt:
      "Portrait of a woman bathed in purple and pink neon club lighting, glowing highlights on her skin. Deep shadows, saturated colour. Bold, modern editorial photography.",
  },
  {
    id: "milky-way-range",
    pexelsId: 3222255,
    width: 3152,
    height: 4541,
    credit: "Adi K",
    prompt:
      "The Milky Way arching over a dark mountain range on a clear night, thousands of stars in sharp focus. Long exposure, deep purples and blues. Awe-inspiring astrophotography.",
  },
  {
    id: "tulip-rows",
    pexelsId: 37310238,
    width: 4016,
    height: 6016,
    credit: "uhumrea D.",
    prompt:
      "Vivid rows of pink, yellow and orange tulips stretching across a spring field. Bright daylight, saturated colour stripes. Cheerful, graphic landscape photography.",
  },
  {
    id: "aegean-whitewash",
    pexelsId: 28000940,
    width: 3588,
    height: 5382,
    credit: "Wolf Art",
    prompt:
      "Whitewashed cliffside houses overlooking a deep blue sea under a clear sky. Bright Mediterranean sun, crisp whites and blues. Postcard-perfect travel photography.",
  },
  {
    id: "sea-turtle",
    pexelsId: 5277692,
    width: 4277,
    height: 5304,
    credit: "Daniel Torobekov",
    prompt:
      "A sea turtle gliding through clear blue water on a sunny day, light rays dancing across its shell. Side view, soft underwater haze. Serene marine wildlife photography.",
  },
  {
    id: "misty-hillside",
    pexelsId: 14845820,
    width: 4000,
    height: 6000,
    credit: "Musa Tuğrul Karataş",
    prompt:
      "A forested hillside wrapped in drifting morning fog, layers of pines fading into soft grey. Muted cool tones, quiet stillness. Moody, atmospheric landscape photography.",
  },
  {
    id: "wood-fired-pizza",
    pexelsId: 18126737,
    width: 4000,
    height: 5548,
    credit: "Joshua Plattner",
    prompt:
      "Pizzas blistering inside a traditional wood-fired oven, flames licking the domed brick ceiling. Warm firelight glow, smoky atmosphere. Rustic, appetising food photography.",
  },
  {
    id: "surfers-turquoise",
    pexelsId: 4783907,
    width: 7201,
    height: 9000,
    credit: "Jess Loiterton",
    prompt:
      "Aerial shot of surfers riding turquoise waves breaking into white foam. Bright midday sun, vivid aqua tones. Energetic drone sports photography.",
  },
  {
    id: "red-autumn-leaves",
    pexelsId: 34620224,
    width: 3392,
    height: 5088,
    credit: "Ellie Burgin",
    prompt:
      "Close-up of vivid crimson autumn leaves layered together, veins glowing in soft backlight. Rich reds, shallow depth of field. Seasonal nature macro photography.",
  },
  {
    id: "ice-cave",
    pexelsId: 31028950,
    width: 3648,
    height: 5472,
    credit: "Shuo Wang",
    prompt:
      "Inside a glacier ice cave, walls of translucent blue ice curving overhead in smooth ribbed waves. Cool natural light filtering through. Otherworldly adventure photography.",
  },
  {
    id: "lemon-pastel",
    pexelsId: 8110176,
    width: 2848,
    height: 4272,
    credit: "Karen Laårk Boshoff",
    prompt:
      "Fresh lemon slices arranged on a soft pastel pink backdrop, translucent flesh catching the light. Bright even light, clean shadows. Playful, minimal food styling photography.",
  },
  {
    id: "resting-tiger",
    pexelsId: 27834731,
    width: 3264,
    height: 4928,
    credit: "Leon Aschemann",
    prompt:
      "A tiger resting in dense jungle foliage, striped coat vivid and amber eyes locked on the camera. Dappled light, rich greens and oranges. Majestic wildlife photography.",
  },
  {
    id: "spice-market",
    pexelsId: 35185310,
    width: 4606,
    height: 6901,
    credit: "Moussa Idrissi",
    prompt:
      "Colourful spices and herbs heaped in metal bowls and glass jars at a market stall — saffron, paprika, turmeric. Warm daylight, rich earthy tones. Vibrant travel food photography.",
  },
  {
    id: "snow-peaks",
    pexelsId: 3389537,
    width: 3840,
    height: 5760,
    credit: "eberhard grossgasteiger",
    prompt:
      "Snow-covered mountain peaks rising above a dark pine forest under a soft cloudy sky. Cool diffused light, crisp whites. Majestic alpine landscape photography.",
  },
  {
    id: "candle-flames",
    pexelsId: 31966191,
    width: 2396,
    height: 3993,
    credit: "Oleg Nagovski",
    prompt:
      "Warm candle flames flickering in deep darkness, soft glow falling off into black. Low light, golden tones. Peaceful, reflective still-life photography.",
  },
  {
    id: "pastel-clouds",
    pexelsId: 18501117,
    width: 3024,
    height: 4032,
    credit: "Melike",
    prompt:
      "Soft pastel pink clouds drifting across a pale blue sky at sunset. Gentle diffused light, dreamy gradients. Calm, airy skyscape photography.",
  },
  {
    id: "purple-orchids",
    pexelsId: 9365104,
    width: 4000,
    height: 6000,
    credit: "Kuba Macioszek",
    prompt:
      "Vibrant purple orchids against a dark background, intricate petals lit softly from one side. Rich colour, deep shadows. Elegant botanical photography.",
  },
  {
    id: "white-sportscar",
    pexelsId: 27639784,
    width: 2832,
    height: 4240,
    credit: "Erik Mclean",
    prompt:
      "A sleek white sports car parked in a dim urban garage, its curves catching cool overhead light. Moody shadows, glossy reflections. Premium automotive photography.",
  },
  {
    id: "leather-books",
    pexelsId: 13061431,
    width: 3648,
    height: 5472,
    credit: "Jonathan Borba",
    prompt:
      "Rows of antique leather-bound books lined up on wooden library shelves, gilded spines catching warm light. Rich browns, timeless mood. Classic interior photography.",
  },
  {
    id: "paris-bistro",
    pexelsId: 20380436,
    width: 2262,
    height: 4032,
    credit: "Karography",
    prompt:
      "A cosy Parisian bistro with wicker chairs and outdoor tables on a lively sidewalk. Soft daylight, warm creams and greens. Charming European travel photography.",
  },
  {
    id: "coral-reef",
    pexelsId: 4620471,
    width: 3000,
    height: 4000,
    credit: "Francesco Ungaro",
    prompt:
      "A colourful coral reef teeming with a shimmering school of small fish, clear blue water above. Bright underwater light. Vivid marine biodiversity photography.",
  },
  {
    id: "camel-dunes",
    pexelsId: 30218468,
    width: 4000,
    height: 6000,
    credit: "Othmane Ettalbi",
    prompt:
      "Silhouetted camels standing on sand dunes against a soft twilight sky. Warm fading light, gentle gradients. Serene desert travel photography.",
  },
  {
    id: "steamed-dumplings",
    pexelsId: 7363674,
    width: 3360,
    height: 5040,
    credit: "Angela Roma",
    prompt:
      "Fresh dumplings in bamboo steamers on a wooden table, delicate pleats glistening. Soft natural light, steam rising. Authentic Asian food photography.",
  },
  {
    id: "baby-elephant",
    pexelsId: 4440408,
    width: 3888,
    height: 5184,
    credit: "Katie Hollamby",
    prompt:
      "A baby elephant walking close beside its herd in a green sanctuary, trunk curled. Soft daylight, earthy tones. Heartwarming wildlife photography.",
  },
  {
    id: "bamboo-sky",
    pexelsId: 8803722,
    width: 3071,
    height: 4606,
    credit: "Manuel Torres Garcia",
    prompt:
      "Low-angle view of a bamboo grove rising toward a bright blue sky, tall stalks converging. Fresh green light. Calm, upward-looking nature photography.",
  },
  {
    id: "rooftop-sunset",
    pexelsId: 17066972,
    width: 4000,
    height: 6000,
    credit: "Aditya Thakur",
    prompt:
      "A dramatic sunset blazing over city rooftops, clouds lit orange and violet. Silhouetted skyline, vivid colour. Cinematic urban landscape photography.",
  },
  {
    id: "sun-conure",
    pexelsId: 11615619,
    width: 3456,
    height: 5184,
    credit: "Rutpratheep Nilpechr",
    prompt:
      "A vivid orange and yellow parrot perched on a tree branch, green foliage blurred behind. Soft natural light, saturated colour. Cheerful bird photography.",
  },
  {
    id: "chess-king",
    pexelsId: 4576332,
    width: 4000,
    height: 6000,
    credit: "Nothing Ahead",
    prompt:
      "A wooden chess king piece standing alone against a deep black background, a single soft light on its carved crown. Moody, minimal, symbolic still-life photography.",
  },
  {
    id: "night-street-food",
    pexelsId: 25792576,
    width: 4000,
    height: 6000,
    credit: "Nguyễn Hoàng Văn",
    prompt:
      "An illuminated street food stall at night, steam and warm light spilling onto a busy sidewalk. Neon glow, lively atmosphere. Authentic travel street photography.",
  },
  {
    id: "fireworks",
    pexelsId: 27530262,
    width: 4000,
    height: 6000,
    credit: "Violetta B",
    prompt:
      "Bursts of fireworks blooming across a dark night sky in streaks of gold and red. Long exposure, glowing trails. Festive celebration photography.",
  },
  {
    id: "misty-boat",
    pexelsId: 35222965,
    width: 4128,
    height: 6192,
    credit: "Lorenzo Manera",
    prompt:
      "A yellow rowboat moored on a still misty lake at sunrise, soft pastel fog all around. Calm reflections, gentle light. Serene, minimal landscape photography.",
  },
  {
    id: "watermelon-slices",
    pexelsId: 5460885,
    width: 3676,
    height: 5514,
    credit: "Aldrich",
    prompt:
      "Top view of red and yellow watermelon slices on a wooden surface scattered with small flowers. Bright natural light, juicy colour. Summery food flat lay photography.",
  },
  {
    id: "red-light-portrait",
    pexelsId: 33219320,
    width: 2190,
    height: 2738,
    credit: "Allan Carvalho",
    prompt:
      "Moody portrait of a bearded man lit by a single red accent light in a dark room. Deep shadows, intense gaze. Cinematic, dramatic portrait photography.",
  },
  {
    id: "succulent-hand",
    pexelsId: 9082133,
    width: 5760,
    height: 8640,
    credit: "Deeana Arts 🇵🇷",
    prompt:
      "A hand holding a cluster of small succulent plants outdoors, rosettes in soft greens and pinks. Natural light, shallow depth of field. Fresh, botanical lifestyle photography.",
  },
  {
    id: "marbled-paint",
    pexelsId: 3952705,
    width: 3024,
    height: 4032,
    credit: "Diana ✨",
    prompt:
      "Abstract marbled paint swirling in orange, blue and green, like liquid agate. Even light, glossy texture. Vibrant abstract background.",
  },
  {
    id: "butterfly-zinnia",
    pexelsId: 32411630,
    width: 2911,
    height: 3639,
    credit: "Phong Min",
    prompt:
      "A bright orange butterfly perched on a vivid red zinnia in a blooming garden. Soft natural light, creamy background blur. Delicate nature macro photography.",
  },
  {
    id: "tea-pour",
    pexelsId: 34229838,
    width: 2651,
    height: 3977,
    credit: "Jahra Tasfia Reza",
    prompt:
      "Tea being poured into a cup, steam curling up in soft morning window light. Warm browns, quiet mood. Cosy lifestyle photography.",
  },
  {
    id: "sea-cliff-climber",
    pexelsId: 33499527,
    width: 2803,
    height: 4204,
    credit: "Lorenzo Castellino",
    prompt:
      "A climber scaling a rocky cliff high above the ocean, chalked hands gripping the stone. Bright daylight, sense of height. Adventure sports photography.",
  },
  {
    id: "fine-plating",
    pexelsId: 27774175,
    width: 4160,
    height: 5200,
    credit: "Leonardo Aquino",
    prompt:
      "An exquisitely plated vegetarian dish garnished with fresh herbs on a rustic plate. Soft natural light, refined composition. Fine-dining food photography.",
  },
  {
    id: "albino-deer",
    pexelsId: 5839149,
    width: 4000,
    height: 6000,
    credit: "Connor Martin",
    prompt:
      "A white albino deer resting on fallen autumn leaves in a quiet forest. Soft warm light, rich russet tones. Rare, serene wildlife photography.",
  },
];

/**
 * A catalog in the shape the Templates canvas reads: card and viewer sizes of
 * the same photo, plus the shape the card reserves while it loads. A design
 * template is drawn at its design's format instead of the photo's — see
 * designTemplates.js — and carries the label its card shows.
 */
const RATIO_ASPECT = { square: "1 / 1", portrait: "9 / 16" };

const shape = (catalog, formatLabels = {}) =>
  catalog.map((entry) => ({
    ...entry,
    thumb: pexels(entry.pexelsId, entry.design ? 900 : 600),
    image: pexels(entry.pexelsId, 1600),
    source: `https://www.pexels.com/photo/${entry.pexelsId}/`,
    aspect: entry.design
      ? RATIO_ASPECT[entry.design.format]
      : `${entry.width} / ${entry.height}`,
    formatLabel: entry.design ? formatLabels[entry.design.format] : null,
  }));

export const TEXT_TO_IMAGE_TEMPLATES = shape(CATALOG);

export const SOCIAL_DESIGN_TEMPLATES = shape(SOCIAL_CATALOG, {
  square: "Feed post · 1:1",
  portrait: "Story · 9:16",
});

export const AD_DESIGN_TEMPLATES = shape(AD_CATALOG, {
  square: "Feed ad · 1:1",
  portrait: "Story ad · 9:16",
});

/**
 * Which tools have a Templates canvas. Text to Image and Stock Image share the
 * photo catalog; Social and Ads each get designs of their own kind — a tool not
 * listed here opens on Create as it always has.
 */
const TEMPLATES_BY_TOOL = {
  text_to_image: TEXT_TO_IMAGE_TEMPLATES,
  "image-design": TEXT_TO_IMAGE_TEMPLATES,
  "social-design": SOCIAL_DESIGN_TEMPLATES,
  "ad-design": AD_DESIGN_TEMPLATES,
};

/** The templates for a tool, or null when it has none. */
export const templatesFor = (toolId) => TEMPLATES_BY_TOOL[toolId] || null;
