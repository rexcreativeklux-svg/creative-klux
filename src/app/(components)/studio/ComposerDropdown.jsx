"use client";

// app/(components)/studio/ComposerDropdown.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The small drop-up menu used twice in the prompt composer — once for the model
// picker, once for the Build/Plan mode picker. One component so both stay
// visually and behaviourally identical.
//
// Opens upward by default (`drop="up"`) because the composer sits low on the
// page. Closes on outside click, on Escape, and on selection. Colours come from
// the app's theme tokens (bg-surface / gray-*), so it follows light and dark
// without a single hard-coded hex.

import { useEffect, useRef } from "react";
import { Check, ChevronDown } from "lucide-react";

/**
 * @param {object} props
 * @param {{id: string, label: string, description?: string}[]} props.options
 * @param {string} props.value            Currently selected option id.
 * @param {(id: string) => void} props.onChange
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {"up"|"down"} [props.drop]      Menu direction. Default "up".
 * @param {string} [props.ariaLabel]      Accessible name for the trigger.
 * @param {React.ComponentType<{className?: string}>} [props.icon] Optional leading icon.
 */
export default function ComposerDropdown({
  options,
  value,
  onChange,
  open,
  onOpenChange,
  drop = "up",
  ariaLabel,
  icon: Icon,
}) {
  const containerRef = useRef(null);
  const selected = options.find((option) => option.id === value) || options[0];

  // Close on outside click / Escape while open.
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) onOpenChange(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onOpenChange(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
          open
            ? "bg-gray-100 text-gray-900"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
        <span className="whitespace-nowrap">{selected?.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute left-0 z-50 w-56 overflow-hidden rounded-xl border border-gray-200 bg-surface py-1 shadow-xl ${
            drop === "up" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {options.map((option) => {
            const active = option.id === selected?.id;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.id);
                  onOpenChange(false);
                }}
                className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors cursor-pointer hover:bg-gray-100"
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs ${
                      active ? "font-semibold text-blue-600" : "font-medium text-gray-900"
                    }`}
                  >
                    {option.label}
                  </p>
                  {option.description && (
                    <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
                      {option.description}
                    </p>
                  )}
                </div>
                {active && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
