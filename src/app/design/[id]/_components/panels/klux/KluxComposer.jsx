"use client";

import React from "react";
import { Plus, Mic, Square, ArrowUp } from "lucide-react";
import { toast } from "sonner";

/**
 * KluxComposer — the "Describe your idea" input. A + (attach) affordance sits
 * bottom-left; bottom-right shows Send when there's text, a Mic when idle, and a
 * Stop button while the assistant is working. Enter sends, Shift+Enter newlines.
 */
export default function KluxComposer({
  value,
  onChange,
  onSend,
  onStop,
  working,
}) {
  const hasText = value.trim().length > 0;

  const soon = (what) => toast.message(`${what} is coming soon.`);

  return (
    <div className="rounded-2xl border border-[#155dfc]/40 bg-surface p-3 focus-within:border-[#155dfc] focus-within:ring-2 focus-within:ring-[#155dfc]/15">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        rows={2}
        placeholder="Describe your idea"
        className="w-full resize-none bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
      />
      <div className="mt-1 flex items-center justify-between">
        <button
          onClick={() => soon("Attachments")}
          title="Add attachment"
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
        >
          <Plus className="h-5 w-5" />
        </button>

        {working ? (
          <button
            onClick={onStop}
            title="Stop"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-white transition hover:bg-gray-700 cursor-pointer"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </button>
        ) : hasText ? (
          <button
            onClick={onSend}
            title="Send"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#155dfc] text-white transition hover:bg-blue-700 cursor-pointer"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => soon("Voice input")}
            title="Voice input"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
          >
            <Mic className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
