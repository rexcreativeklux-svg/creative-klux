"use client";

/**
 * General — what this copilot runs on, what it may reach, and the three things
 * you can do to the copilot itself (clone, move, delete).
 *
 * ⚠️ The copilot's NAME and BRIEF are not here — they live in Personalization →
 * Identity, which is where the reference puts them. Two save moments for one
 * fact is how the two panels end up disagreeing about a copilot's name.
 *
 * ── What is real here ───────────────────────────────────────────────────────
 * Clone and Delete write through to the mock store, so a copy or a removal
 * lands in the sidebar rail and the /copilot/all grid immediately. The model,
 * app-access and voice choices are runtime settings the Copilot backend owns —
 * they are held locally and say so, rather than pretending to save.
 *
 * ⚠️ THE THREE PICKERS READ THE APP'S OWN REGISTRIES, not lists invented for
 * this panel:
 *   · models → (components)/studio/composerModel  (the same line-up the studio
 *     composer offers)
 *   · app areas → ../../../_data/surfaces  (the same surfaces a workflow runs in)
 *   · voices → (lib)/ai-engine/models KOKORO_TTS  (the same 28 voices Magic
 *     Studio speaks with, previewable from the same /voice-samples clips)
 * A copilot that offers a model the studio cannot run, or a voice that does not
 * exist, is worse than one fewer option.
 *
 * ⚠️ The model choice is deliberately NOT written to `setComposerModel`. That
 * store is a DEVICE preference shared by every composer in the app; a copilot's
 * model belongs to the copilot, and writing it there would change the model in
 * the studio because someone opened a settings sheet.
 */

import { useRef, useState } from "react";
import { Copy, FolderInput, Play, Sparkles, Square, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { MODEL_GROUPS, MODEL_OPTIONS } from "@/app/(components)/studio/composerModel";
import { KOKORO_TTS } from "@/(lib)/ai-engine/models";
import {
  removeCopilot,
  cloneCopilot,
  notifyPending,
} from "../../../_data/copilots";
import { CATEGORY_SURFACES } from "../../../_data/surfaces";
import SettingsSelect from "./SettingsSelect";
import { Section, Row, GhostButton } from "./settingsUi";

// ── Models ──────────────────────────────────────────────────────────────────
/** Let the backend pick per request — the default, and the first row. */
const AUTOMATIC = {
  id: "automatic",
  label: "Automatic",
  description: "Matched with the best model for each request",
  Icon: Sparkles,
};

const MODEL_CHOICES = [
  AUTOMATIC,
  ...MODEL_OPTIONS.map(({ id, label, group, icon }) => ({
    id,
    label,
    group,
    Icon: icon,
    // ⚠️ No option is marked `locked` yet. SettingsSelect draws the crown and
    // refuses the pick when one is, but which tiers gate which model is a
    // billing fact this app has no plan matrix for — inventing the gate would
    // be selling an upgrade the user may already have.
  })),
];

const modelLabel = (id) =>
  MODEL_CHOICES.find((m) => m.id === id)?.label ?? AUTOMATIC.label;

// ── App areas ───────────────────────────────────────────────────────────────
/** The surfaces a copilot can work in, as picker options. */
const SURFACE_OPTIONS = Object.entries(CATEGORY_SURFACES).map(
  ([category, { name, Icon, blurb }]) => ({
    id: category,
    label: name,
    description: blurb,
    Icon,
  }),
);

const ALL_AREAS = { id: "__all", label: "All app areas", description: "Everything this copilot could reach" };
const NO_AREAS = { id: "__none", label: "No app areas", description: "Chat only — it touches nothing" };
const AREA_OPTIONS = [ALL_AREAS, NO_AREAS, ...SURFACE_OPTIONS];

// ── Voices ──────────────────────────────────────────────────────────────────
/** Grouped by accent, the way the voice list is already ordered upstream. */
const VOICE_GROUPS = [...new Set(KOKORO_TTS.voices.map((v) => v.accent))].map(
  (accent) => ({ id: accent, label: `${accent} voices` }),
);

const VOICE_OPTIONS = KOKORO_TTS.voices.map((v) => ({
  id: v.id,
  label: v.name,
  description: `${v.accent} · ${v.gender}`,
  group: v.accent,
}));

/** Kokoro's best-graded voice, and Magic Studio's default too. */
const DEFAULT_VOICE = "af_heart";

export default function GeneralPanel({ copilot, onClose }) {
  const [confirming, setConfirming] = useState(false);

  const [chatModel, setChatModel] = useState(AUTOMATIC.id);
  const [autoModel, setAutoModel] = useState(AUTOMATIC.id);
  // Every area, expressed as the ids themselves rather than a magic "all"
  // string — so unticking one leaves a real list behind instead of a mode the
  // rest of the UI would have to keep translating.
  const [areas, setAreas] = useState(SURFACE_OPTIONS.map((o) => o.id));
  const [voice, setVoice] = useState(DEFAULT_VOICE);

  // ── Voice audition ────────────────────────────────────────────
  // Plays the pre-generated clip in /voice-samples. Deliberately NOT
  // magic-studio's useVoicePreview: that hook falls back to synthesizing
  // on-device, which pulls the ~93MB Kokoro engine in behind a settings
  // dropdown. Every shipped voice has a static clip; if one is missing, say so
  // rather than start a download nobody asked for.
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const toggleVoice = () => {
    const audio = (audioRef.current ??= new Audio());
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    audio.src = `/voice-samples/${voice}.mp3`;
    audio.onended = () => setPlaying(false);
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => {
        setPlaying(false);
        toast.error("No sample for that voice yet");
      });
  };

  /** Ticking an area: the two specials replace the list, the rest toggle. */
  const toggleArea = (id) => {
    if (id === ALL_AREAS.id) return setAreas(SURFACE_OPTIONS.map((o) => o.id));
    if (id === NO_AREAS.id) return setAreas([]);
    setAreas((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const areaValue =
    areas.length === SURFACE_OPTIONS.length
      ? [ALL_AREAS.id, ...areas]
      : areas.length === 0
        ? [NO_AREAS.id]
        : areas;

  const areaLabel =
    areas.length === SURFACE_OPTIONS.length
      ? ALL_AREAS.label
      : areas.length === 0
        ? NO_AREAS.label
        : areas.length === 1
          ? (SURFACE_OPTIONS.find((o) => o.id === areas[0])?.label ?? "1 app area")
          : `${areas.length} app areas`;

  /** The upgrade link every model menu ends on. */
  const viewPlans = (
    <Link
      href="/billing"
      onClick={onClose}
      className="block rounded-lg bg-gray-900 px-4 py-2 text-center text-[13px] font-medium text-surface transition-colors hover:bg-gray-800"
    >
      View plans
    </Link>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* ── AI models ────────────────────────────────────────── */}
      <Section
        title="AI models"
        description="Choose models for chat and automations, or keep them on Automatic to pick the best one for each task."
      >
        <Row title="Chat" description="Used for conversations and tools in chat.">
          <SettingsSelect
            label="Chat model"
            value={chatModel}
            onChange={setChatModel}
            options={MODEL_CHOICES}
            groups={MODEL_GROUPS}
            display={modelLabel(chatModel)}
            footer={viewPlans}
            className="min-w-37.5"
          />
        </Row>
        <Row
          title="Automations"
          description="Used for scheduled and background tasks."
        >
          <SettingsSelect
            label="Automations model"
            value={autoModel}
            onChange={setAutoModel}
            options={MODEL_CHOICES}
            groups={MODEL_GROUPS}
            display={modelLabel(autoModel)}
            footer={viewPlans}
            className="min-w-37.5"
          />
        </Row>
      </Section>

      {/* ── Cross-app data access ────────────────────────────── */}
      <Section
        title="Cross-app data access"
        description="Which parts of Creative Klux this copilot may work in — read your kits and library, and (where you allow it) change them. Anything it publishes still runs under your connected accounts."
      >
        <SettingsSelect
          label="App areas"
          multiple
          searchable
          value={areaValue}
          onChange={toggleArea}
          options={AREA_OPTIONS}
          display={areaLabel}
          className="w-full sm:w-70"
        />
      </Section>

      {/* ── Voice ────────────────────────────────────────────── */}
      <Section
        title="Voice"
        description={`Pick the voice ${copilot.name} speaks in.`}
        action={
          <div className="flex items-center gap-2">
            <SettingsSelect
              label="Voice"
              searchable
              value={voice}
              onChange={(id) => {
                setVoice(id);
                audioRef.current?.pause();
                setPlaying(false);
              }}
              options={VOICE_OPTIONS}
              groups={VOICE_GROUPS}
              className="min-w-32.5"
            />
            <button
              type="button"
              onClick={toggleVoice}
              aria-label={playing ? "Stop preview" : "Play voice preview"}
              className="shrink-0 rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
            >
              {playing ? (
                <Square className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
          </div>
        }
      />

      {/* ── Clone ────────────────────────────────────────────── */}
      <Section
        title="Clone copilot"
        description="Create a copy of this copilot with its brief, workflows and settings."
        action={
          <GhostButton
            onClick={() => {
              cloneCopilot(copilot.id);
              toast.success(`${copilot.name} cloned`);
              onClose();
            }}
          >
            <Copy className="h-4 w-4" />
            Clone copilot
          </GhostButton>
        }
      />

      {/* ── Move ─────────────────────────────────────────────── */}
      <Section
        title="Move to folder"
        description="File this copilot under one of your folders."
        action={
          <GhostButton onClick={() => notifyPending("Folders")}>
            <FolderInput className="h-4 w-4" />
            Move copilot
          </GhostButton>
        }
      />

      {/* ── Delete ───────────────────────────────────────────── */}
      <Section
        title="Delete this copilot"
        description="Removes it from your catalog along with its conversations. Any connected channel stops working immediately, and this cannot be undone."
        action={
          !confirming && (
            <GhostButton danger onClick={() => setConfirming(true)}>
              <Trash2 className="h-4 w-4" />
              Delete this copilot
            </GhostButton>
          )
        }
      >
        {confirming && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[13px] text-red-700">
              Delete {copilot.name}? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <GhostButton onClick={() => setConfirming(false)}>
                Cancel
              </GhostButton>
              <GhostButton
                danger
                onClick={() => {
                  removeCopilot(copilot.id);
                  toast.success(`${copilot.name} deleted`);
                  onClose();
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </GhostButton>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
