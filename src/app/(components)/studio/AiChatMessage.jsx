"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Sparkles, User, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MessageAttachments from "./MessageAttachments";

// Long messages collapse to this height with a "See more" toggle.
const COLLAPSED_MAX_HEIGHT = 220;

/**
 * A message the USER wrote, shown exactly as they typed it.
 *
 * Deliberately NOT Markdown. Markdown folds a single newline into a space, so
 * anything the user laid out over several lines used to arrive as one run-on
 * paragraph. `white-space: pre-wrap` keeps every line break, blank line and run
 * of indentation, while still wrapping long lines at the bubble's edge — and it
 * means characters like *, _ and # appear literally instead of being eaten as
 * formatting syntax.
 */
function UserMessageContent({ content }) {
  if (!content) return null;
  return (
    <div
      style={{
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
      }}
    >
      {content}
    </div>
  );
}

/** A message the ASSISTANT wrote — full Markdown, since replies are authored in it. */
function MessageContent({ content, color }) {
  if (!content) return null;
  return (
    <div className="ck-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: (props) => <p style={{ margin: "0 0 8px" }} {...props} />,
          strong: (props) => (
            <strong style={{ color, fontWeight: 700 }} {...props} />
          ),
          em: (props) => <em style={{ fontStyle: "italic" }} {...props} />,
          ul: (props) => (
            <ul style={{ margin: "0 0 8px", paddingLeft: 18 }} {...props} />
          ),
          ol: (props) => (
            <ol style={{ margin: "0 0 8px", paddingLeft: 18 }} {...props} />
          ),
          li: (props) => <li style={{ margin: "2px 0" }} {...props} />,
          a: (props) => (
            <a
              style={{ color, textDecoration: "underline" }}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          h1: (props) => (
            <h1 style={{ fontSize: 15, fontWeight: 700, margin: "4px 0 8px" }} {...props} />
          ),
          h2: (props) => (
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: "4px 0 6px" }} {...props} />
          ),
          h3: (props) => (
            <h3 style={{ fontSize: 13, fontWeight: 700, margin: "4px 0 6px" }} {...props} />
          ),
          code: (props) => (
            <code
              style={{
                background: "rgba(0,0,0,0.06)",
                padding: "1px 5px",
                borderRadius: 4,
                fontSize: 11.5,
                fontFamily: "monospace",
                wordBreak: "break-word",
              }}
              {...props}
            />
          ),
          pre: (props) => (
            <pre
              style={{
                background: "rgba(0,0,0,0.06)",
                padding: "10px 12px",
                borderRadius: 8,
                margin: "0 0 8px",
                overflowX: "auto",
                fontSize: 11.5,
              }}
              {...props}
            />
          ),
          blockquote: (props) => (
            <blockquote
              style={{
                borderLeft: "3px solid rgba(0,0,0,0.12)",
                margin: "0 0 8px",
                paddingLeft: 10,
                color: "#4b5563",
              }}
              {...props}
            />
          ),
          hr: (props) => (
            <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "10px 0" }} {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function AiChatMessage({ message, config }) {
  const isUser = message.role === "user";
  const color = config?.color || "#7c3aed";
  const colorRgb = config?.colorRgb || "124,58,237";

  // The text is exactly what the user typed; any images they attached ride
  // alongside on `message.images` (they are never folded into the content).
  const text = message.content || "";
  const urls = useMemo(() => message.images || [], [message.images]);

  const [copied, setCopied] = useState(false);

  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    setIsOverflowing(el.scrollHeight > COLLAPSED_MAX_HEIGHT + 8);
  }, [text]);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

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
        {/* Files ride ABOVE the text — you see what was sent before reading it,
            and they sit outside the collapse so "See more" never hides them. */}
        <MessageAttachments urls={urls} isUser={isUser} />

        {/* Collapsible message body */}
        <div
          ref={contentRef}
          style={{
            position: "relative",
            maxHeight: !expanded && isOverflowing ? COLLAPSED_MAX_HEIGHT : "none",
            overflow: !expanded && isOverflowing ? "hidden" : "visible",
          }}
        >
          {isUser ? (
            <UserMessageContent content={text} />
          ) : (
            <MessageContent content={text} color={color} />
          )}

          {/* fade-out hint while collapsed */}
          {!expanded && isOverflowing && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 36,
                background: `linear-gradient(to bottom, rgba(${
                  isUser ? "255,255,255" : "248,250,252"
                },0), rgba(${isUser ? "255,255,255" : "248,250,252"},0.95))`,
                pointerEvents: "none",
              }}
            />
          )}
        </div>

        {isOverflowing && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{
              marginTop: 4,
              padding: 0,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              color,
            }}
          >
            {expanded ? "See less" : "See more"}
          </button>
        )}

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

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 5,
            flexDirection: isUser ? "row-reverse" : "row",
          }}
        >
          {text && (
            <button
              type="button"
              onClick={handleCopy}
              title={copied ? "Copied!" : "Copy"}
              aria-label="Copy message"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                lineHeight: 0,
                color: copied
                  ? "#22c55e"
                  : isUser
                    ? `rgba(${colorRgb}, 0.6)`
                    : "#9ca3af",
              }}
            >
              {copied ? (
                <Check style={{ width: 12, height: 12 }} />
              ) : (
                <Copy style={{ width: 12, height: 12 }} />
              )}
            </button>
          )}
          <span
            style={{
              fontSize: 10,
              color: isUser ? `rgba(${colorRgb}, 0.55)` : "#9ca3af",
            }}
          >
            {message.timestamp
              ? new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
              : ""}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes ck-msg-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ck-md > :last-child { margin-bottom: 0 !important; }
        .ck-md table { border-collapse: collapse; margin: 0 0 8px; font-size: 11.5px; }
        .ck-md th, .ck-md td { border: 1px solid #e5e7eb; padding: 4px 8px; text-align: left; }
      `}</style>
    </div>
  );
}