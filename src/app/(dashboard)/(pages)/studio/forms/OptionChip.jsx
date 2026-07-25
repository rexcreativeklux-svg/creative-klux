"use client";
// forms/OptionChip.jsx

/**
 * OptionChip — compact single-select chip for studio form option lists.
 *
 * Use it instead of a full-width card grid when a field has many short choices
 * (packaging types, fold types, …). The chip only takes the width its content
 * needs, so a long list stays on one or two tidy rows instead of stretching
 * across the whole studio pane.
 *
 * The option's longer description is best passed as `title` (native tooltip)
 * and/or surfaced once on the field's label row, so the chips stay small.
 *
 * @param {React.ComponentType} [icon]   Lucide icon component, rendered in the leading badge.
 * @param {React.ReactNode}     [glyph]  Custom node (e.g. inline SVG) instead of `icon`.
 * @param {string}              label    Chip text.
 * @param {string}              [title]  Native tooltip — usually the option description.
 * @param {boolean}             active   Selected state.
 * @param {() => void}          onClick  Select handler.
 * @param {object}              [theme]  Form theme class map: { border, bg, bgLight, textDark }.
 */
const VIOLET_THEME = {
  border:   "border-violet-600",
  bg:       "bg-violet-600",
  bgLight:  "bg-violet-50",
  textDark: "text-violet-700",
};

const OptionChip = ({ icon: Icon, glyph, label, title, active, onClick, theme }) => {
  const t     = { ...VIOLET_THEME, ...(theme || {}) };
  const badge = glyph || (Icon ? <Icon className="w-3.5 h-3.5" /> : null);

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.03] ${
        active ? `${t.border} ${t.bgLight}` : "border-gray-100 bg-gray-50 hover:border-gray-300"
      }`}
    >
      {badge && (
        <span
          className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center transition-colors ${
            active ? `${t.bg} text-white` : "bg-surface border border-gray-200 text-gray-400"
          }`}
        >
          {badge}
        </span>
      )}
      <span className={`text-xs font-semibold ${active ? t.textDark : "text-gray-600"}`}>{label}</span>
    </button>
  );
};

export default OptionChip;
