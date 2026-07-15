import { useState, useRef } from "react";
import {
  generateProductPhoto,
  TOOL_ENUM,
  QUALITY_ENUM,
} from "@/(lib)/product-studio-api";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import { useAuth } from "@/context/AuthContext";
import { X, Upload, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { px, pxbg, QUALITY_RES } from "./constants";
import { FloatingPanel } from "./FloatingPanels";
import ToolSwitcherDropdown from "./ToolSwitcherDropdown";
import QualityDropdown from "./QualityDropdown";
import SizeDropdown from "./SizeDropdown";
import ProductHistoryGrid from "./ProductHistoryGrid";
import useProductHistory from "./useProductHistory";

// Appended to the prompt when the user picks "Other angles" on a result.
const ANGLE_INSTRUCTION =
  "Show the product from a different camera angle and perspective, keeping the same product, scene, lighting and styling.";

const STAGING_BEFORE = px(2479095);
const STAGING_AFTER = px(13412090);

// Scenes that shape the staged lifestyle context. The staging payload only
// carries the shared fields (see docs/product-studio-payloads.md), so the chosen
// scene travels inside the `prompt` as context — never as a separate field.
const SCENES = [
  {
    id: "lifestyle",
    name: "Lifestyle",
    desc: "Person using the product in real life",
    img: pxbg(3184465),
  },
  {
    id: "studio",
    name: "Studio",
    desc: "Clean white / grey studio",
    img: pxbg(1029243),
  },
  {
    id: "outdoor",
    name: "Outdoor",
    desc: "Natural outdoor setting",
    img: pxbg(957024),
  },
  {
    id: "kitchen",
    name: "Kitchen",
    desc: "On a wooden kitchen counter",
    img: pxbg(1080696),
  },
  {
    id: "editorial",
    name: "Editorial",
    desc: "Magazine-style fashion shoot",
    img: pxbg(291762),
  },
  {
    id: "social",
    name: "Social Media",
    desc: "Eye-catching, social-ready",
    img: pxbg(1092644),
  },
];

export default function ProductStagingModal({ onClose, onSwitchTool }) {
  const { activeBrand, uploadMedia, token } = useAuth();
  const isLoggedIn = !!token;
  const qualityRef = useRef(null);
  const sizeRef = useRef(null);
  const sceneRef = useRef(null);
  const headerRef = useRef(null);

  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null); // gallery/cloud URL of the picked image
  const [selectedScene, setSelectedScene] = useState("lifestyle");
  const [quality, setQuality] = useState("Standard");
  const [size, setSize] = useState("square");
  const [applyBrandStyle, setApplyBrandStyle] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [toolMenuOpen, setToolMenuOpen] = useState(false); // header tool switcher
  const [pickerOpen, setPickerOpen] = useState(false); // gallery media picker

  // Past generations for this tool. History REPLACES a session-only results list:
  // after each successful generate we refresh it and the new item shows up
  // (newest first). Empty history → the modal shows its sample/empty state.
  const history = useProductHistory(TOOL_ENUM.staging, {
    enabled: isLoggedIn,
  });

  // Header tool switcher: clicking the current tool just closes; any other tool
  // tells the parent to swap modals (parent opens the right one + closes this).
  const handleToolClick = (id) => {
    setToolMenuOpen(false);
    if (id === "staging") return; // already here
    onSwitchTool?.(id);
  };

  // Image comes from the gallery picker (My Library / Search / Upload). We only
  // use ONE image. A fresh desktop upload carries a File + a LOCAL blob: URL
  // (not sendable to the backend), so we keep the File and leave the hosted URL
  // null — it's uploaded on generate to get a real URL. A library/search pick
  // already has a hosted URL we can send straight through.
  const handleApplyFromPicker = (images = []) => {
    const item = images[0];
    if (!item) return;
    if (item.file instanceof File) {
      setUploadedFile(item.file);
      setUploadedImage(item.src || URL.createObjectURL(item.file));
      setUploadedFileUrl(null); // resolve a hosted URL on generate
    } else {
      const url = item.large || item.src || null;
      if (!url) return;
      setUploadedFile(null);
      setUploadedImage(url);
      setUploadedFileUrl(url); // already hosted
    }
    setPickerOpen(false);
  };

  // Options let result-menu actions regenerate off a specific result instead of
  // the sidebar's uploaded image:
  //   • promptOverride   — send this prompt instead of the sidebar's.
  //   • imageUrlOverride — use this hosted image as the input (e.g. "Other
  //     angles" regenerates from the result's OWN output image).
  const handleGenerate = async ({ promptOverride, imageUrlOverride } = {}) => {
    if (!imageUrlOverride && !uploadedFile && !uploadedImage) {
      toast.error("Please select a product image first");
      return;
    }
    const promptToSend = promptOverride != null ? promptOverride : prompt;
    setGenerating(true);
    setOpenDropdown(null);
    try {
      // Resolve the ONE image URL to send. An override (a past result) is used
      // as-is; otherwise gallery picks already have a hosted URL, and a fresh
      // local upload gets uploaded here to obtain one.
      let imageUrl = imageUrlOverride || uploadedFileUrl;
      if (!imageUrl && uploadedFile) {
        const uploaded = await uploadMedia(uploadedFile);
        console.log("🖼️ [staging] upload response ←", uploaded);
        imageUrl =
          uploaded?.url ||
          uploaded?.image_url ||
          uploaded?.file_url ||
          uploaded?.data?.url;
        setUploadedFileUrl(imageUrl || null);
      }
      if (!imageUrl) {
        toast.error("Please select a product image");
        setGenerating(false);
        return;
      }

      // Scene context is folded into the prompt (staging carries only the
      // shared fields — see docs/product-studio-payloads.md).
      // const sceneObj = SCENES.find(s => s.id === selectedScene);
      // const sceneNote = sceneObj ? `Scene: ${sceneObj.name} — ${sceneObj.desc}.` : '';
      // const finalPrompt = [sceneNote, prompt].filter(Boolean).join(' ').trim();

      // Backend contract: POST /product-studio/generate (matches VirtualModelModal's shape).
      const payload = {
        tool: TOOL_ENUM.staging, // "product_staging"
        image_url: imageUrl, // single image URL
        quality: QUALITY_ENUM[quality] || "standard",
        size, // aspect-ratio id
        apply_brand_style: applyBrandStyle,
        prompt: promptToSend, // scene context + optional user refinement
        // workspace_id omitted for now (confirm source with backend).
      };

      const result = await generateProductPhoto(payload);

      // Log the raw return so we can see its exact shape while consuming it.
      console.log("🎨 [staging] generate result ←", result);

      const resultUrl = result?.url || result?.image_url || result?.data?.url;
      if (resultUrl) {
        // The backend persisted it — refresh history so it shows up (newest
        // first) instead of tracking a separate session list.
        await history.refresh();
        toast.success("Image generated!");
      } else {
        toast("Generated — check the console for the response shape.");
      }
    } catch (err) {
      // generateProductPhoto already toasts a friendly error; log for debugging.
      console.error("❌ [staging] generate failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const toggle = (key) => setOpenDropdown((p) => (p === key ? null : key));

  // const sceneObj = SCENES.find(s => s.id === selectedScene);
  // const sizeObj = SIZES.find(s => s.id === size);

  const closeAll = () => {
    setOpenDropdown(null);
    setToolMenuOpen(false);
  };

  // ── Result menu actions (passed to the shared history grid) ──
  // Download / Copy link / Save to gallery live inside ProductHistoryGrid; these
  // are the modal-specific ones it can't own.
  // "Change something": focus the prompt so the user can describe the edit.
  const handleChangeSomething = () =>
    document.getElementById("product-staging-prompt")?.focus();
  // "Other angles": regenerate a NEW angle of THIS result — send the result's
  // own output image back in, with its original prompt plus the angle
  // instruction so the rest of the scene is preserved.
  const handleOtherAngles = (item) => {
    if (!item?.url) return;
    handleGenerate({
      promptOverride: [(item.prompt || "").trim(), ANGLE_INSTRUCTION]
        .filter(Boolean)
        .join(" "),
      imageUrlOverride: item.url,
    });
  };
  // "Generate video": hand this image to the Video Generator, preselected.
  const handleGenerateVideo = (url) =>
    onSwitchTool?.("video", { initialImageUrl: url });

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
        {/* Column with a scrollable body and a pinned Generate footer. */}
        <div className="w-84 border-r border-gray-200 flex flex-col shrink-0">
          {/* Scrollable content (Generate button stays pinned below) */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Header — click the title to open the tool switcher */}
            <div className="px-5 pt-5 pb-1">
              <button
                ref={headerRef}
                onClick={() => setToolMenuOpen((o) => !o)}
                className="flex items-center gap-2 font-bold text-2xl text-gray-900 hover:opacity-70 transition-opacity"
              >
                Product Staging
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform ${toolMenuOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {/* Upload — opens the gallery picker (My Library / Search / Upload) */}
            <div className="px-4 pt-4">
              <button
                onClick={() => setPickerOpen(true)}
                className="w-full border border-dashed border-gray-200 rounded-2xl py-6 flex items-center justify-center gap-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span className="text-blue-600 font-semibold">
                  Select from gallery
                </span>
              </button>
            </div>

            {/* Uploaded thumb */}
            {uploadedImage && (
              <div className="px-4 pt-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-blue-500">
                  <img
                    src={uploadedImage}
                    alt="product"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Scene */}
            {/* <div className="px-4 pt-4">
                        <button
                            ref={sceneRef}
                            onClick={() => toggle('scene')}
                            className={`w-full flex flex-col items-center p-2.5 rounded-2xl transition-all ${openDropdown === 'scene' ? 'bg-blue-50 ring-2 ring-blue-500' : 'bg-gray-100/70 hover:bg-gray-100'}`}
                        >
                            <div className="w-full h-40 rounded-xl overflow-hidden mb-2.5 bg-surface">
                                <img src={sceneObj?.img} alt={sceneObj?.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[11px] text-gray-500">Scene</span>
                            <span className="text-sm font-semibold text-gray-900">{sceneObj?.name}</span>
                        </button>
                    </div> */}

            {/* Option rows — light gray cards (Photoroom style) */}
            <div className="px-4 pt-3 pb-3 space-y-2.5">
              {/* Quality */}
              <button
                ref={qualityRef}
                onClick={() => toggle("quality")}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-gray-100 hover:bg-gray-100 text-sm transition-colors"
              >
                <span className="text-gray-900 font-medium">Quality</span>
                <span className="text-gray-500 flex items-center gap-2">
                  {quality}
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
                {/* <span className="text-gray-500">{sizeObj?.name}</span> */}
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
                      ? "text-blue-600 font-semibold"
                      : "text-gray-500"
                  }
                >
                  {applyBrandStyle ? "On" : "Off"}
                </span>
              </button>

              {/* Prompt */}
              <div className="rounded-2xl bg-gray-100 px-4 py-3">
                <textarea
                  id="product-staging-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want (optional)"
                  className="w-full text-sm text-gray-500 placeholder:text-gray-500 bg-transparent outline-none resize-none leading-relaxed"
                  rows={4}
                />
              </div>
            </div>
            {/* end scrollable content */}
          </div>

          {/* Generate — pinned to the bottom of the sidebar */}
          <div className="px-4 pb-5 pt-3 border-t border-gray-200 bg-surface">
            <button
              onClick={() => handleGenerate()}
              disabled={generating}
              className={`
    w-full py-3.5 rounded-2xl text-sm cursor-pointer font-semibold text-white
    transition-all flex items-center justify-center gap-2
    disabled:opacity-60
    ${
      generating
        ? "bg-gray-400"
        : "bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
    }
  `}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating…
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

          {!generating && !history.loading && history.items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <div className="flex items-center gap-3 mb-9">
                <div className="w-44 h-56 bg-gray-100 rounded-2xl overflow-hidden shadow-lg -rotate-3">
                  <img
                    src={uploadedImage || STAGING_BEFORE}
                    alt="product"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* stylish curved arrow */}
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
                    src={STAGING_AFTER}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <h3 className="text-gray-900 text-center text-lg font-semibold max-w-sm leading-snug">
                Create stunning lifestyle images
              </h3>
              <p className="text-gray-500 text-center text-sm mt-2 max-w-xs leading-relaxed">
                Place your product into a realistic scene that tells a story and
                shows it in action.
              </p>
            </div>
          ) : (
            <ProductHistoryGrid
              items={history.items}
              loading={history.loading}
              generating={generating}
              generatingLabel="Staging your product…"
              onDelete={history.remove}
              removingId={history.removingId}
              uploadMedia={uploadMedia}
              filePrefix="product-staged"
              aspectClass="aspect-square"
              onChangeSomething={handleChangeSomething}
              onOtherAngles={handleOtherAngles}
              onGenerateVideo={handleGenerateVideo}
            />
          )}
        </div>
      </div>

      {/* ── Tool switcher (header dropdown) ── */}
      {toolMenuOpen && (
        <>
          {/* transparent backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-205"
            onClick={() => setToolMenuOpen(false)}
          />
          <ToolSwitcherDropdown
            anchorRef={headerRef}
            activeToolId="staging"
            onSelect={handleToolClick}
          />
        </>
      )}

      {/* ── Floating dropdowns (fixed, above everything) ── */}
      {/* transparent backdrop closes whichever picker is open on outside click */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-195"
          onClick={() => setOpenDropdown(null)}
        />
      )}

      {openDropdown === "scene" && (
        <FloatingPanel anchorRef={sceneRef} width={420}>
          <div className="grid grid-cols-3 gap-2.5 p-3">
            {SCENES.map((s) => {
              const active = selectedScene === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedScene(s.id);
                    setOpenDropdown(null);
                  }}
                  className="flex flex-col items-center gap-1.5"
                  title={s.desc}
                >
                  <div
                    className={`w-full h-24 rounded-xl overflow-hidden relative border-2 transition-colors ${active ? "border-blue-500" : "border-transparent hover:border-gray-200"}`}
                  >
                    <img
                      src={s.img}
                      alt={s.name}
                      className="w-full h-full object-cover"
                    />
                    {active && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
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

      {openDropdown === "quality" && (
        <QualityDropdown
          anchorRef={qualityRef}
          value={quality}
          onSelect={(id) => {
            setQuality(id);
            setOpenDropdown(null);
          }}
        />
      )}

      {openDropdown === "size" && (
        <SizeDropdown
          anchorRef={sizeRef}
          value={size}
          onSelect={(id) => {
            setSize(id);
            setOpenDropdown(null);
          }}
        />
      )}

      {/* Gallery media picker — pick ONE image (My Library / Search / Upload) */}
      <MediaPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onCancel={() => setPickerOpen(false)}
        onApply={handleApplyFromPicker}
        activeBrand={activeBrand}
        maxSelectable={1}
      />
    </div>
  );
}
