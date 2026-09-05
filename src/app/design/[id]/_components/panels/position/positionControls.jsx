"use client";

import React from "react";
import { handleNumberKey, parseNumber } from "@/(lib)/design/numberInput";

/**
 * positionControls — the pieces the Arrange and Layers tabs are built from.
 *
 * Colocated with the Position panel the same way imageEditControls is with the
 * image sections: these exist so the two tabs read as one panel, not as
 * general-purpose UI. Nothing outside this folder should import them.
 */

/** The tab strip at the top of the panel. Props: { tabs, value, onChange } */
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex shrink-0 border-b border-gray-100 px-2">
      {tabs.map((tab) => {
        const on = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange?.(tab.id)}
            className={`relative flex-1 px-3 py-2.5 text-xs font-semibold transition cursor-pointer ${
              on ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
            {on && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-blue-600" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A filter sitting on a tinted track — the All / Overlapping switch.
 *
 * Deliberately not the same control as Tabs: this narrows a list, it doesn't
 * change the view, and the two look different so it is obvious which of them
 * you are undoing when the list changes under you.
 *
 * Props: { options: [{ id, label, disabled?, title? }], value, onChange }
 */
export function Segmented({ options, value, onChange }) {
  return (
    <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          disabled={option.disabled}
          title={option.title}
          onClick={() => onChange(option.id)}
          className={`flex-1 rounded-md px-3 py-1.5 text-[11px] font-semibold transition cursor-pointer
            disabled:cursor-not-allowed disabled:opacity-40 ${
              value === option.id
                ? "bg-surface text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * One of the Arrange grid's buttons.
 *
 * `disabled` is load-bearing rather than cosmetic: an element already at the
 * front cannot be brought forward, and a button that looks alive but moves
 * nothing is indistinguishable from a broken one.
 */
export function ActionTile({ icon: Icon, label, disabled, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      className="h-9 flex items-center gap-2 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-700
                 transition cursor-pointer hover:border-blue-400 hover:bg-blue-50/40
                 disabled:cursor-not-allowed disabled:opacity-40
                 disabled:hover:border-gray-200 disabled:hover:bg-transparent"
    >
      {Icon && <Icon className="w-4 h-4 shrink-0 text-gray-500" />}
      {label}
    </button>
  );
}

/** An icon-only tile — the align-to-page grid, where the picture is the label. */
export function IconTile({ icon: Icon, title, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="h-11 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600
                 hover:bg-gray-50 hover:text-blue-600 cursor-pointer transition"
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}

/**
 * A labelled numeric field with its unit shown inside.
 *
 * Parsing and stepping go through numberInput rather than being written here:
 * an empty box or a lone "-" must leave the value alone, arrow keys should step
 * (ten with Shift), and a 0.1 step must not leave 1.2000000000000002 in the
 * design. Those are easy to get subtly wrong per field and hard to spot later.
 */
export function NumberField({
  label,
  value,
  suffix = "px",
  min,
  max,
  step = 1,
  onChange,
}) {
  const range = { min, max, step };
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-gray-500">{label}</span>
      <span className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-2 focus-within:border-blue-400 focus-within:bg-surface transition">
        <input
          type="number"
          // Rounded for display only: the stored value keeps its precision, so
          // reading a box back and writing it out again doesn't nudge it.
          value={Math.round((Number(value) || 0) * 10) / 10}
          onChange={(e) => {
            const next = parseNumber(e.target.value, range);
            if (next !== null) onChange(next);
          }}
          onKeyDown={(e) => handleNumberKey(e, value, range, onChange)}
          className="w-full min-w-0 bg-transparent py-1.5 text-xs text-gray-800 tabular-nums focus:outline-none
                     [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="pl-1 text-[10px] text-gray-400">{suffix}</span>
      </span>
    </label>
  );
}

/** The empty state both tabs can fall back to. */
export function EmptyNote({ icon: Icon, children }) {
  return (
    <div className="py-10 text-center text-gray-400">
      {Icon && <Icon className="mx-auto mb-2 w-7 h-7 opacity-50" />}
      <p className="text-xs">{children}</p>
    </div>
  );
}
