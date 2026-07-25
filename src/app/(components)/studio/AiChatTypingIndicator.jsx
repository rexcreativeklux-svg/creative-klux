"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export default function AiChatTypingIndicator({ config }) {
  const color = config?.color || "#c084fc";
  const colorRgb = config?.colorRgb || "192,132,252";

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
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
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <img
          src="/logoblue.svg"
          alt="AI"
          style={{
            width: 18,
            height: 18,
            objectFit: "contain",
          }}
        />
      </div>

      {/* Dots bubble */}
      <div
        style={{
          padding: "14px 18px",
          borderRadius: "18px 18px 18px 4px",
          background: "rgba(255,255,255,0.055)",
          border: "1px solid rgba(255,255,255,0.09)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          gap: 5,
          boxShadow: "0 2px 16px rgba(0,0,0,0.3)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: color,
              display: "inline-block",
              opacity: 0.7,
              animation: "ck-bounce 0.9s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
              boxShadow: `0 0 6px rgba(${colorRgb},0.5)`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes ck-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}