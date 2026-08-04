"use client";

// /studio/ai-chat-page — loading UI.
//
// A full-bleed route (see NO_PADDING_ROUTES in (dashboard)/layout.js) that runs
// a chat panel and a live preview side by side, so this reproduces the split
// rather than any padded page shape.
//
// The chat pane opens at the user's dragged width, read from the same
// localStorage key and default as useResizablePane — otherwise the divider
// would jump sideways the moment the real page mounts.

import { useState } from "react";
import Skeleton from "@/app/(components)/skeletons/Skeleton";

/** Must match CHAT_PANE_WIDTH_KEY / defaultWidth in the chat page. */
const CHAT_PANE_WIDTH_KEY = "ck.studio.chatPaneWidth";
const DEFAULT_CHAT_WIDTH = 480;

/** The dragged chat-pane width, falling back to the default when unset. */
function useStoredChatWidth() {
  const [width] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_CHAT_WIDTH;
    try {
      const saved = window.localStorage.getItem(CHAT_PANE_WIDTH_KEY);
      const parsed = Number(saved);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CHAT_WIDTH;
    } catch (error) {
      console.error("❌ [chat-loading] couldn't read the saved pane width:", error);
      return DEFAULT_CHAT_WIDTH;
    }
  });
  return width;
}

export default function Loading() {
  const chatWidth = useStoredChatWidth();

  return (
    // pt-16 clears the fixed header, exactly as the page does.
    <div className="flex h-full flex-col pt-16">
      <div className="flex flex-1 overflow-hidden">
        {/* ── Chat pane ─────────────────────────────────────────────────── */}
        <div
          className="flex shrink-0 flex-col bg-surface"
          style={{ width: chatWidth, minWidth: 300 }}
        >
          {/* Header — 52px, matching the real one */}
          <div className="flex h-13 shrink-0 items-center gap-2.5 border-b border-gray-200 px-5">
            <Skeleton w={20} h={20} className="rounded-md" tone="soft" />
            <Skeleton className="h-3 w-32" />
            <div className="flex-1" />
            <Skeleton w={24} h={24} className="rounded-md" tone="soft" />
          </div>

          {/* Message list — alternating user (right) / assistant (left) bubbles */}
          <div className="flex flex-1 flex-col gap-5 overflow-hidden p-5">
            <div className="flex justify-end">
              <Skeleton className="h-14 w-3/5 rounded-2xl" tone="soft" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-full" tone="soft" />
              <Skeleton className="h-3 w-11/12" tone="soft" />
              <Skeleton className="h-3 w-3/4" tone="soft" />
            </div>
            <Skeleton className="aspect-video w-4/5 rounded-xl" tone="soft" />
            <div className="flex justify-end">
              <Skeleton className="h-10 w-2/5 rounded-2xl" tone="soft" />
            </div>
          </div>

          {/* Composer */}
          <div className="shrink-0 border-t border-gray-200 p-4">
            <div className="rounded-2xl border border-gray-200 p-3">
              <Skeleton className="h-3 w-2/5" tone="soft" />
              <div className="mt-4 flex items-center gap-1.5">
                <Skeleton w={28} h={28} className="rounded-lg" tone="soft" />
                <Skeleton className="h-7 w-24 rounded-lg" tone="soft" />
                <div className="flex-1" />
                <Skeleton w={28} h={28} className="rounded-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <div className="w-px shrink-0 bg-gray-200" />

        {/* ── Preview pane ──────────────────────────────────────────────── */}
        <div className="flex flex-1 items-center justify-center overflow-hidden bg-gray-100 p-8">
          <Skeleton className="aspect-square w-full max-w-lg rounded-xl" />
        </div>
      </div>
    </div>
  );
}
