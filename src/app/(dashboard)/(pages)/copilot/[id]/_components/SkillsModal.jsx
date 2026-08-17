"use client";

/**
 * SkillsModal — the browse-everything dialog behind "Browse all" on the Skills
 * tab and "Browse skills" in the Add Skill menu.
 *
 * TWO TABS over one catalog:
 *   • Your workspace — the skills this workspace has added. Empty until it
 *     isn't, which is why the search there answers "No skills match your
 *     search" rather than pretending the catalog is missing.
 *   • Suggested — everything else, each with a + to add it.
 *
 * ⚠️ Adding is REAL and local (see the store at the foot of _data/skills.js), so
 * a skill added here appears under Your workspace the same instant and survives
 * closing the dialog. Running one is the backend's call.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 */

import { useState } from "react";
import { Search, Plus, Check, X } from "lucide-react";
import ResponsiveModal from "@/app/(components)/ui/ResponsiveModal";
import {
  ALL_SKILLS,
  SKILL_AUTHOR,
  useAddedSkills,
  addSkill,
  removeSkill,
} from "../../_data/skills";
import SkillCard from "./SkillCard";

const TABS = ["Your workspace", "Suggested"];

export default function SkillsModal({ isOpen, onClose }) {
  const addedSlugs = useAddedSkills();
  const [tab, setTab] = useState("Suggested");
  const [query, setQuery] = useState("");

  const term = query.trim().toLowerCase();
  const pool =
    tab === "Your workspace"
      ? ALL_SKILLS.filter((s) => addedSlugs.includes(s.slug))
      : ALL_SKILLS;

  const visible = pool.filter(
    (skill) =>
      !term ||
      skill.slug.toLowerCase().includes(term) ||
      skill.description.toLowerCase().includes(term),
  );

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Skills"
      size="3xl"
      fullHeightSheet
    >
      <p className="-mt-1 text-sm text-gray-500">
        Discover and add skills your copilot can run.
      </p>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div className="mt-5 flex items-center gap-6 border-b border-gray-200">
        {TABS.map((name) => {
          const on = tab === name;
          const count = name === "Your workspace" ? addedSlugs.length : null;
          return (
            <button
              key={name}
              onClick={() => setTab(name)}
              aria-pressed={on}
              className={`-mb-px flex items-center gap-1.5 border-b-2 pb-2.5 text-sm transition-colors cursor-pointer ${
                on
                  ? "border-blue-600 text-gray-900 font-semibold"
                  : "border-transparent text-gray-500 font-medium hover:text-gray-900"
              }`}
            >
              {name}
              {/* The count is what tells the user this tab is worth opening —
                  without it, "Your workspace" looks the same empty or full. */}
              {count > 0 && (
                <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-500">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Search ──────────────────────────────────────────────── */}
      <div className="mt-5 flex items-center gap-2 rounded-lg border border-gray-300 bg-surface px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skills"
          className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="shrink-0 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Results ─────────────────────────────────────────────── */}
      {visible.length ? (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {visible.map((skill) => {
            const isAdded = addedSlugs.includes(skill.slug);
            return (
              <SkillCard
                key={skill.slug}
                skill={skill}
                author={SKILL_AUTHOR}
                clamp={3}
                action={
                  <button
                    onClick={() =>
                      isAdded ? removeSkill(skill.slug) : addSkill(skill.slug)
                    }
                    aria-label={
                      isAdded
                        ? `Remove /${skill.slug} from your workspace`
                        : `Add /${skill.slug} to your workspace`
                    }
                    className={`shrink-0 rounded-lg p-1 transition-colors cursor-pointer ${
                      isAdded
                        ? "text-emerald-600 hover:bg-emerald-50"
                        : "text-gray-500 hover:bg-gray-200 hover:text-gray-900"
                    }`}
                  >
                    {isAdded ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </button>
                }
              />
            );
          })}
        </div>
      ) : (
        // Two different nothings: a search that found nothing, and a workspace
        // with nothing in it yet. The fix for each is different, so they do not
        // share a sentence.
        <p className="py-16 text-center text-sm text-gray-500">
          {term
            ? "No skills match your search"
            : "No skills added yet — add one from Suggested."}
        </p>
      )}
    </ResponsiveModal>
  );
}
