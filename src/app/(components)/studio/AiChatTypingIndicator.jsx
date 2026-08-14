"use client";

import React from "react";
import { Sparkles } from "lucide-react";

/**
 * The assistant's "working on it" bubble.
 *
 * @param {object} props
 * @param {object} props.config  The creative-type config (colour, etc).
 * @param {string} [props.label] What it is working ON. Omit for an ordinary
 *   wait — three bouncing dots say "composing a reply" perfectly well on their
 *   own. Pass one for work that takes far longer than a reply does (fetching a
 *   template, running a redesign): dots alone can't distinguish two seconds
 *   from thirty, so a wait that outlasts the reader's patience needs to say
 *   what it is doing or it reads as a hang.
 */
export default function AiChatTypingIndicator({ config, label }) {
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
          // These were WHITE-alpha fills — left over from a dark mock, which
          // made the avatar and bubble all but invisible on the light chat
          // pane. The palette's raised-grey gives them a real edge in both
          // themes and matches the assistant bubble they precede.
          background: "var(--color-gray-100)",
          border: "1px solid var(--color-gray-200)",
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
          background: "var(--color-gray-100)",
          border: "1px solid var(--color-gray-200)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          gap: 5,
          // Was 0.3 — sized for a dark mock, where it read as depth. Over a
          // light pane that is a smudge, so it drops to the app's card weight.
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
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

        {/* aria-live so a screen reader is told the wait changed phase — the
            bouncing dots announce nothing at all on their own. */}
        {label && (
          <span
            aria-live="polite"
            style={{
              marginLeft: 4,
              fontSize: 12.5,
              fontWeight: 500,
              color: "var(--color-gray-500)",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        )}
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