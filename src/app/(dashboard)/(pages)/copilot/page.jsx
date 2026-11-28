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

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot, ArrowRight } from "lucide-react";
import IdeaTile from "./_components/IdeaTile";
import useTemplateLauncher from "./_components/useTemplateLauncher";
import CopilotComposer from "./_components/CopilotComposer";
import CreateCopilotModal from "./_components/CreateCopilotModal";
import { CATEGORIES, IDEAS } from "./_data/ideas";
import { newConversationId } from "./_data/copilots";

// How many templates the home shows per category: one row of the desktop grid.
const HOME_TEMPLATE_COUNT = 3;

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
  // One row per category here — the full set lives on /copilot/templates,
  // behind "View all".
  const ideas = (IDEAS[activeCategory] ?? []).slice(0, HOME_TEMPLATE_COUNT);
  // A template click creates its copilot under the template's name and asks
  // its task — see useTemplateLauncher.
  const { launch, busyName } = useTemplateLauncher();

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
      {/* Hero + ideas are centred vertically as one block, so the space above
          and below is equal; the gaps between the elements are unchanged. */}
      <div className="flex flex-1 flex-col justify-center">
      <section className="flex flex-col items-center px-gutter pb-8">
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
      <section className="px-gutter pb-24 lg:pb-0">
        <div className="w-full rounded-2xl border border-gray-200 bg-surface shadow-sm">
          {/* Header row — category tabs, left-aligned and dot-separated, with
              "View all" (the full template list) on the right */}
          <div className="flex items-center gap-3 border-b border-gray-200 px-4 sm:px-5 py-3.5">
          <div className="flex flex-1 min-w-0 items-center gap-3 overflow-x-auto hide-scrollbar">
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
            <Link
              href={`/copilot/templates?category=${encodeURIComponent(activeCategory)}`}
              className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Idea cards — bold colour tiles, styled after the home page's
              template artwork: category eyebrow, big headline, short copy, and
              an accent shape along the bottom. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 sm:p-4">
            {ideas.map((idea, i) => (
              <IdeaTile
                key={idea.name}
                idea={idea}
                index={i}
                onClick={() => launch(idea)}
                busy={busyName === idea.name}
                disabled={!!busyName && busyName !== idea.name}
              />
            ))}
          </div>

          <p className="border-t border-gray-200 text-center text-xs text-gray-400 py-3.5">
            You can find these ideas anytime inside your Copilot.
          </p>
        </div>
      </section>
      </div>
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
