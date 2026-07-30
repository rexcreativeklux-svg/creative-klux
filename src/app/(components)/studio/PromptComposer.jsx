"use client";

// app/(components)/studio/PromptComposer.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The prompt box on the AI Select page — the page's primary control.
//
// Layout (single card):
//   ┌──────────────────────────────────────────────┐
//   │ [attachment chips, only when files attached] │
//   │ Describe what you want to create…            │
//   │ ────────────────────────────────────────────  │
//   │ +   Model 1 ▾            Build ▾  🎙  ↑      │
//   └──────────────────────────────────────────────┘
//
// Each control is wired to a real capability:
//   +      → uploads to the user's gallery (useGalleryUpload) and keeps the
//            returned hosted URLs as attachments on the prompt.
//   Model  → placeholder tiers; the choice rides along on the URL as ?model=.
//   Build  → Build (generate now) vs Plan (plan first); rides along as ?mode=.
//   🎙     → dictation (useVoiceInput): live where the browser supports it,
//            on-device Whisper everywhere else.
//   ↑      → submits.
//
// Submitting hands everything to the parent via onSubmit(); this component owns
// no routing so it can be dropped onto another surface unchanged.

import { useEffect, useRef, useState } from "react";
import { ArrowUp, FileText, Film, Loader2, Music, Paperclip, Plus, X } from "lucide-react";
import { MEDIA_ACCEPT } from "@/app/(components)/gallery/mediaTypes";
import ComposerDropdown from "./ComposerDropdown";
import VoiceMicButton from "./VoiceMicButton";
import useGalleryUpload from "./useGalleryUpload";
import useVoiceInput, { describeVoiceState } from "./useVoiceInput";

/** Model tiers. Labels are placeholders until the real line-up is decided. */
export const MODEL_OPTIONS = [
  { id: "model-1", label: "Model 1", description: "Balanced quality and speed" },
  { id: "model-2", label: "Model 2", description: "Higher quality, slower" },
  { id: "model-3", label: "Model 3", description: "Fastest drafts" },
];

/** What the assistant does with the prompt — mirrors the reference's Build/Plan. */
export const MODE_OPTIONS = [
  { id: "build", label: "Build", description: "Start creating immediately" },
  { id: "plan", label: "Plan", description: "Draft a plan before creating" },
];

/** Icon per non-image attachment category (images render their own thumbnail). */
const CATEGORY_ICON = { video: Film, audio: Music, document: FileText };

/**
 * How tall the prompt box may grow before it starts scrolling, in px. Applied
 * as an inline max-height AND used as the auto-grow clamp, so the two can't
 * drift apart the way a utility class + a JS literal would.
 */
const DEFAULT_MAX_HEIGHT = 200;

/**
 * The panel's two skins. Each variant replaces the border/background/shadow set
 * wholesale rather than appending to it — two background utilities at equal
 * specificity would otherwise be decided by Tailwind's emit order, which the
 * call site can't control.
 *
 *   solid  the original card. Opaque, at rest on a plain page.
 *   glass  floats over artwork: translucent and blurred, so the backdrop shows
 *          through while the text on top stays fully legible.
 */
const PANEL_VARIANTS = {
  solid: {
    base: "rounded-2xl border bg-surface transition-shadow duration-200",
    focused: "border-blue-500/60 shadow-[0_8px_30px_rgba(0,61,218,0.10)]",
    resting: "border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.05)]",
  },
  glass: {
    base: "rounded-[20px] border bg-surface/72 backdrop-blur-2xl transition-all duration-300",
    focused: "border-blue-500/45 shadow-[0_28px_70px_-24px_rgba(0,61,218,0.42)]",
    resting: "border-gray-200/70 shadow-[0_22px_60px_-28px_rgba(15,23,42,0.40)]",
  },
};

/**
 * @param {object} props
 * @param {(payload: {prompt: string, model: string, mode: string, attachments: string[]}) => void} props.onSubmit
 * @param {string} [props.placeholder]
 * @param {boolean} [props.autoFocus]
 * @param {number} [props.rows]       Resting height of the prompt box, in rows.
 * @param {number} [props.maxHeight]  Growth ceiling in px before it scrolls.
 * @param {"solid"|"glass"} [props.variant] Panel skin — see PANEL_VARIANTS.
 */
export default function PromptComposer({
  onSubmit,
  placeholder = "Describe the creative you want to make…",
  autoFocus = true,
  rows = 3,
  maxHeight = DEFAULT_MAX_HEIGHT,
  variant = "solid",
}) {
  const [value, setValue] = useState("");
  const [model, setModel] = useState(MODEL_OPTIONS[0].id);
  const [mode, setMode] = useState(MODE_OPTIONS[0].id);
  const [openMenu, setOpenMenu] = useState(null); // "model" | "mode" | null
  const [focused, setFocused] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const { attachments, uploading, addFiles, removeAttachment, clearAttachments } =
    useGalleryUpload();
  const voice = useVoiceInput({ onText: setValue });
  const voiceStatus = describeVoiceState(voice);

  // Auto-grow the textarea with its content, up to a readable ceiling.
  // `rows`/`maxHeight` are in the deps so a page that changes either still
  // re-measures instead of waiting for the next keystroke.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, [value, rows, maxHeight]);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  const busy = uploading || voice.transcribing;
  const canSubmit = (value.trim().length > 0 || attachments.length > 0) && !busy;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      prompt: value.trim(),
      model,
      mode,
      attachments: attachments.map((item) => item.url),
    });
    setValue("");
    clearAttachments();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const panel = PANEL_VARIANTS[variant] ?? PANEL_VARIANTS.solid;

  return (
    <div className="w-full">
      <div
        className={`${panel.base} ${focused ? panel.focused : panel.resting}`}
      >
        {/* Attachment chips — one row that scrolls sideways, never wraps, so the
            composer keeps its height no matter how many files are attached. */}
        {attachments.length > 0 && (
          <div className="hide-scrollbar flex gap-2 overflow-x-auto border-b border-gray-100 px-3 pb-3 pt-3">
            {attachments.map((item) => {
              const Icon = CATEGORY_ICON[item.category] || Paperclip;
              return (
                <div
                  key={item.id}
                  className="group relative flex w-44 shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-1.5 pr-7"
                >
                  {item.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="h-7 w-7 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-gray-200">
                      <Icon className="h-3.5 w-3.5 text-gray-500" />
                    </span>
                  )}
                  <span className="truncate text-[11px] font-medium text-gray-700">
                    {item.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 transition-colors hover:text-red-600 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Prompt */}
        <textarea
          ref={textareaRef}
          rows={rows}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={voice.listening ? "Listening — start speaking…" : placeholder}
          style={{ maxHeight }}
          className="w-full resize-none bg-transparent px-4 pt-4 text-sm leading-relaxed text-gray-900 outline-none placeholder:text-gray-400"
        />

        {/* Toolbar */}
        <div className="flex items-center gap-1.5 px-2.5 pb-2.5 pt-1.5">
          {/* Attach */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Attach files from your device"
            title="Attach files from your device"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4.5 w-4.5" />
            )}
          </button>

          <span className="mx-0.5 h-5 w-px shrink-0 bg-gray-200" />

          {/* Model */}
          <ComposerDropdown
            options={MODEL_OPTIONS}
            value={model}
            onChange={setModel}
            open={openMenu === "model"}
            onOpenChange={(next) => setOpenMenu(next ? "model" : null)}
            ariaLabel="Choose a model"
          />

          <div className="flex-1" />

          {/* Build / Plan */}
          <ComposerDropdown
            options={MODE_OPTIONS}
            value={mode}
            onChange={setMode}
            open={openMenu === "mode"}
            onOpenChange={(next) => setOpenMenu(next ? "mode" : null)}
            ariaLabel="Choose what happens on submit"
          />

          {/* Voice */}
          <VoiceMicButton voice={voice} onToggle={() => voice.toggle(value)} size="md" />

          {/* Send */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-label="Start creating"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all ${
              canSubmit
                ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700 cursor-pointer"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>

        {/* Hidden picker — reuses the gallery's accept list so anything attached
            here is something the gallery can also classify and store. */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={MEDIA_ACCEPT}
          className="hidden"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = ""; // let the same file be picked again
          }}
        />
      </div>

      {/* Status line — one row, so the layout never jumps between states */}
      <div className="mt-2.5 flex min-h-4.5 items-center justify-center gap-2 text-[11px]">
        {voiceStatus ? (
          <span
            className={`flex items-center gap-2 font-medium ${
              voiceStatus.tone === "recording" ? "text-red-500" : "text-gray-500"
            }`}
          >
            {voiceStatus.tone === "recording" && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
            )}
            {voiceStatus.text}
          </span>
        ) : (
          <span className="text-gray-400">
            Enter to send · Shift + Enter for a new line
          </span>
        )}
      </div>
    </div>
  );
}
