import { useState, useRef, useEffect } from "react";
import { generateImage, uploadFile } from "@/(lib)/ai-helpers";
import {
  X,
  Upload,
  Download,
  Copy,
  Loader2,
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Video,
  RefreshCw,
  ChevronDown,
  User,
  Package,
  Image as ImageIcon,
  Scissors,
  Layers,
  Shirt,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";

// Pexels CDN helper (free license, stable URLs). Resize by height — no crop.
const px = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&h=600`;

// Tool list for the header switcher (mirrors the product-studio page tools).
const TOOL_LIST = [
  {
    id: "virtual",
    name: "Virtual Model",
    Icon: User,
    color: "bg-pink-100 text-pink-600",
    img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=240&q=80",
  },
  {
    id: "staging",
    name: "Product Staging",
    Icon: Package,
    color: "bg-amber-100 text-amber-600",
    img: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=240&q=80",
  },
  {
    id: "bgremove",
    name: "Background Remover",
    Icon: Scissors,
    color: "bg-red-100 text-red-600",
    img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=240&q=80",
  },
  {
    id: "beautifier",
    name: "Product Beautifier",
    Icon: Sparkles,
    color: "bg-yellow-100 text-yellow-600",
    img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=240&q=80",
  },
  {
    id: "start",
    name: "Edit with AI",
    Icon: ImageIcon,
    color: "bg-violet-100 text-violet-600",
    img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=240&q=80",
  },
  {
    id: "flatlay",
    name: "Flat Lay",
    Icon: LayoutGrid,
    color: "bg-cyan-100 text-cyan-600",
    img: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=240&q=80",
  },
  {
    id: "mannequin",
    name: "Ghost Mannequin",
    Icon: Shirt,
    color: "bg-emerald-100 text-emerald-600",
    img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=240&q=80",
  },
  {
    id: "batch",
    name: "Batch",
    Icon: Layers,
    color: "bg-purple-100 text-purple-600",
    img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=240&q=80",
  },
  {
    id: "product_video",
    name: "Product Video",
    Icon: Video,
    color: "bg-indigo-100 text-indigo-600",
    img: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=240&q=80",
  },
];
const RECENT_TOOL_IDS = ["virtual", "staging"];

const SIZES = [
  { id: "original", name: "Original", w: 1, h: 1 },
  { id: "portrait_9_16", name: "Portrait (9:16)", w: 9, h: 16 },
  { id: "portrait_3_4", name: "Portrait (3:4)", w: 3, h: 4 },
  { id: "portrait_2_3", name: "Portrait (2:3)", w: 2, h: 3 },
  { id: "square", name: "Square", w: 1, h: 1 },
  { id: "landscape_3_2", name: "Landscape (3:2)", w: 3, h: 2 },
  { id: "landscape_4_3", name: "Landscape (4:3)", w: 4, h: 3 },
  { id: "landscape_16_9", name: "Landscape (16:9)", w: 16, h: 9 },
];

const QUALITY_RES = { Standard: "1K", High: "2K", Ultra: "4K" };
const QUALITY_TIERS = [
  {
    id: "Ultra",
    name: "Premium",
    tag: "Ultra",
    tagColor: "bg-violet-100 text-violet-700",
    img: px(6780091),
    features: [
      "4k+ resolution",
      "Best product accuracy",
      "Most realistic results",
      "Highest quality",
      "Consumes most credits",
    ],
  },
  {
    id: "High",
    name: "Advanced",
    tag: "Max",
    tagColor: "bg-indigo-100 text-indigo-700",
    img: px(6780038),
    features: [
      "2k resolution",
      "Better product accuracy",
      "Realistic results",
      "High quality",
      "Consumes more credits",
    ],
  },
  {
    id: "Standard",
    name: "Standard",
    tag: "Pro",
    tagColor: "bg-emerald-100 text-emerald-700",
    img: px(6780036),
    features: [
      "1k resolution",
      "Good product accuracy",
      "Fast generations",
      "Consumes less credits",
    ],
  },
];

// Per-tool configuration: title, the two preview images, the description, and the
// generation prompt. This is the ONLY thing that differs between these tools.
const TOOL_CONFIGS = {
  staging: {
    title: "Product Staging",
    beforeImg: px(2479095),
    afterImg: px(13412090),
    headline: "Create stunning lifestyle images",
    subtext: "Tell a story and show your product in action.",
    prompt:
      "Professional product staging photography. Place the product from the reference image into a realistic lifestyle scene that tells a story and shows it in use. Keep the product identical — same shape, color and label. Photorealistic, commercial quality, natural lighting.",
  },
  mannequin: {
    title: "Ghost Mannequin",
    beforeImg: px(4109759),
    afterImg: px(37595197),
    headline: "Display your garment on a 3D ghost mannequin",
    subtext: "Professional styling — no model needed.",
    prompt:
      "Ghost mannequin product photography. Display the garment from the reference image on an invisible 3D mannequin form so it shows its natural worn shape. Keep the garment identical — same design, color and pattern. Clean white background, professional e-commerce styling.",
  },
  beautifier: {
    title: "Product Beautifier",
    beforeImg: px(4856500),
    afterImg: px(33245825),
    headline: "Get a polished, professional product image",
    subtext: "Clean lighting, sharp focus, ready to sell.",
    prompt:
      "Polished professional product photography. Enhance the product from the reference image with clean studio lighting, sharp focus and a refined, uncluttered background. Keep the product identical. High-end commercial quality.",
  },
  flatlay: {
    title: "Flat Lay",
    beforeImg: px(10597861),
    afterImg: px(8408556),
    headline: "Visualize your product laid flat",
    subtext: "Neatly arranged on a clean, neutral surface.",
    prompt:
      "Flat lay product photography. Lay the product from the reference image flat on a clean, neutral surface, neatly arranged and evenly lit, top-down view. Keep the product identical. Minimal, professional styling.",
  },
};

// A single tool card for the header switcher — name left, thumbnail right.
function ToolCard({ tool, active, onClick }) {
  const [imgOk, setImgOk] = useState(true);
  const { Icon } = tool;
  return (
    <button
      onClick={() => onClick(tool.id)}
      className={`flex items-stretch justify-between gap-2 rounded-xl overflow-hidden h-16 text-left transition-colors ${active ? "ring-2 ring-violet-500 bg-violet-50" : "bg-gray-100 hover:bg-gray-100"}`}
    >
      <span className="text-sm font-semibold text-gray-900 leading-tight self-center pl-3.5 flex-1">
        {tool.name}
      </span>
      <div
        className={`w-20 shrink-0 flex items-center justify-center ${tool.color}`}
      >
        {imgOk ? (
          <img
            src={tool.img}
            alt={tool.name}
            className="w-full h-full object-cover"
            onError={() => setImgOk(false)}
          />
        ) : (
          <Icon className="w-6 h-6" />
        )}
      </div>
    </button>
  );
}

// Floating panel anchored BELOW its anchor (header dropdown).
function DropdownBelow({ anchorRef, children, width = 460 }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (anchorRef?.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left });
    }
  }, [anchorRef]);
  return (
    <div
      className="fixed z-210 bg-surface rounded-2xl shadow-2xl border border-gray-200 p-3 max-h-[80vh] overflow-y-auto"
      style={{ top: pos.top, left: pos.left, width }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

// Floating panel anchored to the RIGHT of the trigger, clamped into the viewport.
function FloatingPanel({ anchorRef, children, width = 320 }) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: -9999, left: -9999 });
  useEffect(() => {
    const a = anchorRef?.current;
    const p = panelRef.current;
    if (!a || !p) return;
    const r = a.getBoundingClientRect();
    const pw = p.offsetWidth || width;
    const ph = p.offsetHeight;
    const margin = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = r.right + 4;
    if (left + pw > vw - margin) left = r.left - pw - 4;
    if (left < margin) left = vw - pw - margin;
    left = Math.max(margin, left);
    let top = r.top;
    if (top + ph > vh - margin) top = vh - ph - margin;
    top = Math.max(margin, top);
    setPos({ top, left });
  }, [anchorRef, width]);
  return (
    <div
      ref={panelRef}
      className="fixed z-200 bg-surface rounded-xl shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto"
      style={{ top: pos.top, left: pos.left, width }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

export default function ProductToolModal({ toolId, onClose, onSwitchTool }) {
  const cfg = TOOL_CONFIGS[toolId] || TOOL_CONFIGS.staging;

  const fileInputRef = useRef(null);
  const qualityRef = useRef(null);
  const sizeRef = useRef(null);
  const headerRef = useRef(null);

  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [quality, setQuality] = useState("High");
  const [size, setSize] = useState("square");
  const [applyBrandStyle, setApplyBrandStyle] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [imageMenu, setImageMenu] = useState(null);
  const [toolMenuOpen, setToolMenuOpen] = useState(false);

  const sizeObj = SIZES.find((s) => s.id === size);

  const toggle = (key) => setOpenDropdown((p) => (p === key ? null : key));
  const closeAll = () => {
    setOpenDropdown(null);
    setImageMenu(null);
    setToolMenuOpen(false);
  };

  const handleToolClick = (id) => {
    setToolMenuOpen(false);
    if (id === toolId) return;
    onSwitchTool?.(id);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    setUploadedImage(URL.createObjectURL(file));
    setUploadedFileUrl(null);
  };

  const handleGenerate = async () => {
    if (!uploadedFile && !uploadedImage) {
      toast.error("Please upload a product image first");
      return;
    }
    setGenerating(true);
    setOpenDropdown(null);
    try {
      let fileUrl = uploadedFileUrl;
      if (!fileUrl && uploadedFile) {
        const { file_url } = await uploadFile({ file: uploadedFile });
        fileUrl = file_url;
        setUploadedFileUrl(fileUrl);
      }
      if (!fileUrl) {
        toast.error("Please upload a product image");
        setGenerating(false);
        return;
      }

      const generationPrompt = `${cfg.prompt}${prompt ? " Note: " + prompt + "." : ""} Photorealistic, high resolution.`;
      const result = await generateImage({
        prompt: generationPrompt,
        existing_image_urls: [fileUrl],
      });

      setGeneratedImages((prev) => [result.url, ...prev]);
      toast.success("Image generated!");
    } catch {
      // error already shown by generateImage helper
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (url) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${toolId}.png`;
    a.target = "_blank";
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/40"
      onClick={closeAll}
    >
      <div
        className="bg-surface shadow-2xl flex flex-col overflow-hidden w-full h-[100dvh] lg:h-[92dvh] lg:w-[95vw] lg:max-w-[1400px] lg:flex-row lg:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Left sidebar ── */}
        <div className="w-full max-h-[45dvh] border-b border-gray-200 flex flex-col shrink-0 lg:w-84 lg:max-h-none lg:border-b-0 lg:border-r">
          {/* Scrollable content (Generate button stays pinned below) */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Header — click the title to open the tool switcher */}
            <div className="px-5 pt-5 pb-1">
              <button
                ref={headerRef}
                onClick={() => setToolMenuOpen((o) => !o)}
                className="flex items-center gap-2 font-bold text-2xl text-gray-900 hover:opacity-70 transition-opacity"
              >
                {cfg.title}
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform ${toolMenuOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {/* Upload */}
            <div className="px-4 pt-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-gray-200 rounded-2xl py-6 flex items-center justify-center gap-2 text-sm text-gray-500 hover:border-violet-400 hover:text-violet-600 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Drop a file or{" "}
                <span className="text-violet-600 font-semibold">
                  select an image
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Uploaded thumb */}
            {uploadedImage && (
              <div className="px-4 pt-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-violet-500">
                  <img
                    src={uploadedImage}
                    alt="product"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Option rows */}
            <div className="px-4 pt-4 pb-3 space-y-2.5">
              {/* Quality */}
              <button
                ref={qualityRef}
                onClick={() => toggle("quality")}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-gray-100 hover:bg-gray-100 text-sm transition-colors"
              >
                <span className="text-gray-900 font-medium">Quality</span>
                <span className="text-gray-500 flex items-center gap-2">
                  {QUALITY_TIERS.find((t) => t.id === quality)?.name || quality}
                  <span className="text-[11px] font-bold text-gray-900 bg-surface border border-gray-200 shadow-sm rounded-md px-1.5 py-0.5">
                    {QUALITY_RES[quality]}
                  </span>
                </span>
              </button>

              {/* Size */}
              <button
                ref={sizeRef}
                onClick={() => toggle("size")}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-gray-100 hover:bg-gray-100 text-sm transition-colors"
              >
                <span className="text-gray-900 font-medium">Size</span>
                <span className="text-gray-500">{sizeObj?.name}</span>
              </button>

              {/* Brand style */}
              <button
                onClick={() => setApplyBrandStyle((p) => !p)}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-gray-100 hover:bg-gray-100 text-sm transition-colors"
              >
                <span className="text-gray-900 font-medium">
                  Apply brand style
                </span>
                <span
                  className={
                    applyBrandStyle
                      ? "text-violet-600 font-semibold"
                      : "text-gray-500"
                  }
                >
                  {applyBrandStyle ? "On" : "Off"}
                </span>
              </button>

              {/* Prompt */}
              <div className="rounded-2xl bg-gray-100 px-4 py-3">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want (optional)"
                  className="w-full text-sm text-gray-500 placeholder:text-gray-500 bg-transparent outline-none resize-none leading-relaxed thin-scrollbar"
                  rows={4}
                />
              </div>
            </div>
          </div>
          {/* end scrollable content */}

          {/* Generate — pinned to the bottom of the sidebar */}
          <div className="px-4 pb-5 pt-3 border-t border-gray-200 bg-surface">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`w-full py-3.5 rounded-2xl text-sm cursor-pointer font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${generating ? "bg-gray-400" : "bg-linear-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600"}`}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating…
                </>
              ) : (
                "Generate 1 image"
              )}
            </button>
          </div>
        </div>

        {/* ── Right content ── */}
        <div className="flex-1 flex flex-col relative bg-[#f8f8f8] dark:bg-canvas">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 bg-surface rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 shadow-sm cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>

          {generatedImages.length === 0 && !generating ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <div className="flex items-center gap-3 mb-9">
                <div className="w-44 h-56 bg-gray-100 rounded-2xl overflow-hidden shadow-lg -rotate-3">
                  <img
                    src={uploadedImage || cfg.beforeImg}
                    alt="before"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* stylish curved arrow */}
                <svg
                  width="72"
                  height="60"
                  viewBox="0 0 72 60"
                  fill="none"
                  className="text-violet-500 shrink-0 -mt-6"
                >
                  <path
                    d="M6 44 C 24 8, 50 8, 62 32"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M62 32 L51 28 M62 32 L55 42"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="w-44 h-56 bg-surface rounded-2xl shadow-lg overflow-hidden border border-gray-200 rotate-3">
                  <img
                    src={cfg.afterImg}
                    alt="after"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <h3 className="text-gray-900 text-center text-lg font-semibold max-w-sm leading-snug">
                {cfg.headline}
              </h3>
              <p className="text-gray-500 text-center text-sm mt-2 max-w-xs leading-relaxed">
                {cfg.subtext}
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-6">
              {generating && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                    <p className="text-gray-500 text-sm">
                      Generating your image…
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-4 gap-3">
                {generatedImages.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-xl overflow-hidden group aspect-square bg-gray-100"
                  >
                    <img
                      src={url}
                      alt={`result ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageMenu((p) =>
                          p?.idx === idx
                            ? null
                            : { idx, x: e.clientX, y: e.clientY },
                        );
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-surface/90 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Tool switcher (header dropdown) ── */}
      {toolMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-205"
            onClick={() => setToolMenuOpen(false)}
          />
          <DropdownBelow anchorRef={headerRef} width={460}>
            <p className="text-xs font-semibold text-gray-500 px-1 mb-2">
              Recently used
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {RECENT_TOOL_IDS.map((id) => {
                const tool = TOOL_LIST.find((t) => t.id === id);
                if (!tool) return null;
                return (
                  <ToolCard
                    key={`recent-${tool.id}`}
                    tool={tool}
                    active={tool.id === toolId}
                    onClick={handleToolClick}
                  />
                );
              })}
            </div>
            <p className="text-xs font-semibold text-gray-500 px-1 mb-2">
              All tools
            </p>
            <div className="grid grid-cols-2 gap-2">
              {TOOL_LIST.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  active={tool.id === toolId}
                  onClick={handleToolClick}
                />
              ))}
            </div>
          </DropdownBelow>
        </>
      )}

      {/* ── Floating dropdowns ── */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-195"
          onClick={() => setOpenDropdown(null)}
        />
      )}

      {openDropdown === "quality" && (
        <FloatingPanel anchorRef={qualityRef} width={380}>
          <div className="p-2 space-y-2">
            {QUALITY_TIERS.map((t) => {
              const active = quality === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setQuality(t.id);
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-stretch gap-3 p-2.5 rounded-2xl border-2 text-left transition-colors ${active ? "border-violet-500 bg-violet-50/40" : "border-gray-200 hover:border-gray-200 bg-surface"}`}
                >
                  <div className="w-20 h-28 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <img
                      src={t.img}
                      alt={t.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-900">
                          {t.name}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${t.tagColor}`}
                        >
                          {t.tag}
                        </span>
                      </div>
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${active ? "bg-violet-600" : "border-2 border-gray-200"}`}
                      >
                        {active && (
                          <span className="text-white text-[10px]">✓</span>
                        )}
                      </span>
                    </div>
                    <ul className="mt-1.5 space-y-0.5">
                      {t.features.map((f) => (
                        <li
                          key={f}
                          className="text-[11px] text-gray-500 leading-snug"
                        >
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </button>
              );
            })}
          </div>
        </FloatingPanel>
      )}

      {openDropdown === "size" && (
        <FloatingPanel anchorRef={sizeRef} width={380}>
          <div className="grid grid-cols-3 gap-2.5 p-3">
            {SIZES.map((s) => {
              const active = size === s.id;
              const maxDim = 64;
              const bw = s.w >= s.h ? maxDim : Math.round((maxDim * s.w) / s.h);
              const bh = s.h >= s.w ? maxDim : Math.round((maxDim * s.h) / s.w);
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setSize(s.id);
                    setOpenDropdown(null);
                  }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-colors ${active ? "border-violet-500 bg-violet-50/40" : "border-gray-200 hover:border-gray-200"}`}
                >
                  <div className="flex items-center justify-center h-20 relative w-full">
                    <div
                      className={`rounded-md ${active ? "bg-violet-300" : "bg-gray-100"}`}
                      style={{ width: bw, height: bh }}
                    />
                    {active && (
                      <div className="absolute top-0 right-0 w-4 h-4 bg-violet-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-[8px]">✓</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 text-center leading-tight">
                    {s.name}
                  </span>
                </button>
              );
            })}
          </div>
        </FloatingPanel>
      )}

      {/* Image context menu */}
      {imageMenu && (
        <div
          className="fixed z-200 bg-surface rounded-xl shadow-2xl border border-gray-200 w-48 py-1"
          style={{ top: imageMenu.y, left: imageMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            {
              label: "Change something",
              icon: RefreshCw,
              action: () => {
                handleGenerate();
                setImageMenu(null);
              },
            },
            { label: "Generate video", icon: Video },
            {
              label: "Delete",
              icon: Trash2,
              red: true,
              action: () => {
                setGeneratedImages((p) =>
                  p.filter((_, i) => i !== imageMenu.idx),
                );
                setImageMenu(null);
              },
            },
            {
              label: "Download",
              icon: Download,
              action: () => {
                handleDownload(generatedImages[imageMenu.idx]);
                setImageMenu(null);
              },
            },
            {
              label: "Copy link",
              icon: Copy,
              action: () => {
                navigator.clipboard.writeText(generatedImages[imageMenu.idx]);
                toast.success("Link copied!");
                setImageMenu(null);
              },
            },
            {
              label: "Good result",
              icon: ThumbsUp,
              action: () => setImageMenu(null),
            },
            {
              label: "Bad result",
              icon: ThumbsDown,
              action: () => setImageMenu(null),
            },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (item.action) item.action();
                else setImageMenu(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${item.red ? "text-red-500" : "text-gray-900"}`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
