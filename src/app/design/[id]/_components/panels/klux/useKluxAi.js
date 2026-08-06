"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

// Local id generator for chat messages (stable across re-renders).
let __mid = 0;
const nextMsgId = () => `m_${++__mid}`;

/**
 * useKluxAi — owns the Klux AI conversation: the message list, the composer
 * value, the working flag, and send/stop. The assistant call lives behind
 * runKluxAi so this hook stays about state, not transport.
 *
 * @param {{
 *   editor?: { toDesign?: () => object },
 *   autoSendPrompt?: string,
 *   onAutoSent?: () => void,
 * }} deps
 */
export default function useKluxAi({
  editor,
  autoSendPrompt = "",
  onAutoSent,
} = {}) {
  const { aiRedesign } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [working, setWorking] = useState(false);
  const abortRef = useRef(null);

  const push = (msg) =>
    setMessages((prev) => [...prev, { id: nextMsgId(), ...msg }]);

  const send = async (text) => {
    // `text` is the seeded prompt from a suggestion chip; the composer's Send
    // button passes a click event, and Enter passes nothing — in both cases
    // fall back to the current input rather than calling .trim() on an event.
    const prompt = (typeof text === "string" ? text : input).trim();
    if (!prompt || working) return;

    setInput("");
    push({ role: "user", text: prompt });
    setWorking(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Sends the live design (canvas) + prompt to POST /creatives/ai-redesign.
      const res = await aiRedesign({
        prompt,
        design: editor?.toDesign?.(),
        signal: controller.signal,
      });

      if (res?.aborted || controller.signal.aborted) {
        push({ role: "assistant", text: "Stopped." });
      } else if (!res?.ok) {
        push({
          role: "assistant",
          text: res?.message || "Klux AI ran into a problem. Try again.",
        });
      } else {
        // Response shape: { name, canvas: { canvas, elements } } — the inner
        // `canvas` IS the { canvas, elements } design, so apply it to the editor
        // (undoable + autosaves via replaceDesign).
        const design = res.data?.canvas;
        if (design && Array.isArray(design.elements)) {
          editor?.replaceDesign?.(design);
          push({
            role: "assistant",
            text: res.reply || "Done — I've updated your design.",
          });
        } else {
          push({ role: "assistant", text: res.reply || "Done." });
        }
      }
    } catch (e) {
      if (e?.name === "AbortError" || controller.signal.aborted) {
        push({ role: "assistant", text: "Stopped." });
      } else {
        toast.error(e?.message || "Klux AI ran into a problem. Try again.");
      }
    } finally {
      setWorking(false);
      abortRef.current = null;
    }
  };

  // Auto-send: an entry point (e.g. "Edit with Ai") hands us a prompt to fire
  // the moment the panel mounts, so the user lands in a redesign that is
  // already running instead of a composer they still have to submit. The ref
  // keeps it to a single turn — React StrictMode re-runs mount effects in dev,
  // and one redesign request per entry is the whole point.
  const autoSentRef = useRef(false);
  useEffect(() => {
    const seed = autoSendPrompt.trim();
    if (!seed || autoSentRef.current) return;
    autoSentRef.current = true;
    console.log("✨ Klux AI: auto-sending the seeded prompt");
    // Tell the owner the seed is spent before the (async) turn starts, so a
    // remount of this panel doesn't hand us the same prompt again.
    onAutoSent?.();
    send(seed);
    // Mount-only: the seed is a one-off hand-off from the entry point, not a
    // reactive input, and `send` is re-created on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = () => abortRef.current?.abort();
  const reset = () => {
    stop();
    setMessages([]);
  };

  return { messages, input, setInput, working, send, stop, reset };
}
