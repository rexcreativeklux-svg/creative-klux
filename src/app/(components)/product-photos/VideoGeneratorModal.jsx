import { useState, useRef, useEffect } from "react";
import { uploadFile } from "@/(lib)/ai-helpers";
import {
  X,
  Upload,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Package,
  Image as ImageIcon,
  Scissors,
  Layers,
  Shirt,
  Sparkles,
  LayoutGrid,
  Video,
} from "lucide-react";
import { toast } from "sonner";

const px = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&h=600`;

// Tool list for the header switcher (mirrors the product-photos page tools).
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
    id: "video",
    name: "Video Generator",
    Icon: Video,
    color: "bg-indigo-100 text-indigo-600",
    img: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=240&q=80",
  },
];
const RECENT_TOOL_IDS = ["virtual", "staging"];

// Video supports fewer sizes than the image tools.
const VIDEO_SIZES = [
  { id: "square", name: "Square", w: 1, h: 1 },
  { id: "portrait_9_16", name: "Portrait (9:16)", w: 9, h: 16 },
  { id: "landscape_16_9", name: "Landscape (16:9)", w: 16, h: 9 },
];

const TEMPLATE_CATEGORIES = [
  "All",
  "Dresses",
  "Tops",
  "Bottoms",
  "Outerwear",
  "Accessories",
  "Footwear",
  "Bags",
  "Beauty",
  "Food & Drink",
  "Furniture",
];

const tpl = (id, category) => ({
  id: `${category}-${id}`,
  category,
  img: px(id),
});
const TEMPLATES = [
  tpl(6780091, "Dresses"),
  tpl(5112737, "Dresses"),
  tpl(6780038, "Tops"),
  tpl(37741914, "Tops"),
  tpl(6780036, "Bottoms"),
  tpl(18516993, "Bottoms"),
  tpl(37218533, "Outerwear"),
  tpl(5421296, "Outerwear"),
  tpl(7895502, "Accessories"),
  tpl(7866490, "Accessories"),
  tpl(27046150, "Footwear"),
  tpl(9267592, "Footwear"),
  tpl(17938771, "Bags"),
  tpl(36385199, "Bags"),
  tpl(8015790, "Beauty"),
  tpl(8049841, "Beauty"),
  tpl(4869290, "Food & Drink"),
  tpl(12900864, "Food & Drink"),
  tpl(35392792, "Furniture"),
  tpl(6053887, "Furniture"),
];

const VID_BEFORE = px(30780459);
const VID_AFTER = px(27204251);

// ── Tool switcher card ──
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
      className="fixed z-[210] bg-surface rounded-2xl shadow-2xl border border-gray-200 p-3 max-h-[80vh] overflow-y-auto"
      style={{ top: pos.top, left: pos.left, width }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

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
      className="fixed z-[200] bg-surface rounded-xl shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto"
      style={{ top: pos.top, left: pos.left, width }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

// Horizontal template row with hover arrows that hide at the ends.
function TemplateRow({ children }) {
  const ref = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const update = () => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };
  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  const scroll = (dir) =>
    ref.current?.scrollBy({ left: dir * 200, behavior: "smooth" });
  return (
    <div className="relative group/row">
      <div ref={ref} className="flex gap-2 overflow-x-auto hide-scrollbar">
        {children}
      </div>
      {canLeft && (
        <button
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface shadow-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      {canRight && (
        <button
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface shadow-md border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default function VideoGeneratorModal({ onClose, onSwitchTool }) {
  const fileInputRef = useRef(null);
  const sizeRef = useRef(null);
  const headerRef = useRef(null);

  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("none");
  const [size, setSize] = useState("square");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [toolMenuOpen, setToolMenuOpen] = useState(false);
  const [seeAllOpen, setSeeAllOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  const sizeObj = VIDEO_SIZES.find((s) => s.id === size);

  const toggle = (key) => setOpenDropdown((p) => (p === key ? null : key));
  const closeAll = () => {
    setOpenDropdown(null);
    setToolMenuOpen(false);
  };

  const handleToolClick = (id) => {
    setToolMenuOpen(false);
    if (id === "video") return;
    onSwitchTool?.(id);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    setUploadedImage(URL.createObjectURL(file));
  };

  const handleGenerate = async () => {
    if (!uploadedFile && !uploadedImage) {
      toast.error("Please upload a product image first");
      return;
    }
    setGenerating(true);
    try {
      if (uploadedFile) await uploadFile({ file: uploadedFile });
      toast("Video generation is coming soon.");
    } catch {
      // upload helper surfaces its own error
    } finally {
      setGenerating(false);
    }
  };

  const filteredTemplates =
    activeCategory === "All"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onClick={closeAll}
    >
      <div
        className="bg-surface rounded-2xl shadow-2xl flex overflow-hidden"
        style={{ width: "95vw", height: "92vh", maxWidth: "1400px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Left sidebar ── */}
        <div className="w-84 border-r border-gray-200 flex flex-col shrink-0">
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Header */}
            <div className="px-5 pt-5 pb-1">
              <button
                ref={headerRef}
                onClick={() => setToolMenuOpen((o) => !o)}
                className="flex items-center gap-2 font-bold text-2xl text-gray-900 hover:opacity-70 transition-opacity"
              >
                Video Generator
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
                Drop files or{" "}
                <span className="text-violet-600 font-semibold">
                  select images
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <p className="text-xs text-gray-500 leading-relaxed mt-2">
                Increase product fidelity by adding up to four photos with
                different angles
              </p>
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

            {/* Template */}
            <div className="px-4 pt-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-900">Template</span>
                <button
                  onClick={() => setSeeAllOpen(true)}
                  className="text-sm text-gray-500 hover:text-gray-500 transition-colors cursor-pointer"
                >
                  See all
                </button>
              </div>
              <TemplateRow>
                {/* No template tile */}
                <button
                  onClick={() => setSelectedTemplate("none")}
                  className={`shrink-0 w-24 h-32 rounded-xl overflow-hidden relative flex items-center justify-center text-white text-xs font-medium bg-linear-to-br from-gray-700 to-gray-900 border-2 transition-colors ${selectedTemplate === "none" ? "border-violet-500" : "border-transparent"}`}
                >
                  No template
                  {selectedTemplate === "none" && (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  )}
                </button>
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`shrink-0 w-24 h-32 rounded-xl overflow-hidden relative border-2 transition-colors ${selectedTemplate === t.id ? "border-violet-500" : "border-transparent"}`}
                  >
                    <img
                      src={t.img}
                      alt={t.category}
                      className="w-full h-full object-cover object-top"
                    />
                    {selectedTemplate === t.id && (
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </button>
                ))}
              </TemplateRow>
            </div>

            {/* Size */}
            <div className="px-4 pt-5 pb-3">
              <button
                ref={sizeRef}
                onClick={() => toggle("size")}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-gray-100 hover:bg-gray-100 text-sm transition-colors"
              >
                <span className="text-gray-900 font-medium">Size</span>
                <span className="text-gray-500">{sizeObj?.name}</span>
              </button>

              {/* Prompt */}
              <div className="rounded-2xl bg-gray-100 px-4 py-3 mt-2.5">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the video you want (optional)"
                  className="w-full text-sm text-gray-500 placeholder:text-gray-500 bg-transparent outline-none resize-none leading-relaxed"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Generate footer */}
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
                "Generate 1 video"
              )}
            </button>
            <p className="text-center text-xs text-gray-500 mt-2.5">
              Generating videos will use{" "}
              <span className="text-violet-600 font-medium">AI credits</span>.
            </p>
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

          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="flex items-center gap-3 mb-9">
              <div className="w-44 h-56 bg-gray-100 rounded-2xl overflow-hidden shadow-lg -rotate-3">
                <img
                  src={uploadedImage || VID_BEFORE}
                  alt="before"
                  className="w-full h-full object-cover"
                />
              </div>
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
                  src={VID_AFTER}
                  alt="after"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <h3 className="text-gray-900 text-center text-lg font-semibold max-w-sm leading-snug">
              Generate a video from a template
            </h3>
            <p className="text-gray-500 text-center text-sm mt-2 max-w-xs leading-relaxed">
              Bring your product to life with motion — pick a template or
              describe the video you want.
            </p>
          </div>
        </div>
      </div>

      {/* ── Tool switcher ── */}
      {toolMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-[205]"
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
                    active={tool.id === "video"}
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
                  active={tool.id === "video"}
                  onClick={handleToolClick}
                />
              ))}
            </div>
          </DropdownBelow>
        </>
      )}

      {/* ── Size dropdown ── */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-[195]"
          onClick={() => setOpenDropdown(null)}
        />
      )}
      {openDropdown === "size" && (
        <FloatingPanel anchorRef={sizeRef} width={380}>
          <div className="grid grid-cols-3 gap-2.5 p-3">
            {VIDEO_SIZES.map((s) => {
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
                        <Check className="w-2.5 h-2.5 text-white" />
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

      {/* ── "See all" template browser ── */}
      {seeAllOpen && (
        <div
          className="fixed inset-0 z-[215] flex items-center justify-center bg-black/30 p-6"
          onClick={() => setSeeAllOpen(false)}
        >
          <div
            className="bg-surface rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <h2 className="text-2xl font-bold text-gray-900">Template</h2>
              <button
                onClick={() => setSeeAllOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Category tabs */}
            <div className="flex items-center gap-2 px-6 pt-2 pb-4 overflow-x-auto hide-scrollbar">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === cat ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900 hover:bg-gray-100"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {/* Grid */}
            <div className="flex-1 min-h-0 px-6 pb-6 pt-1 overflow-y-auto">
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTemplate(t.id);
                      setSeeAllOpen(false);
                    }}
                    className={`aspect-[3/4] rounded-xl overflow-hidden relative border-2 transition-colors ${selectedTemplate === t.id ? "border-violet-500" : "border-transparent hover:border-gray-200"}`}
                  >
                    <img
                      src={t.img}
                      alt={t.category}
                      className="w-full h-full object-cover object-top"
                    />
                    {selectedTemplate === t.id && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
