import { useState, useRef, useEffect } from "react";
import { generateProductPhoto } from "@/(lib)/product-studio-api";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import { useAuth } from "@/context/AuthContext";
import { X, Upload, Loader2, ChevronDown, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { px, VIDEO_SIZES } from "./constants";
import ToolSwitcherDropdown from "./ToolSwitcherDropdown";
import SizeDropdown from "./SizeDropdown";

// Video accepts up to 4 input photos — different angles improve fidelity.
// See docs/product-studio-payloads.md (video `image_urls`: 1–4).
const MAX_IMAGES = 4;

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

/**
 * @param {object} props
 * @param {() => void} props.onClose
 * @param {(id: string, opts?: object) => void} [props.onSwitchTool]
 * @param {string|null} [props.initialImageUrl] Preselect this hosted image (from a
 *   result's "Generate video") so the user can generate straight away.
 */
export default function VideoGeneratorModal({
  onClose,
  onSwitchTool,
  initialImageUrl = null,
}) {
  const { activeBrand, uploadMedia } = useAuth();
  const sizeRef = useRef(null);
  const headerRef = useRef(null);

  // The Product Studio to animate. Each item:
  //   { id, preview, file, url }
  //   • preview — URL used for the <img> thumbnail (always present)
  //   • file    — the File for a fresh desktop upload (null for gallery/search picks)
  //   • url     — an already-hosted URL (null for fresh uploads until resolved on generate)
  // Seeded from `initialImageUrl` when opened via a result's "Generate video" —
  // that's already a hosted URL, so it doubles as the preview and the send URL.
  const [uploadedImages, setUploadedImages] = useState(() =>
    initialImageUrl
      ? [
          {
            id: `seed-${Date.now()}`,
            preview: initialImageUrl,
            file: null,
            url: initialImageUrl,
          },
        ]
      : [],
  );
  const [selectedTemplate, setSelectedTemplate] = useState("none");
  const [size, setSize] = useState("square");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [toolMenuOpen, setToolMenuOpen] = useState(false);
  const [seeAllOpen, setSeeAllOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [pickerOpen, setPickerOpen] = useState(false); // gallery media picker

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

  // Guard the picker so we never exceed the input cap. When already at the max we
  // tell the user to remove one rather than silently dropping their pick.
  const openPicker = () => {
    if (uploadedImages.length >= MAX_IMAGES) {
      toast.error(
        `You can add up to ${MAX_IMAGES} images. Remove one to add another.`,
      );
      return;
    }
    setPickerOpen(true);
  };

  // Images come from the gallery picker (My Library / Search / Upload). A fresh
  // desktop upload carries a File + a LOCAL blob: URL (not sendable to the
  // backend), so we keep the File and leave the hosted URL null — it's uploaded on
  // generate to get a real URL. A library/search pick already has a hosted URL we
  // can send straight through. Appends to the current set, capped at MAX_IMAGES.
  const handleApplyFromPicker = (images = []) => {
    setPickerOpen(false);
    if (!Array.isArray(images) || images.length === 0) return;

    setUploadedImages((prev) => {
      const remaining = MAX_IMAGES - prev.length;
      if (remaining <= 0) return prev;

      const mapped = images
        .slice(0, remaining)
        .map((image, i) => {
          const id = image.id ?? `img-${Date.now()}-${i}`;
          if (image.file instanceof File) {
            return {
              id,
              preview: image.src || URL.createObjectURL(image.file),
              file: image.file,
              url: null, // resolve a hosted URL on generate
            };
          }
          const url = image.large || image.src || null;
          return url ? { id, preview: url, file: null, url } : null;
        })
        .filter(Boolean);

      if (images.length > remaining) {
        toast.error(
          `Only ${remaining} more image${remaining === 1 ? "" : "s"} added — the max is ${MAX_IMAGES}.`,
        );
      }
      return [...prev, ...mapped];
    });
  };

  // Drop one image from the set by id.
  const removeImage = (id) =>
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));

  const handleGenerate = async () => {
    if (uploadedImages.length === 0) {
      toast.error("Please select a product image first");
      return;
    }
    setGenerating(true);
    setOpenDropdown(null);
    try {
      // Resolve every image to a hosted URL. Gallery/search picks already have one;
      // fresh local uploads are uploaded here to obtain one. We upload sequentially
      // so a failure is easy to attribute, and cache resolved URLs back into state
      // so a retry doesn't re-upload the same file.
      const nextImages = [...uploadedImages];
      const imageUrls = [];
      for (let i = 0; i < nextImages.length; i++) {
        const img = nextImages[i];
        if (img.url) {
          imageUrls.push(img.url);
          continue;
        }
        if (!img.file) continue;
        const uploaded = await uploadMedia(img.file);
        console.log("🖼️ [video] upload response ←", uploaded);
        const url =
          uploaded?.url ||
          uploaded?.image_url ||
          uploaded?.file_url ||
          uploaded?.data?.url;
        if (url) {
          nextImages[i] = { ...img, url };
          imageUrls.push(url);
        }
      }
      setUploadedImages(nextImages); // cache any newly-resolved URLs

      if (imageUrls.length === 0) {
        toast.error("Please select a product image");
        setGenerating(false);
        return;
      }

      // Backend contract: POST /product-studio/generate (video). Video takes
      // `image_urls` (1–4 photos) plus the video-only `template_id` and reduced
      // `size` set (see docs/product-studio-payloads.md).
      const payload = {
        tool: "video",
        image_urls: imageUrls,
        template_id: selectedTemplate, // "none" for no template, else a template id
        size, // "square" | "portrait_9_16" | "landscape_16_9"
        prompt: prompt || "",
      };

      const result = await generateProductPhoto(payload);

      // Log the raw return so we can see its exact shape while consuming it.
      // Video is async on the backend — it may return a job id rather than a URL.
      console.log("🎬 [video] generate result ←", result);

      const resultUrl = result?.url || result?.video_url || result?.data?.url;
      if (resultUrl) {
        toast.success("Video generated!");
      } else if (result?.job_id) {
        toast("Your video is processing — we'll notify you when it's ready.");
      } else {
        toast("Requested — check the console for the response shape.");
      }
    } catch (err) {
      // generateProductPhoto already toasts a friendly error; log for debugging.
      console.error("❌ [video] generate failed:", err);
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
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/40"
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

            {/* Upload — opens the gallery picker (My Library / Search / Upload) */}
            <div className="px-4 pt-4">
              <button
                onClick={openPicker}
                className="w-full border border-dashed border-gray-200 rounded-2xl py-6 flex items-center justify-center gap-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span className="text-blue-600 font-semibold">
                  {uploadedImages.length > 0
                    ? "Add more images"
                    : "Select from gallery"}
                </span>
              </button>
              <p className="text-xs text-gray-500 leading-relaxed mt-2">
                Pick up to {MAX_IMAGES} clear Product Studio — different angles
                improve the video.
              </p>
            </div>

            {/* Uploaded thumbnails — remove any with the hover ✕ */}
            {uploadedImages.length > 0 && (
              <div className="px-4 pt-3">
                <div className="flex flex-wrap gap-2">
                  {uploadedImages.map((img) => (
                    <div
                      key={img.id}
                      className="group relative w-16 h-16 rounded-xl overflow-hidden border-2 border-blue-500"
                    >
                      <img
                        src={img.preview}
                        alt="product"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(img.id)}
                        aria-label="Remove image"
                        className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {uploadedImages.length} of {MAX_IMAGES} selected
                </p>
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
                  className={`shrink-0 w-24 h-32 rounded-xl overflow-hidden relative flex items-center justify-center text-white text-xs font-medium bg-linear-to-br from-gray-700 to-gray-900 border-2 transition-colors ${selectedTemplate === "none" ? "border-blue-500" : "border-transparent"}`}
                >
                  No template
                  {selectedTemplate === "none" && (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  )}
                </button>
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`shrink-0 w-24 h-32 rounded-xl overflow-hidden relative border-2 transition-colors ${selectedTemplate === t.id ? "border-blue-500" : "border-transparent"}`}
                  >
                    <img
                      src={t.img}
                      alt={t.category}
                      className="w-full h-full object-cover object-top"
                    />
                    {selectedTemplate === t.id && (
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
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
              className={`w-full py-3.5 rounded-2xl text-sm cursor-pointer font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${generating ? "bg-gray-400" : "bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"}`}
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
              <span className="text-blue-600 font-medium">AI credits</span>.
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
                  src={VID_BEFORE}
                  alt="before"
                  className="w-full h-full object-cover"
                />
              </div>
              <svg
                width="72"
                height="60"
                viewBox="0 0 72 60"
                fill="none"
                className="text-blue-500 shrink-0 -mt-6"
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
            className="fixed inset-0 z-205"
            onClick={() => setToolMenuOpen(false)}
          />
          <ToolSwitcherDropdown
            anchorRef={headerRef}
            activeToolId="video"
            onSelect={handleToolClick}
          />
        </>
      )}

      {/* ── Size dropdown ── */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-195"
          onClick={() => setOpenDropdown(null)}
        />
      )}
      {openDropdown === "size" && (
        <SizeDropdown
          anchorRef={sizeRef}
          value={size}
          sizes={VIDEO_SIZES}
          onSelect={(id) => {
            setSize(id);
            setOpenDropdown(null);
          }}
        />
      )}

      {/* ── "See all" template browser ── */}
      {seeAllOpen && (
        <div
          className="fixed inset-0 z-215 flex items-center justify-center bg-black/30 p-6"
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
                    className={`aspect-3/4 rounded-xl overflow-hidden relative border-2 transition-colors ${selectedTemplate === t.id ? "border-blue-500" : "border-transparent hover:border-gray-200"}`}
                  >
                    <img
                      src={t.img}
                      alt={t.category}
                      className="w-full h-full object-cover object-top"
                    />
                    {selectedTemplate === t.id && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
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

      {/* ── Gallery media picker — pick ONE image (My Library / Search / Upload) ── */}
      <MediaPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onCancel={() => setPickerOpen(false)}
        onApply={handleApplyFromPicker}
        activeBrand={activeBrand}
        maxSelectable={Math.max(1, MAX_IMAGES - uploadedImages.length)}
      />
    </div>
  );
}
