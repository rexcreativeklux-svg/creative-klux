"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { runKluxAi, KluxNotConnectedError } from "./runKluxAi";

// Local id generator for chat messages (stable across re-renders).
let __mid = 0;
const nextMsgId = () => `m_${++__mid}`;

/**
 * useKluxAi — owns the Klux AI conversation: the message list, the composer
 * value, the working flag, and send/stop. The assistant call lives behind
 * runKluxAi so this hook stays about state, not transport.
 *
 * @param {{ editor?: { toDesign?: () => object } }} deps
 */
export default function useKluxAi({ editor } = {}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [working, setWorking] = useState(false);
  const abortRef = useRef(null);

  const push = (msg) =>
    setMessages((prev) => [...prev, { id: nextMsgId(), ...msg }]);

  const send = async (text) => {
    const prompt = (text ?? input).trim();
    if (!prompt || working) return;

    setInput("");
    push({ role: "user", text: prompt });
    setWorking(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await runKluxAi({
        prompt,
        design: editor?.toDesign?.(),
        signal: controller.signal,
      });
      push({ role: "assistant", text: res?.reply || "Done." });
    } catch (e) {
      if (e?.name === "AbortError" || controller.signal.aborted) {
        push({ role: "assistant", text: "Stopped." });
      } else if (e instanceof KluxNotConnectedError) {
        push({
          role: "assistant",
          text: "Klux AI isn't connected yet — paste the assistant API to bring this to life.",
        });
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
