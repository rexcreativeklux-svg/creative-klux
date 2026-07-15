"use client";

/**
 * QualityDropdown — the rich Quality picker (Premium / Advanced / Standard cards
 * with feature bullets) shared by the AI Product Studio modals. The caller owns
 * the open state + outside-click backdrop and reacts to `onSelect`; pass
 * `animated` for the framer-motion variant used by OnDeviceToolModal.
 */

import { FloatingPanel } from "./FloatingPanels";
import { QUALITY_TIERS } from "./constants";

/**
 * @param {object} props
 * @param {React.RefObject} props.anchorRef Trigger to anchor beside.
 * @param {string} props.value Currently-selected quality id (e.g. "High").
 * @param {(id: string) => void} props.onSelect Called with the chosen quality id.
 * @param {boolean} [props.animated=false]
 * @param {number} [props.width=380]
 */
export default function QualityDropdown({
  anchorRef,
  value,
  onSelect,
  animated = false,
  width = 380,
}) {
  return (
    <FloatingPanel anchorRef={anchorRef} width={width} animated={animated}>
      <div className="p-2 space-y-2">
        {QUALITY_TIERS.map((t) => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`w-full flex items-stretch gap-3 p-2.5 rounded-2xl border-2 text-left transition-colors ${active ? "border-blue-500 bg-blue-50/40" : "border-gray-200 hover:border-gray-200 bg-surface"}`}
            >
              <div className="w-20 h-28 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                <img
                  src={t.img}
                  alt={t.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-900">{t.name}</span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${t.tagColor}`}
                    >
                      {t.tag}
                    </span>
                  </div>
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${active ? "bg-blue-600" : "border-2 border-gray-200"}`}
                  >
                    {active && <span className="text-white text-[10px]">✓</span>}
                  </span>
                </div>
                <ul className="mt-1.5 space-y-0.5">
                  {t.features.map((f) => (
                    <li
                      key={f}
                      className="text-[11px] text-gray-500 leading-snug"
                    >
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </button>
          );
        })}
      </div>
    </FloatingPanel>
  );
}
