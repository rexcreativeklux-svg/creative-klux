// Preset artwork for the Product Studio landing page — the backdrop rows under
// "Get started" and everything "Show more" appends below them.
//
// Every Pexels id here was fetched and eyeballed before it landed in this file;
// dead ids on that CDN answer 200 with a ~27-byte body rather than a 404, so a
// broken one shows up as an empty tile, not an error. Re-check before swapping.

export const px = (id, w = 600) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

// The sample products the swatch rows are built from. All three are shot on a
// near-white sweep, which is what lets ONE photo preview every backdrop:
// rendered with mix-blend-multiply the white drops out and the tile's own
// colour shows through, the way a cutout on that backdrop would look.
export const PRESET_SNEAKER = px(14174469, 400); // Classics + Studio
export const PRESET_TEE = px(12025472, 400); // Essentials + Professional
export const PRESET_PORTRAIT = px(5310745, 400); // Photo Editing Classics
export const PRESET_HEADSHOT = px(12311550, 400); // Profile Pics

export const getStarted = [
  { label: "Remove a background", img: px(11324548) }, // sneakers on a red sweep
  { label: "Generate AI backgrounds", img: px(9267583) }, // bags styled on foliage
  { label: "Edit hundreds of images at once", img: px(8335273) }, // a row of bags
  { label: "Retouch an image", img: px(7290611) }, // cosmetics flat lay
];

export const classics = [
  { label: "White", bg: "bg-white border border-gray-200", img: PRESET_SNEAKER },
  // Black and Original Image carry artwork already shot on their own backdrop —
  // multiplying a white sweep onto black would just swallow the product.
  {
    label: "Black",
    bg: "bg-black",
    img: px(17918935, 400),
    blend: false,
    active: true,
  },
  {
    label: "Transparent",
    bg: 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2210%22%20height%3D%2210%22%3E%3Crect%20width%3D%225%22%20height%3D%225%22%20fill%3D%22%23ccc%22/%3E%3Crect%20x%3D%225%22%20y%3D%225%22%20width%3D%225%22%20height%3D%225%22%20fill%3D%22%23ccc%22/%3E%3C/svg%3E")]',
    img: PRESET_SNEAKER, // multiply keeps the checker visible through the sweep
  },
  {
    label: "Original Image",
    bg: "bg-[#f5f0e8]",
    img: px(9244881, 400),
    blend: false,
  },
];

export const studioColors = [
  "#f5f0e0",
  "#ede8d8",
  "#e0dbd0",
  "#f0ede0",
  "#f5e8e0",
  "#e8f0e0",
  "#e0eef5",
  "#f5e0ed",
];

// Essentials / Professional — plain-backdrop ramps, light to dark, the way a
// seller steps through neutrals looking for the one their product sits best on.
// Both stop at mid-dark: multiply is what puts the garment on the colour, and
// past roughly #4a4a4a the tile goes black and the garment stops being visible.
export const essentialColors = [
  "#ffffff",
  "#faf9f7",
  "#f4f1ec",
  "#efeae2",
  "#e8e2d8",
  "#e2ddd4",
  "#dcd5c9",
  "#d4ccbf",
  "#e9e4e6",
  "#dfdae4",
  "#d6dee4",
  "#d2ddd6",
  "#c9c2b4",
  "#bdb5a6",
  "#b0a89a",
  "#a39a8c",
  "#95a0a6",
  "#8a9199",
  "#7d8478",
  "#77706a",
  "#6b645c",
  "#5e574f",
  "#544d46",
  "#49433d",
];

// Same idea, warm half of the wheel — the studio-lit look sellers pick for
// apparel when a cool grey reads as washed out.
export const professionalColors = [
  "#ffffff",
  "#fbfaf8",
  "#f5f2ec",
  "#efece5",
  "#eae5db",
  "#e6ded1",
  "#f0e7dd",
  "#f2e0d4",
  "#eed6c8",
  "#e8cdbd",
  "#dfc0ae",
  "#d3b3a1",
];

// ── Photo Editing Classics ──
// One portrait, seven treatments, done in CSS so the row previews the actual
// effect rather than shipping seven stock photos that only look like it.
// `motion` and `splash` are not single filters — see PresetStrip for how each
// is composited.
export const photoFilters = [
  { label: "Blur", filter: "blur(2px)" },
  { label: "Color Splash", kind: "splash" },
  { label: "Motion", kind: "motion" },
  { label: "Low key", filter: "brightness(0.55) contrast(1.35) saturate(0.9)" },
  { label: "High key", filter: "brightness(1.25) contrast(0.85) saturate(0.7)" },
  { label: "Sepia", filter: "sepia(0.85) contrast(1.05)" },
  { label: "Black & White", filter: "grayscale(1) contrast(1.1)" },
];

// ── Trending ── styled product shots, the sort of thing the template row sells.
export const trending = [
  px(6801177, 400),
  px(6206310, 400),
  px(11145797, 400),
  px(8166432, 400),
  px(11324548, 400),
  px(9267583, 400),
  px(7290611, 400),
  px(8335273, 400),
  px(5717972, 400),
  px(12969358, 400),
  px(4841286, 400),
  px(10919291, 400),
];

// ── Marble & Wood ── surfaces rather than sweeps: the product sits ON something.
export const marbleAndWood = [
  px(4968690, 400),
  px(1906440, 400),
  px(4087266, 400),
  px(34520234, 400),
  px(8251873, 400),
  px(5864348, 400),
  px(8187053, 400),
  px(7814958, 400),
  px(5827769, 400),
  px(12310576, 400),
];

// ── Profile Pics ── the headshot ringed by a flat colour. No blending here: a
// multiply over saturated colour tints the face, which is the one thing a
// profile picture cannot afford.
export const avatarColors = [
  "#7c3aed",
  "#ec4899",
  "#f59e0b",
  "#0ea5e9",
  "#111827",
  "#14b8a6",
  "#22c55e",
  "#f97316",
  "#ef4444",
  "#a3e635",
  "#6366f1",
  "#94a3b8",
];
