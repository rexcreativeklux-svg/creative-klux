"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Sparkles, ArrowLeft, Tv2, Share2, Palette, Wand2,
  CheckCircle2, ImageIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AiChatMessage from "./aiChatMessage";
import AiChatInput from "./aiChatInput";
import AiChatTypingIndicator from "./aiChatTypingIndicator";
import AiPreviewIdle from "./aiPreviewIdle";

/* ─── config ───────────────────────────────────────────────── */

const CREATIVE_CONFIG = {
  ads_creative: {
    label: "Ads Creative",
    icon: Tv2,
    color: "#60a5fa",
    colorRgb: "96,165,250",
    colorLight: "#eff6ff",
    greeting:
      "Hi! I'm your **Ads Creative** assistant ✦\n\nTell me about the ad you want to create — platform, audience, product — and I'll craft something that converts.",
    placeholder: "e.g. Create a Meta ad for my skincare brand…",
  },
  social_creative: {
    label: "Social Creative",
    icon: Share2,
    color: "#34d399",
    colorRgb: "52,211,153",
    colorLight: "#ecfdf5",
    greeting:
      "Hey! I'm your **Social Creative** assistant ✦\n\nWhat kind of social content are we making today?",
    placeholder: "e.g. Design an Instagram carousel…",
  },
  designer_creative: {
    label: "Designer",
    icon: Palette,
    color: "#c084fc",
    colorRgb: "192,132,252",
    colorLight: "#f3e8ff",
    greeting:
      "Hello! I'm your **Designer** assistant ✦\n\nWhat are we designing today? Tell me the vibe, purpose, or brand.",
    placeholder: "e.g. Design a minimalist logo…",
  },
  magic_studio: {
    label: "Magic Studio",
    icon: Wand2,
    color: "#fb7185",
    colorRgb: "251,113,133",
    colorLight: "#fff1f2",
    greeting:
      "Welcome to **Magic Studio** ✦\n\nWhat would you like to generate? Images, video, audio — just describe your vision.",
    placeholder: "e.g. Generate a futuristic city at dusk…",
  },
  general: {
    label: "Creative Studio",
    icon: Sparkles,
    color: "#003dda",
    colorRgb: "0,61,218",
    colorLight: "#f3e8ff",
    greeting:
      "Hi! I'm **CreativeKlux AI** ✦\n\nWhat would you like to make today?",
    placeholder: "Describe what you'd like to create…",
  },
};

const TYPE_ORDER = [
  "general",
  "ads_creative",
  "social_creative",
  "designer_creative",
  "magic_studio",
];

/* ─── helpers ───────────────────────────────────────────────── */

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ─── Preview panel ─────────────────────────────────────────── */

function PreviewPanel({ result, config }) {
  const { color, colorRgb, colorLight } = config;

  if (!result) return <AiPreviewIdle config={config} />;

  return (
    <div
      style={{
        position: "absolute",
        inset: 16,
        background: "#fff",
        borderRadius: 14,
        border: "0.5px solid rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        animation: "ck-slide-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
      }}
    >
      {/* main area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${colorLight} 0%, #fff 100%)`,
          padding: 24,
          textAlign: "center",
        }}
      >
        {result.image_url ? (
          <img
            src={result.image_url}
            alt="Generated creative"
            style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 10, objectFit: "cover" }}
          />
        ) : (
          <div>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: "50%",
                background: `rgba(${colorRgb},0.13)`,
                border: `1.5px solid rgba(${colorRgb},0.3)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
              }}
            >
              <CheckCircle2 style={{ width: 22, height: 22, color }} strokeWidth={1.8} />
            </div>
            <p
              style={{
                fontWeight: 600,
                fontSize: 13,
                color: "#0f0f0f",
                marginBottom: 6,
                fontFamily: "var(--ck-font-display, inherit)",
              }}
            >
              Creative Generated
            </p>
            <p
              style={{
                fontSize: 11,
                color: "#6b6b6b",
                lineHeight: 1.55,
                maxWidth: 210,
                margin: "0 auto",
              }}
            >
              {result.summary}
            </p>
          </div>
        )}
      </div>

      {/* footer */}
      <div
        style={{
          padding: "9px 14px",
          borderTop: "0.5px solid rgba(0,0,0,0.08)",
          fontSize: 11,
          color: "#6b6b6b",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#22c55e",
            display: "inline-block",
          }}
        />
        Ready to export · {result.time}
      </div>

      <style>{`
        @keyframes ck-slide-in {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────── */

export default function AiCreativeChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { creativeAiChat } = useAuth();

  const creativeType = searchParams.get("creative") || "general";
  const config = CREATIVE_CONFIG[creativeType] || CREATIVE_CONFIG.general;
  const Icon = config.icon;
  const { color, colorRgb, colorLight } = config;

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const messagesEndRef = useRef(null);
  const hasInitialized = useRef(false);

  const initialMessage = searchParams.get("initialMessage") || "";


  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    setPreviewResult(null);

    if (initialMessage.trim()) {
      const userMsg = {
        role: "user",
        content: initialMessage,
        timestamp: new Date().toISOString(),
      };

      setMessages([userMsg]);

      handleInitialSend(initialMessage);
      return;
    }

    setMessages([
      {
        role: "assistant",
        content: config.greeting,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, [creativeType, initialMessage]);



  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = useCallback(
    async (content) => {
      const userMsg = { role: "user", content, timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const history = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const result = await creativeAiChat({ message: content, creativeType, history });

        const reply = result.ok
          ? result.reply
          : result.message || "Something went wrong.";

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: reply,
            image_url: result.data?.image_url || null,
            timestamp: new Date().toISOString(),
          },
        ]);

        /* push to preview panel */
        setPreviewResult({
          summary: reply.replace(/\*\*/g, "").slice(0, 120) + (reply.length > 120 ? "…" : ""),
          image_url: result.data?.image_url || null,
          time: nowTime(),
        });
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Oops! Something went wrong.",
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, creativeType, creativeAiChat]
  );

  const handleInitialSend = useCallback(async (content) => {
    setIsLoading(true);

    try {
      const result = await creativeAiChat({
        message: content,
        creativeType,
        history: [],
      });

      const reply = result.ok
        ? result.reply
        : result.message || "Something went wrong.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
          image_url: result.data?.image_url || null,
          timestamp: new Date().toISOString(),
        },
      ]);

      setPreviewResult({
        summary: reply.replace(/\*\*/g, "").slice(0, 120) + (reply.length > 120 ? "…" : ""),
        image_url: result.data?.image_url || null,
        time: nowTime(),
      });

    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Oops! Something went wrong.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [creativeType, creativeAiChat]);


  /* ── render ── */
  return (
    <div className="pt-16 h-full"
      style={{
        display: "flex",
        flexDirection: "column",
        fontFamily:
          "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >


      {/* ── Body ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>


        {/* ── Chat panel ── */}
        <div
          style={{
            width: "42%",
            minWidth: 300,
            maxWidth: 480,
            display: "flex",
            flexDirection: "column",
            borderRight: "0.5px solid rgba(0,0,0,0.08)",
            background: "#fff",
          }}
        >
          {/* ── Header ── */}
          <header className="px-5"
            style={{
              height: 52,
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderBottom: "0.5px solid rgba(0,0,0,0.08)",
              background: "#fff",
              flexShrink: 0,
              zIndex: 10,
            }}
          >
            {/* back */}
            <button
              onClick={() => router.back()}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: "0.5px solid rgba(0,0,0,0.1)",
                background: "#f5f5f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#888",
                cursor: "pointer",
                flexShrink: 0,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colorLight;
                e.currentTarget.style.color = color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f5f5f5";
                e.currentTarget.style.color = "#888";
              }}
            >
              <ArrowLeft style={{ width: 13, height: 13 }} />
            </button>

            {/* type icon */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: `rgba(${colorRgb},0.12)`,
                border: `0.5px solid rgba(${colorRgb},0.25)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon style={{ width: 14, height: 14, color }} strokeWidth={1.8} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#0f0f0f",
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                {config.label}
              </p>
              <p style={{ fontSize: 10, color: "#b0b0b0", margin: 0 }}>
                Powered by CreativeKlux AI
              </p>
            </div>

            {/* status */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                flexShrink: 0,
                marginLeft: 4,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 0 2px rgba(34,197,94,0.25)",
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: 10, color: "#b0b0b0" }}>Online</span>
            </div>
          </header>

          {/* messages */}
          <main
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "18px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(0,0,0,0.08) transparent",
            }}
          >
            {messages.map((msg, i) => (
              <AiChatMessage key={i} message={msg} config={config} />
            ))}
            {isLoading && <AiChatTypingIndicator config={config} />}
            <div ref={messagesEndRef} />
          </main>

          {/* input */}
          <div
            style={{
              padding: "10px 12px 14px",
              background: "#fff",
              borderTop: "0.5px solid rgba(0,0,0,0.07)",
              flexShrink: 0,
            }}
          >
            <AiChatInput
              onSend={handleSend}
              isLoading={isLoading}
              placeholder={config.placeholder}
              config={config}
            />
          </div>
        </div>

        {/* ── Preview panel ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "#f5f5f5",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* preview header */}
          <div
            style={{
              height: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 16px",
              borderBottom: "0.5px solid rgba(0,0,0,0.08)",
              background: "#fff",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#b0b0b0",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              Preview
            </span>
            <span
              style={{
                fontSize: 10,
                padding: "3px 9px",
                borderRadius: 20,
                background: previewResult
                  ? `rgba(${colorRgb},0.1)`
                  : "rgba(0,0,0,0.05)",
                color: previewResult ? color : "#b0b0b0",
                border: `0.5px solid ${previewResult ? `rgba(${colorRgb},0.25)` : "transparent"}`,
                fontWeight: 500,
                transition: "all 0.3s",
              }}
            >
              {previewResult ? "Generated" : "Waiting for input"}
            </span>
          </div>

          {/* preview body */}
          <div
            style={{
              flex: 1,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <PreviewPanel result={previewResult} config={config} />
          </div>
        </div>
      </div>
    </div>
  );
}