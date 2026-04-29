"use client";

import React from "react";
import { Sparkles, User } from "lucide-react";

function MessageContent({ content, isUser }) {
  if (!content) return null;
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} style={{ color: isUser ? "#fff" : "#fff", fontWeight: 700 }}>
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export default function AiChatMessage({ message, config }) {
  const isUser = message.role === "user";
  const color = config?.color || "#c084fc";
  const colorRgb = config?.colorRgb || "192,132,252";

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-end",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: isUser
            ? `rgba(${colorRgb},0.2)`
            : "rgba(255,255,255,0.06)",
          border: isUser
            ? `1px solid rgba(${colorRgb},0.4)`
            : "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {isUser ? (
          <User style={{ width: 14, height: 14, color: color }} />
        ) : (
          <Sparkles style={{ width: 14, height: 14, color: color }} />
        )}
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth: "75%",
          padding: "12px 16px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          fontSize: 13,
          lineHeight: 1.65,
          background: isUser
            ? `linear-gradient(135deg, rgba(${colorRgb},0.3) 0%, rgba(${colorRgb},0.18) 100%)`
            : "rgba(255,255,255,0.055)",
          border: isUser
            ? `1px solid rgba(${colorRgb},0.45)`
            : "1px solid rgba(255,255,255,0.09)",
          color: isUser ? "#fff" : "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: isUser
            ? `0 4px 20px rgba(${colorRgb},0.2)`
            : "0 2px 16px rgba(0,0,0,0.3)",
        }}
      >
        <MessageContent content={message.content} isUser={isUser} />

        {message.image_url && (
          <img
            src={message.image_url}
            alt="Generated creative"
            style={{ marginTop: 12, borderRadius: 12, width: "100%", maxWidth: 320, objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        )}

        <p
          style={{
            fontSize: 10,
            marginTop: 6,
            textAlign: isUser ? "right" : "left",
            color: isUser ? `rgba(${colorRgb},0.6)` : "rgba(255,255,255,0.25)",
          }}
        >
          {message.timestamp
            ? new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : ""}
        </p>
      </div>
    </div>
  );
}