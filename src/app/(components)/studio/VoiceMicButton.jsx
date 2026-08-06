"use client";

// app/(components)/studio/VoiceMicButton.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The microphone control shared by every Studio composer — the AI Select prompt
// box and the AI Chat input today, any future one for free.
//
// It renders the three states of a dictation take identically everywhere:
//   idle         → a mic icon
//   listening    → a filled stop square on a red pill
//   transcribing → a spinner (disabled; the on-device engine is still working)
//
// The button owns no voice logic. The caller passes the object returned by
// useVoiceInput() so a single take's state stays in the composer that owns the
// text — this component only draws it.

import { Loader2, Mic, Square } from "lucide-react";

/** Pixel metrics per size, so both composers can match their own toolbars. */
const SIZES = {
  sm: { button: "h-[34px] w-[34px]", icon: "h-3.5 w-3.5", stop: "h-3 w-3" },
  md: { button: "h-8 w-8", icon: "h-4 w-4", stop: "h-3.5 w-3.5" },
  lg: { button: "h-10 w-10", icon: "h-4 w-4", stop: "h-3.5 w-3.5" },
};

/**
 * Outline of the button when it is idle. "square" is the original and stays the
 * default so the chat input is untouched; "round" is the outlined circle the
 * home composer pairs with its attach and send buttons.
 *
 * Neither applies while a take is RECORDING — that state is a filled red pill in
 * both shapes, and an outline on top of a solid fill only muddies it.
 */
const SHAPES = {
  square: { idle: "rounded-lg hover:bg-gray-100", recording: "rounded-lg" },
  round: {
    idle: "rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50",
    recording: "rounded-full",
  },
};

/**
 * @param {object} props
 * @param {{listening: boolean, transcribing: boolean}} props.voice The
 *   useVoiceInput() return value — only the two flags are read.
 * @param {() => void} props.onToggle Start or stop the take.
 * @param {"sm"|"md"|"lg"} [props.size] Visual scale. Default "md".
 * @param {"square"|"round"} [props.shape] Outline. Default "square".
 * @param {boolean} [props.disabled] Force-disable (e.g. while a reply streams).
 */
export default function VoiceMicButton({
  voice,
  onToggle,
  size = "md",
  shape = "square",
  disabled = false,
}) {
  const metrics = SIZES[size] || SIZES.md;
  const outline = SHAPES[shape] || SHAPES.square;
  const { listening, transcribing } = voice;
  const label = listening ? "Stop recording" : "Dictate your message";

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={transcribing || disabled}
      aria-label={label}
      title={label}
      className={`flex shrink-0 items-center justify-center transition-colors disabled:cursor-not-allowed ${
        metrics.button
      } ${
        listening
          ? `${outline.recording} bg-red-500 text-white hover:bg-red-600 cursor-pointer`
          : `${outline.idle} text-gray-500 hover:text-gray-900 disabled:opacity-40 cursor-pointer`
      }`}
    >
      {transcribing ? (
        <Loader2 className={`${metrics.icon} animate-spin`} />
      ) : listening ? (
        <Square className={`${metrics.stop} fill-current`} />
      ) : (
        <Mic className={metrics.icon} />
      )}
    </button>
  );
}
