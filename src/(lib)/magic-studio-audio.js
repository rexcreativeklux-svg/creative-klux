"use client";

/**
 * magic-studio-audio.js
 * ─────────────────────────────────────────────────────────────────────────────
 * WHICH ENGINE MAKES THE AUDIO — and the single place to change your mind.
 *
 * Magic Studio's two audio tools each have two possible engines behind them:
 *
 *   text_to_audio   on-device  Kokoro-82M in a Web Worker   (src/(lib)/ai-engine)
 *                   ariziy     POST /v1/text-to-speech      (Deepgram Aura-2)
 *   audio_to_text   on-device  Whisper Base in a Web Worker (src/(lib)/ai-engine)
 *                   ariziy     POST /v1/speech-to-text
 *
 * ⚠️ REVERTING IS EDITING AUDIO_ENGINE BELOW, AND NOTHING ELSE. That is the
 * whole point of this file. The on-device paths are not deleted, not commented
 * out and not moved — they are still the same `tts.generate` / `stt.transcribe`
 * calls they always were, reached through the same argument shapes. Whichever
 * engine runs, the value that comes back matches the ON-DEVICE engine's
 * contract, so everything downstream — the asset the canvas renders, the SRT
 * export, recordTextToAudio's upload — cannot tell the difference and did not
 * have to change.
 *
 * ⚠️ THE BROWSER CANNOT CALL ARIZIY DIRECTLY. api.ariziy.com answers a preflight
 * from localhost:3000 with `400 Disallowed CORS origin` and no
 * Access-Control-Allow-Origin header, and its `vary: Origin` says there is an
 * allowlist we are not on. So both calls go through our own route handlers under
 * /api/ariziy/*, which is also what keeps ARIZIY_API_KEY server-side. Pointing
 * these at api.ariziy.com directly will fail in the browser even with a valid
 * key — the request never leaves.
 */

import { Mars, Venus } from "lucide-react";

import { KOKORO_TTS } from "@/(lib)/ai-engine/models";

// ─────────────────────────────────────────────────────────────────────────────
// THE SWITCH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Which engine each tool uses. `"ariziy"` | `"on-device"`.
 *
 * Per tool rather than one global flag, because the two endpoints are not in the
 * same state: /v1/text-to-speech is healthy, and as of the last probe
 * /v1/speech-to-text returns a Cloudflare 502 for every audio file it accepts
 * (it validates the upload, then dies upstream in ~1.5s). Flipping
 * `audio_to_text` back to "on-device" is the one-word workaround if that is
 * still broken when you read this.
 */
export const AUDIO_ENGINE = {
  text_to_audio: "ariziy",
  audio_to_text: "ariziy",
};

/** @returns {boolean} Is this tool on the hosted engine? */
export const usesAriziy = (toolId) => AUDIO_ENGINE[toolId] === "ariziy";

// ─────────────────────────────────────────────────────────────────────────────
// VOICES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Aura-2's own voices — what the picker shows when Ariziy is the engine.
 *
 * ⚠️ THE PICKER SWAPS WITH THE ENGINE, and this is why. The two models share no
 * vocabulary: Kokoro has a Bella, Aura-2 does not, and the first version of this
 * paired the cards by gender instead — so clicking "Bella" sent "luna". Gender
 * matching is not matching. A voice picker's whole job is that the thing you
 * clicked is the thing you hear, so when the engine changes, the cards change.
 *
 * ⚠️ ALL 40 ARE US ENGLISH — the model is `@cf/deepgram/aura-2-en`, so unlike
 * Kokoro there are no British voices to offer and the cards group by gender
 * alone. The picker's grouping follows array order, so feminine voices are
 * listed first as one run, then masculine.
 *
 * ⚠️ GENDER IS NOT SOMETHING THE API RETURNS. The names come from the endpoint
 * itself (the 422 it answers to an unknown voice lists every one); the genders
 * are transcribed from Deepgram's own Aura-2 listing. If a card's icon ever
 * disagrees with what you hear, it is this table that is wrong — the name is
 * always right, because it came from the API.
 */
const ARIZIY_VOICES = [
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
const ARIZIY_TOP_VOICES = new Set([
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
export const ARIZIY_VOICE_ITEMS = ARIZIY_VOICES.map(([id, g]) => {
  const gender = g === "f" ? "female" : "male";
  return {
    value: id,
    label: `${id[0].toUpperCase()}${id.slice(1)}`,
    desc: `US · ${gender}`,
    icon: g === "f" ? Venus : Mars,
    gender,
    group: `US ${gender} voices`,
    top: ARIZIY_TOP_VOICES.has(id),
  };
});

/**
 * Kokoro voice id → nearest Aura-2 voice, same gender.
 *
 * ⚠️ NO LONGER WHAT THE PICKER USES — it is a SAFETY NET. With the cards swapped
 * above, `values.voice` is already an Aura name and needs no translation. This
 * catches the one case that would otherwise send the wrong voice silently: a
 * composer still holding a Kokoro id from before the engine was switched, or a
 * `text_to_audio` default that didn't get swapped with it. Translating beats
 * falling through to asteria, which is what an unrecognised id does.
 */
const KOKORO_TO_ARIZIY_VOICE = {
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

/** Aura-2's flagship female voice — what an unrecognised id falls back to. */
const DEFAULT_ARIZIY_VOICE = "asteria";

/** Every Aura-2 name, for telling one apart from a stale Kokoro id. */
const ARIZIY_VOICE_IDS = new Set(ARIZIY_VOICES.map(([id]) => id));

/**
 * The voice name to send upstream.
 *
 * Passes an Aura name straight through — that is the normal path now that the
 * picker offers them. A Kokoro id only turns up if the composer is holding one
 * from before the switch, and gets translated rather than dropped.
 */
export function ariziyVoiceId(voiceId) {
  if (ARIZIY_VOICE_IDS.has(voiceId)) return voiceId;
  return KOKORO_TO_ARIZIY_VOICE[voiceId] || DEFAULT_ARIZIY_VOICE;
}

/** The voice cards this tool should show, for the engine that will run. */
export const voiceItemsFor = (toolId, kokoroItems) =>
  usesAriziy(toolId) ? ARIZIY_VOICE_ITEMS : kokoroItems;

/** The voice selected before anyone touches the picker. */
export const defaultVoiceFor = (toolId, kokoroDefault) =>
  usesAriziy(toolId) ? DEFAULT_ARIZIY_VOICE : kokoroDefault;

/**
 * What to call the voice that actually spoke, for the asset's caption.
 *
 * Reads the ENGINE's own name for it. With the cards swapped this now agrees
 * with the card that was clicked — which is the point of the swap — but it is
 * still derived from the id that was SENT rather than the label that was shown,
 * so a translated stale id captions itself honestly instead of naming a voice
 * the user cannot hear.
 */
export function voiceLabelFor(toolId, voiceId) {
  if (usesAriziy(toolId)) {
    const name = ariziyVoiceId(voiceId);
    return `${name[0].toUpperCase()}${name.slice(1)} · US English`;
  }
  return (
    KOKORO_TTS.voices.find((v) => v.id === voiceId)?.label || "Kokoro voice"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ARIZIY — TEXT TO SPEECH
// ─────────────────────────────────────────────────────────────────────────────

/**
 * How long an audio Blob plays, in seconds.
 *
 * Ariziy returns bare MP3 bytes with no metadata, where the on-device engine
 * hands back a duration it measured while rendering. The canvas shows that
 * number under the waveform, so it has to come from somewhere — decoding the
 * file is the only way to get it once the audio already exists.
 *
 * Resolves 0 rather than throwing: a missing duration is a cosmetic loss, and
 * failing the whole run over one would throw away audio the user can hear.
 */
async function measureDuration(blob) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return 0;
    const ctx = new Ctx();
    try {
      const buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
      return buffer.duration;
    } finally {
      ctx.close?.();
    }
  } catch (err) {
    console.warn("⚠️ [ariziy/tts] couldn't measure duration:", err?.message);
    return 0;
  }
}

/**
 * Synthesise speech through Ariziy.
 *
 * ⚠️ `format` AND `quality` ARE SENT BUT NOT YET HONOURED. Probing found Aura-2
 * silently ignores every field it does not know — format, quality, language,
 * pitch, sample_rate and bitrate all return 200 and change nothing — so today
 * the output is MP3 whatever the composer asked for. They are forwarded anyway,
 * deliberately: the backend is being asked to make them responsive, and sending
 * them now means that lands without a change here.
 *
 * ⚠️ SO THE RETURNED `format` IS WHAT CAME BACK, NOT WHAT WAS ASKED FOR. It has
 * to be: recordTextToAudio names the uploaded file from it, and trusting the
 * request would file MP3 bytes as `.wav` — a corrupt download that looks fine
 * until someone opens it.
 *
 * Matches {@link synthesizeSpeech}'s return shape so the caller is unchanged.
 *
 * @param {string} text
 * @param {{voice?: string, speed?: number, format?: string, quality?: string}} opts
 * @returns {Promise<{blob: Blob, url: string, duration: number, format: string}>}
 */
export async function ariziySynthesize(
  text,
  { voice, speed = 1, format, quality } = {},
) {
  const body = {
    text,
    voice: ariziyVoiceId(voice),
    speed,
    ...(format ? { format } : {}),
    ...(quality ? { quality } : {}),
  };
  console.log("📡 [ariziy/tts] request →", { ...body, text: `${text.slice(0, 60)}…` });

  const res = await fetch("/api/ariziy/text-to-speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(await readRouteError(res, "Speech generation failed."));

  const blob = await res.blob();
  if (!blob.size) throw new Error("Speech generation returned an empty file.");

  const duration = await measureDuration(blob);
  console.log(
    `✅ [ariziy/tts] ${(blob.size / 1024).toFixed(0)} kB · ${duration.toFixed(1)}s · ${body.voice}`,
  );

  // What the response actually IS, read off its own Content-Type rather than
  // assumed — so the day Ariziy starts honouring `format`, a WAV is recognised
  // as one here with no change. Falls back to mp3, which is all it sends today.
  const contentType = res.headers.get("content-type") || "";
  const returnedFormat = contentType.includes("wav")
    ? "wav"
    : contentType.includes("ogg")
      ? "ogg"
      : "mp3";
  if (format && format !== returnedFormat) {
    console.warn(
      `⚠️ [ariziy/tts] asked for ${format}, got ${returnedFormat} — the endpoint ignores \`format\``,
    );
  }

  return {
    blob,
    url: URL.createObjectURL(blob),
    duration,
    // What came back, not what was requested — see the warning above.
    format: returnedFormat,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ARIZIY — SPEECH TO TEXT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pull the transcript out of whatever shape the endpoint answers with.
 *
 * ⚠️ THIS IS WRITTEN BLIND. /v1/speech-to-text 502s on every audio file it
 * accepts, so its success shape has never been observed — only its failures
 * (422 for a missing `file`, 415 for a non-audio MIME). These are the four
 * shapes the common providers use; the first one that yields text wins, and an
 * unrecognised shape is logged in full so the fix is reading one console line
 * rather than probing the API again.
 */
function extractTranscript(data) {
  if (typeof data === "string") return data;
  const candidates = [
    data?.text,
    data?.transcript,
    data?.result?.text,
    data?.data?.text,
    data?.results?.channels?.[0]?.alternatives?.[0]?.transcript, // Deepgram
  ];
  const text = candidates.find((c) => typeof c === "string" && c.trim());
  if (!text) {
    console.warn(
      "⚠️ [ariziy/stt] no transcript found in response — shape was:",
      data,
    );
  }
  return text || "";
}

/**
 * Transcribe audio through Ariziy.
 *
 * ⚠️ THE OPTIONS DO NOT SURVIVE, and this is the real cost of the switch. The
 * composer offers a language (including auto-detect) and four transcript formats
 * — plain, punctuated, paragraphs, timestamped — all of which the on-device
 * Whisper path implements. The hosted endpoint took none of them in probing, so
 * on this engine the format picker does nothing and there are no timed segments,
 * which means the SRT/VTT downloads have nothing to build from.
 *
 * They are still SENT, so that whichever of them the endpoint quietly supports
 * starts working the day it is fixed without a code change here.
 *
 * Matches {@link transcribeAudio}'s return shape so the caller is unchanged.
 *
 * @param {File|Blob} file
 * @param {{language?: string, format?: string, quality?: string}} opts
 */
export async function ariziyTranscribe(file, { language, format, quality } = {}) {
  const form = new FormData();
  form.append("file", file, file.name || "audio.mp3");
  if (language && language !== "auto") form.append("language", language);
  if (format) form.append("format", format);
  if (quality) form.append("quality", quality);

  console.log(
    `📡 [ariziy/stt] request → ${file.name || "audio"} · ${(file.size / 1024).toFixed(0)} kB`,
  );

  const res = await fetch("/api/ariziy/speech-to-text", {
    method: "POST",
    body: form,
  });

  if (!res.ok) throw new Error(await readRouteError(res, "Transcription failed."));

  const data = await res.json();
  const text = extractTranscript(data);
  console.log(`✅ [ariziy/stt] ${text.length} chars`);

  return {
    text,
    words: text ? text.trim().split(/\s+/).length : 0,
    durationSec: Number(data?.duration) || 0,
    language: data?.language || language || "en",
    // Only true if the endpoint told us what it heard — never assumed, or the
    // caption would claim a detection that never happened.
    detected: Boolean(data?.language && language === "auto"),
    // No timed segments from this engine, so the SRT/VTT exports stay empty
    // rather than being handed invented timings.
    segments: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * The most useful sentence available for a failed route call.
 *
 * Our handlers forward Ariziy's own `detail` where there is one — a missing
 * field, an unknown voice, an unsupported audio type are all things the user or
 * the developer can act on, and flattening them to "request failed" throws that
 * away. Falls back to the status when the body is unreadable, which is exactly
 * the 502 case: Cloudflare answers `error code: 502` as plain text.
 */
async function readRouteError(res, fallback) {
  try {
    const data = await res.json();
    const detail = data?.error || data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
    if (Array.isArray(detail) && detail[0]?.msg) {
      const field = Array.isArray(detail[0].loc) ? detail[0].loc.at(-1) : null;
      return field ? `${field}: ${detail[0].msg}` : detail[0].msg;
    }
  } catch {
    // Body wasn't JSON — the status is all we have.
  }
  return `${fallback} (HTTP ${res.status})`;
}
