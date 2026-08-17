"use client";

/**
 * SkillCard — one skill as a row: the slash command, what it does, and who
 * published it.
 *
 * Used by the Skills tab's browse list and by the browse-all modal, so the two
 * cannot disagree about what a skill looks like. The only difference between
 * them is the ACTION on the right, which is the caller's to supply — the tab
 * runs a skill, the modal adds it to the workspace.
 *
 * @param {Object} props
 * @param {Object} props.skill    An entry from _data/skills.
 * @param {string} props.author
 * @param {React.ReactNode} [props.action]  Control in the top-right corner.
 * @param {() => void} [props.onClick]      Makes the whole card the trigger.
 * @param {number} [props.clamp]            Lines to clamp the description to.
 *   The modal's two narrow columns need it; the tab's wider list does not.
 */

import { BadgeCheck } from "lucide-react";
import SurfaceChip from "../../_components/SurfaceChip";

/**
 * ⚠️ A static map, not `line-clamp-${clamp}`. Tailwind scans source TEXT, so an
 * interpolated class name is never generated and the clamp silently does
 * nothing — the exact trap ResponsiveModal's SIZE_CLASS map documents.
 */
const CLAMP = { 2: "line-clamp-2", 3: "line-clamp-3", 4: "line-clamp-4" };

export default function SkillCard({ skill, author, action, onClick, clamp }) {
  // A card with its own action button cannot itself be a <button> — nesting one
  // inside another is invalid markup, and browsers resolve it by dropping one.
  const Root = onClick ? "button" : "div";

  return (
    <Root
      onClick={onClick}
      className={`group flex flex-col rounded-xl border border-gray-200 bg-surface text-left transition-colors ${
        onClick ? "hover:bg-gray-100 cursor-pointer" : ""
      }`}
    >
      <div className="flex flex-1 flex-col p-4">
        <span className="flex items-start justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2">
            <SurfaceChip category={skill.surface} />
            <span className="truncate font-mono text-sm font-semibold text-gray-900">
              /{skill.slug}
            </span>
          </span>
          {action}
        </span>
        <span
          className={`mt-2 text-[13px] leading-relaxed text-gray-500 ${CLAMP[clamp] ?? ""}`}
        >
          {skill.description}
        </span>
      </div>
      {/* Provenance sits under a rule — it is who wrote this, not part of what
          it does. */}
      <span className="flex items-center gap-2 border-t border-gray-200 px-4 py-2.5 text-[12px] text-gray-500">
        <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        {author}
        <span className="text-gray-300">•</span>
        Updated on {skill.updated ?? "—"}
      </span>
    </Root>
  );
}
