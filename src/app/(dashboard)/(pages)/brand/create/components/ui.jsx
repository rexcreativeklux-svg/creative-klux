"use client";

/**
 * Presentational primitives shared across the brand-create steps:
 *  - `inputCls`      : the shared input/select/textarea style token
 *  - `Field`         : a labelled wrapper (with optional required marker)
 *  - `ColorPicker`   : swatch + hex input bound to a single value
 *  - `StepIndicator` : the numbered progress rail above the form card
 */

import { Check } from "lucide-react";

export const inputCls =
  "w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 " +
  "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 " +
  "focus:border-transparent focus:bg-surface transition-all";

export const Field = ({ label, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

export const ColorPicker = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
      {label}
    </label>

    <div className="flex items-center gap-2 w-full">
      {/* color box */}
      <label
        className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer overflow-hidden shadow-sm shrink-0"
        style={{ background: value }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="opacity-0 w-full h-full cursor-pointer"
        />
      </label>

      {/* hex input */}
      <input
        type="text"
        value={value}
        maxLength={7}
        onChange={(e) =>
          /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange(e.target.value)
        }
        className={`${inputCls} font-mono text-xs w-full min-w-0`}
      />
    </div>
  </div>
);

/**
 * Numbered progress rail. `steps` is the shared STEPS config; `current` is the
 * active step id. Completed steps show a check, the active one is highlighted.
 */
export const StepIndicator = ({ steps, current }) => (
  <div className="py-2">
    <div className="flex items-center gap-0">
      {steps.map((s, idx) => (
        <div key={s.id} className="flex items-center gap-0 flex-1 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                current > s.id
                  ? "border-blue-600 bg-blue-600 text-white"
                  : current === s.id
                    ? "border-blue-600 text-blue-600 bg-surface"
                    : "border-gray-200 text-gray-300 bg-surface"
              }`}
            >
              {current > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
            </div>
            <span
              className={`text-xs font-medium hidden sm:block truncate ${
                current >= s.id ? "text-gray-700" : "text-gray-300"
              }`}
            >
              {s.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`h-0.5 flex-1 mx-2 rounded-full ${
                current > s.id ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  </div>
);
