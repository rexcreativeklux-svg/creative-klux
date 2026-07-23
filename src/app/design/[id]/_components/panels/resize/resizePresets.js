// Canvas resize presets for the editor's Resize panel. Self-contained here so
// the panel doesn't couple to the photo editor. Each item is a real target size
// in px; `ratio` is a display label only.
export const RESIZE_GROUPS = [
  {
    title: "Standard",
    items: [
      { id: "landscape", label: "Landscape", w: 2016, h: 1512, ratio: "4:3" },
      { id: "portrait", label: "Portrait", w: 1512, h: 2016, ratio: "3:4" },
      { id: "square", label: "Square", w: 1512, h: 1512, ratio: "1:1" },
    ],
  },
  {
    title: "Social media",
    items: [
      { id: "ig-story", label: "Instagram Story", w: 1080, h: 1920, ratio: "9:16" },
      { id: "ig-post", label: "Instagram Post", w: 1080, h: 1080, ratio: "1:1" },
      { id: "ig-portrait", label: "Instagram Portrait", w: 1080, h: 1350, ratio: "4:5" },
      { id: "ig-reel", label: "Instagram Reel", w: 1080, h: 1920, ratio: "9:16" },
      { id: "tiktok", label: "TikTok Post", w: 1080, h: 1920, ratio: "9:16" },
      { id: "yt-thumb", label: "YouTube Thumbnail", w: 1280, h: 720, ratio: "16:9" },
      { id: "yt-cover", label: "YouTube Channel Art", w: 2560, h: 1440, ratio: "16:9" },
      { id: "fb-post", label: "Facebook Post", w: 1200, h: 628, ratio: "1.91:1" },
      { id: "fb-cover", label: "Facebook Cover", w: 820, h: 312, ratio: "2.63:1" },
      { id: "li-banner", label: "LinkedIn Banner", w: 1584, h: 396, ratio: "4:1" },
      { id: "pinterest", label: "Pinterest Pin", w: 1000, h: 1500, ratio: "2:3" },
      { id: "twitter", label: "Twitter / X Post", w: 1600, h: 900, ratio: "16:9" },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { id: "etsy", label: "Etsy", w: 2048, h: 2048, ratio: "1:1" },
      { id: "ebay", label: "eBay", w: 1600, h: 1600, ratio: "1:1" },
      { id: "shopify", label: "Shopify Product", w: 2048, h: 2048, ratio: "1:1" },
      { id: "amazon", label: "Amazon Product", w: 2000, h: 2000, ratio: "1:1" },
    ],
  },
];
