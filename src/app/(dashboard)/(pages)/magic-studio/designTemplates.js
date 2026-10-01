/**
 * designTemplates.js
 * ─────────────────────────────────────────────────────────────────────────────
 * The Templates canvas for Social Design and Ads Design — finished-looking
 * designs rather than bare photos. Each is a Pexels photo with the design's
 * copy laid over it in HTML (see TemplateDesign.jsx), so the card reads as a
 * feed post or an ad, and its prompt asks for the whole design — the copy
 * included — not just the picture behind it.
 *
 * Shaped and exposed through textToImageTemplates.js, which owns the Pexels
 * URLs and the tool → templates map; this file is only the two catalogs.
 *
 * ── The `design` block ───────────────────────────────────────────────────────
 *   format    a Text to Image `ratio` value — "square" (1:1) or "portrait"
 *             (9:16). The card is drawn at that shape, and Use sets the
 *             composer's Aspect ratio to it, so what you make matches what you
 *             picked.
 *   layout    where the copy sits — "top" | "bottom" | "center". Pick the side
 *             of the photo with the empty space in it.
 *   theme     "dark" (white copy on a dark scrim) or "light" (dark copy on a
 *             pale one) — whichever the photo's empty space already is.
 *   font      "sans" | "serif".
 *   accent    the eyebrow and CTA colour.
 *   eyebrow, headline, body, cta, badge, handle — all optional except headline.
 *
 * ⚠️ PROMPTS STAY UNDER 500 CHARACTERS — the composer's maxLength. A longer one
 * is cut off silently when Use drops it in.
 *
 * Same rule as the stock catalog: no brand, logo or franchise in frame. The
 * copy uses placeholders ("@yourbrand") for the same reason.
 */

export const SOCIAL_CATALOG = [
  {
    id: "social-smoothie-recipe",
    pexelsId: 7937338,
    width: 4000,
    height: 6000,
    credit: "Nicola Barts",
    design: {
      format: "square",
      layout: "top",
      theme: "dark",
      font: "sans",
      accent: "#fde047",
      eyebrow: "New recipe",
      headline: "Breakfast that loves you back",
      handle: "@yourbrand",
    },
    prompt:
      "Square social media post for a healthy food brand. Top-down shot of a pink smoothie bowl topped with strawberries, coconut flakes and pumpkin seeds on a sage linen cloth. Small yellow caps 'NEW RECIPE' and a bold white headline 'Breakfast that loves you back' across the top, '@yourbrand' at the bottom. Fresh, bright, feed-ready.",
  },
  {
    id: "social-podcast-episode",
    pexelsId: 31236088,
    width: 4672,
    height: 7008,
    credit: "Alpha En",
    design: {
      format: "portrait",
      layout: "bottom",
      theme: "dark",
      font: "sans",
      accent: "#f97316",
      eyebrow: "Episode 24",
      headline: "Building a brand people remember",
      cta: "Listen now",
    },
    prompt:
      "Vertical 9:16 story announcing a new podcast episode. A studio microphone on a boom arm against a warm amber wall, soft and moody. Orange caps 'EPISODE 24', a bold white headline 'Building a brand people remember' and an orange 'Listen now' button stacked at the bottom. Modern, minimal, creator-style.",
  },
  {
    id: "social-yoga-ritual",
    pexelsId: 5928334,
    width: 3996,
    height: 5994,
    credit: "Tima Miroshnichenko",
    design: {
      format: "portrait",
      layout: "top",
      theme: "light",
      font: "serif",
      accent: "#0f766e",
      eyebrow: "Morning ritual",
      headline: "Slow mornings, strong days.",
      body: "Join our sunrise flow every Saturday.",
    },
    prompt:
      "Vertical 9:16 wellness story. A woman holding a warrior yoga pose on a beach mat at sunrise, pale peach sky and calm sea behind her. Teal caps 'MORNING RITUAL', an elegant dark serif headline 'Slow mornings, strong days.' and a short line 'Join our sunrise flow every Saturday.' in the soft sky at the top. Calm, airy, premium.",
  },
  {
    id: "social-focus-tips",
    pexelsId: 7657401,
    width: 4943,
    height: 7411,
    credit: "Cup of Couple",
    design: {
      format: "square",
      layout: "top",
      theme: "light",
      font: "sans",
      accent: "#2563eb",
      eyebrow: "Save for later",
      headline: "5 habits of a focused workday",
      body: "Swipe for the full list →",
    },
    prompt:
      "Square carousel cover post for a productivity account. Clean top-down desk on white: open notebook with a pencil, a laptop corner and a cup of black coffee. Blue caps 'SAVE FOR LATER', a bold black headline '5 habits of a focused workday' and 'Swipe for the full list →' in the white space at the top. Minimal, crisp, editorial.",
  },
  {
    id: "social-travel-story",
    pexelsId: 30363407,
    width: 4000,
    height: 6000,
    credit: "Du Tử Mộng",
    design: {
      format: "portrait",
      layout: "top",
      theme: "dark",
      font: "serif",
      accent: "#fef3c7",
      eyebrow: "Travel diaries",
      headline: "Where the sea meets slow living",
      cta: "Read the guide",
    },
    prompt:
      "Vertical 9:16 travel story. A woman in a white sun hat sitting on volcanic rocks above a turquoise cove, gentle waves on the shore. Cream caps 'TRAVEL DIARIES', a white serif headline 'Where the sea meets slow living' and a cream 'Read the guide' button over the open sea at the top. Dreamy, sunlit, wanderlust.",
  },
  {
    id: "social-brunch-event",
    pexelsId: 31688609,
    width: 4000,
    height: 6000,
    credit: "Salih Deniz",
    design: {
      format: "square",
      layout: "bottom",
      theme: "dark",
      font: "serif",
      accent: "#fbbf24",
      eyebrow: "This Sunday · 10am",
      headline: "Weekend brunch is back",
      handle: "@yourcafe",
    },
    prompt:
      "Square social post announcing a cafe event. An outdoor brunch table with glasses of tea, pastries and a wildflower centerpiece, warm daylight. Amber caps 'THIS SUNDAY · 10AM' and a large white serif headline 'Weekend brunch is back' over a dark fade at the bottom, '@yourcafe' beneath. Inviting, warm, lifestyle.",
  },
  {
    id: "social-sunset-quote",
    pexelsId: 10954772,
    width: 3413,
    height: 5119,
    credit: "Nikita Korchagin",
    design: {
      format: "portrait",
      layout: "center",
      theme: "dark",
      font: "serif",
      accent: "#fdba74",
      headline: "“Begin anywhere.”",
      body: "Monday motivation",
      handle: "@yourbrand",
    },
    prompt:
      "Vertical 9:16 quote story. A silhouette with arms raised at the water's edge, the sun setting in a deep orange sky and reflected in the wet sand, birds overhead. A large centred white serif quote '“Begin anywhere.”' with a small 'Monday motivation' under it and '@yourbrand' at the bottom. Inspiring, cinematic.",
  },
  {
    id: "social-latte-menu",
    pexelsId: 20350467,
    width: 3888,
    height: 5184,
    credit: "Studio Saiz",
    design: {
      format: "square",
      layout: "bottom",
      theme: "dark",
      font: "serif",
      accent: "#fcd34d",
      eyebrow: "New on the menu",
      headline: "Honey oat latte",
      handle: "@yourcafe",
    },
    prompt:
      "Square cafe social post. Close-up of a latte with delicate leaf foam art in a white cup against a warm amber background. Honey-gold caps 'NEW ON THE MENU' and a large white serif headline 'Honey oat latte' over a soft dark fade at the bottom, '@yourcafe' beneath. Cosy, warm, inviting.",
  },
  {
    id: "social-strength-challenge",
    pexelsId: 4754001,
    width: 2832,
    height: 4240,
    credit: "cottonbro studio",
    design: {
      format: "portrait",
      layout: "bottom",
      theme: "dark",
      font: "sans",
      accent: "#a3e635",
      eyebrow: "Starts Monday",
      headline: "30-day strength challenge",
      cta: "Join free",
    },
    prompt:
      "Vertical 9:16 fitness story. Low angle of a woman gripping a pair of dumbbells on a dark wooden gym floor, moody side light. Lime caps 'STARTS MONDAY', a heavy white headline '30-day strength challenge' and a lime 'Join free' button at the bottom. Gritty, energetic, motivational.",
  },
  {
    id: "social-plant-care",
    pexelsId: 8600800,
    width: 4815,
    height: 7214,
    credit: "Lucas Oliveira",
    design: {
      format: "square",
      layout: "center",
      theme: "light",
      font: "sans",
      accent: "#15803d",
      eyebrow: "Plant care 101",
      headline: "Keep them alive this winter",
      body: "6 tips inside →",
    },
    prompt:
      "Square carousel cover for a plant shop. Floating white shelves with small potted plants against a soft cream wall, gentle daylight. A white rounded panel in the centre with green caps 'PLANT CARE 101', a bold dark headline 'Keep them alive this winter' and '6 tips inside →'. Fresh, calm, helpful.",
  },
  {
    id: "social-reading-list",
    pexelsId: 13968194,
    width: 4160,
    height: 6240,
    credit: "hello aesthe",
    design: {
      format: "portrait",
      layout: "center",
      theme: "light",
      font: "serif",
      accent: "#c2410c",
      eyebrow: "This month",
      headline: "Our autumn reading list",
      body: "Five books for slow evenings",
    },
    prompt:
      "Vertical 9:16 story for a bookshop. Cosy autumn flat lay of open vintage books, dried orange slices and a cup of coffee on a knitted blanket. A cream rounded panel in the centre with burnt-orange caps 'THIS MONTH', a serif headline 'Our autumn reading list' and 'Five books for slow evenings'. Warm, nostalgic.",
  },
  {
    id: "social-happy-hour",
    pexelsId: 36366519,
    width: 4597,
    height: 6896,
    credit: "Mediha Ekici",
    design: {
      format: "portrait",
      layout: "top",
      theme: "dark",
      font: "serif",
      accent: "#f0abfc",
      eyebrow: "Every Friday",
      headline: "Happy hour, 5–7pm",
      body: "Half-price cocktails at the bar.",
    },
    prompt:
      "Vertical 9:16 bar story. Three colourful cocktails on a glossy black table in front of a deep green velvet curtain, moody spotlight. Pink caps 'EVERY FRIDAY', a white serif headline 'Happy hour, 5–7pm' and 'Half-price cocktails at the bar.' at the top. Sultry, stylish nightlife.",
  },
  {
    id: "social-just-listed",
    pexelsId: 19344325,
    width: 2080,
    height: 3120,
    credit: "Mido Makasardi",
    design: {
      format: "square",
      layout: "bottom",
      theme: "dark",
      font: "sans",
      accent: "#38bdf8",
      eyebrow: "Just listed",
      headline: "3 bed · 2 bath · Garden",
      cta: "Book a viewing",
    },
    prompt:
      "Square real estate post. A bright modern white house with large black-framed windows under a clear blue sky. Sky-blue caps 'JUST LISTED', a bold white headline '3 bed · 2 bath · Garden' and a sky-blue 'Book a viewing' button over a dark fade at the bottom. Clean, aspirational property marketing.",
  },
  {
    id: "social-fresh-bread",
    pexelsId: 9482666,
    width: 6336,
    height: 9504,
    credit: "Skyler Ewing",
    design: {
      format: "square",
      layout: "top",
      theme: "dark",
      font: "serif",
      accent: "#fdba74",
      eyebrow: "Out of the oven",
      headline: "Baked fresh at 6am",
      handle: "@yourbakery",
    },
    prompt:
      "Square bakery social post. A crusty artisan sourdough loaf resting on linen on a floured dark surface, warm side light. Peach caps 'OUT OF THE OVEN' and a white serif headline 'Baked fresh at 6am' at the top, '@yourbakery' at the bottom. Rustic, warm, handmade.",
  },
  {
    id: "social-adoption-day",
    pexelsId: 35864648,
    width: 2000,
    height: 3000,
    credit: "Lucas Gramatica",
    design: {
      format: "square",
      layout: "top",
      theme: "dark",
      font: "sans",
      accent: "#fde047",
      eyebrow: "This Saturday",
      headline: "Adoption day — come say hi",
      cta: "Meet the dogs",
    },
    prompt:
      "Square animal shelter post. Two happy golden dogs lying on a sunny lawn, tongues out, soft blue-green sky behind. Yellow caps 'THIS SATURDAY', a bold white headline 'Adoption day — come say hi' and a yellow 'Meet the dogs' button at the top. Joyful, warm, community feel.",
  },
];

export const AD_CATALOG = [
  {
    id: "ad-sneaker-sale",
    pexelsId: 39525839,
    width: 3789,
    height: 5684,
    credit: "Valentin Ivantsov",
    design: {
      format: "square",
      layout: "top",
      theme: "light",
      font: "sans",
      accent: "#dc2626",
      eyebrow: "Summer drop",
      headline: "Step into summer",
      cta: "Shop now",
      badge: "-30%",
    },
    prompt:
      "Square ad for a sneaker store. A pair of white leather sneakers with red stripes on a backdrop of bright overlapping paper sheets. Red caps 'SUMMER DROP', a bold black headline 'Step into summer', a red 'Shop now' button and a round red '-30%' badge in the top corner. Playful, colourful, high-energy retail ad.",
  },
  {
    id: "ad-perfume-launch",
    pexelsId: 35825554,
    width: 3264,
    height: 4454,
    credit: "Mira Fialkova",
    design: {
      format: "portrait",
      layout: "top",
      theme: "light",
      font: "serif",
      accent: "#881337",
      eyebrow: "The new fragrance",
      headline: "Bloom",
      body: "Rose, amber and a little mischief.",
      cta: "Discover",
    },
    prompt:
      "Vertical 9:16 ad launching a fragrance. A glass perfume bottle with rose-red liquid and a chrome cap lying on a dusty pink surface, soft shadow. Wine-red caps 'THE NEW FRAGRANCE', an elegant serif headline 'Bloom', the line 'Rose, amber and a little mischief.' and a 'Discover' button at the top. Luxurious, minimal, beauty ad.",
  },
  {
    id: "ad-sunglasses-price",
    pexelsId: 5465834,
    width: 4000,
    height: 6000,
    credit: "Geovane Souza",
    design: {
      format: "square",
      layout: "bottom",
      theme: "dark",
      font: "sans",
      accent: "#f97316",
      eyebrow: "Summer shades",
      headline: "From $29",
      cta: "Shop the edit",
    },
    prompt:
      "Square ad for an eyewear brand. Round silver-framed sunglasses on a split red-orange and pale grey background, crisp studio light. Orange caps 'SUMMER SHADES', a huge bold white price 'From $29' and an orange 'Shop the edit' button over a dark fade at the bottom. Bold, graphic, fashion retail ad.",
  },
  {
    id: "ad-pizza-deal",
    pexelsId: 12529119,
    width: 4127,
    height: 4690,
    credit: "Sharan Pagadala",
    design: {
      format: "square",
      layout: "bottom",
      theme: "dark",
      font: "sans",
      accent: "#facc15",
      eyebrow: "Every Tuesday",
      headline: "2 for 1 pizza",
      cta: "Order now",
    },
    prompt:
      "Square food delivery ad. Top-down shot of a freshly sliced loaded pizza on a round wooden board, a hand lifting a slice with a server. Yellow caps 'EVERY TUESDAY', a chunky white headline '2 for 1 pizza' and a yellow 'Order now' button over a dark fade at the bottom. Appetising, punchy, fast-food promo.",
  },
  {
    id: "ad-headphones-preorder",
    pexelsId: 7772548,
    width: 3544,
    height: 5316,
    credit: "Caleb Oquendo",
    design: {
      format: "portrait",
      layout: "top",
      theme: "light",
      font: "sans",
      accent: "#111827",
      eyebrow: "Wireless · 40h battery",
      headline: "Hear every detail",
      cta: "Pre-order",
    },
    prompt:
      "Vertical 9:16 tech product ad. A pair of matte black wireless headphones resting on a seamless white studio background, soft shadow, lots of clean space above. Grey caps 'WIRELESS · 40H BATTERY', a bold black headline 'Hear every detail' and a black 'Pre-order' button at the top. Premium, minimal, Scandinavian tech ad.",
  },
  {
    id: "ad-candle-offer",
    pexelsId: 7004671,
    width: 3640,
    height: 5461,
    credit: "Vie Studio",
    design: {
      format: "portrait",
      layout: "top",
      theme: "dark",
      font: "serif",
      accent: "#fde68a",
      eyebrow: "Hand-poured soy",
      headline: "Calm, in a jar",
      body: "20% off your first order",
      cta: "Shop candles",
    },
    prompt:
      "Vertical 9:16 ad for a candle brand. A lit soy candle in an amber glass jar beside dried lavender on a dusty mauve surface, a wisp of smoke. Gold caps 'HAND-POURED SOY', a white serif headline 'Calm, in a jar', '20% off your first order' and a 'Shop candles' button at the top. Cosy, calm, artisan ad.",
  },
  {
    id: "ad-lipstick-shades",
    pexelsId: 7256154,
    width: 3866,
    height: 5800,
    credit: "DS stories",
    design: {
      format: "portrait",
      layout: "center",
      theme: "light",
      font: "serif",
      accent: "#be185d",
      eyebrow: "12 new shades",
      headline: "Find your nude",
      cta: "Shop the collection",
    },
    prompt:
      "Vertical 9:16 beauty ad. Rows of nude-pink lipsticks in black cases laid in a neat pattern on a pastel pink background. A soft pink panel in the centre with magenta caps '12 NEW SHADES', an elegant serif headline 'Find your nude' and a magenta 'Shop the collection' button. Clean, feminine, cosmetics ad.",
  },
  {
    id: "ad-juice-cold-pressed",
    pexelsId: 5946778,
    width: 3360,
    height: 5040,
    credit: "Charlotte May",
    design: {
      format: "portrait",
      layout: "top",
      theme: "dark",
      font: "sans",
      accent: "#fb923c",
      eyebrow: "Cold-pressed",
      headline: "Nothing added. Ever.",
      cta: "Try a 6-pack",
    },
    prompt:
      "Vertical 9:16 drinks ad. A hand holding up a glass bottle of fresh orange juice against a blurred wall of green leaves, bright natural light. Orange caps 'COLD-PRESSED', a bold white headline 'Nothing added. Ever.' and an orange 'Try a 6-pack' button at the top. Fresh, vibrant, healthy beverage ad.",
  },
  {
    id: "ad-handbags-shipping",
    pexelsId: 36367484,
    width: 3639,
    height: 5459,
    credit: "Valentin Ivantsov",
    design: {
      format: "square",
      layout: "top",
      theme: "light",
      font: "serif",
      accent: "#78350f",
      eyebrow: "New season",
      headline: "Carry it all, beautifully",
      cta: "Free shipping",
    },
    prompt:
      "Square fashion ad. Two leather tote bags, taupe and powder blue, standing side by side on a clean white studio background. Brown caps 'NEW SEASON', an elegant dark serif headline 'Carry it all, beautifully' and a brown 'Free shipping' button in the white space at the top. Refined, minimal, accessories ad.",
  },
  {
    id: "ad-serum-glow",
    pexelsId: 3762879,
    width: 4912,
    height: 7360,
    credit: "Shiny Diamond",
    design: {
      format: "portrait",
      layout: "top",
      theme: "light",
      font: "serif",
      accent: "#9a3412",
      eyebrow: "Vitamin C serum",
      headline: "Glow in 7 days",
      body: "Or your money back.",
      cta: "Shop now",
    },
    prompt:
      "Vertical 9:16 skincare ad. A hand releasing a drop of serum from a gold dropper into an open palm against a smooth peach background. Rust caps 'VITAMIN C SERUM', an elegant serif headline 'Glow in 7 days', 'Or your money back.' and a rust 'Shop now' button at the top. Soft, radiant beauty ad.",
  },
  {
    id: "ad-coffee-subscription",
    pexelsId: 16682442,
    width: 4000,
    height: 5328,
    credit: "Navid Sohrabi",
    design: {
      format: "square",
      layout: "top",
      theme: "dark",
      font: "sans",
      accent: "#fbbf24",
      eyebrow: "Coffee subscription",
      headline: "Fresh roast, at your door",
      cta: "First bag free",
    },
    prompt:
      "Square ad for a coffee subscription. Dark roasted coffee beans scattered across a matte charcoal surface, dramatic low light. Amber caps 'COFFEE SUBSCRIPTION', a bold white headline 'Fresh roast, at your door' and an amber 'First bag free' button at the top. Rich, moody, premium.",
  },
  {
    id: "ad-burger-combo",
    pexelsId: 23091813,
    width: 2310,
    height: 4096,
    credit: "Elvira Kushcheva",
    design: {
      format: "portrait",
      layout: "bottom",
      theme: "dark",
      font: "sans",
      accent: "#ef4444",
      eyebrow: "Lunch combo",
      headline: "Burger + fries $9.99",
      cta: "Order now",
      badge: "NEW",
    },
    prompt:
      "Vertical 9:16 fast-food ad. Top-down view of two juicy burgers and crispy fries with ketchup on a dark tray. A round red 'NEW' badge in the top corner; red caps 'LUNCH COMBO', a chunky white headline 'Burger + fries $9.99' and a red 'Order now' button over a dark fade at the bottom. Bold, hungry, punchy.",
  },
  {
    id: "ad-ice-cream-bogo",
    pexelsId: 16962446,
    width: 6336,
    height: 7920,
    credit: "Ali Dashti",
    design: {
      format: "square",
      layout: "top",
      theme: "dark",
      font: "sans",
      accent: "#fef08a",
      eyebrow: "Weekends only",
      headline: "Buy one, get one free",
      cta: "Find a store",
    },
    prompt:
      "Square dessert ad. A vanilla soft-serve in a waffle cone standing on an orange table against a deep red background. Pale yellow caps 'WEEKENDS ONLY', a bold white headline 'Buy one, get one free' and a pale yellow 'Find a store' button at the top. Playful, retro, summery.",
  },
  {
    id: "ad-brush-set",
    pexelsId: 22481931,
    width: 4640,
    height: 6528,
    credit: "Nerea Martinez",
    design: {
      format: "portrait",
      layout: "top",
      theme: "light",
      font: "sans",
      accent: "#db2777",
      eyebrow: "Pro brush set",
      headline: "Every brush you need",
      cta: "Shop the set",
      badge: "-40%",
    },
    prompt:
      "Vertical 9:16 cosmetics ad. A fan of colourful makeup brushes lying on a clean white background, soft shadows. A round pink '-40%' badge in the corner; pink caps 'PRO BRUSH SET', a bold black headline 'Every brush you need' and a pink 'Shop the set' button at the top. Bright, clean beauty ad.",
  },
  {
    id: "ad-home-gym",
    pexelsId: 35567437,
    width: 4000,
    height: 6000,
    credit: "DAVE GARCIA",
    design: {
      format: "square",
      layout: "bottom",
      theme: "dark",
      font: "sans",
      accent: "#22d3ee",
      eyebrow: "Home gym sale",
      headline: "Train anywhere",
      cta: "Up to 50% off",
    },
    prompt:
      "Square fitness equipment ad. A close-up row of black dumbbells on a gym rack, hard light glinting on the metal. Cyan caps 'HOME GYM SALE', a heavy white headline 'Train anywhere' and a cyan 'Up to 50% off' button over a dark fade at the bottom. Strong, gritty, sporty.",
  },
];
