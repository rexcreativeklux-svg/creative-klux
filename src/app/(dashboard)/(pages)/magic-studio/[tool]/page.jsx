"use client";

/**
 * One Magic Studio tool (/magic-studio/[tool])
 * ─────────────────────────────────────────────────────────────────────────────
 * The section's only real screen, and every tool gets its own copy of it:
 *
 *   ┌────────────────────────────────────────────┐
 *   │ Text to Image           Clear · History    │  ← tool, + canvas controls
 *   ├────────────────────────────────────────────┤
 *   │ ┌────┬────┬────┬────┐                      │
 *   │ │    │    │    │    │   this tool's        │  ← history, filling a
 *   │ ├────┼────┼────┼────┤   history            │    lattice that is drawn
 *   │ │    │    │    │    │                      │    whether or not it has
 *   │ └────┴────┴────┴────┘                      │    anything in it
 *   │        ┌──────────────────────┐            │
 *   │        │ Describe what you…   │            │  ← the input, SHAPED BY the
 *   └────────┴──────────────────────┴────────────┘    tool (see StudioComposer)
 *
 * ⚠️ A HOLDING ROUTE for the generating half. Each tool's real form is still
 * being designed; until one lands, the Create button and the composer both open
 * that tool's existing MagicStudioModal, so nothing that worked before this
 * section was rebuilt stops working. Replacing what `openModal` does is the
 * whole migration for a tool.
 *
 * A DYNAMIC segment rather than seven near-identical folders. When a tool's real
 * design arrives, give it a static folder — `magic-studio/text-to-image/page.jsx`
 * — and Next routes to it in preference to this one, with no change here and no
 * flag day for the other six.
 */

import { useState } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { Eraser, History, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import MagicStudioModal from "../MagicStudioModal";
import HistoryLattice from "../HistoryLattice";
import StudioComposer from "../StudioComposer";
import useMagicHistory from "../useMagicHistory";
import { hrefForTool, toolById, toolBySlug } from "../magicTools";

export default function MagicToolPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { tool: slug } = useParams();

  const tool = toolBySlug(slug);
  // An unknown segment is a 404, not a quiet fallback to the first tool — a
  // mistyped or retired URL should say so rather than serve something the
  // person didn't ask for and may not notice they're in.
  if (!tool) notFound();

  return (
    <MagicToolScreen
      // Remount when the tool changes so the history, the modal and the typed
      // prompt all reset together — switching tools navigates, and React would
      // otherwise reuse this tree with the previous tool's state in it.
      key={tool.id}
      tool={tool}
      user={user}
      router={router}
    />
  );
}

/**
 * Split out below the `notFound()` guard so the hooks only ever run for a tool
 * that exists — calling them above it would break the rules of hooks on the
 * render that bails.
 */
function MagicToolScreen({ tool, user, router }) {
  const [modalOpen, setModalOpen] = useState(false);

  // Only backend tools persist anything. Audio to Text and Text to Audio run
  // entirely on-device, so there is nothing to ask the server for and the
  // lattice below stays an empty grid for them by design, not by failure.
  const { items, loading, removingId, refresh, remove } = useMagicHistory(
    tool.backend ? tool.id : null,
    { enabled: tool.backend && !!user },
  );

  // ⚠️ CLEAR EMPTIES THE CANVAS, IT DOES NOT DELETE ANYTHING. It is a view flag
  // and nothing more — no request goes out, the server keeps every generation,
  // and History puts them straight back. Deleting is per-item, behind each
  // tile's ⋯ menu, where it takes an explicit choice about a specific thing.
  // A "Clear" that silently destroyed a tool's whole history would be one
  // mis-click from unrecoverable, so this one can't.
  const [cleared, setCleared] = useState(false);
  const visible = cleared ? [] : items;

  const clearCanvas = () => {
    setCleared(true);
    toast.success("Canvas cleared", {
      description: "Nothing was deleted — History brings it back.",
    });
  };

  const showHistory = () => {
    setCleared(false);
    refresh();
  };

  /**
   * ⚠️ THE PROMPT IS NOT CARRIED INTO THE MODAL YET, and that is a design gap
   * rather than an oversight: which field it should land in is a per-tool
   * question — Text to Image has a prompt, Script to Voiceover has a script,
   * Image to Variations starts from a file and has no text input at all — and
   * each answer arrives with that tool's design. It is logged so the hand-off
   * is visible while it is missing.
   */
  const openModal = (prompt) => {
    if (prompt) {
      console.log(
        `📝 [magic-studio] prompt for "${tool.label}" is not wired into the modal yet:`,
        prompt,
      );
    }
    setModalOpen(true);
  };

  return (
    <div className="relative flex h-full flex-col">
      {/* Which tool you are in, and the two canvas controls. The secondary
          sidebar names the tool too, but that panel collapses to icons — this
          line doesn't.
          No "Create" button up here: the composer at the foot is the create
          affordance, and a second one would be two doors to the same room. */}
      <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-surface px-4 py-3">
        <tool.icon className="h-4.5 w-4.5 shrink-0 text-blue-600" />
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
          {tool.label}
        </p>

        {/* Disabled on an already-empty canvas — otherwise it is a button whose
            only possible outcome is a toast saying it did nothing. */}
        <button
          type="button"
          onClick={clearCanvas}
          disabled={visible.length === 0}
          title="Clear the canvas — your history is kept"
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500 enabled:cursor-pointer"
        >
          <Eraser className="h-3.5 w-3.5 shrink-0" />
          Clear
        </button>

        <button
          type="button"
          onClick={showHistory}
          disabled={loading}
          title={`Reload everything made with ${tool.label}`}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 enabled:cursor-pointer"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
          ) : (
            <History className="h-3.5 w-3.5 shrink-0" />
          )}
          History
        </button>
      </div>

      {/* History. pb-44 is the composer's clearance — it floats over this
          scroller, so without it the last row could never be scrolled out from
          under the box. */}
      <div className="min-h-0 flex-1 overflow-y-auto pb-44">
        <HistoryLattice
          items={visible}
          loading={loading}
          onDelete={remove}
          removingId={removingId}
          emptyHint={
            cleared
              ? "Canvas cleared — History brings your work back."
              : tool.backend
                ? `Everything you make with ${tool.short} lands here.`
                : `${tool.label} runs on your device and keeps no history.`
          }
        />
      </div>

      {/* The prompt, floating over the history rather than sitting under it, so
          the grid runs behind it. `pointer-events-none` on the positioner and
          back on for the box — otherwise this full-width strip would swallow
          clicks on every tile it crosses. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-4 pb-6">
        <div className="pointer-events-auto w-full max-w-2xl">
          <StudioComposer tool={tool} onSubmit={openModal} />
        </div>
      </div>

      {modalOpen && (
        <MagicStudioModal
          categoryId={tool.id}
          // Switching tools from inside the modal is a NAVIGATION here, not a
          // state change — the URL has to follow, or the sidebar and the history
          // behind the modal would both still be showing the tool you left.
          onSwitch={(id) => {
            const next = toolById(id);
            if (next) router.push(hrefForTool(next));
          }}
          onClose={() => {
            setModalOpen(false);
            // Anything generated in the modal should be in the lattice behind it
            // the moment it closes, not on the next visit — and if the canvas
            // was cleared before generating, a fresh result appearing is worth
            // more than the cleared view, so this un-clears too.
            showHistory();
          }}
        />
      )}
    </div>
  );
}
