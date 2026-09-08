"use client";

/**
 * useConversationList — one copilot's past threads, for the panel's history.
 *
 * ⚠️ THE INDEX IS NESTED: `GET /copilots/{id}/conversations`. There is no
 * `/copilot/conversations` — that 404s — which is why this looked impossible
 * for a while. The singular `copilot/conversations/{id}` route fetches ONE
 * thread and is a different route entirely.
 *
 * Refetches when `refreshKey` changes, so sending the first message in a brand
 * new thread makes it appear in the list without a reload.
 */

import { useEffect, useState } from "react";
import { conversationRows, listConversations } from "../../_data/copilotApi";
import { useConversationsVersion } from "./conversationsChanged";

/** A readable label for a thread the server may not have titled. */
export function conversationTitle(row, fallback = "Untitled conversation") {
  const direct = row?.title || row?.name || row?.subject;
  if (direct) return direct;
  // Failing a title, the opening message is what the user would recognise it
  // by — the same thing every chat app falls back to.
  const first =
    row?.first_message || row?.last_message || row?.preview || row?.snippet;
  if (typeof first === "string" && first.trim()) {
    const line = first.trim().replace(/\s+/g, " ");
    return line.length > 48 ? `${line.slice(0, 47)}…` : line;
  }
  return fallback;
}

export function useConversationList(copilotId, refreshKey = 0) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  // Bumped when a send creates a conversation. Without it the panel would still
  // say "No conversations yet" about the thread on screen — the URL does not
  // change on a send, so nothing else would prompt a refetch.
  const version = useConversationsVersion();

  // ⚠️ State is set only in the callbacks, never synchronously in the effect
  // body — this repo's compiler rules reject the latter. `alive` drops a
  // response that arrives after the copilot has changed underneath it.
  useEffect(() => {
    if (!copilotId) return undefined;
    let alive = true;
    listConversations(copilotId)
      .then((data) => {
        if (alive) setConversations(conversationRows(data));
      })
      // A history panel that cannot load is not worth a toast over the page —
      // it renders empty, and every other part of the screen still works.
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [copilotId, refreshKey, version]);

  return { conversations, loading };
}
