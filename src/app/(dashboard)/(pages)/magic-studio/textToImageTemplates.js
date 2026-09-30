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
 */

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
];

/**
 * The catalog in the shape the Templates canvas reads: card and viewer sizes of
 * the same photo, plus the shape the card reserves while it loads.
 */
export const TEXT_TO_IMAGE_TEMPLATES = CATALOG.map((entry) => ({
  ...entry,
  thumb: pexels(entry.pexelsId, 600),
  image: pexels(entry.pexelsId, 1600),
  source: `https://www.pexels.com/photo/${entry.pexelsId}/`,
}));

/**
 * Which tools have a Templates canvas. Text to Image and the three design tools
 * built on it — a tool not listed here opens on Create as it always has.
 */
const TEMPLATES_BY_TOOL = {
  text_to_image: TEXT_TO_IMAGE_TEMPLATES,
  "image-design": TEXT_TO_IMAGE_TEMPLATES,
  "social-design": TEXT_TO_IMAGE_TEMPLATES,
  "ad-design": TEXT_TO_IMAGE_TEMPLATES,
};

/** The templates for a tool, or null when it has none. */
export const templatesFor = (toolId) => TEMPLATES_BY_TOOL[toolId] || null;
