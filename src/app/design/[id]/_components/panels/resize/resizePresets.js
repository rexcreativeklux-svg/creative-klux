// Canvas resize presets for the editor's Resize panel. Self-contained here so
// the panel doesn't couple to the photo editor. Each item is a real target size
// in px; `ratio` is a display label only.
//
// `icon` is the tile's artwork, served from /public/images/resize. It names the
// PLATFORM rather than the size, which is why the four Instagram presets share
// one file. A preset without artwork falls back to the letter badge the panel
// already draws, so adding a size never requires adding an image first.
const ICON = (name) => `/images/resize/${name}.webp`;
export const RESIZE_GROUPS = [
  {
    title: "Standard",
    items: [
      { id: "landscape", label: "Landscape", w: 2016, h: 1512, ratio: "4:3", icon: ICON("landscape") },
      { id: "portrait", label: "Portrait", w: 1512, h: 2016, ratio: "3:4", icon: ICON("portrait") },
      { id: "square", label: "Square", w: 1512, h: 1512, ratio: "1:1", icon: ICON("square") },
    ],
  },
  {
    title: "Social media",
    items: [
      { id: "ig-story", label: "Instagram Story", w: 1080, h: 1920, ratio: "9:16", icon: ICON("instagram") },
      { id: "ig-post", label: "Instagram Post", w: 1080, h: 1080, ratio: "1:1", icon: ICON("instagram") },
      { id: "ig-portrait", label: "Instagram Portrait", w: 1080, h: 1350, ratio: "4:5", icon: ICON("instagram") },
      { id: "ig-reel", label: "Instagram Reel", w: 1080, h: 1920, ratio: "9:16", icon: ICON("instagram") },
      { id: "tiktok", label: "TikTok Post", w: 1080, h: 1920, ratio: "9:16", icon: ICON("tiktok") },
      { id: "yt-thumb", label: "YouTube Thumbnail", w: 1280, h: 720, ratio: "16:9", icon: ICON("youtube") },
      { id: "yt-cover", label: "YouTube Channel Art", w: 2560, h: 1440, ratio: "16:9", icon: ICON("youtube") },
      { id: "fb-post", label: "Facebook Post", w: 1200, h: 628, ratio: "1.91:1", icon: ICON("facebook") },
      { id: "fb-cover", label: "Facebook Cover", w: 820, h: 312, ratio: "2.63:1", icon: ICON("facebook") },
      { id: "li-banner", label: "LinkedIn Banner", w: 1584, h: 396, ratio: "4:1", icon: ICON("linkedin") },
      { id: "pinterest", label: "Pinterest Pin", w: 1000, h: 1500, ratio: "2:3", icon: ICON("pinterest") },
      { id: "twitter", label: "Twitter / X Post", w: 1600, h: 900, ratio: "16:9", icon: ICON("twitter") },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { id: "etsy", label: "Etsy", w: 2048, h: 2048, ratio: "1:1", icon: ICON("etsy") },
      { id: "ebay", label: "eBay", w: 1600, h: 1600, ratio: "1:1", icon: ICON("ebay") },
      { id: "shopify", label: "Shopify Product", w: 2048, h: 2048, ratio: "1:1", icon: ICON("shopify") },
      { id: "amazon", label: "Amazon Product", w: 2000, h: 2000, ratio: "1:1", icon: ICON("amazon") },
    ],
  },
];
