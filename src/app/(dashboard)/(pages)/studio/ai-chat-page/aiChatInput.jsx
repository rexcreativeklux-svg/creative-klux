"use client";

import React, { useState, useRef, useEffect } from "react";
import { SendHorizontal, Loader2 } from "lucide-react";

export default function AiChatInput({ onSend, isLoading, placeholder = "Message CreativeKlux AI...", config }) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef(null);

  const color = config?.color || "#c084fc";
  const colorRgb = config?.colorRgb || "192,132,252";

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
          gap: 10,
          borderRadius: 16,
          border: `1.5px solid ${focused ? `rgba(${colorRgb},0.65)` : "rgba(255,255,255,0.1)"}`,
          padding: "10px 12px",
          background: "rgba(255,255,255,0.055)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          transition: "border-color 0.2s, box-shadow 0.2s",
          boxShadow: focused
            ? `0 0 0 3px rgba(${colorRgb},0.12), 0 8px 32px rgba(0,0,0,0.4)`
            : "0 4px 24px rgba(0,0,0,0.3)",
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
            fontSize: 13,
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.88)",
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
            width: 36,
            height: 36,
            borderRadius: 11,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: "none",
            background: canSend
              ? `linear-gradient(135deg, ${color} 0%, rgba(${colorRgb},0.7) 100%)`
              : "rgba(255,255,255,0.07)",
            color: "#fff",
            cursor: canSend ? "pointer" : "not-allowed",
            opacity: canSend ? 1 : 0.3,
            transition: "all 0.15s",
            boxShadow: canSend ? `0 4px 14px rgba(${colorRgb},0.4)` : "none",
          }}
        >
          {isLoading ? (
            <Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} />
          ) : (
            <SendHorizontal style={{ width: 15, height: 15 }} />
          )}
        </button>
      </div>

      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 8 }}>
        Enter to send · Shift+Enter for new line
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}