// Shared UI primitives + data used by both PhotoEditor and ImagePanel.
// Extracted here so ImagePanel can be its own component without a circular
// import back into PhotoEditor.

export function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange(!enabled);
      }}
      className={`relative w-10 h-5 rounded-full transition-all shrink-0 ${enabled ? "bg-blue-600" : "bg-gray-100"}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-surface rounded-full shadow transition-all ${enabled ? "left-5" : "left-0.5"}`}
      />
    </button>
  );
}

export function PosField({ label, value, onChange, unit = "", min }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-gray-500">{label}</span>
      <div className="flex items-center bg-surface border border-gray-200 rounded-lg px-2 focus-within:border-blue-400">
        <input
          type="number"
          value={value}
          min={min}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) onChange(n);
          }}
          className="w-full py-1.5 text-sm text-gray-800 bg-transparent outline-none"
        />
        {unit && <span className="text-xs text-gray-400 pl-1">{unit}</span>}
      </div>
    </label>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  onChange,
  unit = "",
  hideLabel = false,
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      {!hideLabel && (
        <span className="text-xs text-gray-500 w-24 shrink-0">{label}</span>
      )}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 accent-blue-600"
      />
      <span className="text-xs text-gray-500 w-8 text-right">
        {value}
        {unit}
      </span>
    </div>
  );
}

// Photo filter presets. The `css` doubles as the live preview filter and the
// export filter (see filterCss in PhotoEditor).
export const FILTERS = [
  { id: "none", label: "None", css: "" },
  {
    id: "noir",
    label: "Noir",
    css: "grayscale(1) contrast(1.45) brightness(0.92)",
  },
  {
    id: "fade",
    label: "Fade",
    css: "contrast(0.85) brightness(1.12) saturate(0.82) sepia(0.12)",
  },
  { id: "mono", label: "Mono", css: "grayscale(1) contrast(1.1)" },
  {
    id: "process",
    label: "Process",
    css: "contrast(1.2) saturate(1.55) hue-rotate(-12deg)",
  },
  {
    id: "tonal",
    label: "Tonal",
    css: "grayscale(1) contrast(1.22) brightness(1.05)",
  },
  {
    id: "chrome",
    label: "Chrome",
    css: "saturate(1.5) contrast(1.18) brightness(1.05)",
  },
  {
    id: "sepia",
    label: "Sepia",
    css: "sepia(0.78) contrast(1.05) brightness(1.02)",
  },
];
