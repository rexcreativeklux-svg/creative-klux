"use client";

/**
 * One Magic Studio tool (/magic-studio/[tool])
 * ─────────────────────────────────────────────────────────────────────────────
 * The section's only real screen, and every tool gets its own copy of it:
 *
 *   ┌────────────────────────────────────────────┐
 *   │ Text to Image                     History  │  ← tool, + canvas controls
 *   ├────────────────────────────────────────────┤
 *   │ ┌────┬────┬────┬────┐                      │
 *   │ │    │    │    │    │   this tool's        │  ← history, filling a
 *   │ ├────┼────┼────┼────┤   history            │    lattice that is drawn
 *   │ │    │    │    │    │                      │    whether or not it has
 *   │ └────┴────┴────┴────┘                      │    anything in it
 *   │     ┌───────────────────────────┐          │
 *   │     │ Describe what you…        │          │  ← the input, SHAPED BY the
 *   │     │ Style ▾ Size ▾        [↑] │          │    tool, and it GENERATES
 *   └─────┴───────────────────────────┴──────────┘    (see StudioComposer)
 *
 * The composer generates for real. What lands appears in the lattice above:
 * through history for the five backend tools, and as a session result for the
 * two that store nothing.
 *
 * A DYNAMIC segment rather than seven near-identical folders. When a tool's own
 * design arrives, give it a static folder — `magic-studio/text-to-image/page.jsx`
 * — and Next routes to it in preference to this one, with no change here and no
 * flag day for the other six.
 */

import { useState } from "react";
import { notFound, useParams } from "next/navigation";
import { History, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import HistoryLattice from "../HistoryLattice";
import StudioComposer from "../StudioComposer";
import useMagicHistory from "../useMagicHistory";
import { toolBySlug } from "../magicTools";

export default function MagicToolPage() {
  const { user } = useAuth();
  const { tool: slug } = useParams();

  const tool = toolBySlug(slug);
  // An unknown segment is a 404, not a quiet fallback to the first tool — a
  // mistyped or retired URL should say so rather than serve something the
  // person didn't ask for and may not notice they're in.
  if (!tool) notFound();

  return (
    <MagicToolScreen
      // Remount when the tool changes so the history, the options and the typed
      // prompt all reset together — switching tools navigates, and React would
      // otherwise reuse this tree with the previous tool's state in it.
      key={tool.id}
      tool={tool}
      user={user}
    />
  );
}

/**
 * Split out below the `notFound()` guard so the hooks only ever run for a tool
 * that exists — calling them above it would break the rules of hooks on the
 * render that bails.
 */
function MagicToolScreen({ tool, user }) {
  // { generating, progress } as one object, from the composer — they change
  // together and are read together, so splitting them into two states would
  // only create renders where the pair disagree.
  const [status, setStatus] = useState({ generating: false, progress: null });

  // Only backend tools persist anything. Audio to Text and Text to Audio run
  // entirely on-device, so there is nothing to ask the server for.
  const history = useMagicHistory(tool.backend ? tool.id : null, {
    enabled: tool.backend && !!user,
  });
  const { items, loading, removingId, refresh, remove } = history;

  // ── On-device results ──────────────────────────────────────────────────────
  // The two on-device tools generate into memory and never touch the server, so
  // there is no history for their output to appear in. Rather than give those
  // two a second kind of results panel, their result is reshaped into lattice
  // items and shown in the same grid — one canvas, whoever did the work.
  //
  // ⚠️ These live only as long as the page does. That is the tools' own
  // behaviour, not a shortcut here: nothing was ever stored to come back to.
  const [sessionItems, setSessionItems] = useState([]);

  const handleResult = (result) => {
    if (!result) return;

    const assets = Array.isArray(result.assets) ? result.assets : [];
    const mapped = assets.map((asset, index) => ({
      id: asset.id ?? `session-${index}-${asset.src || asset.content || index}`,
      type: asset.type || result.resultType || "image",
      url: asset.src || null,
      videoSrc: asset.videoSrc || null,
      thumbnail: asset.thumbnail || null,
      content: asset.content ?? result.text ?? null,
      prompt: null,
      tool: tool.id,
    }));

    // ⚠️ A TEXT RESULT HAS NO ASSETS. Audio to Text resolves to
    // { resultType: "text", text, meta } and nothing else — there is no file, so
    // there is no asset to list. Reading `assets` alone therefore threw the
    // finished transcript away and left the canvas empty, which looked exactly
    // like a transcription that had failed silently.
    if (mapped.length === 0 && result.text?.trim()) {
      mapped.push({
        // Keyed on the text, so re-running the same audio replaces the tile
        // rather than stacking an identical second one.
        id: `session-text-${result.text.length}-${result.text.slice(0, 24)}`,
        type: "text",
        url: null,
        content: result.text.trim(),
        prompt: null,
        tool: tool.id,
      });
    }

    if (mapped.length === 0) {
      console.warn("⚠️ [magic-studio] result had nothing to show:", result);
      return;
    }
    console.log(`🎁 [magic-studio] ${mapped.length} result(s) this session`);
    setSessionItems((current) => [...mapped, ...current]);
  };

  // Session results first — they are the newest thing that happened.
  const visible = sessionItems.length > 0 ? [...sessionItems, ...items] : items;

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

        <button
          type="button"
          onClick={refresh}
          disabled={loading || !tool.backend}
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
          generating={status.generating}
          generatingProgress={status.progress}
          generatingLabel={tool.working}
          onDelete={remove}
          removingId={removingId}
          emptyHint={
            tool.emptyHint || `Everything you make with ${tool.short} lands here.`
          }
        />
      </div>

      {/* The prompt, floating over the history rather than sitting under it, so
          the grid runs behind it. `pointer-events-none` on the positioner and
          back on for the box — otherwise this full-width strip would swallow
          clicks on every tile it crosses. */}
      {/* z-20 so the composer is unambiguously above the lattice. Every tile is
          a positioned element, and without a stacking order of its own the
          composer would depend on DOM order alone to stay clickable. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-6">
        <div className="pointer-events-auto w-full max-w-2xl">
          <StudioComposer
            tool={tool}
            history={history}
            onResult={handleResult}
            onStatusChange={setStatus}
          />
        </div>
      </div>

    </div>
  );
}
