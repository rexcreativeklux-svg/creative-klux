// Text normalization (TN) front-end for the on-device TTS engine.
//
// Kokoro's phonemizer reads text mostly grapheme-by-grapheme, so raw input like
// "$1,200.50", "4:30 PM", "March 15th, 2026", "15.5 kg", "Dr. Smith", "B2B" or
// "Shh" comes out wrong (spelled letters, a decimal point read as a full-stop,
// digits skipped). This module rewrites those spans into the words a person
// would actually say, BEFORE the text is chunked and phonemized. It is
// deliberately conservative: only recognized patterns are rewritten, everything
// else (including newlines, which the worker's chunker relies on for paragraph
// pauses) is left untouched.
//
// Scope / known limits: this handles number-like and abbreviation-like spans.
// It does NOT disambiguate homographs ("present" the gift vs. "present" the
// verb, "close" the door vs. "close" to the deadline, "desert", "live", …) or
// tongue-twisters — those need part-of-speech-aware phonemization, not text
// normalization, so they're intentionally out of scope here.

// ── Number → words ───────────────────────────────────────────────────────────

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen",
];
const TENS = [
  "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety",
];
const SCALES = ["", "thousand", "million", "billion", "trillion"];

/** Convert 0–999 to words (no leading/trailing spaces). */
function threeDigitsToWords(n) {
  let out = "";
  if (n >= 100) {
    out += `${ONES[Math.floor(n / 100)]} hundred`;
    n %= 100;
    if (n) out += " ";
  }
  if (n >= 20) {
    out += TENS[Math.floor(n / 10)];
    if (n % 10) out += `-${ONES[n % 10]}`;
  } else if (n > 0) {
    out += ONES[n];
  }
  return out;
}

/** Convert a non-negative integer (as number or digit string) to words. */
function integerToWords(value) {
  let n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  n = Math.trunc(Math.abs(n));
  if (n === 0) return "zero";

  // Group into sets of three from the right, then join with scale words.
  const groups = [];
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }
  const parts = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue;
    const words = threeDigitsToWords(groups[i]);
    parts.push(SCALES[i] ? `${words} ${SCALES[i]}` : words);
  }
  return parts.join(" ");
}

// ── Ordinals (15th → fifteenth) ──────────────────────────────────────────────

// Irregular ordinal stems keyed by the cardinal word they replace.
const ORDINAL_IRREGULAR = {
  one: "first", two: "second", three: "third", five: "fifth", eight: "eighth",
  nine: "ninth", twelve: "twelfth",
};

/** Turn a cardinal word phrase into its ordinal ("twenty-six" → "twenty-sixth"). */
function cardinalWordsToOrdinal(words) {
  // Only the FINAL word becomes ordinal ("one hundred twenty-first").
  const spaceIdx = words.lastIndexOf(" ");
  const head = spaceIdx === -1 ? "" : words.slice(0, spaceIdx + 1);
  let tail = spaceIdx === -1 ? words : words.slice(spaceIdx + 1);

  const dashIdx = tail.lastIndexOf("-");
  const dashHead = dashIdx === -1 ? "" : tail.slice(0, dashIdx + 1);
  let last = dashIdx === -1 ? tail : tail.slice(dashIdx + 1);

  if (ORDINAL_IRREGULAR[last]) {
    last = ORDINAL_IRREGULAR[last];
  } else if (last.endsWith("y")) {
    last = `${last.slice(0, -1)}ieth`; // twenty → twentieth
  } else {
    last = `${last}th`;
  }
  return head + dashHead + last;
}

/** Convert an integer to its ordinal words (15 → "fifteenth"). */
function integerToOrdinalWords(value) {
  return cardinalWordsToOrdinal(integerToWords(value));
}

// ── Years (2026 → "twenty twenty-six") ───────────────────────────────────────

/** Read a 4-digit year the way people say it. */
function yearToWords(year) {
  const n = Number(year);
  if (n < 1000 || n > 9999) return integerToWords(n);
  const hi = Math.floor(n / 100);
  const lo = n % 100;
  // 2000–2009 → "two thousand (nine)"; keeps "two thousand six" natural.
  if (n >= 2000 && n <= 2009) {
    return lo === 0 ? "two thousand" : `two thousand ${integerToWords(lo)}`;
  }
  if (lo === 0) return `${integerToWords(hi)} hundred`; // 1900 → "nineteen hundred"
  if (lo < 10) return `${integerToWords(hi)} oh ${integerToWords(lo)}`; // 2026-style handled above; 1905 → "nineteen oh five"
  return `${integerToWords(hi)} ${integerToWords(lo)}`; // 2026 → "twenty twenty-six"
}

// ── Currency ─────────────────────────────────────────────────────────────────

const CURRENCY = {
  $: { major: ["dollar", "dollars"], minor: ["cent", "cents"] },
  "£": { major: ["pound", "pounds"], minor: ["penny", "pence"] },
  "€": { major: ["euro", "euros"], minor: ["cent", "cents"] },
};

/** "$1,200.50" → "one thousand two hundred dollars and fifty cents". */
function speakCurrency(symbol, intPart, centsPart) {
  const unit = CURRENCY[symbol];
  const dollars = Number(intPart.replace(/,/g, ""));
  const cents = centsPart != null ? Number(centsPart.padEnd(2, "0").slice(0, 2)) : 0;
  const pieces = [];
  if (dollars > 0 || cents === 0) {
    pieces.push(`${integerToWords(dollars)} ${unit.major[dollars === 1 ? 0 : 1]}`);
  }
  if (cents > 0) {
    if (pieces.length) pieces.push("and");
    pieces.push(`${integerToWords(cents)} ${unit.minor[cents === 1 ? 0 : 1]}`);
  }
  return pieces.join(" ");
}

// ── Units ────────────────────────────────────────────────────────────────────

// Only unambiguous abbreviations — single letters like "m"/"l"/"in" are skipped
// on purpose (too easily part of a word). Value is [singular, plural].
const UNITS = {
  kg: ["kilogram", "kilograms"], mg: ["milligram", "milligrams"],
  km: ["kilometer", "kilometers"], cm: ["centimeter", "centimeters"], mm: ["millimeter", "millimeters"],
  lb: ["pound", "pounds"], lbs: ["pound", "pounds"], oz: ["ounce", "ounces"],
  ml: ["milliliter", "milliliters"], kb: ["kilobyte", "kilobytes"], mb: ["megabyte", "megabytes"],
  gb: ["gigabyte", "gigabytes"], tb: ["terabyte", "terabytes"], mph: ["mile per hour", "miles per hour"],
  kmh: ["kilometer per hour", "kilometers per hour"],
};

// ── Interjections ────────────────────────────────────────────────────────────

// Onomatopoeic words the phonemizer spells out letter-by-letter. Mapped to the
// closest real-word / repeated-vowel spelling that phonemizes to the intended
// sound. Best-effort — a few are approximations.
const INTERJECTIONS = {
  shh: "shush", shhh: "shush", sh: "shush",
  psst: "psst", pst: "psst",
  hmm: "hmm", hmmm: "hmm", mmm: "mmm",
  ugh: "ugh",
  ahh: "ahh", ahhh: "ahh",
  ooh: "ooh", oooh: "ooh",
  brr: "brr", grr: "grr",
  tsk: "tsk", pff: "pff", pfft: "pfft",
};

// ── Decimals read digit-by-digit after the point ────────────────────────────

/** "15.5" → "fifteen point five"; "3.14" → "three point one four". */
function speakDecimal(intPart, fracPart) {
  const intWords = integerToWords(intPart.replace(/,/g, ""));
  const fracWords = fracPart.split("").map((d) => ONES[Number(d)]).join(" ");
  return `${intWords} point ${fracWords}`;
}

// ── Main normalizer ──────────────────────────────────────────────────────────

/**
 * Rewrite number-like and abbreviation-like spans into speakable words.
 * @param {string} input
 * @returns {string}
 */
export function normalizeSpeechText(input) {
  let text = String(input || "");
  if (!text.trim()) return text;

  // 1) Titles/abbreviations that end in a period — expand so the period isn't
  //    read as a full-stop and the word is spoken in full. Case-sensitive on the
  //    leading capital; the trailing "." is consumed.
  const TITLES = {
    "Dr.": "Doctor", "Mr.": "Mister", "Mrs.": "Missus", "Ms.": "Miss",
    "Prof.": "Professor", "Sr.": "Senior", "Jr.": "Junior",
    "Capt.": "Captain", "Gen.": "General", "Sgt.": "Sergeant", "Lt.": "Lieutenant",
    "Col.": "Colonel", "Rev.": "Reverend", "Hon.": "Honorable", "Gov.": "Governor",
    "vs.": "versus", "etc.": "etcetera", "approx.": "approximately",
  };
  for (const [abbr, full] of Object.entries(TITLES)) {
    // Escape "." for the regex; require a following space/quote/end so "Mr.Smith"
    // and mid-word matches are still safe.
    const re = new RegExp(`\\b${abbr.replace(/\./g, "\\.")}(?=\\s|$|["'])`, "g");
    text = text.replace(re, full);
  }

  // 2) Acronyms with an embedded "2" meaning "to" (B2B, P2P, C2C).
  text = text.replace(/\b([A-Za-z])2([A-Za-z])\b/g, "$1 to $2");

  // 3) Currency: symbol + integer (optional thousands commas) + optional cents.
  text = text.replace(
    /([$£€])\s?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?/g,
    (_m, sym, intPart, cents) => speakCurrency(sym, intPart, cents),
  );

  // 4) Percentages: "50%" / "3.5%".
  text = text.replace(/(\d+(?:\.\d+)?)\s?%/g, (_m, num) => {
    const spoken = num.includes(".")
      ? speakDecimal(...num.split("."))
      : integerToWords(num);
    return `${spoken} percent`;
  });

  // 5) Number + unit ("15.5 kg", "128 GB"). Unit is matched case-insensitively.
  const unitPattern = Object.keys(UNITS).sort((a, b) => b.length - a.length).join("|");
  text = text.replace(
    new RegExp(`(\\d+(?:\\.\\d+)?)\\s?(${unitPattern})\\b`, "gi"),
    (_m, num, unitRaw) => {
      const unit = UNITS[unitRaw.toLowerCase()];
      const isOne = Number(num) === 1;
      const spoken = num.includes(".")
        ? speakDecimal(...num.split("."))
        : integerToWords(num);
      return `${spoken} ${unit[isOne ? 0 : 1]}`;
    },
  );

  // 6) Times: "4:30 PM", "12:00", "09:05".
  text = text.replace(/\b(\d{1,2}):(\d{2})\b/g, (_m, h, m) => {
    const hour = Number(h);
    const min = Number(m);
    const hourWords = integerToWords(hour === 0 ? 12 : hour);
    if (min === 0) return `${hourWords} o'clock`;
    if (min < 10) return `${hourWords} oh ${integerToWords(min)}`;
    return `${hourWords} ${integerToWords(min)}`;
  });

  // 7) Ordinals: "15th", "1st", "22nd", "3rd".
  text = text.replace(
    /\b(\d+)(st|nd|rd|th)\b/gi,
    (_m, num) => integerToOrdinalWords(num),
  );

  // 8) 4-digit years (1100–2099) read as year-pairs. Ranges outside this stay
  //    cardinal via the generic pass below.
  text = text.replace(/\b(1[1-9]\d{2}|20\d{2})\b/g, (_m, y) => yearToWords(y));

  // 9) Decimals: "15.5" → "fifteen point five".
  text = text.replace(/\b(\d{1,3}(?:,\d{3})+|\d+)\.(\d+)\b/g, (_m, intPart, frac) =>
    speakDecimal(intPart, frac),
  );

  // 10) Integers with thousands separators, then bare integers.
  text = text.replace(/\b\d{1,3}(?:,\d{3})+\b/g, (m) => integerToWords(m.replace(/,/g, "")));
  text = text.replace(/\b\d+\b/g, (m) => integerToWords(m));

  // 11) Interjections (case-insensitive, ascii keys only).
  text = text.replace(/\b([A-Za-z]{1,5})\b/g, (word) => {
    const mapped = INTERJECTIONS[word.toLowerCase()];
    return mapped || word;
  });

  return text;
}

export default normalizeSpeechText;
