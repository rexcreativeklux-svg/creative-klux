"use client";

/**
 * Personalization — two halves of the same relationship: who the COPILOT is
 * (Identity) and what it knows about YOU (Memory).
 *
 * ⚠️ This is where a copilot is named and briefed, NOT General. General is what
 * the copilot runs on — models, app access, voice, and the three destructive
 * actions. Identity is what it IS. Keeping the name field in both would give
 * the user two "save" moments for one fact.
 *
 * Tabs rather than two sections: the Memory half is about the person reading
 * the sheet, and stacking "your name" under "the copilot's name" is how you get
 * someone typing their own name into the copilot's field.
 *
 * ── What saves ──────────────────────────────────────────────────────────────
 * Identity writes through to the mock store on blur, so a rename shows up in
 * the sidebar rail and the /copilot/all grid immediately — no Save button,
 * because there is nothing to batch. Memory needs a server: it is a profile the
 * copilot accumulates across conversations, so the fields hold their value for
 * the session and the panel says where they are going.
 */

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { updateCopilot } from "../../../_data/copilots";

const TABS = ["Identity", "Memory"];

/** The house field label, repeated four times in here. */
function FieldLabel({ htmlFor, children, optional }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[13px] font-medium text-gray-900"
    >
      {children}
      {optional && (
        <span className="ml-1 font-normal text-gray-400">(optional)</span>
      )}
    </label>
  );
}

const FIELD =
  "w-full rounded-xl border border-gray-200 bg-surface px-4 py-2.5 text-[13.5px] text-gray-900 outline-none transition-all duration-150 placeholder:text-gray-400 focus:border-[#1447e6] focus:ring-3 focus:ring-[#1447e6]/10";

export default function PersonalizationPanel({ copilot }) {
  const { user } = useAuth();
  const [tab, setTab] = useState(TABS[0]);

  // ── Identity (writes through) ─────────────────────────────────
  const [name, setName] = useState(copilot.name);
  const [about, setAbout] = useState(copilot.description);

  /**
   * Commit on blur, not on every keystroke: the copilot's name is on screen
   * behind this sheet, and watching it change letter by letter reads as a bug.
   */
  const commit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(copilot.name); // a copilot cannot be nameless — put it back
      toast.error("A copilot needs a name");
      return;
    }
    if (trimmed === copilot.name && about.trim() === copilot.description) return;
    updateCopilot(copilot.id, {
      name: trimmed,
      description: about.trim(),
      editedAgo: "just now",
    });
  };

  // ── Memory (session-only) ─────────────────────────────────────
  // Seeded from the signed-in account, so the field starts with the name this
  // copilot would already know rather than empty.
  const [yourName, setYourName] = useState(user?.name || user?.username || "");
  const [aboutYou, setAboutYou] = useState("");

  return (
    <div className="flex flex-col">
      {/* Underline tabs, the same construction the Plugins screen uses — these
          switch the whole panel, which is a level of navigation rather than a
          filter over one list. */}
      <div className="flex items-center gap-6 border-b border-gray-200">
        {TABS.map((name) => {
          const active = tab === name;
          return (
            <button
              key={name}
              onClick={() => setTab(name)}
              aria-pressed={active}
              className={`-mb-px border-b-2 pb-2.5 text-sm transition-colors cursor-pointer ${
                active
                  ? "border-gray-900 font-semibold text-gray-900"
                  : "border-transparent font-medium text-gray-500 hover:text-gray-900"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      {tab === "Identity" ? (
        <div className="mt-5 flex flex-col gap-4">
          {/* The avatar, at the size the reference gives it. Not a picker: the
              tint and glyph come from the copilot's category, and there is
              nowhere to store an uploaded one until the backend has copilots. */}
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-xl ${copilot.tint}`}
            title={copilot.name}
          >
            <copilot.Icon className="h-7 w-7 text-white" />
          </span>

          <div>
            <FieldLabel htmlFor="copilot-name">Copilot name</FieldLabel>
            <input
              id="copilot-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commit}
              placeholder="Brand Warden"
              className={FIELD}
            />
          </div>

          <div>
            <FieldLabel htmlFor="copilot-about" optional>
              About the copilot
            </FieldLabel>
            {/* Resizable and tall: this is the brief the copilot works from,
                and the reference lets it hold a page of markdown. */}
            <textarea
              id="copilot-about"
              rows={9}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              onBlur={commit}
              placeholder={`# Who you are\n\nWhat this copilot is for, how it should behave, and anything it must never do.`}
              className={`${FIELD} min-h-40 resize-y font-mono text-[12.5px] leading-relaxed`}
            />
            <p className="mt-1.5 text-[11px] leading-snug text-gray-400">
              Written first-person, in Markdown. It is what the copilot shows on
              its card and what it works from in every conversation.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-4">
          <div>
            <FieldLabel htmlFor="your-name">Your name</FieldLabel>
            <input
              id="your-name"
              value={yourName}
              onChange={(e) => setYourName(e.target.value)}
              placeholder="What should it call you?"
              className={FIELD}
            />
          </div>

          <div>
            <FieldLabel htmlFor="about-you" optional>
              About you
            </FieldLabel>
            <textarea
              id="about-you"
              rows={6}
              value={aboutYou}
              onChange={(e) => setAboutYou(e.target.value)}
              placeholder={`What do you sell, and to whom? How do you like work presented? What should it never do without asking?\n\nThe more it knows, the less you repeat yourself.`}
              className={`${FIELD} min-h-30 resize-y leading-relaxed`}
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-[13px] font-medium text-gray-900">
              Things {copilot.name} has learned about you:
            </p>
            {/* ⚠️ Never seeded. A remembered "fact" the user never said is the
                one mock in this sheet they would have to argue with. */}
            <p className="mt-2 text-[13px] text-gray-500">
              No memories saved yet.
            </p>
            <p className="mt-3 text-[11px] leading-snug text-gray-400">
              Your name and profile are held for this session — memory is stored
              by the Copilot backend.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
