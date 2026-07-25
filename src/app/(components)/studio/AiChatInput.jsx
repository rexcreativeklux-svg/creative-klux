"use client";

// app/(components)/studio/AiChatInput.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The message box on the AI Chat page. Shares its dictation behaviour with the
// AI Select composer: the same useVoiceInput() engine strategy (live Web Speech
// API where available, on-device Whisper everywhere else), the same
// <VoiceMicButton>, and the same status wording via describeVoiceState() — so a
// user who learns the mic on one Studio surface already knows it on the other.
//
// Dictation appends to whatever is already typed rather than replacing it, and
// the mic is disabled while a reply is in flight.
//
// The accent colour comes from the caller's `config` (the creative type's
// palette), which is why the send button and focus ring stay inline styles.

import { useEffect, useRef, useState } from "react";
import { FileText, Film, Loader2, Music, Paperclip, Plus, SendHorizontal, X } from "lucide-react";
import { MEDIA_ACCEPT } from "@/app/(components)/gallery/mediaTypes";
import VoiceMicButton from "./VoiceMicButton";
import useGalleryUpload from "./useGalleryUpload";
import useVoiceInput, { describeVoiceState } from "./useVoiceInput";
import { buildMessageWithAttachments } from "./attachmentUrls";

/** Icon per non-image attachment category (images render their own thumbnail). */
const CATEGORY_ICON = { video: Film, audio: Music, document: FileText };

/* The box opens at three rows so there's visible room to write, and grows from
   there to MAX_INPUT_HEIGHT before it starts scrolling. MIN_INPUT_HEIGHT is
   those three rows measured in the textarea's own type (12.5px × 1.6 line-height
   ≈ 20px a row) plus its 2px top/bottom padding — keep the three in step if the
   type ever changes. */
const INPUT_ROWS = 3;
const MIN_INPUT_HEIGHT = INPUT_ROWS * 20 + 4;
const MAX_INPUT_HEIGHT = 160;

export default function AiChatInput({
  onSend,
  isLoading,
  placeholder = "Message CreativeKlux AI...",
  config,
}) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const color = config?.color || "#7c3aed";
  const colorRgb = config?.colorRgb || "124,58,237";

  const voice = useVoiceInput({ onText: setValue });
  const voiceStatus = describeVoiceState(voice);
  const { attachments, uploading, addFiles, removeAttachment, clearAttachments } =
    useGalleryUpload();

  // Auto-grow with the content, but never below the three-row resting height and
  // never past the ceiling (after which the textarea scrolls internally).
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const fitted = Math.min(Math.max(ta.scrollHeight, MIN_INPUT_HEIGHT), MAX_INPUT_HEIGHT);
    ta.style.height = `${fitted}px`;
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    // A message may be files only — but never empty, and never mid-upload.
    if ((!trimmed && attachments.length === 0) || isLoading || uploading) return;
    // Attachment URLs are folded into the message string itself; there is no
    // separate attachments field anywhere downstream.
    onSend(buildMessageWithAttachments(trimmed, attachments));
    setValue("");
    clearAttachments();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = (value.trim().length > 0 || attachments.length > 0) && !isLoading && !uploading;

  return (
    <div>
      <div
        style={{
          borderRadius: 14,
          border: `1.5px solid ${focused ? `rgba(${colorRgb}, 0.6)` : "#e5e7eb"}`,
          background: "#fff",
          transition: "border-color 0.2s, box-shadow 0.2s",
          boxShadow: focused ? `0 0 0 3px rgba(${colorRgb}, 0.1)` : "none",
        }}
      >
        {/* Staged files — one row that scrolls sideways, never wraps, so the
            input keeps its height however many are attached. */}
        {attachments.length > 0 && (
          <div className="hide-scrollbar flex gap-1.5 overflow-x-auto border-b border-gray-100 px-2.5 pb-2 pt-2.5">
            {attachments.map((item) => {
              const Icon = CATEGORY_ICON[item.category] || Paperclip;
              return (
                <div
                  key={item.id}
                  className="relative flex w-36 shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 py-1 pl-1 pr-6"
                >
                  {item.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="h-6 w-6 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gray-200">
                      <Icon className="h-3 w-3 text-gray-500" />
                    </span>
                  )}
                  <span className="truncate text-[10px] font-medium text-gray-700">
                    {item.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 transition-colors hover:text-red-600 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            padding: "9px 10px",
          }}
        >
          {/* Attach — uploads to the gallery, same pipeline as AI Select. */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Attach files from your device"
            title="Attach files from your device"
            className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>

          {/* NOT disabled while a reply is in flight — the user can keep
              composing (type, dictate, attach) the whole time; only SENDING
              waits for the assistant. handleSubmit is the single gate. */}
          <textarea
            ref={textareaRef}
            rows={INPUT_ROWS}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={voice.listening ? "Listening — start speaking…" : placeholder}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: 12.5,
              lineHeight: 1.6,
              color: "#111827",
              padding: "2px 0",
              minHeight: MIN_INPUT_HEIGHT,
              maxHeight: MAX_INPUT_HEIGHT,
              fontFamily: "inherit",
            }}
          />

          {/* Dictation — identical engine and states to the AI Select composer. */}
          <VoiceMicButton voice={voice} onToggle={() => voice.toggle(value)} size="sm" />

          <button
            onClick={handleSubmit}
            disabled={!canSend}
            aria-label={isLoading ? "Waiting for the reply…" : "Send message"}
            title={isLoading ? "Waiting for the reply…" : undefined}
            style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: "none",
            background: canSend
              ? `linear-gradient(135deg, ${color} 0%, rgba(${colorRgb}, 0.75) 100%)`
              : "#f1f5f9",
            color: canSend ? "#fff" : "#9ca3af",
            cursor: canSend ? "pointer" : "not-allowed",
            opacity: canSend ? 1 : 0.6,
            transition: "all 0.15s",
            boxShadow: canSend ? `0 3px 12px rgba(${colorRgb}, 0.35)` : "none",
            }}
          >
            {isLoading ? (
              <Loader2
                style={{ width: 14, height: 14, animation: "ck-spin 1s linear infinite" }}
              />
            ) : (
              <SendHorizontal style={{ width: 14, height: 14 }} />
            )}
          </button>
        </div>

        {/* Hidden picker — same accept list as every other gallery upload. */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={MEDIA_ACCEPT}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = ""; // let the same file be picked again
          }}
        />
      </div>

      {/* Status line — swaps to the live take, otherwise the keyboard hint. */}
      <p
        style={{
          fontSize: 10,
          textAlign: "center",
          marginTop: 7,
          minHeight: 13,
          fontWeight: voiceStatus ? 600 : 400,
          color: voiceStatus
            ? voiceStatus.tone === "recording"
              ? "#ef4444"
              : "#6b7280"
            : "#9ca3af",
        }}
      >
        {voiceStatus ? voiceStatus.text : "Enter to send · Shift+Enter for new line"}
      </p>

      <style>{`
        @keyframes ck-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
