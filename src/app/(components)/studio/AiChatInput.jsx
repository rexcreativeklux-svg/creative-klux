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
// Sends via onSend(text, images): the text the user typed, and the hosted image
// URLs as their own array. Text is required — the API's `message` is
// `required|string`, so attaching images without typing leaves send disabled.
//
// The accent colour comes from the caller's `config` (the creative type's
// palette), which is why the send button and focus ring stay inline styles.

import { useEffect, useRef, useState } from "react";
import { FileText, Film, Loader2, Music, Paperclip, Plus, SendHorizontal, X } from "lucide-react";
import VoiceMicButton from "./VoiceMicButton";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import { useAuth } from "@/context/AuthContext";
import useGalleryUpload from "./useGalleryUpload";
import useVoiceInput, { describeVoiceState } from "./useVoiceInput";
import {
  CHAT_MEDIA_ACCEPT,
  CHAT_MEDIA_CATEGORIES,
  MAX_CHAT_IMAGES,
  MAX_CHAT_MESSAGE,
  toImagePayload,
} from "./attachmentUrls";

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
  // The gallery picker behind the "+" button.
  const [pickerOpen, setPickerOpen] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const { myImages, activeBrand } = useAuth();

  const color = config?.color || "#7c3aed";
  const colorRgb = config?.colorRgb || "124,58,237";

  const voice = useVoiceInput({ onText: setValue });
  const voiceStatus = describeVoiceState(voice);
  const {
    attachments,
    uploading,
    addFiles,
    addHosted,
    removeAttachment,
    clearAttachments,
  } = useGalleryUpload({
    allowedCategories: CHAT_MEDIA_CATEGORIES,
    maxFiles: MAX_CHAT_IMAGES,
  });

  /**
   * The picker confirmed. `images` is [{ src, large, file? }] and `media` is a
   * flat list of URLs (Magic Studio picks).
   *
   * Two kinds come back and they take different routes: a LIBRARY or stock pick
   * is already hosted, so its URL is attached directly; an UPLOAD tab pick is
   * still a File on the user's disk and has to go through addFiles to become a
   * gallery URL the chat API can carry. `large` wins over `src` where both
   * exist — stock results put the full-size image there and the thumbnail in
   * `src`, and the generator should get the big one.
   */
  const handlePickerApply = (images = [], media = []) => {
    setPickerOpen(false);

    const files = images.map((img) => img?.file).filter(Boolean);
    if (files.length) addFiles(files);

    const hosted = [
      ...images.filter((img) => !img?.file).map((img) => img?.large || img?.src),
      ...media,
    ];
    if (hosted.length) addHosted(hosted);
  };

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
    // Text is REQUIRED — the API's `message` is `required|string`, so images
    // alone is not a sendable request. Never empty, never mid-upload.
    if (!trimmed || isLoading || uploading) return;
    // Images are their own argument; they are never folded into the text.
    onSend(trimmed, toImagePayload(attachments));
    setValue("");
    clearAttachments();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = value.trim().length > 0 && !isLoading && !uploading;

  return (
    <div>
      <div
        style={{
          borderRadius: 14,
          // Palette vars, not hexes — this shell is styled inline so it can
          // carry no `dark:` class, and it used to pin the composer to white.
          border: `1.5px solid ${focused ? `rgba(${colorRgb}, 0.6)` : "var(--color-gray-200)"}`,
          background: "var(--color-surface)",
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
              // Uploads preview from a local object URL; gallery picks have no
              // object URL because they were never a File — the hosted image IS
              // the preview. Without this fallback every picked image showed a
              // generic paperclip instead of itself.
              const thumb =
                item.previewUrl || (item.category === "image" ? item.url : null);
              return (
                <div
                  key={item.id}
                  className="relative flex w-36 shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 py-1 pl-1 pr-6"
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
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
          {/* Attach — opens the gallery picker rather than a bare file dialog,
              so an image already in the library can be reused instead of being
              re-uploaded. The picker's Library tab has its own upload control,
              so picking from disk is still one click away; the hidden <input>
              below stays for drag-drop and paste. Images only: the chat API
              carries an `images` array, nothing else. */}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            disabled={uploading}
            aria-label="Add images from your gallery"
            title={`Add images (up to ${MAX_CHAT_IMAGES})`}
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
            maxLength={MAX_CHAT_MESSAGE}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: 12.5,
              lineHeight: 1.6,
              color: "var(--color-gray-900)",
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
              : "var(--color-gray-100)",
            color: canSend ? "#fff" : "var(--color-gray-400)",
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

        {/* Hidden picker — images only, matching what the chat API can carry.
            useGalleryUpload re-checks, for anything that bypasses the dialog. */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={CHAT_MEDIA_ACCEPT}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = ""; // let the same file be picked again
          }}
        />

        {/* The gallery, as the /gallery page presents it: your media plus a
            stock search, and nothing else. Magic Studio is deliberately left
            out — /gallery has no such tab, and generating a new image is a
            different intent from attaching one you already have.

            `allowedTypes` covers every category the gallery holds, so the
            Videos / Audio / Docs tabs appear here exactly as they do on
            /gallery. Whether the chat endpoint accepts a video is the
            endpoint's call to make and to report — see CHAT_MEDIA_CATEGORIES.

            `allowedTypes` stays images-only: the chat API's `images` array is
            the only channel an attachment has, so a video or PDF would have
            nowhere to go (see attachmentUrls.js).

            The cap is what's LEFT of the chat's allowance, so the picker can't
            hand back more than the composer is able to hold. */}
        <MediaPickerModal
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onCancel={() => setPickerOpen(false)}
          onApply={handlePickerApply}
          initialTab="library"
          tabs={["library", "search"]}
          allowedTypes={CHAT_MEDIA_CATEGORIES}
          maxSelectable={Math.max(0, MAX_CHAT_IMAGES - attachments.length)}
          myImages={myImages}
          activeBrand={activeBrand}
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
              // Recording red stays literal — a state colour, legible on both.
              ? "#ef4444"
              : "var(--color-gray-500)"
            : "var(--color-gray-400)",
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
