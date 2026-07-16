import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Undo,
  Sparkles,
  Sun,
  AlignCenter,
  AlignVerticalJustifyCenter,
  Scissors,
  ChevronRight,
  ChevronLeft,
  Pencil,
  Loader2,
  FlipHorizontal,
  FlipVertical,
  Circle,
  SlidersHorizontal,
  Blend,
  Frame,
  Move,
  MoveVertical,
  Palette,
  Droplet,
  Maximize2,
  Eye,
  Spline,
  RotateCw,
  Grid2x2,
  Trash2,
} from "lucide-react";
import { Toggle, Slider, PosField, FILTERS } from "./editorShared";

// Shadow sub-tools, laid out as a segmented grid (Photoroom "Shadows" panel).
// AI Shadows / Move are placeholders for now — a dedicated panel each is coming.
const SHADOW_TOOLS = [
  { id: "ai", label: "AI Shadows", Icon: Sparkles },
  { id: "intensity", label: "Intensity", Icon: Sun },
  { id: "blur", label: "Blur", Icon: Droplet },
  { id: "shortness", label: "Shortness", Icon: MoveVertical },
  { id: "color", label: "Color", Icon: Palette },
  { id: "move", label: "Move", Icon: Move },
];

// Outline sub-tools (segmented grid, Photoroom "Outline" panel).
const OUTLINE_TOOLS = [
  { id: "width", label: "Width", Icon: Maximize2 },
  { id: "color", label: "Color", Icon: Palette },
  { id: "blur", label: "Blur", Icon: Droplet },
];

// Reflection sub-tools (segmented grid, Photoroom "Reflection" panel).
const REFLECTION_TOOLS = [
  { id: "opacity", label: "Opacity", Icon: Eye },
  { id: "move", label: "Move", Icon: Move },
  { id: "angle", label: "Angle", Icon: Spline },
];

// AI Shadows presets → advanced params (0–100 each). `null` = None (no shadow).
const AI_PRESETS = {
  none: null,
  soft: { hardness: 20, intensity: 45, direction: 50, spread: 60, orientation: 30 },
  hard: { hardness: 85, intensity: 70, direction: 50, spread: 40, orientation: 70 },
  floating: { hardness: 40, intensity: 35, direction: 50, spread: 85, orientation: 95 },
};
const AI_PRESET_LIST = [
  { id: "none", label: "None", swatch: "transparent" },
  { id: "soft", label: "Soft", swatch: "linear-gradient(135deg,#e5e7eb,#9ca3af)" },
  { id: "hard", label: "Hard", swatch: "#6b7280" },
  {
    id: "floating",
    label: "Floating",
    swatch: "radial-gradient(circle,#9ca3af,transparent 72%)",
  },
];

// Default AI Shadows panel state.
const AI_SHADOWS_INIT = {
  open: false,
  tab: "presets",
  preset: "none",
  hardness: 70,
  intensity: 60,
  direction: 75,
  spread: 50,
  orientation: 40,
  on: {
    hardness: true,
    intensity: true,
    direction: false,
    spread: false,
    orientation: false,
  },
  generating: false,
};

// Shadow colour swatches (Shadows section).
const SHADOW_SWATCHES = [
  "#000000",
  "#374151",
  "#1e3a8a",
  "#7c2d12",
  "#581c87",
  "#0f766e",
];

// Recolor swatches for vector inserts — same palette as the Text panel colors.
const INSERT_COLORS = [
  "transparent",
  "#000000",
  "#ffffff",
  "#ef4444",
  "#ec4899",
  "#7c3aed",
];

// Blend modes offered in the Blend section.
const BLEND_MODES = [
  "normal",
  "multiply",
  "darken",
  "screen",
  "lighten",
  "overlay",
  "soft-light",
  "hard-light",
  "difference",
  "luminosity",
];

const TEXTURE_DEFAULTS = { posterize: 10, line: 50, color: 50 };

// ── ImagePanel ──────────────────────────────────────────────────────────────
// The single Image editing panel, shared by the base image AND every inserted
// image layer. It reads/writes through the "active image" adapter passed in by
// PhotoEditor (activeImg / updateActiveImg), so one change here affects every
// image. Base geometry (position/size + setters) arrives via `base` and is
// re-derived per-kind below.
export default function ImagePanel({
  activeImg,
  updateActiveImg,
  activeImageKind,
  selectedLayer,
  selectedLayerId,
  canvasSize,
  updateLayer,
  reorderLayer,
  duplicateLayer,
  base,
  activeSrc,
  activeTitle = "Image",
  // Recolor control for vector inserts (shapes/stickers/…): shown between
  // Remove background and Shadows.
  insertColorable = false,
  insertColor,
  onInsertRecolor,
  hasActiveImage,
  alignActiveCenter,
  alignActiveMiddle,
  handleSave,
  saving,
  applyingAi,
  handleRetouchRelight,
  removeBg,
  handleRemoveBgToggle,
  openCutout,
  fileInputRef,
  layerReplaceRef,
  expandedPanel,
  togglePanel,
  setExpandedPanel,
  moveShadow,
  setMoveShadow,
  moveReflection,
  setMoveReflection,
  onDeleteActive,
}) {
                const ai = activeImg;
                const isLayerImg = activeImageKind === "layer";
                // Which Shadows / Outline sub-tool is active (segmented grid).
                const [shadowTool, setShadowTool] = useState("intensity");
                const [outlineTool, setOutlineTool] = useState("width");
                const [reflectionTool, setReflectionTool] = useState("opacity");
                // AI Shadows takeover panel state + its generate timer.
                const [aiSh, setAiSh] = useState(AI_SHADOWS_INIT);
                const genTimerRef = useRef(null);
                const {
                  brightness,
                  contrast,
                  saturation,
                  highlights,
                  shadowsAdj,
                  sharpen,
                  hue,
                  warmth,
                  adjOpacity,
                  rotation,
                  flipH,
                  flipV,
                  scale,
                  tile,
                  hPersp,
                  vPersp,
                  blurAmount,
                  blurType,
                  selectedFilter,
                  textureType,
                  textureAmount,
                  shadowBlur,
                  shadowOpacity,
                  shadowColor,
                  shadowX,
                  shadowY,
                  shadowMode,
                  shadowShortness,
                  outlineColor,
                  outlineWidth,
                  outlineBlur,
                  reflectionOpacity,
                  reflectionGap,
                  reflectionX,
                  reflectionAngle,
                  blendMode,
                  toggles,
                } = ai;
                const set = (k) => (v) => updateActiveImg({ [k]: v });
                const setFn = (k) => (u) =>
                  updateActiveImg({
                    [k]: typeof u === "function" ? u(ai[k]) : u,
                  });
                const setBrightness = set("brightness");
                const setContrast = set("contrast");
                const setSaturation = set("saturation");
                const setHighlights = set("highlights");
                const setShadowsAdj = set("shadowsAdj");
                const setSharpen = set("sharpen");
                const setHue = set("hue");
                const setWarmth = set("warmth");
                const setAdjOpacity = set("adjOpacity");
                const setRotation = set("rotation");
                const setBaseScale = set("scale");
                const setTile = set("tile");
                const setHPersp = set("hPersp");
                const setVPersp = set("vPersp");
                const setFlipH = setFn("flipH");
                const setFlipV = setFn("flipV");
                const setBlurAmount = set("blurAmount");
                const setBlurType = set("blurType");
                const setSelectedFilter = set("selectedFilter");
                const setTextureType = set("textureType");
                const setTextureAmount = set("textureAmount");
                const setShadowBlur = set("shadowBlur");
                const setShadowOpacity = set("shadowOpacity");
                const setShadowColor = set("shadowColor");
                const setShadowX = set("shadowX");
                const setShadowY = set("shadowY");
                const setShadowMode = set("shadowMode");
                const setShadowShortness = set("shadowShortness");
                const setOutlineColor = set("outlineColor");
                const setOutlineWidth = set("outlineWidth");
                const setOutlineBlur = set("outlineBlur");
                const setReflectionOpacity = set("reflectionOpacity");
                const setReflectionGap = set("reflectionGap");
                const setReflectionX = set("reflectionX");
                const setReflectionAngle = set("reflectionAngle");
                const setBlendMode = set("blendMode");
                const setToggles = setFn("toggles");
                // Geometry: base uses the passed-in flat offsets/box; a layer
                // maps to its own x/y/w/h (x/y are canvas-centre-relative here).
                const displayImage = isLayerImg ? selectedLayer.src : base.displayImage;
                const posX = isLayerImg
                  ? selectedLayer.x - canvasSize.w / 2
                  : base.posX;
                const posY = isLayerImg
                  ? selectedLayer.y - canvasSize.h / 2
                  : base.posY;
                const imgW = isLayerImg ? selectedLayer.w : base.imgW;
                const imgH = isLayerImg ? selectedLayer.h : base.imgH;
                const setPosX = isLayerImg
                  ? (v) =>
                      updateLayer(selectedLayer.id, {
                        x: canvasSize.w / 2 + v,
                      })
                  : base.setPosX;
                const setPosY = isLayerImg
                  ? (v) =>
                      updateLayer(selectedLayer.id, {
                        y: canvasSize.h / 2 + v,
                      })
                  : base.setPosY;
                const setImgW = isLayerImg
                  ? (v) =>
                      updateLayer(selectedLayer.id, { w: Math.max(10, v) })
                  : base.setImgW;
                const setImgH = isLayerImg
                  ? (v) =>
                      updateLayer(selectedLayer.id, { h: Math.max(10, v) })
                  : base.setImgH;

                // ── AI Shadows sub-panel ──────────────────────────────────
                const setAiField = (k, v) =>
                  setAiSh((s) => ({ ...s, [k]: v }));
                const setAiOn = (k, v) =>
                  setAiSh((s) => ({ ...s, on: { ...s.on, [k]: v } }));
                // Map the 0–100 AI params onto the existing shadow state so the
                // normal render/export pipeline draws the result. (Local render,
                // no backend — see plan.)
                const applyParamsToShadow = (params) => {
                  if (!params) return;
                  const { hardness, intensity, direction, spread, orientation } =
                    params;
                  // hardness: 0 soft → big blur, 100 hard → crisp
                  setShadowBlur(Math.round(2 + ((100 - hardness) / 100) * 38));
                  setShadowOpacity(Math.round(intensity));
                  const upright = orientation >= 50;
                  setShadowMode(upright ? "drop" : "floor");
                  // long spread → low shortness (longer cast)
                  setShadowShortness(Math.round(100 - spread));
                  // direction → offset (Back / Left / Front / Right quadrants)
                  const dist = 8 + (spread / 100) * 34;
                  let dx = 0;
                  let dy = upright ? 12 : 0;
                  const seg = direction / 100;
                  if (seg < 0.25) dy = -dist;
                  else if (seg < 0.5) dx = -dist;
                  else if (seg < 0.75) dy = dist;
                  else dx = dist;
                  setShadowX(Math.round(dx));
                  setShadowY(Math.round(dy));
                };
                const runGenerate = (params, presetId) => {
                  if (genTimerRef.current) clearTimeout(genTimerRef.current);
                  // None → just clear the shadow, no "generating" state.
                  if (presetId === "none" || params === null) {
                    setToggles((p) => ({ ...p, shadows: false }));
                    setAiSh((s) => ({ ...s, preset: "none", generating: false }));
                    return;
                  }
                  setAiSh((s) => ({
                    ...s,
                    generating: true,
                    preset: presetId ?? s.preset,
                  }));
                  genTimerRef.current = setTimeout(() => {
                    applyParamsToShadow(params);
                    setToggles((p) => ({ ...p, shadows: true }));
                    setAiSh((s) => ({ ...s, generating: false }));
                    toast.success("AI shadow applied");
                  }, 1000);
                };
                const cancelGenerate = () => {
                  if (genTimerRef.current) clearTimeout(genTimerRef.current);
                  setAiSh((s) => ({ ...s, generating: false }));
                };
                // A labelled range row for the Advanced tab (with an enable
                // toggle; the slider only shows when the row is on).
                const aiRow = ({ label, k, leftLabel, rightLabel, midLabels }) => (
                  <div className="pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">
                        {label}
                      </span>
                      <Toggle
                        enabled={aiSh.on[k]}
                        onChange={(v) => setAiOn(k, v)}
                      />
                    </div>
                    {aiSh.on[k] && (
                      <>
                        <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                          {midLabels ? (
                            midLabels.map((m) => <span key={m}>{m}</span>)
                          ) : (
                            <>
                              <span>{leftLabel}</span>
                              <span>{rightLabel}</span>
                            </>
                          )}
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={aiSh[k]}
                          onChange={(e) =>
                            setAiField(k, Number(e.target.value))
                          }
                          className="w-full h-1.5 accent-blue-600"
                        />
                      </>
                    )}
                  </div>
                );

                // A labelled slider with a boxed, editable numeric value on the
                // right (Transform rows — matches the Photoroom layout).
                const numSlider = ({ label, value, min, max, onChange }) => (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={min}
                        max={max}
                        value={value}
                        onChange={(e) => onChange(Number(e.target.value))}
                        className="flex-1 h-1.5 accent-blue-600"
                      />
                      <input
                        type="number"
                        value={value}
                        min={min}
                        max={max}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (!Number.isNaN(n)) onChange(n);
                        }}
                        className="w-14 py-1.5 px-1 text-sm text-center text-gray-800 bg-surface border border-gray-200 rounded-lg outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                );

                // A grouped-card section header: coloured icon + label, an
                // optional value/toggle, and the › chevron. Clicking the row
                // expands it; clicking the chevron switches the effect ON (for
                // toggleable sections) and opens it.
                const sectionRow = ({
                  id,
                  Icon,
                  tint,
                  label,
                  value,
                  hasToggle,
                  enabled,
                  onToggle,
                }) => (
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => togglePanel(id)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tint}`}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="text-sm text-gray-900 truncate">
                        {label}
                      </span>
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {value != null && (
                        <span className="text-xs text-gray-500 capitalize">
                          {value}
                        </span>
                      )}
                      {hasToggle && (
                        <Toggle enabled={enabled} onChange={onToggle} />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (expandedPanel === id) {
                            // Down arrow → close. Do NOT turn the effect off.
                            setExpandedPanel(null);
                          } else {
                            // › arrow → open, and switch the effect on.
                            if (hasToggle && !enabled) onToggle(true);
                            setExpandedPanel(id);
                          }
                        }}
                        className="p-0.5 cursor-pointer"
                        aria-label={
                          expandedPanel === id ? `Close ${label}` : `Open ${label}`
                        }
                      >
                        <ChevronRight
                          className={`w-4 h-4 text-gray-400 transition-transform ${expandedPanel === id ? "rotate-90" : ""}`}
                        />
                      </button>
                    </div>
                  </div>
                );
                return (
                  <>
                {aiSh.open ? (
                  /* ── AI Shadows takeover ─────────────────────────────── */
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() =>
                          setAiSh((s) => ({ ...s, open: false }))
                        }
                        className="p-1 -ml-1 hover:bg-gray-100 rounded-lg cursor-pointer"
                        aria-label="Back"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                      </button>
                      <h2 className="text-lg font-bold text-gray-900">
                        AI Shadows
                      </h2>
                    </div>

                    {/* Presets / Advanced tabs */}
                    <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl mb-4">
                      {["presets", "advanced"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setAiField("tab", t)}
                          className={`py-2 rounded-lg text-sm font-medium capitalize cursor-pointer transition-colors ${
                            aiSh.tab === t
                              ? "bg-surface shadow text-gray-900"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    {aiSh.tab === "presets" ? (
                      <div className="grid grid-cols-3 gap-3">
                        {AI_PRESET_LIST.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() =>
                              runGenerate(AI_PRESETS[p.id], p.id)
                            }
                            className="flex flex-col items-center gap-2 cursor-pointer"
                          >
                            <span
                              className={`w-full aspect-square rounded-xl border flex items-center justify-center transition-all ${
                                aiSh.preset === p.id
                                  ? "border-blue-500 ring-2 ring-blue-200"
                                  : "border-gray-200 hover:border-blue-300"
                              }`}
                            >
                              <span
                                className="w-6 h-6 rounded-md border border-gray-200"
                                style={{ background: p.swatch }}
                              />
                            </span>
                            <span className="text-xs text-gray-600">
                              {p.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {aiRow({
                          label: "Shadow hardness",
                          k: "hardness",
                          leftLabel: "Soft",
                          rightLabel: "Hard",
                        })}
                        {aiRow({
                          label: "Shadow intensity",
                          k: "intensity",
                          leftLabel: "Light",
                          rightLabel: "Dark",
                        })}
                        {aiRow({
                          label: "Shadow direction",
                          k: "direction",
                          midLabels: ["Back", "Left", "Front", "Right"],
                        })}
                        {aiRow({
                          label: "Shadow spread",
                          k: "spread",
                          leftLabel: "Short",
                          rightLabel: "Long",
                        })}
                        {aiRow({
                          label: "Product orientation",
                          k: "orientation",
                          leftLabel: "Flat",
                          rightLabel: "Upright",
                        })}
                        {!aiSh.generating && (
                          <button
                            type="button"
                            onClick={() =>
                              runGenerate(
                                {
                                  hardness: aiSh.hardness,
                                  intensity: aiSh.intensity,
                                  direction: aiSh.direction,
                                  spread: aiSh.spread,
                                  orientation: aiSh.orientation,
                                },
                                null,
                              )
                            }
                            className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                          >
                            Apply changes
                          </button>
                        )}
                      </div>
                    )}

                    {/* Generating pill */}
                    {aiSh.generating && (
                      <div className="mt-4 flex items-center justify-between px-4 py-3 rounded-xl bg-gray-900 text-white text-sm">
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating shadow…
                        </span>
                        <button
                          type="button"
                          onClick={cancelGenerate}
                          className="font-medium hover:text-gray-300 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ) : moveShadow?.open ? (
                  /* ── Move Shadow takeover ────────────────────────────── */
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() =>
                          setMoveShadow({ open: false, mode: "2d" })
                        }
                        className="p-1 -ml-1 hover:bg-gray-100 rounded-lg cursor-pointer"
                        aria-label="Back"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                      </button>
                      <h2 className="text-lg font-bold text-gray-900">
                        Move Shadow
                      </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl mb-4">
                      {[
                        { id: "2d", label: "2D" },
                        { id: "3d", label: "3D" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setMoveShadow((s) => ({ ...s, mode: t.id }));
                            setShadowMode(t.id === "3d" ? "floor" : "drop");
                          }}
                          className={`py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                            moveShadow.mode === t.id
                              ? "bg-surface shadow text-gray-900"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <p className="text-sm text-gray-500 text-center px-2">
                      {moveShadow.mode === "3d"
                        ? "Drag the shadow around for a perspective effect."
                        : "Drag the shadow around and move it in two dimensions."}
                    </p>
                  </div>
                ) : moveReflection?.open ? (
                  /* ── Move Reflection takeover ────────────────────────── */
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() => setMoveReflection({ open: false })}
                        className="p-1 -ml-1 hover:bg-gray-100 rounded-lg cursor-pointer"
                        aria-label="Back"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                      </button>
                      <h2 className="text-lg font-bold text-gray-900">
                        Move Reflection
                      </h2>
                    </div>
                    <p className="text-sm text-gray-500 text-center px-2">
                      Drag to change the aspect of the reflection.
                    </p>
                  </div>
                ) : (
                  <>
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {activeSrc && (
                        <img
                          src={activeSrc}
                          alt=""
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      <span className="font-semibold text-sm text-gray-900">
                        {activeSrc ? activeTitle : "No image"}
                      </span>
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={!hasActiveImage || saving}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-40 cursor-pointer"
                    >
                      {saving && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      )}
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1 mb-3">
                    <button
                      className="flex flex-col items-center gap-1 py-2 border border-gray-200 rounded-lg hover:border-blue-400 text-xs text-gray-500 transition-colors"
                      onClick={() => {
                        if (activeImageKind === "layer")
                          layerReplaceRef.current?.click();
                        else fileInputRef.current?.click();
                      }}
                    >
                      <Undo className="w-4 h-4" /> Replace
                    </button>
                    <button
                      className="flex flex-col items-center gap-1 py-2 border border-gray-200 rounded-lg hover:border-blue-400 text-xs text-gray-500 transition-colors disabled:opacity-40"
                      disabled={
                        !hasActiveImage ||
                        applyingAi ||
                        activeImageKind === "layer"
                      }
                      onClick={() => handleRetouchRelight("retouch")}
                    >
                      <Sparkles className="w-4 h-4" />
                      {applyingAi ? "..." : "Retouch"}
                    </button>
                    <button
                      className="flex flex-col items-center gap-1 py-2 border border-gray-200 rounded-lg hover:border-blue-400 text-xs text-gray-500 transition-colors disabled:opacity-40"
                      disabled={
                        !hasActiveImage ||
                        applyingAi ||
                        activeImageKind === "layer"
                      }
                      onClick={() => handleRetouchRelight("light")}
                    >
                      <Sun className="w-4 h-4" /> Light On
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mb-2">Align to canvas</p>
                  <div className="grid grid-cols-2 gap-1 mb-4">
                    <button
                      onClick={alignActiveCenter}
                      disabled={!hasActiveImage}
                      className="flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg hover:border-blue-400 text-xs text-gray-500 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <AlignCenter className="w-3.5 h-3.5" /> Center
                    </button>
                    <button
                      onClick={alignActiveMiddle}
                      disabled={!hasActiveImage}
                      className="flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg hover:border-blue-400 text-xs text-gray-500 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />{" "}
                      Middle
                    </button>
                  </div>
                </div>

                {/* Grouped controls. Click a row to expand it; click the
                    chevron to switch that effect on. */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">

                  {/* Background */}
                  <div className="rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <Scissors className="w-4 h-4" />
                        </span>
                        <span className="text-sm text-gray-900 truncate">
                          Remove background
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Toggle
                          enabled={activeImg.removeBg}
                          onChange={handleRemoveBgToggle}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveBgToggle(true)}
                          className="p-0.5 cursor-pointer"
                          aria-label="Enable remove background"
                        >
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                    <div className="px-3 pb-3">
                      <button
                        onClick={openCutout}
                        disabled={!hasActiveImage}
                        className="w-full flex items-center justify-center gap-2 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-blue-400 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit Cutout
                      </button>
                    </div>
                  </div>

                  {/* Color — recolor a vector insert (shape/sticker/…). Same
                      swatches as the Text panel. */}
                  {insertColorable && (
                    <div className="rounded-2xl border border-gray-200 p-3">
                      <p className="text-xs text-gray-500 mb-1.5">Color</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {INSERT_COLORS.map((c) => (
                          <button
                            key={c}
                            onClick={() => onInsertRecolor?.(c)}
                            title={c}
                            className="w-8 h-8 rounded-full border border-gray-300 cursor-pointer relative overflow-hidden"
                            style={
                              c === "transparent"
                                ? {
                                    backgroundImage:
                                      "linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%),linear-gradient(45deg,#ccc 25%,transparent 25%,transparent 75%,#ccc 75%)",
                                    backgroundSize: "10px 10px",
                                    backgroundPosition: "0 0,5px 5px",
                                  }
                                : {
                                    background: c,
                                    outline:
                                      (insertColor || "").toLowerCase() === c
                                        ? "2px solid #3b82f6"
                                        : "none",
                                    outlineOffset: 1,
                                  }
                            }
                          />
                        ))}
                        <label
                          className="w-8 h-8 rounded-full border border-gray-300 cursor-pointer relative overflow-hidden"
                          title="Custom color"
                          style={{
                            background:
                              "conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)",
                          }}
                        >
                          <input
                            type="color"
                            value={
                              insertColor && insertColor !== "transparent"
                                ? insertColor
                                : "#000000"
                            }
                            onChange={(e) => onInsertRecolor?.(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Shadows / Outline / Reflection */}
                  <div className="rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                    <div>
                      {sectionRow({
                        id: "shadows",
                        Icon: Circle,
                        tint: "bg-indigo-50 text-indigo-500",
                        label: "Shadows",
                        hasToggle: true,
                        enabled: toggles.shadows,
                        onToggle: (val) =>
                          setToggles((p) => ({ ...p, shadows: val })),
                      })}
                    {expandedPanel === "shadows" && toggles.shadows && (
                      <div className="px-3 pb-3 bg-gray-100 space-y-3">
                        {/* Sub-tool grid (Photoroom-style segmented control) */}
                        <div className="grid grid-cols-3 gap-1.5 pt-2">
                          {SHADOW_TOOLS.map((t) => {
                            const active = shadowTool === t.id;
                            return (
                              <button
                                key={t.id}
                                onClick={() => {
                                  if (t.id === "ai") {
                                    setAiSh((s) => ({ ...s, open: true }));
                                    return;
                                  }
                                  if (t.id === "move") {
                                    setToggles((p) => ({
                                      ...p,
                                      shadows: true,
                                    }));
                                    setShadowMode("drop");
                                    setMoveShadow({ open: true, mode: "2d" });
                                    return;
                                  }
                                  setShadowTool(t.id);
                                }}
                                className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                                  active
                                    ? "bg-blue-600 text-white"
                                    : "bg-surface text-gray-700 border border-gray-200 hover:border-blue-400"
                                }`}
                              >
                                <t.Icon className="w-4 h-4" />
                                {t.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Active sub-tool control */}
                        {shadowTool === "intensity" && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              Intensity
                            </p>
                            <Slider
                              label="Intensity"
                              value={shadowOpacity}
                              min={0}
                              max={100}
                              onChange={setShadowOpacity}
                              unit="%"
                              hideLabel
                            />
                          </div>
                        )}
                        {shadowTool === "blur" && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Blur</p>
                            <Slider
                              label="Blur"
                              value={shadowBlur}
                              min={0}
                              max={50}
                              onChange={setShadowBlur}
                              unit="px"
                              hideLabel
                            />
                          </div>
                        )}
                        {shadowTool === "shortness" && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              Shortness
                            </p>
                            <Slider
                              label="Shortness"
                              value={shadowShortness}
                              min={0}
                              max={100}
                              onChange={setShadowShortness}
                              unit="%"
                              hideLabel
                            />
                          </div>
                        )}
                        {shadowTool === "color" && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1.5">Color</p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {SHADOW_SWATCHES.map((c) => (
                                <button
                                  key={c}
                                  onClick={() => setShadowColor(c)}
                                  title={c}
                                  className="w-6 h-6 rounded-full border border-gray-300 cursor-pointer"
                                  style={{
                                    background: c,
                                    outline:
                                      shadowColor.toLowerCase() === c
                                        ? "2px solid #3b82f6"
                                        : "none",
                                    outlineOffset: 1,
                                  }}
                                />
                              ))}
                              <label
                                className="w-6 h-6 rounded-full border border-gray-300 cursor-pointer relative overflow-hidden"
                                title="Custom color"
                                style={{
                                  background:
                                    "conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)",
                                }}
                              >
                                <input
                                  type="color"
                                  value={shadowColor}
                                  onChange={(e) =>
                                    setShadowColor(e.target.value)
                                  }
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                    <div>
                      {sectionRow({
                        id: "outline",
                        Icon: Circle,
                        tint: "bg-fuchsia-50 text-fuchsia-500",
                        label: "Outline",
                        hasToggle: true,
                        enabled: toggles.outline,
                        onToggle: (val) =>
                          setToggles((p) => ({ ...p, outline: val })),
                      })}
                    {expandedPanel === "outline" && toggles.outline && (
                      <div className="px-3 pb-3 bg-gray-100 space-y-3">
                        {/* Sub-tool grid (Width / Color / Blur) */}
                        <div className="grid grid-cols-3 gap-1.5 pt-2">
                          {OUTLINE_TOOLS.map((t) => {
                            const active = outlineTool === t.id;
                            return (
                              <button
                                key={t.id}
                                onClick={() => setOutlineTool(t.id)}
                                className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                                  active
                                    ? "bg-blue-600 text-white"
                                    : "bg-surface text-gray-700 border border-gray-200 hover:border-blue-400"
                                }`}
                              >
                                <t.Icon className="w-4 h-4" />
                                {t.label}
                              </button>
                            );
                          })}
                        </div>

                        {outlineTool === "width" && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Width</p>
                            <Slider
                              label="Width"
                              value={outlineWidth}
                              min={1}
                              max={30}
                              onChange={setOutlineWidth}
                              unit="px"
                              hideLabel
                            />
                          </div>
                        )}
                        {outlineTool === "blur" && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Blur</p>
                            <Slider
                              label="Blur"
                              value={outlineBlur}
                              min={0}
                              max={30}
                              onChange={setOutlineBlur}
                              unit="px"
                              hideLabel
                            />
                          </div>
                        )}
                        {outlineTool === "color" && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1.5">Color</p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {SHADOW_SWATCHES.map((c) => (
                                <button
                                  key={c}
                                  onClick={() => setOutlineColor(c)}
                                  title={c}
                                  className="w-6 h-6 rounded-full border border-gray-300 cursor-pointer"
                                  style={{
                                    background: c,
                                    outline:
                                      outlineColor.toLowerCase() === c
                                        ? "2px solid #3b82f6"
                                        : "none",
                                    outlineOffset: 1,
                                  }}
                                />
                              ))}
                              <label
                                className="w-6 h-6 rounded-full border border-gray-300 cursor-pointer relative overflow-hidden"
                                title="Custom color"
                                style={{
                                  background:
                                    "conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)",
                                }}
                              >
                                <input
                                  type="color"
                                  value={outlineColor}
                                  onChange={(e) =>
                                    setOutlineColor(e.target.value)
                                  }
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                    <div>
                      {sectionRow({
                        id: "reflection",
                        Icon: FlipVertical,
                        tint: "bg-sky-50 text-sky-500",
                        label: "Reflection",
                        hasToggle: true,
                        enabled: toggles.reflection,
                        onToggle: (val) =>
                          setToggles((p) => ({ ...p, reflection: val })),
                      })}
                    {expandedPanel === "reflection" &&
                      toggles.reflection && (
                        <div className="px-3 pb-3 bg-gray-100 space-y-3">
                          {/* Sub-tool grid (Opacity / Move / Angle) */}
                          <div className="grid grid-cols-3 gap-1.5 pt-2">
                            {REFLECTION_TOOLS.map((t) => {
                              const active = reflectionTool === t.id;
                              return (
                                <button
                                  key={t.id}
                                  onClick={() => {
                                    if (t.id === "move") {
                                      setMoveReflection({ open: true });
                                      return;
                                    }
                                    setReflectionTool(t.id);
                                  }}
                                  className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                                    active
                                      ? "bg-blue-600 text-white"
                                      : "bg-surface text-gray-700 border border-gray-200 hover:border-blue-400"
                                  }`}
                                >
                                  <t.Icon className="w-4 h-4" />
                                  {t.label}
                                </button>
                              );
                            })}
                          </div>

                          {reflectionTool === "opacity" && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Opacity
                              </p>
                              <Slider
                                label="Opacity"
                                value={reflectionOpacity}
                                min={0}
                                max={100}
                                onChange={setReflectionOpacity}
                                unit="%"
                                hideLabel
                              />
                            </div>
                          )}
                          {reflectionTool === "angle" && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Angle</p>
                              <Slider
                                label="Angle"
                                value={reflectionAngle}
                                min={-45}
                                max={45}
                                onChange={setReflectionAngle}
                                unit="°"
                                hideLabel
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Adjust / Blend / Transform / Position */}
                  <div className="rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                    <div>
                      {sectionRow({
                        id: "adjust",
                        Icon: SlidersHorizontal,
                        tint: "bg-blue-50 text-blue-500",
                        label: "Adjust",
                      })}
                    {expandedPanel === "adjust" && (
                      <div className="px-3 pb-3 bg-gray-100 space-y-2">
                        {numSlider({
                          label: "Brightness",
                          value: brightness,
                          min: -100,
                          max: 100,
                          onChange: setBrightness,
                        })}
                        {numSlider({
                          label: "Contrast",
                          value: contrast,
                          min: -100,
                          max: 100,
                          onChange: setContrast,
                        })}
                        {numSlider({
                          label: "Saturation",
                          value: saturation,
                          min: -100,
                          max: 100,
                          onChange: setSaturation,
                        })}
                        {numSlider({
                          label: "Highlights",
                          value: highlights,
                          min: -100,
                          max: 100,
                          onChange: setHighlights,
                        })}
                        {numSlider({
                          label: "Shadows",
                          value: shadowsAdj,
                          min: -100,
                          max: 100,
                          onChange: setShadowsAdj,
                        })}
                        {numSlider({
                          label: "Sharpen",
                          value: sharpen,
                          min: 0,
                          max: 100,
                          onChange: setSharpen,
                        })}
                        {numSlider({
                          label: "Hue",
                          value: hue,
                          min: -180,
                          max: 180,
                          onChange: setHue,
                        })}
                        {numSlider({
                          label: "Warmth",
                          value: warmth,
                          min: -100,
                          max: 100,
                          onChange: setWarmth,
                        })}
                        {numSlider({
                          label: "Opacity",
                          value: adjOpacity,
                          min: 0,
                          max: 100,
                          onChange: setAdjOpacity,
                        })}
                        <button
                          onClick={() => {
                            setBrightness(0);
                            setContrast(0);
                            setSaturation(0);
                            setHighlights(0);
                            setShadowsAdj(0);
                            setSharpen(0);
                            setHue(0);
                            setWarmth(0);
                            setAdjOpacity(100);
                          }}
                          className="pt-1 text-xs text-blue-600 hover:text-blue-700"
                        >
                          Reset adjustments
                        </button>
                      </div>
                    )}
                    </div>
                    <div>
                      {sectionRow({
                        id: "blend",
                        Icon: Blend,
                        tint: "bg-blue-50 text-blue-500",
                        label: "Blend",
                        value: blendMode.replace("-", " "),
                      })}
                    {expandedPanel === "blend" && (
                      <div className="pb-2 bg-gray-100">
                        <div className="divide-y divide-gray-200">
                          {BLEND_MODES.map((m) => (
                            <button
                              key={m}
                              onClick={() => setBlendMode(m)}
                              className={`w-full text-left px-4 py-2.5 text-sm capitalize cursor-pointer transition-colors ${blendMode === m ? "text-blue-600 font-medium bg-blue-50" : "text-gray-700 hover:bg-gray-200"}`}
                            >
                              {m.replace("-", " ")}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    </div>
                    <div>
                      {sectionRow({
                        id: "transform",
                        Icon: Frame,
                        tint: "bg-blue-50 text-blue-500",
                        label: "Transform",
                      })}
                    {expandedPanel === "transform" && (
                      <div className="px-3 pb-3 bg-gray-100 space-y-3">
                        {numSlider({
                          label: "Tile",
                          value: tile,
                          min: 1,
                          max: 8,
                          onChange: setTile,
                        })}
                        {numSlider({
                          label: "Horizontal Perspective",
                          value: hPersp,
                          min: -100,
                          max: 100,
                          onChange: setHPersp,
                        })}
                        {numSlider({
                          label: "Vertical Perspective",
                          value: vPersp,
                          min: -100,
                          max: 100,
                          onChange: setVPersp,
                        })}
                      </div>
                    )}
                    </div>
                    <div>
                      {sectionRow({
                        id: "position",
                        Icon: Move,
                        tint: "bg-blue-50 text-blue-500",
                        label: "Position",
                      })}
                    {expandedPanel === "position" &&
                      displayImage &&
                      imgW != null &&
                      imgH != null && (
                        <div className="px-3 pb-3 bg-gray-100 space-y-3">
                          {/* X / Y */}
                          <div className="grid grid-cols-2 gap-3">
                            <PosField
                              label="X"
                              value={Math.round(posX)}
                              onChange={(v) => setPosX(v)}
                            />
                            <PosField
                              label="Y"
                              value={Math.round(posY)}
                              onChange={(v) => setPosY(v)}
                            />
                          </div>
                          {/* Width / Height */}
                          <div className="grid grid-cols-2 gap-3">
                            <PosField
                              label="Width"
                              value={Math.round(imgW)}
                              min={10}
                              onChange={(v) => setImgW(Math.max(10, v))}
                            />
                            <PosField
                              label="Height"
                              value={Math.round(imgH)}
                              min={10}
                              onChange={(v) => setImgH(Math.max(10, v))}
                            />
                          </div>
                          {/* Angle + rotate / flip actions */}
                          <div className="flex items-end gap-3">
                            <div className="flex-1">
                              <PosField
                                label="Angle"
                                value={Math.round(rotation)}
                                onChange={(v) => setRotation(v)}
                                unit="°"
                              />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  const n = Math.round(rotation) + 90;
                                  setRotation(n > 180 ? n - 360 : n);
                                }}
                                title="Rotate 90°"
                                className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg text-gray-600 hover:border-blue-400 cursor-pointer"
                              >
                                <RotateCw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setFlipH((f) => !f)}
                                title="Flip horizontal"
                                className={`w-10 h-10 flex items-center justify-center border rounded-lg cursor-pointer ${flipH ? "border-blue-500 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-600 hover:border-blue-400"}`}
                              >
                                <FlipHorizontal className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setFlipV((f) => !f)}
                                title="Flip vertical"
                                className={`w-10 h-10 flex items-center justify-center border rounded-lg cursor-pointer ${flipV ? "border-blue-500 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-600 hover:border-blue-400"}`}
                              >
                                <FlipVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Blur / Filter / Texture */}
                  <div className="rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                    <div>
                      {sectionRow({
                        id: "blur",
                        Icon: Droplet,
                        tint: "bg-violet-50 text-violet-500",
                        label: "Blur",
                        hasToggle: true,
                        enabled: toggles.blur,
                        onToggle: (val) =>
                          setToggles((p) => ({ ...p, blur: val })),
                      })}
                    {expandedPanel === "blur" && toggles.blur && (
                      <div className="px-3 pb-3 bg-gray-100 space-y-3">
                        <div className="grid grid-cols-3 gap-1.5 pt-2">
                          {[
                            { id: "bokeh", label: "Bokeh" },
                            { id: "gaussian", label: "Gaussian" },
                            { id: "motion", label: "Motion" },
                            { id: "pixelate", label: "Pixelate" },
                            { id: "square", label: "Square px" },
                            { id: "box", label: "Box" },
                            { id: "disc", label: "Disc" },
                          ].map((b) => {
                            const active = blurType === b.id;
                            return (
                              <button
                                key={b.id}
                                onClick={() => setBlurType(b.id)}
                                className={`py-3 rounded-xl text-xs font-medium cursor-pointer transition-colors truncate px-1 ${
                                  active
                                    ? "bg-blue-600 text-white"
                                    : "bg-surface text-gray-700 border border-gray-200 hover:border-blue-400"
                                }`}
                              >
                                {b.label}
                              </button>
                            );
                          })}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Amount</p>
                          <Slider
                            label="Amount"
                            value={blurAmount}
                            min={0}
                            max={40}
                            onChange={setBlurAmount}
                            unit="px"
                            hideLabel
                          />
                        </div>
                      </div>
                    )}
                    </div>
                    <div>
                      {sectionRow({
                        id: "filter",
                        Icon: Sparkles,
                        tint: "bg-amber-50 text-amber-500",
                        label: "Filter",
                        hasToggle: true,
                        enabled: toggles.filter,
                        onToggle: (val) => {
                          setToggles((p) => ({ ...p, filter: val }));
                          if (!val) setSelectedFilter("none");
                          else if (selectedFilter === "none")
                            setSelectedFilter("noir");
                        },
                      })}
                    {expandedPanel === "filter" && toggles.filter && (
                      <div className="px-3 pb-3 bg-gray-100">
                        <div className="grid grid-cols-3 gap-1.5 pt-2">
                          {FILTERS.map((f) => {
                            const active = selectedFilter === f.id;
                            return (
                              <button
                                key={f.id}
                                onClick={() => setSelectedFilter(f.id)}
                                className={`py-3 rounded-xl text-xs font-medium cursor-pointer transition-colors truncate px-1 ${
                                  active
                                    ? "bg-blue-600 text-white"
                                    : "bg-surface text-gray-700 border border-gray-200 hover:border-blue-400"
                                }`}
                              >
                                {f.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    </div>
                    <div>
                      {sectionRow({
                        id: "texture",
                        Icon: Grid2x2,
                        tint: "bg-emerald-50 text-emerald-500",
                        label: "Texture",
                        hasToggle: true,
                        enabled: toggles.texture,
                        onToggle: (val) =>
                          setToggles((p) => ({ ...p, texture: val })),
                      })}
                    {expandedPanel === "texture" && toggles.texture && (
                      <div className="px-3 pb-3 bg-gray-100 space-y-3">
                        {/* Sub-tool grid (Posterize / Line / Color) */}
                        <div className="grid grid-cols-3 gap-1.5 pt-2">
                          {[
                            { id: "posterize", label: "Posterize" },
                            { id: "line", label: "Line" },
                            { id: "color", label: "Color" },
                          ].map((tx) => {
                            const active = textureType === tx.id;
                            return (
                              <button
                                key={tx.id}
                                onClick={() => {
                                  setTextureType(tx.id);
                                  setTextureAmount(TEXTURE_DEFAULTS[tx.id]);
                                }}
                                className={`py-3 rounded-xl text-xs font-medium cursor-pointer transition-colors truncate px-1 ${
                                  active
                                    ? "bg-blue-600 text-white"
                                    : "bg-surface text-gray-700 border border-gray-200 hover:border-blue-400"
                                }`}
                              >
                                {tx.label}
                              </button>
                            );
                          })}
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 mb-1 capitalize">
                            {textureType}
                          </p>
                          <Slider
                            label={textureType}
                            value={textureAmount}
                            min={textureType === "posterize" ? 2 : 1}
                            max={textureType === "posterize" ? 24 : 100}
                            onChange={setTextureAmount}
                            hideLabel
                          />
                        </div>
                      </div>
                    )}
                    </div>
                  </div>

                  {/* Arrange */}
                  <div className="rounded-2xl border border-gray-200 overflow-hidden grid grid-cols-3 divide-x divide-gray-100">
                    {[
                      { id: "front", label: "Front", icon: "⬆" },
                      { id: "back", label: "Back", icon: "⬇" },
                      { id: "dup", label: "Duplicate", icon: "❑" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          if (!selectedLayerId) {
                            toast.info("Select an inserted element first.");
                            return;
                          }
                          if (t.id === "front")
                            reorderLayer(selectedLayerId, "front");
                          else if (t.id === "back")
                            reorderLayer(selectedLayerId, "back");
                          else duplicateLayer(selectedLayerId);
                        }}
                        className="flex flex-col items-center gap-1 py-3 hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <span className="text-sm">{t.icon}</span>
                        <span className="text-xs text-gray-500">{t.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Delete */}
                  <button
                    onClick={onDeleteActive}
                    disabled={!hasActiveImage}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
                  </>
                )}
                  </>
                );
}
