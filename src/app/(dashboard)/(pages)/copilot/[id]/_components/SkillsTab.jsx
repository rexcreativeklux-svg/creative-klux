"use client";

/**
 * SkillsTab — the Plugins screen's second tab: named jobs a copilot can be
 * taught, invoked by slash command in a conversation.
 *
 * Three featured cards with a preview of what each hands back, then the browse
 * list under pills that ask "what do you want to do?".
 *
 * ⚠️ THE CATALOG IS CREATIVE KLUX'S OWN — see the ⚠️ at the top of
 * _data/skills.js. Every slug is work the studios actually do.
 *
 * ⚠️ ACTIVATING A SKILL OPENS IT IN THE CHAT, drafted, not sent — the composer
 * gets `/slug ` and the user says what to run it on. That is the same handoff
 * Workflows' "Send to chat" uses, and the reason it is a draft rather than a
 * send is the same: a skill fired from a browse screen would run against
 * nothing.
 *
 * @param {Object} props
 * @param {Object} props.copilot        Used to open the pills on ITS kind of work.
 * @param {(prompt: string) => void} props.onOpenInChat
 * @param {() => void} props.onBrowseAll
 */

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  SKILLS,
  FEATURED_SKILLS,
  SKILL_CATEGORIES,
  SKILL_AUTHOR,
  ALL_SKILLS,
  skillPrompt,
} from "../../_data/skills";
import SurfaceChip from "../../_components/SurfaceChip";
import PlatformChip from "../../_components/PlatformChip";
import SkillPreview from "./SkillPreview";
import SkillCard from "./SkillCard";

/**
 * Which pill a copilot's own work lands under, so the browse list opens on the
 * skills it is most likely to want. ⚠️ Keys are IDEAS categories (a copilot's
 * `category`); values are pills from SKILL_CATEGORIES — the two vocabularies are
 * deliberately different (product surface vs. the job you came to do), so this
 * is the one place that translates between them.
 */
const CATEGORY_TO_PILL = {
  Brand: "Make designs",
  Social: "Plan content",
  Ads: "Run ads",
  Performance: "Study performance",
  Product: "Prep products",
  Studio: "Plan content",
};

export default function SkillsTab({ copilot, onOpenInChat, onBrowseAll }) {
  const [pill, setPill] = useState(
    CATEGORY_TO_PILL[copilot.category] ?? "Recommended",
  );

  // "Recommended" is a view over the whole catalog, not a category on it: the
  // skills that match this copilot's own work, then everything else, so the tab
  // never opens on an empty list however the pills are edited.
  const visible =
    pill === "Recommended"
      ? [
          ...SKILLS.filter((s) => s.surface === copilot.category),
          ...SKILLS.filter((s) => s.surface !== copilot.category),
        ].slice(0, 6)
      : SKILLS.filter((s) => s.category === pill);

  return (
    <>
      {/* ── Recommended ─────────────────────────────────────────── */}
      <h2 className="mt-6 text-lg font-bold text-gray-900">Recommended skills</h2>
      {/* ⚠️ items-stretch + a fixed-height preview + a clamped description is
          what keeps the three cards LEVEL. Each preview mock is a different
          natural height (a checklist is taller than a before/after pair), so
          letting them size themselves pushed each card's title, slug and button
          to a different line and the row read as broken. The preview now sits in
          a fixed 16/10 box and the description clamps to three lines, so every
          row of the card lines up across all three — and `mt-auto` on the action
          holds the buttons together whatever is left over. */}
      <div className="mt-4 grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
        {FEATURED_SKILLS.map((skill) => (
          <div
            key={skill.slug}
            className="flex flex-col rounded-xl border border-gray-200 bg-gray-100 p-3"
          >
            <div
              className={`flex aspect-16/10 items-center justify-center overflow-hidden rounded-lg ${skill.tint} px-5`}
            >
              {/* The mock is capped so a wide card does not stretch it past the
                  size its 10px type was drawn for. */}
              <div className="w-full max-w-72">
                <SkillPreview preview={skill.preview} />
              </div>
            </div>

            <div className="flex flex-1 flex-col px-1 pt-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[15px] font-semibold text-gray-900">
                  {skill.name}
                </p>
                <span className="flex shrink-0 items-center gap-1.5">
                  <SurfaceChip category={skill.surface} />
                  {skill.platforms.map((platform) => (
                    <PlatformChip key={platform} platform={platform} />
                  ))}
                </span>
              </div>
              {/* The slash command IS the skill's name in use, so it is set in
                  mono and sits directly under the title. */}
              <p className="mt-1 font-mono text-[13px] text-gray-500">
                /{skill.slug}
              </p>
              <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-gray-500">
                {skill.description}
              </p>
              <div className="mt-auto flex justify-end pt-4">
                <button
                  onClick={() => onOpenInChat(skillPrompt(skill.slug))}
                  className="rounded-lg bg-gray-900 px-3.5 py-2 text-sm font-medium text-surface hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Activate skill
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Browse ──────────────────────────────────────────────── */}
      <div className="mt-10 border-t border-gray-200 pt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Browse by what you want to do
          </h2>
          <button
            onClick={onBrowseAll}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            Browse all
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        {/* Counted, not written down — the line cannot drift from the list. */}
        <p className="mt-1 text-sm text-gray-500">
          {ALL_SKILLS.length} skills across every part of your brand.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {SKILL_CATEGORIES.map((name) => {
            const on = pill === name;
            return (
              <button
                key={name}
                onClick={() => setPill(name)}
                aria-pressed={on}
                className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors cursor-pointer ${
                  on
                    ? "bg-gray-200 text-gray-900 font-semibold"
                    : "border border-gray-200 text-gray-500 font-medium hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-1 items-stretch gap-3 md:grid-cols-2">
          {visible.map((skill) => (
            <SkillCard
              key={skill.slug}
              skill={skill}
              author={SKILL_AUTHOR}
              clamp={3}
              onClick={() => onOpenInChat(skillPrompt(skill.slug))}
            />
          ))}
        </div>
      </div>
    </>
  );
}
