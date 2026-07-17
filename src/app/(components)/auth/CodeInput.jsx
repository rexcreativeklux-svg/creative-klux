"use client";

/**
 * CodeInput — segmented one-time-code entry (shared).
 * ---------------------------------------------------------------------------
 * A row of single-character boxes for entering a short verification code (email
 * verification, password-reset code, etc.). Fully controlled: the parent owns
 * the value as an array of characters and receives every change via `onChange`.
 *
 * Handles the fiddly UX so pages don't repeat it:
 *   • auto-advance to the next box as the user types
 *   • Backspace on an empty box steps back to the previous one
 *   • paste a whole code (strips spaces/symbols, fills across the boxes)
 *   • forces uppercase alphanumeric input (digits pass through unchanged)
 *   • auto-focuses the first box on mount (opt out with `autoFocus={false}`)
 *
 * The parent decides what a "complete" code means and when to submit; this
 * component only reports the current characters. Join with `value.join("")`.
 *
 * @param {string[]}                 value              Controlled chars, length === `length`.
 * @param {(next: string[]) => void} onChange           Called with the next chars array.
 * @param {number}                   [length=6]         Number of boxes.
 * @param {boolean}                  [disabled=false]   Disables every box.
 * @param {boolean}                  [autoFocus=true]   Focus the first box on mount.
 *
 * @example
 *   const [digits, setDigits] = useState(Array(6).fill(""));
 *   <CodeInput value={digits} onChange={setDigits} disabled={loading} />
 *   const code = digits.join("");
 */

import { useEffect, useRef } from "react";

export default function CodeInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = true,
}) {
  const inputRefs = useRef([]);

  // Focus the first box on mount so the user can type immediately.
  useEffect(() => {
    if (autoFocus) inputRefs.current[0]?.focus();
  }, [autoFocus]);

  const handleChange = (index, raw) => {
    // Accept only a single alphanumeric character (or clearing the box).
    if (raw !== "" && !/^[a-zA-Z0-9]$/.test(raw)) return;

    const next = [...value];
    next[index] = raw.toUpperCase();
    onChange(next);

    // Auto-advance once a character is entered.
    if (raw && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace on an empty box moves focus back so the user can keep deleting.
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();

    // Keep only letters/numbers so a pasted "123-456" or "1 2 3" still works.
    const chars = e.clipboardData
      .getData("text")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, length)
      .toUpperCase()
      .split("");

    if (chars.length === 0) return;

    // Pad to a full-length array so React keeps every box controlled.
    const next = Array.from({ length }, (_, i) => chars[i] || "");
    onChange(next);

    // Focus the last filled box (or the final box when a full code is pasted).
    const focusIndex = Math.min(chars.length - 1, length - 1);
    setTimeout(() => inputRefs.current[focusIndex]?.focus(), 0);
  };

  return (
    <div
      className="flex justify-between gap-2 sm:gap-2.5"
      onPaste={handlePaste}
    >
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          type="text"
          inputMode="text"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          ref={(el) => (inputRefs.current[index] = el)}
          disabled={disabled}
          className="w-full aspect-square min-w-0 text-center text-2xl font-bold uppercase rounded-xl border border-gray-200 bg-gray-50 text-gray-900 outline-none transition-all duration-150 focus:bg-surface focus:border-[#1447e6] focus:ring-3 focus:ring-[#1447e6]/10 disabled:opacity-60"
        />
      ))}
    </div>
  );
}
