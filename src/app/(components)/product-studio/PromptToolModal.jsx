"use client";

/**
 * PromptToolModal — one shared modal for the prompt-driven Product Studio tools
 * (Reshaping, Product Poster, AI POD).
 *
 * These three tools are the same flow end to end: pick a product image, pick a
 * preset that seeds the prompt, optionally attach a second REFERENCE image,
 * set Quality / Size / Brand style, hit Generate, watch the result land in the
 * history grid. Only the copy, the preset catalog and the backend `tool` value
 * differ — so those live in {@link ./promptToolConfigs} and this file owns the
 * behaviour, exactly the way {@link ./OnDeviceToolModal} does for the on-device
 * tools.
 *
 * Structurally it follows ProductStagingModal (sidebar + history grid + tool
 * switcher + mobile Setup/Result split) and adds the one thing no existing
 * Product Studio modal had: a SECOND image slot. Reshaping calls it a Scene
 * Reference and AI POD calls it a Reference Pattern, but mechanically it is the
 * same optional extra input, resolved to a hosted URL the same way the product
 * image is and sent under the key the config names.
 *
 * ⚠️ The three backend `tool` values these configs use are NOT live yet — see
 * the UNCONFIRMED block in `src/(lib)/product-studio-api.js`. Until the backend
 * adds them, Generate returns "The selected tool is invalid" and history comes
 * back empty (the grid falls through to the sample empty state, which is the
 * correct display for "no generations yet"). Nothing here needs changing when
 * they land — only the enum values in that file.
 */

import { useState, useRef } from "react";
import {
  generateProductPhoto,
  QUALITY_ENUM,
} from "@/(lib)/product-studio-api";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import { useAuth } from "@/context/AuthContext";
import { X, Upload, Loader2, ChevronDown, Check, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { pxsq, QUALITY_RES, SIZES, stockQueryForTool } from "./constants";
import ToolSwitcherDropdown from "./ToolSwitcherDropdown";
import QualityDropdown from "./QualityDropdown";
import SizeDropdown from "./SizeDropdown";
import ProductHistoryGrid from "./ProductHistoryGrid";
import ToolModalMobileHeader from "./ToolModalMobileHeader";
import TemplateTile from "./TemplateTile";
import TemplateRow from "./TemplateRow";
import TemplateBrowserModal from "./TemplateBrowserModal";
import useProductHistory from "./useProductHistory";

/**
 * How many presets the sidebar shelf shows before "See all". The catalog is far
 * bigger than a shelf; the row is a preview of it, not the browser.
 */
const ROW_TEMPLATES = 12;

/**
 * Catalog entry → the tile shape TemplateTile renders. `src: null` is what makes
 * it draw a still rather than a <video>; `t.ext` is undefined for the JPEG
 * majority, which lets pxsq's default apply.
 */
const toTile = (t) => ({
  id: t.id,
  name: t.name,
  category: t.category,
  poster: pxsq(t.pexelsId, t.ext),
  src: null,
  alt: `${t.name} — ${t.category.toLowerCase()} template`,
});

/**
 * @param {object} props
 * @param {import("./promptToolConfigs").PromptToolConfig} props.config
 * @param {() => void} props.onClose
 * @param {(id: string, opts?: object) => void} [props.onSwitchTool]
 */
export default function PromptToolModal({ config, onClose, onSwitchTool }) {
  const { activeBrand, uploadMedia, token } = useAuth();
  const isLoggedIn = !!token;
  const qualityRef = useRef(null);
  const sizeRef = useRef(null);
  const headerRef = useRef(null);

  const templateTiles = config.templates.map(toTile);
  const firstTemplate = config.templates[0];

  // ── Product image (required) ──
  const [uploadedImage, setUploadedImage] = useState(null); // preview src
  const [uploadedFile, setUploadedFile] = useState(null); // local File, if any
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null); // hosted URL

  // ── Reference image (optional; only rendered when the config declares it) ──
  const [referenceImage, setReferenceImage] = useState(null);
  const [referenceFile, setReferenceFile] = useState(null);
  const [referenceFileUrl, setReferenceFileUrl] = useState(null);

  // The selected preset drives the prompt: its description seeds the prompt box
  // (first preset preselected) and re-seeds it on every pick. The user can still
  // edit the prompt freely afterwards.
  const [selectedTemplate, setSelectedTemplate] = useState(firstTemplate.id);
  const [prompt, setPrompt] = useState(firstTemplate.prompt);

  const [quality, setQuality] = useState("Standard");
  const [size, setSize] = useState(config.defaultSize);
  const [applyBrandStyle, setApplyBrandStyle] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [toolMenuOpen, setToolMenuOpen] = useState(false); // header tool switcher
  // Which half is on screen below `lg` ("setup" | "result") — see
  // ToolModalMobileHeader. Ignored above it, where both are side by side.
  const [mobileView, setMobileView] = useState("setup");
  // Which slot the gallery picker is filling ("product" | "reference" | null).
  // One picker serves both slots; this is what tells its onApply where to put
  // the image, so a reference pick can never overwrite the product image.
  const [pickerTarget, setPickerTarget] = useState(null);
  const [seeAllOpen, setSeeAllOpen] = useState(false); // full preset browser
  // A pick from the "See all" browser usually isn't among the shelf's first
  // twelve, so it gets pinned to the front of the row — otherwise the browser
  // closes and nothing on screen shows what was chosen.
  const [pinnedTemplate, setPinnedTemplate] = useState(null);

  // Past generations for this tool. History REPLACES a session-only results
  // list: after each successful generate we refresh it and the new item shows
  // up (newest first). Empty history → the modal shows its sample/empty state.
  const history = useProductHistory(config.tool, { enabled: isLoggedIn });

  const sizeObj = SIZES.find((s) => s.id === size);

  // Header tool switcher: clicking the current tool just closes; any other tool
  // tells the parent to swap modals (parent opens the right one + closes this).
  const handleToolClick = (id) => {
    setToolMenuOpen(false);
    if (id === config.toolId) return; // already here
    onSwitchTool?.(id);
  };

  // Images come from the gallery picker (My Library / Search / Upload), one at a
  // time. A fresh desktop upload carries a File + a LOCAL blob: URL (not
  // sendable to the backend), so we keep the File and leave the hosted URL null
  // — it's uploaded on generate to get a real URL. A library/search pick already
  // has a hosted URL we can send straight through.
  const handleApplyFromPicker = (images = []) => {
    const item = images[0];
    const target = pickerTarget;
    setPickerTarget(null);
    if (!item || !target) return;

    const isReference = target === "reference";
    const setPreview = isReference ? setReferenceImage : setUploadedImage;
    const setFile = isReference ? setReferenceFile : setUploadedFile;
    const setUrl = isReference ? setReferenceFileUrl : setUploadedFileUrl;

    if (item.file instanceof File) {
      setFile(item.file);
      setPreview(item.src || URL.createObjectURL(item.file));
      setUrl(null); // resolve a hosted URL on generate
    } else {
      const url = item.large || item.src || null;
      if (!url) return;
      setFile(null);
      setPreview(url);
      setUrl(url); // already hosted
    }
  };

  /**
   * Resolve one slot to a hosted URL, uploading the local File if that's all we
   * have. Returns null when the slot is empty.
   */
  const resolveHostedUrl = async (hostedUrl, file, label, onResolved) => {
    if (hostedUrl) return hostedUrl;
    if (!file) return null;
    const uploaded = await uploadMedia(file);
    console.log(`🖼️ [${config.toolId}] ${label} upload response ←`, uploaded);
    const url =
      uploaded?.url ||
      uploaded?.image_url ||
      uploaded?.file_url ||
      uploaded?.data?.url ||
      null;
    onResolved(url);
    return url;
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
    const basePrompt = promptOverride != null ? promptOverride : prompt;
    setGenerating(true);
    setOpenDropdown(null);
    // Mobile: hand the screen to the canvas so the in-flight tile is what the
    // user is looking at. No-op on desktop, where both halves are visible.
    setMobileView("result");
    try {
      // Resolve the product image. An override (a past result) is used as-is;
      // otherwise gallery picks already have a hosted URL, and a fresh local
      // upload gets uploaded here to obtain one.
      const imageUrl =
        imageUrlOverride ||
        (await resolveHostedUrl(
          uploadedFileUrl,
          uploadedFile,
          "product",
          setUploadedFileUrl,
        ));
      if (!imageUrl) {
        toast.error("Please select a product image");
        setGenerating(false);
        return;
      }

      // Resolve the optional reference image the same way. A reference that
      // fails to upload is NOT fatal — it's an optional hint, so we warn and
      // generate from the prompt alone rather than losing the whole request.
      let referenceUrl = null;
      if (config.reference && (referenceFileUrl || referenceFile)) {
        try {
          referenceUrl = await resolveHostedUrl(
            referenceFileUrl,
            referenceFile,
            "reference",
            setReferenceFileUrl,
          );
        } catch (err) {
          console.error(`❌ [${config.toolId}] reference upload failed:`, err);
          toast.warning(
            `Couldn't upload the ${config.reference.label.toLowerCase()} — generating from your prompt only.`,
          );
        }
      }

      // `promptSuffix` is appended at SEND time, not stored in the prompt box:
      // it's a fixed instruction the tool always needs (AI POD's "print onto the
      // product's real surface"), and showing it in the textarea would just be
      // boilerplate the user has to scroll past and can accidentally delete.
      //
      // Skipped for a promptOverride, because the only caller that passes one
      // is "Other angles" — and it builds its prompt from a PAST generation's
      // stored prompt, which already had the suffix appended when it was sent.
      // Appending again would repeat the instruction verbatim in one prompt.
      const promptToSend = [
        basePrompt?.trim(),
        promptOverride == null ? config.promptSuffix : null,
      ]
        .filter(Boolean)
        .join(" ");

      // Backend contract: POST /product-studio/generate — the same shape every
      // other Product Studio modal sends, plus the optional reference key.
      const payload = {
        tool: config.tool,
        image_url: imageUrl, // single product image URL
        quality: QUALITY_ENUM[quality] || "standard",
        size, // aspect-ratio id
        apply_brand_style: applyBrandStyle,
        prompt: promptToSend,
      };
      if (referenceUrl && config.reference) {
        payload[config.reference.payloadKey] = referenceUrl;
      }

      const result = await generateProductPhoto(payload);

      // Log the raw return so we can see its exact shape while consuming it.
      console.log(`🎨 [${config.toolId}] generate result ←`, result);

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
      console.error(`❌ [${config.toolId}] generate failed:`, err);
    } finally {
      setGenerating(false);
    }
  };

  const toggle = (key) => setOpenDropdown((p) => (p === key ? null : key));

  const rowTiles = templateTiles.slice(0, ROW_TEMPLATES);
  // Don't pin a duplicate: if the browser pick happens to be one of the presets
  // already on the shelf, the shelf tile carries the selection.
  const showPinned =
    pinnedTemplate && !rowTiles.some((t) => t.id === pinnedTemplate.id);

  // Picking a preset REPLACES the prompt with that preset's description (user
  // refinements only survive as edits made AFTER the pick, never before it).
  const selectTemplate = (tile) => {
    setSelectedTemplate(tile.id);
    setPinnedTemplate(tile);
    const entry = config.templatesById[tile.id];
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
  const handleChangeSomething = () =>
    document.getElementById(config.promptId)?.focus();
  // "Other angles": regenerate a NEW angle of THIS result — send the result's
  // own output image back in, with its original prompt plus the angle
  // instruction so the rest of the composition is preserved.
  const handleOtherAngles = (item) => {
    if (!item?.url) return;
    handleGenerate({
      promptOverride: [(item.prompt || "").trim(), config.angleInstruction]
        .filter(Boolean)
        .join(" "),
      imageUrlOverride: item.url,
    });
  };
  // "Generate video": hand this image to the Video Generator, preselected.
  const handleGenerateVideo = (url) =>
    onSwitchTool?.("video", { initialImageUrl: url });

  /** Dashed upload button + its thumbnail, shared by both image slots. */
  const renderImageSlot = ({ label, hint, preview, target, alt }) => (
    <div className="px-4 pt-4">
      {label && (
        <div className="flex items-baseline justify-between mb-2">
          <span className="font-semibold text-gray-900 text-sm">{label}</span>
          {hint && <span className="text-xs text-gray-500">{hint}</span>}
        </div>
      )}
      <button
        onClick={() => setPickerTarget(target)}
        className="w-full border border-dashed border-gray-200 rounded-2xl py-6 flex items-center justify-center gap-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer"
      >
        <Upload className="w-4 h-4" />
        <span className="text-blue-600 font-semibold">Select from gallery</span>
      </button>
      {preview && (
        <div className="pt-3">
          <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-blue-500">
            <img src={preview} alt={alt} className="w-full h-full object-cover" />
          </div>
        </div>
      )}
    </div>
  );

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
          title={config.title}
          subtitle={config.subtitle}
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
                {config.title}
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform ${toolMenuOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {/* Product image — the required input */}
            {renderImageSlot({
              label: config.reference ? "Product Image" : null,
              preview: uploadedImage,
              target: "product",
              alt: "product",
            })}

            {/* Reference image — optional, and only for the tools that take one
                (Scene Reference / Reference Pattern). */}
            {config.reference &&
              renderImageSlot({
                label: config.reference.label,
                hint: "Optional",
                preview: referenceImage,
                target: "reference",
                alt: config.reference.label.toLowerCase(),
              })}

            {/* Preset shelf plus a way into the full browser, mirroring Product
                Staging. Picking one rewrites the prompt below. */}
            <div className="px-4 pt-5">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-900">
                  {config.templateLabel}
                </span>
                <button
                  onClick={() => setSeeAllOpen(true)}
                  className="text-sm text-gray-500 hover:text-gray-500 transition-colors cursor-pointer"
                >
                  See all
                </button>
              </div>
              <TemplateRow>
                {/* No preset — send only what the user typed */}
                <button
                  onClick={() => {
                    setSelectedTemplate("none");
                    setPrompt("");
                  }}
                  className={`shrink-0 w-24 h-32 rounded-xl overflow-hidden relative flex items-center justify-center text-white text-xs font-medium bg-linear-to-br from-gray-700 to-gray-900 border-2 transition-colors cursor-pointer ${selectedTemplate === "none" ? "border-blue-500" : "border-transparent"}`}
                >
                  {config.noTemplateLabel}
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
                  aria-label={`See all ${config.templateLabel.toLowerCase()}s`}
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
                  id={config.promptId}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={config.promptPlaceholder}
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
              className={`w-full py-3.5 rounded-2xl text-sm cursor-pointer font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${
                generating
                  ? "bg-gray-400"
                  : "bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
              }`}
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
                    src={uploadedImage || config.sample.before}
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
                    src={config.sample.after}
                    alt="result"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <h3 className="text-gray-900 text-center text-base sm:text-lg font-semibold max-w-sm leading-snug">
                {config.sample.headline}
              </h3>
              <p className="text-gray-500 text-center text-xs sm:text-sm mt-2 max-w-xs leading-relaxed">
                {config.sample.subtext}
              </p>
            </div>
          ) : (
            <ProductHistoryGrid
              items={history.items}
              loading={history.loading}
              generating={generating}
              generatingLabel={config.generatingLabel}
              onDelete={history.remove}
              removingId={history.removingId}
              uploadMedia={uploadMedia}
              filePrefix={config.filePrefix}
              aspectClass={config.aspectClass}
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
            activeToolId={config.toolId}
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

      {/* ── "See all" preset browser — the full catalog by category ── */}
      {seeAllOpen && (
        <TemplateBrowserModal
          title={config.templateBrowserTitle}
          categories={config.categories}
          staticItems={templateTiles}
          tileClassName="aspect-square w-full"
          objectPosition="object-center"
          selectedId={selectedTemplate}
          onSelect={selectTemplate}
          onClose={() => setSeeAllOpen(false)}
        />
      )}

      {/* Gallery media picker — pick ONE image (My Library / Search / Upload).
          Shared by both slots; `pickerTarget` decides which one it fills, and
          which stock-search seed its Search tab opens on: the product slot gets
          this tool's own query, the reference slot the very different one its
          config names (a room, or a pattern — never a packshot). */}
      <MediaPickerModal
        isOpen={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onCancel={() => setPickerTarget(null)}
        onApply={handleApplyFromPicker}
        activeBrand={activeBrand}
        maxSelectable={1}
        defaultSearchQuery={
          pickerTarget === "reference" && config.reference
            ? config.reference.stockQuery
            : stockQueryForTool(config.toolId)
        }
      />
    </div>
  );
}
