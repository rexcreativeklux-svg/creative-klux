"use client";

/**
 * magicStudioConfigs.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Per-category configuration for the two-side Magic Studio modal
 * (MagicStudioModal). Modeled on product-photos' `onDeviceToolConfigs` — the
 * modal shell is generic and every category is described here as data:
 *
 *   • header      → title, accent, sample before/after + copy for the empty state
 *   • input       → which primary input the left sidebar renders
 *                   ("prompt" | "script" | "text" | "image" | "audio" | "persona")
 *   • options     → the option ROWS in the sidebar. Each row opens a rich,
 *                   side-anchored FloatingPanel (product-photos styling) whose
 *                   cards carry an image/icon + label + description.
 *   • resultType  → how the right canvas renders output
 *                   ("image" | "video" | "audio" | "text")
 *   • generate    → async ({ input, values, helpers }) => result
 *                   Reuses the SAME endpoints the old forms used (/api/pexels,
 *                   /api/transcribe, …) so behavior is preserved.
 *
 * Swap the placeholder Unsplash/Pexels URLs in `samples`/option `img`s for real
 * media whenever ready — drop files in /public and use "/your-file.jpg", or
 * paste a full external URL.
 */

import {
  FileImage,
  Video,
  Layers,
  Mic,
  AudioLines,
  User,
  Music,
  Camera,
  Smile,
  Shapes,
  Star,
  Droplet,
  Palette,
  Cpu,
  Minus,
  Film,
  Aperture,
  Zap,
  Clock,
  Gauge,
  Heart,
  Leaf,
  Flame,
  Briefcase,
  Landmark,
  Sparkles,
  BookOpen,
  Info,
  Laugh,
  MessageCircle,
  AlarmClock,
  Pencil,
  Grid3x3,
  FileText,
  Baby,
  Crown,
} from "lucide-react";

// Pexels CDN helper (free license, stable URLs) for rich option-card thumbnails.
const px = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&h=300`;

// Proxy helpers (mirrors what the old forms used).
const proxyMedia = (url) => `/api/proxy-media?url=${encodeURIComponent(url)}`;

// ── Shared aspect-ratio option set (rich cards render a scaled frame) ─────────
const RATIO_SQUARE = { value: "square", label: "Square", ratio: "1:1", w: 1, h: 1 };
const RATIO_LANDSCAPE = { value: "landscape", label: "Landscape", ratio: "16:9", w: 16, h: 9 };
const RATIO_PORTRAIT = { value: "portrait", label: "Portrait", ratio: "9:16", w: 9, h: 16 };
const RATIO_WIDE = { value: "wide", label: "Ultra Wide", ratio: "21:9", w: 21, h: 9 };

// ── Visual-style cards (shared between Text-to-Image / Text-to-Video) ─────────
const IMAGE_STYLES = [
  { value: "photorealistic", label: "Photorealistic", desc: "True-to-life detail", icon: Camera, img: px(1707820) },
  { value: "cinematic", label: "Cinematic", desc: "Film-grade lighting", icon: Film, img: px(2873486) },
  { value: "anime", label: "Anime", desc: "Japanese animation", icon: Star, img: px(1183992) },
  { value: "cartoon", label: "Cartoon", desc: "Bold & playful", icon: Smile, img: px(207983) },
  { value: "watercolor", label: "Watercolor", desc: "Soft painted washes", icon: Droplet, img: px(1053687) },
  { value: "oil_painting", label: "Oil Painting", desc: "Rich brush texture", icon: Palette, img: px(1585325) },
  { value: "cyberpunk", label: "Cyberpunk", desc: "Neon futuristic", icon: Cpu, img: px(2311602) },
  { value: "abstract", label: "Abstract", desc: "Shapes & color", icon: Shapes, img: px(1616403) },
  { value: "minimalist", label: "Minimalist", desc: "Clean & simple", icon: Minus, img: px(1103970) },
  { value: "vintage", label: "Vintage", desc: "Retro film look", icon: Aperture, img: px(1183434) },
  { value: "neon", label: "Neon / Glow", desc: "Vivid glow", icon: Zap, img: px(1631677) },
];

// Style keyword map for pexels queries (kept from the old forms).
const STYLE_KEYWORDS = {
  photorealistic: "realistic cinematic high quality",
  cinematic: "cinematic dramatic lighting",
  anime: "anime japanese animation",
  cartoon: "cartoon animated colorful",
  watercolor: "watercolor painting style",
  oil_painting: "oil painting style",
  cyberpunk: "cyberpunk neon futuristic",
  abstract: "abstract surreal",
  minimalist: "minimalist clean aesthetic",
  vintage: "vintage retro film",
  neon: "neon glow vibrant",
};

const orientationOf = (ratio) =>
  ratio === "portrait" ? "portrait" : ratio === "landscape" || ratio === "wide" ? "landscape" : "square";

// ── Pexels result mappers ────────────────────────────────────────────────────
function mapPhotos(photos = [], count) {
  return photos.slice(0, count).map((p, i) => ({
    id: `img-${p.id}-${i}`,
    type: "image",
    src: p.src?.large2x || p.src?.large || p.src?.medium,
    preview: p.src?.large2x || p.src?.large || p.src?.medium,
    large: p.src?.large2x,
    alt: p.alt || `Result ${i + 1}`,
  }));
}

function mapVideos(videos = [], count, { proxy = false } = {}) {
  return videos.slice(0, count).map((v, i) => {
    const hd = v.video_files?.find((f) => f.quality === "hd") || v.video_files?.[0];
    const link = hd?.link || "";
    const src = proxy ? proxyMedia(link) : link;
    return {
      id: `vid-${v.id}-${i}`,
      type: "video",
      src,
      preview: src,
      videoSrc: src,
      thumbnail: proxy ? proxyMedia(v.image || "") : v.image,
      alt: `Video ${i + 1}`,
      duration: v.duration,
    };
  });
}

async function fetchPexels(query, { type = "photos", perPage = 12, orientation } = {}) {
  const params = new URLSearchParams({ query, per_page: String(perPage) });
  if (type === "videos") params.set("type", "videos");
  if (orientation) params.set("orientation", orientation);
  const res = await fetch(`/api/pexels?${params.toString()}`);
  return res.json();
}

// Extract 3 salient keywords from a block of text (from ScriptToVoiceover).
function extractKeywords(text) {
  const stop = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
    "by", "from", "about", "our", "is", "are", "was", "were", "be", "been", "being",
    "will", "would", "can", "could", "should", "may", "might", "this", "that", "these",
    "those", "have", "has", "had", "into", "through", "welcome", "we", "you", "your",
    "their", "its", "they", "where", "when", "who", "how", "what", "every", "already",
    "start", "starts", "here", "than", "more", "most", "some", "just", "let",
  ]);
  const words = (text.toLowerCase().match(/\b\w+\b/g) || []).filter(
    (w) => w.length > 3 && !stop.has(w),
  );
  const freq = {};
  words.forEach((w) => (freq[w] = (freq[w] || 0) + 1));
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([w]) => w);
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-category configs
// ─────────────────────────────────────────────────────────────────────────────

export const MAGIC_STUDIO_CONFIGS = {
  // ── TEXT → IMAGE ───────────────────────────────────────────────────────────
  text_to_image: {
    id: "text_to_image",
    title: "Text to Image",
    subtitle: "Turn a written prompt into on-brand images.",
    Icon: FileImage,
    color: "bg-blue-100 text-blue-600",
    input: "prompt",
    resultType: "image",
    generateLabel: "Generate images",
    sample: {
      before: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80",
      after: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&q=80",
      headline: "Describe it — we'll create it",
      subtext: "Write a prompt, pick a style, and generate on-brand images in seconds.",
    },
    inputConfig: {
      label: "Text prompt",
      placeholder:
        "Describe the image you want to create… be specific about subject, setting, lighting, and mood.",
      maxLength: 500,
      inspire: [
        "A futuristic city at sunset with neon lights reflecting on wet streets",
        "A cozy coffee shop corner with warm lighting and rainy windows",
        "An elegant product shot of a luxury watch on dark marble",
        "A minimalist workspace with plants and golden hour light streaming in",
        "An abstract cosmic explosion of color and light in deep space",
        "A serene mountain lake at dawn with mist rolling over the water",
      ],
    },
    options: [
      {
        key: "style",
        label: "Visual style",
        panel: "cards",
        width: 380,
        default: "photorealistic",
        items: IMAGE_STYLES,
      },
      {
        key: "ratio",
        label: "Aspect ratio",
        panel: "ratios",
        width: 380,
        default: "square",
        items: [RATIO_SQUARE, RATIO_LANDSCAPE, RATIO_PORTRAIT, RATIO_WIDE],
      },
    ],
    validate: ({ input }) => (input?.trim() ? null : "Please enter a prompt."),
    generate: async ({ input, values }) => {
      const kw = STYLE_KEYWORDS[values.style] || "";
      const query = `${input} ${kw} high quality professional`.trim();
      const data = await fetchPexels(query, {
        type: "photos",
        perPage: 8,
        orientation: orientationOf(values.ratio),
      });
      return { assets: mapPhotos(data.photos, 4) };
    },
  },

  // ── TEXT → VIDEO ───────────────────────────────────────────────────────────
  text_to_video: {
    id: "text_to_video",
    title: "Text to Video",
    subtitle: "Generate short-form video from a text prompt.",
    Icon: Video,
    color: "bg-purple-100 text-purple-600",
    input: "prompt",
    resultType: "video",
    generateLabel: "Generate videos",
    sample: {
      before: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&q=80",
      after: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&q=80",
      headline: "From a sentence to a scene",
      subtext: "Describe the motion, pick a duration and format — generate short-form video.",
    },
    inputConfig: {
      label: "Video prompt",
      placeholder:
        "Describe the video scene… include subject, movement, lighting, setting, and camera motion.",
      maxLength: 500,
      inspire: [
        "A luxury car driving on coastal road at sunset with cinematic motion",
        "A chef cooking in cozy kitchen with warm cinematic lighting",
        "Peaceful timelapse of stars over snowy mountains",
        "A rocket launching into space with dramatic slow-motion flames",
        "Brand product reveal with elegant lighting and smooth camera movement",
      ],
    },
    options: [
      {
        key: "style",
        label: "Visual style",
        panel: "cards",
        width: 380,
        default: "photorealistic",
        items: IMAGE_STYLES.slice(0, 8),
      },
      {
        key: "duration",
        label: "Duration",
        panel: "list",
        width: 320,
        default: "15",
        items: [
          { value: "5", label: "5 seconds", desc: "Quick clip", icon: Clock },
          { value: "10", label: "10 seconds", desc: "Short form", icon: Clock },
          { value: "15", label: "15 seconds", desc: "Story / ad", icon: Clock },
          { value: "30", label: "30 seconds", desc: "Full spot", icon: Clock },
        ],
      },
      {
        key: "ratio",
        label: "Aspect ratio",
        panel: "ratios",
        width: 380,
        default: "landscape",
        items: [RATIO_SQUARE, RATIO_LANDSCAPE, RATIO_PORTRAIT],
      },
    ],
    validate: ({ input }) => (input?.trim() ? null : "Please enter a prompt."),
    generate: async ({ input, values }) => {
      const kw = STYLE_KEYWORDS[values.style] || "";
      const query = `${input} ${kw}`.trim();
      const data = await fetchPexels(query, { type: "videos", perPage: 8 });
      const assets = mapVideos(data.videos, 4, { proxy: true }).map((a) => ({
        ...a,
        duration: values.duration,
      }));
      return { assets };
    },
  },

  // ── IMAGE → VARIATIONS ───────────────────────────────────────────────────────
  image_to_variations: {
    id: "image_to_variations",
    title: "Image to Variations",
    subtitle: "Spin one image into fresh styled variations.",
    Icon: Layers,
    color: "bg-cyan-100 text-cyan-600",
    input: "image",
    resultType: "image",
    generateLabel: "Generate variations",
    sample: {
      before: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
      after: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=400&q=80",
      headline: "One image, many directions",
      subtext: "Pick a source image and a style — get a fresh set of on-brand variations.",
    },
    inputConfig: {
      label: "Source image",
      helper: "Choose an image from your library, the web, or upload one.",
    },
    options: [
      {
        key: "style",
        label: "Visual style",
        panel: "cards",
        width: 380,
        default: "Vintage Sepia",
        items: [
          { value: "Vintage Sepia", label: "Vintage Sepia", desc: "Warm retro tone", icon: Aperture, img: px(1183434) },
          { value: "Futuristic Cyberpunk", label: "Cyberpunk", desc: "Neon futuristic", icon: Cpu, img: px(2311602) },
          { value: "Watercolor Painting", label: "Watercolor", desc: "Soft washes", icon: Droplet, img: px(1053687) },
          { value: "Pixel Art", label: "Pixel Art", desc: "Retro pixels", icon: Grid3x3, img: px(1293269) },
          { value: "Oil Painting", label: "Oil Painting", desc: "Rich texture", icon: Palette, img: px(1585325) },
          { value: "Sketch Drawing", label: "Sketch", desc: "Hand-drawn", icon: Pencil, img: px(1109541) },
          { value: "Cartoon Style", label: "Cartoon", desc: "Bold & playful", icon: Smile, img: px(207983) },
          { value: "Abstract Art", label: "Abstract", desc: "Shapes & color", icon: Shapes, img: px(1616403) },
          { value: "Cinematic", label: "Cinematic", desc: "Film-grade", icon: Film, img: px(2873486) },
          { value: "Minimalist", label: "Minimalist", desc: "Clean & simple", icon: Minus, img: px(1103970) },
        ],
      },
    ],
    validate: ({ input }) =>
      input ? null : "Please pick a source image first.",
    generate: async ({ values }) => {
      const query = [
        "professional creative variation",
        "different angle, lighting, composition",
        values.style || "high quality",
      ].join(", ");
      const data = await fetchPexels(query, { type: "photos", perPage: 16 });
      return { assets: mapPhotos(data.photos, 8) };
    },
  },

  // ── SCRIPT → VOICEOVER → VIDEO ───────────────────────────────────────────────
  script_to_voiceover: {
    id: "script_to_voiceover",
    title: "Script to Voiceover",
    subtitle: "Turn a script into a narrated video.",
    Icon: Mic,
    color: "bg-emerald-100 text-emerald-600",
    input: "script",
    resultType: "video",
    generateLabel: "Generate video",
    sample: {
      before: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&q=80",
      after: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80",
      headline: "Turn a script into a narrated video",
      subtext: "Write your script, choose a voice and tone — we assemble matching footage.",
    },
    inputConfig: {
      label: "Script",
      placeholder:
        "Enter your script here… e.g. 'Welcome to our product launch, where innovation meets possibility…'",
      maxLength: 2000,
      showReadTime: true,
      inspire: [
        "Welcome to our product launch event, where innovation meets possibility. Today, we're unveiling something that will change the way you work forever.",
        "Imagine a world where your brand speaks directly to the heart of every customer. That world starts here, with a single story told the right way.",
        "The future of marketing isn't louder — it's smarter. Join thousands of brands already using AI to connect with their audience on a deeper level.",
      ],
    },
    options: [
      {
        key: "voice",
        label: "Voiceover style",
        panel: "list",
        width: 340,
        default: "neutral_ai",
        items: [
          { value: "male_deep", label: "Deep male", desc: "Rich & authoritative", icon: Mic },
          { value: "male_neutral", label: "Neutral male", desc: "Clear & professional", icon: User },
          { value: "female_warm", label: "Warm female", desc: "Friendly & engaging", icon: Heart },
          { value: "female_pro", label: "Pro female", desc: "Polished & confident", icon: Mic },
          { value: "energetic", label: "Energetic", desc: "Upbeat & exciting", icon: Zap },
          { value: "calm", label: "Calm & soothing", desc: "Relaxed & meditative", icon: Leaf },
          { value: "dramatic", label: "Dramatic", desc: "Powerful & intense", icon: Flame },
          { value: "neutral_ai", label: "Neutral AI", desc: "Clean synthetic voice", icon: Cpu },
        ],
      },
      {
        key: "tone",
        label: "Narration tone",
        panel: "list",
        width: 320,
        default: "Conversational",
        items: [
          { value: "Conversational", label: "Conversational", desc: "Natural & relaxed", icon: MessageCircle },
          { value: "Formal", label: "Formal", desc: "Structured & precise", icon: Landmark },
          { value: "Inspirational", label: "Inspirational", desc: "Uplifting & bold", icon: Sparkles },
          { value: "Urgent", label: "Urgent", desc: "Fast & compelling", icon: AlarmClock },
          { value: "Storytelling", label: "Storytelling", desc: "Narrative flow", icon: BookOpen },
          { value: "Informative", label: "Informative", desc: "Clear & factual", icon: Info },
          { value: "Humorous", label: "Humorous", desc: "Light & witty", icon: Laugh },
          { value: "Empathetic", label: "Empathetic", desc: "Warm & caring", icon: Heart },
        ],
      },
      {
        key: "pace",
        label: "Speaking pace",
        panel: "list",
        width: 320,
        default: "normal",
        items: [
          { value: "slow", label: "Slow", desc: "0.75× — contemplative", icon: Gauge },
          { value: "normal", label: "Normal", desc: "1× — balanced", icon: Gauge },
          { value: "fast", label: "Fast", desc: "1.25× — energetic", icon: Gauge },
          { value: "rapid", label: "Rapid", desc: "1.5× — punchy", icon: Gauge },
        ],
      },
      {
        key: "ratio",
        label: "Aspect ratio",
        panel: "ratios",
        width: 380,
        default: "landscape",
        items: [RATIO_SQUARE, RATIO_LANDSCAPE, RATIO_PORTRAIT],
      },
      {
        key: "format",
        label: "Export format",
        panel: "pills",
        width: 300,
        default: "MP4",
        items: [
          { value: "MP4", label: "MP4" },
          { value: "MOV", label: "MOV" },
          { value: "WebM", label: "WebM" },
        ],
      },
    ],
    validate: ({ input }) => (input?.trim() ? null : "Please enter a script first."),
    generate: async ({ input, values }) => {
      const keywords = extractKeywords(input);
      const all = [];
      for (const kw of keywords) {
        const data = await fetchPexels(kw, { type: "videos", perPage: 10 });
        if (data.videos?.length) all.push(...data.videos);
      }
      if (all.length < 5) {
        for (const term of ["business", "people", "office", "creative team"]) {
          const data = await fetchPexels(term, { type: "videos", perPage: 8 });
          if (data.videos?.length) all.push(...data.videos);
          if (all.length >= 12) break;
        }
      }
      const unique = Array.from(new Map(all.map((v) => [v.id, v])).values());
      let filtered = unique;
      if (values.ratio === "portrait") {
        const v = unique.filter((x) => x.height > x.width);
        if (v.length) filtered = v;
      } else if (values.ratio === "square") {
        const v = unique.filter((x) => {
          const r = x.width / x.height;
          return r >= 0.85 && r <= 1.15;
        });
        if (v.length) filtered = v;
      } else {
        const v = unique.filter((x) => x.width > x.height);
        if (v.length) filtered = v;
      }
      const selected = filtered.sort(() => Math.random() - 0.5).slice(0, 4);
      const assets = selected.map((v, i) => {
        const hd =
          v.video_files?.find((f) => f.quality === "hd" && f.width <= 1920) ||
          v.video_files?.find((f) => f.quality === "sd") ||
          v.video_files?.[0];
        const link = hd?.link || "";
        return {
          id: `stv-${v.id}-${i}`,
          type: "video",
          src: link,
          preview: link,
          videoSrc: link,
          thumbnail: v.image,
          alt: `Voiceover video ${i + 1}`,
          duration: v.duration,
          voice: values.voice,
          tone: values.tone,
        };
      });
      return { assets };
    },
  },

  // ── AUDIO → TEXT ─────────────────────────────────────────────────────────────
  audio_to_text: {
    id: "audio_to_text",
    title: "Audio to Text",
    subtitle: "Transcribe audio into clean, usable text.",
    Icon: AudioLines,
    color: "bg-amber-100 text-amber-600",
    input: "audio",
    resultType: "text",
    generateLabel: "Transcribe audio",
    sample: {
      before: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80",
      after: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&q=80",
      headline: "Accurate transcripts in a click",
      subtext: "Upload audio, pick a language and format — get clean, ready-to-use text.",
    },
    inputConfig: {
      label: "Audio file",
      accept: ".mp3,.wav,.ogg,.m4a,.webm",
      helper: "MP3 · WAV · OGG · M4A · WEBM · up to 100 MB",
    },
    options: [
      {
        key: "language",
        label: "Language",
        panel: "flags",
        width: 340,
        default: "auto",
        items: [
          { value: "auto", label: "Auto Detect", flag: "🌐" },
          { value: "en", label: "English", flag: "🇺🇸" },
          { value: "es", label: "Spanish", flag: "🇪🇸" },
          { value: "fr", label: "French", flag: "🇫🇷" },
          { value: "de", label: "German", flag: "🇩🇪" },
          { value: "it", label: "Italian", flag: "🇮🇹" },
          { value: "pt", label: "Portuguese", flag: "🇧🇷" },
          { value: "zh", label: "Chinese", flag: "🇨🇳" },
          { value: "ja", label: "Japanese", flag: "🇯🇵" },
          { value: "ko", label: "Korean", flag: "🇰🇷" },
          { value: "ar", label: "Arabic", flag: "🇸🇦" },
          { value: "hi", label: "Hindi", flag: "🇮🇳" },
          { value: "ru", label: "Russian", flag: "🇷🇺" },
          { value: "nl", label: "Dutch", flag: "🇳🇱" },
        ],
      },
      {
        key: "format",
        label: "Transcript format",
        panel: "list",
        width: 320,
        default: "punctuated",
        items: [
          { value: "plain", label: "Plain Text", desc: "Raw transcript only", icon: FileText },
          { value: "punctuated", label: "Punctuated", desc: "Auto-add punctuation", icon: FileText },
          { value: "paragraphs", label: "Paragraphs", desc: "Split into paragraphs", icon: FileText },
          { value: "timestamped", label: "Timestamped", desc: "Include time markers", icon: Clock },
        ],
      },
      {
        key: "quality",
        label: "Transcription quality",
        panel: "list",
        width: 320,
        default: "balanced",
        items: [
          { value: "fast", label: "Fast", desc: "Quick turnaround", icon: Zap },
          { value: "balanced", label: "Balanced", desc: "Speed + accuracy", icon: Gauge },
          { value: "accurate", label: "Accurate", desc: "Maximum precision", icon: Sparkles },
        ],
      },
    ],
    validate: ({ input }) => (input ? null : "Please upload an audio file."),
    generate: async ({ input, values }) => {
      const form = new FormData();
      form.append("audio", input);
      form.append("language", values.language);
      form.append("format", values.format);
      form.append("quality", values.quality);
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transcription failed");
      return { text: data.text || "No transcription returned." };
    },
  },

  // ── PERSONA-BASED GENERATOR ──────────────────────────────────────────────────
  persona_generator: {
    id: "persona_generator",
    title: "Persona Generator",
    subtitle: "Create content tuned to a target persona.",
    Icon: User,
    color: "bg-pink-100 text-pink-600",
    input: "persona",
    resultType: "auto", // resolved from the chosen content type at generate time
    generateLabel: "Generate content",
    sample: {
      before: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
      after: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
      headline: "Content tuned to a persona",
      subtext: "Define who you're speaking to, and generate content shaped to fit them.",
    },
    inputConfig: {
      inspire: [
        { name: "Amara Osei", occupation: "Marketing Manager", tone: "Friendly" },
        { name: "Raj Patel", occupation: "Software Engineer", tone: "Professional" },
        { name: "Sofia Reyes", occupation: "Creative Director", tone: "Inspirational" },
        { name: "James Whitfield", occupation: "Sales Executive", tone: "Bold" },
        { name: "Yuki Tanaka", occupation: "Product Manager", tone: "Casual" },
      ],
      occupations: [
        "Marketing Manager", "Software Engineer", "Entrepreneur", "Sales Executive",
        "Creative Director", "Product Manager", "HR Specialist", "Financial Analyst",
        "Teacher", "Consultant",
      ],
      ageGroups: [
        { value: "18-24", label: "18–24", desc: "Gen Z" },
        { value: "25-34", label: "25–34", desc: "Millennial" },
        { value: "35-44", label: "35–44", desc: "Gen X" },
        { value: "45-54", label: "45–54", desc: "Boomer+" },
        { value: "55+", label: "55+", desc: "Senior" },
      ],
      tones: [
        { value: "Professional", icon: Briefcase },
        { value: "Friendly", icon: Smile },
        { value: "Authoritative", icon: Crown },
        { value: "Casual", icon: Leaf },
        { value: "Inspirational", icon: Sparkles },
        { value: "Empathetic", icon: Heart },
        { value: "Bold", icon: Flame },
        { value: "Witty", icon: Laugh },
        { value: "Formal", icon: Landmark },
        { value: "Conversational", icon: MessageCircle },
      ],
    },
    options: [
      {
        key: "contentType",
        label: "Content type",
        panel: "list",
        width: 300,
        default: "image",
        items: [
          { value: "text", label: "Text", desc: "Copy & captions", icon: FileText },
          { value: "image", label: "Image", desc: "Visual content", icon: FileImage },
          { value: "video", label: "Video", desc: "Motion content", icon: Film },
        ],
      },
      {
        key: "ratio",
        label: "Aspect ratio",
        panel: "ratios",
        width: 380,
        default: "square",
        items: [RATIO_SQUARE, RATIO_LANDSCAPE, RATIO_PORTRAIT],
      },
    ],
    validate: ({ values }) => {
      if (!values.personaName?.trim()) return "Please enter a persona name.";
      if (!values.personaAge?.trim()) return "Please select or enter an age.";
      if (!values.personaOccupation?.trim()) return "Please enter an occupation.";
      if (!values.personaTone) return "Please select a tone.";
      return null;
    },
    generate: async ({ values }) => {
      const { personaName, personaAge, personaOccupation, personaTone, contentType, ratio } = values;
      const count = 4;

      if (contentType === "text") {
        const assets = Array.from({ length: count }, (_, i) => ({
          id: `pbg-txt-${i}`,
          type: "text",
          content: `Sample content ${i + 1} for ${personaName}, a ${personaAge}-year-old ${personaOccupation} with a ${personaTone} tone.`,
        }));
        return { assets, resultType: "text" };
      }

      const queries = [];
      if (personaOccupation) {
        queries.push(personaOccupation.toLowerCase());
        queries.push(`${personaOccupation.toLowerCase()} professional`);
      }
      if (personaTone)
        queries.push(`${personaTone.toLowerCase()} ${contentType === "video" ? "video" : "person"}`);
      queries.push("business professional", "professional portrait");

      const orientation = orientationOf(ratio);

      if (contentType === "video") {
        const all = [];
        for (const q of queries) {
          const data = await fetchPexels(q, { type: "videos", perPage: 15, orientation });
          all.push(...(data.videos || []));
          if (all.length >= count * 3) break;
        }
        const unique = Array.from(new Map(all.map((v) => [v.id, v])).values());
        const assets = unique
          .sort(() => Math.random() - 0.5)
          .slice(0, count)
          .map((v, i) => {
            const hd = v.video_files?.find((f) => f.quality === "hd") || v.video_files?.[0];
            const link = proxyMedia(hd?.link || "");
            return {
              id: `pbg-vid-${v.id}-${i}`,
              type: "video",
              src: link,
              videoSrc: link,
              preview: link,
              thumbnail: proxyMedia(v.image || ""),
              alt: `Persona video ${i + 1}`,
              duration: v.duration,
            };
          });
        return { assets, resultType: "video" };
      }

      // image (default)
      const all = [];
      for (const q of queries) {
        const data = await fetchPexels(q, { type: "photos", perPage: 15, orientation });
        all.push(...(data.photos || []));
        if (all.length >= count * 3) break;
      }
      const unique = Array.from(new Map(all.map((p) => [p.id, p])).values());
      const assets = unique
        .sort(() => Math.random() - 0.5)
        .slice(0, count)
        .map((p, i) => ({
          id: `pbg-img-${p.id}-${i}`,
          type: "image",
          src: p.src?.large2x || p.src?.large || p.src?.medium,
          preview: p.src?.large2x || p.src?.large || p.src?.medium,
          large: p.src?.large2x,
          thumbnail: p.src?.medium,
          alt: p.alt || `Persona image ${i + 1}`,
        }));
      return { assets, resultType: "image" };
    },
  },

  // ── TEXT → AUDIO ─────────────────────────────────────────────────────────────
  text_to_audio: {
    id: "text_to_audio",
    title: "Text to Audio",
    subtitle: "Convert text into natural speech and audio.",
    Icon: Music,
    color: "bg-indigo-100 text-indigo-600",
    input: "text",
    resultType: "audio",
    generateLabel: "Generate audio",
    sample: {
      before: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80",
      after: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
      headline: "Give your words a voice",
      subtext: "Type or paste text, choose a voice and tone — generate natural speech.",
    },
    inputConfig: {
      label: "Text to convert",
      placeholder:
        "Type or paste the text you want to convert to audio… scripts, announcements, narrations, and more.",
      maxLength: 2000,
      inspire: [
        "Welcome to our product launch event. Today we're thrilled to introduce something that will change the way you work forever.",
        "In a world where every second counts, precision and speed are not just advantages — they are necessities.",
        "Thank you for joining us on this journey. Your support means everything to our team and our mission.",
        "Attention shoppers! For this weekend only, enjoy up to fifty percent off on all premium items storewide.",
      ],
    },
    options: [
      {
        key: "voice",
        label: "Voice type",
        panel: "list",
        width: 320,
        default: "neutral_ai",
        items: [
          { value: "neutral_ai", label: "Neutral AI", desc: "Balanced, clear tone", icon: Cpu },
          { value: "male", label: "Male", desc: "Deep, confident voice", icon: User },
          { value: "female", label: "Female", desc: "Clear, warm voice", icon: Heart },
          { value: "energetic", label: "Energetic", desc: "Upbeat and lively", icon: Zap },
          { value: "calm", label: "Calm", desc: "Soothing and soft", icon: Leaf },
          { value: "dramatic", label: "Dramatic", desc: "Expressive and bold", icon: Flame },
          { value: "childlike", label: "Childlike", desc: "Fun and playful", icon: Baby },
          { value: "authoritative", label: "Authoritative", desc: "Strong, commanding", icon: Crown },
        ],
      },
      {
        key: "tone",
        label: "Speaking tone",
        panel: "list",
        width: 320,
        default: "Professional",
        items: [
          { value: "Professional", label: "Professional", desc: "Polished delivery", icon: Briefcase },
          { value: "Friendly", label: "Friendly", desc: "Warm & approachable", icon: Smile },
          { value: "Excited", label: "Excited", desc: "High energy", icon: Sparkles },
          { value: "Serious", label: "Serious", desc: "Measured & grave", icon: Landmark },
          { value: "Humorous", label: "Humorous", desc: "Light & witty", icon: Laugh },
          { value: "Empathetic", label: "Empathetic", desc: "Caring & soft", icon: Heart },
          { value: "Inspirational", label: "Inspirational", desc: "Uplifting", icon: Flame },
          { value: "Conversational", label: "Conversational", desc: "Natural & relaxed", icon: MessageCircle },
        ],
      },
      {
        key: "speed",
        label: "Speaking speed",
        panel: "list",
        width: 300,
        default: "normal",
        items: [
          { value: "slow", label: "Slow", desc: "0.75× speed", icon: Gauge },
          { value: "normal", label: "Normal", desc: "1.0× speed", icon: Gauge },
          { value: "fast", label: "Fast", desc: "1.25× speed", icon: Gauge },
        ],
      },
      {
        key: "format",
        label: "Export format",
        panel: "list",
        width: 300,
        default: "mp3",
        items: [
          { value: "mp3", label: "MP3", desc: "Best compatibility", icon: Music },
          { value: "wav", label: "WAV", desc: "Lossless quality", icon: AudioLines },
        ],
      },
      {
        key: "quality",
        label: "Audio quality",
        panel: "list",
        width: 300,
        default: "high",
        items: [
          { value: "standard", label: "Standard", desc: "Fast generation", icon: Zap },
          { value: "high", label: "High", desc: "Richer audio", icon: Gauge },
          { value: "studio", label: "Studio", desc: "Max fidelity", icon: Sparkles },
        ],
      },
    ],
    validate: ({ input }) => (input?.trim() ? null : "Please enter some text to convert."),
    generate: async () => {
      // TTS backend not wired yet — mirror the old form's sample output so the
      // result canvas (audio player) works end-to-end.
      await new Promise((r) => setTimeout(r, 1400));
      const sample = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
      const assets = Array.from({ length: 3 }, (_, i) => ({
        id: `tta-${Date.now()}-${i}`,
        type: "audio",
        src: sample,
      }));
      return { assets };
    },
  },
};

export const getMagicConfig = (id) => MAGIC_STUDIO_CONFIGS[id] || null;
