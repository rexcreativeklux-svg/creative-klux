/**
 * Instant Backdrop's scene photos — empty podiums, surfaces, textures and
 * staged sets the cut-out product is layered onto. Lives apart from
 * BackgroundRemoverModal so the Product Studio page can list them as presets
 * without importing the whole editor.
 *
 * Photos are Pexels (free commercial license, no attribution required).
 */

const pxbg = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=600`;
// Product-display backdrops — empty podiums, pedestals and staged surfaces a product can sit on.
export const IMAGE_BACKGROUNDS = [
  // ── Podium ──
  {
    id: "podium_beige",
    name: "Beige Podium",
    category: "Podium",
    url: pxbg(7897470),
  },
  {
    id: "podium_yellow",
    name: "Yellow Podium",
    category: "Podium",
    url: pxbg(16042675),
  },
  {
    id: "podium_green",
    name: "Green Podium",
    category: "Podium",
    url: pxbg(16059552),
  },
  {
    id: "podium_pink",
    name: "Pink Podium",
    category: "Podium",
    url: pxbg(12932574),
  },
  {
    id: "podium_arch",
    name: "Arch Display",
    category: "Podium",
    url: pxbg(12914280),
  },
  {
    id: "podium_white",
    name: "White Podium",
    category: "Podium",
    url: pxbg(35073010),
  },
  // ── Minimal ──
  {
    id: "min_geometric",
    name: "White Geometric",
    category: "Minimal",
    url: pxbg(16149990),
  },
  {
    id: "min_arch",
    name: "Arch Platform",
    category: "Minimal",
    url: pxbg(6840026),
  },
  {
    id: "min_soft",
    name: "Soft White",
    category: "Minimal",
    url: pxbg(15067862),
  },
  {
    id: "min_leaf",
    name: "Leaf Shadow",
    category: "Minimal",
    url: pxbg(12198526),
  },
  {
    id: "min_spa",
    name: "Spa Minimal",
    category: "Minimal",
    url: pxbg(8015809),
  },
  {
    id: "min_shadows",
    name: "Soft Shadows",
    category: "Minimal",
    url: pxbg(8015461),
  },
  // ── Surface ──
  {
    id: "surf_wood",
    name: "Wood Table",
    category: "Surface",
    url: pxbg(34658646),
  },
  {
    id: "surf_marble",
    name: "White Marble",
    category: "Surface",
    url: pxbg(3847496),
  },
  {
    id: "surf_marble_dark",
    name: "Dark Marble",
    category: "Surface",
    url: pxbg(18325786),
  },
  {
    id: "surf_stone",
    name: "Stone Counter",
    category: "Surface",
    url: pxbg(7533765),
  },
  {
    id: "surf_marble_close",
    name: "Marble Close-up",
    category: "Surface",
    url: pxbg(4705932),
  },
  {
    id: "surf_speckled",
    name: "Speckled Stone",
    category: "Surface",
    url: pxbg(7232667),
  },
  // ── Gradient ──
  {
    id: "grad_peach",
    name: "Peach Gradient",
    category: "Gradient",
    url: pxbg(7130564),
  },
  {
    id: "grad_pastel",
    name: "Pastel Gradient",
    category: "Gradient",
    url: pxbg(7135055),
  },
  {
    id: "grad_abstract",
    name: "Abstract Blend",
    category: "Gradient",
    url: pxbg(7135028),
  },
  {
    id: "grad_pinkyellow",
    name: "Pink & Yellow",
    category: "Gradient",
    url: pxbg(7130557),
  },
  {
    id: "grad_green",
    name: "Green Glow",
    category: "Gradient",
    url: pxbg(6985185),
  },
  {
    id: "grad_soft",
    name: "Soft Tones",
    category: "Gradient",
    url: pxbg(7135024),
  },
  // ── Texture (new) ──
  {
    id: "tex_concrete",
    name: "Concrete Wall",
    category: "Texture",
    url: pxbg(2463329),
  },
  {
    id: "tex_rough",
    name: "Rough Concrete",
    category: "Texture",
    url: pxbg(3964666),
  },
  {
    id: "tex_stucco",
    name: "Light Stucco",
    category: "Texture",
    url: pxbg(12901948),
  },
  {
    id: "tex_plaster",
    name: "Beige Plaster",
    category: "Texture",
    url: pxbg(12998745),
  },
  {
    id: "tex_surface",
    name: "Concrete Surface",
    category: "Texture",
    url: pxbg(247719),
  },
  // ── Fabric (new) ──
  {
    id: "fab_linen",
    name: "Neutral Linen",
    category: "Fabric",
    url: pxbg(7794365),
  },
  {
    id: "fab_canvas",
    name: "Beige Canvas",
    category: "Fabric",
    url: pxbg(7533979),
  },
  {
    id: "fab_crumpled",
    name: "Crumpled Linen",
    category: "Fabric",
    url: pxbg(6843273),
  },
  {
    id: "fab_silk",
    name: "Cream Silk",
    category: "Fabric",
    url: pxbg(7988399),
  },
  {
    id: "fab_satin_black",
    name: "Black Satin",
    category: "Fabric",
    url: pxbg(8007352),
  },
  {
    id: "fab_satin_pink",
    name: "Pink Satin",
    category: "Fabric",
    url: pxbg(7956629),
  },
  // ── Nature (new) ──
  {
    id: "nat_palm_shadow",
    name: "Palm Shadow",
    category: "Nature",
    url: pxbg(6793893),
  },
  {
    id: "nat_frond",
    name: "Frond Shadow",
    category: "Nature",
    url: pxbg(27394932),
  },
  {
    id: "nat_sand",
    name: "Rippled Sand",
    category: "Nature",
    url: pxbg(19215108),
  },
  {
    id: "nat_sand_coast",
    name: "Coastal Sand",
    category: "Nature",
    url: pxbg(1478450),
  },
  {
    id: "nat_tulips",
    name: "White Tulips",
    category: "Nature",
    url: pxbg(30399673),
  },
  {
    id: "nat_roses",
    name: "Red Roses",
    category: "Nature",
    url: pxbg(13246785),
  },
  // ── Paper (new) ──
  {
    id: "paper_pastel",
    name: "Pastel Papers",
    category: "Paper",
    url: pxbg(8559014),
  },
  {
    id: "paper_sheets",
    name: "Colored Sheets",
    category: "Paper",
    url: pxbg(7457657),
  },
  {
    id: "paper_flatlay",
    name: "Paper Flatlay",
    category: "Paper",
    url: pxbg(9389596),
  },
  {
    id: "paper_abstract",
    name: "Abstract Paper",
    category: "Paper",
    url: pxbg(7953539),
  },
  {
    id: "paper_rolled",
    name: "Rolled Paper",
    category: "Paper",
    url: pxbg(36135531),
  },
  {
    id: "paper_rolled2",
    name: "Rolled Color",
    category: "Paper",
    url: pxbg(36135526),
  },
];

// Order categories appear in the Image-background tab.
export const IMAGE_BG_CATEGORIES = [
  "Podium",
  "Minimal",
  "Surface",
  "Gradient",
  "Texture",
  "Fabric",
  "Nature",
  "Paper",
];
