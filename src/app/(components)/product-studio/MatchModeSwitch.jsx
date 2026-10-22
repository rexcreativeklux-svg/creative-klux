import { MATCH_MODE_ENUM } from "@/(lib)/product-studio-api";

const OPTIONS = [
  { id: MATCH_MODE_ENUM.exact, label: "Exact" },
  { id: MATCH_MODE_ENUM.similar, label: "Similar" },
];

/**
 * Exact / Similar segmented switch that sits above the Quality row. Styled as
 * the same light gray card as the other option rows.
 *
 * @param {object} props
 * @param {"exact"|"similar"} props.value
 * @param {(id: "exact"|"similar") => void} props.onChange
 */
export default function MatchModeSwitch({ value, onChange }) {
  return (
    <div className="w-full flex p-1 rounded-2xl bg-gray-100 text-sm">
      {OPTIONS.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={active}
            className={`flex-1 py-2.5 rounded-xl font-medium transition-colors cursor-pointer ${active ? "bg-surface text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
