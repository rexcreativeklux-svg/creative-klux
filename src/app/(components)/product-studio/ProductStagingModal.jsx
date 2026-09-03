import { useState, useRef } from "react";
import {
  generateProductPhoto,
  TOOL_ENUM,
  QUALITY_ENUM,
} from "@/(lib)/product-studio-api";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import { useAuth } from "@/context/AuthContext";
import { X, Upload, Loader2, ChevronDown, Check, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { px, pxsq, QUALITY_RES } from "./constants";
import {
  STAGING_TEMPLATES,
  STAGING_CATEGORIES,
  STAGING_TEMPLATES_BY_ID,
} from "./stagingTemplates";
import ToolSwitcherDropdown from "./ToolSwitcherDropdown";
import QualityDropdown from "./QualityDropdown";
import SizeDropdown from "./SizeDropdown";
import ProductHistoryGrid from "./ProductHistoryGrid";
import ToolModalMobileHeader from "./ToolModalMobileHeader";
import TemplateTile from "./TemplateTile";
import TemplateRow from "./TemplateRow";
import TemplateBrowserModal from "./TemplateBrowserModal";
import useProductHistory from "./useProductHistory";

// Appended to the prompt when the user picks "Other angles" on a result.
const ANGLE_INSTRUCTION =
  "Show the product from a different camera angle and perspective, keeping the same product, scene, lighting and styling.";

const STAGING_BEFORE = px(2479095);
const STAGING_AFTER = px(13412090);

// How many scenes the sidebar shelf shows before "See all". The catalog is far
// bigger than a shelf; the row is a preview of it, not the browser.
const ROW_TEMPLATES = 12;

/**
 * Catalog entry → the tile shape TemplateTile renders (the same shape the video
 * templates normalise to). `src: null` is what makes it draw a still rather
 * than a <video>.
 */
const toTile = (t) => ({
  id: t.id,
  name: t.name,
  category: t.category,
  // `t.ext` is undefined for the JPEG majority, which lets pxsq's default
  // apply; the PNG entries carry it explicitly (see stagingTemplates.js).
  poster: pxsq(t.pexelsId, t.ext),
  src: null,
  alt: `${t.name} — ${t.category.toLowerCase()} scene template`,
});

const TEMPLATE_TILES = STAGING_TEMPLATES.map(toTile);


export default function ProductStagingModal({ onClose, onSwitchTool }) {
  const { activeBrand, uploadMedia, token } = useAuth();
  const isLoggedIn = !!token;
  const qualityRef = useRef(null);
  const sizeRef = useRef(null);
  const headerRef = useRef(null);

  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null); // gallery/cloud URL of the picked image
  // The selected staging template drives the prompt: its scene description
  // seeds the prompt box (first template preselected) and re-seeding it on
  // every pick (see selectTemplate). The user can still edit the prompt freely.
  const [selectedTemplate, setSelectedTemplate] = useState(
    STAGING_TEMPLATES[0].id,
  );
  const [quality, setQuality] = useState("Standard");
  const [size, setSize] = useState("square");
  const [applyBrandStyle, setApplyBrandStyle] = useState(true);
  const [prompt, setPrompt] = useState(STAGING_TEMPLATES[0].prompt);
  const [generating, setGenerating] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [toolMenuOpen, setToolMenuOpen] = useState(false); // header tool switcher
  // Which half is on screen below `lg` ("setup" | "result") — see
  // ToolModalMobileHeader. Ignored above it, where both are side by side.
  const [mobileView, setMobileView] = useState("setup");
  const [pickerOpen, setPickerOpen] = useState(false); // gallery media picker
  const [seeAllOpen, setSeeAllOpen] = useState(false); // full template browser
  // A scene picked in the "See all" browser usually isn't among the shelf's
  // first twelve, so it gets pinned to the front of the row — otherwise the
  // browser closes and nothing on screen shows what was chosen.
  const [pinnedTemplate, setPinnedTemplate] = useState(null);

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
    // Mobile: hand the screen to the canvas so the in-flight tile is what the
    // user is looking at. No-op on desktop, where both halves are visible.
    setMobileView("result");
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

      // The staging payload only carries the shared fields (see
      // docs/product-studio-payloads.md) — scene context is NOT a separate
      // field. It already lives inside `prompt`: the template picker seeds it
      // with the scene description, and any user edits ride along on top.

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

  const rowTiles = TEMPLATE_TILES.slice(0, ROW_TEMPLATES);
  // Don't pin a duplicate: if the browser pick happens to be one of the scenes
  // already on the shelf, the shelf tile carries the selection.
  const showPinned =
    pinnedTemplate && !rowTiles.some((t) => t.id === pinnedTemplate.id);

  // Picking a template REPLACES the prompt with that scene's description (the
  // user may have typed refinements — those only survive as edits made AFTER
  // the pick, never before it). `tile` is the tile shape TemplateTile hands
  // back; the prompt lives on the catalog entry it came from.
  const selectTemplate = (tile) => {
    setSelectedTemplate(tile.id);
    setPinnedTemplate(tile);
    const entry = STAGING_TEMPLATES_BY_ID[tile.id];
    if (entry) setPrompt(entry.prompt);
    setOpenDropdown(null);
  };

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
        className="bg-surface shadow-2xl flex flex-col overflow-hidden w-full h-[100dvh] lg:h-[92dvh] lg:w-[95vw] lg:max-w-[1400px] lg:flex-row lg:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Mobile header — title switcher, ✕ and the Setup/Result switch.
            Pinned outside both scroll areas; hidden above `lg`. ── */}
        <ToolModalMobileHeader
          title="Product Staging"
          subtitle="Your product, placed in a real scene."
          onTitleClick={() => setToolMenuOpen((o) => !o)}
          switcherOpen={toolMenuOpen}
          view={mobileView}
          onViewChange={setMobileView}
          onClose={onClose}
        />

        {/* ── Left sidebar (mobile: the "Setup" view) ── */}
        {/* Column with a scrollable body and a pinned Generate footer. */}
        <div
          className={`${mobileView === "setup" ? "flex" : "hidden"} w-full flex-1 min-h-0 flex-col border-gray-200 lg:flex lg:w-84 lg:flex-none lg:border-r`}
        >
          {/* Scrollable content (Generate button stays pinned below) */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Header — click the title to open the tool switcher (desktop;
                mobile has the same switcher in the header above) */}
            <div className="hidden lg:block px-5 pt-5 pb-1">
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


            {/* Template — a shelf of scenes plus a way into the full browser,
                mirroring the Video Generator. Picking one rewrites the prompt
                below with that scene's description. */}
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
                {/* No template — send only what the user typed */}
                <button
                  onClick={() => {
                    setSelectedTemplate("none");
                    setPrompt("");
                  }}
                  className={`shrink-0 w-24 h-32 rounded-xl overflow-hidden relative flex items-center justify-center text-white text-xs font-medium bg-linear-to-br from-gray-700 to-gray-900 border-2 transition-colors cursor-pointer ${selectedTemplate === "none" ? "border-blue-500" : "border-transparent"}`}
                >
                  No template
                  {selectedTemplate === "none" && (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  )}
                </button>

                {/* A pick from "See all", pinned so the choice is visible here */}
                {showPinned && (
                  <TemplateTile
                    template={pinnedTemplate}
                    selected={selectedTemplate === pinnedTemplate.id}
                    onSelect={selectTemplate}
                    className="shrink-0 w-24 h-32"
                    objectPosition="object-center"
                    label={pinnedTemplate.name}
                  />
                )}

                {rowTiles.map((t) => (
                  <TemplateTile
                    key={t.id}
                    template={t}
                    selected={selectedTemplate === t.id}
                    onSelect={selectTemplate}
                    className="shrink-0 w-24 h-32"
                    objectPosition="object-center"
                    label={t.name}
                  />
                ))}

                {/* Last tile — the shelf's own way into the full browser */}
                <button
                  onClick={() => setSeeAllOpen(true)}
                  aria-label="See all templates"
                  className="shrink-0 w-24 h-32 rounded-xl bg-gray-100 hover:bg-gray-200 border-2 border-transparent flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
                >
                  <LayoutGrid className="w-6 h-6" />
                </button>
              </TemplateRow>
            </div>

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

              {/* Prompt.

                  `thin-scrollbar` (globals.css) replaces the chunky OS bar with
                  a 6px arrow-free thumb once the text passes four rows. The bar
                  can't just be hidden here: this box has `resize-none` and a
                  fixed row count, so with no scrollbar a long prompt would
                  scroll with no indication that there is anything above or
                  below the four visible lines. */}
              <div className="rounded-2xl bg-gray-100 px-4 py-3">
                <textarea
                  id="product-staging-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want (optional)"
                  className="w-full text-sm text-gray-500 placeholder:text-gray-500 bg-transparent outline-none resize-none leading-relaxed thin-scrollbar"
                  rows={4}
                />
              </div>
            </div>
            {/* end scrollable content */}
          </div>

          {/* Generate — pinned to the bottom of the sidebar */}
          <div className="px-4 pt-3 pb-[calc(1.25rem+var(--ck-safe-b))] lg:pb-5 border-t border-gray-200 bg-surface">
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

        {/* ── Right content (mobile: the "Result" view) ── */}
        <div
          className={`${mobileView === "result" ? "flex" : "hidden"} flex-1 min-h-0 flex-col relative bg-[#f8f8f8] dark:bg-canvas lg:flex`}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="hidden lg:flex absolute top-3 right-3 z-10 w-8 h-8 bg-surface rounded-full border border-gray-200 items-center justify-center hover:bg-gray-100 shadow-sm cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>

          {!generating && !history.loading && history.items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-2 sm:px-6">
              {/* Two 44-wide cards + the arrow overflow a phone at their
                  desktop size, so they scale down rather than get clipped. */}
              <div className="flex items-center gap-1.5 xs:gap-3 mb-6 sm:mb-9">
                <div className="w-28 h-36 xs:w-32 xs:h-42 sm:w-44 sm:h-56 bg-gray-100 rounded-2xl overflow-hidden shadow-lg -rotate-3">
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
                  className="w-10 xs:w-12 sm:w-18 h-auto text-blue-500 shrink-0 -mt-6"
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
                <div className="w-28 h-36 xs:w-32 xs:h-42 sm:w-44 sm:h-56 bg-surface rounded-2xl shadow-lg overflow-hidden border border-gray-200 rotate-3">
                  <img
                    src={STAGING_AFTER}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <h3 className="text-gray-900 text-center text-base sm:text-lg font-semibold max-w-sm leading-snug">
                Create stunning lifestyle images
              </h3>
              <p className="text-gray-500 text-center text-xs sm:text-sm mt-2 max-w-xs leading-relaxed">
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
            onClose={() => setToolMenuOpen(false)}
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

      {openDropdown === "quality" && (
        <QualityDropdown
          anchorRef={qualityRef}
          value={quality}
          onSelect={(id) => {
            setQuality(id);
            setOpenDropdown(null);
          }}
          onClose={() => setOpenDropdown(null)}
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
          onClose={() => setOpenDropdown(null)}
        />
      )}

      {/* ── "See all" template browser — the full scene catalog by category ── */}
      {seeAllOpen && (
        <TemplateBrowserModal
          title="Scene template"
          categories={STAGING_CATEGORIES}
          staticItems={TEMPLATE_TILES}
          tileClassName="aspect-square w-full"
          objectPosition="object-center"
          selectedId={selectedTemplate}
          onSelect={selectTemplate}
          onClose={() => setSeeAllOpen(false)}
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
