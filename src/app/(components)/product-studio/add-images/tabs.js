// Tab config for the Photoroom-style "Add images" modal.
// The "all" tab is fully built; the rest are placeholders until their designs
// land (Shopify + Uploads screens are being provided next). Keeping the config
// in one place lets AddImagesModal map tab id → content without hardcoding.
export const ADD_IMAGES_TABS = [
  { id: "all", label: "All" },
  { id: "uploads", label: "Uploads" },
  { id: "shopify", label: "Shopify products" },
  { id: "ai", label: "AI images" },
  { id: "designs", label: "Designs" },
];
