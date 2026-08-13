"use client";

import React from "react";
import { X, RotateCw, MessageSquare, CheckCircle2 } from "lucide-react";
import {
  formatSessionDate,
  parseSessionSummary,
} from "@/app/(components)/studio/chatSessions";

/**
 * The brand's saved chats, listed over the chat pane.
 *
 * Rendered as an overlay filling the pane BELOW its header (top: 52 matches the
 * header's height) rather than as an anchored dropdown: the pane is resizable
 * and becomes a full-width tab under `lg`, so a fixed-width popover would need
 * position maths that an inset overlay gets for free at every size.
 *
 * Data comes from `fetchChatSessions` — rows are
 * `{ session_id, title, status, messages, started }`.
 */
export default function ChatHistoryPanel({
  open,
  onClose,
  sessions = [],
  loading = false,
  error = "",
  activeSessionId = null,
  openingId = null,
  onSelect,
  onRefresh,
  accent = { color: "#60a5fa", colorRgb: "96,165,250" },
}) {
  if (!open) return null;

  const { color, colorRgb } = accent;

  return (
    <div
      style={{
        position: "absolute",
        top: 52,
        left: 0,
        right: 0,
        bottom: 0,
        background: "var(--color-surface)",
        display: "flex",
        flexDirection: "column",
        zIndex: 20,
        animation: "ck-history-in 0.16s ease-out",
      }}
    >
      {/* ── Panel header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          borderBottom: "0.5px solid var(--color-gray-200)",
          flexShrink: 0,
        }}
      >
        <p
          style={{
            flex: 1,
            minWidth: 0,
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            color: "var(--color-gray-900)",
            letterSpacing: "-0.01em",
          }}
        >
          Recent chats
          {!loading && sessions.length > 0 && (
            <span style={{ color: "var(--color-gray-400)", fontWeight: 500 }}>
              {" "}
              ({sessions.length})
            </span>
          )}
        </p>

        <IconButton label="Refresh" onClick={onRefresh} accent={accent}>
          <RotateCw
            style={{
              width: 13,
              height: 13,
              animation: loading ? "ck-history-spin 0.8s linear infinite" : "none",
            }}
          />
        </IconButton>
        <IconButton label="Close history" onClick={onClose} accent={accent}>
          <X style={{ width: 13, height: 13 }} />
        </IconButton>
      </div>

      {/* ── List ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 8,
          scrollbarWidth: "thin",
          scrollbarColor: "var(--color-gray-300) transparent",
        }}
      >
        {loading && sessions.length === 0 ? (
          // Per-row shimmer rather than a pane-wide spinner, so the list's
          // shape is already on screen when the rows land.
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  height: 52,
                  borderRadius: 10,
                  background: "var(--color-gray-100)",
                }}
              />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            title="Couldn't load your chats"
            body={error}
            action={{ label: "Try again", onClick: onRefresh }}
            accent={accent}
          />
        ) : sessions.length === 0 ? (
          <EmptyState
            title="No saved chats yet"
            body="Conversations you have with the assistant show up here."
            accent={accent}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {sessions.map((session) => {
              const id = session.session_id;
              const isActive = id === activeSessionId;
              const isOpening = id === openingId;
              // Brand-led for an imported-site chat, the same way the home
              // rail's cards read — otherwise every row here is the same block
              // of scraped fields truncated at the same word.
              const { brand, detail } = parseSessionSummary(session.title);

              return (
                <button
                  key={id}
                  onClick={() => onSelect?.(id)}
                  disabled={Boolean(openingId)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "9px 10px",
                    borderRadius: 10,
                    border: isActive
                      ? `0.5px solid rgba(${colorRgb},0.45)`
                      : "0.5px solid transparent",
                    background: isActive
                      ? `rgba(${colorRgb},0.10)`
                      : "transparent",
                    cursor: openingId ? "default" : "pointer",
                    opacity: openingId && !isOpening ? 0.5 : 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (isActive || openingId) return;
                    e.currentTarget.style.background = "var(--color-gray-100)";
                  }}
                  onMouseLeave={(e) => {
                    if (isActive) return;
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span
                    style={{
                      // Bolder for a brand — it's a name, not a sentence.
                      fontSize: 12,
                      fontWeight: brand ? 700 : 600,
                      color: isActive ? color : "var(--color-gray-900)",
                      display: "block",
                      width: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {brand || detail}
                  </span>

                  {brand && detail && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--color-gray-400)",
                        display: "block",
                        width: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {detail}
                    </span>
                  )}

                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 10,
                      color: "var(--color-gray-400)",
                    }}
                  >
                    <span>{formatSessionDate(session.started)}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <MessageSquare style={{ width: 10, height: 10 }} />
                      {session.messages ?? 0}
                    </span>
                    {session.status === "complete" && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                          color: "#22c55e",
                        }}
                      >
                        <CheckCircle2 style={{ width: 10, height: 10 }} />
                        Designs
                      </span>
                    )}
                    {isOpening && (
                      <span style={{ color, fontWeight: 600 }}>Opening…</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes ck-history-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ck-history-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/** Square icon button matching the chat header's back button. */
function IconButton({ children, label, onClick, accent }) {
  const { color, colorRgb } = accent;
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: 26,
        height: 26,
        borderRadius: 8,
        border: "0.5px solid var(--color-gray-200)",
        background: "var(--color-gray-100)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--color-gray-500)",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `rgba(${colorRgb},0.12)`;
        e.currentTarget.style.color = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--color-gray-100)";
        e.currentTarget.style.color = "var(--color-gray-500)";
      }}
    >
      {children}
    </button>
  );
}

function EmptyState({ title, body, action, accent }) {
  return (
    <div
      style={{
        padding: "40px 20px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 700,
          color: "var(--color-gray-700)",
        }}
      >
        {title}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 11,
          color: "var(--color-gray-400)",
          maxWidth: 260,
        }}
      >
        {body}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 6,
            padding: "5px 12px",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            color: accent.color,
            background: `rgba(${accent.colorRgb},0.12)`,
            border: `0.5px solid rgba(${accent.colorRgb},0.25)`,
            cursor: "pointer",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
