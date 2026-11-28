"use client";

/**
 * /copilot/templates — every starter task in one place.
 *
 * The /copilot home shows one category of ideas at a time under its composer;
 * this is the full catalog, searchable and filterable. Same tiles (IdeaTile),
 * same data (_data/ideas), so the two never drift.
 *
 * Picking a template creates its copilot under the template's name and asks
 * its task (useTemplateLauncher) — the same thing a tile on the home does.
 *
 * `?category=` — the home's "View all" opens this page on the tab it was on.
 */

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import IdeaTile from "../_components/IdeaTile";
import useTemplateLauncher from "../_components/useTemplateLauncher";
import { CATEGORIES, IDEAS } from "../_data/ideas";

const ALL = "All";

function CopilotTemplates() {
  const searchParams = useSearchParams();
  const { launch, busyName } = useTemplateLauncher();
  // Seed only: the initial tab, then the pills own it.
  const [category, setCategory] = useState(() => {
    const c = searchParams.get("category");
    return CATEGORIES.includes(c) ? c : ALL;
  });
  const [query, setQuery] = useState("");

  // Flattened once, each idea tagged with its category for the eyebrow.
  const allIdeas = useMemo(
    () =>
      CATEGORIES.flatMap((c) =>
        (IDEAS[c] ?? []).map((idea) => ({ ...idea, category: c })),
      ),
    [],
  );

  const term = query.trim().toLowerCase();
  const visible = allIdeas.filter(
    (idea) =>
      (category === ALL || idea.category === category) &&
      (!term ||
        idea.name.toLowerCase().includes(term) ||
        idea.title.toLowerCase().includes(term) ||
        idea.description.toLowerCase().includes(term)),
  );

  return (
    <div className="min-h-full pt-header bg-[#eef1f7] dark:bg-page">
      <div className="px-4 md:px-10 py-8 pb-10">
        {/* ── Header ──────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Templates
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Ready-made copilots, each with a task to start on. Pick one to
            create it.
          </p>
        </div>

        {/* ── Toolbar ─────────────────────────────────────────── */}
        <div className="mt-6 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-2 flex-1 md:max-w-md px-3 py-2 rounded-lg border border-gray-300 bg-surface">
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates"
              className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
            {[ALL, ...CATEGORIES].map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[13px] border transition-colors cursor-pointer ${
                    active
                      ? "bg-gray-900 text-surface border-gray-900 font-semibold"
                      : "bg-surface text-gray-600 border-gray-200 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Grid ────────────────────────────────────────────── */}
        {visible.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visible.map((idea, i) => (
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
        ) : (
          <div className="mt-16 text-center">
            <p className="text-sm text-gray-500">No templates match your search.</p>
            <button
              onClick={() => {
                setQuery("");
                setCategory(ALL);
              }}
              className="mt-2 text-sm text-blue-600 hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// useSearchParams() needs a Suspense boundary above it — without one, a route
// that Next decides to prerender fails the build rather than at runtime.
export default function CopilotTemplatesPage() {
  return (
    <Suspense>
      <CopilotTemplates />
    </Suspense>
  );
}
