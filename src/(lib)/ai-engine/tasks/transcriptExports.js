// Subtitle/text export builders for the on-device speech-to-text engine.
//
// The STT worker returns timed segments (`{ text, start, end }`, straight from
// Whisper's chunk timestamps). Those segments are accurate but often TOO LONG
// to be subtitle cues — Whisper happily emits a 20-second sentence as one
// chunk — so before writing SRT/VTT we reshape them into readable,
// broadcast-style cues:
//
//   • ≤ ~84 chars per cue, wrapped onto at most 2 lines of ~42 chars
//   • long segments split at sentence → clause → word boundaries, with the
//     segment's time span divided proportionally by character count
//   • missing end times resolved (the FINAL chunk's `end` is frequently null —
//     a known Whisper long-form quirk): next cue's start → clip duration →
//     a speech-rate estimate
//
// Everything here is pure string/number work (no DOM, no worker) — the modal
// calls it at download time and hands the result to a Blob.

import { splitIntoSentences } from "./formatTranscript";

/** @typedef {{text: string, start: number|null, end: number|null}} TranscriptSegment */
/** @typedef {{text: string, start: number, end: number}} SubtitleCue */

// Readable-subtitle targets: at most 2 lines of ~42 characters per cue.
const CUE_MAX_CHARS = 84;
const CUE_LINE_CHARS = 42;
// Never emit a zero/negative-length cue — players drop or flash them.
const MIN_CUE_SEC = 0.4;
// ~17 chars/second of speech — used to estimate a missing end time.
const FALLBACK_CHAR_SEC = 0.06;

/** Left-pad a non-negative integer to 2 digits. */
function pad2(n) {
  return String(n).padStart(2, "0");
}

/**
 * Seconds → "HH:MM:SS<sep>mmm" (SRT separates millis with ",", VTT with ".").
 * Negative/invalid input clamps to 0.
 */
function formatTimecode(sec, msSep) {
  const total = Math.max(0, Number(sec) || 0);
  const ms = Math.round((total % 1) * 1000);
  const s = Math.floor(total);
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor(s / 60) % 60)}:${pad2(s % 60)}${msSep}${String(ms).padStart(3, "0")}`;
}

/** Greedy-pack words into pieces of at most `maxChars` (never splits a word). */
function packWords(text, maxChars) {
  const words = text.split(/\s+/).filter(Boolean);
  const pieces = [];
  let current = "";
  for (const word of words) {
    if (current && current.length + 1 + word.length > maxChars) {
      pieces.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

/**
 * Split one segment's text into cue-sized pieces (≤ CUE_MAX_CHARS): whole
 * sentences first, then clause boundaries (, ; : — …), then plain word packing.
 * A single unbreakable word longer than the limit is kept intact.
 * @param {string} text
 * @returns {string[]}
 */
function splitCueText(text) {
  const pieces = [];
  for (const sentence of splitIntoSentences(text)) {
    if (sentence.length <= CUE_MAX_CHARS) {
      pieces.push(sentence);
      continue;
    }
    // Break an oversized sentence at its clause punctuation (keeping it), then
    // greedy-pack the clauses back together up to the limit.
    const clauses = sentence.match(/[^,;:—–]+[,;:—–]*\s*/g) || [sentence];
    let current = "";
    for (const rawClause of clauses) {
      const clause = rawClause.trim();
      if (!clause) continue;
      if (current && current.length + 1 + clause.length > CUE_MAX_CHARS) {
        pieces.push(...(current.length > CUE_MAX_CHARS ? packWords(current, CUE_MAX_CHARS) : [current]));
        current = clause;
      } else {
        current = current ? `${current} ${clause}` : clause;
      }
    }
    if (current) pieces.push(...(current.length > CUE_MAX_CHARS ? packWords(current, CUE_MAX_CHARS) : [current]));
  }
  return pieces.filter(Boolean);
}

/**
 * Balance one cue's text onto at most 2 lines: split at the space closest to
 * the midpoint once the text outgrows a single line.
 * @param {string} text Cue text (≤ CUE_MAX_CHARS).
 * @returns {string} "line" or "line1\nline2".
 */
function wrapCueLines(text) {
  if (text.length <= CUE_LINE_CHARS) return text;
  const mid = Math.floor(text.length / 2);
  let splitAt = -1;
  for (let offset = 0; offset <= mid; offset++) {
    if (text[mid - offset] === " ") {
      splitAt = mid - offset;
      break;
    }
    if (text[mid + offset] === " ") {
      splitAt = mid + offset;
      break;
    }
  }
  if (splitAt <= 0) return text; // one unbreakable run — leave it whole
  return `${text.slice(0, splitAt).trimEnd()}\n${text.slice(splitAt + 1).trimStart()}`;
}

/**
 * Turn raw Whisper segments into clean, timed subtitle cues: drop empties,
 * resolve missing times, enforce a minimum duration without overlapping the
 * next cue, and split oversized segments with the time span divided
 * proportionally by character count.
 * @param {TranscriptSegment[]} segments
 * @param {number} [durationSec] Total clip length — resolves a missing final end.
 * @returns {SubtitleCue[]}
 */
function toCues(segments, durationSec) {
  const clean = (Array.isArray(segments) ? segments : [])
    .map((s) => ({
      text: String(s?.text || "").replace(/\s+/g, " ").trim(),
      start: typeof s?.start === "number" && Number.isFinite(s.start) ? Math.max(0, s.start) : null,
      end: typeof s?.end === "number" && Number.isFinite(s.end) ? Math.max(0, s.end) : null,
    }))
    .filter((s) => s.text);
  if (!clean.length) return [];

  // Resolve times first so the split step always has a real [start, end].
  const timed = clean.map((seg, i) => {
    const prev = i > 0 ? clean[i - 1] : null;
    const next = i < clean.length - 1 ? clean[i + 1] : null;
    const start = seg.start ?? prev?.end ?? 0;
    let end = seg.end;
    if (end == null || end <= start) {
      if (next?.start != null && next.start > start) end = next.start;
      else if (typeof durationSec === "number" && durationSec > start) end = durationSec;
      else end = start + seg.text.length * FALLBACK_CHAR_SEC;
    }
    return { text: seg.text, start, end };
  });

  const cues = [];
  for (let i = 0; i < timed.length; i++) {
    const seg = timed[i];
    const nextStart = i < timed.length - 1 ? timed[i + 1].start : null;
    // Minimum readable length, but never run into the next cue.
    let end = Math.max(seg.end, seg.start + MIN_CUE_SEC);
    if (nextStart != null && nextStart > seg.start && end > nextStart) end = nextStart;

    const pieces = seg.text.length > CUE_MAX_CHARS ? splitCueText(seg.text) : [seg.text];
    const totalChars = pieces.reduce((sum, p) => sum + p.length, 0) || 1;
    const span = end - seg.start;
    let cursor = seg.start;
    let used = 0;
    for (const piece of pieces) {
      used += piece.length;
      const pieceEnd = seg.start + span * (used / totalChars);
      cues.push({ text: piece, start: cursor, end: Math.max(pieceEnd, cursor + 0.01) });
      cursor = pieceEnd;
    }
  }
  return cues;
}

/**
 * Build an SRT (SubRip) document from the worker's timed segments.
 * @param {TranscriptSegment[]} segments
 * @param {{durationSec?: number}} [opts]
 * @returns {string} SRT text, or "" when there are no timed cues.
 */
export function buildSrt(segments, { durationSec } = {}) {
  const cues = toCues(segments, durationSec);
  if (!cues.length) return "";
  return (
    cues
      .map(
        (c, i) =>
          `${i + 1}\n${formatTimecode(c.start, ",")} --> ${formatTimecode(c.end, ",")}\n${wrapCueLines(c.text)}`,
      )
      .join("\n\n") + "\n"
  );
}

/**
 * Build a WebVTT document from the worker's timed segments.
 * @param {TranscriptSegment[]} segments
 * @param {{durationSec?: number}} [opts]
 * @returns {string} VTT text, or "" when there are no timed cues.
 */
export function buildVtt(segments, { durationSec } = {}) {
  const cues = toCues(segments, durationSec);
  if (!cues.length) return "";
  return (
    "WEBVTT\n\n" +
    cues
      .map(
        (c) =>
          `${formatTimecode(c.start, ".")} --> ${formatTimecode(c.end, ".")}\n${wrapCueLines(c.text)}`,
      )
      .join("\n\n") +
    "\n"
  );
}

/**
 * Derive a download filename from the uploaded audio's name:
 * "My Podcast Ep 4.mp3" → "My Podcast Ep 4.srt". Strips the source extension,
 * removes filesystem-hostile characters, caps the length, and falls back to
 * "transcript" when nothing usable remains.
 * @param {string} sourceName Original file name (may be empty).
 * @param {string} ext Target extension without the dot ("txt" | "srt" | "vtt").
 * @returns {string}
 */
export function transcriptFileName(sourceName, ext) {
  const base = String(sourceName || "")
    .replace(/\.[^.]+$/, "") // drop the audio extension
    .replace(/[\\/:*?"<>|]/g, " ") // filesystem-hostile characters
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 80)
    .trim();
  return `${base || "transcript"}.${ext}`;
}
