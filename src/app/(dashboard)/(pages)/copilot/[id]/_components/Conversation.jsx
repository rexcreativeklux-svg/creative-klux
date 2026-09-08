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
 * ⚠️ SENDING NOW CALLS THE REAL ENDPOINT (`POST copilot/chat`, see
 * _data/copilotApi). It previously answered with a hardcoded "I'm not connected
 * to my backend yet" and made no request at all, which meant a failure was
 * invisible — nothing in the Network tab, nothing to send to the backend dev.
 *
 * ⚠️ A FAILURE IS SHOWN IN THE SERVER'S OWN WORDS, not paraphrased, and
 * deliberately not dressed up as the copilot speaking — see the error branch in
 * ChatMessage. While the backend is being brought up the exact error is the
 * useful thing on the screen.
 *
 * What has NOT changed: nothing here mimes a working assistant. A canned reply
 * that sounds like success teaches the user their copilot is running work it is
 * not.
 *
 * @param {Object} props
 * @param {Object} props.copilot  Whose conversation this is.
 * @param {string} [props.conversationId]  The `?c=` in the URL. A numeric one
 *   names a thread the server stored, and its messages are fetched; anything
 *   else was minted locally by newConversationId and starts empty.
 * @param {string} [props.initialDraft]  Text the composer opens with, unsent —
 *   Plugins' "Activate skill" hands `/slug ` over this way, because the user
 *   still has to say what to run it on.
 * @param {string} [props.initialMessage]  Text that has ALREADY been sent —
 *   Workflows' "Send to chat" hands its description over this way, and the
 *   thread opens with it asked and answered. See ../page.jsx for which handoff
 *   belongs to which button.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { IDEAS } from "../../_data/ideas";
import {
  conversationMessages,
  describeApiError,
  fetchConversation,
  sendChat,
} from "../../_data/copilotApi";
import { OPENERS, SUBHEADINGS, lineForNow } from "../../_data/copilotGreetings";
import CopilotComposer from "../../_components/CopilotComposer";
import { conversationsChanged } from "./conversationsChanged";
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
 * The pair one send produces: what was asked, and a placeholder for the answer
 * that has not arrived yet.
 *
 * ⚠️ Shared by the composer's send AND by a workflow arriving pre-sent, so a
 * message the user never typed is built exactly like one they did — same ids,
 * same shape, same request. Seeding the thread by hand instead would be a second
 * definition of "a message" to keep in step.
 *
 * The reply starts `pending` and empty rather than holding optimistic text: the
 * only thing we know at this point is that we asked.
 *
 * @param {string} text
 * @param {number} index  How many messages precede it — ids only need to be
 *   unique within the thread, and this remounts per conversation.
 */
const turn = (text, index) => {
  const at = new Date();
  return [
    { id: `u-${index}`, role: "user", text, at },
    { id: `a-${index}`, role: "assistant", at, text: "", pending: true },
  ];
};

/**
 * A stored message in the shape this thread renders.
 *
 * ✅ CONFIRMED against the real API (2026-09-08):
 *   { id, role: "user"|"assistant", content, created_at }
 * The other keys are kept as fallbacks, but `content` is the one it sends.
 *
 * ⚠️ Anything that is not explicitly the user is treated as the copilot. Getting
 * this backwards would attribute the assistant's words to the person, which is
 * worse than an unstyled message — so the ambiguous case falls to the side that
 * cannot put words in the user's mouth.
 */
const fromStored = (row, index) => {
  const role = row?.role === "user" || row?.sender === "user" ? "user" : "assistant";
  const stamp = row?.created_at ?? row?.at;
  const at = stamp ? new Date(stamp) : new Date();
  return {
    id: `s-${row?.id ?? index}`,
    role,
    text: row?.content ?? row?.text ?? row?.message ?? "",
    at: Number.isNaN(at.getTime()) ? new Date() : at,
  };
};

/**
 * The copilot's words out of a response whose shape nobody has seen yet.
 *
 * ⚠️ Every key here is a guess — the endpoint had not returned a 2xx when this
 * was written. The last resort is the raw JSON rather than a friendly "something
 * went wrong": if the reply arrives under a key we did not guess, showing the
 * actual payload is what lets us name the right one, and swallowing it would
 * hide the answer we are waiting for.
 */
const replyTextFrom = (data) =>
  data?.reply ??
  data?.response ??
  data?.message ??
  data?.text ??
  data?.data?.reply ??
  (data == null ? "Empty response." : JSON.stringify(data, null, 2));

/**
 * Is this `?c=` a thread the SERVER knows about, or one we minted locally?
 *
 * newConversationId() produces a base36 timestamp, which is not all digits; a
 * server id is. Getting it wrong costs a 404 that is caught and ignored, so the
 * cheap test is the right one here.
 */
const isStoredConversation = (value) => /^\d+$/.test(String(value ?? ""));

export default function Conversation({
  copilot,
  conversationId = null,
  initialDraft = "",
  initialMessage = "",
}) {
  const { user } = useAuth();
  // ⚠️ Seeded in the INITIALISER, not an effect. The thread has to render in
  // its started state on the first paint — an effect would flash the empty
  // hero ("Hey Rex, …") for a frame before replacing it, which reads as the
  // screen changing its mind about what it is.
  const [messages, setMessages] = useState(() =>
    initialMessage ? turn(initialMessage, 0) : [],
  );
  const [draft, setDraft] = useState(initialDraft);

  // The server's id for this thread. A ref, not state: it changes nothing on
  // screen, and putting it in state would re-render the whole thread to store a
  // number. Seeded when the URL already names a stored conversation, so the
  // first message sent into a reopened thread continues it rather than starting
  // a second one beside it.
  const stored = isStoredConversation(conversationId);
  const conversationRef = useRef(stored ? conversationId : null);
  const [loadingHistory, setLoadingHistory] = useState(stored);
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

  /**
   * Make the request and settle the placeholder it belongs to.
   *
   * Patches BY ID rather than by position, because anything the user sends while
   * this is in flight lands in the array first — settling "the last message"
   * would put the answer under the wrong question.
   */
  const answer = useCallback(
    async (text, replyId) => {
      const settle = (patch) =>
        setMessages((prev) =>
          prev.map((m) =>
            m.id === replyId ? { ...m, pending: false, ...patch } : m,
          ),
        );

      try {
        const data = await sendChat({
          message: text,
          copilotId: copilot.id,
          conversationId: conversationRef.current,
        });
        // Keep the thread id if the server names one, so the next turn
        // continues this conversation instead of opening another.
        const id = data?.conversation_id ?? data?.conversation?.id ?? null;
        if (id != null && String(id) !== String(conversationRef.current)) {
          conversationRef.current = id;
          // First reply in a new thread: the server has just created the
          // conversation, so the history panel needs to hear about it. The URL
          // has not changed, so nothing else would tell it.
          conversationsChanged();
        }
        settle({ text: replyTextFrom(data) });
      } catch (err) {
        settle({ text: describeApiError(err).text, error: true });
      }
    },
    [copilot.id],
  );

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const [asked, reply] = turn(text, messages.length);
    setMessages((prev) => [...prev, asked, reply]);
    setDraft("");
    answer(text, reply.id);
  };

  // A workflow that arrived pre-sent has its question already in the thread (see
  // the state initialiser) but has not been ASKED yet — this is the request for
  // it. Guarded by a ref so React's development double-invoke doesn't fire two
  // requests, which would show up as a duplicate in the Network tab and read as
  // a bug in the very thing we are trying to observe.
  const askedRef = useRef(false);
  useEffect(() => {
    if (!initialMessage || askedRef.current) return;
    askedRef.current = true;
    answer(initialMessage, "a-0");
  }, [initialMessage, answer]);

  // Reopening a stored thread: load what was said. State is set only in the
  // callbacks — a synchronous setState in an effect body cascades renders and
  // this repo's compiler rules reject it.
  useEffect(() => {
    if (!stored) return undefined;
    let alive = true;
    fetchConversation(conversationId)
      .then((data) => {
        if (alive) setMessages(conversationMessages(data).map(fromStored));
      })
      // An unreadable thread opens empty rather than throwing the screen away;
      // the composer below it still works.
      .catch(() => {})
      .finally(() => {
        if (alive) setLoadingHistory(false);
      });
    return () => {
      alive = false;
    };
  }, [stored, conversationId]);

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

  // ── Reopening a stored thread ─────────────────────────────────
  // ⚠️ Checked BEFORE the empty state. Without this, reopening a conversation
  // shows "Hey Rex, what do you want to hand over?" for the length of the
  // request — the screen greeting you as if the thread you just clicked were
  // brand new, then replacing itself.
  if (loadingHistory && !started) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-xs text-gray-400">Loading conversation…</p>
      </div>
    );
  }

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
