import { Square, RectangleVertical, RectangleHorizontal } from "lucide-react";

/**
 * Static options for the Magic Studio panel — kept out of the components so the
 * UI and the (future) generation request read from one list.
 */

/**
 * The panel's tabs.
 *
 * `tool` is the Magic Studio backend config id (see MAGIC_STUDIO_CONFIGS in
 * src/app/(dashboard)/(pages)/magic-studio/magicStudioConfigs.jsx). A tab with a
 * `tool` is LIVE — it runs the same generate + history endpoints as the Magic
 * Studio page, via MagicToolTab. A tab with `tool: null` is a placeholder that
 * still runs on the local stub generators in this folder, so it explains itself
 * ("isn't connected yet") instead of calling the backend.
 *
 * Video tools are deliberately absent: the editor composes a design to a static
 * image and has no video element, so a generated clip has nowhere to land (the
 * same rule the uploads panel states in useMediaInsert).
 */
export const MAGIC_TABS = [
  { id: "images", label: "Images", tool: "text_to_image" },
  { id: "variations", label: "Variations", tool: "image_to_variations" },
  { id: "persona", label: "Persona", tool: "persona_generator" },
  { id: "graphics", label: "Graphics", tool: null },
  { id: "3d", label: "3D", tool: null },
];

// Visual styles the prompt can be biased toward. `id` is what the request sends;
// "none" means "let the model decide".
export const STYLES = [
  { id: "none", label: "No style" },
  { id: "photo", label: "Photo" },
  { id: "digital-art", label: "Digital art" },
  { id: "3d", label: "3D render" },
  { id: "painting", label: "Painting" },
  { id: "watercolor", label: "Watercolor" },
  { id: "anime", label: "Anime" },
  { id: "neon", label: "Neon" },
  { id: "pixel", label: "Pixel art" },
  { id: "minimal", label: "Minimal" },
];

// Output aspect ratios. `w`/`h` are relative units used both for the requested
// generation size and to hint the inserted image's shape.
export const ASPECTS = [
  { id: "square", label: "Square", ratio: "1:1", w: 1, h: 1, icon: Square },
  {
    id: "portrait",
    label: "Portrait",
    ratio: "2:3",
    w: 2,
    h: 3,
    icon: RectangleVertical,
  },
  {
    id: "landscape",
    label: "Landscape",
    ratio: "3:2",
    w: 3,
    h: 2,
    icon: RectangleHorizontal,
  },
  {
    id: "wide",
    label: "Wide",
    ratio: "16:9",
    w: 16,
    h: 9,
    icon: RectangleHorizontal,
  },
  {
    id: "tall",
    label: "Tall",
    ratio: "9:16",
    w: 9,
    h: 16,
    icon: RectangleVertical,
  },
];

// Seed prompts for the "Inspire me" button.
export const INSPIRE_PROMPTS = [
  "A neon-lit cyberpunk street market in the rain at night",
  "A cozy reading nook by a rain-streaked window, warm morning light",
  "A majestic snow leopard resting on a mountain ridge at dawn",
  "An astronaut floating above a glowing coral-reef planet",
  "A minimalist product shot of a matte black watch on stone",
  "A whimsical treehouse village connected by rope bridges in a forest",
  "A vintage film-style portrait of a jazz musician in golden light",
  "An abstract flowing gradient of teal, violet and coral",
];

export const MIN_WORDS = 5;
export const GEN_COUNT = 4;
