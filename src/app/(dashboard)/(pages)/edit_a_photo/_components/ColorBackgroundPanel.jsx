import { Layers, ImageIcon, Trash2, Pipette } from "lucide-react";

// Dedicated "Color Background" panel (opened from the Transparent Background
// panel's "Add a solid color"). Mirrors Photoroom: the three background actions
// up top, then Standard swatches, brand-kit palettes, and curated tones.
// Presentational — the parent owns canvasBg and the action handlers.

const gradientCss = (g) => `linear-gradient(135deg, ${g.from}, ${g.to})`;

const GRADIENTS = [
  { from: "#f093fb", to: "#f5576c" },
  { from: "#4facfe", to: "#00f2fe" },
  { from: "#43e97b", to: "#38f9d7" },
  { from: "#fa709a", to: "#fee140" },
  { from: "#a18cd1", to: "#fbc2eb" },
  { from: "#0f2027", to: "#2c5364" },
];

const NEUTRAL_TONES = [
  "#f4f1ea", "#e7ded0", "#cdbfae", "#e9e7e2", "#dfe2dc", "#c2c8bf",
  "#fbfbf9", "#dfe3e6", "#c4ccd2", "#aab4bd", "#8b97a1", "#6b7780",
];

const SOFT_PASTELS = [
  "#fdf6e3", "#eaf3e0", "#e0ecf4", "#efe6f6", "#fbe7ea", "#f7e8da",
  "#f3ead8", "#e2efe0", "#dfeaf2", "#e8e0f0", "#f0dde0", "#f5e5d2",
];

const VIBRANT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#111827", "#ffffff",
];

const CHECKER = {
  background:
    "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
  backgroundSize: "10px 10px",
  backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0",
  backgroundColor: "#f0f0f0",
};

export default function ColorBackgroundPanel({
  canvasBg,
  onApply,
  palettes = [],
  removeBg,
  canRemoveBg,
  onRemoveBg,
  onAiBg,
  onImageBg,
  onInspiration,
  onSave,
}) {
  const isColor = (c) => canvasBg.type === "color" && canvasBg.value === c;

  // Circular color swatch used across Standard / brand kit / tones.
  const swatch = (c) => (
    <button
      key={c}
      onClick={() => onApply({ type: "color", value: c })}
      title={c}
      className={`w-10 h-10 rounded-full border cursor-pointer shrink-0 ${
        isColor(c) ? "ring-2 ring-blue-500 ring-offset-1" : "border-gray-200"
      }`}
      style={{ background: c }}
    />
  );

  const pickEyedropper = async () => {
    if (typeof window === "undefined" || !window.EyeDropper) return;
    try {
      const result = await new window.EyeDropper().open();
      if (result?.sRGBHex) onApply({ type: "color", value: result.sRGBHex });
    } catch {
      /* user dismissed */
    }
  };

  const currentSwatchStyle =
    canvasBg.type === "color"
      ? { background: canvasBg.value }
      : canvasBg.type === "gradient"
        ? { background: gradientCss(canvasBg) }
        : canvasBg.type === "image"
          ? { backgroundImage: `url(${canvasBg.src})`, backgroundSize: "cover" }
          : CHECKER;

  return (
    <div className="flex flex-col max-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-9 h-9 rounded-lg border border-gray-200 shrink-0"
            style={currentSwatchStyle}
          />
          <h3 className="font-semibold text-lg text-gray-900 truncate">
            Color Background
          </h3>
        </div>
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer shrink-0"
        >
          <Layers className="w-4 h-4" /> Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-5">
        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onAiBg}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-blue-50 text-blue-700 font-medium hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <Layers className="w-5 h-5 shrink-0" /> Add an AI background
          </button>
          <button
            onClick={onImageBg}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:border-blue-400 transition-colors cursor-pointer"
          >
            <ImageIcon className="w-5 h-5 shrink-0" /> Add image as background
          </button>
          <button
            onClick={onRemoveBg}
            disabled={!canRemoveBg}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:border-blue-400 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-5 h-5 shrink-0" />{" "}
            {removeBg ? "Background removed" : "Remove background"}
          </button>
          <button
            onClick={onInspiration}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:border-blue-400 transition-colors cursor-pointer"
          >
            <Layers className="w-5 h-5 shrink-0" /> Use this background as
            inspiration
          </button>
        </div>

        {/* Standard */}
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-2">Standard</p>
          <div className="flex flex-wrap gap-2">
            {/* Transparent */}
            <button
              onClick={() => onApply({ type: "none" })}
              title="Transparent"
              className={`w-10 h-10 rounded-full border cursor-pointer shrink-0 ${
                canvasBg.type === "none"
                  ? "ring-2 ring-blue-500 ring-offset-1"
                  : "border-gray-200"
              }`}
              style={CHECKER}
            />
            {swatch("#ffffff")}
            {swatch("#000000")}
            {/* Custom color picker */}
            <label
              className="relative w-10 h-10 rounded-full border border-gray-200 overflow-hidden cursor-pointer shrink-0"
              title="Custom color"
              style={{
                background:
                  "conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)",
              }}
            >
              <input
                type="color"
                className="absolute inset-0 opacity-0 cursor-pointer"
                value={canvasBg.type === "color" ? canvasBg.value : "#ffffff"}
                onChange={(e) =>
                  onApply({ type: "color", value: e.target.value })
                }
              />
            </label>
            {/* Eyedropper */}
            {typeof window !== "undefined" && window.EyeDropper && (
              <button
                onClick={pickEyedropper}
                title="Pick a color"
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-blue-400 cursor-pointer shrink-0"
              >
                <Pipette className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Brand kit palettes */}
        {palettes
          .filter((p) => p.colors?.length)
          .map((p) => (
            <div key={p.id}>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {p.name}
                </p>
                <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full shrink-0">
                  Brand kit
                </span>
              </div>
              <div className="flex flex-wrap gap-2">{p.colors.map(swatch)}</div>
            </div>
          ))}

        {/* Neutral tones */}
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-2">
            Neutral tones
          </p>
          <div className="flex flex-wrap gap-2">
            {NEUTRAL_TONES.map(swatch)}
          </div>
        </div>

        {/* Soft pastels */}
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-2">
            Soft pastels
          </p>
          <div className="flex flex-wrap gap-2">
            {SOFT_PASTELS.map(swatch)}
          </div>
        </div>

        {/* Vibrant */}
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-2">Vibrant</p>
          <div className="flex flex-wrap gap-2">
            {VIBRANT_COLORS.map(swatch)}
          </div>
        </div>

        {/* Gradients */}
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-2">Gradients</p>
          <div className="grid grid-cols-3 gap-2">
            {GRADIENTS.map((g, i) => (
              <button
                key={i}
                onClick={() =>
                  onApply({ type: "gradient", from: g.from, to: g.to })
                }
                className={`aspect-video rounded-lg border cursor-pointer ${
                  canvasBg.type === "gradient" && canvasBg.from === g.from
                    ? "ring-2 ring-blue-500"
                    : "border-gray-200"
                }`}
                style={{ background: gradientCss(g) }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
