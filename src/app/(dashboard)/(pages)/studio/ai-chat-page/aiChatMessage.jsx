"use client";

import React from "react";
import { Sparkles, User } from "lucide-react";

function MessageContent({ content, isUser, color }) {
  if (!content) return null;
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} style={{ color: color, fontWeight: 700 }}>
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
  const color = config?.color || "#7c3aed";
  const colorRgb = config?.colorRgb || "124,58,237";

  return (
    <div
      style={{
        display: "flex",
        gap: 9,
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-end",
        animation: "ck-msg-in 0.22s ease both",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: isUser
            ? `rgba(${colorRgb}, 0.12)`
            : `rgba(${colorRgb}, 0.07)`,
          border: isUser
            ? `1px solid rgba(${colorRgb}, 0.28)`
            : `1px solid rgba(${colorRgb}, 0.2)`,
        }}
      >
        {isUser ? (
          <User style={{ width: 13, height: 13, color }} />
        ) : (
          <img
            src="/logoblue.svg"
            alt="AI"
            style={{
              width: 18,
              height: 18,
              objectFit: "contain",
            }}
          />
        )}

      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth: "76%",
          padding: "11px 14px",
          fontSize: 12.5,
          lineHeight: 1.65,
          color: "#111827",
          borderRadius: isUser
            ? "16px 16px 4px 16px"
            : "16px 16px 16px 4px",
          background: isUser
            ? `linear-gradient(135deg, rgba(${colorRgb}, 0.12) 0%, rgba(${colorRgb}, 0.07) 100%)`
            : "#f8fafc",
          border: isUser
            ? `1px solid rgba(${colorRgb}, 0.25)`
            : "1px solid #e9ecef",
        }}
      >
        <MessageContent content={message.content} isUser={isUser} color={color} />

        {message.image_url && (
          <img
            src={message.image_url}
            alt="Generated creative"
            style={{
              marginTop: 10,
              borderRadius: 10,
              width: "100%",
              maxWidth: 300,
              objectFit: "cover",
              border: "1px solid #e9ecef",
            }}
          />
        )}

        <p
          style={{
            fontSize: 10,
            marginTop: 5,
            textAlign: isUser ? "right" : "left",
            color: isUser ? `rgba(${colorRgb}, 0.55)` : "#9ca3af",
          }}
        >
          {message.timestamp
            ? new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
            : ""}
        </p>
      </div>

      <style>{`
        @keyframes ck-msg-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}