import { useState, useRef } from "react";
import { generateProductPhoto, TOOL_ENUM } from "@/(lib)/product-studio-api";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import { useAuth } from "@/context/AuthContext";
import { X, Upload, Loader2, ChevronDown, Check, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { px, VIDEO_SIZES, stockQueryForTool } from "./constants";
import {
  PRODUCT_VIDEO_TEMPLATES,
  PRODUCT_VIDEO_CATEGORIES,
  PRODUCT_VIDEO_TEMPLATES_BY_ID,
} from "./productVideoTemplates";
import ToolSwitcherDropdown from "./ToolSwitcherDropdown";
import ToolModalMobileHeader from "./ToolModalMobileHeader";
import SizeDropdown from "./SizeDropdown";
import TemplateTile from "./TemplateTile";
import TemplateRow from "./TemplateRow";
import TemplateBrowserModal from "./TemplateBrowserModal";

// Video accepts up to 4 input photos — different angles improve fidelity.
// See docs/product-studio-payloads.md (video `image_urls`: 1–4).
const MAX_IMAGES = 4;

// How many clips the shelf shows before "See all". The catalog is far bigger
// than a shelf; the row is a preview of it, not the browser. Every one of these
// is a <video> element, so the number is a real cost, not just a layout choice.
const ROW_TEMPLATES = 12;

// Shown on a template tile while hovering it. The wording matters: picking a
// template REWRITES the prompt box, and the user should know that before they
// click rather than after their typing disappears.
const APPLY_LABEL = "Apply Template";

const VID_BEFORE = px(30780459);
const VID_AFTER = px(27204251);

/**
 * Catalog entry → the tile shape TemplateTile renders.
 *
 * `src` is the playable mp4, which is what makes TemplateTile draw a looping
 * <video> instead of a still — a tool that makes motion should show motion in
 * its picker. `poster` covers the tile until the clip has buffered.
 */
const toTile = (t) => ({
  id: t.id,
  name: t.name,
  category: t.category,
  poster: t.poster,
  src: t.src,
  alt: `${t.name} — ${t.category.toLowerCase()} product video template`,
});

const TEMPLATE_TILES = PRODUCT_VIDEO_TEMPLATES.map(toTile);

/**
 * Product Video — animates one to four product stills into a short ad clip.
 *
 * TEMPLATES ARE PROMPTS. The shelf used to be a live Pexels search: any clip
 * matching "elegant dress" was a fine motion template because a template was
 * only ever an id. It carries a written prompt now, and a prompt only means
 * something if it describes the exact clip above it — so the catalog is pinned
 * and reviewed (productVideoTemplates.js), exactly like Product Staging's
 * scenes. Picking one REPLACES the prompt box with that clip's shot
 * description, which the user is then free to edit.
 *
 * @param {object} props
 * @param {() => void} props.onClose
 * @param {(id: string, opts?: object) => void} [props.onSwitchTool]
 * @param {string|null} [props.initialImageUrl] Preselect this hosted image (from a
 *   result's "Generate video") so the user can generate straight away.
 */
export default function ProductVideoModal({
  onClose,
  onSwitchTool,
  initialImageUrl = null,
}) {
  const { activeBrand, uploadMedia } = useAuth();
  const sizeRef = useRef(null);
  const headerRef = useRef(null);

  // The product photos to animate. Each item:
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
  // Starts on "none" with an empty prompt rather than preselecting the first
  // template (which is what Product Staging does). A staging generation is
  // meaningless without a scene, so seeding one there is a favour; here the
  // prompt is genuinely optional — "just animate my photo" is a valid request —
  // and pre-filling it would silently commit every user to one specific look.
  const [selectedTemplate, setSelectedTemplate] = useState("none");
  // A template picked in the "See all" browser usually isn't among the shelf's
  // first twelve, so it gets pinned to the front of the row — otherwise the
  // browser closes and nothing on screen shows what was chosen.
  const [pinnedTemplate, setPinnedTemplate] = useState(null);
  const [size, setSize] = useState("square");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [toolMenuOpen, setToolMenuOpen] = useState(false);
  // Which half is on screen below `lg` ("setup" | "result") — see
  // ToolModalMobileHeader. Ignored above it, where both are side by side.
  const [mobileView, setMobileView] = useState("setup");
  const [seeAllOpen, setSeeAllOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false); // gallery media picker

  const rowTiles = TEMPLATE_TILES.slice(0, ROW_TEMPLATES);
  const sizeObj = VIDEO_SIZES.find((s) => s.id === size);

  // Don't pin a duplicate: if the browser pick happens to be one of the clips
  // already on the shelf, the shelf tile carries the selection.
  const showPinned =
    pinnedTemplate && !rowTiles.some((t) => t.id === pinnedTemplate.id);

  const toggle = (key) => setOpenDropdown((p) => (p === key ? null : key));
  const closeAll = () => {
    setOpenDropdown(null);
    setToolMenuOpen(false);
  };

  const handleToolClick = (id) => {
    setToolMenuOpen(false);
    if (id === "product_video") return; // already here
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

  // Picking a template REPLACES the prompt with that clip's shot description
  // (the user may have typed refinements — those only survive as edits made
  // AFTER the pick, never before it). `tile` is the tile shape TemplateTile
  // hands back; the prompt lives on the catalog entry it came from.
  const selectTemplate = (tile) => {
    setSelectedTemplate(tile.id);
    setPinnedTemplate(tile);
    const entry = PRODUCT_VIDEO_TEMPLATES_BY_ID[tile.id];
    if (entry) setPrompt(entry.prompt);
    setOpenDropdown(null);
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
    // Mobile: hand the screen to the canvas so progress is what the user is
    // looking at. No-op on desktop, where both halves are visible.
    setMobileView("result");
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
        console.log("🖼️ [product-video] upload response ←", uploaded);
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
      // `image_urls` (1–4 photos) plus the reduced `size` set.
      //
      // No `template_id`: the template is not a server-side thing any more. It
      // used to be the id of whatever Pexels clip the old live search happened
      // to return, which the backend could not have resolved to anything. The
      // whole template now travels inside `prompt`.
      const payload = {
        tool: TOOL_ENUM.product_video,
        image_urls: imageUrls,
        size, // "square" | "portrait_9_16" | "landscape_16_9"
        prompt: prompt || "",
      };

      const result = await generateProductPhoto(payload);

      // Log the raw return so we can see its exact shape while consuming it.
      // Video is async on the backend — it may return a job id rather than a URL.
      console.log("🎬 [product-video] generate result ←", result);

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
      console.error("❌ [product-video] generate failed:", err);
    } finally {
      setGenerating(false);
    }
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
        {/* ── Mobile header — title switcher, ✕ and the Setup/Result switch.
            Pinned outside both scroll areas; hidden above `lg`. ── */}
        <ToolModalMobileHeader
          title="Product Video"
          subtitle="Your product, brought to life with motion."
          onTitleClick={() => setToolMenuOpen((o) => !o)}
          switcherOpen={toolMenuOpen}
          view={mobileView}
          onViewChange={setMobileView}
          onClose={onClose}
        />

        {/* ── Left sidebar (mobile: the "Setup" view) ── */}
        <div
          className={`${mobileView === "setup" ? "flex" : "hidden"} w-full flex-1 min-h-0 flex-col border-gray-200 lg:flex lg:w-84 lg:flex-none lg:border-r`}
        >
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Header (desktop; mobile has the same switcher in the header
                above) */}
            <div className="hidden lg:block px-5 pt-5 pb-1">
              <button
                ref={headerRef}
                onClick={() => setToolMenuOpen((o) => !o)}
                className="flex items-center gap-2 font-bold text-2xl text-gray-900 hover:opacity-70 transition-opacity"
              >
                Product Video
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
                Pick up to {MAX_IMAGES} clear product photos — different angles
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

            {/* Template — a shelf of looping ad clips plus a way into the full
                browser. Picking one rewrites the prompt below with that clip's
                shot description. */}
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
                    applyLabel={APPLY_LABEL}
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
                    applyLabel={APPLY_LABEL}
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

              {/* Prompt.

                  `thin-scrollbar` (globals.css) replaces the chunky OS bar with
                  a 6px arrow-free thumb once the text passes the visible rows —
                  applying a template drops a full shot description in here, which
                  is usually longer than the box. */}
              <div className="rounded-2xl bg-gray-100 px-4 py-3 mt-2.5">
                <textarea
                  id="product-video-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the video you want (optional)"
                  className="w-full text-sm text-gray-500 placeholder:text-gray-500 bg-transparent outline-none resize-none leading-relaxed thin-scrollbar"
                  rows={5}
                />
              </div>
            </div>
          </div>

          {/* Generate footer */}
          <div className="px-4 pt-3 pb-[calc(1.25rem+var(--ck-safe-b))] lg:pb-5 border-t border-gray-200 bg-surface">
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

          <div className="flex-1 flex flex-col items-center justify-center px-2 sm:px-6">
            {/* Two 44-wide cards + the arrow overflow a phone at their desktop
                size, so they scale down rather than get clipped. */}
            <div className="flex items-center gap-1.5 xs:gap-3 mb-6 sm:mb-9">
              <div className="w-28 h-36 xs:w-32 xs:h-42 sm:w-44 sm:h-56 bg-gray-100 rounded-2xl overflow-hidden shadow-lg -rotate-3">
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
                  src={VID_AFTER}
                  alt="after"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <h3 className="text-gray-900 text-center text-base sm:text-lg font-semibold max-w-sm leading-snug">
              Turn your product into an ad
            </h3>
            <p className="text-gray-500 text-center text-xs sm:text-sm mt-2 max-w-xs leading-relaxed">
              Pick a template to load its shot description into the prompt, or
              describe the video you want yourself.
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
            activeToolId="product_video"
            onSelect={handleToolClick}
            onClose={() => setToolMenuOpen(false)}
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

      {/* ── "See all" template browser — the full clip catalog by category ── */}
      {seeAllOpen && (
        <TemplateBrowserModal
          title="Video template"
          categories={PRODUCT_VIDEO_CATEGORIES}
          staticItems={TEMPLATE_TILES}
          objectPosition="object-center"
          applyLabel={APPLY_LABEL}
          selectedId={selectedTemplate}
          onSelect={selectTemplate}
          onClose={() => setSeeAllOpen(false)}
        />
      )}

      {/* ── Gallery media picker (My Library / Search / Upload) ── */}
      <MediaPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onCancel={() => setPickerOpen(false)}
        onApply={handleApplyFromPicker}
        activeBrand={activeBrand}
        maxSelectable={Math.max(1, MAX_IMAGES - uploadedImages.length)}
        // Open Search on product showcase stills — the frames this tool
        // animates into a clip.
        defaultSearchQuery={stockQueryForTool("product_video")}
      />
    </div>
  );
}
