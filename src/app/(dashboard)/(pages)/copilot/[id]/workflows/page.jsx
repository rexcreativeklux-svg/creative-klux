"use client";

/**
 * /copilot/[id]/workflows — the standing jobs this copilot can be set up to run.
 *
 * ⚠️ The cards are THIS copilot's own starters, read from the shared idea
 * catalog (_data/ideas) by its `category` — the same list behind the /copilot
 * home grid and the suggestion chips above the composer. Three surfaces, one
 * catalog: a workflow offered here that the chips have never heard of would mean
 * two lists drifting apart, and each idea already carries exactly what a card
 * needs (a cadence in its first clause, and the platforms it touches).
 *
 * ⚠️ "Send to chat" SENDS — the workflow arrives in the thread as a message the
 * user has already asked, not as text waiting in the composer for a second
 * click. The button says "send", so it sends; leaving it drafted made the label
 * a lie and asked the user to confirm a thing they had just clicked.
 *
 * Sending is not RUNNING. The message asks the copilot to set the workflow up;
 * the copilot answers. Nothing on a browse screen starts a standing job — the
 * `?send=` handoff (see ../page.jsx) puts a question in a thread, which is
 * exactly what typing it into the box would have done.
 */

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { useCopilots, newConversationId } from "../../_data/copilots";
import { IDEAS } from "../../_data/ideas";
import WorkflowCard from "../_components/WorkflowCard";
import SuggestedWorkflowsModal from "../_components/SuggestedWorkflowsModal";

/**
 * Cards on this screen. Three, with the rest behind "Browse more workflows" —
 * the copilot's category holds six, and a browse screen that empties the whole
 * catalog onto one page gives the user a scroll instead of a suggestion.
 */
const SHOWN = 3;

export default function CopilotWorkflows() {
  const { id } = useParams();
  const router = useRouter();
  const copilot = useCopilots().find((c) => c.id === id);
  const [browsing, setBrowsing] = useState(false);

  if (!copilot) return null; // the layout owns the "not found" state

  const workflows = (IDEAS[copilot.category] ?? []).slice(0, SHOWN);

  // ⚠️ `send=`, not `task=` — the two params are the difference between a
  // message and a draft (see ../page.jsx). The fresh `?c=` opens it in a new
  // conversation rather than posting into whatever thread happened to be open,
  // which also means the sent message cannot land in the middle of one.
  const sendToChat = (workflow) =>
    router.push(
      `/copilot/${copilot.id}?c=${newConversationId()}&send=${encodeURIComponent(workflow.description)}`,
    );

  return (
    <div className="h-full overflow-y-auto px-4 md:px-8 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-center text-xl md:text-2xl font-bold tracking-tight text-gray-900">
          Set up a workflow. Let{" "}
          <span className="text-blue-600">{copilot.name}</span> handle it.
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Workflows run automatically in the background on a schedule, or when
          something changes in your brand.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.title}
              workflow={workflow}
              category={copilot.category}
              onSend={sendToChat}
            />
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setBrowsing(true)}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-surface hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            Browse more workflows
          </button>
        </div>
      </div>

      {/* Opens on this copilot's own surface. Sending from inside it navigates
          to the chat, which unmounts this screen and the modal with it — no
          close call needed, and adding one would only race the navigation. */}
      <SuggestedWorkflowsModal
        isOpen={browsing}
        onClose={() => setBrowsing(false)}
        defaultCategory={copilot.category}
        onSend={sendToChat}
      />
    </div>
  );
}
