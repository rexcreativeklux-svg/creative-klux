"use client";

/**
 * /copilot — Copilot home.
 * Replicates the reference "give it its first task" screen: full-bleed hero
 * (route is in the dashboard layout's NO_PADDING_ROUTES, so this page owns the
 * area below the fixed header) with the task input, then starter-idea cards
 * grouped by category. UI only for now — the input and idea cards are
 * placeholders until the Copilot backend lands.
 *
 * The reference's warm cream background is swapped for a neutral with a subtle
 * hint of the app's blue (not a blue background) — dark mode falls back to the
 * standard page token.
 */

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot } from "lucide-react";
import PlatformChip from "./_components/PlatformChip";
import CopilotComposer from "./_components/CopilotComposer";
import CreateCopilotModal from "./_components/CreateCopilotModal";
import { CATEGORIES, IDEAS } from "./_data/ideas";
import { newConversationId } from "./_data/copilots";

/**
 * Colour sets for the idea tiles, cycled by position — taken from the home
 * page's template artwork. Literal hex rather than theme tokens on purpose:
 * these are "printed" tiles and must look the same in light and dark mode
 * (gray-900 etc. flip in dark mode and would vanish on these backgrounds).
 */
const IDEA_TILES = [
  { bg: "#1d4ed8", fg: "#ffffff", muted: "rgba(255,255,255,0.78)", eyebrow: "rgba(255,255,255,0.7)", accent: "#facc15" },
  { bg: "#fdf1e4", fg: "#1f2937", muted: "#4b5563", eyebrow: "#e2553b", accent: "#e2553b" },
  { bg: "#0f6b4f", fg: "#ffffff", muted: "rgba(255,255,255,0.78)", eyebrow: "#facc15", accent: "#facc15" },
  { bg: "#0b3b3f", fg: "#ffffff", muted: "rgba(255,255,255,0.75)", eyebrow: "#f4a261", accent: "#f4a261" },
  { bg: "#0f1736", fg: "#ffffff", muted: "rgba(255,255,255,0.72)", eyebrow: "#93c5fd", accent: "#3b82f6" },
  { bg: "#fde68a", fg: "#1f2937", muted: "#4b5563", eyebrow: "#1d4ed8", accent: "#1d4ed8" },
];

function CopilotHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // `?task=` — a link can hand a task over this way, so it arrives already
  // typed into the box instead of sending the user to find it again in the
  // grid below. Same param, same meaning, as the one
  // /copilot/[id] reads for a workflow's "Send to chat".
  //
  // Seed, not source: it is the composer's INITIAL value and the user edits
  // freely from there. Reading it every render would fight their typing, and
  // rewriting the URL on every keystroke is not what a draft is.
  const [task, setTask] = useState(() => searchParams.get("task") ?? "");
  const [activeCategory, setActiveCategory] = useState("Brand");
  const [naming, setNaming] = useState(false);
  const ideas = IDEAS[activeCategory] ?? [];
  const composerRef = useRef(null);

  /**
   * An idea card's job: hand its task to the composer. It fills the box (it
   * does NOT send — the user reads it, edits it if they like, and presses send
   * themselves, which then names + creates the copilot as usual), scrolls the
   * box into view and focuses it with the cursor at the end.
   */
  // Not `useIdea` — a `use…` name reads as a hook to the linter and to people.
  const applyIdea = (description) => {
    setTask(description);
    const el = composerRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // After React has written the new value, so the caret lands after it.
    requestAnimationFrame(() => {
      el.focus({ preventScroll: true });
      el.setSelectionRange(description.length, description.length);
    });
  };

  /**
   * "Give your Copilot its first task" — so it makes one and gives it the task.
   *
   * ⚠️ THREE STEPS, and the order matters: the user names it (CreateCopilotModal),
   * the copilot has to exist before there is anywhere to ask, and the task then
   * rides `?send=` (see [id]/page.jsx), which posts it as an asked message rather
   * than parking it in the composer — the user already pressed send once here,
   * and asking them to press it again in the new thread would be the same click
   * twice.
   */
  const handleSubmit = () => {
    if (task.trim()) setNaming(true);
  };

  const handleCreated = (copilot) => {
    router.push(
      `/copilot/${copilot.id}?new=1&c=${newConversationId()}&send=${encodeURIComponent(task.trim())}`,
    );
  };

  return (
    // No pb-nav: `main` in (dashboard)/layout.js reserves the mobile bottom
    // bar for every route, so repeating it here would only add dead space.
    <div className="min-h-full pt-header flex flex-col bg-[#eef1f7] dark:bg-page">
      {/* ── Hero ──────────────────────────────────────────────────
          Natural height: the ideas below sit in an inset, rounded panel now,
          so they no longer need to line up with the sidebar's THEME hairline
          (which is what the old measured --ck-rail-top height was for). */}
      <section className="flex flex-col items-center px-gutter pt-10 sm:pt-14 lg:pt-16 pb-8">
        <h1 className="text-center text-3xl md:text-[44px] md:leading-[1.2] font-bold text-gray-900">
          Give your
          <br />
          <Bot className="inline h-8 w-8 md:h-10 md:w-10 text-blue-600 align-[-0.15em] mr-1.5" />
          <span className="text-blue-600">Copilot</span> its first task.
        </h1>

        {/* Task input — the SAME composer a copilot's own conversation uses
            (see _components/CopilotComposer), so the two cannot drift. Creating
            a copilot from a typed task needs the backend, so for now it says so
            rather than dropping what was typed. */}
        <CopilotComposer
          value={task}
          onChange={setTask}
          onSubmit={handleSubmit}
          inputRef={composerRef}
          className="mt-10 w-full max-w-xl"
        />

        <CreateCopilotModal
          isOpen={naming}
          onClose={() => setNaming(false)}
          onCreated={handleCreated}
        />

        <p className="mt-10 text-xs text-gray-500">
          Or start from one of these ideas:
        </p>
      </section>

      {/* ── Starter ideas ───────────────────────────────────────── */}
      {/* A rounded, bordered panel inset from the page edges, holding
          its own header row (category tabs) and rounded idea cards — the same
          box treatment as the home page's Templates panel. */}
      <section className="flex-1 px-gutter pb-24 lg:pb-8">
        <div className="w-full rounded-2xl border border-gray-200 bg-surface shadow-sm">
          {/* Header row — category tabs, left-aligned, dot-separated */}
          <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar border-b border-gray-200 px-4 sm:px-5 py-3.5">
            {CATEGORIES.map((category, i) => {
              const active = activeCategory === category;
              return (
                <span key={category} className="flex shrink-0 items-center gap-3">
                  {i > 0 && (
                    <span className="h-1 w-1 rounded-full bg-gray-300" aria-hidden="true" />
                  )}
                  <button
                    onClick={() => setActiveCategory(category)}
                    className={`text-[13px] cursor-pointer transition-colors
                      ${active ? "text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-900"}`}
                  >
                    {category}
                  </button>
                </span>
              );
            })}
          </div>

          {/* Idea cards — bold colour tiles, styled after the home page's
              template artwork: category eyebrow, big headline, short copy, and
              an accent shape along the bottom. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 sm:p-4">
            {ideas.map(({ title, platforms, description }, i) => {
              const tile = IDEA_TILES[i % IDEA_TILES.length];
              return (
                <button
                  type="button"
                  key={title}
                  onClick={() => applyIdea(description)}
                  aria-label={`Use idea: ${title}`}
                  className="group relative flex min-h-56 cursor-pointer flex-col overflow-hidden rounded-xl p-6 text-left transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  style={{ backgroundColor: tile.bg }}
                >
                  {/* Accent shape */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-8 -left-6 h-16 w-[75%] -rotate-6"
                    style={{ backgroundColor: tile.accent }}
                  />

                  <div className="relative flex items-start justify-between gap-3">
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.18em]"
                      style={{ color: tile.eyebrow }}
                    >
                      {activeCategory}
                    </p>
                    <span className="flex items-center gap-1.5">
                      {platforms.map((platform) => (
                        <PlatformChip key={platform} platform={platform} />
                      ))}
                    </span>
                  </div>

                  <p
                    className="relative mt-4 text-2xl font-extrabold leading-tight tracking-tight"
                    style={{ color: tile.fg }}
                  >
                    {title}
                  </p>
                  <p
                    className="relative mt-2.5 pb-8 text-[13px] leading-relaxed"
                    style={{ color: tile.muted }}
                  >
                    {description}
                  </p>
                </button>
              );
            })}
          </div>

          <p className="border-t border-gray-200 text-center text-xs text-gray-400 py-3.5">
            You can find these ideas anytime inside your Copilot.
          </p>
        </div>
      </section>
    </div>
  );
}

// useSearchParams() needs a Suspense boundary above it — without one, a route
// that Next decides to prerender fails the build rather than at runtime.
export default function CopilotHomePage() {
  return (
    <Suspense>
      <CopilotHome />
    </Suspense>
  );
}
