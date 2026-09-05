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
import { px, QUALITY_RES, SIZES, stockQueryForTool } from "./constants";
import ToolSwitcherDropdown from "./ToolSwitcherDropdown";
import QualityDropdown from "./QualityDropdown";
import SizeDropdown from "./SizeDropdown";
import ProductHistoryGrid from "./ProductHistoryGrid";
import ToolModalMobileHeader from "./ToolModalMobileHeader";
import useProductHistory from "./useProductHistory";

// Appended to the prompt when the user picks "Other angles" on a result.
const ANGLE_INSTRUCTION =
  "Show the garment on the invisible mannequin from a different camera angle, keeping the same garment, worn shape, lighting and background.";

const MANNEQUIN_BEFORE = px(4109759);
const MANNEQUIN_AFTER = px(37595197);

/**
 * Ghost Mannequin — an API-only Product Studio modal (upload → Quality / Size /
 * Brand / Prompt → Generate → history grid), mirroring ProductStagingModal and
 * built on the shared product-studio components. It sends `tool: ghost_mannequin`
 * to POST /product-studio/generate; there is no on-device processing here.
 */
export default function GhostMannequinModal({ onClose, onSwitchTool }) {
  const { activeBrand, uploadMedia, token } = useAuth();
  const isLoggedIn = !!token;
  const qualityRef = useRef(null);
  const sizeRef = useRef(null);
  const headerRef = useRef(null);

  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null); // gallery/cloud URL of the picked image
  const [quality, setQuality] = useState("Standard");
  const [size, setSize] = useState("portrait_3_4");
  const [applyBrandStyle, setApplyBrandStyle] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [toolMenuOpen, setToolMenuOpen] = useState(false); // header tool switcher
  // Which half is on screen below `lg` ("setup" | "result") — see
  // ToolModalMobileHeader. Ignored above it, where both are side by side.
  const [mobileView, setMobileView] = useState("setup");
  const [pickerOpen, setPickerOpen] = useState(false); // gallery media picker

  // Past generations for this tool. History REPLACES a session-only results list:
  // after each successful generate we refresh it and the new item shows up
  // (newest first). Empty history → the modal shows its sample/empty state.
  const history = useProductHistory(TOOL_ENUM.mannequin, {
    enabled: isLoggedIn,
  });

  const sizeObj = SIZES.find((s) => s.id === size);

  // Header tool switcher: clicking the current tool just closes; any other tool
  // tells the parent to swap modals (parent opens the right one + closes this).
  const handleToolClick = (id) => {
    setToolMenuOpen(false);
    if (id === "mannequin") return; // already here
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
        console.log("🖼️ [mannequin] upload response ←", uploaded);
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

      // Backend contract: POST /product-studio/generate (matches the other AI modals).
      const payload = {
        tool: TOOL_ENUM.mannequin, // "ghost_mannequin"
        image_url: imageUrl, // single image URL
        quality: QUALITY_ENUM[quality] || "standard",
        size, // aspect-ratio id
        apply_brand_style: applyBrandStyle,
        prompt: promptToSend || "",
        // workspace_id omitted for now (confirm source with backend).
      };

      const result = await generateProductPhoto(payload);

      // Log the raw return so we can see its exact shape while consuming it.
      console.log("🎨 [mannequin] generate result ←", result);

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
      console.error("❌ [mannequin] generate failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const toggle = (key) => setOpenDropdown((p) => (p === key ? null : key));

  const closeAll = () => {
    setOpenDropdown(null);
    setToolMenuOpen(false);
  };

  // ── Result menu actions (passed to the shared history grid) ──
  // Download / Copy link / Save to gallery live inside ProductHistoryGrid; these
  // are the modal-specific ones it can't own.
  // "Change something": focus the prompt so the user can describe the edit.
  const handleChangeSomething = () =>
    document.getElementById("ghost-mannequin-prompt")?.focus();
  // "Other angles": regenerate a NEW angle of THIS result — send the result's
  // own output image back in, with its original prompt plus the angle
  // instruction so the garment and styling are preserved.
  const handleOtherAngles = (item) => {
    if (!item?.url) return;
    handleGenerate({
      promptOverride: [(item.prompt || "").trim(), ANGLE_INSTRUCTION]
        .filter(Boolean)
        .join(" "),
      imageUrlOverride: item.url,
    });
  };
  // "Generate video": hand this image to Product Video, preselected.
  const handleGenerateVideo = (url) =>
    onSwitchTool?.("product_video", { initialImageUrl: url });

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
          title="Ghost Mannequin"
          subtitle="Your garment, worn by an invisible mannequin."
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
                Ghost Mannequin
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

              {/* Prompt */}
              <div className="rounded-2xl bg-gray-100 px-4 py-3">
                <textarea
                  id="ghost-mannequin-prompt"
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
                    src={uploadedImage || MANNEQUIN_BEFORE}
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
                    src={MANNEQUIN_AFTER}
                    alt="result"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <h3 className="text-gray-900 text-center text-base sm:text-lg font-semibold max-w-sm leading-snug">
                Display your garment on a ghost mannequin
              </h3>
              <p className="text-gray-500 text-center text-xs sm:text-sm mt-2 max-w-xs leading-relaxed">
                Show the natural worn shape on an invisible mannequin —
                professional e-commerce styling, no model needed.
              </p>
            </div>
          ) : (
            <ProductHistoryGrid
              items={history.items}
              loading={history.loading}
              generating={generating}
              generatingLabel="Building your ghost mannequin…"
              onDelete={history.remove}
              removingId={history.removingId}
              uploadMedia={uploadMedia}
              filePrefix="ghost-mannequin"
              aspectClass="aspect-[3/4]"
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
            activeToolId="mannequin"
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

      {/* Gallery media picker — pick ONE image (My Library / Search / Upload) */}
      <MediaPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onCancel={() => setPickerOpen(false)}
        onApply={handleApplyFromPicker}
        activeBrand={activeBrand}
        maxSelectable={1}
        // Open Search on hung/laid-out garments — the only stock shots this
        // tool can turn into a ghost mannequin.
        defaultSearchQuery={stockQueryForTool("mannequin")}
      />
    </div>
  );
}
