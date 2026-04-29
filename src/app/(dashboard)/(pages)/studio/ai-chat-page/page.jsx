"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, Tv2, Share2, Palette, Wand2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AiChatMessage from "./aiChatMessage";
import AiChatInput from "./aiChatInput";
import AiChatTypingIndicator from "./aiChatTypingIndicator";

const CREATIVE_CONFIG = {
  ads_creative: {
    label: "Ads Creative",
    icon: Tv2,
    color: "#60a5fa",
    colorRgb: "96,165,250",
    greeting: "Hi! I'm your **Ads Creative** assistant 👋\n\nTell me about the ad you want to create — platform, audience, product — and I'll craft something that converts.",
    placeholder: "e.g. Create a Meta ad for my skincare brand...",
  },
  social_creative: {
    label: "Social Creative",
    icon: Share2,
    color: "#34d399",
    colorRgb: "52,211,153",
    greeting: "Hey! I'm your **Social Creative** assistant ✨\n\nWhat kind of social content are we making today?",
    placeholder: "e.g. Design an Instagram carousel...",
  },
  designer_creative: {
    label: "Designer",
    icon: Palette,
    color: "#c084fc",
    colorRgb: "192,132,252",
    greeting: "Hello! I'm your **Designer** assistant 🎨\n\nWhat are we designing today? Tell me the vibe, purpose, or brand.",
    placeholder: "e.g. Design a minimalist logo...",
  },
  magic_studio: {
    label: "Magic Studio",
    icon: Wand2,
    color: "#fb7185",
    colorRgb: "251,113,133",
    greeting: "Welcome to **Magic Studio** ✨\n\nWhat would you like to generate today? Images, video, audio — just describe your vision.",
    placeholder: "e.g. Generate a futuristic city at dusk...",
  },
  general: {
    label: "Creative Studio",
    icon: Sparkles,
    color: "#c084fc",
    colorRgb: "192,132,252",
    greeting: "Hi! I'm **CreativeKlux AI** 🚀\n\nWhat would you like to make today?",
    placeholder: "Describe what you'd like to create...",
  },
};

export default function AiCreativeChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { creativeAiChat } = useAuth();

  const creativeType = searchParams.get("creative") || "general";
  const config = CREATIVE_CONFIG[creativeType] || CREATIVE_CONFIG.general;
  const Icon = config.icon;

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: config.greeting,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, [creativeType]);

  const handleSend = async (content) => {
    const userMessage = { role: "user", content, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const result = await creativeAiChat({ message: content, creativeType, history });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.ok ? result.reply : result.message || "Something went wrong.",
          image_url: result.data?.image_url || null,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Oops! Something went wrong.", timestamp: new Date().toISOString() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-20 h-full"
      style={{
        display: "flex",
        flexDirection: "column",
        background: "#010b1a",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient background glows */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", left: "10%", width: "45vw", height: "45vw", borderRadius: "50%", background: `radial-gradient(circle, rgba(${config.colorRgb},0.08) 0%, transparent 70%)` }} />
        <div style={{ position: "absolute", bottom: "5%", right: "5%", width: "35vw", height: "35vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(192,132,252,0.06) 0%, transparent 70%)" }} />
      </div>

      {/* ── Header ── */}
      <header className="px-8"
        style={{
          position: "relative",
          zIndex: 10,
          height: 60,
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(1,11,26,0.85)",
          backdropFilter: "blur(16px)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.55)", cursor: "pointer", transition: "all 0.15s", flexShrink: 0 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
        >
          <ArrowLeft style={{ width: 15, height: 15 }} />
        </button>

        {/* Icon */}
        <div style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${config.colorRgb},0.15)`, border: `1px solid rgba(${config.colorRgb},0.3)`, flexShrink: 0 }}>
          <Icon style={{ width: 16, height: 16, color: config.color }} strokeWidth={1.75} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "-0.01em" }}>{config.label}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>Powered by CreativeKlux AI</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px rgba(52,211,153,0.7)", display: "inline-block" }} />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Online</span>
        </div>
      </header>

      {/* ── Messages ── */}
      <main
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          overflowY: "auto",
          padding: "24px 16px",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.1) transparent",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.map((msg, i) => (
            <AiChatMessage key={i} message={msg} config={config} />
          ))}
          {isLoading && <AiChatTypingIndicator config={config} />}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ── Input ── */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          zIndex: 10,
          background: "linear-gradient(to top, #010b1a 60%, transparent)",
          padding: "16px 16px 24px",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <AiChatInput onSend={handleSend} isLoading={isLoading} placeholder={config.placeholder} config={config} />
        </div>
      </div>
    </div>
  );
}