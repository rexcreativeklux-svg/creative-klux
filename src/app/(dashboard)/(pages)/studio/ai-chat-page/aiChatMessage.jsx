"use client";

import React from "react";
import { Sparkles, User } from "lucide-react";

export default function AiChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
          ${isUser
            ? "bg-primary-600 text-black"
            : "bg-blue-50 border border-blue-100 text-primary-600"
          }`}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? "bg-primary-600 text-blue-600 rounded-tr-md"
            : "bg-white border border-gray-100 text-gray-800 rounded-tl-md shadow-sm"
          }`}
      >
        {/* Render content — support **bold** markdown */}
        <MessageContent content={message.content} isUser={isUser} />

        {/* Image if present */}
        {message.image_url && (
          <img
            src={message.image_url}
            alt="Generated creative"
            className="mt-3 rounded-xl w-full max-w-xs object-cover border border-white/20"
          />
        )}

        <p
          className={`text-[10px] mt-1.5 ${
            isUser ? "text-black text-right" : "text-gray-400"
          }`}
        >
          {message.timestamp
            ? new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
        </p>
      </div>
    </div>
  );
}

// Inline parser: **bold** → <strong>
function MessageContent({ content, isUser }) {
  if (!content) return null;

  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className={isUser ? "text-white" : "text-gray-900"}>
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}