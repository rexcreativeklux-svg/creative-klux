"use client";

/**
 * Conversation — one thread with a copilot, in its two states.
 *
 * EMPTY (a new conversation): a centred hero that greets the user by name and
 * asks what they want, with the composer under it. No starter chips here on
 * purpose — the hero is already the prompt, and a row of suggestions under a
 * question that big reads as the screen answering itself.
 *
 * The question and the line under it rotate ON THE HOUR, not on the load — see
 * the ⚠️ at the top of _data/copilotGreetings.js for why this screen differs
 * from the home hero on that.
 *
 * STARTED: the thread, dated, with the copilot's starters above the composer —
 * that is when "what else can this thing do?" is the live question.
 *
 * ⚠️ State resets by REMOUNT, not by clearing: the page gives this component a
 * `key` taken from the conversation in the URL, so "New conversation" is a
 * navigation like any other and the browser's back button returns to the thread
 * that was open. Nothing in here has to know the button exists.
 *
 * ⚠️ THERE IS NO API YET. Sending posts what the user wrote and answers that the
 * backend is not connected — it does NOT mime a working assistant with canned
 * replies. A demo that answers convincingly teaches the user their copilot is
 * running work it is not.
 *
 * @param {Object} props
 * @param {Object} props.copilot  Whose conversation this is.
 * @param {string} [props.initialDraft]  Text the composer opens with, unsent —
 *   Plugins' "Activate skill" hands `/slug ` over this way, because the user
 *   still has to say what to run it on.
 * @param {string} [props.initialMessage]  Text that has ALREADY been sent —
 *   Workflows' "Send to chat" hands its description over this way, and the
 *   thread opens with it asked and answered. See ../page.jsx for which handoff
 *   belongs to which button.
 */

import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { IDEAS } from "../../_data/ideas";
import { OPENERS, SUBHEADINGS, lineForNow } from "../../_data/copilotGreetings";
import CopilotComposer from "../../_components/CopilotComposer";
import ChatMessage from "./ChatMessage";
import SuggestionChips from "./SuggestionChips";

/**
 * The name to greet someone by. `name` is the profile field, `username` the
 * fallback the sidebar already uses; either can arrive as "Rex Okpara",
 * "rex.creativeklux" or an email, so the greeting takes the first word of it and
 * capitalises that. Empty → the greeting drops the name rather than saying
 * "Hey ,".
 */
const firstName = (user) => {
  const raw = (user?.name || user?.username || "").trim();
  const first = raw.split(/[\s._@-]+/)[0];
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : "";
};

/**
 * The pair one send produces: what was asked, and the answer under it.
 *
 * ⚠️ Shared by the composer's send AND by a workflow arriving pre-sent, so a
 * message the user never typed is built exactly like one they did — same ids,
 * same shape, same reply. Seeding the thread with a hand-rolled message object
 * instead would be a second definition of "a message" to keep in step.
 *
 * @param {string} text
 * @param {number} index  How many messages precede it — ids only need to be
 *   unique within the thread, and this is remounted per conversation.
 */
const exchange = (text, index) => {
  const at = new Date();
  return [
    { id: `u-${index}`, role: "user", text, at },
    {
      id: `a-${index}`,
      role: "assistant",
      at,
      text: "I'm not connected to my backend yet, so I can't run that. Once Copilot is live, this is where I'd pick it up and report back.",
    },
  ];
};

export default function Conversation({
  copilot,
  initialDraft = "",
  initialMessage = "",
}) {
  const { user } = useAuth();
  // ⚠️ Seeded in the INITIALISER, not an effect. The thread has to render in
  // its started state on the first paint — an effect would flash the empty
  // hero ("Hey Rex, …") for a frame before replacing it, which reads as the
  // screen changing its mind about what it is.
  const [messages, setMessages] = useState(() =>
    initialMessage ? exchange(initialMessage, 0) : [],
  );
  const [draft, setDraft] = useState(initialDraft);
  const [showChips, setShowChips] = useState(true);
  const started = messages.length > 0;
  const name = firstName(user);

  // Both lines picked in ONE initialiser so they always change together, and
  // once per mount so the copy holds still while the user is reading it. The
  // pick is derived from the hour, so the server and the client agree without a
  // second render — see the ⚠️ at the top of _data/copilotGreetings.
  const [hero] = useState(() => ({
    opener: lineForNow(OPENERS),
    subheading: lineForNow(SUBHEADINGS),
  }));
  const { opener, subheading } = hero;

  const send = () => {
    setMessages((prev) => [...prev, ...exchange(draft.trim(), prev.length)]);
    setDraft("");
  };

  const composer = (
    <CopilotComposer
      value={draft}
      onChange={setDraft}
      onSubmit={send}
      rows={started ? 1 : 3}
      placeholder={`Tell ${copilot.name} what you want to do`}
      sendLabel="Send message"
    />
  );

  // ── New conversation ──────────────────────────────────────────
  if (!started) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 md:px-8 pb-12">
        {/* ⚠️ ONE blue-600 phrase inside an otherwise gray-900 line, the same
            treatment the home hero and /copilot's own heading use — the blue is
            a highlight, not the line's colour. `accent` is pre-split in the pool
            so the copy stays readable as sentences there.

            suppressHydrationWarning on BOTH the element and its accent span: the
            parent's flag does not reach into a child element's text, and an hour
            boundary landing between the server's render and the client's is the
            one case where the two disagree. */}
        <h1
          suppressHydrationWarning
          className="text-center text-3xl md:text-[40px] md:leading-[1.2] font-bold tracking-tight text-gray-900"
        >
          {name ? `Hey ${name},` : "Hey,"}
          <br />
          {opener.lead}{" "}
          <span suppressHydrationWarning className="text-blue-600">
            {opener.accent}
          </span>
          {opener.tail}
        </h1>
        {/* Half the heading's size and medium against its bold — that hierarchy
            is what keeps this the line UNDER the question rather than a second
            heading competing with it. `text-balance` for the narrow end, where
            the longer lines do wrap. */}
        <h2
          suppressHydrationWarning
          className="mt-3 max-w-xl text-balance text-center text-[15px] md:text-[17px] font-medium leading-snug tracking-tight text-gray-900"
        >
          {subheading.lead}{" "}
          <span suppressHydrationWarning className="text-blue-600">
            {subheading.accent}
          </span>
          {subheading.tail}
        </h2>
        <div className="mt-10 w-full max-w-3xl">{composer}</div>
      </div>
    );
  }

  // ── Started ───────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          {/* Date divider — hairline, date, hairline */}
          <div className="flex items-center gap-4">
            <span className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-500" suppressHydrationWarning>
              {format(messages[0].at, "MMM d, yyyy")}
            </span>
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} copilot={copilot} />
          ))}
        </div>
      </div>

      {/* Pinned to the foot of the shell (which is overflow-hidden), so the
          thread scrolls under it instead of pushing it off the screen. */}
      <div className="shrink-0 px-4 md:px-8 pb-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {showChips && (
            <SuggestionChips
              ideas={IDEAS[copilot.category] ?? []}
              onPick={(idea) => setDraft(idea.description)}
              onDismiss={() => setShowChips(false)}
            />
          )}
          {composer}
        </div>
      </div>
    </div>
  );
}
