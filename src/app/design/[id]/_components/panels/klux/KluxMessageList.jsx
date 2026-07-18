"use client";

import React, { useEffect, useRef } from "react";
import KluxLogoIcon from "./KluxLogoIcon";

/**
 * KluxMessageList — the conversation. User turns render as gradient bubbles
 * (Canva-style), assistant turns as plain text under the Klux mark, and while a
 * request is in flight a "Preparing everything…" indicator trails the list. The
 * view auto-scrolls to the newest turn.
 */
export default function KluxMessageList({ messages, working }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, working]);

  return (
    <div className="flex flex-col gap-4">
      {messages.map((m) =>
        m.role === "user" ? (
          <div key={m.id} className="flex justify-end">
            <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#155dfc] px-4 py-2.5 text-sm text-white">
              {m.text}
            </p>
          </div>
        ) : (
          <div key={m.id} className="flex items-start gap-2">
            <Avatar />
            <p className="max-w-[85%] pt-1 text-sm leading-relaxed text-gray-700">
              {m.text}
            </p>
          </div>
        ),
      )}

      {working && (
        <div className="flex items-center gap-2">
          <Avatar spinning />
          <span className="text-sm font-semibold text-[#155dfc] animate-pulse">
            Preparing everything…
          </span>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}

/** The Klux logo mark used as the assistant avatar, on a light disc so the blue
 * logo reads clearly. */
function Avatar({ spinning }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 p-1.5 ring-1 ring-[#155dfc]/15">
      <KluxLogoIcon
        className={`h-full w-full object-contain ${spinning ? "animate-spin" : ""}`}
      />
    </span>
  );
}
