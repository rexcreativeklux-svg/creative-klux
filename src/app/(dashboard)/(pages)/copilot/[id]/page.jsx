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
 * When the backend lands, `?c=` becomes a real conversation id and this is where
 * its messages get fetched; nothing below has to change shape.
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
      key={searchParams.get("c") ?? "new"}
      copilot={copilot}
      // `?task=` — a workflow's "Send to chat" loads its description into the
      // composer. It rides the URL rather than component state because the two
      // screens do not share one: Workflows navigates here.
      initialDraft={searchParams.get("task") ?? ""}
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
