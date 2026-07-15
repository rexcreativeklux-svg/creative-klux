import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  ChevronLeft,
  ChevronDown,
  Search,
  Plus,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  MoveHorizontal,
  WrapText,
  AlignVerticalSpaceAround,
  Spline,
  RotateCw,
  Move,
  Trash2,
  ChevronRight,
  FlipHorizontal,
  FlipVertical,
  SlidersHorizontal,
  Frame,
  Circle,
  Sparkles,
  Sun,
  Droplet,
  MoveVertical,
  Palette,
  Maximize2,
  Eye,
} from "lucide-react";
import { Toggle, PosField, Slider } from "./editorShared";

// Shadow sub-tools — same segmented grid as the image panel's Shadows.
const SHADOW_TOOLS = [
  { id: "ai", label: "AI Shadows", Icon: Sparkles },
  { id: "intensity", label: "Intensity", Icon: Sun },
  { id: "blur", label: "Blur", Icon: Droplet },
  { id: "shortness", label: "Shortness", Icon: MoveVertical },
  { id: "color", label: "Color", Icon: Palette },
  { id: "move", label: "Move", Icon: Move },
];

// Outline sub-tools — same segmented grid as the image panel's Outline.
const OUTLINE_TOOLS = [
  { id: "width", label: "Width", Icon: Maximize2 },
  { id: "color", label: "Color", Icon: Palette },
  { id: "blur", label: "Blur", Icon: Droplet },
];

// Reflection sub-tools — same segmented grid as the image panel's Reflection.
const REFLECTION_TOOLS = [
  { id: "opacity", label: "Opacity", Icon: Eye },
  { id: "move", label: "Move", Icon: Move },
  { id: "angle", label: "Angle", Icon: Spline },
];

// Shadow colour swatches (same palette as the image panel).
const SHADOW_SWATCHES = [
  "#000000",
  "#374151",
  "#1e3a8a",
  "#7c2d12",
  "#581c87",
  "#0f766e",
];

// AI Shadows presets → advanced params (0–100 each). null = None (no shadow).
const AI_PRESETS = {
  none: null,
  soft: { hardness: 20, intensity: 55, direction: 50, spread: 60, orientation: 30 },
  hard: { hardness: 85, intensity: 80, direction: 50, spread: 40, orientation: 70 },
  floating: { hardness: 40, intensity: 45, direction: 50, spread: 85, orientation: 95 },
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

// Default AI Shadows takeover state.
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

// Text colour swatches (Color section). `transparent` clears the fill.
const TEXT_COLORS = [
  "transparent",
  "#000000",
  "#ffffff",
  "#ef4444",
  "#ec4899",
];

// Font weights offered in the Weight dropdown.
const WEIGHTS = [
  { v: "400", label: "Regular" },
  { v: "500", label: "Medium" },
  { v: "600", label: "Semibold" },
  { v: "700", label: "Bold" },
  { v: "800", label: "Extrabold" },
  { v: "900", label: "Black" },
];

// ── TextPanel ─────────────────────────────────────────────────────────────
// The right-side editing panel for a selected text layer — the text analogue of
// ImagePanel. Reads/writes the layer through updateLayer(selectedLayerId, …).
// Sections here are the first pass (Style / Font / Weight+Size / Align / Color);
// text-background, shadows, curvature, etc. come next.
export default function TextPanel({
  selectedLayer,
  selectedLayerId,
  updateLayer,
  handleSave,
  saving,
  fonts,
  loadWebFont,
  textStyles,
  applyTextStyle,
  canvasSize,
  reorderLayer,
  duplicateLayer,
  deleteLayer,
  moveTextShadow,
  setMoveTextShadow,
  moveTextReflection,
  setMoveTextReflection,
}) {
  const [fontOpen, setFontOpen] = useState(false);
  const [fontQuery, setFontQuery] = useState("");
  const [seeAllStyles, setSeeAllStyles] = useState(false);
  const [spacingOpen, setSpacingOpen] = useState(false);
  const [curveOpen, setCurveOpen] = useState(false);
  const [openSection, setOpenSection] = useState(null);
  const [shadowTool, setShadowTool] = useState("intensity");
  const [outlineTool, setOutlineTool] = useState("width");
  const [reflectionTool, setReflectionTool] = useState("opacity");
  const [aiSh, setAiSh] = useState(AI_SHADOWS_INIT);
  const genTimerRef = useRef(null);

  if (!selectedLayer) return null;
  const t = selectedLayer;
  const set = (patch) => updateLayer(selectedLayerId, patch);

  // A grouped-card section header: coloured icon + label, an optional toggle,
  // and the › chevron. Mirrors ImagePanel's sectionRow. Clicking the row (or the
  // chevron) expands it; the chevron also switches the effect ON for toggleable
  // sections. Closing never turns the effect off.
  const sectionRow = ({
    id,
    Icon,
    tint,
    label,
    hasToggle,
    enabled,
    onToggle,
  }) => (
    <div className="flex items-center justify-between px-3 py-2.5">
      <button
        type="button"
        onClick={() => setOpenSection((s) => (s === id ? null : id))}
        className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
      >
        <span
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tint}`}
        >
          <Icon className="w-4 h-4" />
        </span>
        <span className="text-sm text-gray-900 truncate">{label}</span>
      </button>
      <div className="flex items-center gap-1.5 shrink-0">
        {hasToggle && <Toggle enabled={enabled} onChange={onToggle} />}
        <button
          type="button"
          onClick={() => {
            if (openSection === id) {
              setOpenSection(null);
            } else {
              if (hasToggle && !enabled) onToggle(true);
              setOpenSection(id);
            }
          }}
          className="p-0.5 cursor-pointer"
          aria-label={openSection === id ? `Close ${label}` : `Open ${label}`}
        >
          <ChevronRight
            className={`w-4 h-4 text-gray-400 transition-transform ${openSection === id ? "rotate-90" : ""}`}
          />
        </button>
      </div>
    </div>
  );

  // Label-on-top slider + boxed number input (mirrors ImagePanel's numSlider).
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

  // ── AI Shadows takeover (text) — local render, no backend. Maps the 0–100
  // params onto the text-shadow fields the render reads (mirrors the image panel).
  const setAiField = (k, v) => setAiSh((s) => ({ ...s, [k]: v }));
  const setAiOn = (k, v) =>
    setAiSh((s) => ({ ...s, on: { ...s.on, [k]: v } }));
  const applyParamsToTextShadow = (params) => {
    if (!params) return;
    const { hardness, intensity, direction, spread, orientation } = params;
    const dist = 8 + (spread / 100) * 34;
    let dx = 0;
    let dy = orientation >= 50 ? 14 : 6;
    const seg = direction / 100;
    if (seg < 0.25) dy = -dist;
    else if (seg < 0.5) dx = -dist;
    else if (seg < 0.75) dy = dist;
    else dx = dist;
    set({
      shadowOn: true,
      shadowBlur: Math.round(2 + ((100 - hardness) / 100) * 30),
      shadowOpacity: Math.round(intensity),
      shadowShortness: Math.round(100 - spread),
      shadowColor: t.shadowColor || "#000000",
      shadowX: Math.round(dx),
      shadowY: Math.round(dy),
    });
  };
  const runGenerate = (params, presetId) => {
    if (genTimerRef.current) clearTimeout(genTimerRef.current);
    if (presetId === "none" || params === null) {
      set({ shadowOn: false });
      setAiSh((s) => ({ ...s, preset: "none", generating: false }));
      return;
    }
    setAiSh((s) => ({
      ...s,
      generating: true,
      preset: presetId ?? s.preset,
    }));
    genTimerRef.current = setTimeout(() => {
      applyParamsToTextShadow(params);
      setAiSh((s) => ({ ...s, generating: false }));
      toast.success("AI shadow applied");
    }, 1000);
  };
  const cancelGenerate = () => {
    if (genTimerRef.current) clearTimeout(genTimerRef.current);
    setAiSh((s) => ({ ...s, generating: false }));
  };
  // A labelled range row for the Advanced tab (with an enable toggle).
  const aiRow = ({ label, k, leftLabel, rightLabel, midLabels }) => (
    <div className="pt-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">{label}</span>
        <Toggle enabled={aiSh.on[k]} onChange={(v) => setAiOn(k, v)} />
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
            onChange={(e) => setAiField(k, Number(e.target.value))}
            className="w-full h-1.5 accent-blue-600"
          />
        </>
      )}
    </div>
  );

  const fontList = (fonts || []).filter((f) =>
    f.toLowerCase().includes(fontQuery.trim().toLowerCase()),
  );

  // ── AI Shadows takeover — replaces the whole panel (mirrors the image panel).
  if (aiSh.open) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setAiSh((s) => ({ ...s, open: false }))}
            className="p-1 -ml-1 hover:bg-gray-100 rounded-lg cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">AI Shadows</h2>
        </div>

        {/* Presets / Advanced tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl mb-4">
          {["presets", "advanced"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setAiField("tab", tab)}
              className={`py-2 rounded-lg text-sm font-medium capitalize cursor-pointer transition-colors ${
                aiSh.tab === tab
                  ? "bg-surface shadow text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {aiSh.tab === "presets" ? (
          <div className="grid grid-cols-3 gap-3">
            {AI_PRESET_LIST.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => runGenerate(AI_PRESETS[p.id], p.id)}
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
                <span className="text-xs text-gray-600">{p.label}</span>
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
              label: "Text orientation",
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
    );
  }

  // ── Move Text Shadow takeover — drag happens on the canvas (see PhotoEditor).
  if (moveTextShadow?.open) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMoveTextShadow({ open: false, mode: "2d" })}
            className="p-1 -ml-1 hover:bg-gray-100 rounded-lg cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Move Shadow</h2>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl mb-4">
          {[
            { id: "2d", label: "2D" },
            { id: "3d", label: "3D" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setMoveTextShadow((s) => ({ ...s, mode: tab.id }))
              }
              className={`py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                moveTextShadow.mode === tab.id
                  ? "bg-surface shadow text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-500 text-center px-2">
          {moveTextShadow.mode === "3d"
            ? "Drag the shadow around for a perspective effect."
            : "Drag the shadow around and move it in two dimensions."}
        </p>
      </div>
    );
  }

  // ── Move Text Reflection takeover — drag happens on the canvas.
  if (moveTextReflection?.open) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMoveTextReflection({ open: false })}
            className="p-1 -ml-1 hover:bg-gray-100 rounded-lg cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Move Reflection</h2>
        </div>
        <p className="text-sm text-gray-500 text-center px-2">
          Drag to change the aspect of the reflection.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <span
          className="font-semibold text-sm text-gray-900 truncate"
          style={{ fontFamily: t.fontFamily }}
        >
          {t.fontFamily || "Text"}
        </span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-40 cursor-pointer"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Style presets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-900">Style</p>
            <button
              onClick={() => setSeeAllStyles((v) => !v)}
              className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              {seeAllStyles ? "Show less" : "See all"}
            </button>
          </div>
          <div
            className={
              seeAllStyles
                ? "grid grid-cols-3 gap-2"
                : "flex gap-2 overflow-x-auto pb-1"
            }
          >
            {(textStyles || []).map((s) => (
              <button
                key={s.id}
                onClick={() => applyTextStyle(s)}
                onMouseEnter={() => loadWebFont?.(s.fontFamily)}
                title={s.text}
                className="shrink-0 h-14 min-w-[92px] px-3 rounded-xl border border-gray-200 hover:border-blue-400 flex items-center justify-center overflow-hidden cursor-pointer"
                style={{ background: s.bgColor || "#f9fafb" }}
              >
                <span
                  className="truncate text-sm font-semibold"
                  style={{
                    fontFamily: s.fontFamily,
                    color: s.color,
                    fontWeight: s.fontWeight,
                  }}
                >
                  {s.text}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Font family (searchable) */}
        <div>
          <button
            onClick={() => setFontOpen((o) => !o)}
            className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 hover:border-blue-400 cursor-pointer"
          >
            <span className="truncate" style={{ fontFamily: t.fontFamily }}>
              {t.fontFamily || "Select font"}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${fontOpen ? "rotate-180" : ""}`}
            />
          </button>
          {fontOpen && (
            <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  value={fontQuery}
                  onChange={(e) => setFontQuery(e.target.value)}
                  placeholder="Search fonts…"
                  className="w-full text-sm outline-none bg-transparent text-gray-800"
                />
              </div>
              <div className="max-h-60 overflow-y-auto">
                {fontList.length === 0 ? (
                  <p className="text-xs text-gray-400 px-3 py-3">No fonts</p>
                ) : (
                  fontList.map((f) => (
                    <button
                      key={f}
                      onMouseEnter={() => loadWebFont?.(f)}
                      onClick={() => {
                        loadWebFont?.(f);
                        set({ fontFamily: f });
                        setFontOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-base hover:bg-gray-100 cursor-pointer ${t.fontFamily === f ? "text-blue-600" : "text-gray-800"}`}
                      style={{ fontFamily: f }}
                    >
                      {f}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Weight + Size */}
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <select
              value={t.fontWeight || "400"}
              onChange={(e) => set({ fontWeight: e.target.value })}
              className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-surface hover:border-blue-400 cursor-pointer outline-none focus:border-blue-400"
            >
              {WEIGHTS.map((w) => (
                <option key={w.v} value={w.v}>
                  {w.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() =>
                set({ fontSize: Math.max(1, Math.round(t.fontSize) - 1) })
              }
              className="px-3 py-2.5 text-gray-500 hover:bg-gray-100 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={Math.round(t.fontSize)}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (!Number.isNaN(n) && n > 0) set({ fontSize: n });
              }}
              className="w-full text-center text-sm text-gray-800 outline-none bg-transparent"
            />
            <button
              onClick={() => set({ fontSize: Math.round(t.fontSize) + 1 })}
              className="px-3 py-2.5 text-gray-500 hover:bg-gray-100 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Alignment · width/wrap · spacing · curvature */}
        <div className="flex items-center gap-2">
          {/* Alignment */}
          <div className="flex items-center gap-0.5">
            {[
              { id: "left", Icon: AlignLeft },
              { id: "center", Icon: AlignCenter },
              { id: "right", Icon: AlignRight },
            ].map(({ id, Icon }) => (
              <button
                key={id}
                onClick={() => set({ align: id })}
                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                  t.align === id
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <span className="w-px h-6 bg-gray-200 shrink-0 mx-1" />

          {/* Auto/fixed width + wrap — centered between alignment and curvature */}
          <div className="flex items-center gap-0.5 mx-auto">
            <button
              onClick={() => set({ autoWidth: !t.autoWidth })}
              title={t.autoWidth ? "Auto width" : "Fixed width"}
              className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                t.autoWidth
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <MoveHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={() => set({ wrap: t.wrap === false })}
              title="Wrap text"
              className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                t.wrap !== false
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <WrapText className="w-4 h-4" />
            </button>
          </div>

          <span className="w-px h-6 bg-gray-200 shrink-0 mx-1" />

          {/* Line/letter spacing */}
          <div className="relative">
            <button
              onClick={() => {
                setSpacingOpen((o) => !o);
                setCurveOpen(false);
              }}
              title="Spacing"
              className="p-1.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 cursor-pointer"
            >
              <AlignVerticalSpaceAround className="w-4 h-4" />
            </button>
            {spacingOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-surface border border-gray-200 rounded-xl shadow-lg p-3 z-20 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Line spacing</p>
                  <input
                    type="range"
                    min={0.8}
                    max={2.5}
                    step={0.05}
                    value={t.lineHeight ?? 1.15}
                    onChange={(e) =>
                      set({ lineHeight: Number(e.target.value) })
                    }
                    className="w-full h-1.5 accent-blue-600"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Letter spacing</p>
                  <input
                    type="range"
                    min={-5}
                    max={30}
                    value={t.letterSpacing ?? 0}
                    onChange={(e) =>
                      set({ letterSpacing: Number(e.target.value) })
                    }
                    className="w-full h-1.5 accent-blue-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Curvature */}
          <div className="relative">
            <button
              onClick={() => {
                setCurveOpen((o) => !o);
                setSpacingOpen(false);
              }}
              title="Curvature"
              className={`p-1.5 border rounded-xl cursor-pointer transition-colors ${
                t.curve
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Spline className="w-4 h-4" />
            </button>
            {curveOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-surface border border-gray-200 rounded-xl shadow-lg p-3 z-20">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">Text curvature</p>
                  <span className="text-xs text-gray-500">
                    {t.curve ?? 0}
                  </span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={t.curve ?? 0}
                  onChange={(e) => set({ curve: Number(e.target.value) })}
                  className="w-full h-1.5 accent-blue-600"
                />
              </div>
            )}
          </div>
        </div>

        {/* Color */}
        <div>
          <p className="text-xs text-gray-500 mb-1.5">Color</p>
          <div className="flex items-center gap-2 flex-wrap">
            {TEXT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => set({ color: c })}
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
                          (t.color || "").toLowerCase() === c
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
                  t.color && t.color !== "transparent" ? t.color : "#000000"
                }
                onChange={(e) => set({ color: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Text background — same swatches as Color, applied to the box */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5">
            <button
              onClick={() =>
                setOpenSection((s) => (s === "textbg" ? null : "textbg"))
              }
              className="flex items-center gap-3 flex-1 min-w-0 text-left cursor-pointer"
            >
              <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center shrink-0 font-bold text-sm">
                A
              </span>
              <span className="text-sm text-gray-900 truncate">
                Text background
              </span>
            </button>
            <div className="flex items-center gap-1.5 shrink-0">
              <Toggle
                enabled={!!t.bgColor}
                onChange={(v) =>
                  set({ bgColor: v ? t.bgColor || "#000000" : null })
                }
              />
              <button
                type="button"
                onClick={() => {
                  if (openSection === "textbg") {
                    setOpenSection(null);
                  } else {
                    if (!t.bgColor) set({ bgColor: "#000000" });
                    setOpenSection("textbg");
                  }
                }}
                className="p-0.5 cursor-pointer"
                aria-label="Open text background"
              >
                <ChevronRight
                  className={`w-4 h-4 text-gray-400 transition-transform ${openSection === "textbg" ? "rotate-90" : ""}`}
                />
              </button>
            </div>
          </div>
          {openSection === "textbg" && t.bgColor && (
            <div className="px-3 pb-3 bg-gray-50">
              <div className="flex items-center gap-2 flex-wrap">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() =>
                      set({ bgColor: c === "transparent" ? null : c })
                    }
                    title={c}
                    className="w-8 h-8 rounded-full border border-gray-300 cursor-pointer"
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
                              (t.bgColor || "").toLowerCase() === c
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
                    value={t.bgColor || "#000000"}
                    onChange={(e) => set({ bgColor: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Adjust · Transform · Position */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {/* Adjust */}
          <div>
            {sectionRow({
              id: "adjust",
              Icon: SlidersHorizontal,
              tint: "bg-blue-50 text-blue-500",
              label: "Adjust",
            })}
            {openSection === "adjust" && (
              <div className="px-3 pb-3 bg-gray-50 space-y-2">
                {numSlider({
                  label: "Brightness",
                  value: t.brightness ?? 0,
                  min: -100,
                  max: 100,
                  onChange: (v) => set({ brightness: v }),
                })}
                {numSlider({
                  label: "Contrast",
                  value: t.contrast ?? 0,
                  min: -100,
                  max: 100,
                  onChange: (v) => set({ contrast: v }),
                })}
                {numSlider({
                  label: "Saturation",
                  value: t.saturation ?? 0,
                  min: -100,
                  max: 100,
                  onChange: (v) => set({ saturation: v }),
                })}
                {numSlider({
                  label: "Highlights",
                  value: t.highlights ?? 0,
                  min: -100,
                  max: 100,
                  onChange: (v) => set({ highlights: v }),
                })}
                {numSlider({
                  label: "Shadows",
                  value: t.adjShadows ?? 0,
                  min: -100,
                  max: 100,
                  onChange: (v) => set({ adjShadows: v }),
                })}
                {numSlider({
                  label: "Sharpen",
                  value: t.sharpen ?? 0,
                  min: 0,
                  max: 100,
                  onChange: (v) => set({ sharpen: v }),
                })}
                {numSlider({
                  label: "Hue",
                  value: t.hue ?? 0,
                  min: -180,
                  max: 180,
                  onChange: (v) => set({ hue: v }),
                })}
                {numSlider({
                  label: "Warmth",
                  value: t.warmth ?? 0,
                  min: -100,
                  max: 100,
                  onChange: (v) => set({ warmth: v }),
                })}
                {numSlider({
                  label: "Blend",
                  value: t.blend ?? 0,
                  min: 0,
                  max: 100,
                  onChange: (v) => set({ blend: v }),
                })}
                {numSlider({
                  label: "Opacity",
                  value: t.opacity ?? 100,
                  min: 0,
                  max: 100,
                  onChange: (v) => set({ opacity: v }),
                })}
                <button
                  onClick={() =>
                    set({
                      brightness: 0,
                      contrast: 0,
                      saturation: 0,
                      highlights: 0,
                      adjShadows: 0,
                      sharpen: 0,
                      hue: 0,
                      warmth: 0,
                      blend: 0,
                      opacity: 100,
                    })
                  }
                  className="pt-1 text-xs text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  Reset adjustments
                </button>
              </div>
            )}
          </div>

          {/* Transform */}
          <div>
            {sectionRow({
              id: "transform",
              Icon: Frame,
              tint: "bg-blue-50 text-blue-500",
              label: "Transform",
            })}
            {openSection === "transform" && (
              <div className="px-3 pb-3 bg-gray-50 space-y-3">
                {numSlider({
                  label: "Tile",
                  value: t.tile ?? 1,
                  min: 1,
                  max: 8,
                  onChange: (v) => set({ tile: v }),
                })}
                {numSlider({
                  label: "Horizontal Perspective",
                  value: t.hPersp ?? 0,
                  min: -100,
                  max: 100,
                  onChange: (v) => set({ hPersp: v }),
                })}
                {numSlider({
                  label: "Vertical Perspective",
                  value: t.vPersp ?? 0,
                  min: -100,
                  max: 100,
                  onChange: (v) => set({ vPersp: v }),
                })}
              </div>
            )}
          </div>

          {/* Position */}
          <div>
            {sectionRow({
              id: "position",
              Icon: Move,
              tint: "bg-blue-50 text-blue-500",
              label: "Position",
            })}
          {openSection === "position" && (
            <div className="px-3 pb-3 bg-gray-50 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <PosField
                  label="X"
                  value={Math.round(t.x - canvasSize.w / 2)}
                  onChange={(v) => set({ x: canvasSize.w / 2 + v })}
                />
                <PosField
                  label="Y"
                  value={Math.round(t.y - canvasSize.h / 2)}
                  onChange={(v) => set({ y: canvasSize.h / 2 + v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <PosField
                  label="Width"
                  value={Math.round(t.w)}
                  min={10}
                  onChange={(v) => set({ w: Math.max(10, v) })}
                />
                <PosField
                  label="Height"
                  value={Math.round(t.h)}
                  min={10}
                  onChange={(v) => set({ h: Math.max(10, v) })}
                />
              </div>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <PosField
                    label="Angle"
                    value={Math.round(t.rotation || 0)}
                    onChange={(v) => set({ rotation: v })}
                    unit="°"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const n = Math.round(t.rotation || 0) + 90;
                      set({ rotation: n > 180 ? n - 360 : n });
                    }}
                    title="Rotate 90°"
                    className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg text-gray-600 hover:border-blue-400 cursor-pointer"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => set({ flipH: !t.flipH })}
                    title="Flip horizontal"
                    className={`w-10 h-10 flex items-center justify-center border rounded-lg cursor-pointer ${t.flipH ? "border-blue-500 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-600 hover:border-blue-400"}`}
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => set({ flipV: !t.flipV })}
                    title="Flip vertical"
                    className={`w-10 h-10 flex items-center justify-center border rounded-lg cursor-pointer ${t.flipV ? "border-blue-500 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-600 hover:border-blue-400"}`}
                  >
                    <FlipVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Shadows · Outline · Reflection */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {/* Shadows */}
          <div>
            {sectionRow({
              id: "shadows",
              Icon: Circle,
              tint: "bg-indigo-50 text-indigo-500",
              label: "Shadows",
              hasToggle: true,
              enabled: !!t.shadowOn,
              onToggle: (v) =>
                set(
                  v
                    ? {
                        shadowOn: true,
                        // Seed prominent defaults on first enable.
                        shadowOpacity: t.shadowOpacity ?? 70,
                        shadowBlur: t.shadowBlur ?? 6,
                        shadowShortness: t.shadowShortness ?? 45,
                        shadowColor: t.shadowColor ?? "#000000",
                      }
                    : { shadowOn: false },
                ),
            })}
            {openSection === "shadows" && t.shadowOn && (
              <div className="px-3 pb-3 bg-gray-50 space-y-3">
                {/* Sub-tool grid (same segmented control as the image panel) */}
                <div className="grid grid-cols-3 gap-1.5 pt-2">
                  {SHADOW_TOOLS.map((tool) => {
                    const active = shadowTool === tool.id;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => {
                          if (tool.id === "ai") {
                            setAiSh((s) => ({ ...s, open: true }));
                            return;
                          }
                          if (tool.id === "move") {
                            set({ shadowOn: true });
                            setMoveTextShadow({ open: true, mode: "2d" });
                            return;
                          }
                          setShadowTool(tool.id);
                        }}
                        className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                          active
                            ? "bg-blue-600 text-white"
                            : "bg-surface text-gray-700 border border-gray-200 hover:border-blue-400"
                        }`}
                      >
                        <tool.Icon className="w-4 h-4" />
                        {tool.label}
                      </button>
                    );
                  })}
                </div>

                {/* Active sub-tool control */}
                {shadowTool === "intensity" && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Intensity</p>
                    <Slider
                      label="Intensity"
                      value={t.shadowOpacity ?? 50}
                      min={0}
                      max={100}
                      onChange={(v) => set({ shadowOpacity: v })}
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
                      value={t.shadowBlur ?? 8}
                      min={0}
                      max={50}
                      onChange={(v) => set({ shadowBlur: v })}
                      unit="px"
                      hideLabel
                    />
                  </div>
                )}
                {shadowTool === "shortness" && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Shortness</p>
                    <Slider
                      label="Shortness"
                      value={t.shadowShortness ?? 50}
                      min={0}
                      max={100}
                      onChange={(v) => set({ shadowShortness: v })}
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
                          onClick={() => set({ shadowColor: c })}
                          title={c}
                          className="w-6 h-6 rounded-full border border-gray-300 cursor-pointer"
                          style={{
                            background: c,
                            outline:
                              (t.shadowColor || "#000000").toLowerCase() === c
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
                          value={t.shadowColor || "#000000"}
                          onChange={(e) => set({ shadowColor: e.target.value })}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Outline */}
          <div>
            {sectionRow({
              id: "outline",
              Icon: Circle,
              tint: "bg-fuchsia-50 text-fuchsia-500",
              label: "Outline",
              hasToggle: true,
              enabled: !!t.outlineOn,
              onToggle: (v) =>
                set(
                  v
                    ? {
                        outlineOn: true,
                        // Seed a clear outline on first enable.
                        outlineWidth: t.outlineWidth ?? 10,
                        outlineColor: t.outlineColor ?? "#000000",
                      }
                    : { outlineOn: false },
                ),
            })}
            {openSection === "outline" && t.outlineOn && (
              <div className="px-3 pb-3 bg-gray-50 space-y-3">
                {/* Sub-tool grid (Width / Color / Blur) */}
                <div className="grid grid-cols-3 gap-1.5 pt-2">
                  {OUTLINE_TOOLS.map((tool) => {
                    const active = outlineTool === tool.id;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => setOutlineTool(tool.id)}
                        className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                          active
                            ? "bg-blue-600 text-white"
                            : "bg-surface text-gray-700 border border-gray-200 hover:border-blue-400"
                        }`}
                      >
                        <tool.Icon className="w-4 h-4" />
                        {tool.label}
                      </button>
                    );
                  })}
                </div>

                {outlineTool === "width" && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Width</p>
                    <Slider
                      label="Width"
                      value={t.outlineWidth ?? 10}
                      min={1}
                      max={30}
                      onChange={(v) => set({ outlineWidth: v })}
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
                      value={t.outlineBlur ?? 0}
                      min={0}
                      max={30}
                      onChange={(v) => set({ outlineBlur: v })}
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
                          onClick={() => set({ outlineColor: c })}
                          title={c}
                          className="w-6 h-6 rounded-full border border-gray-300 cursor-pointer"
                          style={{
                            background: c,
                            outline:
                              (t.outlineColor || "#000000").toLowerCase() === c
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
                          value={t.outlineColor || "#000000"}
                          onChange={(e) => set({ outlineColor: e.target.value })}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reflection */}
          <div>
            {sectionRow({
              id: "reflection",
              Icon: FlipVertical,
              tint: "bg-sky-50 text-sky-500",
              label: "Reflection",
              hasToggle: true,
              enabled: !!t.reflectionOn,
              onToggle: (v) =>
                set(
                  v
                    ? {
                        reflectionOn: true,
                        reflectionOpacity: t.reflectionOpacity ?? 80,
                      }
                    : { reflectionOn: false },
                ),
            })}
            {openSection === "reflection" && t.reflectionOn && (
              <div className="px-3 pb-3 bg-gray-50 space-y-3">
                {/* Sub-tool grid (Opacity / Move / Angle) */}
                <div className="grid grid-cols-3 gap-1.5 pt-2">
                  {REFLECTION_TOOLS.map((tool) => {
                    const active = reflectionTool === tool.id;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => {
                          if (tool.id === "move") {
                            set({ reflectionOn: true });
                            setMoveTextReflection({ open: true });
                            return;
                          }
                          setReflectionTool(tool.id);
                        }}
                        className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                          active
                            ? "bg-blue-600 text-white"
                            : "bg-surface text-gray-700 border border-gray-200 hover:border-blue-400"
                        }`}
                      >
                        <tool.Icon className="w-4 h-4" />
                        {tool.label}
                      </button>
                    );
                  })}
                </div>

                {reflectionTool === "opacity" && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Opacity</p>
                    <Slider
                      label="Opacity"
                      value={t.reflectionOpacity ?? 80}
                      min={0}
                      max={100}
                      onChange={(v) => set({ reflectionOpacity: v })}
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
                      value={t.reflectionAngle ?? 0}
                      min={-45}
                      max={45}
                      onChange={(v) => set({ reflectionAngle: v })}
                      unit="°"
                      hideLabel
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Align to canvas */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Align to canvas</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => set({ x: canvasSize.w / 2 })}
              className="flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg hover:border-blue-400 text-xs text-gray-600 cursor-pointer"
            >
              <AlignCenter className="w-3.5 h-3.5" /> Center
            </button>
            <button
              onClick={() => set({ y: canvasSize.h / 2 })}
              className="flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg hover:border-blue-400 text-xs text-gray-600 cursor-pointer"
            >
              <AlignVerticalJustifyCenter className="w-3.5 h-3.5" /> Middle
            </button>
          </div>
        </div>

        {/* Arrange */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden grid grid-cols-3 divide-x divide-gray-100">
          {[
            { id: "front", label: "Front", icon: "⬆" },
            { id: "back", label: "Back", icon: "⬇" },
            { id: "dup", label: "Duplicate", icon: "❑" },
          ].map((a) => (
            <button
              key={a.id}
              onClick={() => {
                if (a.id === "front") reorderLayer(selectedLayerId, "front");
                else if (a.id === "back") reorderLayer(selectedLayerId, "back");
                else duplicateLayer(selectedLayerId);
              }}
              className="flex flex-col items-center gap-1 py-3 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <span className="text-sm">{a.icon}</span>
              <span className="text-xs text-gray-500">{a.label}</span>
            </button>
          ))}
        </div>

        {/* Delete */}
        <button
          onClick={() => deleteLayer(selectedLayerId)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" /> Delete
        </button>
      </div>
    </div>
  );
}
