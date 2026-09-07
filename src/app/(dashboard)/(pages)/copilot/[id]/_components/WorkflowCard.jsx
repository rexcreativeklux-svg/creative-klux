"use client";

/**
 * WorkflowCard — one standing job, offered.
 *
 * Used by the Workflows screen and by the Suggested Workflows modal it opens,
 * so the two cannot disagree about what a workflow looks like or what "Send to
 * chat" does — the modal is a browser over the same catalog, not a second
 * design of the same card.
 *
 * ⚠️ The icon row is ALWAYS populated: the surface the workflow runs in first
 * (derived from its category — see _data/surfaces), then any outside platforms
 * it publishes to. Before the surface chip existed, a workflow that never leaves
 * the app drew an empty row and read as unfinished.
 *
 * @param {Object} props
 * @param {Object} props.workflow  An entry from _data/ideas.
 * @param {string} props.category  Which IDEAS key it came from.
 * @param {(workflow: Object) => void} props.onSend  "Send to chat" — and it
 *   does send: the description lands in a new thread as an asked message, not
 *   as text sitting in the composer. See ../workflows/page.jsx.
 */

import { MessageSquare } from "lucide-react";
import PlatformChip from "../../_components/PlatformChip";
import SurfaceChip from "../../_components/SurfaceChip";

export default function WorkflowCard({ workflow, category, onSend }) {
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-surface p-5">
      <p className="text-[15px] font-semibold text-gray-900">{workflow.title}</p>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">
        {workflow.description}
      </p>
      {/* mt-auto pins the action row to the bottom, so cards sitting side by
          side in the modal's grid line their buttons up however unevenly their
          descriptions wrap. */}
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="flex items-center gap-1.5">
          <SurfaceChip category={category} />
          {workflow.platforms.map((platform) => (
            <PlatformChip key={platform} platform={platform} />
          ))}
        </span>
        <button
          onClick={() => onSend(workflow)}
          className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-300 bg-surface px-3.5 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <MessageSquare className="h-4 w-4 text-gray-500" />
          Send to chat
        </button>
      </div>
    </div>
  );
}
