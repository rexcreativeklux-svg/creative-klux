/**
 * VIRTUAL_MODELS — the built-in model roster for the Virtual Model tool.
 *
 * ── What a model entry is ───────────────────────────────────────────────────
 * Each model is a reviewed reference photo (pinned by Pexels id) PLUS a written
 * `prompt` describing the person in it. Both travel to the backend on generate:
 * the photo as `model_image_url`, the description as part of `prompt`. The
 * backend keeps no model registry of its own — it only ever sees what we send —
 * so the description is what actually tells the generator who is wearing the
 * product. Picking a model seeds the prompt box with it, and the user can edit
 * it or send it as-is.
 *
 * ── Why pinned ids rather than a Pexels search ─────────────────────────────
 * A live search would reshuffle the roster every session and the descriptions
 * would stop matching their photos. Every id here was reviewed against its
 * description: build, hair, outfit, pose and backdrop all come from the actual
 * image. `px(pexelsId)` (constants.js) resizes by HEIGHT only — no crop — so
 * full figures stay intact, which is what a virtual-model reference needs.
 *
 * ── Adding a model ─────────────────────────────────────────────────────────
 * Clothing models live in MODEL_CATALOG below with a baked `prompt`. Every other
 * category has its own file in ./virtual-models/<category>.js, whose entries
 * carry a unique `id`, `name`, a short `desc` for the tile caption, the Pexels
 * id and a raw `description` of that exact person/shot; the category's prompt
 * wording is wrapped around it here. Ids must be unique across ALL files.
 *
 * Photos are Pexels (free commercial license, no attribution required).
 */

import { px } from "./constants";
import handheld from "./virtual-models/handheld";
import beauty from "./virtual-models/beauty";
import jewelry from "./virtual-models/jewelry";
import footwear from "./virtual-models/footwear";
import bags from "./virtual-models/bags";
import eyewear from "./virtual-models/eyewear";
import headwear from "./virtual-models/headwear";
import tech from "./virtual-models/tech";
import food from "./virtual-models/food";

/** Non-clothing rosters, keyed by MODEL_CATEGORIES id. */
const CATEGORY_CATALOGS = {
  handheld,
  beauty,
  jewelry,
  footwear,
  bags,
  eyewear,
  headwear,
  tech,
  food,
};

/** Reference photo URL for a model. Height-only resize keeps the full figure. */
export const modelImage = (pexelsId) => px(pexelsId);

const clean = (description) => String(description).trim().replace(/\.$/, "");

/**
 * Model categories — what kind of product a model's photo suits. Clothing needs
 * a full figure, but a serum wants a face, a ring wants a hand and a sneaker
 * wants feet, so each category frames its sentence for that shot.
 */
export const MODEL_CATEGORIES = [
  {
    id: "apparel",
    label: "Clothing",
    buildPrompt: (d) =>
      `Show the product worn by ${clean(d)}. ` +
      `Full-body e-commerce fashion photograph, natural proportions, photorealistic.`,
  },
  {
    id: "handheld",
    label: "Holding",
    buildPrompt: (d) =>
      `Show the product held in the hand of ${clean(d)}, with the product clearly visible and facing the camera. ` +
      `E-commerce lifestyle product photograph, natural hands and proportions, photorealistic.`,
  },
  {
    id: "beauty",
    label: "Beauty",
    buildPrompt: (d) =>
      `Show the product with ${clean(d)}, held near the face or being applied. ` +
      `Close-up beauty and skincare photograph, natural skin texture, photorealistic.`,
  },
  {
    id: "jewelry",
    label: "Jewelry",
    buildPrompt: (d) =>
      `Show the jewelry or watch worn by ${clean(d)}. ` +
      `Close-up jewelry detail photograph with the piece in sharp focus, natural skin texture, photorealistic.`,
  },
  {
    id: "footwear",
    label: "Shoes",
    buildPrompt: (d) =>
      `Show the shoes worn by ${clean(d)}. ` +
      `Close-up footwear photograph framed on the legs and feet with the shoes in sharp focus, photorealistic.`,
  },
  {
    id: "bags",
    label: "Bags",
    buildPrompt: (d) =>
      `Show the bag carried by ${clean(d)}, with the bag clearly visible. ` +
      `E-commerce accessories photograph, natural proportions, photorealistic.`,
  },
  {
    id: "eyewear",
    label: "Eyewear",
    buildPrompt: (d) =>
      `Show the glasses or sunglasses worn by ${clean(d)}, fitted naturally on the face. ` +
      `Eyewear portrait photograph with the frames in sharp focus, natural skin texture, photorealistic.`,
  },
  {
    id: "headwear",
    label: "Hats",
    buildPrompt: (d) =>
      `Show the hat or headwear worn by ${clean(d)}, sitting naturally on the head. ` +
      `Head-and-shoulders accessories photograph with the headwear in sharp focus, photorealistic.`,
  },
  {
    id: "tech",
    label: "Tech",
    buildPrompt: (d) =>
      `Show the device being used by ${clean(d)}, with the device clearly visible. ` +
      `Consumer-tech lifestyle photograph, natural hands and proportions, photorealistic.`,
  },
  {
    id: "food",
    label: "Food & Drink",
    buildPrompt: (d) =>
      `Show the food or drink product with ${clean(d)}, held or being enjoyed with the packaging clearly visible. ` +
      `Food and beverage lifestyle photograph, appetising and natural, photorealistic.`,
  },
];

const CATEGORIES_BY_ID = Object.fromEntries(
  MODEL_CATEGORIES.map((c) => [c.id, c]),
);

/** Category a model belongs to when its entry doesn't say. */
export const DEFAULT_CATEGORY_ID = "apparel";

/**
 * Wraps a model/appearance description into the instruction the generator gets.
 * Used for BOTH the built-in roster (at author time, baked into `prompt`) and a
 * user's own uploaded model (at runtime, around whatever they typed) so the two
 * paths send the same shape of sentence.
 *
 * @param {string} description Free-text description of the person.
 * @param {string} [category] A MODEL_CATEGORIES id; defaults to clothing.
 * @returns {string}
 */
export const buildModelPrompt = (description, category = DEFAULT_CATEGORY_ID) =>
  (CATEGORIES_BY_ID[category] || CATEGORIES_BY_ID[DEFAULT_CATEGORY_ID]).buildPrompt(
    description,
  );

const MODEL_CATALOG = [
  // ── Women ────────────────────────────────────────────────────────────────
  {
    id: "elena",
    name: "Elena",
    desc: "Woman, sage blouse, jeans",
    pexelsId: 18507452,
    prompt: buildModelPrompt(
      "a woman in her late twenties with shoulder-length light brown hair, wearing a loose sage-green button-up blouse and blue straight-leg jeans, standing squarely with her arms relaxed at her sides against a clean white studio background in soft even daylight",
    ),
  },
  {
    id: "nora",
    name: "Nora",
    desc: "Woman, white tee, light denim",
    pexelsId: 17542870,
    prompt: buildModelPrompt(
      "a young woman with long auburn hair, wearing a plain white t-shirt tucked into high-waisted light blue jeans, standing straight with one hand resting on her hip against a bright white studio background in soft even light",
    ),
  },
  {
    id: "mila",
    name: "Mila",
    desc: "Woman, black tank, jeans",
    pexelsId: 39257278,
    prompt: buildModelPrompt(
      "a woman with long dark hair, wearing a fitted black tank top tucked into loose blue straight-leg jeans, standing in a relaxed three-quarter pose with one hand on her hip against a plain white studio background in bright even light",
    ),
  },
  {
    id: "amara",
    name: "Amara",
    desc: "Woman, white top, grey denim",
    pexelsId: 27542891,
    prompt: buildModelPrompt(
      "a Black woman with short natural hair, wearing a fitted white long-sleeve top and grey skinny jeans with heeled sandals, standing with both hands on her hips against a pale grey studio background in soft even light",
    ),
  },
  {
    id: "zuri",
    name: "Zuri",
    desc: "Woman, black top, white trousers",
    pexelsId: 19663775,
    prompt: buildModelPrompt(
      "a Black woman with a rounded afro, wearing a black sleeveless turtleneck tucked into wide cream trousers with black ankle boots, standing in a poised open stance against a bright white studio background in clean even light",
    ),
  },
  {
    id: "ayo",
    name: "Ayo",
    desc: "Woman, black knit, cream trousers",
    pexelsId: 19307224,
    prompt: buildModelPrompt(
      "a Black woman with a soft afro, wearing a sleeveless black ribbed turtleneck and high-waisted cream trousers with black boots, standing side-on with a relaxed posture against a light grey studio background in soft directional light",
    ),
  },
  {
    id: "naya",
    name: "Naya",
    desc: "Woman, black top, wide jeans",
    pexelsId: 32995268,
    prompt: buildModelPrompt(
      "a Black woman with a full afro, wearing a black off-the-shoulder top and wide-leg black jeans, standing confidently with both hands on her hips against a plain white studio background in bright even light",
    ),
  },
  {
    id: "rin",
    name: "Rin",
    desc: "Woman, white shirt, dark denim",
    pexelsId: 26953103,
    prompt: buildModelPrompt(
      "an East Asian woman with long straight dark hair, wearing a crisp white button-up shirt tucked into dark wide-leg jeans, standing with her arms folded against a deep muted green studio background in soft moody light",
    ),
  },
  {
    id: "yuki",
    name: "Yuki",
    desc: "Woman, blazer, wide jeans",
    pexelsId: 7760002,
    prompt: buildModelPrompt(
      "an East Asian woman with long dark hair and a blunt fringe, wearing an oversized black blazer over a white crop top with light blue wide-leg jeans, standing casually with one hand in her pocket against an off-white studio background in soft daylight",
    ),
  },
  {
    id: "hana",
    name: "Hana",
    desc: "Woman, black suit",
    pexelsId: 26728093,
    prompt: buildModelPrompt(
      "an East Asian woman with dark hair tied back, wearing a tailored black blazer and matching trousers, standing elegantly with one hand raised near her shoulder against a soft grey studio background in gentle directional light",
    ),
  },
  {
    id: "imani",
    name: "Imani",
    desc: "Woman, burgundy blouse",
    pexelsId: 37039698,
    prompt: buildModelPrompt(
      "a Black woman with short cropped hair, wearing a burgundy satin blouse and black tailored trousers with heels, standing straight with her hands clasped in front of her against a neutral grey studio background in soft even light",
    ),
  },
  {
    id: "sienna",
    name: "Sienna",
    desc: "Woman, print blouse, flares",
    pexelsId: 32166791,
    prompt: buildModelPrompt(
      "a woman with long wavy brown hair, wearing a leopard-print satin blouse tucked into black flared trousers, standing with a relaxed hand on her hip against a plain white studio background in bright even light",
    ),
  },
  {
    id: "layla",
    name: "Layla",
    desc: "Woman, white suit, hijab",
    pexelsId: 31215272,
    prompt: buildModelPrompt(
      "a woman wearing a white hijab with a tailored white blazer and matching white trousers, standing gracefully with her hands together in front of her against a pale lilac-white studio background in soft even light",
    ),
  },
  {
    id: "nadia",
    name: "Nadia",
    desc: "Woman, black blouse, cream",
    pexelsId: 19456441,
    prompt: buildModelPrompt(
      "a woman with dark hair pulled back, wearing a black long-sleeve blouse and cream tailored trousers, standing with a warm relaxed smile and one hand at her side against a soft beige studio background in warm even light",
    ),
  },
  {
    id: "bianca",
    name: "Bianca",
    desc: "Woman, black camisole",
    pexelsId: 20610322,
    prompt: buildModelPrompt(
      "a woman with dark curly hair, wearing a black camisole and black slim jeans with heeled sandals, standing squarely with her arms behind her back against a bright white studio background in clean even light",
    ),
  },
  {
    id: "tabitha",
    name: "Tabitha",
    desc: "Woman, ochre blouse, denim",
    pexelsId: 31193987,
    prompt: buildModelPrompt(
      "a Black woman with a shaved head, wearing a loose mustard-ochre blouse and blue cropped jeans with tan heels, caught mid-step in a lively pose against a warm brown studio background in soft directional light",
    ),
  },
  {
    id: "ivy",
    name: "Ivy",
    desc: "Woman, black tee, jeans",
    pexelsId: 7319026,
    prompt: buildModelPrompt(
      "a woman with dark hair tied back, wearing a plain black t-shirt and blue jeans with white sneakers, seated on a low ledge with her hands resting on her knees against a soft dusty-pink background in even daylight",
    ),
  },
  {
    id: "camille",
    name: "Camille",
    desc: "Woman, cream suit",
    pexelsId: 3888221,
    prompt: buildModelPrompt(
      "a woman with voluminous curly hair, wearing a relaxed cream blazer and matching wide trousers, standing centred with a calm open posture against a warm beige seamless studio backdrop in soft moody light",
    ),
  },
  {
    id: "adaeze",
    name: "Adaeze",
    desc: "Woman, cream top, orange",
    pexelsId: 27950460,
    prompt: buildModelPrompt(
      "a Black woman with short dark hair, wearing a soft cream top and bright orange tailored trousers, standing with her arms folded against a warm tan studio background in soft warm light",
    ),
  },

  // ── Men ──────────────────────────────────────────────────────────────────
  {
    id: "marco",
    name: "Marco",
    desc: "Man, white tee, dark jeans",
    pexelsId: 8217535,
    prompt: buildModelPrompt(
      "a man in his late twenties with short dark hair and a trimmed beard, wearing a plain white crew-neck t-shirt and dark slim jeans, standing squarely with his arms relaxed at his sides against a pale off-white studio background in soft even light",
    ),
  },
  {
    id: "diego",
    name: "Diego",
    desc: "Man, all black",
    pexelsId: 32694255,
    prompt: buildModelPrompt(
      "a man with short dark hair, wearing a plain black t-shirt and black slim jeans, standing straight with a relaxed posture and hands at his sides against a clean white studio background in bright even light",
    ),
  },
  {
    id: "kwame",
    name: "Kwame",
    desc: "Man, sage tee, cream trousers",
    pexelsId: 7561443,
    prompt: buildModelPrompt(
      "a Black man with a short beard and glasses, wearing a loose pale sage t-shirt and relaxed cream trousers, standing calmly with his arms at his sides against a soft off-white studio background in gentle even light",
    ),
  },
  {
    id: "malik",
    name: "Malik",
    desc: "Man, black tee, black jeans",
    pexelsId: 31482885,
    prompt: buildModelPrompt(
      "a Black man with a rounded afro, wearing an oversized black t-shirt and black slim jeans, standing squarely with his arms loose at his sides against a light grey studio background in soft even light",
    ),
  },
  {
    id: "andre",
    name: "Andre",
    desc: "Man, denim jacket, streetwear",
    pexelsId: 39241290,
    prompt: buildModelPrompt(
      "a young Black man with short copper-toned curls, wearing an open light-wash denim jacket over a black t-shirt with baggy black jeans and sneakers, standing with both hands in his pockets against a white studio background in soft directional light",
    ),
  },
  {
    id: "jerome",
    name: "Jerome",
    desc: "Man, white tee, cargos",
    pexelsId: 8377394,
    prompt: buildModelPrompt(
      "a Black man with a short beard, wearing a fitted white t-shirt and olive cargo trousers, leaning slightly back with one hand on his chest against a cream draped fabric backdrop in warm soft light",
    ),
  },
  {
    id: "kenji",
    name: "Kenji",
    desc: "Man, white shirt, black trousers",
    pexelsId: 7139533,
    prompt: buildModelPrompt(
      "an East Asian man with short dark hair, wearing a loose white collarless shirt and black tailored trousers, standing beside a small white plinth with his hands clasped in front against a bright teal studio background in clean even light",
    ),
  },
  {
    id: "haruto",
    name: "Haruto",
    desc: "Man, black shirt, grey trousers",
    pexelsId: 31274809,
    prompt: buildModelPrompt(
      "an East Asian man with short dark hair, wearing a black button-up shirt with sleeves rolled and grey tailored trousers, standing straight with his hands at his sides against a dark charcoal studio background in soft moody light",
    ),
  },
  {
    id: "mateo",
    name: "Mateo",
    desc: "Man, blue shirt, jeans",
    pexelsId: 37741915,
    prompt: buildModelPrompt(
      "a man with short dark hair, wearing a light blue button-up shirt and blue jeans, standing casually with one hand in his pocket against a bright white studio background in soft even light",
    ),
  },
  {
    id: "felix",
    name: "Felix",
    desc: "Man, quilted jacket",
    pexelsId: 6211660,
    prompt: buildModelPrompt(
      "a man with short dark hair and glasses, wearing a beige quilted jacket over a teal shirt with dark jeans and brown boots, standing with one hand in his pocket against a pale grey studio background in soft even light",
    ),
  },
  {
    id: "luca",
    name: "Luca",
    desc: "Man, white tee, black trousers",
    pexelsId: 29727777,
    prompt: buildModelPrompt(
      "a man with short brown hair and light stubble, wearing a fitted white t-shirt and black trousers, standing squarely with both hands in his pockets against a soft off-white studio background in even daylight",
    ),
  },
  {
    id: "rae",
    name: "Rae",
    desc: "Cream shirt, black trousers",
    pexelsId: 7764014,
    prompt: buildModelPrompt(
      "an androgynous model with short cropped hair, wearing an oversized cream button-up shirt and loose black trousers, standing side-on in a relaxed editorial pose against a pale grey studio background in soft directional light",
    ),
  },
  {
    id: "victor",
    name: "Victor",
    desc: "Man, navy tee, jeans",
    pexelsId: 26125921,
    prompt: buildModelPrompt(
      "a middle-aged man with a fuller build and short greying hair, wearing a navy t-shirt and blue jeans with brown shoes, standing relaxed with his hands at his sides against a pale grey studio background in soft even light",
    ),
  },
  {
    id: "jamal",
    name: "Jamal",
    desc: "Man, plaid flannel",
    pexelsId: 30267274,
    prompt: buildModelPrompt(
      "a Black man with short hair, wearing an open black-and-white plaid flannel shirt over a dark tee with dark jeans, standing with one hand in his pocket against a pale blue studio background in soft even light",
    ),
  },
  {
    id: "tariq",
    name: "Tariq",
    desc: "Man, white tee, yellow set",
    pexelsId: 5622690,
    prompt: buildModelPrompt(
      "a young man wearing a backwards cap, a plain white t-shirt and black jeans, standing with one hand raised in a casual gesture against a bright saturated yellow studio background in punchy even light",
    ),
  },
  {
    id: "robin",
    name: "Robin",
    desc: "White tee, dark trousers",
    pexelsId: 6668809,
    prompt: buildModelPrompt(
      "a slim young person with very short light hair, wearing a plain white t-shirt and dark tapered trousers, standing squarely with arms relaxed at their sides against a pale neutral studio background in soft even light",
    ),
  },
  {
    id: "idris",
    name: "Idris",
    desc: "Man, denim shirt, jeans",
    pexelsId: 30133696,
    prompt: buildModelPrompt(
      "a man with dark hair and a full beard, wearing a light denim shirt over a printed tee with grey jeans, standing mid-stride in a relaxed walking pose against a bright white studio background in soft even light",
    ),
  },
];

/**
 * The roster the picker renders. `img` is resolved once here rather than in the
 * component so a re-render never rebuilds the list (and a user's own model,
 * which carries its own `img`, stays the same shape as a built-in one).
 */
export const VIRTUAL_MODELS = [
  ...MODEL_CATALOG.map((m) => ({ ...m, category: DEFAULT_CATEGORY_ID })),
  // Every other category lives in its own data file; the prompt is built here
  // so each entry only carries its raw description.
  ...Object.entries(CATEGORY_CATALOGS).flatMap(([category, list]) =>
    list.map((m) => ({
      ...m,
      category,
      prompt: buildModelPrompt(m.description, category),
    })),
  ),
].map((m) => ({ ...m, img: modelImage(m.pexelsId) }));

/** Lookup by id — the modal resolves the selected model on every render. */
export const VIRTUAL_MODELS_BY_ID = Object.fromEntries(
  VIRTUAL_MODELS.map((m) => [m.id, m]),
);

/** Default selection when the modal opens. */
export const DEFAULT_MODEL_ID = VIRTUAL_MODELS[0].id;
