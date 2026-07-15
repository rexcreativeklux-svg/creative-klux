import { useState } from "react";
import {
  Loader2,
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
} from "lucide-react";
import { Toggle, PosField } from "./editorShared";

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
}) {
  const [fontOpen, setFontOpen] = useState(false);
  const [fontQuery, setFontQuery] = useState("");
  const [seeAllStyles, setSeeAllStyles] = useState(false);
  const [spacingOpen, setSpacingOpen] = useState(false);
  const [curveOpen, setCurveOpen] = useState(false);
  const [openSection, setOpenSection] = useState(null);

  if (!selectedLayer) return null;
  const t = selectedLayer;
  const set = (patch) => updateLayer(selectedLayerId, patch);

  const fontList = (fonts || []).filter((f) =>
    f.toLowerCase().includes(fontQuery.trim().toLowerCase()),
  );

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
          <div className="flex items-center gap-0.5 border border-gray-200 rounded-xl p-1">
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

          {/* Auto/fixed width + wrap */}
          <div className="flex items-center gap-0.5 border border-gray-200 rounded-xl p-1">
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

          <span className="w-px h-6 bg-gray-200 shrink-0" />

          {/* Line/letter spacing */}
          <div className="relative ml-auto">
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
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center shrink-0 font-bold text-sm">
                A
              </span>
              <span className="text-sm text-gray-900 truncate">
                Text background
              </span>
            </div>
            <Toggle
              enabled={!!t.bgColor}
              onChange={(v) =>
                set({ bgColor: v ? t.bgColor || "#000000" : null })
              }
            />
          </div>
          {t.bgColor && (
            <div className="px-3 pb-3">
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

        {/* Position */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <button
            onClick={() =>
              setOpenSection((s) => (s === "position" ? null : "position"))
            }
            className="w-full flex items-center justify-between px-3 py-2.5 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                <Move className="w-4 h-4" />
              </span>
              <span className="text-sm text-gray-900">Position</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${openSection === "position" ? "rotate-180" : ""}`}
            />
          </button>
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
              </div>
            </div>
          )}
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
