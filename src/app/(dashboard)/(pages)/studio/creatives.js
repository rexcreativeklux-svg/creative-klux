// creatives.config.js
// Central config for all creative types and their categories.
// Add icons, colors, and category definitions here.

import {
  ImageIcon,
  Film,
  Boxes,
  Zap,
  Share2,
  Layers,
  LayoutTemplate,
  Sparkles,
} from "lucide-react";

export const CREATIVES = [
  {
    id: "ads_creative",
    label: "Ads Creative",
    desc: "Run Ads",
    inner: "Create high-converting ads for Google, Meta, TikTok & more",
    icon: ImageIcon,
    color: "#2563eb",       // blue
    categories: [
      { id: "image", label: "Image" },
      { id: "video", label: "Video" },
      { id: "interactive", label: "Interactive" },
      { id: "playable", label: "Playable" },
    ],
  },
  {
    id: "social_creative",
    label: "Social Creative",
    desc: "Create Content",
    inner: "Posts, reels, and stories for Instagram, TikTok, LinkedIn & more",
    icon: Share2,
    color: "#059669",       // emerald
    categories: [
      { id: "posts", label: "Posts" },
      { id: "reels", label: "Reels / Stories / Shorts" },
      { id: "banners_covers", label: "Banners / Covers" },
      { id: "thumbnails", label: "Thumbnails" },
      { id: "memes", label: "Memes / Trends" },
    ],
  },
  {
    id: "designer_creative",
    label: "Designer Creative",
    desc: "Design Anything",
    inner: "Logos, flyers, banners, brand assets & more",
    icon: Layers,
    color: "#7c3aed",       // violet
    categories: [
      { id: "logos", label: "Logos & Brand Identity" },
      { id: "business_cards", label: "Business Cards" },
      { id: "banners_print", label: "Banners (Print & Digital)" },
      { id: "flyers", label: "Flyers" },
      { id: "brochures", label: "Brochures" },
      { id: "posters", label: "Posters" },
      { id: "infographics", label: "Infographics" },
      { id: "presentation_decks", label: "Presentation Decks" },
      { id: "packaging", label: "Packaging Mockups" },
      { id: "digital_biz_cards", label: "Digital Business Cards" },
    ],
  },
  {
    id: "magic_studio",
    label: "Magic Studio",
    desc: "Magic Studio",
    inner: "Generate images, videos, variations, voiceovers, & more",
    icon: Sparkles,
    color: "#db2777",       // pink
    categories: [
      { id: "text_to_image", label: "Text to Image" },
      { id: "text_to_video", label: "Text to Video" },
      { id: "image_to_variations", label: "Image to Variations" },
      { id: "script_to_voiceover", label: "Script to Voiceover to Video" },
      { id: "audio_to_text", label: "Audio to Text" },
      { id: "persona_generator", label: "Persona-based Generator" },
      { id: "text_to_audio", label: "Text to Audio" },
    ],
  },
];

export const getCreativeById = (id) =>
  CREATIVES.find((c) => c.id === id) || CREATIVES[0];

export const getCategoryById = (creativeId, categoryId) => {
  const creative = getCreativeById(creativeId);
  return creative.categories.find((c) => c.id === categoryId) || creative.categories[0];
};