"use client";

import React, { useState, useRef, useEffect } from "react";
import { SendHorizontal, Loader2 } from "lucide-react";

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
          border: `1.5px solid ${
            focused
              ? `rgba(${colorRgb}, 0.6)`
              : "#e5e7eb"
          }`,
          padding: "9px 10px",
          background: "#fff",
          transition: "border-color 0.2s, box-shadow 0.2s",
          boxShadow: focused
            ? `0 0 0 3px rgba(${colorRgb}, 0.1)`
            : "none",
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
          placeholder={placeholder}
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

        <button
          onClick={handleSubmit}
          disabled={!canSend}
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
            boxShadow: canSend
              ? `0 3px 12px rgba(${colorRgb}, 0.35)`
              : "none",
          }}
        >
          {isLoading ? (
            <Loader2
              style={{
                width: 14,
                height: 14,
                animation: "ck-spin 1s linear infinite",
              }}
            />
          ) : (
            <SendHorizontal style={{ width: 14, height: 14 }} />
          )}
        </button>
      </div>

      <p
        style={{
          fontSize: 10,
          color: "#9ca3af",
          textAlign: "center",
          marginTop: 7,
        }}
      >
        Enter to send · Shift+Enter for new line
      </p>

      <style>{`
        @keyframes ck-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}