"use client";

/**
 * One Magic Studio tool (/magic-studio/[tool])
 * ─────────────────────────────────────────────────────────────────────────────
 * The section's only real screen, and every tool gets its own copy of it:
 *
 *   ┌────────────────────────────────────────────┐
 *   │ Text to Image           Create   History   │  ← tool, + the two canvases
 *   ├────────────────────────────────────────────┤
 *   │ ┌────┬────┬────┬────┐                      │
 *   │ │ ◌  │    │    │    │   whichever canvas   │  ← a lattice that is drawn
 *   │ ├────┼────┼────┼────┤   is showing         │    whether or not it has
 *   │ │    │    │    │    │                      │    anything in it
 *   │ └────┴────┴────┴────┘                      │
 *   │     ┌───────────────────────────┐          │
 *   │     │ Describe what you…        │          │  ← the input, SHAPED BY the
 *   │     │ Style ▾ Size ▾        [↑] │          │    tool, and it GENERATES
 *   └─────┴───────────────────────────┴──────────┘    (see StudioComposer)
 *
 * ⚠️ TWO CANVASES, ONE LATTICE. Create is the working surface: it starts empty
 * and fills with what you make in this sitting. History is the whole backlog.
 * The composer is pinned under both, because it is the point of the screen —
 * switching to History is not leaving the tool, it is looking at what's behind
 * you while still being able to work.
 *
 * They are two states of the SAME grid rather than two components. Everything
 * that makes a tile worth having — the lightbox, the actions menu, the text
 * reader, the hairline padding to a full last row — is HistoryLattice's, and a
 * second bespoke grid for the create canvas would either duplicate all of it or
 * quietly get less of it.
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

import { useMemo, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { History, Loader2, Sparkles } from "lucide-react";
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
  // { generating, progress, prompt, count } as one object, from the composer —
  // they change together and are read together, so splitting them into four
  // states would only create renders where they disagree.
  const [status, setStatus] = useState({
    generating: false,
    progress: null,
    prompt: "",
    count: 1,
    // What the run in flight will produce, which decides how its placeholder
    // cells are drawn. The composer resolves it — this tool's config knows,
    // except on the persona generator where a dropdown decides.
    resultType: "image",
  });

  // Which canvas is showing. Create by default: this is a working screen, and
  // landing on the backlog would make the first click of every visit "get me
  // out of the archive I didn't ask for".
  const [view, setView] = useState("create");

  // The in-flight tile, taken off the canvas by its ✕. Reset when a new run
  // starts — the dismissal is of THAT wait, not a standing preference, and
  // keeping it would silently swallow the next generation's tile too.
  //
  // ⚠️ DURING RENDER, NOT IN AN EFFECT — React's own pattern for resetting
  // state when something it depends on changes. An effect would render the
  // hidden tile once before un-hiding it, so the first frame of every run
  // after a dismissal would be missing its placeholder.
  const [waitHidden, setWaitHidden] = useState(false);
  const [wasGenerating, setWasGenerating] = useState(status.generating);
  if (wasGenerating !== status.generating) {
    setWasGenerating(status.generating);
    if (status.generating) setWaitHidden(false);
  }

  // A prompt pushed back into the composer by the in-flight tile's pencil.
  // { text, nonce } — see the prop's note in StudioComposer for the nonce.
  const [refill, setRefill] = useState(null);

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

      // ── Audio meta, carried rather than flattened away ──────────────────────
      // ⚠️ THE PLAYER IS MEASURABLY WORSE WITHOUT THESE, and they only exist on
      // the way past this point. `blob` is the generated file already in memory,
      // so the waveform decodes from it instead of re-fetching a `blob:` URL;
      // `duration` is known exactly, so the clock is right before playback
      // starts rather than after the browser has loaded metadata; `voiceLabel`
      // is the "Heart · US female" the card is titled with, and nothing
      // downstream can reconstruct which voice was used once it's dropped.
      // Undefined on every non-audio result, which is what the card expects.
      blob: asset.blob,
      duration: asset.duration,
      format: asset.format,
      voiceLabel: asset.voiceLabel,
      alt: asset.alt,
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

  // ── What the create canvas shows ───────────────────────────────────────────
  // Everything already in history when this visit settled. What arrives AFTER
  // that is what you just made, and that — plus the on-device session results
  // above — is the create canvas. Without this it would render the whole
  // backlog and simply be History under a second name.
  //
  // ⚠️ SNAPPED AFTER THE FIRST LOAD, NOT AT MOUNT. `items` is [] while the
  // fetch is in flight, so a baseline taken on mount is empty and every
  // generation you have ever made reads as brand new the moment the response
  // lands. `loading` starts true for exactly the tools that fetch (see
  // useMagicHistory), so this waits for the ones that have something to wait
  // for and settles immediately for the two that don't.
  //
  // Taken during render — it must be in place for the SAME render that first
  // has the items, or the create canvas paints the whole backlog for one frame
  // before the baseline lands and empties it again.
  const [baseline, setBaseline] = useState(null);
  if (baseline === null && !loading) {
    setBaseline(new Set(items.map((item) => item.id)));
  }

  const createItems = useMemo(() => {
    const fresh = baseline
      ? items.filter((item) => !baseline.has(item.id))
      : [];
    return sessionItems.length > 0 ? [...sessionItems, ...fresh] : fresh;
  }, [baseline, items, sessionItems]);

  const creating = view === "create";
  // Session results first in history too — they are the newest thing that
  // happened, and the two on-device tools have nowhere else to put them.
  const visible = creating
    ? createItems
    : sessionItems.length > 0
      ? [...sessionItems, ...items]
      : items;

  return (
    <div className="relative flex h-full flex-col">
      {/* Which tool you are in, and the two canvases. The secondary sidebar
          names the tool too, but that panel collapses to icons — this line
          doesn't.
          Create is NOT a second generate button — the composer below is still
          the only thing that runs the tool. This pair only says which of the
          two canvases the lattice is showing. */}
      <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-surface px-4 py-3">
        <tool.icon className="h-4.5 w-4.5 shrink-0 text-blue-600" />
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
          {tool.label}
        </p>

        <button
          type="button"
          onClick={() => setView("create")}
          title="A clean canvas — just what you make from here"
          aria-pressed={creating}
          className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
            creating
              ? "bg-gray-100 text-gray-900"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          Create
        </button>

        {/* Doubles as the reload it has always been: coming back to the backlog
            is exactly when you want it current, and a separate refresh button
            beside it would be a third control for two jobs. */}
        <button
          type="button"
          onClick={() => {
            setView("history");
            refresh();
          }}
          disabled={loading || !tool.backend}
          title={`Everything made with ${tool.label}`}
          aria-pressed={!creating}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 enabled:cursor-pointer ${
            creating
              ? "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              : "bg-gray-100 text-gray-900"
          }`}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
          ) : (
            <History className="h-3.5 w-3.5 shrink-0" />
          )}
          History
        </button>
      </div>

      {/* The canvas — and the composer, which lives INSIDE this scroller rather
          than floating over it from the page. Two things come out of that:

          • The composer measures against the same box the lattice does. The
            scroller's scrollbar takes real width on Windows, so a strip spanning
            the page is ~15px wider than the grid inside it — enough to put a
            column-aligned composer a few pixels off every line it is supposed to
            land on. Sharing the content box makes the alignment exact instead of
            approximate.
          • The clearance under the last row is the composer's own height, since
            a sticky element still occupies its place at the end of the content.
            This used to be a hand-tuned `pb-56` on the scroller that had to be
            re-tuned by hand every time the box grew a row. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <HistoryLattice
          items={visible}
          // Only History is ever waiting on the network. The create canvas is
          // built from what has already arrived, so showing its spinner there
          // would put a loading state on a grid that has nothing to load.
          loading={!creating && loading}
          generating={status.generating && !waitHidden}
          generatingCount={status.count}
          generatingProgress={status.progress}
          generatingPrompt={status.prompt}
          generatingType={status.resultType}
          generatingLabel={tool.working}
          onDismissGenerating={() => setWaitHidden(true)}
          onEditGenerating={() =>
            setRefill({ text: status.prompt, nonce: Date.now() })
          }
          onDelete={remove}
          removingId={removingId}
          emptyHint={
            creating
              ? `Describe what you want below. Everything you make lands here.`
              : tool.emptyHint ||
                `Everything you make with ${tool.short} lands here.`
          }
        />

        {/* The prompt, floating over the history rather than sitting under it,
            so the grid runs behind it. `pointer-events-none` on the positioner
            and back on for the box — otherwise this full-width strip would
            swallow clicks on every tile it crosses. */}
        {/* z-20 so the composer is unambiguously above the lattice. Every tile
            is a positioned element, and without a stacking order of its own the
            composer would depend on DOM order alone to stay clickable. */}
        {/* pt-10 keeps the last row off the box once you reach the end of the
            scroll — without it the lattice runs flush into the composer. */}
        <div className="pointer-events-none sticky bottom-0 z-20 flex justify-center px-4 pt-10 pb-6 2xl:px-0">
          {/* ⚠️ THE WIDTH IS A GRID SPAN, NOT A READING MEASURE. At `2xl` the
              lattice is four columns, so half the canvas is exactly the middle
              two: the box starts on the 25% rule and ends on the 75% one rather
              than floating between them. `2xl:px-0` on the strip is part of
              that — `w-1/2` is half the strip's CONTENT box, so leaving the
              padding on would take 16px off each side and break the very
              alignment this is for.

              Below `2xl` it stays a centered max-w-4xl. Three columns have no
              centered span that lands on a rule except the middle column alone,
              which is too narrow to write in, and half of a smaller canvas runs
              into the problem max-w-4xl was raised to fix: the options row on
              the five-option tools scrolling before anything is typed. */}
          <div className="pointer-events-auto w-full max-w-4xl 2xl:w-1/2 2xl:max-w-none">
            <StudioComposer
              tool={tool}
              history={history}
              refill={refill}
              onResult={handleResult}
              onStatusChange={setStatus}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
