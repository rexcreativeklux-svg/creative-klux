// SmartLink block types, themes and helpers — the prototype's BT / THEMES /
// LINK_TYPES / TEMPLATES, matched to the API's block fields (only these are
// kept by the server; clicks and customers are computed there).

export const BT = {
  header: { name: "Profile header", g: "◎", color: "#1447e6", tint: "#eef2fd", ring: "#c9d6fb", desc: "Photo, name and short bio" },
  button: { name: "Button", g: "↗", color: "#0a7a48", tint: "#edf8f2", ring: "#cdeedc", desc: "Website, WhatsApp, booking, email or call" },
  booking: { name: "Booking", g: "◷", color: "#6d28d9", tint: "#f4effe", ring: "#e2d6fb", desc: "A service with price and a book button" },
  creative: { name: "Creative", g: "▣", color: "#e8590c", tint: "#fff4ed", ring: "#fde2cf", desc: "A design from your Creative Studio" },
  form: { name: "Email sign-up", g: "✉", color: "#1c64d6", tint: "#eef4fe", ring: "#d1e0fb", desc: "Collect emails, send them to Smart Inbox" },
  video: { name: "Video", g: "▶", color: "#e62117", tint: "#fdeeee", ring: "#f6c9cb", desc: "A YouTube, TikTok or Reel video" },
  text: { name: "Text", g: "T", color: "#4a4f5c", tint: "#f4f5f7", ring: "#e3e5ea", desc: "A short paragraph" },
  socials: { name: "Social icons", g: "@", color: "#c13584", tint: "#fdf0f5", ring: "#f8d4e3", desc: "Icons that open your profiles" },
};

export const THEMES = {
  klux: { name: "Klux Blue", bg: "#1447e6", fg: "#ffffff", btnBg: "#ffffff", btnFg: "#1447e6" },
  midnight: { name: "Midnight", bg: "#0b1533", fg: "#ffffff", btnBg: "#1447e6", btnFg: "#ffffff" },
  clean: { name: "Clean", bg: "#ffffff", fg: "#0d0f14", btnBg: "#0d0f14", btnFg: "#ffffff" },
  warm: { name: "Warm", bg: "#fff4ed", fg: "#3b1d0a", btnBg: "#e8590c", btnFg: "#ffffff" },
};

export const LINK_TYPES = { url: "Website link", whatsapp: "WhatsApp chat", booking: "Booking page", email: "Email", phone: "Phone call" };

/** Social block keys → the network key in shared.jsx's CH. */
export const SOCIAL_KEYS = [
  ["instagram", "instagram"], ["tiktok", "tiktok"], ["facebook", "facebook"], ["whatsapp", "whatsapp"],
  ["linkedin", "linkedin"], ["youtube", "youtube"], ["x", "x"],
];

/** The four starting points the API accepts (`template`). */
export const TEMPLATES = {
  blank: { name: "Blank", g: "+", color: "#4a4f5c", tint: "#f4f5f7", desc: "Profile and one button" },
  bookings: { name: "Get bookings", g: "◷", color: "#6d28d9", tint: "#f4effe", desc: "Service, price, WhatsApp" },
  shop: { name: "Sell products", g: "$", color: "#0a7a48", tint: "#edf8f2", desc: "Creative and shop buttons" },
  offer: { name: "Promote an offer", g: "%", color: "#c2410c", tint: "#fff5eb", desc: "Offer, sign-up, socials" },
};

const uid = () => "k" + Math.random().toString(36).slice(2, 12);

/** A new block with the fields the API keeps for its type. */
export function newBlock(type) {
  const d = {
    header: { name: "Your business name", bio: "What you do, for whom, and where", img: "" },
    button: { label: "New button", linkType: "url", url: "https://", style: "secondary" },
    booking: { service: "Your service", price: "", was: "", duration: "", label: "Book now", url: "https://" },
    creative: { img: "", caption: "Our latest offer", url: "https://" },
    form: { title: "Get offers by email", placeholder: "Your email", label: "Sign me up", toInbox: true },
    video: { title: "Watch: how we work", url: "https://", img: "" },
    text: { text: "Write something your visitors should know.", align: "center" },
    socials: { instagram: "", tiktok: "", facebook: "", whatsapp: "", linkedin: "", youtube: "", x: "" },
  }[type];
  return { id: uid(), type, on: true, ...d };
}
export const copyBlock = (b) => {
  const c = { ...b, id: uid() };
  delete c.clicks;
  delete c.customers;
  return c;
};

export function blockTitle(b, CH) {
  switch (b.type) {
    case "header": return b.name || "Profile header";
    case "button": return b.label || "Button";
    case "booking": return b.service || "Booking";
    case "creative": return b.caption || "Creative";
    case "form": return b.title || "Email sign-up";
    case "video": return b.title || "Video";
    case "text": return (b.text || "Text").slice(0, 48);
    case "socials": {
      const n = SOCIAL_KEYS.filter(([k]) => b[k]).map(([, c]) => CH[c]?.name || c);
      return n.length ? n.join(", ") : "Social icons";
    }
    default: return "Block";
  }
}

export function blockMeta(b) {
  const clicks = `${b.clicks || 0} clicks`;
  if (b.type === "button") return `${LINK_TYPES[b.linkType] || "Link"} · ${clicks}`;
  if (b.type === "booking") return `${b.price !== "" && b.price != null ? Number(b.price).toLocaleString("en-US") : "No price"} · ${clicks}`;
  if (["creative", "form", "video", "socials"].includes(b.type)) return `${BT[b.type].name} · ${clicks}`;
  return BT[b.type]?.name || b.type;
}

/** Why a block's address won't work, or "". */
export function urlHint(b) {
  if (!["button", "booking", "creative", "video"].includes(b.type)) return "";
  const t = b.type === "button" ? b.linkType || "url" : "url";
  const v = (b.url || "").trim();
  if (t === "url" || t === "booking") return /^https:\/\/[^\s.]+\.[^\s]+/.test(v) ? "" : "Enter a full web address starting with https://";
  if (t === "whatsapp" || t === "phone") return /^\+?[0-9 ()-]{7,}$/.test(v) ? "" : "Enter a phone number with country code, e.g. +1 512 555 0199";
  if (t === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Enter an email address.";
  return "";
}

/** The doc's address rules, checked before asking the server. */
const RESERVED = ["admin", "app", "api", "login", "help", "support", "creativeklux", "www", "static"];
export function slugError(slug) {
  if (!slug) return "Add a link address.";
  if (slug.length < 3) return "Use at least 3 characters.";
  if (slug.length > 40) return "Use 40 characters or fewer.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return "Use lowercase letters, numbers and single dashes.";
  if (RESERVED.includes(slug)) return "That address is reserved.";
  return "";
}
export const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

/** The public address without the scheme, for showing. */
export const shortUrl = (l) => String(l?.url || "").replace(/^https?:\/\//, "");
