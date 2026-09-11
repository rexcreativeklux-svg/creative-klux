"use client";

/**
 * /copilot/[id] — a copilot's conversation, and the screen it opens on.
 *
 * The thread itself lives in <Conversation>; this page's whole job is to decide
 * WHICH conversation is on screen. ⚠️ That comes from `?c=` in the URL, and it is
 * the component's `key`: "New conversation" is then an ordinary navigation, the
 * thread resets by remounting, and Back returns to the conversation that was
 * open. The alternative — a reset callback threaded from the panel button down
 * into the thread's state — leaves the URL lying about what is on screen.
 *
 * ⚠️ NO `?c=` MEANS "SHOW ME OUR HISTORY". Opening a copilot from the catalog
 * or the rail carries none, and the thread loads everything said to that
 * copilot from the server — like opening a chat in WhatsApp. Only New
 * conversation (and the Send to chat / Activate skill handoffs) mint one, and
 * those open blank. See isSessionConversation in ../_data/copilots.
 */

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useCopilots } from "../_data/copilots";
import Conversation from "./_components/Conversation";

function CopilotConversation() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const copilot = useCopilots().find((c) => c.id === id);

  // The layout renders its own "not found" state, so by here there is a copilot;
  // this only covers the render between a delete and the layout catching up.
  if (!copilot) return null;

  return (
    <Conversation
      key={searchParams.get("c") ?? "latest"}
      copilot={copilot}
      // ⚠️ TWO PARAMS, TWO INTENTIONS. Both ride the URL rather than component
      // state because the screens that set them do not share one — Workflows
      // and Plugins navigate here — but they are not interchangeable:
      //
      //   ?task=  a DRAFT. Plugins' "Activate skill" uses it: the composer
      //           opens holding `/slug ` and the user says what to run it on,
      //           so sending it as-is would ask for work on nothing.
      //   ?send=  a MESSAGE, already asked. Workflows' "Send to chat" uses it:
      //           the description is a whole request on its own, and a button
      //           that says send should not need a second click to send.
      // The same `?c=` that keys this component. Passed as a prop too, because
      // it decides whether the thread loads history: none at all does, and so
      // does one minted before a reload — see Conversation.
      conversationId={searchParams.get("c")}
      initialDraft={searchParams.get("task") ?? ""}
      initialMessage={searchParams.get("send") ?? ""}
    />
  );
}

// useSearchParams() needs a Suspense boundary above it — without one, a route
// that Next decides to prerender fails the build rather than at runtime.
export default function CopilotConversationPage() {
  return (
    <Suspense>
      <CopilotConversation />
    </Suspense>
  );
}
