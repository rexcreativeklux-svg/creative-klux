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

import { useState } from "react";
import { Bot } from "lucide-react";
import PlatformChip from "./_components/PlatformChip";
import CopilotComposer from "./_components/CopilotComposer";
import { CATEGORIES, IDEAS } from "./_data/ideas";
import { notifyPending } from "./_data/copilots";

export default function CopilotHome() {
  const [task, setTask] = useState("");
  const [activeCategory, setActiveCategory] = useState("Brand");
  const ideas = IDEAS[activeCategory] ?? [];

  return (
    // No pb-nav: `main` in (dashboard)/layout.js reserves the mobile bottom
    // bar for every route, so repeating it here would only add dead space.
    <div className="min-h-full pt-header flex flex-col bg-[#eef1f7] dark:bg-page">
      {/* ── Hero ──────────────────────────────────────────────────
          ⚠️ THE HEIGHT IS MEASURED, NOT CHOSEN — the same trick the home page
          uses. On desktop the hero is sized so that whatever follows it starts
          exactly --ck-rail-top above the bottom of the window, which is where
          the sidebar's THEME row begins. That makes the ideas section's top
          rule continue the sidebar's THEME hairline straight across the screen
          instead of cutting the window at an unrelated height.

          Sizing it from the BOTTOM is the point: the rule has to land on the
          sidebar's hairline, and only the viewport's bottom edge knows where
          that is. Any fixed hero height would drift the moment the window
          resized. See the --ck-rail-* block in globals.css.

          ⚠️ `lg`, not `md` — one of the places that must agree on where the
          sidebar appears. Below it there is no sidebar to line up with, so the
          hero just takes its natural height and the section flows.

          justify-center comes with the height: without it the content sits at
          the top of a much taller box. pt-24 then nudges the centred group
          down by half its value, the same way the home hero's pt-[clamp()]
          does. */}
      <section className="flex flex-col items-center px-gutter pt-10 sm:pt-14 lg:pt-24 pb-12 lg:min-h-[calc(100dvh-var(--spacing-header)-var(--ck-rail-top))] lg:justify-center">
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
          onSubmit={() => notifyPending("Creating a copilot from a task")}
          className="mt-10 w-full max-w-xl"
        />

        <p className="mt-14 text-xs text-gray-500">
          Or start from one of these ideas:
        </p>
      </section>

      {/* ── Starter ideas ───────────────────────────────────────── */}
      <section className="bg-surface border-t border-gray-200 flex-1 pb-20 md:pb-0">
        {/* Category tabs — pinned to --ck-rail-row on desktop, the height of the
            sidebar's THEME row. With the hero above sized to --ck-rail-top, that
            puts this strip's two rules (the section's border-t above, the card
            grid's border-t below) on exactly the same screen lines as the two
            rules bracketing THEME, so both hairlines run unbroken across the
            window. Same construction as the home rail's tab row — change one and
            check the other. Below `lg` it just flows. */}
        <div className="flex items-center md:justify-center gap-6 overflow-x-auto hide-scrollbar px-4 py-3 lg:h-(--ck-rail-row) lg:py-0">
          {CATEGORIES.map((category) => {
            const active = activeCategory === category;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex items-center gap-1.5 shrink-0 text-[13px] cursor-pointer transition-colors
                  ${active ? "text-gray-900 font-semibold" : "text-gray-500 hover:text-gray-900"}`}
              >
                {active && (
                  <span className="h-1.5 w-1.5 rounded-[2px] bg-blue-600" />
                )}
                {category}
              </button>
            );
          })}
        </div>

        {/* Idea cards — gap-px over a gray backdrop draws the hairline grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-200 border-y border-gray-200">
          {ideas.map(({ title, platforms, description }) => (
            <div key={title} className="bg-surface p-6">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[15px] font-semibold text-gray-900">
                  {title}
                </p>
                <span className="flex items-center gap-1.5">
                  {platforms.map((platform) => (
                    <PlatformChip key={platform} platform={platform} />
                  ))}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 py-4">
          You can find these ideas anytime inside your Copilot.
        </p>
      </section>
    </div>
  );
}
