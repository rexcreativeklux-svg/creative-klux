import { useState, useRef } from "react";
import {
  generateProductPhoto,
  TOOL_ENUM,
  QUALITY_ENUM,
} from "@/(lib)/product-studio-api";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import { useAuth } from "@/context/AuthContext";
import { X, Plus, Upload, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { pxbg, QUALITY_RES, SIZES } from "./constants";
import {
  VIRTUAL_MODELS,
  VIRTUAL_MODELS_BY_ID,
  DEFAULT_MODEL_ID,
  buildModelPrompt,
} from "./virtualModels";
import { FloatingPanel } from "./FloatingPanels";
import ToolSwitcherDropdown from "./ToolSwitcherDropdown";
import QualityDropdown from "./QualityDropdown";
import SizeDropdown from "./SizeDropdown";
import ProductHistoryGrid from "./ProductHistoryGrid";
import ToolModalMobileHeader from "./ToolModalMobileHeader";
import useProductHistory from "./useProductHistory";

// Appended to the prompt when the user picks "Other angles" on a result — asks
// the model for a fresh camera angle/pose while preserving everything else.
const ANGLE_INSTRUCTION =
  "Show the product on the model from a different camera angle and pose, keeping the same product, outfit, lighting and background.";

const CLOTHING_IMG =
  "https://d3r8chxzp8ea06.cloudfront.net/creativeklux/creativeklux-file-1783763628-6a5212ac83271.webp";


// const POSES = [
//   { id: "random", name: "Random", img: px(31046827) },
//   { id: "standing", name: "Standing", img: px(27542891) },
//   { id: "3_4_turn", name: "3/4 Turn", img: px(31046829) },
//   { id: "power_stance", name: "Power Stance", img: px(32325987) },
//   { id: "walking", name: "Walking Forward", img: px(1803779) },
//   { id: "hand_pocket", name: "Hand in Pocket", img: px(36759684) },
//   { id: "crossed_arms", name: "Crossed Arms", img: px(33821631) },
//   { id: "back", name: "Back", img: px(31894858) },
//   { id: "over_shoulder", name: "Over-the-Shoulder", img: px(5413902) },
//   { id: "seated", name: "Seated Casual", img: px(5412379) },
//   { id: "adjusting", name: "Adjusting Clothing", img: px(36322478) },
//   { id: "playful", name: "Playful Spin", img: px(7209534) },
// ];

const BACKGROUNDS = [
  { id: "custom", name: "Custom", color: "#e0e0e0" }, // no image — shows a "+" tile
  { id: "random", name: "Random", color: "#c8d8c8", img: pxbg(20002520) },
  { id: "street", name: "Street", color: "#d0c8b8", img: pxbg(12497049) },
  { id: "bedroom", name: "Bedroom", color: "#e8d8c8", img: pxbg(31488380) },
  { id: "sunset", name: "Sunset", color: "#f0c060", img: pxbg(709573) },
  { id: "factory", name: "Factory", color: "#888", img: pxbg(236709) },
  { id: "studio", name: "Studio", color: "#f0f0f0", img: pxbg(1932666) },
  {
    id: "colored_studio",
    name: "Colored Studio",
    color: "#a0c0e0",
    img: pxbg(36789468),
  },
  {
    id: "concrete_studio",
    name: "Concrete Studio",
    color: "#b0b0b0",
    img: pxbg(2463329),
  },
  { id: "beach", name: "Beach", color: "#70b8e0", img: pxbg(5232809) },
  { id: "tropical", name: "Tropical", color: "#40a860", img: pxbg(6910147) },
  { id: "library", name: "Library", color: "#c8a870", img: pxbg(5225982) },
  { id: "forest", name: "Forest", color: "#508040", img: pxbg(1437601) },
  {
    id: "business",
    name: "Business District",
    color: "#708090",
    img: pxbg(13012283),
  },
  {
    id: "countryside",
    name: "Countryside",
    color: "#90b860",
    img: pxbg(4268073),
  },
  { id: "flowers", name: "Flowers", color: "#e080a0", img: pxbg(16563299) },
  {
    id: "golden_light",
    name: "Golden Light",
    color: "#e0a840",
    img: pxbg(30608651),
  },
  { id: "mountain", name: "Mountain", color: "#8090a8", img: pxbg(2734347) },
  { id: "pool", name: "Pool", color: "#40a8d0", img: pxbg(10739637) },
  {
    id: "latin_city",
    name: "Latin City",
    color: "#c09060",
    img: pxbg(16215575),
  },
  { id: "cafe", name: "Cafe", color: "#a07850", img: pxbg(17104305) },
  {
    id: "asian_city",
    name: "Asian City",
    color: "#f060a0",
    img: pxbg(33901684),
  },
  {
    id: "night_lights",
    name: "Night Lights",
    color: "#2030a0",
    img: pxbg(18462155),
  },
  { id: "desert", name: "Desert", color: "#d0a860", img: pxbg(8869381) },
];

const RANDOM_MODEL_NAMES = [
  "Aiden",
  "Alex",
  "Alicia",
  "Amara",
  "Andrea",
  "Ava",
  "Benjamin",
  "Bella",
  "Caleb",
  "Charlotte",
  "Chloe",
  "Daniel",
  "David",
  "Ella",
  "Emily",
  "Emma",
  "Ethan",
  "Faith",
  "Grace",
  "Hannah",
  "Harper",
  "Hazel",
  "Isabella",
  "Jack",
  "Jacob",
  "James",
  "Jasmine",
  "Jayden",
  "Jessica",
  "Jordan",
  "Joshua",
  "Joy",
  "Liam",
  "Logan",
  "Lucas",
  "Madison",
  "Maya",
  "Mia",
  "Michael",
  "Nathan",
  "Nelson",
  "Noah",
  "Olivia",
  "Rachel",
  "Ryan",
  "Samuel",
  "Sarah",
  "Sophia",
  "Victor",
  "Zoe",
];

export default function VirtualModelModal({ onClose, onSwitchTool }) {
  const { activeBrand, uploadMedia, token } = useAuth();
  const isLoggedIn = !!token;
  const qualityRef = useRef(null);
  const backgroundRef = useRef(null);
  const sizeRef = useRef(null);
  const modelRef = useRef(null);
  // const poseRef = useRef(null);
  const headerRef = useRef(null);

  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);
  // const [selectedPose, setSelectedPose] = useState('3_4_turn');
  const [quality, setQuality] = useState("Standard");
  const [background, setBackground] = useState("concrete_studio");
  const [size, setSize] = useState("portrait_2_3");
  const [applyBrandStyle, setApplyBrandStyle] = useState(true);
  // Seeded from the default model's description, exactly like the staging
  // template picker seeds its scene: the box opens with a usable prompt the
  // user can send as-is or edit. Every model pick rewrites it.
  const [prompt, setPrompt] = useState(
    VIRTUAL_MODELS_BY_ID[DEFAULT_MODEL_ID].prompt,
  );
  const [generating, setGenerating] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null); // gallery/cloud URL of the picked image
  const [toolMenuOpen, setToolMenuOpen] = useState(false); // header tool switcher
  const [pickerOpen, setPickerOpen] = useState(false); // gallery media picker
  const [pickerMode, setPickerMode] = useState("product");
  // values: "product" | "model"
  const [customModels, setCustomModels] = useState([]);
  // A model the user picked but hasn't described yet: { img } while the
  // "Describe your model" step is open. The backend has NO model registry —
  // it only ever sees the reference image and the prompt we send — so an
  // undescribed custom model would generate against a blank description.
  // That's why the description is required rather than optional here.
  const [pendingModel, setPendingModel] = useState(null);
  const [modelDescription, setModelDescription] = useState("");
  // Which half is on screen below `lg` ("setup" | "result") — see
  // ToolModalMobileHeader. Ignored above it, where both are side by side.
  const [mobileView, setMobileView] = useState("setup");

  // Past generations for this tool. History REPLACES a session-only results list:
  // after each successful generate we refresh it and the new item shows up
  // (newest first). Empty history → the modal shows its sample/empty state.
  const history = useProductHistory(TOOL_ENUM.virtual_model, {
    enabled: isLoggedIn,
  });

  // Header tool switcher: clicking the current tool just closes; any other tool
  // tells the parent to swap modals (parent opens the right one + closes this).
  const handleToolClick = (id) => {
    setToolMenuOpen(false);
    if (id === "virtual") return; // already here
    onSwitchTool?.(id);
  };

  // Image comes from the gallery picker (My Library / Search / Upload). We only
  // use ONE image. A fresh desktop upload carries a File + a LOCAL blob: URL
  // (not sendable to the backend), so we keep the File and leave the hosted URL
  // null — it's uploaded on generate to get a real URL. A library/search pick
  // already has a hosted URL we can send straight through.
  // const handleApplyFromPicker = (images = []) => {
  //   const item = images[0];
  //   if (!item) return;
  //   if (item.file instanceof File) {
  //     setUploadedFile(item.file);
  //     setUploadedImage(item.src || URL.createObjectURL(item.file));
  //     setUploadedFileUrl(null); // resolve a hosted URL on generate
  //   } else {
  //     const url = item.large || item.src || null;
  //     if (!url) return;
  //     setUploadedFile(null);
  //     setUploadedImage(url);
  //     setUploadedFileUrl(url); // already hosted
  //   }
  //   setPickerOpen(false);
  // };

  const handleApplyFromPicker = (images = []) => {
    const item = images[0];
    if (!item) return;

    const isAddingModel = pickerMode === "model";

    let imageUrl = null;
    let previewUrl = null;

    if (item.file instanceof File) {
      previewUrl = item.src || URL.createObjectURL(item.file);
      imageUrl = previewUrl;
    } else {
      imageUrl = item.large || item.src || null;
      previewUrl = imageUrl;
    }

    if (!imageUrl) return;

    // ----------------------------
    // ADDING A CUSTOM MODEL
    // ----------------------------
    // The model isn't added yet — describing it is a required step, so the
    // pick only opens the description form. Nothing lands in the roster (or
    // gets selected) until that form is submitted.
    if (isAddingModel) {
      setPendingModel({ img: imageUrl });
      setModelDescription("");
      setPickerOpen(false);
      setPickerMode("product");
      return;
    }

    // ----------------------------
    // PRODUCT IMAGE (existing behaviour)
    // ----------------------------

    if (item.file instanceof File) {
      setUploadedFile(item.file);
      setUploadedImage(previewUrl);
      setUploadedFileUrl(null);
    } else {
      setUploadedFile(null);
      setUploadedImage(imageUrl);
      setUploadedFileUrl(imageUrl);
    }

    setPickerOpen(false);
    setPickerMode("product");
  };

  // Minimum useful description. A couple of words ("a man") tells the generator
  // almost nothing, so the form stays disabled until there's a real sentence.
  const MIN_DESCRIPTION = 15;
  const descriptionReady = modelDescription.trim().length >= MIN_DESCRIPTION;

  /**
   * Picking a model REPLACES the prompt with that model's description — same
   * rule as the staging template picker. Any refinement the user typed survives
   * only as edits made AFTER the pick.
   */
  const selectModel = (model) => {
    setSelectedModel(model.id);
    if (model.prompt) setPrompt(model.prompt);
    setOpenDropdown(null);
  };

  /**
   * Finish adding the user's own model: turn the typed description into the
   * same prompt shape the built-in roster uses, add it, select it and seed the
   * prompt box with it.
   */
  const confirmCustomModel = () => {
    if (!pendingModel || !descriptionReady) return;
    const description = modelDescription.trim();
    const customModel = {
      id: `custom_${Date.now()}`,
      name: RANDOM_MODEL_NAMES[
        Math.floor(Math.random() * RANDOM_MODEL_NAMES.length)
      ],
      img: pendingModel.img,
      desc: description,
      emoji: "👤",
      isCustom: true,
      prompt: buildModelPrompt(description),
    };
    setCustomModels((prev) => [...prev, customModel]);
    selectModel(customModel);
    setPendingModel(null);
    setModelDescription("");
  };

  // Options let result-menu actions regenerate off a specific result instead of
  // the sidebar's uploaded image:
  //   • promptOverride   — send this prompt instead of the sidebar's.
  //   • imageUrlOverride — use this hosted image as the input (e.g. "Other
  //     angles" regenerates from the result's OWN output image).
  //   • modelName / modelImageUrl — reuse the model a past result was generated
  //     with (carried in its history record) instead of the sidebar selection.
  const handleGenerate = async ({
    promptOverride,
    imageUrlOverride,
    modelName,
    modelImageUrl,
  } = {}) => {
    if (!imageUrlOverride && !uploadedFile && !uploadedImage) {
      toast.error("Please select a product image first");
      return;
    }
    // The prompt box is seeded with the selected model's description, so
    // normally it already carries it. If the user emptied the box, fall back to
    // that description rather than sending nothing — the backend keeps no model
    // registry, so an empty prompt means it has no idea who to render.
    const selected = allModels.find((m) => m.id === selectedModel);
    const promptToSend =
      promptOverride != null
        ? promptOverride
        : prompt.trim() || selected?.prompt || "";
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
        console.log("🖼️ [virtual-model] upload response ←", uploaded);
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

      // Backend contract: POST /product-studio/generate
      const payload = {
        tool: TOOL_ENUM.virtual_model, // "virtual_model"
        image_url: imageUrl, // single image URL
        model_name: modelName || selectedModel, // model id, e.g. "elena"
        // The reference photo. For the built-in roster this is a Pexels CDN
        // URL; for a user's own model it's whatever the gallery picker gave us.
        model_image_url: modelImageUrl || selected?.img,
        //   pose: selectedPose, // pose id, e.g. "3_4_turn"
        quality: QUALITY_ENUM[quality] || "standard",
        size, // aspect-ratio id
        apply_brand_style: applyBrandStyle,
        prompt: promptToSend || "",
        // workspace_id omitted for now (confirm source with backend).
      };

      const result = await generateProductPhoto(payload);

      // Log the raw return so we can see its exact shape while consuming it.
      console.log("🎨 [virtual-model] generate result ←", result);

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
      console.error("❌ [virtual-model] generate failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const toggle = (key) => setOpenDropdown((p) => (p === key ? null : key));

  // Built-in roster first, then anything the user added this session.
  const allModels = [...VIRTUAL_MODELS, ...customModels];

  const modelObj = allModels.find((m) => m.id === selectedModel);
  // const poseObj = POSES.find(p => p.id === selectedPose);
  const bgObj = BACKGROUNDS.find((b) => b.id === background);
  const sizeObj = SIZES.find((s) => s.id === size);

  const closeAll = () => {
    setOpenDropdown(null);
    setToolMenuOpen(false);
  };

  // ── Result menu actions (passed to the shared history grid) ──
  // Download / Copy link / Save to gallery live inside ProductHistoryGrid; these
  // are the modal-specific ones it can't own.
  // "Change something": focus the prompt so the user can describe the edit.
  const handleChangeSomething = () =>
    document.getElementById("virtual-model-prompt")?.focus();
  // "Other angles": regenerate a NEW angle of THIS result — send the result's
  // own output image back in, and reuse the model it was generated with (both
  // carried in the history record). The item's original prompt (plus the angle
  // instruction) preserves the rest of the scene.
  const handleOtherAngles = (item) => {
    if (!item?.url) return;
    const meta = item.raw?.meta || {};
    handleGenerate({
      promptOverride: [(item.prompt || "").trim(), ANGLE_INSTRUCTION]
        .filter(Boolean)
        .join(" "),
      imageUrlOverride: item.url,
      modelName: meta.model_name,
      modelImageUrl: meta.model_image_url,
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
          title="Virtual Model"
          subtitle="Your product, worn by a real-looking model."
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
                Virtual Model
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 transition-transform ${toolMenuOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {/* Upload — opens the gallery picker (My Library / Search / Upload) */}
            <div className="px-4 pt-4">
              <button
                onClick={() => {
                  setPickerMode("product");
                  setPickerOpen(true);
                }}
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

            {/* Model & Pose */}
            <div className="px-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Model button */}
                <button
                  ref={modelRef}
                  onClick={() => toggle("model")}
                  className={`w-full flex flex-col items-center p-2.5 rounded-2xl transition-all ${openDropdown === "model" ? "bg-blue-50 ring-2 ring-blue-500" : "bg-gray-100/70 hover:bg-gray-100"}`}
                >
                  <div className="w-full h-40 rounded-xl overflow-hidden mb-2.5 bg-surface">
                    <img
                      src={modelObj?.img}
                      alt={modelObj?.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[11px] text-gray-500">Model</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {modelObj?.name}
                  </span>
                </button>

                {/* Pose button */}
                {/* <button
                                ref={poseRef}
                                onClick={() => toggle('pose')}
                                className={`w-full flex flex-col items-center p-2.5 rounded-2xl transition-all ${openDropdown === 'pose' ? 'bg-blue-50 ring-2 ring-blue-500' : 'bg-gray-100/70 hover:bg-gray-100'}`}
                            >
                                <div className="w-full h-40 rounded-xl overflow-hidden mb-2.5 bg-surface">
                                    <img src={poseObj?.img} alt={poseObj?.name} className="w-full h-full object-contain" />
                                </div>
                                <span className="text-[11px] text-gray-500">Pose</span>
                                <span className="text-sm font-semibold text-gray-900">{poseObj?.name}</span>
                            </button> */}
              </div>
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

              {/* Background */}
              <button
                ref={backgroundRef}
                onClick={() => toggle("background")}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-gray-100 hover:bg-gray-100 text-sm transition-colors"
              >
                <span className="text-gray-900 font-medium">Background</span>
                <span className="flex items-center gap-2 text-gray-500">
                  {bgObj?.name}
                  <div
                    className="w-7 h-7 rounded-md border border-gray-200"
                    style={{ backgroundColor: bgObj?.color }}
                  />
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
                  id="virtual-model-prompt"
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

          {/* Generate — pinned to the bottom of the sidebar. On mobile the
              sidebar IS the Setup view, so this is the screen's bottom bar and
              needs clearing the home indicator. */}
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
                    src={uploadedImage || CLOTHING_IMG}
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
                    src={modelObj?.img}
                    alt={modelObj?.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
              <h3 className="text-gray-900 text-center text-base sm:text-lg font-semibold max-w-sm leading-snug">
                Visualize your product on a real-looking model
              </h3>
              <p className="text-gray-500 text-center text-xs sm:text-sm mt-2 max-w-xs leading-relaxed">
                Upload a product photo and watch it come to life on the model
                and pose you choose.
              </p>
            </div>
          ) : (
            <ProductHistoryGrid
              items={history.items}
              loading={history.loading}
              generating={generating}
              generatingLabel="Generating your virtual model…"
              onDelete={history.remove}
              removingId={history.removingId}
              uploadMedia={uploadMedia}
              filePrefix="virtual-model"
              aspectClass="aspect-2/3"
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
            activeToolId="virtual"
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
      {openDropdown === "model" && (
        <FloatingPanel
          anchorRef={modelRef}
          width={310}
          title="Model"
          subtitle={modelObj?.name}
          onClose={() => setOpenDropdown(null)}
        >
          <p className="px-3 pt-3 text-[11px] text-gray-500">
            Pick a model — their description replaces the prompt below.
          </p>
          <div className="grid grid-cols-4 gap-2 p-3 max-h-[70vh] overflow-y-auto">
            <button
              onClick={() => {
                setPickerMode("model");
                setPickerOpen(true);
                setOpenDropdown(null);
              }}
              title="Use your own model"
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg h-24 text-gray-500 hover:border-blue-400 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
            {allModels.map((m) => (
              <button
                key={m.id}
                onClick={() => selectModel(m)}
                title={m.desc}
                className={`flex flex-col items-center p-1.5 rounded-lg border-2 transition-colors ${selectedModel === m.id ? "border-blue-500" : "border-transparent hover:border-gray-200"}`}
              >
                <div className="w-14 h-20 bg-gray-100 rounded-lg overflow-hidden relative mb-1">
                  <img
                    src={m.img}
                    alt={m.name}
                    loading="lazy"
                    className="w-full h-full object-cover object-top"
                  />
                  {selectedModel === m.id && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-[8px]">✓</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 truncate max-w-full">
                  {m.name}
                </span>
              </button>
            ))}
          </div>
        </FloatingPanel>
      )}

      {/* {openDropdown === 'pose' && (
                <FloatingPanel anchorRef={poseRef} width={310}>
                    <div className="grid grid-cols-4 gap-2 p-3">
                        {POSES.map(p => (
                            <button key={p.id} onClick={() => { setSelectedPose(p.id); setOpenDropdown(null); }}
                                className={`flex flex-col items-center p-1.5 rounded-lg border-2 transition-colors ${selectedPose === p.id ? 'border-blue-500' : 'border-transparent hover:border-gray-200'}`}>
                                <div className="w-14 h-20 bg-gray-100 rounded-lg overflow-hidden relative mb-1">
                                    <img src={p.img} alt={p.name} className="w-full h-full object-cover object-top" />
                                    {selectedPose === p.id && <div className="absolute top-1 right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center"><span className="text-white text-[8px]">✓</span></div>}
                                </div>
                                <span className="text-[10px] text-gray-500 text-center leading-tight">{p.name}</span>
                            </button>
                        ))}
                    </div>
                </FloatingPanel>
            )} */}

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

      {openDropdown === "background" && (
        <FloatingPanel
          anchorRef={backgroundRef}
          width={470}
          title="Background"
          subtitle={bgObj?.name}
          onClose={() => setOpenDropdown(null)}
        >
          {/* 4 across on desktop; 3 in the mobile sheet, where a 360px width
              would otherwise squeeze each swatch under ~70px. */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 p-3">
            {BACKGROUNDS.map((b) => {
              const active = background === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    setBackground(b.id);
                    setOpenDropdown(null);
                  }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={`w-full h-20 rounded-xl overflow-hidden relative border-2 transition-colors ${active ? "border-blue-500" : "border-transparent hover:border-gray-200"}`}
                  >
                    {b.img ? (
                      <img
                        src={b.img}
                        alt={b.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    {active && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-[8px]">✓</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 text-center leading-tight">
                    {b.name}
                  </span>
                </button>
              );
            })}
          </div>
        </FloatingPanel>
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

      {/* ── Describe your model — REQUIRED step after picking your own model ──
          The reference photo alone doesn't tell the generator who this is, so
          the model isn't added to the roster until this is filled in. ── */}
      {pendingModel && (
        <div
          className="fixed inset-0 z-220 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setPendingModel(null)}
        >
          <div
            className="bg-surface w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between px-5 pt-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Describe your model
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Your photo shows us the look — the description tells the AI who
                  is wearing your product. Both get sent.
                </p>
              </div>
              <button
                onClick={() => setPendingModel(null)}
                aria-label="Cancel"
                className="shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-4 px-5 pt-4">
              <div className="w-24 h-32 shrink-0 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                <img
                  src={pendingModel.img}
                  alt="Your model"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="flex-1 min-w-0">
                <textarea
                  autoFocus
                  value={modelDescription}
                  onChange={(e) => setModelDescription(e.target.value)}
                  placeholder="e.g. a woman in her thirties with long dark hair, wearing a white shirt and blue jeans, standing against a plain studio background"
                  className="w-full h-32 text-sm text-gray-900 placeholder:text-gray-500 bg-gray-100 rounded-xl p-3 outline-none resize-none leading-relaxed focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <p className="px-5 pt-2 text-[11px] text-gray-500">
              {descriptionReady
                ? "Looks good — you can edit this in the prompt box afterwards."
                : `Describe their build, hair, outfit and pose (${modelDescription.trim().length}/${MIN_DESCRIPTION} characters).`}
            </p>

            <div className="flex gap-2 px-5 pt-4 pb-[calc(1.25rem+var(--ck-safe-b))] sm:pb-5">
              <button
                onClick={() => setPendingModel(null)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmCustomModel}
                disabled={!descriptionReady}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Add model
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery media picker — pick ONE image (My Library / Search / Upload) */}
      <MediaPickerModal
        maxSelectable={10}
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onCancel={() => setPickerOpen(false)}
        onApply={handleApplyFromPicker}
        activeBrand={activeBrand}
      />
    </div>
  );
}
