"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export default function AiChatTypingIndicator() {
  return (
    <div className="flex gap-3 flex-row">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-blue-50 border border-blue-100 text-primary-600">
        <Sparkles className="w-4 h-4" />
      </div>

      {/* Animated dots */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary-400 inline-block animate-bounce"
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
          />
        ))}
      </div>
    </div>
  );
}