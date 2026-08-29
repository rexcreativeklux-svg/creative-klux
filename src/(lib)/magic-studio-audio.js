/**
 * magic-studio-audio.js
 * ─────────────────────────────────────────────────────────────────────────────
 * WHICH ENGINE MAKES THE AUDIO, and the voices the picker offers.
 *
 * ⚠️ NO "use client" HERE, DELIBERATELY. magicTools.js reads AUDIO_ENGINE at
 * module scope, and magicTools.js is imported by the /magic-studio page — a
 * SERVER component. Marking this file client-only makes that import fail at
 * module evaluation with "Attempted to call usesBackend() from the server but
 * usesBackend is on the client", and the whole section 500s before it renders.
 *
 * It stays server-safe because everything below is data and pure functions:
 * no fetch, no window, no AudioContext, no URL.createObjectURL. If any of those
 * is ever needed here, it belongs in a separate client module rather than a
 * directive on this one.
 *
 * Magic Studio's two audio tools each have two possible engines:
 *
 *   text_to_audio   backend    POST /magic-studio/generate  { tool: "text_to_audio" }
 *                   on-device  Kokoro-82M in a Web Worker   (src/(lib)/ai-engine)
 *   audio_to_text   backend    POST /magic-studio/generate  { tool: "audio_to_text" }
 *                   on-device  Whisper Base in a Web Worker (src/(lib)/ai-engine)
 *
 * ⚠️ REVERTING IS EDITING AUDIO_ENGINE BELOW, AND NOTHING ELSE. The on-device
 * paths are not deleted, not commented out and not moved — they are still the
 * same `tts.generate` / `stt.transcribe` calls they always were. Flip a value
 * and the tool goes back to running in the browser.
 *
 * ⚠️ THE VOICES ARE THE BACKEND'S, NOT KOKORO'S. The backend synthesises through
 * Deepgram Aura-2 (`@cf/deepgram/aura-2-en`) and takes ITS voice names —
 * `voice: "thalia"` — which Kokoro has never heard of, and vice versa. So the
 * picker's cards swap with the engine: whichever engine will do the run is the
 * one whose voices you are choosing between. Anything else means clicking
 * "Bella" and hearing Luna.
 */

import { Mars, Venus } from "lucide-react";

import { KOKORO_TTS } from "@/(lib)/ai-engine/models";

// ─────────────────────────────────────────────────────────────────────────────
// THE SWITCH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Which engine each tool uses. `"backend"` | `"on-device"`.
 *
 * Per tool rather than one global flag, so either can be moved back on its own
 * — which has already been useful once, when the hosted transcriber was down
 * and hosted speech was not.
 */
export const AUDIO_ENGINE = {
  text_to_audio: "backend",
  audio_to_text: "backend",
};

/** @returns {boolean} Does this tool generate server-side? */
export const usesBackend = (toolId) => AUDIO_ENGINE[toolId] === "backend";

// ─────────────────────────────────────────────────────────────────────────────
// VOICES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Aura-2's voices — what the picker shows when the backend is the engine.
 *
 * ⚠️ THE NAMES CAME FROM THE API, NOT FROM DOCS. Posting an unknown voice makes
 * Aura-2 answer with the whole enum:
 *
 *   422 {"detail":"Unknown voice '…' for @cf/deepgram/aura-2-en.
 *        Available: amalthea, andromeda, apollo, …"}
 *
 * These 40 are that list, verbatim. If the backend ever reports an unknown
 * voice for a card shown here, this table has drifted from that enum and the
 * enum is right.
 *
 * ⚠️ ALL 40 ARE US ENGLISH — the model is the `-en` build, so unlike Kokoro
 * there are no British voices to offer and the cards group by gender alone. The
 * picker groups by array order, so the feminine voices are one contiguous run.
 *
 * ⚠️ GENDER IS NOT SOMETHING THE API RETURNS. Only the names are. The genders
 * are transcribed from Deepgram's own Aura-2 listing, and are the one thing here
 * that was never verified against the service. If a card's icon disagrees with
 * what you hear, this column is wrong — the name is always right.
 *
 * ⚠️ `preview: false` — THESE CANNOT BE AUDITIONED. Kokoro's voices have static
 * clips under /voice-samples and can be synthesised locally for free; an Aura
 * voice can only be heard by asking the backend to generate, which bills a
 * generation and files a history record for a sample nobody asked to keep. So
 * the ▶ button is hidden for them rather than made expensive.
 */
const AURA_VOICES = [
  // Feminine
  ["amalthea", "f"], ["andromeda", "f"], ["asteria", "f"], ["athena", "f"],
  ["aurora", "f"], ["callista", "f"], ["cora", "f"], ["cordelia", "f"],
  ["delia", "f"], ["electra", "f"], ["harmonia", "f"], ["helena", "f"],
  ["hera", "f"], ["iris", "f"], ["janus", "f"], ["juno", "f"],
  ["luna", "f"], ["minerva", "f"], ["ophelia", "f"], ["pandora", "f"],
  ["phoebe", "f"], ["thalia", "f"], ["theia", "f"], ["vesta", "f"],
  // Masculine
  ["apollo", "m"], ["arcas", "m"], ["aries", "m"], ["atlas", "m"],
  ["draco", "m"], ["hermes", "m"], ["hyperion", "m"], ["jupiter", "m"],
  ["mars", "m"], ["neptune", "m"], ["odysseus", "m"], ["orion", "m"],
  ["orpheus", "m"], ["pluto", "m"], ["saturn", "m"], ["zeus", "m"],
];

/** Deepgram's flagship voices — the ★ badge, same as Kokoro's A/B grades. */
const AURA_TOP_VOICES = new Set([
  "asteria",
  "luna",
  "athena",
  "hera",
  "apollo",
  "arcas",
  "orion",
  "zeus",
]);

/** Voice cards for the "voices" panel, in the shape KOKORO_VOICE_ITEMS uses. */
export const AURA_VOICE_ITEMS = AURA_VOICES.map(([id, g]) => {
  const gender = g === "f" ? "female" : "male";
  return {
    value: id,
    label: `${id[0].toUpperCase()}${id.slice(1)}`,
    desc: `US · ${gender}`,
    icon: g === "f" ? Venus : Mars,
    gender,
    group: `US ${gender} voices`,
    top: AURA_TOP_VOICES.has(id),
    preview: false, // see the warning above
  };
});

/** Aura-2's flagship female voice — what an unrecognised id falls back to. */
const DEFAULT_AURA_VOICE = "asteria";

/** Every Aura name, for telling one apart from a stale Kokoro id. */
const AURA_VOICE_IDS = new Set(AURA_VOICES.map(([id]) => id));

/**
 * Kokoro voice id → nearest Aura-2 voice, same gender.
 *
 * ⚠️ A SAFETY NET, NOT THE PICKER'S PATH. With the cards swapped by
 * {@link voiceItemsFor}, `values.voice` is already an Aura name and needs no
 * translation. This catches the one case that would otherwise send a voice the
 * backend rejects: a composer still holding a Kokoro id from before the engine
 * was switched. Translating beats a 422, and beats silently falling through to
 * asteria.
 *
 * Accent does not survive — Aura-2 here is US-only, so the four British female
 * and four British male cards map to US voices.
 */
const KOKORO_TO_AURA_VOICE = {
  // US female
  af_heart: "asteria",
  af_bella: "luna",
  af_nicole: "athena",
  af_aoede: "aurora",
  af_kore: "cora",
  af_sarah: "callista",
  af_alloy: "delia",
  af_nova: "andromeda",
  af_sky: "iris",
  af_jessica: "juno",
  af_river: "phoebe",
  // US male
  am_fenrir: "zeus",
  am_michael: "apollo",
  am_puck: "orion",
  am_echo: "arcas",
  am_eric: "atlas",
  am_liam: "hermes",
  am_onyx: "draco",
  am_santa: "saturn",
  am_adam: "mars",
  // British female → nearest US female
  bf_emma: "helena",
  bf_isabella: "ophelia",
  bf_alice: "cordelia",
  bf_lily: "theia",
  // British male → nearest US male
  bm_george: "jupiter",
  bm_fable: "orpheus",
  bm_lewis: "neptune",
  bm_daniel: "odysseus",
};

/**
 * The voice name to send to the backend.
 *
 * Passes an Aura name straight through — the normal path. A Kokoro id only
 * turns up if the composer is holding one from before the switch, and gets
 * translated rather than rejected upstream.
 */
export function backendVoiceId(voiceId) {
  if (AURA_VOICE_IDS.has(voiceId)) return voiceId;
  return KOKORO_TO_AURA_VOICE[voiceId] || DEFAULT_AURA_VOICE;
}

/** The voice cards this tool should show, for the engine that will run. */
export const voiceItemsFor = (toolId, kokoroItems) =>
  usesBackend(toolId) ? AURA_VOICE_ITEMS : kokoroItems;

/** The voice selected before anyone touches the picker. */
export const defaultVoiceFor = (toolId, kokoroDefault) =>
  usesBackend(toolId) ? DEFAULT_AURA_VOICE : kokoroDefault;

/**
 * What to call the voice that spoke, for the asset's caption.
 *
 * Derived from the id that was SENT rather than the label that was shown, so a
 * translated stale id captions itself honestly instead of naming a voice the
 * user cannot hear.
 */
export function voiceLabelFor(toolId, voiceId) {
  if (usesBackend(toolId)) {
    const name = backendVoiceId(voiceId);
    return `${name[0].toUpperCase()}${name.slice(1)} · US English`;
  }
  return (
    KOKORO_TTS.voices.find((v) => v.id === voiceId)?.label || "Kokoro voice"
  );
}
