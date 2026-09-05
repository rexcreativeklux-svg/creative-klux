/**
 * PRODUCT_VIDEO_TEMPLATES — the clip catalog behind Product Video's template
 * picker.
 *
 * A template is a ready-made product-VIDEO look. Picking one fills the prompt
 * box with its `prompt` — a shot description of the clip on the tile — and the
 * user edits it from there.
 *
 * ── Why these are PINNED clips and not a search ─────────────────────────────
 * This shelf used to run a live Pexels search on every open. That was fine
 * while a template was only an id: any clip matching "elegant dress" was as
 * good as any other. It stopped being fine the moment each tile also carried a
 * written prompt, because a prompt only means anything if it describes the
 * exact clip above it — and a search result reshuffles every session, so the
 * tile and its description would drift apart within a day.
 *
 * So every entry pins ONE reviewed clip. No fetch, no API quota, no loading
 * state, and the picker renders identically offline.
 *
 * ── How the prompts were written ────────────────────────────────────────────
 * Each clip was downloaded and sampled into a contact sheet spanning its whole
 * length, so the prompt describes the ARC of the shot (how it starts, what
 * moves, where it ends) rather than just the poster frame. Each was then
 * re-checked against the same frames by a second reviewer whose brief was to
 * find anything the description claimed that the clip does not actually do.
 *
 * Every prompt names, in this order: the product's placement and framing, the
 * surface and backdrop, the lighting, the camera move, the other motion in the
 * scene, and the mood — those are the levers a video model responds to. They
 * deliberately say "the product" and never name the item in the stock clip: the
 * USER's product is what gets animated, and "a perfume bottle" in the prompt
 * fights their sneaker.
 *
 * ── ⚠️ `src` must be a REAL Pexels file URL, copied whole ───────────────────
 * Unlike the photo helpers in constants.js, a Pexels VIDEO url cannot be built
 * from the id: the filename carries an internal file id plus the resolution and
 * fps (`.../video-files/<videoId>/<fileId>_720_1280_25fps.mp4`). There is no
 * pattern to derive, so both `src` and `poster` are stored verbatim. A guessed
 * URL 404s, and a <video> that 404s shows its poster forever with no error
 * anywhere — a tile that looks merely "still" rather than broken.
 *
 * ── Adding a template ───────────────────────────────────────────────────────
 * 1. Find a PORTRAIT clip on Pexels and note its numeric id. Portrait matters:
 *    the tiles are 3:4 and the tool's own sizes are square / 9:16 / 16:9, so a
 *    landscape clip letterboxes in the tile that is meant to sell it.
 * 2. `GET https://api.pexels.com/videos/videos/<id>` (Authorization:
 *    PEXELS_API_KEY, and send a browser User-Agent — Pexels answers 403 to the
 *    default python/curl agent) gives `image` (the poster) and `video_files`.
 *    Take the smallest mp4 at least 640px tall: the tile is ~100px wide in the
 *    row, so an HD master is bytes the browser throws away.
 * 3. Add an entry to its category block below with a unique `id`, a `name`, and
 *    a `prompt` written against that clip, following the rules above.
 * It appears in the row and the "See all" browser automatically.
 *
 * Clips are Pexels (free commercial license, no attribution required, stable
 * hotlinkable CDN URLs) — the same source the app already uses for the staging
 * templates and the Virtual Model backgrounds.
 */

// Tab order in the "See all" browser. This is only the ORDER — the tabs
// themselves are derived from the catalog below, so a category listed here with
// no templates never renders. That matters: a hand-maintained tab list is one
// deletion away from a tab that opens onto "No footwear templates right now",
// which reads as a broken feature rather than an empty category.
const CATEGORY_ORDER = [
  "Studio",
  "Luxury",
  "Beauty",
  "Fashion",
  "Footwear",
  "Tech",
  "Food & Drink",
  "Home",
  "Nature",
  "Bold",
];

// The catalog, grouped by category so the source stays readable and a new entry
// has an obvious home. Display order is NOT this order — see below.
const CATALOG = [
  // ── Studio ──────────────────────────────────────────────────────────────
  {
    id: "porcelain_ledge",
    name: "Porcelain Ledge",
    category: "Studio",
    pexelsId: 7316385,
    seconds: 7.48,
    poster: "https://images.pexels.com/videos/7316385/pexels-photo-7316385.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/7316385/7316385-sd_360_640_25fps.mp4",
    // Slow push in with a lateral drift; the still grouping slides across frame and grows, nothing else moves.
    prompt:
      "The product sits among plain white unlabelled jars, pump bottles and a small frosted dropper vial on a glossy dark red-brown wood ledge, viewed slightly from above. A cream wall and pale panel edge fill the soft-focus background under even diffused light with gentle shadows. The camera pushes in slowly while drifting sideways and rising, the still grouping sliding low across frame as it grows. Calm minimal photorealistic product commercial, subtle depth of field.",
  },
  {
    id: "crimson_peony_podium",
    name: "Crimson Peony Podium",
    category: "Studio",
    pexelsId: 8447656,
    seconds: 12.64,
    poster: "https://images.pexels.com/videos/8447656/pexels-photo-8447656.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/8447656/8447656-sd_338_640_25fps.mp4",
    // Slow steady push in toward the plinth; only the peonies stir faintly, the rest holds still.
    prompt:
      "The product sits on the flat top of a white matte plinth, small in frame beside a clear glass vase of white blooms, green stems visible through the water. A deep crimson seamless backdrop fills the space behind. Soft directional light casts a short shadow across the plinth. The camera pushes in slowly and steadily; everything else holds still. Photorealistic product commercial, soft falloff, rich saturated grade.",
  },
  {
    id: "monochrome_pink_pan",
    name: "Monochrome Pink Pan",
    category: "Studio",
    pexelsId: 8798160,
    seconds: 14.76,
    poster: "https://images.pexels.com/videos/8798160/pexels-photo-8798160.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/8798160/8798160-sd_338_640_25fps.mp4",
    // Slow lateral dolly right; the product glides out of frame left as pink props and a pot of carnations slide in from the right, set otherwise still.
    prompt:
      "The product sits left of frame on a pink tabletop against a seamless pink backdrop, lit by soft studio light with faint shadows. The camera makes a slow lateral dolly to the right, carrying the product out of frame while pink props slide in from the right: a folded towel, coiled cord, small bag, ceramic jars and a pot of carnations. Nothing else moves; playfully monochrome mood, photorealistic product commercial, soft pastel color grade.",
  },
  {
    id: "petal_ledge",
    name: "Petal Ledge",
    category: "Studio",
    pexelsId: 20535353,
    seconds: 6.13,
    poster: "https://images.pexels.com/videos/20535353/mini-muffins-20535353.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/20535353/20535353-sd_360_640_30fps.mp4",
    // Nearly static locked-off frame; only the fresh blooms tucked around the product tremble faintly.
    prompt:
      "The product stands left of center on a low white ledge, small in a tall, airy frame. A pale cool-grey cove rises behind, cut by a soft shadow-gap seam. Diffused light from the front left lays a tight shadow to the right. Yellow, lilac and purple blooms and a dark leaf are tucked into the product. Locked-off and near-static — nothing stirs but a barely-there downward drift. Photorealistic still life, cool clean grade.",
  },
  {
    id: "blush_hand_hold",
    name: "Blush Hand Hold",
    category: "Studio",
    pexelsId: 6612199,
    seconds: 17.28,
    poster: "https://images.pexels.com/videos/6612199/pexels-photo-6612199.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/6612199/6612199-sd_360_640_25fps.mp4",
    // Locked-off static frame; the hand drifts and tilts slightly, then lowers the product out of frame.
    prompt:
      "The product is held upright in a manicured hand entering from the lower right, just left of centre in a tall vertical frame against a plain dusty-pink seamless backdrop, a grey knit cuff visible below. Soft even light leaves one faint shadow. Locked-off camera: the hand drifts and tilts gently, then carries the product down out of frame, leaving the backdrop empty. Photorealistic product commercial, crisp focus, soft pastel grade.",
  },
  {
    id: "white_bag_reveal",
    name: "White Bag Reveal",
    category: "Studio",
    pexelsId: 9595331,
    seconds: 26.64,
    poster: "https://images.pexels.com/videos/9595331/accessories-adult-art-brand-9595331.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/9595331/9595331-sd_338_640_25fps.mp4",
    // Locked-off static frame; hands enter from above to straighten the gift bag, smooth its paper seal and lift the rope handles.
    prompt:
      "The product stands on a white tabletop, centred at eye level, with a plain white rope-handled shopping bag rising behind it against a soft warm grey backdrop. Light is bright and evenly diffused, shadows faint. A nearly static locked-off frame holds while hands in a pale sleeve reach down to straighten the bag, smooth its round paper seal, then gather and lift the handles. Calm, boutique, gift-ready, photorealistic product commercial, soft shadows, clean neutral grade.",
  },
  {
    id: "white_paper_flatlay",
    name: "White Paper Flatlay",
    category: "Studio",
    pexelsId: 6176563,
    seconds: 20.33,
    poster: "https://images.pexels.com/videos/6176563/pexels-photo-6176563.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/6176563/6176563-sd_338_640_30fps.mp4",
    // Slow overhead push in; hands reach in early to turn a blank page, then leave the frame still.
    prompt:
      "Shot from directly overhead, the product sits centered on a pale off-white paper surface, ringed by minimal white stationery — a blank spiral pad, two slim white pencils, a small pale eraser. Broad, diffused light keeps shadows faint and the palette tonal. The camera pushes in slowly throughout; early on two hands enter from the bottom, turn a blank page, then withdraw, leaving the set still. Calm, minimal, photorealistic product commercial, clean white-on-white grade.",
  },
  {
    id: "charcoal_flat_lay",
    name: "Charcoal Flat Lay",
    category: "Studio",
    pexelsId: 6374585,
    seconds: 29.93,
    poster: "https://images.pexels.com/videos/6374585/pexels-photo-6374585.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/6374585/6374585-sd_338_640_30fps.mp4",
    // Nearly static locked-off overhead frame; only the light and sheen shift slowly across the dark paper.
    prompt:
      "The product sits centered and small in a top-down frame, surrounded by a wide expanse of dark charcoal paper. Soft overhead light falls evenly across it, raising a faint sheen on the paper grain and letting the corners fall into shadow. The camera holds a nearly static locked-off frame, with only the faintest drift and a slow shift in the light across the background, quiet and minimal, photorealistic product commercial, crisp edges, moody neutral grade.",
  },
  {
    id: "blush_gift_stage",
    name: "Blush Gift Stage",
    category: "Studio",
    pexelsId: 7316101,
    seconds: 9.28,
    poster: "https://images.pexels.com/videos/7316101/pexels-photo-7316101.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/7316101/7316101-sd_360_640_25fps.mp4",
    // Very slow push in with a faint downward drift; the set is otherwise completely still.
    prompt:
      "The product stands centered in the lower half of a tall vertical frame, a red paper gift bag with looped red ribbon handles rising directly behind it. The floor and stepped block risers are pale blush pink, lit by soft even diffusion that casts short gentle shadows. The camera holds a very slow push in, drifting almost imperceptibly downward. Nothing else moves; calm, festive retail stillness, photorealistic product commercial, soft shadows, clean pastel color grade.",
  },
  {
    id: "lilac_hand_hold",
    name: "Lilac Hand Hold",
    category: "Studio",
    pexelsId: 8166027,
    seconds: 16.28,
    poster: "https://images.pexels.com/videos/8166027/pexels-photo-8166027.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/8166027/8166027-sd_338_640_25fps.mp4",
    // Nearly static locked-off frame; the held product drifts slightly while a second hand enters from below to point at it, then leaves.
    prompt:
      "The product is held upright in a hand at the center of a vertical frame, a white sweatshirt cuff at the wrist, against a soft pink-to-lilac gradient backdrop. The light is even and shadowless with a gentle vignette. A nearly static locked-off frame, the hand drifting slightly as a second hand rises from below to point at the product, then withdraws. Clean and friendly, photorealistic product commercial, soft studio light.",
  },
  {
    id: "white_wall_hold",
    name: "White Wall Hold",
    category: "Studio",
    pexelsId: 4443546,
    seconds: 5.05,
    poster: "https://images.pexels.com/videos/4443546/detox-fruits-healthy-juice-4443546.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/4443546/4443546-sd_360_640_20fps.mp4",
    // Nearly static locked-off frame; the hand lowers a little and the product sways gently against the wall.
    prompt:
      "The product hangs from a hand reaching in from the top of frame, pinched by its cap high above open space below. Behind it a plain white wall, faintly textured, catches a soft grey shadow. The light is diffused and even, keeping tones pale. The camera holds a nearly static locked-off frame while the arm lowers slightly and the product sways gently, calm and minimal, photorealistic product commercial, clean studio grade, crisp edge detail.",
  },
  {
    id: "sheer_white_ledge",
    name: "Sheer White Ledge",
    category: "Studio",
    pexelsId: 4884238,
    seconds: 10.77,
    poster: "https://images.pexels.com/videos/4884238/app-back-background-banner-4884238.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/4884238/4884238-sd_360_640_30fps.mp4",
    // Slow push in with a gentle side-to-side drift; the product stays still on the ledge.
    prompt:
      "The product stands upright on a clean white ledge, framed tall with open space above it. Behind it a sheer white curtain hangs in soft vertical folds under a pale gradient of daylight. Light is bright, diffused and high-key, leaving only a faint shadow at the base. The camera makes a slow push in with a gentle lateral drift; nothing else moves. Minimal and calm, photorealistic product commercial, soft high-key grade, shallow depth of field.",
  },
  {
    id: "leaf_shadow_wall",
    name: "Leaf Shadow Wall",
    category: "Studio",
    pexelsId: 7213862,
    seconds: 11.17,
    poster: "https://images.pexels.com/videos/7213862/pexels-photo-7213862.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/7213862/7213862-sd_360_640_30fps.mp4",
    // Nearly static locked-off frame; only the blurred leaf shadows drift across the white wall behind.
    prompt:
      "The product stands upright and centered in a tall vertical frame against a bright white wall washed with soft, heavily defocused grey leaf shadows. Light is even and diffused, with only a faint shadow hugging the product's edge. The camera holds a nearly static locked-off frame with the faintest drift, while the blurred foliage shadows sway slowly across the wall behind. Calm minimal mood, photorealistic product commercial, crisp neutral grade, quiet monochrome palette.",
  },

  // ── Luxury ──────────────────────────────────────────────────────────────
  {
    id: "noir_pour",
    name: "Noir Pour",
    category: "Luxury",
    pexelsId: 7686959,
    seconds: 29.12,
    poster: "https://images.pexels.com/videos/7686959/pexels-photo-7686959.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/7686959/7686959-sd_360_640_24fps.mp4",
    // Nearly locked-off frame with a slow push in; a hand tilts a dark bottle in from upper right and a deep red stream pours down into frame.
    prompt:
      "The product stands centered on a glossy black tabletop against a pure black backdrop, hard rim light tracing its edges above a mirrored reflection. The camera is locked off. After an opening beat, a hand tilts a dark bottle in from the upper right and pours a ribbon of deep red liquid down into frame, which pools and slowly rises at the product's base. Moody theatrical packshot, photorealistic, low-key high-contrast lighting, glossy cinematic grade.",
  },
  {
    id: "dusty_rose_hands",
    name: "Dusty Rose Hands",
    category: "Luxury",
    pexelsId: 8184066,
    seconds: 7.34,
    poster: "https://images.pexels.com/videos/8184066/pexels-photo-8184066.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/8184066/8184066-sd_360_640_30fps.mp4",
    // Nearly static locked-off frame; the clasped hands slowly rotate and the fingers flex open, drifting gently across frame.
    prompt:
      "Two hands fill a tight vertical crop, fingers interlaced and lifted so the product is presented front and center against a soft mottled dusty-rose backdrop. Diffused studio light wraps the skin and catches warm metallic highlights. The camera stays locked off while the hands rotate slowly, fingers flexing open and extending upward, the pose drifting gently within frame. Elegant, quiet, tactile; photorealistic product commercial, gentle falloff, warm grade.",
  },
  {
    id: "sequin_drape",
    name: "Sequin Drape",
    category: "Luxury",
    pexelsId: 4863212,
    seconds: 13.87,
    poster: "https://images.pexels.com/videos/4863212/gold-sequins-textile-texture-4863212.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/4863212/4863212-sd_360_640_30fps.mp4",
    // Nearly static locked-off frame; the sequin drape sways faintly as sparkle glints travel across the folds.
    prompt:
      "The product stands centered in the lower third of a tight vertical frame, set against a floor-length curtain of champagne-gold sequin fabric that falls in soft swagged folds. Warm frontal light scatters off thousands of tiny sequins into pinpoint sparkle. The camera holds a nearly static frame with the faintest drift; only the fabric breathes and the glints shimmer across it. Glamorous, festive, opulent, photorealistic product commercial, crisp sequin texture, warm champagne color grade.",
  },
  {
    id: "atelier_hands",
    name: "Atelier Hands",
    category: "Luxury",
    pexelsId: 6263178,
    seconds: 7.64,
    poster: "https://images.pexels.com/videos/6263178/pexels-photo-6263178.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/6263178/6263178-sd_360_640_25fps.mp4",
    // Nearly static close-up easing down slightly while two hands slowly turn the product over the bench.
    prompt:
      "The product is held between the fingertips of two hands, centered in a tight vertical close-up above a worn fabric-wrapped bench pin, with blurred hanging tools fading into a dark workshop wall. One warm low key light grazes the skin. The frame stays nearly static, easing down as a second hand enters and the fingers slowly turn the product. Quiet artisanal mood, photorealistic macro product film, very shallow depth of field, moody warm grade.",
  },
  {
    id: "navy_hand_model",
    name: "Navy Hand Model",
    category: "Luxury",
    pexelsId: 6805433,
    seconds: 7.02,
    poster: "https://images.pexels.com/videos/6805433/pexels-photo-6805433.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/6805433/6805433-sd_360_640_30fps.mp4",
    // Locked-off vertical frame; the hand slowly rises and turns as fingers spread and settle.
    prompt:
      "The product is worn on a model's raised hand, centered in a tall frame against a deep navy backdrop that darkens toward the edges, a rust-orange ribbed knit sleeve cuffing the wrist below. Soft directional light rakes across the skin and catches the metal. A nearly static locked-off shot; only the hand moves, rising slightly and turning as the fingers spread and settle, photorealistic jewelry commercial, shallow depth of field, moody cool grade.",
  },
  {
    id: "black_satin_drape",
    name: "Black Satin Drape",
    category: "Luxury",
    pexelsId: 7677746,
    seconds: 9.72,
    poster: "https://images.pexels.com/videos/7677746/abstract-antique-art-background-7677746.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/7677746/7677746-sd_360_640_25fps.mp4",
    // Slow gliding drift across black satin as the deep folds relax and flatten.
    prompt:
      "The product rests centered on rippling black satin that fills the frame, folds of the same cloth rising behind it as a seamless backdrop. Soft directional light rakes across the silk, catching cool silver sheen along each crease while the hollows fall to near black. The camera glides slowly across the fabric as the folds relax and smooth out beneath it, quiet and expensive, photorealistic product commercial, shallow depth of field, moody monochrome grade.",
  },
  {
    id: "sunlit_marble_ledge",
    name: "Sunlit Marble Ledge",
    category: "Luxury",
    pexelsId: 7815607,
    seconds: 16.44,
    poster: "https://images.pexels.com/videos/7815607/abstract-art-background-beach-7815607.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/7815607/7815607-sd_360_640_25fps.mp4",
    // Nearly locked-off static frame with a barely perceptible slow push in; only the hard cast shadow creeps across the marble.
    prompt:
      "The product sits in a shallow dark wooden dish on a pale grey marble ledge, framed small against a taupe marble slab wall. Hard sunlight rakes in from the left, cutting a crisp diagonal wedge of shade and throwing a sharp silhouette onto the stone. The camera holds a nearly static locked-off frame with the faintest slow push in, only the shadow edge creeping. Calm and sculptural, photorealistic still-life commercial, hard-light contrast, muted cinematic grade.",
  },
  {
    id: "dusty_rose_hands_2",
    name: "Dusty Rose Hands",
    category: "Luxury",
    pexelsId: 8183385,
    seconds: 7.41,
    poster: "https://images.pexels.com/videos/8183385/pexels-photo-8183385.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/8183385/8183385-sd_360_640_30fps.mp4",
    // Nearly static locked-off frame; raised interlaced hands slowly rotate, flex and drift lower.
    prompt:
      "The product is presented on a pair of raised, interlaced hands held in a tight vertical crop, fingers extended so it catches the light. Behind them a mottled dusty-rose painted canvas backdrop fills the frame. Soft, even diffused light wraps the skin with gentle shadow. A nearly static locked-off frame holds while the hands slowly rotate, flex and settle lower. Warm, tactile, editorial mood, photorealistic product commercial, soft shallow focus, warm rosy color grade.",
  },
  {
    id: "black_silk_fade",
    name: "Black Silk Fade",
    category: "Luxury",
    pexelsId: 10322273,
    seconds: 4.44,
    poster: "https://images.pexels.com/videos/10322273/pexels-photo-10322273.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/10322273/10322273-sd_360_640_30fps.mp4",
    // Near-static frame with the faintest push in; satin folds shift while the light fades to near black.
    prompt:
      "The product stands upright in a tight vertical frame, bedded into deeply rippled black satin that pools around it. Soft light rakes the fabric from the upper left, catching the crests of the folds and sinking the corners into shadow. The camera stays nearly locked off with the faintest push in as the silk shifts and the light slowly fades toward darkness, hushed and sensual, photorealistic product commercial, shallow depth of field, deep cinematic blacks.",
  },
  {
    id: "crystal_scatter",
    name: "Crystal Scatter",
    category: "Luxury",
    pexelsId: 8516633,
    seconds: 9.7,
    poster: "https://images.pexels.com/videos/8516633/abstract-abstraction-background-ball-8516633.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/8516633/8516633-sd_360_640_30fps.mp4",
    // Slow sideways drift across the gem bed; loose sequins tumble in early and settle, facets glinting.
    prompt:
      "The product sits low at the centre of a bed of clear faceted crystals and gold and copper sequins scattered over a bright white tabletop, framed close and near eye level. Hard sunlight rakes the set, casting crisp shadow stripes. The camera drifts slowly sideways across the scatter as a few loose sequins tumble in and settle, facets flaring with rainbow glints. Opulent and sun-struck, photorealistic product commercial, macro shallow focus, warm luxury grade.",
  },
  {
    id: "white_glove_macro",
    name: "White Glove Macro",
    category: "Luxury",
    pexelsId: 30851126,
    seconds: 18.13,
    poster: "https://images.pexels.com/videos/30851126/diamond-diamond-ring-viral-30851126.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/30851126/13193263_360_640_30fps.mp4",
    // Handheld macro drift while white-gloved fingers slowly turn the product in front of a black box.
    prompt:
      "The product is held in white cotton-gloved fingertips, filling an extreme close-up frame, with an open black presentation box just behind it and a warm caramel backdrop soft and out of focus. Diffuse light rakes across it, catching bright glints. The camera drifts handheld and close while the gloved hand slowly rotates the product, fingers shifting grip between angles. Intimate, hushed, high-value mood, photorealistic macro product film, razor-thin depth of field, warm golden grade.",
  },
  {
    id: "crystal_shadow_bands",
    name: "Crystal Shadow Bands",
    category: "Luxury",
    pexelsId: 8516639,
    seconds: 9.43,
    poster: "https://images.pexels.com/videos/8516639/abstract-abstraction-background-ball-8516639.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/8516639/8516639-sd_360_640_30fps.mp4",
    // Slow forward creep drifting left; only sparkles and hard shadow bands shift across the crystals.
    prompt:
      "The product stands centred on a glossy pale surface strewn with cut crystals, framed low and close so the floor recedes into soft bokeh behind it. Hard directional light rakes across the set, throwing long dark blind-like shadow bars and bright sparkles over the stones. The camera creeps slowly forward with a slight leftward drift; only the highlights and shadow bands shift. Opulent, hypnotic monochrome, photorealistic product commercial, shallow depth of field, high-contrast black-and-white grade.",
  },
  {
    id: "amber_glass_macro",
    name: "Amber Glass Macro",
    category: "Luxury",
    pexelsId: 7254959,
    seconds: 12.12,
    poster: "https://images.pexels.com/videos/7254959/pexels-photo-7254959.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/7254959/7254959-sd_360_640_30fps.mp4",
    // Nearly locked-off extreme macro that creeps slowly downward, opening more grey backdrop above; nothing else in frame moves.
    prompt:
      "An extreme macro on the product, cropped so only its upper edge fills the frame on a tight diagonal, set against a blurred mottled grey backdrop with no visible surface. Warm directional light rakes across it, catching bevelled edges and bright specular highlights. The camera is nearly locked off, drifting slowly downward so more grey opens above; nothing else moves. Hushed and expensive, photorealistic product macro, shallow depth of field, warm amber grade.",
  },
  {
    id: "silk_marigold_macro",
    name: "Silk Marigold Macro",
    category: "Luxury",
    pexelsId: 34465658,
    seconds: 14.3,
    poster: "https://images.pexels.com/videos/34465658/gold-jewelry-lotus-blossom-pendant-34465658.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/34465658/14604195_360_640_30fps.mp4",
    // Slow handheld lateral drift across white silk; a blurred orange marigold sways into the foreground corner.
    prompt:
      "The product rests on softly quilted white silk, framed in tight macro close-up so it fills the lower half of the frame against a bright, blown-out fabric backdrop. Diffused daylight keeps everything airy and shadowless. The camera drifts slowly sideways in a gentle handheld glide, while a blurred orange marigold on a dark stem sways into the foreground corner, photorealistic product commercial macro, very shallow depth of field, warm high-key grade.",
  },
  {
    id: "noir_gloss_macro",
    name: "Noir Gloss Macro",
    category: "Luxury",
    pexelsId: 11267671,
    seconds: 14.78,
    poster: "https://images.pexels.com/videos/11267671/pexels-photo-11267671.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/11267671/11267671-sd_360_640_30fps.mp4",
    // Nearly static locked-off macro; only the warm raking light shifts and slowly dims toward shadow.
    prompt:
      "The product fills the frame in tight macro, centred and cropped at the edges, resting on polished black glass that mirrors a faint reflection below it against a pure black void. A single warm amber light rakes in from the left, picking out metallic highlights. A nearly static locked-off frame, drifting almost imperceptibly as the light slowly dims and sinks into shadow, photorealistic product commercial, extreme shallow focus, low-key cinematic grade.",
  },

  // ── Beauty ──────────────────────────────────────────────────────────────
  {
    id: "lily_stone_slab",
    name: "Lily Stone Slab",
    category: "Beauty",
    pexelsId: 6801520,
    seconds: 12.37,
    poster: "https://images.pexels.com/videos/6801520/4k-4k-video-aromatherapy-background-6801520.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/6801520/6801520-sd_360_640_30fps.mp4",
    // Nearly static locked-off frame with a very slow push in; the lily behind creeps further into frame.
    prompt:
      "The product stands centred on a chipped white plaster slab against a seamless off-white backdrop, a tan pebble resting against its base and a white lily with orange stamens leaning in from the upper left behind it. Light is bright, soft and high-key with almost no shadow. The camera stays locked off and still while only the lily sways gently down and back. Serene spa mood, photorealistic beauty commercial, airy high-key grade.",
  },
  {
    id: "palm_cradle_pink",
    name: "Palm Cradle Pink",
    category: "Beauty",
    pexelsId: 8131892,
    seconds: 26.08,
    poster: "https://images.pexels.com/videos/8131892/pexels-photo-8131892.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/8131892/8131892-sd_338_640_25fps.mp4",
    // Locked-off frame; two hands drift and tilt slowly, rotating the product a few degrees.
    prompt:
      "The product stands upright in an open palm at the center of a tall vertical frame, empty space above it; a second bare hand rises flat behind as a backdrop, both arms cropped at the forearm and entering from below. Behind them a plain dusty-pink seamless wall under broad, soft studio light. Locked-off camera, the hands swaying and tilting gently. Photorealistic beauty commercial, soft shadows, warm pink grade.",
  },
  {
    id: "taupe_stone_riser",
    name: "Taupe Stone Riser",
    category: "Beauty",
    pexelsId: 7428168,
    seconds: 39.21,
    poster: "https://images.pexels.com/videos/7428168/pexels-photo-7428168.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/7428168/7428168-sd_338_640_25fps.mp4",
    // Slow sideways drift arcing gently closer; only the foreground comb parallaxes past, the set itself stays still.
    prompt:
      "The product stands on a cluster of white pebbles against a warm taupe seamless sweep, companion amber-glass bottles stepped around it, a black fine-tooth comb leaning against it and two pale wooden combs on the surface, one large and close to the lens. Soft light from the left casts short gentle shadows. Nothing moves; the camera only floats, breathing slightly closer and back. Calm editorial product commercial, shallow depth of field, warm neutral grade.",
  },
  {
    id: "sunlit_spa_tray",
    name: "Sunlit Spa Tray",
    category: "Beauty",
    pexelsId: 7614398,
    seconds: 6.81,
    poster: "https://images.pexels.com/videos/7614398/pexels-photo-7614398.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/7614398/7614398-sd_338_640_25fps.mp4",
    // Slow continuous push in toward the tray; the set stays still, only the framing tightens.
    prompt:
      "The product stands off-centre on crumpled terracotta cloth, just behind a dark glossy tray holding pink rock salt, a jade gua sha and roller. A white shell candle sits on the tray's right edge, an amber vase of dried pampas, red berries and yellow blooms behind it. Hard sunlight cuts a diagonal shadow across the cloth. One slow push in, nothing else moving. Photorealistic product commercial, shallow depth of field, warm sunlit grade.",
  },
  {
    id: "zen_stone_mist",
    name: "Zen Stone Mist",
    category: "Beauty",
    pexelsId: 7815962,
    seconds: 18.24,
    poster: "https://images.pexels.com/videos/7815962/architecture-background-balance-bath-7815962.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/7815962/7815962-sd_360_640_25fps.mp4",
    // Nearly locked-off frame creeping almost imperceptibly closer; pale mist drifts across the stones and slowly thins.
    prompt:
      "The product stands on a stack of three smooth warm-grey stones, set low in a tall frame with open headroom, on a polished veined marble floor that mirrors it faintly, before a mottled grey stone wall out of focus. Soft dim frontal light shapes it as pale mist drifts across the set and slowly thins, letting the scene darken. Locked-off camera. Calm and meditative, photorealistic product commercial, shallow depth of field, neutral desaturated grade.",
  },
  {
    id: "sunbeam_wall_hold",
    name: "Sunbeam Wall Hold",
    category: "Beauty",
    pexelsId: 35200638,
    seconds: 11.67,
    poster: "https://images.pexels.com/videos/35200638/perfume-35200638.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/35200638/14913071_360_640_30fps.mp4",
    // Nearly static locked-off frame; a sweater-sleeved hand holds the product steady, drifting and swaying slightly as hard sun shadows shift.
    prompt:
      "A knit-sleeved hand carries the product in from the upper left and lowers it upright into a hot band of sunlight at the foot of a pale lilac wall, where hard sun cuts a crisp triangular wedge and prints a sharp shadow beside it; the smooth surface below holds diagonal light streaks and one fallen petal. Locked-off camera, the hand holding almost still, swaying faintly. Photorealistic product commercial, shallow foreground blur, airy pastel grade.",
  },
  {
    id: "blush_cascade",
    name: "Blush Cascade",
    category: "Beauty",
    pexelsId: 38502397,
    seconds: 23.06,
    poster: "https://images.pexels.com/videos/38502397/pexels-photo-38502397.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/38502397/16351699_360_640_60fps.mp4",
    // Nearly static frame with a faint drift; a thin falling stream of water wanders across the backdrop and ripples the pool at the product's base.
    prompt:
      "The product lies tilted across the lower half of a tall vertical frame, cropped close, its base sitting in churning white water against a saturated rose-pink seamless backdrop. Soft even studio light picks out every wet highlight. The camera holds locked while a thin stream of clear water falls onto the product, sheets over it and drips away, wandering side to side — calm, dewy, photorealistic beauty commercial, macro focus, glossy pink grade.",
  },
  {
    id: "beige_stone_set",
    name: "Beige Stone Set",
    category: "Beauty",
    pexelsId: 7428171,
    seconds: 17.54,
    poster: "https://images.pexels.com/videos/7428171/pexels-photo-7428171.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/7428171/7428171-sd_338_640_25fps.mp4",
    // Slow push in on a nearly static frame; a hand enters from the right, places the product front and centre, then withdraws.
    prompt:
      "The product stands front of centre on a smooth beige sweep, two amber glass bottles, a rounded white stone, two pale wooden combs and a slim dark comb arranged around it. Soft light from the left lays long diagonal shadows to the right. The camera drifts almost imperceptibly inward as a manicured hand enters from the right, sets the product down and withdraws. Calm, minimal, spa-quiet, photorealistic product commercial, soft shadows, warm neutral grade.",
  },
  {
    id: "mint_gradient_press",
    name: "Mint Gradient Press",
    category: "Beauty",
    pexelsId: 8165996,
    seconds: 20.24,
    poster: "https://images.pexels.com/videos/8165996/pexels-photo-8165996.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/8165996/8165996-sd_338_640_25fps.mp4",
    // Nearly locked-off frame with a faint push in; a hand enters from the right, presses the top of the product with cupped palm beneath, then withdraws.
    prompt:
      "The product stands on a polished white marble counter, slightly left of center and faintly mirrored in the stone, against a soft mint-green gradient backdrop. The camera stays locked off with no move. Two hands enter from the right: fingertips press down on the product's top while the other cups open beneath it, then both withdraw and re-enter to press again. Calm spa-clean mood, photorealistic product commercial, soft diffused frontal light, pastel grade.",
  },

  // ── Fashion ─────────────────────────────────────────────────────────────
  {
    id: "apricot_seamless",
    name: "Apricot Seamless",
    category: "Fashion",
    pexelsId: 8798149,
    seconds: 17.84,
    poster: "https://images.pexels.com/videos/8798149/pexels-photo-8798149.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/8798149/8798149-sd_338_640_25fps.mp4",
    // Very slow push in on a near-static frame while focus racks from soft to sharp; the fruit props stay still.
    prompt:
      "The product rests at a tilt, leaning against a ridged orange sphere, centered in a tall tight frame, a single apricot far forward, thrown out of focus. A pale grey seamless sweep fills the background under soft even light that lays one gentle shadow. The camera creeps in on a near-locked frame as focus racks from soft to crisp; nothing else moves. Calm and minimal, photorealistic product commercial, shallow depth of field, clean neutral grade.",
  },
  {
    id: "sunlit_stool_still",
    name: "Sunlit Stool Still",
    category: "Fashion",
    pexelsId: 6473754,
    seconds: 14.44,
    poster: "https://images.pexels.com/videos/6473754/pexels-photo-6473754.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/6473754/6473754-sd_338_640_25fps.mp4",
    // Nearly static locked-off frame; a black-sleeved hand enters from the left, opens the product, places a small item inside, then withdraws.
    prompt:
      "The product sits in profile on a rough live-edge wooden stool, framed tight, a mustard-yellow cushion sloping across the foreground and another behind. A blue-striped ceramic vase of dried grasses stands against a sunlit sheer white curtain. The camera stays locked off; hands in black knit sleeves enter from the left, hold the product open, tuck a small item inside, then withdraw. Photorealistic product commercial, shallow depth of field, warm natural grade.",
  },
  {
    id: "hanger_leaf_drift",
    name: "Hanger Leaf Drift",
    category: "Fashion",
    pexelsId: 7317014,
    seconds: 8.72,
    poster: "https://images.pexels.com/videos/7317014/pexels-photo-7317014.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/7317014/7317014-sd_360_640_25fps.mp4",
    // Handheld drift with small reframes; a hand steadies the hem as blurred green foliage sweeps the foreground.
    prompt:
      "The product hangs from a light wooden hanger held up by a woman in a white top, centered against a plain greige plaster wall. Soft diffused daylight rakes from the left, laying a gentle shadow across its lower half. The camera drifts handheld, reframing slightly while her free hand steadies the hem and a blurred green leaf sweeps through the foreground, calm and editorial, photorealistic apparel commercial, soft natural light, muted film grade.",
  },
  {
    id: "tonal_orange_studio",
    name: "Tonal Orange Studio",
    category: "Fashion",
    pexelsId: 8798286,
    seconds: 19.36,
    poster: "https://images.pexels.com/videos/8798286/pexels-photo-8798286.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/8798286/8798286-sd_338_640_25fps.mp4",
    // Locked-off static medium shot; the product sways slightly in the model's raised hand as her free hand shifts to her hip.
    prompt:
      "The product hangs from the model's raised fingertips at waist height, framed in a chest-to-thigh crop with her face cropped above. She wears a chunky burnt-orange knit and matching trousers against a flat mid-grey seamless backdrop under soft, even studio light. A nearly static locked-off frame: only the product sways gently in her fingers while her free hand drifts to her hip. Calm, tonal, editorial, photorealistic fashion commercial, soft shadows, warm saturated grade.",
  },
  {
    id: "clean_torso_crop",
    name: "Clean Torso Crop",
    category: "Fashion",
    pexelsId: 6321963,
    seconds: 21.33,
    poster: "https://images.pexels.com/videos/6321963/pexels-photo-6321963.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/6321963/6321963-sd_338_640_30fps.mp4",
    // Very slow push in on the torso; the model breathes and shifts weight, fabric folds settling.
    prompt:
      "The product is worn on a model's torso and fills the center of a vertical frame cropped from jaw to mid-thigh, arms hanging loose over dark indigo jeans, a thin cord bracelet at one wrist. The backdrop is plain white seamless, the light soft, even and almost shadowless. The camera makes a very slow push in as the model shifts weight and breathes, folds settling. Calm, clean catalog mood, photorealistic apparel commercial, soft even studio light, crisp neutral color grade.",
  },
  {
    id: "soft_grey_studio",
    name: "Soft Grey Studio",
    category: "Fashion",
    pexelsId: 6323034,
    seconds: 26.0,
    poster: "https://images.pexels.com/videos/6323034/pexels-photo-6323034.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/6323034/6323034-sd_338_640_30fps.mp4",
    // Nearly static locked-off frame with an almost imperceptible push in; only the model's slight sway, shoulder shift and head turn move.
    prompt:
      "The product is worn on a model, centered and framed from the hips to just above the shoulders against a pale grey seamless backdrop. Soft even diffused light wraps the fabric, leaving a faint shadow at frame left. A nearly static locked-off frame creeps almost imperceptibly closer while the model sways, shoulders shifting and head turning gently side to side, curls bouncing. Clean, calm, editorial, photorealistic apparel commercial, crisp neutral color grade.",
  },
  {
    id: "pastel_arch_walk",
    name: "Pastel Arch Walk",
    category: "Fashion",
    pexelsId: 7305168,
    seconds: 25.86,
    poster: "https://images.pexels.com/videos/7305168/pexels-photo-7305168.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/7305168/7305168-sd_338_640_25fps.mp4",
    // Locked-off static wide frame; the product moves toward the lens and passes out of frame in a soft blur.
    prompt:
      "The product stands centered and full-length on a seamless white studio floor, framed wide. Behind it, overlapping pastel arch panels in soft pink and chartreuse carry small sprigs of baby's breath and pale ceramic props. Light is flat, high-key and diffused, leaving one faint floor shadow. A locked-off static frame holds as the product advances toward the lens and slips past in a soft blur. Airy editorial calm, photorealistic fashion commercial, clean bright grade.",
  },
  {
    id: "foliage_hanger",
    name: "Foliage Hanger",
    category: "Fashion",
    pexelsId: 7317015,
    seconds: 11.36,
    poster: "https://images.pexels.com/videos/7317015/pexels-photo-7317015.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/7317015/7317015-sd_360_640_25fps.mp4",
    // Handheld drift with a slight sideways sway; the product turns gently on the hanger while out-of-focus green leaves pass through the foreground.
    prompt:
      "The product hangs from a pale wooden hanger held aloft by a hand, centered in a tall vertical frame against a warm off-white plaster wall. Soft diffused daylight wraps the fabric and leaves a faint shadow. The camera drifts handheld with a slight sideways sway while the product turns gently on the hanger and blurred green leaves glide across the foreground, calm and airy, photorealistic apparel commercial, soft foreground blur, natural warm grade.",
  },

  // ── Footwear ────────────────────────────────────────────────────────────
  {
    id: "pastel_palm_hold",
    name: "Pastel Palm Hold",
    category: "Footwear",
    pexelsId: 9595332,
    seconds: 23.52,
    poster: "https://images.pexels.com/videos/9595332/abstract-adult-art-ballet-9595332.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/9595332/9595332-sd_338_640_25fps.mp4",
    // Locked-off static frame; hands rotate and tilt the product while a second matching piece lifts away and returns above.
    prompt:
      "The product rests across an open palm low in a tall frame, a warm greige seamless backdrop filling the empty space above. Flat diffused studio light wraps it evenly, leaving almost no shadow. The camera stays locked off while manicured hands in a pale grey cuffed sleeve turn and tilt it, a second piece in a contrasting pastel tone lifted away above it and brought back. Photorealistic product commercial, soft pastel grade, motion blur.",
  },
  {
    id: "pink_sweep_turn",
    name: "Pink Sweep Turn",
    category: "Footwear",
    pexelsId: 8798422,
    seconds: 28.2,
    poster: "https://images.pexels.com/videos/8798422/pexels-photo-8798422.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/8798422/8798422-sd_338_640_25fps.mp4",
    // Slow low-angle drift with a slight push in; the product rotates gently on a turntable while the backdrop stays still.
    prompt:
      "The product rests on a seamless pink sweep, framed from a low near-floor angle so it sits in the lower third under a broad expanse of empty backdrop. Tone-on-tone pink surrounds it, lit by soft even studio light fading into a gentle gradient behind. The camera drifts slowly and eases in while the product turns gently on a turntable; nothing else moves. Playful and clean, photorealistic product commercial, shallow depth of field, soft pastel grade.",
  },
  {
    id: "sunlit_parquet",
    name: "Sunlit Parquet",
    category: "Footwear",
    pexelsId: 8992077,
    seconds: 14.8,
    poster: "https://images.pexels.com/videos/8992077/abstraction-ballet-blogger-board-8992077.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/8992077/8992077-sd_360_640_25fps.mp4",
    // Low near-static handheld frame at floor level while the feet pivot, cross and step in place and sun shadows slide across the parquet.
    prompt:
      "The product is worn on a person's feet, framed tight and low at floor level, only cuffed light-blue jean hems in shot. Warm honey herringbone parquet fills the frame, hard afternoon window sunlight raking across it and throwing long shadows. A low, nearly static handheld frame holds while the feet pivot, cross and step in place, shadow edges sliding over the wood grain. Relaxed sunlit mood, photorealistic footwear commercial, golden grade, shallow depth of field.",
  },
  {
    id: "parquet_step",
    name: "Parquet Step",
    category: "Footwear",
    pexelsId: 8994744,
    seconds: 5.2,
    poster: "https://images.pexels.com/videos/8994744/ballerina-ballet-ballet-dancer-barefoot-8994744.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/8994744/8994744-sd_360_640_25fps.mp4",
    // Low floor-level tracking move alongside the product, easing closer and lower as the feet step through frame.
    prompt:
      "Shot from floor level, the product is worn mid-step across a polished honey-toned wood floor, framed tight with the ankle and a cropped cream trouser hem above it. Warm light rakes the planks and mirrors in the gloss, the background a dark blurred railing. The camera tracks alongside, easing lower and closer with each step. Calm, quietly luxurious, photorealistic footwear commercial, shallow depth of field, warm cinematic grade.",
  },
  {
    id: "sunlit_grass_stride",
    name: "Sunlit Grass Stride",
    category: "Footwear",
    pexelsId: 8055973,
    seconds: 9.07,
    poster: "https://images.pexels.com/videos/8055973/active-alone-beautiful-color-8055973.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/8055973/8055973-sd_360_640_30fps.mp4",
    // Low sideways tracking shot at ankle height following the walking feet, foreground grass drifting past.
    prompt:
      "Low ground-level framing on the product as it is worn mid-stride, bare legs crossing through bright spring grass. Green lawn fills the foreground in soft blur while a park of trees and blue sky sits behind. Hard midday sun rakes across the scene. The camera tracks sideways at ankle height, keeping pace with each step as grass blades sway past. Effortless summer mood, photorealistic footwear commercial, shallow depth of field, sunlit natural color grade.",
  },
  {
    id: "blush_sweep",
    name: "Blush Sweep",
    category: "Footwear",
    pexelsId: 6372054,
    seconds: 9.14,
    poster: "https://images.pexels.com/videos/6372054/pexels-photo-6372054.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/6372054/6372054-sd_360_640_30fps.mp4",
    // Slow upward camera rise; the product drifts toward the bottom edge, nothing else moves.
    prompt:
      "The product sits low in frame on a seamless pale pink sweep, dwarfed by empty backdrop above it. Soft diffused light from the left wraps it gently and lays one long shadow to the right. The camera makes a slow steady rise, letting the product settle toward the bottom edge as negative space opens overhead; nothing else moves. Calm, minimal, editorial, photorealistic product commercial, soft studio light, clean pastel grade.",
  },
  {
    id: "pale_bloom_studio",
    name: "Pale Bloom Studio",
    category: "Footwear",
    pexelsId: 5871176,
    seconds: 6.93,
    poster: "https://images.pexels.com/videos/5871176/cut-flowers-white-flowers-white-shoes-5871176.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/5871176/5871176-sd_360_640_24fps.mp4",
    // Slow push in on an almost static frame; flowers and legs sway faintly.
    prompt:
      "The product stands centred and low in frame on a pale concrete floor, clusters of white chrysanthemums spilling from its top edge and a soft-focus pair of bare legs rising out of frame behind it. The wall is matching washed grey-lilac plaster. Light is cool, even and diffused. The camera pushes in slowly and settles, the blooms trembling faintly, cool minimal romance, photorealistic product commercial, soft shallow focus, delicate pastel grade.",
  },
  {
    id: "pale_bloom_floor",
    name: "Pale Bloom Floor",
    category: "Footwear",
    pexelsId: 5871171,
    seconds: 7.49,
    poster: "https://images.pexels.com/videos/5871171/cut-flowers-white-flowers-white-shoes-5871171.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/5871171/5871171-sd_360_640_24fps.mp4",
    // Slow push in at floor level; frame otherwise nearly still, only the chrysanthemums shifting slightly.
    prompt:
      "The product sits low in a tight floor-level frame, framed by clusters of white chrysanthemums, with a single loose bloom on the pale concrete ahead of it and a model's bare legs rising softly out of focus behind. A plain white plaster wall fills the background under diffuse cool daylight. The camera holds a slow push in, the flowers barely stirring. Dreamy and pale, photorealistic fashion commercial, soft haze, cool lilac grade.",
  },
  {
    id: "rope_coil_bed",
    name: "Rope Coil Bed",
    category: "Footwear",
    pexelsId: 8726214,
    seconds: 10.01,
    poster: "https://images.pexels.com/videos/8726214/pexels-photo-8726214.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/8726214/8726214-sd_360_640_24fps.mp4",
    // Slow handheld drift left and down; the product travels across frame as tangled rope coils slide past beneath it.
    prompt:
      "The product rests high in a vertical frame on a deep bed of coiled pale blue climbing rope that fills the lower two thirds, loops and strands tangling toward the edges. Soft overcast daylight keeps the tones cool and muted. A slow handheld drift eases left and downward so the product travels gently across frame while rope coils slide past. Rugged outdoor mood, photorealistic gear commercial, shallow depth of field, natural desaturated grade.",
  },
  {
    id: "studio_ankle_walk",
    name: "Studio Ankle Walk",
    category: "Footwear",
    pexelsId: 7166779,
    seconds: 19.68,
    poster: "https://images.pexels.com/videos/7166779/pexels-photo-7166779.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/7166779/7166779-sd_338_640_25fps.mp4",
    // Camera drifts lower and pushes in at ankle height while the model steps slowly forward and the loose trousers sway.
    prompt:
      "The product is worn on a model's foot, framed low at ankle height, wide sage-green trousers cropping the frame above it. A seamless off-white studio floor curves into a pale backdrop under soft even light with a faint contact shadow beneath. The camera drifts lower and pushes in as the model steps slowly forward, loose fabric swaying, until one foot fills the frame. Calm and editorial, photorealistic footwear commercial, soft shallow focus, clean neutral grade.",
  },
  {
    id: "studio_stool_perch",
    name: "Studio Stool Perch",
    category: "Footwear",
    pexelsId: 6626483,
    seconds: 16.04,
    poster: "https://images.pexels.com/videos/6626483/pexels-photo-6626483.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/6626483/6626483-sd_338_640_25fps.mp4",
    // Gentle handheld drift with a slow reframe downward; the model settles, a hand lowers to the thigh and the hanging foot sways.
    prompt:
      "The product is worn by a seated model cropped from the chest down, perched on a slim white metal stool, one foot hanging free at frame centre. A cream plaster wall behind, pale concrete floor below, soft daylight raking from the left. A gentle handheld drift reframes as the model settles, a hand lowering onto the thigh and the free foot swaying, calm and editorial, photorealistic footwear commercial, soft natural light, warm muted grade.",
  },

  // ── Tech ────────────────────────────────────────────────────────────────
  {
    id: "lilac_hand_turn",
    name: "Lilac Hand Turn",
    category: "Tech",
    pexelsId: 8005698,
    seconds: 12.68,
    poster: "https://images.pexels.com/videos/8005698/pexels-photo-8005698.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/8005698/8005698-sd_360_640_25fps.mp4",
    // Locked-off vertical frame; hands slowly rotate the product to a side profile and lower it slightly.
    prompt:
      "Two manicured hands, dark leather jacket cuffs visible, hold the product in the lower half of a vertical frame, empty lilac seamless backdrop filling the space above and no surface beneath. Soft diffused studio light lends a cool blue sheen, with a warm rim along the fingers. The camera stays locked off while the hands turn the product to a side profile, lower it slightly, then hold. Photorealistic product commercial, soft cool grade.",
  },
  {
    id: "soft_focus_hold",
    name: "Soft Focus Hold",
    category: "Tech",
    pexelsId: 9130461,
    seconds: 8.04,
    poster: "https://images.pexels.com/videos/9130461/adult-blur-conceptual-connection-9130461.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/9130461/9130461-sd_360_640_30fps.mp4",
    // Nearly static locked-off frame; the hand slowly rotates the product and drifts it downward.
    prompt:
      "The product is held at a slight tilt between the fingertips of a bare hand rising from the bottom of a vertical frame. Behind it everything blurs to blown-out white with a pale blue wash. Soft even light wraps the skin and the product. Locked-off camera; the hand makes one small adjustment early, then lets the product settle lower and hold nearly still, photorealistic product commercial, very shallow depth of field, clean airy grade.",
  },
  {
    id: "orange_paper_glide",
    name: "Orange Paper Glide",
    category: "Tech",
    pexelsId: 30730783,
    seconds: 19.17,
    poster: "https://images.pexels.com/videos/30730783/4k-video-black-mouse-business-clean-design-30730783.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/30730783/13146732_360_640_30fps.mp4",
    // Locked-off overhead frame; a hand reaches in from the bottom and slides the product around the orange paper.
    prompt:
      "The product rests alone in the upper half of a straight-down overhead frame on saturated orange seamless paper. Soft even studio light keeps shadows faint and diffuse. The camera stays locked off while a bare hand and forearm reach in from the bottom edge, settle over the product and slide it slowly around the paper, keeping hold of it throughout, confident and playful, photorealistic product commercial, crisp focus, punchy saturated color grade.",
  },
  {
    id: "butter_yellow_drift",
    name: "Butter Yellow Drift",
    category: "Tech",
    pexelsId: 6375965,
    seconds: 29.9,
    poster: "https://images.pexels.com/videos/6375965/pexels-photo-6375965.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/6375965/6375965-sd_338_640_30fps.mp4",
    // Nearly static locked-off overhead frame with a barely perceptible slow push in; the product stays centred and nothing else moves.
    prompt:
      "The product sits dead centre of a tall vertical frame, small in shot against a pale yellow-beige seamless backdrop with generous empty space above and below. A soft key from the upper right leaves a faint shadow hugging its left edge; the backdrop stays almost perfectly flat. The camera is fully locked off, no push or drift, and nothing enters or moves. Minimal and calm, photorealistic product commercial, soft shadows, warm neutral grade.",
  },

  // ── Food & Drink ────────────────────────────────────────────────────────
  {
    id: "green_pour",
    name: "Green Pour",
    category: "Food & Drink",
    pexelsId: 4443524,
    seconds: 4.42,
    poster: "https://images.pexels.com/videos/4443524/detox-fruits-healthy-juice-4443524.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/4443524/4443524-sd_540_808_25fps.mp4",
    // Slow push in; the hand tips the product and a steady juice stream fills the glass.
    prompt:
      "The product is held tilted in a hand at the top of frame, tipping until a ribbon of golden-green juice falls into a short glass tumbler that slowly fills. White marble surface and bright white backdrop, styled with a halved green apple, lime slices, cucumber rounds, celery and dark leafy greens. Soft diffused daylight, gentle soft-edged shadows. The camera pushes in slowly. Photorealistic beverage commercial, crisp natural color, softly defocused background.",
  },
  {
    id: "midnight_pour",
    name: "Midnight Pour",
    category: "Food & Drink",
    pexelsId: 7255224,
    seconds: 18.07,
    poster: "https://images.pexels.com/videos/7255224/alcohol-amber-bar-beer-7255224.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/7255224/7255224-sd_360_640_30fps.mp4",
    // Nearly locked-off frame with a faint push in; a decanter tilts in from upper right, pours a thin amber stream, then withdraws.
    prompt:
      "The product sits centered low on dark speckled stone that mirrors it cleanly, the backdrop an unbroken black void. Soft side light rims its edges and burns warm through amber liquid. The camera is locked off, no push, no drift, while a glass decanter poised at upper right tips, sends a thin amber stream swirling down as the level climbs, then withdraws, leaving the liquid still. Moody photorealistic low-key grade, deep shadow.",
  },
  {
    id: "crimson_pour",
    name: "Crimson Pour",
    category: "Food & Drink",
    pexelsId: 8093236,
    seconds: 38.68,
    poster: "https://images.pexels.com/videos/8093236/alcohol-alcoholic-drink-bar-bottle-8093236.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/8093236/8093236-sd_360_640_30fps.mp4",
    // Slow push in on a black-void set while dark red wine pours in a steady ribbon from a bottle neck at upper left.
    prompt:
      "The product stands centered on a polished black surface, framed tall against a pure black void above its faint mirrored reflection. A soft edge light rakes the form, catching glassy highlights while everything else falls to darkness. The camera stays locked off. From the upper left a bottle neck in bright red foil pours a thin ribbon of dark red wine that churns and slowly builds. Moody photorealistic beverage commercial, deep contrast, cinematic grade.",
  },
  {
    id: "tan_plinth_pour",
    name: "Tan Plinth Pour",
    category: "Food & Drink",
    pexelsId: 10508547,
    seconds: 34.48,
    poster: "https://images.pexels.com/videos/10508547/copy-space-decorations-female-hand-10508547.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/10508547/10508547-sd_338_640_25fps.mp4",
    // Locked-off static frame; a cuffed hand dips a green bottle in from above and pours into the glasses, then lifts away.
    prompt:
      "The product stands on the top edge of a white plinth beside a lineup of clear stemmed glasses, a warm tan seamless backdrop behind, the plinth's blank face filling the lower two-thirds. A locked-off static frame: a hand in a white cuff dips a dark green bottle in from above, pours pale golden liquid into the glasses, then lifts away. Photorealistic product commercial, soft even studio light, minimal shadow, warm neutral grade.",
  },
  {
    id: "amber_drizzle",
    name: "Amber Drizzle",
    category: "Food & Drink",
    pexelsId: 14461052,
    seconds: 9.77,
    poster: "https://images.pexels.com/videos/14461052/4k-video-black-tea-glass-gourmet-14461052.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/14461052/14461052-sd_360_640_25fps.mp4",
    // Nearly static locked-off macro; a spoon lowers from the top edge, amber syrup drizzles down and blooms into slow swirls before settling.
    prompt:
      "The product stands centered in a tight backlit close-up, staged with ice and a glowing citrus wheel behind condensation, against a deep chocolate-brown backdrop. Warm amber light rakes from behind, rimming the ice in honeyed glow. The camera holds locked off as a metal spoon lowers from the top edge and drizzles a dark amber ribbon that blooms into slow swirls, a final drop falling before it settles, photoreal macro, shallow focus, warm grade.",
  },
  {
    id: "blue_bar_pour",
    name: "Blue Bar Pour",
    category: "Food & Drink",
    pexelsId: 38702518,
    seconds: 8.99,
    poster: "https://images.pexels.com/videos/38702518/pexels-photo-38702518.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/38702518/16440539_360_640_60fps.mp4",
    // Locked-off static frame; a hand pours a dark stream from a steel shaker as the product fills and foam settles.
    prompt:
      "The product stands centered on a dark ribbed bar mat at eye level, a defocused backbar of blue-lit bottles glowing behind it and a soft white blur filling the left third of frame. A hand tilts a steel shaker above and pours a steady espresso-brown stream in; the level climbs, churns, then settles under a pale foam head as the shaker lifts away. Locked-off camera, photorealistic beverage commercial, deep bokeh, cool blue grade.",
  },
  {
    id: "linen_flat_lay",
    name: "Linen Flat Lay",
    category: "Food & Drink",
    pexelsId: 39216295,
    seconds: 8.3,
    poster: "https://images.pexels.com/videos/39216295/pexels-photo-39216295.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/39216295/16687022_360_640_60fps.mp4",
    // Nearly static overhead frame with a slow few-inch drift; the linen and styling stay still.
    prompt:
      "The product rests on a dark-rimmed plate in a top-down flat lay over rumpled white gauze linen, ringed by green grapes, a glass cup of amber tea with a gold spoon, a golden croissant, white daisies and baby's breath, one daisy laid against it. Soft diffused daylight, faint shadows, near-white palette. The overhead frame holds almost still, drifting imperceptibly; nothing else moves. Airy breakfast mood, photorealistic, soft natural grade, evenly sharp.",
  },
  {
    id: "golden_hour_pour",
    name: "Golden Hour Pour",
    category: "Food & Drink",
    pexelsId: 34768277,
    seconds: 19.7,
    poster: "https://images.pexels.com/videos/34768277/pexels-photo-34768277.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/34768277/14740395_360_640_30fps.mp4",
    // Slow push in from a wide tabletop framing to a tight rim macro; amber liquid drips and streams down into the product, pooling and rippling.
    prompt:
      "The product sits centered on a pale outdoor tabletop, small in frame against blown-out golden sunset light and soft bokeh from distant trees. Hard backlight rims its edges and lays a long shadow across the table. The camera pushes in slowly to a tight macro on its rim while amber liquid drips and streams down into it, pooling and rippling. Calm, warm, hypnotic, photorealistic product commercial, heavy backlight, shallow focus, honeyed grade.",
  },

  // ── Home ────────────────────────────────────────────────────────────────
  {
    id: "lavender_flatlay",
    name: "Lavender Flat Lay",
    category: "Home",
    pexelsId: 6343577,
    seconds: 29.83,
    poster: "https://images.pexels.com/videos/6343577/pexels-photo-6343577.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/6343577/6343577-sd_338_640_30fps.mp4",
    // Nearly static locked-off overhead frame; nothing moves, only the faintest drift across the whole clip.
    prompt:
      "The product sits centered in a top-down flat lay on a smooth pale cool-grey surface, label side up and completely unbranded. A small clasp-lid jar rests above and an open ivory-filled vessel below, with dried lavender sprigs and pale grass stems laid across generous empty space. Broad soft light casts faint diffused shadows. The camera stays locked off, every prop perfectly still, photorealistic product commercial, muted neutral tones, natural color grade.",
  },
  {
    id: "amber_corner_glow",
    name: "Amber Corner Glow",
    category: "Home",
    pexelsId: 5823695,
    seconds: 10.03,
    poster: "https://images.pexels.com/videos/5823695/pexels-photo-5823695.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/5823695/5823695-sd_360_640_24fps.mp4",
    // Near-static frame with an almost imperceptible creep in; the set eases slightly right and up, nothing else moves.
    prompt:
      "The product stands left of center in a tall vertical frame, slim black iron taper holders with pale unlit candles clustered beside it on a smooth amber tabletop meeting a seamless peach wall corner behind. Warm low light rakes from the right, laying long soft shadows. The camera creeps in almost imperceptibly, the set easing right and up in frame; nothing else stirs. Quiet and homey, photorealistic decor commercial, warm amber grade, soft shallow focus.",
  },
  {
    id: "sunlit_marble_tray",
    name: "Sunlit Marble Tray",
    category: "Home",
    pexelsId: 6376343,
    seconds: 22.37,
    poster: "https://images.pexels.com/videos/6376343/pexels-photo-6376343.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/6376343/6376343-sd_338_640_30fps.mp4",
    // Slow push in with a gentle upward drift; only the small candle flames flicker.
    prompt:
      "The product sits centered on a white marble tray atop a rustic plank table, low in frame, with a tall bright window and a leafy potted stem blurred behind. Daylight is soft and airy, almost blown out. The camera pushes in slowly and drifts upward, settling the tray toward the bottom edge while two small glass votives flicker beside the product. Calm and warm, photorealistic home decor commercial, shallow depth of field, natural daylight grade.",
  },
  {
    id: "pastel_marble_slab",
    name: "Pastel Marble Slab",
    category: "Home",
    pexelsId: 6507386,
    seconds: 6.95,
    poster: "https://images.pexels.com/videos/6507386/pexels-photo-6507386.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/6507386/6507386-sd_360_640_30fps.mp4",
    // Very slow push in drifting downward; only the candle flames flicker.
    prompt:
      "The product sits low in frame on a white marble slab over rumpled linen, a broad wash of pale grey-pink wall filling the space above. Soft diffused daylight wraps the set beside pale pillar candles on a small brass dish, white eggs and speckled quail eggs. The camera pushes in very slowly and drifts down; only the candle flames move. Serene pastel calm, photorealistic still-life commercial, gentle focus falloff, muted film grade.",
  },
  {
    id: "marble_board_flatlay",
    name: "Marble Board Flatlay",
    category: "Home",
    pexelsId: 6693794,
    seconds: 21.17,
    poster: "https://images.pexels.com/videos/6693794/pexels-photo-6693794.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/6693794/6693794-sd_338_640_30fps.mp4",
    // Slow overhead sideways drift; a hand enters to set down a wooden brush, then leaves frame.
    prompt:
      "An overhead flat lay: the product rests on a slate slab atop a pale wooden board set diagonally across a white marble surface, with a dried palm frond trailing beside it. Soft diffused daylight casts gentle shadows. The camera drifts slowly sideways above the set while a hand reaches in from the edge to place a small wooden bristle brush, then withdraws. Calm, natural, spa-like, photorealistic product commercial, soft matte texture, warm neutral grade.",
  },
  {
    id: "brass_tray_glow",
    name: "Brass Tray Glow",
    category: "Home",
    pexelsId: 6725496,
    seconds: 9.0,
    poster: "https://images.pexels.com/videos/6725496/after-bath-bathrobe-cosmetics-relax-6725496.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/6725496/6725496-sd_360_640_25fps.mp4",
    // Near-static slow drift in and slightly left; only the candle flame flickers.
    prompt:
      "The product sits at the center of a round brass tray, framed close from slightly above, ringed by sculptural cream candles and a small amber glass jar. Crumpled ivory linen fills the soft backdrop. Warm low candlelight pools across the polished metal and pale wax. The camera drifts almost imperceptibly closer and left; only a small flame flickers and shadows breathe. Intimate, cozy evening mood, photorealistic product commercial, shallow depth of field, warm golden grade.",
  },
  {
    id: "blossom_tray",
    name: "Blossom Tray",
    category: "Home",
    pexelsId: 6955263,
    seconds: 8.15,
    poster: "https://images.pexels.com/videos/6955263/aesthetic-bed-bloom-blooming-6955263.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/6955263/6955263-sd_360_640_30fps.mp4",
    // Nearly static frame tipping gently down over the tray then easing back; blossom branch sways and warm light flickers.
    prompt:
      "The product sits centered on an oval antique brass tray, two spent matchsticks in front of it, the tray resting on an open book over rumpled white bedding. Soft diffused daylight keeps the set high-key. The camera stays nearly still, tipping gently down then easing back while an arching cherry-blossom branch sways and warm light flickers over the white folds. Tender, springlike, photorealistic product commercial, soft window light, shallow depth of field, delicate pastel grade.",
  },
  {
    id: "warm_tray_glow",
    name: "Warm Tray Glow",
    category: "Home",
    pexelsId: 7213582,
    seconds: 10.28,
    poster: "https://images.pexels.com/videos/7213582/aromatherapy-art-arts-and-crafts-bamboo-7213582.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/7213582/7213582-sd_360_640_30fps.mp4",
    // Slow camera drift down and to the right, background props sliding out of frame; only the candle flame flickers.
    prompt:
      "The product sits centered on a round charcoal concrete tray atop a white dresser, framed at a tilted overhead angle. Behind it, a stack of hardcover books, a lit votive candle, a ceramic vase of dried grasses and a leaning framed print blur out in warm diffused daylight. The camera drifts slowly down and right as those props leave frame and the flame flickers, cozy, photorealistic home decor commercial, shallow depth of field, warm grade.",
  },

  // ── Nature ──────────────────────────────────────────────────────────────
  {
    id: "misty_stone_bloom",
    name: "Misty Stone Bloom",
    category: "Nature",
    pexelsId: 7815883,
    seconds: 23.08,
    poster: "https://images.pexels.com/videos/7815883/art-background-ball-shaped-beach-7815883.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/7815883/7815883-sd_360_640_25fps.mp4",
    // Nearly static locked-off frame; ground fog drifts across the wet base while the botanical stems sway slightly.
    prompt:
      "The product stands centered on a wet mirror-black surface beaded with droplets, a rough grey stone slab and a violet mineral shard behind it, an arching stem of dark bell flowers and a slim green twig framing each side. Cool low-key light picks it out against a near-black backdrop. The camera holds a nearly static frame while low fog rolls past and the stems sway gently, photorealistic product commercial, deep shadows, cool moody grade.",
  },
  {
    id: "petal_bed_drift",
    name: "Petal Bed Drift",
    category: "Nature",
    pexelsId: 6965608,
    seconds: 9.56,
    poster: "https://images.pexels.com/videos/6965608/4k-video-april-beautiful-flowers-beauty-6965608.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/6965608/6965608-sd_360_640_25fps.mp4",
    // Slow handheld drift across the petal bed; petals shift and a green leaf slides through frame.
    prompt:
      "The product rests nestled in a dense bed of loose rose petals that fills the whole frame, cream and butter-yellow petals edged in coral, beaded with water droplets. Warm sunlight rakes across them for crisp highlights and soft shadow pockets. The camera drifts slowly over the bed, handheld, while petals shift and a single dark green leaf slides through frame. Lush, romantic mood, photorealistic macro product commercial, shallow depth of field, warm sunlit grade.",
  },
  {
    id: "pool_caustics",
    name: "Pool Caustics",
    category: "Nature",
    pexelsId: 9689396,
    seconds: 14.19,
    poster: "https://images.pexels.com/videos/9689396/4k-video-aqua-aquamarine-background-9689396.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/9689396/9689396-sd_360_640_30fps.mp4",
    // Locked-off overhead frame; only the ripples and the sunlit caustic net move across the water.
    prompt:
      "The product sits centered in a straight-down overhead frame, resting on the surface of a bright turquoise pool, the pale tiled floor visible below through clear water. Overhead sun throws a shifting net of white caustic lines across everything. The camera holds a nearly static locked-off frame with only the faintest drift as ripples travel through and the light net flexes, cool, fresh and summery, photorealistic product commercial, crisp saturated color, natural sunlight.",
  },
  {
    id: "turquoise_caustics",
    name: "Turquoise Caustics",
    category: "Nature",
    pexelsId: 27043898,
    seconds: 7.67,
    poster: "https://images.pexels.com/videos/27043898/summer-house-the-pool-27043898.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/27043898/12055073_360_640_60fps.mp4",
    // Locked-off overhead frame; only water ripples and light caustics move across the tile.
    prompt:
      "The product sits centered in an overhead frame, resting on the surface of clear turquoise pool water above a pale tiled floor crossed by thin dark grout lines. Bright midday sun scatters shifting white caustic ribbons across the tiles. A nearly static locked-off overhead frame holds steady while ripples travel continuously through the water, bending highlights and occasional rainbow flecks around the product. Fresh cooling summer mood, photorealistic product commercial, crisp highlights, vivid aquatic color grade.",
  },
  {
    id: "dew_leaf_macro",
    name: "Dew Leaf Macro",
    category: "Nature",
    pexelsId: 8374012,
    seconds: 14.77,
    poster: "https://images.pexels.com/videos/8374012/after-rain-after-the-rain-day-video-day-videos-8374012.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/8374012/8374012-sd_360_640_30fps.mp4",
    // Nearly static locked-off macro with a faint drift; beaded water droplets creep together and merge on the leaf.
    prompt:
      "The product rests on the broad, rain-soaked surface of a green leaf that fills the whole frame as both floor and backdrop, pale veins radiating out behind it. Soft, even daylight keeps the greens cool and fresh. The camera holds a nearly static locked-off macro frame with the faintest drift, while beaded droplets creep together and merge beside the product; calm and dewy, photorealistic macro product commercial, shallow depth of field, natural color grade.",
  },
  {
    id: "dew_leaf_macro_2",
    name: "Dew Leaf Macro",
    category: "Nature",
    pexelsId: 35177351,
    seconds: 20.63,
    poster: "https://images.pexels.com/videos/35177351/4k-nature-aqua-attention-to-detail-brasil-35177351.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/35177351/14903376_360_640_30fps.mp4",
    // Nearly static locked-off macro; the dewy leaf sways a hair as beaded droplets hold still.
    prompt:
      "The product rests in the foreground against a dew-covered leaf that fills the vertical frame, its glossy green surface beaded with water droplets. Layers of darker foliage sit behind it, falling away to a pale wall and a blurred terracotta pot. Light is even and cool. A nearly static locked-off frame breathes with the faintest drift while the leaves barely stir, calm and fresh, photorealistic botanical macro, shallow depth of field, cool natural grade.",
  },
  {
    id: "dewy_leaf_bokeh",
    name: "Dewy Leaf Bokeh",
    category: "Nature",
    pexelsId: 14468605,
    seconds: 8.51,
    poster: "https://images.pexels.com/videos/14468605/aesthetic-beautiful-calm-calming-14468605.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/14468605/14468605-sd_360_640_30fps.mp4",
    // Nearly static macro frame creeping almost imperceptibly downward; wet leaves sway slightly and droplets quiver.
    prompt:
      "The product stands upright in the lower foreground among rain-soaked leaves, a broad dew-beaded leaf angling across the frame beside it, dense green foliage and a soft cream highlight melting to bokeh behind. Diffuse overcast light keeps everything cool and damp. The camera holds a nearly static frame that drifts almost imperceptibly downward while wet leaves sway and droplets tremble, fresh and calm, photorealistic macro product commercial, shallow depth of field, lush natural grade.",
  },
  {
    id: "dewy_tulip_bed",
    name: "Dewy Tulip Bed",
    category: "Nature",
    pexelsId: 11510799,
    seconds: 39.08,
    poster: "https://images.pexels.com/videos/11510799/4k-video-aesthetic-aesthetic-background-aesthetic-desktop-background-11510799.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/11510799/11510799-sd_360_640_30fps.mp4",
    // Nearly static locked-off frame; a fine water mist arcs through the flowers as droplets bead and slide on petals and leaves.
    prompt:
      "The product rests at the centre of a dense bed of white tulips and glossy green leaves, framed tight against a soft pale grey backdrop. Even diffused daylight keeps everything bright and clean. The camera holds a nearly static locked-off frame while a fine jet of water mist arcs across the blooms, droplets beading and sliding down petals and leaves. Fresh and dewy, photorealistic product commercial, shallow depth of field, crisp natural color grade.",
  },

  // ── Bold ────────────────────────────────────────────────────────────────
  {
    id: "pink_ink_bloom",
    name: "Pink Ink Bloom",
    category: "Bold",
    pexelsId: 7565444,
    seconds: 24.44,
    poster: "https://images.pexels.com/videos/7565444/pexels-photo-7565444.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/7565444/7565444-sd_360_640_25fps.mp4",
    // Nearly static locked-off macro frame; pink and turquoise ink billows upward, swells toward camera and dissolves into pale haze.
    prompt:
      "The product stands enveloped in frame-filling clouds of ink drifting through water: turquoise surges up from below against black, then dense pink plumes billow in and overtake the frame, soft light glowing through the pigment. The locked-off macro camera barely moves as the ink swells toward the lens, turquoise sinking to the base and everything thinning into a milky pale-lavender wash. Photorealistic product commercial, saturated grade softening to low contrast, macro detail.",
  },
  {
    id: "pink_ink_bloom_2",
    name: "Pink Ink Bloom",
    category: "Bold",
    pexelsId: 15168372,
    seconds: 29.03,
    poster: "https://images.pexels.com/videos/15168372/abstract-art-backdrop-background-15168372.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/15168372/15168372-sd_360_640_30fps.mp4",
    // Locked-off static frame while pink ink tendrils rise and bloom upward through dark water, speckles drifting.
    prompt:
      "The product stands centered against a deep black void, submerged in clear water as blooms of soft pink dye rise past it from below. Light rakes through the plumes so the haze glows against the darkness. The camera holds a nearly static locked-off frame while ink tendrils curl upward, multiply and slowly fill the background alongside drifting magenta speckles, moody and hypnotic, photorealistic product commercial, macro clarity, high-contrast color grade.",
  },
  {
    id: "violet_ink_bloom",
    name: "Violet Ink Bloom",
    category: "Bold",
    pexelsId: 15168379,
    seconds: 19.59,
    poster: "https://images.pexels.com/videos/15168379/abstract-art-backdrop-background-15168379.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/15168379/15168379-sd_360_640_30fps.mp4",
    // Locked-off static frame; violet ink billows up from the bottom and spreads until it fills the background, lit specks drifting through.
    prompt:
      "The product stands centered in a tall vertical frame, suspended in a dark tank of water against pure black. Soft side light rakes its edges while fine white specks drift past. A locked-off static frame holds as dusty violet ink blooms in from the lower corners, curling into feathered tendrils that swell and slowly veil the background, moody and hypnotic, photorealistic product commercial, deep blacks, shallow depth of field.",
  },
  {
    id: "golden_foam_macro",
    name: "Golden Foam Macro",
    category: "Bold",
    pexelsId: 36016991,
    seconds: 23.82,
    poster: "https://images.pexels.com/videos/36016991/pexels-photo-36016991.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/36016991/15272353_360_640_30fps.mp4",
    // Slow downward drift as the golden bubble cluster quivers, merges and settles beneath sliding bokeh highlights.
    prompt:
      "The product stands centered, half-buried in a dense cluster of translucent soap bubbles that glow deep amber, with a dark shadowed void above and warm bokeh discs floating in it. Backlight rakes through the foam, edging every film in gold and tiny rainbow flecks. The camera drifts slowly downward as bubbles quiver, merge and settle, highlights sliding across them, rich and molten, photorealistic macro product commercial, extreme shallow focus, warm golden grade.",
  },
  {
    id: "smoke_ribbon",
    name: "Smoke Ribbon",
    category: "Bold",
    pexelsId: 35853584,
    seconds: 16.02,
    poster: "https://images.pexels.com/videos/35853584/pexels-photo-35853584.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=360&h=640",
    src: "https://videos.pexels.com/video-files/35853584/15204278_360_640_30fps.mp4",
    // Nearly static locked-off frame; only a pale smoke ribbon drifts and coils upward behind the product.
    prompt:
      "The product stands upright at centre in vertical close-up, perched on a small pale ceramic dome that catches light along the bottom edge. Behind it the set falls to charcoal darkness broken by a soft grey pool of light. A thin ribbon of pale smoke curls upward from the top of the product as the camera holds a nearly static locked-off frame, moody, photorealistic product commercial, low-key lighting, shallow depth of field, cinematic grade.",
  },
];

/**
 * Round-robin the catalog across its categories.
 *
 * The sidebar shelf shows the FIRST TWELVE templates and the "All" tab shows
 * this order top-down. Left grouped, both would open on twelve variations of
 * one category — the shelf's whole job is to advertise the range, so it has to
 * alternate. Categories keep their internal order, so the best-reviewed clip in
 * each is still the one that surfaces first.
 */
const interleaveByCategory = (items) => {
  const groups = [];
  const byCategory = new Map();
  for (const item of items) {
    let group = byCategory.get(item.category);
    if (!group) {
      group = [];
      byCategory.set(item.category, group);
      groups.push(group);
    }
    group.push(item);
  }
  const out = [];
  const deepest = Math.max(0, ...groups.map((g) => g.length));
  for (let i = 0; i < deepest; i++) {
    for (const group of groups) if (group[i]) out.push(group[i]);
  }
  return out;
};

export const PRODUCT_VIDEO_TEMPLATES = interleaveByCategory(CATALOG);

/**
 * Tabs in the "See all" browser: "All" plus every category that actually has
 * templates, in CATEGORY_ORDER. Anything in the catalog under a category the
 * order list forgot still gets a tab, appended at the end — a template that
 * exists but is unreachable would be the worse failure.
 */
export const PRODUCT_VIDEO_CATEGORIES = (() => {
  const present = new Set(CATALOG.map((t) => t.category));
  const ordered = CATEGORY_ORDER.filter((c) => present.has(c));
  const extras = [...present].filter((c) => !CATEGORY_ORDER.includes(c));
  return ["All", ...ordered, ...extras];
})();

/** Lookup by id — the modal resolves the selected template on every render. */
export const PRODUCT_VIDEO_TEMPLATES_BY_ID = Object.fromEntries(
  PRODUCT_VIDEO_TEMPLATES.map((t) => [t.id, t]),
);
