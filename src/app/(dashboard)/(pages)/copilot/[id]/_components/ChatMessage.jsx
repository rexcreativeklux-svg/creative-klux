"use client";

/**
 * ChatMessage — one turn in a copilot conversation.
 *
 * The copilot speaks as PAGE TEXT, not in a bubble: its answers are the content
 * of the screen (a brief, a list of flagged designs), and boxing them makes a
 * report look like a chat aside. The user's own lines do get a bubble — that is
 * what separates "what I asked" from "what it said" when scanning back.
 *
 * @param {Object} props
 * @param {Object} props.message  { id, role: "assistant"|"user", text, body?, at,
 *   pending?, error? }
 *   `text` is the plain-text truth of the message — copy and read-aloud use it.
 *   `body` is optional rich JSX for the same words (the greeting bolds what the
 *   copilot can work on). One is not derived from the other, so a message that
 *   has both must keep them saying the same thing.
 *   `pending` — asked, nothing back yet. `error` — the request failed, and
 *   `text` is the server's own words.
 * @param {Object} props.copilot  Whose conversation this is (names the speaker).
 */

import { AlertTriangle, Copy, Volume2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import CopilotAvatar from "../../_components/CopilotAvatar";

/** Read a message aloud with the browser's own voice, if it has one. */
const speak = (text) => {
  const synth = typeof window !== "undefined" && window.speechSynthesis;
  if (!synth) {
    toast.error("This browser can't read messages aloud.");
    return;
  }
  synth.cancel(); // stop whatever is mid-sentence, rather than queueing behind it
  synth.speak(new SpeechSynthesisUtterance(text));
};

export default function ChatMessage({ message, copilot }) {
  const { role, text, body, at, pending, error } = message;

  if (role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[80%] rounded-2xl bg-blue-600 px-4 py-2.5 text-[15px] leading-relaxed text-white whitespace-pre-wrap">
          {text}
        </p>
      </div>
    );
  }

  return (
    <div className="group">
      <div className="flex items-center gap-2">
        <CopilotAvatar copilot={copilot} size="sm" />
        <p className="text-[13px] font-semibold text-gray-900">{copilot.name}</p>
      </div>

      {pending ? (
        // Three dots rather than a spinner: a spinner in the body of a message
        // reads as the page loading, this reads as someone about to speak.
        <div className="mt-3 flex items-center gap-1.5" aria-label="Thinking">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="h-1.5 w-1.5 rounded-full bg-gray-300 animate-pulse"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      ) : error ? (
        /* ⚠️ A FAILURE IS NOT THE COPILOT SPEAKING. Rendered as page text in the
           same voice as an answer, "500 — Target class [CopilotController] does
           not exist" reads as something the copilot said about itself, which is
           both untrue and unactionable. The box, the icon and the mono type say
           this came from the server, and the text is left exactly as the server
           worded it because that sentence is what the backend dev needs. */
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3.5">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-red-700">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Request failed
          </p>
          <p className="mt-1.5 font-mono text-[12px] leading-relaxed text-red-900 whitespace-pre-wrap wrap-break-word">
            {text}
          </p>
        </div>
      ) : (
        <div className="mt-3 text-[17px] leading-relaxed text-gray-900 whitespace-pre-wrap">
          {body ?? text}
        </div>
      )}

      {/* No timestamp / copy / read-aloud while pending — there is nothing yet
          to copy or read, and the row would flicker in for a moment and change. */}
      <div
        className={`mt-3 flex items-center gap-1 text-gray-400 ${pending ? "hidden" : ""}`}
      >
        {/* ⚠️ suppressHydrationWarning: the message is stamped when the tree is
            built, so the server's copy and the client's hydration are a moment
            apart and can land either side of a minute boundary. The mismatch is
            expected here — the alternative, stamping it in an effect, trips this
            repo's no-setState-in-effect rule and flashes an empty row first. */}
        <span className="text-[11px]" suppressHydrationWarning>
          {format(at, "h:mm a")}
        </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(text);
            toast.success("Copied");
          }}
          aria-label="Copy message"
          className="ml-1.5 p-1 rounded-md opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-900 transition-all cursor-pointer"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => speak(text)}
          aria-label="Read message aloud"
          className="p-1 rounded-md opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-900 transition-all cursor-pointer"
        >
          <Volume2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
