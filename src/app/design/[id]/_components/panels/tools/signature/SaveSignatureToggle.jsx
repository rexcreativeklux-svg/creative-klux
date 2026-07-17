"use client";

import React from "react";

/**
 * SaveSignatureToggle — "Save signature" switch. When there's no backend it's
 * shown disabled with a note, so the option is visible but honest about not
 * persisting yet.
 *
 * Props: { checked, onChange, disabled?, disabledNote? }
 */
export default function SaveSignatureToggle({
  checked,
  onChange,
  disabled,
  disabledNote,
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className={`flex items-center gap-2.5 ${
          disabled ? "cursor-default" : "cursor-pointer"
        }`}
      >
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => !disabled && onChange(!checked)}
          className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
            checked ? "bg-blue-600" : "bg-gray-300"
          } ${disabled ? "opacity-50 cursor-default" : "cursor-pointer"}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              checked ? "translate-x-4" : ""
            }`}
          />
        </button>
        <span className="text-sm text-gray-700">Save signature</span>
      </label>
      {disabled && disabledNote && (
        <p className="text-[10px] text-gray-400 pl-[46px]">{disabledNote}</p>
      )}
    </div>
  );
}
