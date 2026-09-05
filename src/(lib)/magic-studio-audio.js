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

/**
 * May a hosted voice be auditioned by ASKING THE BACKEND TO SPEAK IT?
 *
 * ⚠️ TRUE MEANS EVERY FIRST TAP ON ▶ COSTS A GENERATION. There is no cheap way
 * to hear an Aura-2 voice: it exists only behind `POST /magic-studio/generate`,
 * so a preview is a real, billed run that also files a history record the user
 * never asked to keep. With this on, someone browsing the picker to find a voice
 * they like spends money before they have made anything.
 *
 * ⚠️ IT IS A BRIDGE, NOT THE DESTINATION. The intended answer is the static
 * clips under /public/voice-samples/aura/ — generated ONCE, committed, then free
 * and instant for everyone forever (see that folder's README, and
 * `npm run aura-samples`). Those files do not exist yet, and this is what gives
 * users a working ▶ in the meantime.
 *
 * ⚠️ TURNING IT OFF IS EDITING THIS ONE VALUE. The static-clip path is checked
 * FIRST and always has been, so a voice whose file has landed is already being
 * played from disk rather than generated — flipping this to `false` only removes
 * the fallback for the ones still missing. Nothing else needs touching, and
 * deleting the feature is this constant plus the `generateSample` branch in
 * useVoicePreview.
 *
 * The same switch shape as AUDIO_ENGINE above, and for the same reason: a
 * decision about money should be one obvious line, not a condition spread
 * through a component.
 */
export const PREVIEW_BY_GENERATING = true;

/**
 * How many voices one session may audition BY GENERATING before it stops.
 *
 * ⚠️ THE WHOLE POINT IS THE ACCIDENT, not the determined user. Forty cards in a
 * grid is forty things to tap, and tapping them all is normal browsing
 * behaviour that would quietly cost forty generations. Anyone who genuinely
 * needs to hear more can reload; the cap resets with the session.
 *
 * Counts GENERATED previews only — a voice played from a static clip or from the
 * on-device engine is free and never counted.
 */
export const MAX_GENERATED_PREVIEWS = 10;

// ─────────────────────────────────────────────────────────────────────────────
// VOICE FACES
// ─────────────────────────────────────────────────────────────────────────────

/** Pexels CDN helper (free license, stable URLs), square and small. */
const face = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&h=130&w=130&fit=crop`;

/**
 * Portraits for the voice cards — a face where there used to be only a gender
 * glyph.
 *
 * ⚠️ THEY ILLUSTRATE THE VOICE, THEY ARE NOT A PICTURE OF THE SPEAKER. Nobody
 * here recorded anything: these are synthetic voices, and these are stock
 * photographs standing in for them the same way the style picker's photos stand
 * in for "cinematic". That is why the cards never pair a face with a claim about
 * a person — no bios, no "recorded by", just a name and a portrait.
 *
 * ⚠️ FEWER PHOTOS THAN VOICES, DELIBERATELY. Aura-2 has 24 feminine and 16
 * masculine voices; nine of each here means a face repeats every ninth card.
 * That is better than the alternatives — a stock library search per voice
 * produces a wall of images nobody has looked at, and generated avatars read as
 * placeholders. Assignment is BY INDEX, so a given voice keeps its face across
 * reloads rather than shuffling.
 *
 * ⚠️ EVERY ID WAS CHECKED AGAINST THE CDN and each photo was actually looked at
 * to sort it into the right list — a portrait attached to the wrong gender's
 * voice is a visible error, and the file names give no clue. A dead id degrades
 * to the gender glyph underneath rather than a broken-image frame (see the
 * voices panel), so one disappearing is untidy, not broken.
 */
const VOICE_FACES = {
  female: [
    face(415829),
    face(774909),
    face(733872),
    face(1130626),
    face(1181690),
    face(1239291),
    face(1310522),
    face(1181519),
    face(762020),
  ],
  male: [
    face(1043471),
    face(2379004),
    face(3831645),
    face(2182970),
    face(428364),
    face(736716),
    face(220453),
    face(91227),
    face(3760263),
  ],
};

/**
 * The portrait for the nth voice of a gender — stable, and wraps round.
 *
 * @param {"female"|"male"} gender
 * @param {number} index Position among that gender's voices.
 * @returns {string} A Pexels URL.
 */
export const voiceFace = (gender, index) => {
  const pool = VOICE_FACES[gender] || VOICE_FACES.female;
  return pool[index % pool.length];
};

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
 * ⚠️ THEY ARE AUDITIONED FROM STATIC CLIPS, NEVER BY GENERATING. Kokoro's voices
 * can be synthesised locally for free; an Aura voice can only be heard by asking
 * the backend to generate, which bills a generation and files a history record
 * for a sample nobody asked to keep — so auditioning one is NOT wired to the
 * generate endpoint, and must not be. Each card instead points at a
 * pre-generated clip under /voice-samples/aura/, and the ▶ appears only once
 * that file actually answers (the picker HEAD-probes it; see useVoicePreview).
 *
 * ⚠️ SO THE FOLDER IS WHAT TURNS THIS ON, one voice at a time. Drop
 * `asteria.mp3` in and Asteria gets a ▶ on the next open; the other 39 stay
 * silent until their file lands. Nothing here needs editing to add one — the
 * path is derived from the voice name, which is also why the file has to be
 * named exactly as the API spells the voice.
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
export const AURA_VOICE_ITEMS = (() => {
  // Faces are handed out per gender, so the nth feminine voice gets the nth
  // feminine portrait rather than the nth photo of the mixed list.
  const seen = { female: 0, male: 0 };
  return AURA_VOICES.map(([id, g]) => {
    const gender = g === "f" ? "female" : "male";
    return {
      value: id,
      label: `${id[0].toUpperCase()}${id.slice(1)}`,
      desc: `US · ${gender}`,
      icon: g === "f" ? Venus : Mars,
      img: voiceFace(gender, seen[gender]++),
      gender,
      group: `US ${gender} voices`,
      top: AURA_TOP_VOICES.has(id),
      // The clip to audition, IF it has been generated and committed — see the
      // warning above. Always tried first, and free when it is there.
      sample: `/voice-samples/aura/${id}.mp3`,
      // No local engine can say "asteria" — Kokoro has never heard the name.
      synth: false,
      // ⚠️ "THE BACKEND COULD SPEAK THIS", NOT "GO AHEAD AND ASK IT TO". Whether
      // that actually happens is PREVIEW_BY_GENERATING's call, not this flag's:
      // the card states what is technically possible for the voice, the switch
      // states what we are willing to spend. Keeping them apart is what makes
      // turning the cost off a one-line edit instead of forty.
      generate: true,
    };
  });
})();

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
