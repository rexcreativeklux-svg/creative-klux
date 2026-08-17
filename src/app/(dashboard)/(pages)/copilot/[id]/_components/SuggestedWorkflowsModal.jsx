"use client";

/**
 * SuggestedWorkflowsModal — "Browse more workflows": the whole catalog, by
 * product surface, without leaving the copilot.
 *
 * ⚠️ It opens IN PLACE rather than routing to /copilot. Browsing is a detour —
 * you are on this copilot's Workflows screen, you want to see what else it could
 * be set up to do, and you want to land back here (or in its chat) when you are
 * done. Sending the user to another page to browse means a trip back through the
 * catalog to find their copilot again.
 *
 * The tabs are the SAME categories the /copilot home grid uses, over the same
 * IDEAS catalog, rendered with the same {@link WorkflowCard} the screen behind
 * it uses. Nothing here is a second copy of anything.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {string} props.defaultCategory  Opens on the copilot's own surface —
 *   its workflows are the ones most likely to be wanted, so they should not be
 *   the tab the user has to go looking for.
 * @param {(workflow: Object) => void} props.onSend  "Send to chat".
 */

import { useState } from "react";
import ResponsiveModal from "@/app/(components)/ui/ResponsiveModal";
import { CATEGORIES, IDEAS } from "../../_data/ideas";
import WorkflowCard from "./WorkflowCard";

export default function SuggestedWorkflowsModal({
  isOpen,
  onClose,
  defaultCategory,
  onSend,
}) {
  const [category, setCategory] = useState(defaultCategory ?? CATEGORIES[0]);
  const workflows = IDEAS[category] ?? [];

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Suggested workflows"
      size="4xl"
      fullHeightSheet
    >
      <p className="text-sm text-gray-500">
        Standing jobs your copilot can take on, by what they work with.
      </p>

      {/* Segmented tabs, scrolling sideways below `md` — six labels do not fit
          a phone, and wrapping them to three rows costs the modal its header. */}
      <div className="mt-5 flex gap-1 overflow-x-auto hide-scrollbar rounded-xl border border-gray-200 bg-gray-100 p-1">
        {CATEGORIES.map((name) => {
          const active = name === category;
          return (
            <button
              key={name}
              onClick={() => setCategory(name)}
              aria-pressed={active}
              className={`shrink-0 rounded-lg px-3.5 py-1.5 text-[13px] transition-all duration-150 cursor-pointer ${
                active
                  ? "bg-surface text-gray-900 font-semibold shadow-sm"
                  : "text-gray-500 font-medium hover:text-gray-900"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {workflows.map((workflow) => (
          <WorkflowCard
            key={workflow.title}
            workflow={workflow}
            category={category}
            onSend={onSend}
          />
        ))}
      </div>
    </ResponsiveModal>
  );
}
