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
 * Ariziy → Google Wavenet (verified 2026-10-15; it was Deepgram Aura-2 before)
 * and takes ITS voice ids — `voice: "en-US-Wavenet-C"` — which Kokoro has never
 * heard of, and vice versa. So the picker's cards swap with the engine:
 * whichever engine will do the run is the one whose voices you are choosing
 * between. Anything else means clicking "Bella" and hearing someone else.
 */

import { Mars, Venus } from "lucide-react";

import { KOKORO_TTS } from "@/(lib)/ai-engine/models";
import WAVENET_MANIFEST from "@/(lib)/wavenet-voice-samples.json";
import { WAVENET_VOICE_NAMES } from "@/(lib)/wavenet-voice-labels";

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
 * ⚠️ TRUE MEANS EVERY FIRST TAP ON ▶ COSTS A GENERATION. A hosted voice exists
 * only behind `POST /magic-studio/generate`, so a generated preview is a real,
 * billed run that also files a history record the user never asked to keep.
 * With this on, someone browsing the picker spends money before they have made
 * anything.
 *
 * ⚠️ OFF, BECAUSE EVERY HOSTED VOICE NOW HAS A CLIP. `npm run wavenet-samples`
 * made one per voice — hosted on the CDN, listed in wavenet-voice-samples.json —
 * so ▶ plays that, free and instant. The only voice this could still help is one
 * the vendor adds before the samples are regenerated, and regenerating is the
 * fix for that, not paying per tap.
 *
 * ⚠️ TURNING IT BACK ON IS EDITING THIS ONE VALUE. The clip is checked FIRST
 * either way, so a voice with a clip is never generated — `true` only adds the
 * fallback for voices without one, capped by MAX_GENERATED_PREVIEWS. Deleting
 * the feature is this constant plus the `generatePreview` branch in
 * useVoicePreview.
 *
 * The same switch shape as AUDIO_ENGINE above, and for the same reason: a
 * decision about money should be one obvious line, not a condition spread
 * through a component.
 */
export const PREVIEW_BY_GENERATING = false;

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
 * ⚠️ FEWER PHOTOS THAN VOICES, DELIBERATELY. The hosted catalogue has 14
 * feminine and 13 masculine voices; nine of each here means a face repeats every
 * ninth card of a gender.
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
 * The hosted voices — what the picker shows when the backend is the engine.
 *
 * ⚠️ THE LIST IS GENERATED, NOT TYPED. wavenet-voice-samples.json is written by
 * `npm run wavenet-samples` straight from Ariziy's `GET /v1/voices` (Google
 * Wavenet — 27 English voices: en-US, en-GB, en-AU, en-IN), with a CDN clip
 * per voice. The vendor's list DOES change — it went from 161 voices in 47
 * locales to these 27 on 2026-10-15 — so re-probe and re-run the script when
 * it does; never hand-edit the JSON. A voice the vendor drops disappears from
 * the picker on the next run.
 *
 * ⚠️ THE BACKEND DOES NOT VALIDATE `voice`. It forwards whatever it is sent, and
 * a name the provider does not know comes back as `422 "Text to speech failed
 * (HTTP 502)"` — which is exactly how the old Aura-2 names (asteria, luna, …)
 * fail now. So a card must only ever offer an id from this list, and anything
 * else goes through backendVoiceId's safety net.
 *
 * ⚠️ ONE LIST, NO LANGUAGE FILTER. Every voice here is English, so the picker
 * shows all of them at once and every sample speaks the same English line.
 *
 * ⚠️ THE NAMES ARE OURS — see wavenet-voice-labels.js. A voice that file has
 * not caught up with shows as "Voice <letter>".
 *
 * ⚠️ ORDER IS WHAT GROUPS THEM. The voices panel groups CONSECUTIVE items that
 * share a `group`, so the cards are sorted female first, then A–Z by name —
 * one "Female voices" run, then one "Male voices" run.
 */

/** "en-US-Wavenet-C" → "C", the only part of the id that tells voices apart. */
const voiceLetter = (id) => String(id).split("-").pop();

/** Voice cards for the "voices" panel, in the shape KOKORO_VOICE_ITEMS uses. */
export const HOSTED_VOICE_ITEMS = (() => {
  const cards = (WAVENET_MANIFEST.voices || [])
    .filter((v) => typeof v?.voice === "string" && v.voice)
    .map((v) => {
      const gender = v.gender === "male" ? "male" : "female";
      return {
        value: v.voice,
        label: WAVENET_VOICE_NAMES[v.voice] || `Voice ${voiceLetter(v.voice)}`,
        icon: gender === "female" ? Venus : Mars,
        gender,
        // Not shown — kept so a stale Kokoro id can be mapped to the nearest
        // accent (see resolveHostedVoice).
        language: v.language,
        group: gender === "female" ? "Female voices" : "Male voices",
        // The vendor marks no flagship voices (every `verified` is false).
        top: false,
        sample: v.sample?.url || null,
        // ⚠️ THE MANIFEST ALREADY PROVES THE CLIP EXISTS — the script uploaded it
        // and recorded the URL it got back — so useVoicePreview plays it without
        // a HEAD probe first. A cross-origin HEAD per card per open would buy
        // nothing.
        sampleKnown: Boolean(v.sample?.url),
        // No local engine can say "en-US-Wavenet-C" — Kokoro has never heard it.
        synth: false,
        // ⚠️ "THE BACKEND COULD SPEAK THIS", NOT "GO AHEAD AND ASK IT TO". Whether
        // a preview is ever generated is PREVIEW_BY_GENERATING's call: the card
        // states what is possible, the switch states what we will spend.
        generate: true,
      };
    })
    .sort(
      (a, b) =>
        (a.gender === b.gender ? 0 : a.gender === "female" ? -1 : 1) ||
        a.label.localeCompare(b.label, "en"),
    );

  // Faces are dealt per gender AFTER sorting, so the nth feminine card gets the
  // nth feminine portrait and a voice keeps its face across reloads.
  const seen = { female: 0, male: 0 };
  return cards.map((card) => ({
    ...card,
    img: voiceFace(card.gender, seen[card.gender]++),
  }));
})();

/** Every hosted card by id — for telling a real voice apart from a stale one. */
const HOSTED_VOICE_BY_ID = new Map(HOSTED_VOICE_ITEMS.map((v) => [v.value, v]));

/**
 * The voice selected before anyone touches the picker: Ava, US English.
 *
 * ⚠️ NOT THE CATALOGUE'S OWN `default`. That names "en-US-Wavenet-X", which is
 * not in its own list. Falls back to the first card if Ava ever leaves.
 */
const DEFAULT_HOSTED_VOICE = HOSTED_VOICE_BY_ID.has("en-US-Wavenet-C")
  ? "en-US-Wavenet-C"
  : HOSTED_VOICE_ITEMS[0]?.value;

/**
 * Kokoro voice-id prefix → the hosted locale and gender nearest it.
 *
 * Accent survives now — British Kokoro voices land on en-GB, where Aura-2 only
 * ever had US voices to offer.
 */
const KOKORO_PREFIX_TO_HOSTED = {
  af: ["en-US", "female"],
  am: ["en-US", "male"],
  bf: ["en-GB", "female"],
  bm: ["en-GB", "male"],
};

/**
 * Resolve any voice id to a hosted one, and say whether it had to be translated.
 *
 * @param {string} voiceId
 * @returns {{ id: string, translated: boolean }}
 */
function resolveHostedVoice(voiceId) {
  if (HOSTED_VOICE_BY_ID.has(voiceId)) return { id: voiceId, translated: false };
  const prefix = /^(af|am|bf|bm)_/.exec(String(voiceId))?.[1];
  const [locale, gender] = KOKORO_PREFIX_TO_HOSTED[prefix] || [];
  const nearest = locale
    ? HOSTED_VOICE_ITEMS.find((v) => v.language === locale && v.gender === gender)
    : null;
  return { id: nearest?.value || DEFAULT_HOSTED_VOICE, translated: true };
}

/**
 * The voice id to send to the backend.
 *
 * Passes a hosted id straight through — the normal path, since the cards only
 * offer hosted ids. ⚠️ A SAFETY NET for anything else, because the backend
 * forwards unknown names and they fail upstream (see above): a Kokoro id maps to
 * the same accent and gender, and anything else — an Aura-2 name still held by a
 * tab opened before this list changed — to the default. Logged, so a
 * translation is never silent.
 */
export function backendVoiceId(voiceId) {
  const { id, translated } = resolveHostedVoice(voiceId);
  if (translated) {
    console.warn(
      `⚠️ [magic-studio] "${voiceId}" is not a hosted voice — sending "${id}" instead`,
    );
  }
  return id;
}

/** The voice cards this tool should show, for the engine that will run. */
export const voiceItemsFor = (toolId, kokoroItems) =>
  usesBackend(toolId) ? HOSTED_VOICE_ITEMS : kokoroItems;

/** The voice selected before anyone touches the picker. */
export const defaultVoiceFor = (toolId, kokoroDefault) =>
  usesBackend(toolId) ? DEFAULT_HOSTED_VOICE : kokoroDefault;

/**
 * What to call the voice that spoke, for the asset's caption.
 *
 * Derived from the id that was SENT rather than the label that was shown, so a
 * translated stale id captions itself honestly instead of naming a voice the
 * user cannot hear.
 */
export function voiceLabelFor(toolId, voiceId) {
  if (usesBackend(toolId)) {
    // The name alone, like Kokoro's — every hosted voice speaks English here, so
    // naming its locale ("· Japanese") would describe a language you never hear.
    const card = HOSTED_VOICE_BY_ID.get(resolveHostedVoice(voiceId).id);
    return card ? card.label : "Hosted voice";
  }
  return (
    KOKORO_TTS.voices.find((v) => v.id === voiceId)?.label || "Kokoro voice"
  );
}
