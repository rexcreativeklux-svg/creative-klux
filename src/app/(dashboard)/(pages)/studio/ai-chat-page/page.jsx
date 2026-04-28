"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sparkles, ArrowLeft, Tv2, Share2, Palette, Wand2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AiChatMessage from "./aiChatMessage";
import AiChatInput from "./aiChatInput";
import AiChatTypingIndicator from "./aiChatTypingIndicator";

// ── Creative config (no hardcoded colors anymore) ──
const CREATIVE_CONFIG = {
  ads_creative: {
    label: "Ads Creative",
    icon: Tv2,
    greeting:
      "Hi! I'm your **Ads Creative** assistant 👋\n\nTell me about the ad you want to create...",
    placeholder: "e.g. Create a Meta ad for my skincare brand...",
  },
  social_creative: {
    label: "Social Creative",
    icon: Share2,
    greeting:
      "Hey! I'm your **Social Creative** assistant ✨\n\nWhat kind of social content...",
    placeholder: "e.g. Design an Instagram carousel...",
  },
  designer_creative: {
    label: "Designer Creative",
    icon: Palette,
    greeting:
      "Hello! I'm your **Designer Creative** assistant 🎨\n\nWhat are we designing today?",
    placeholder: "e.g. Design a minimalist logo...",
  },
  magic_studio: {
    label: "Magic Studio",
    icon: Wand2,
    greeting:
      "Welcome to **Magic Studio** ✨\n\nWhat would you like to create today?",
    placeholder: "e.g. Generate a futuristic city...",
  },
  general: {
    label: "Creative Studio",
    icon: Sparkles,
    greeting:
      "Hi! I'm **CreativeKlux AI** 🚀\n\nWhat would you like to make today?",
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

  // auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // greeting
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
    const userMessage = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const result = await creativeAiChat({
        message: content,
        creativeType,
        history,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.ok
            ? result.reply
            : result.message || "Something went wrong.",
          image_url: result.data?.image_url || null,
          timestamp: new Date().toISOString(),
        },
      ]);
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
  };

  return (
    <div className="h-screen flex flex-col bg-transparent">
      
      {/* ── Header ── */}
      <header className="h-14 flex items-center px-4 gap-3 flex-shrink-0">

        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-lg flex items-center justify-center 
          text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1">
          <h1 className="text-sm font-semibold text-gray-900">
            {config.label}
          </h1>
          <p className="text-[11px] text-gray-400">
            Powered by CreativeKlux AI
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-gray-400">Online</span>
        </div>
      </header>

      {/* ── Messages ── */}
      <main className="flex-1 overflow-y-auto py-6">
        <div className=" space-y-5">
          {messages.map((msg, i) => (
            <AiChatMessage key={i} message={msg} accentColor="primary" />
          ))}

          {isLoading && <AiChatTypingIndicator />}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ── Sticky Input ── */}
      <div className="sticky bottom-0 z-10 
        bg-white/90 backdrop-blur border-t border-gray-200">

        <div className="max-w-3xl mx-auto px-4 py-3">
          <AiChatInput
            onSend={handleSend}
            isLoading={isLoading}
            placeholder={config.placeholder}
          />
        </div>
      </div>
    </div>
  );
}
