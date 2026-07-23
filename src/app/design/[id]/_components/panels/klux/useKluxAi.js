"use client";

import { useRef, useState } from "react";
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
 * @param {{ editor?: { toDesign?: () => object }, initialInput?: string }} deps
 */
export default function useKluxAi({ editor, initialInput = "" } = {}) {
  const { aiRedesign } = useAuth();
  const [messages, setMessages] = useState([]);
  // Seeded from `initialInput` so an entry point (e.g. "Edit with Ai") can land
  // the user in the composer with a starter prompt already typed.
  const [input, setInput] = useState(initialInput);
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

  const stop = () => abortRef.current?.abort();
  const reset = () => {
    stop();
    setMessages([]);
  };

  return { messages, input, setInput, working, send, stop, reset };
}
