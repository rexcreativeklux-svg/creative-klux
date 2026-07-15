"use client";

/**
 * SizeDropdown — the aspect-ratio picker (proportional swatches) shared by the
 * Product Studio modals. Defaults to the full SIZES set; the Video Generator
 * passes its reduced VIDEO_SIZES. The caller owns the open state + backdrop and
 * reacts to `onSelect`; pass `animated` for the OnDeviceToolModal variant.
 */

import { FloatingPanel } from "./FloatingPanels";
import { SIZES } from "./constants";

/**
 * @param {object} props
 * @param {React.RefObject} props.anchorRef Trigger to anchor beside.
 * @param {string} props.value Currently-selected size id (e.g. "square").
 * @param {(id: string) => void} props.onSelect Called with the chosen size id.
 * @param {Array} [props.sizes=SIZES] Size options to render.
 * @param {boolean} [props.animated=false]
 * @param {number} [props.width=380]
 */
export default function SizeDropdown({
  anchorRef,
  value,
  onSelect,
  sizes = SIZES,
  animated = false,
  width = 380,
}) {
  return (
    <FloatingPanel anchorRef={anchorRef} width={width} animated={animated}>
      <div className="grid grid-cols-3 gap-2.5 p-3">
        {sizes.map((s) => {
          const active = value === s.id;
          const maxDim = 64;
          const bw = s.w >= s.h ? maxDim : Math.round((maxDim * s.w) / s.h);
          const bh = s.h >= s.w ? maxDim : Math.round((maxDim * s.h) / s.w);
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-colors ${active ? "border-blue-500 bg-blue-50/40" : "border-gray-200 hover:border-gray-200"}`}
            >
              <div className="flex items-center justify-center h-20 relative w-full">
                <div
                  className={`rounded-md ${active ? "bg-blue-300" : "bg-gray-100"}`}
                  style={{ width: bw, height: bh }}
                />
                {active && (
                  <div className="absolute top-0 right-0 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-[8px]">✓</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-gray-500 text-center leading-tight">
                {s.name}
              </span>
            </button>
          );
        })}
      </div>
    </FloatingPanel>
  );
}
