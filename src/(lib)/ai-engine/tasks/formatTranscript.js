// Transcript formatting for the on-device speech-to-text engine (Whisper Base).
//
// Whisper emits text that is ALREADY punctuated and cased, so — unlike TTS's
// normalizeSpeechText, which rewrites raw text INTO speakable words — this module
// does the opposite job: it shapes Whisper's raw output into the transcript
// format the user picked, clean and ready to paste:
//
//   plain       — lowercase, punctuation stripped: the spoken words only
//   punctuated  — Whisper's natural punctuation + casing, whitespace-tidied
//   paragraphs  — punctuated, then split into paragraphs on the audio's pauses
//                 (from segment timestamps) or, failing that, grouped by sentence
//   timestamped — one "[mm:ss] text" line per spoken segment
//
// `chunks` (segment-level `{ text, timestamp: [start, end] }`) are only present
// when the worker ran Whisper with return_timestamps — the paragraphs and
// timestamped formats request them; plain/punctuated don't need them.

/** Collapse whitespace/newlines and drop spaces sitting before punctuation. */
function tidy(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();
}

/** Uppercase just the first visible character (Whisper usually already does). */
function capitalizeFirst(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

/** Seconds → "mm:ss" (minutes run past 59 for long audio, e.g. "72:04"). */
function clock(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Split a block into sentences, keeping the terminating punctuation.
 *  (Also reused by transcriptExports to break long segments into subtitle cues.) */
export function splitIntoSentences(text) {
  const matches = text.match(/[^.!?…]+[.!?…]+["')\]]*\s*|[^.!?…]+$/g);
  return (matches || [text]).map((s) => s.trim()).filter(Boolean);
}

/** Lowercase, strip punctuation (keep apostrophes/hyphens inside words). */
function toPlain(text) {
  return tidy(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'’-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Group sentences into ~`perPara`-sentence paragraphs (no timestamps case). */
function groupSentencesIntoParagraphs(text, perPara = 4) {
  const sentences = splitIntoSentences(text);
  const paras = [];
  for (let i = 0; i < sentences.length; i += perPara) {
    paras.push(sentences.slice(i, i + perPara).join(" "));
  }
  return paras.join("\n\n");
}

/**
 * Build paragraphs from timestamped segments: start a new paragraph whenever the
 * silence between two segments exceeds `gapSec`, or the current one gets long.
 */
function paragraphsFromChunks(chunks, gapSec = 0.75, maxChars = 500) {
  const paras = [];
  let current = "";
  let prevEnd = null;
  for (const c of chunks) {
    const piece = tidy(c?.text);
    if (!piece) continue;
    const start = c?.timestamp?.[0];
    const gap = prevEnd != null && start != null ? start - prevEnd : 0;
    const overflow = current.length + piece.length > maxChars;
    if (current && (gap > gapSec || overflow)) {
      paras.push(current);
      current = piece;
    } else {
      current = current ? `${current} ${piece}` : piece;
    }
    if (c?.timestamp?.[1] != null) prevEnd = c.timestamp[1];
  }
  if (current) paras.push(current);
  return paras.map(capitalizeFirst).join("\n\n");
}

/** One "[mm:ss] text" line per spoken segment. */
function timestampedFromChunks(chunks) {
  return chunks
    .map((c) => {
      const piece = tidy(c?.text);
      if (!piece) return null;
      return `[${clock(c?.timestamp?.[0])}] ${capitalizeFirst(piece)}`;
    })
    .filter(Boolean)
    .join("\n");
}

/** Count spoken words in a transcript (used for the result's meta line). */
export function countWords(text) {
  const t = String(text || "").trim();
  return t ? t.split(/\s+/).length : 0;
}

/**
 * Shape Whisper's raw transcription into the chosen format.
 * @param {string} rawText Whisper's full text output.
 * @param {{ format?: "plain"|"punctuated"|"paragraphs"|"timestamped",
 *           chunks?: {text: string, timestamp: [number, number]}[]|null }} [opts]
 * @returns {string} Clean, ready-to-paste transcript.
 */
export function formatTranscript(rawText, { format = "punctuated", chunks = null } = {}) {
  const text = tidy(rawText);
  if (!text) return "";
  switch (format) {
    case "plain":
      return toPlain(text);
    case "paragraphs":
      return chunks?.length ? paragraphsFromChunks(chunks) : groupSentencesIntoParagraphs(text);
    case "timestamped":
      return chunks?.length ? timestampedFromChunks(chunks) : text;
    case "punctuated":
    default:
      return capitalizeFirst(text);
  }
}

export default formatTranscript;
