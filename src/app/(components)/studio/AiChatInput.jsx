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
import { Loader2, SendHorizontal } from "lucide-react";
import VoiceMicButton from "./VoiceMicButton";
import useVoiceInput, { describeVoiceState } from "./useVoiceInput";

export default function AiChatInput({
  onSend,
  isLoading,
  placeholder = "Message CreativeKlux AI...",
  config,
}) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef(null);

  const color = config?.color || "#7c3aed";
  const colorRgb = config?.colorRgb || "124,58,237";

  const voice = useVoiceInput({ onText: setValue });
  const voiceStatus = describeVoiceState(voice);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = value.trim().length > 0 && !isLoading;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 8,
          borderRadius: 14,
          border: `1.5px solid ${focused ? `rgba(${colorRgb}, 0.6)` : "#e5e7eb"}`,
          padding: "9px 10px",
          background: "#fff",
          transition: "border-color 0.2s, box-shadow 0.2s",
          boxShadow: focused ? `0 0 0 3px rgba(${colorRgb}, 0.1)` : "none",
        }}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={voice.listening ? "Listening — start speaking…" : placeholder}
          disabled={isLoading}
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
            maxHeight: 140,
            fontFamily: "inherit",
            opacity: isLoading ? 0.5 : 1,
          }}
        />

        {/* Dictation — identical engine and states to the AI Select composer. */}
        <VoiceMicButton
          voice={voice}
          onToggle={() => voice.toggle(value)}
          size="sm"
          disabled={isLoading}
        />

        <button
          onClick={handleSubmit}
          disabled={!canSend}
          aria-label="Send message"
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
