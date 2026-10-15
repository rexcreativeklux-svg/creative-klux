// Pre-generate a short spoken sample for every HOSTED Text-to-Audio voice
// (Google Wavenet, served by Ariziy), upload each one to the gallery, and write
// the voice → CDN URL manifest the app reads (run: `npm run wavenet-samples`).
//
// Replaces generate-aura-samples.mjs. The hosted voices are no longer
// Deepgram's 40 Aura-2 names — Ariziy's `GET /v1/voices` now answers with ~161
// Google Wavenet voices across ~47 locales (`en-US-Wavenet-C`, `ja-JP-Wavenet-A`,
// …), so the list is FETCHED here rather than re-typed by hand.
//
//   1. GET  https://api.ariziy.com/v1/voices          the live catalogue
//   2. POST https://api.ariziy.com/v1/text-to-speech  one sample per voice
//   3. POST {KLUX_API_BASE}/gallery                   hosted on our CDN
//   4. write src/(lib)/wavenet-voice-samples.json     voice → sample URL
//
// ⚠️ EVERY SAMPLE IS A REAL SYNTHESIS CALL on the Ariziy key, and every upload
// adds an item to the Audio tab of the gallery behind KLUX_PROBE_TOKEN. So it
// will not run without `--yes`, and it is RESUMABLE: the manifest is rewritten
// after every voice, and a voice already in it (same language line) is skipped.
// A crash or a Ctrl+C costs nothing that a re-run has to repeat.
//
// ⚠️ THE GALLERY ITEMS ARE LOAD-BEARING. Deleting one from the gallery breaks
// that voice's ▶ for every user. They are uploaded as `<voice>.mp3`
// (e.g. `en-US-Wavenet-C.mp3`) so they are easy to recognise there.
//
// ⚠️ EACH VOICE SPEAKS ITS OWN LANGUAGE. A ja-JP voice reading English is not a
// fair preview of it, so the line is translated per language (SAMPLE_LINES). A
// voice whose language has no line is SKIPPED with a warning rather than handed
// English — add the language to SAMPLE_LINES and re-run.
//
// Usage (reads .env through Node's built-in --env-file, no dotenv needed):
//   npm run wavenet-samples -- --dry-run            list what WOULD happen, spend nothing
//   npm run wavenet-samples -- --yes                generate whatever is missing
//   ... --only=en-US-Wavenet-C,en-US-Wavenet-D      just these voices
//   ... --language=en-US                            just one locale (or a prefix: en)
//   ... --force                                     regenerate ones already in the manifest
//
// Env:
//   KLUX_API_KEY      Ariziy key, sent as `X-API-Key` (the key alone — Ariziy
//                     answers 401 to anything else).
//   KLUX_PROBE_TOKEN  Bearer token for the gallery account that hosts the files.
//   KLUX_API_BASE     optional, defaults to the production userend API.
//
// Node 20.6+ (built-in fetch, FormData, File and --env-file). No dependencies.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_PATH = path.join(root, "src", "(lib)", "wavenet-voice-samples.json");

const ARIZIY_BASE = "https://api.ariziy.com";
const KLUX_API_BASE = (
  process.env.KLUX_API_BASE ||
  "https://api.creativeklux.com/api/creativeklux-userend"
).replace(/\/+$/, "");
const CDN_BASE = (
  process.env.NEXT_PUBLIC_CDN_URL || "https://d3r8chxzp8ea06.cloudfront.net"
).replace(/\/+$/, "");

const ARIZIY_KEY = (process.env.KLUX_API_KEY || "").trim();
const GALLERY_TOKEN = (process.env.KLUX_PROBE_TOKEN || "").trim();

const TIMEOUT_MS = { voices: 30_000, speech: 120_000, upload: 120_000 };

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const valueOf = (name) => {
  const hit = args.find((a) => a.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : "";
};
const FORCE = has("--force");
const DRY_RUN = has("--dry-run");
const CONFIRMED = has("--yes");
const ONLY = valueOf("--only")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const LANGUAGE = valueOf("--language").trim();

// ─────────────────────────────────────────────────────────────────────────────
// THE LINE EACH VOICE SPEAKS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One line, translated — "Hi! This is how I sound. Let's make something great
 * together." — the same words the Kokoro clips say, minus the name: Wavenet
 * voices are lettered (`…-Wavenet-C`), not named, and "Hi, I'm C" helps nobody.
 *
 * Keyed by BCP-47 base language, so en-US / en-GB / en-IN / en-AU share one
 * line. A full tag wins over its base — that is how Taiwanese Mandarin gets
 * Traditional characters while cmn-CN keeps Simplified.
 *
 * ⚠️ CHANGING A LINE REGENERATES THAT LANGUAGE on the next run — each manifest
 * entry remembers the words it spoke, and a mismatch counts as missing.
 */
const SAMPLE_LINES = {
  am: "ሰላም! ድምፄ እንዲህ ይሰማል። አብረን አንድ ድንቅ ነገር እንፍጠር።",
  ar: "مرحبًا! هكذا يبدو صوتي. لنصنع معًا شيئًا رائعًا.",
  bn: "নমস্কার! আমার কণ্ঠস্বর এমন শোনায়। চলুন, একসাথে দারুণ কিছু তৈরি করি।",
  cmn: "你好！这就是我的声音。让我们一起创造精彩的作品吧。",
  "cmn-TW": "你好！這就是我的聲音。讓我們一起創造精彩的作品吧。",
  cs: "Ahoj! Takhle zní můj hlas. Pojďme spolu vytvořit něco skvělého.",
  da: "Hej! Sådan lyder min stemme. Lad os skabe noget fantastisk sammen.",
  de: "Hallo! So klingt meine Stimme. Lass uns gemeinsam etwas Großartiges erschaffen.",
  el: "Γεια σου! Έτσι ακούγεται η φωνή μου. Ας δημιουργήσουμε μαζί κάτι υπέροχο.",
  en: "Hi! This is how I sound. Let's make something great together.",
  es: "¡Hola! Así suena mi voz. Creemos algo increíble juntos.",
  fi: "Hei! Tältä ääneni kuulostaa. Luodaan yhdessä jotain upeaa.",
  fil: "Kumusta! Ganito ang tunog ng boses ko. Gumawa tayo ng isang bagay na kahanga-hanga nang magkasama.",
  fr: "Bonjour ! Voici à quoi ressemble ma voix. Créons ensemble quelque chose de formidable.",
  gu: "નમસ્તે! મારો અવાજ આવો સંભળાય છે. ચાલો, સાથે મળીને કંઈક શાનદાર બનાવીએ.",
  he: "שלום! ככה נשמע הקול שלי. בואו ניצור יחד משהו נהדר.",
  hi: "नमस्ते! मेरी आवाज़ ऐसी सुनाई देती है। आइए, साथ मिलकर कुछ शानदार बनाएँ।",
  hu: "Szia! Így szól a hangom. Alkossunk együtt valami nagyszerűt!",
  id: "Halo! Beginilah suara saya. Mari kita ciptakan sesuatu yang luar biasa bersama.",
  it: "Ciao! Ecco come suona la mia voce. Creiamo insieme qualcosa di straordinario.",
  ja: "こんにちは！これが私の声です。一緒に素晴らしいものを作りましょう。",
  kn: "ನಮಸ್ಕಾರ! ನನ್ನ ಧ್ವನಿ ಹೀಗೆ ಕೇಳಿಸುತ್ತದೆ. ಬನ್ನಿ, ಒಟ್ಟಾಗಿ ಅದ್ಭುತವಾದುದನ್ನು ಸೃಷ್ಟಿಸೋಣ.",
  ko: "안녕하세요! 제 목소리는 이렇게 들려요. 함께 멋진 것을 만들어 봐요.",
  ml: "നമസ്കാരം! എന്റെ ശബ്ദം ഇങ്ങനെയാണ്. വരൂ, നമുക്ക് ഒരുമിച്ച് മികച്ച ഒന്ന് സൃഷ്ടിക്കാം.",
  mr: "नमस्कार! माझा आवाज असा ऐकू येतो. चला, एकत्र मिळून काहीतरी छान घडवूया.",
  ms: "Helo! Beginilah bunyi suara saya. Mari kita hasilkan sesuatu yang hebat bersama-sama.",
  nb: "Hei! Slik høres stemmen min ut. La oss skape noe fantastisk sammen.",
  nl: "Hallo! Zo klinkt mijn stem. Laten we samen iets geweldigs maken.",
  pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੇਰੀ ਆਵਾਜ਼ ਇਸ ਤਰ੍ਹਾਂ ਸੁਣਾਈ ਦਿੰਦੀ ਹੈ। ਆਓ, ਮਿਲ ਕੇ ਕੁਝ ਸ਼ਾਨਦਾਰ ਬਣਾਈਏ।",
  pl: "Cześć! Tak brzmi mój głos. Stwórzmy razem coś wspaniałego.",
  pt: "Olá! É assim que a minha voz soa. Vamos criar algo incrível juntos.",
  ro: "Bună! Așa sună vocea mea. Hai să creăm împreună ceva grozav.",
  ru: "Привет! Вот так звучит мой голос. Давайте вместе создадим что-нибудь потрясающее.",
  sk: "Ahoj! Takto znie môj hlas. Poďme spolu vytvoriť niečo skvelé.",
  sv: "Hej! Så här låter min röst. Låt oss skapa något fantastiskt tillsammans.",
  ta: "வணக்கம்! என் குரல் இப்படித்தான் ஒலிக்கும். வாருங்கள், சேர்ந்து அருமையான ஒன்றை உருவாக்குவோம்.",
  tr: "Merhaba! Sesim böyle duyuluyor. Hadi birlikte harika bir şey yaratalım.",
  uk: "Привіт! Ось так звучить мій голос. Створімо разом щось чудове.",
  ur: "السلام علیکم! میری آواز ایسی سنائی دیتی ہے۔ آئیے، مل کر کچھ شاندار بنائیں۔",
  vi: "Xin chào! Đây là giọng nói của tôi. Hãy cùng nhau tạo nên điều tuyệt vời nhé.",
};

/** The line for a locale tag, or null when no translation exists for it. */
const lineFor = (language) =>
  SAMPLE_LINES[language] || SAMPLE_LINES[String(language).split("-")[0]] || null;

// ─────────────────────────────────────────────────────────────────────────────
// HTTP
// ─────────────────────────────────────────────────────────────────────────────

/** An HTTP failure that knows its status, so auth errors can stop the run. */
class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/** A short, readable reason out of an error body, whatever shape it has. */
async function errorDetail(res) {
  const text = await res.text().catch(() => "");
  try {
    const data = JSON.parse(text);
    const detail = data?.detail ?? data?.message ?? data?.error;
    if (detail) return typeof detail === "string" ? detail : JSON.stringify(detail);
  } catch {
    // Not JSON — fall through to the raw text.
  }
  return text.slice(0, 200) || res.statusText;
}

async function ariziyFetch(urlPath, { method = "GET", body, timeoutMs } = {}) {
  const res = await fetch(`${ARIZIY_BASE}${urlPath}`, {
    method,
    headers: {
      "X-API-Key": ARIZIY_KEY,
      Accept: "application/json, audio/*",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (res.status === 401 || res.status === 403) {
    throw new HttpError(
      `Ariziy rejected KLUX_API_KEY (HTTP ${res.status} — ${await errorDetail(res)}). ` +
        "It must be the key alone, exactly as Ariziy issued it.",
      res.status,
    );
  }
  if (!res.ok) {
    throw new HttpError(`HTTP ${res.status} — ${await errorDetail(res)}`, res.status);
  }
  return res;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEPS
// ─────────────────────────────────────────────────────────────────────────────

/** The live catalogue: `{ model, provider, default, count, voices[] }`. */
async function fetchCatalogue() {
  console.log("📡 Fetching the voice catalogue — GET /v1/voices");
  const res = await ariziyFetch("/v1/voices", { timeoutMs: TIMEOUT_MS.voices });
  const data = await res.json();
  const voices = Array.isArray(data?.voices)
    ? data.voices.filter((v) => typeof v?.voice === "string" && v.voice.trim())
    : [];
  if (voices.length === 0) {
    throw new Error(
      `the catalogue came back with no usable voices (keys: ${Object.keys(data || {}).join(", ")})`,
    );
  }
  if (Number.isFinite(data?.count) && data.count !== voices.length) {
    console.warn(
      `⚠️  Catalogue says count=${data.count} but lists ${voices.length} usable voices.`,
    );
  }
  console.log(
    `✅ ${voices.length} voices · ${new Set(voices.map((v) => v.language)).size} languages · ${data?.provider || "?"} / ${data?.model || "?"}`,
  );
  return { ...data, voices };
}

/** Pick an audio file extension from a Content-Type. */
function extensionFor(contentType) {
  if (/mpeg|mp3/i.test(contentType)) return "mp3";
  if (/wav/i.test(contentType)) return "wav";
  if (/ogg|opus/i.test(contentType)) return "ogg";
  if (/aac|mp4|m4a/i.test(contentType)) return "m4a";
  return "mp3";
}

/**
 * Read the speech response into bytes, whatever shape it arrives in.
 *
 * ⚠️ THE SHAPE HAS NEVER BEEN CONFIRMED (Design-Editor's Ariziy client hit 502s
 * on every success path when it was built), so every plausible one is accepted
 * — raw audio, `{ audio_url | url }`, or `{ audio_base64 | audio }` — and the
 * branch that fired is logged so it can be narrowed once it is known.
 */
async function readAudio(res) {
  const contentType = res.headers.get("content-type") || "";
  if (!/json/i.test(contentType)) {
    const buffer = Buffer.from(await res.arrayBuffer());
    return { buffer, contentType: contentType || "audio/mpeg", shape: "bytes" };
  }

  const data = await res.json();
  const url = data?.audio_url || data?.url;
  if (typeof url === "string" && /^https?:\/\//i.test(url)) {
    const audioRes = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS.speech) });
    if (!audioRes.ok) {
      throw new Error(`downloading the synthesised audio failed — HTTP ${audioRes.status}`);
    }
    return {
      buffer: Buffer.from(await audioRes.arrayBuffer()),
      contentType: audioRes.headers.get("content-type") || "audio/mpeg",
      shape: "json:url",
    };
  }
  const b64 = data?.audio_base64 || data?.audio;
  if (typeof b64 === "string" && b64.length > 0) {
    const [, mime, payload] = b64.match(/^data:([^;]+);base64,(.*)$/s) || [];
    return {
      buffer: Buffer.from(payload || b64, "base64"),
      contentType: mime || data?.content_type || "audio/mpeg",
      shape: "json:base64",
    };
  }
  throw new Error(
    `the speech response carried no audio (keys: ${Object.keys(data || {}).join(", ")})`,
  );
}

/** Synthesise one voice's sample. */
async function synthesise(voice, text) {
  const res = await ariziyFetch("/v1/text-to-speech", {
    method: "POST",
    body: { text, voice },
    timeoutMs: TIMEOUT_MS.speech,
  });
  const audio = await readAudio(res);
  if (audio.buffer.length < 1024) {
    throw new Error(`the audio is suspiciously small (${audio.buffer.length} bytes)`);
  }
  return audio;
}

/** A CDN URL out of an upload response — same field order as pickHostedUrl(). */
function hostedUrlFrom(data) {
  for (const node of [data?.file, data?.data?.file, data?.data, data]) {
    if (!node || typeof node !== "object") continue;
    const candidate = node.image_url || node.url || node.file_url || node.s3_key;
    if (typeof candidate !== "string" || !candidate) continue;
    const url = /^https?:\/\//i.test(candidate)
      ? candidate
      : `${CDN_BASE}/${candidate.replace(/^\/+/, "")}`;
    return { url, id: node.id ?? null };
  }
  return null;
}

/** Upload one sample to the gallery and return its CDN URL + gallery id. */
async function uploadToGallery(voice, { buffer, contentType }) {
  const filename = `${voice}.${extensionFor(contentType)}`;
  const form = new FormData();
  form.append("file", new File([buffer], filename, { type: contentType }));

  const res = await fetch(`${KLUX_API_BASE}/gallery`, {
    method: "POST",
    headers: { Authorization: `Bearer ${GALLERY_TOKEN}`, Accept: "application/json" },
    body: form,
    signal: AbortSignal.timeout(TIMEOUT_MS.upload),
  });
  if (res.status === 401) {
    throw new HttpError(
      "the gallery rejected KLUX_PROBE_TOKEN (HTTP 401) — log in on the site and replace it in .env",
      401,
    );
  }
  if (!res.ok) {
    throw new HttpError(`gallery upload HTTP ${res.status} — ${await errorDetail(res)}`, res.status);
  }
  const hosted = hostedUrlFrom(await res.json());
  if (!hosted) throw new Error("the gallery accepted the upload but returned no URL");
  return { ...hosted, filename };
}

// ─────────────────────────────────────────────────────────────────────────────
// MANIFEST
// ─────────────────────────────────────────────────────────────────────────────

function readManifest() {
  if (!existsSync(MANIFEST_PATH)) return null;
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  } catch (err) {
    throw new Error(
      `${path.relative(root, MANIFEST_PATH)} exists but is not valid JSON (${err.message}) — fix or delete it`,
    );
  }
}

/**
 * The manifest, in catalogue order. Every catalogue field is kept verbatim;
 * ours sit under `sample` so the two never collide. A voice without a `sample`
 * has no clip yet.
 */
function buildManifest(catalogue, samples) {
  return {
    _about:
      "GENERATED by scripts/generate-wavenet-samples.mjs — do not edit by hand. " +
      "Each sample is hosted in the gallery; deleting it there breaks that voice's preview.",
    generatedAt: new Date().toISOString(),
    provider: catalogue.provider ?? null,
    model: catalogue.model ?? null,
    default: catalogue.default ?? null,
    count: catalogue.voices.length,
    voices: catalogue.voices.map((v) =>
      samples.has(v.voice) ? { ...v, sample: samples.get(v.voice) } : { ...v },
    ),
  };
}

function writeManifest(catalogue, samples) {
  const json = `${JSON.stringify(buildManifest(catalogue, samples), null, 2)}\n`;
  writeFileSync(MANIFEST_PATH, json, "utf8");
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  if (!ARIZIY_KEY) {
    throw new Error("KLUX_API_KEY is not set — add the Ariziy key to .env");
  }

  const catalogue = await fetchCatalogue();
  const ids = new Set(catalogue.voices.map((v) => v.voice));
  if (catalogue.default && !ids.has(catalogue.default)) {
    console.warn(
      `⚠️  The catalogue's default voice "${catalogue.default}" is not in its own list.`,
    );
  }

  // Samples carried over from the last run, keyed by voice.
  const previous = readManifest();
  const samples = new Map();
  for (const v of previous?.voices || []) {
    if (v?.sample?.url && ids.has(v.voice)) samples.set(v.voice, v.sample);
  }
  const dropped = (previous?.voices || []).filter((v) => v?.sample?.url && !ids.has(v.voice));
  if (dropped.length > 0) {
    console.warn(
      `⚠️  ${dropped.length} voice(s) left the catalogue — their gallery files are now orphaned:\n` +
        dropped.map((v) => `     ${v.voice}  gallery #${v.sample.galleryId ?? "?"}  ${v.sample.url}`).join("\n"),
    );
  }

  const unknown = ONLY.filter((id) => !ids.has(id));
  if (unknown.length > 0) console.warn(`⚠️  Not in the catalogue, ignoring: ${unknown.join(", ")}`);

  const wanted = catalogue.voices.filter(
    (v) =>
      (ONLY.length === 0 || ONLY.includes(v.voice)) &&
      (!LANGUAGE || v.language === LANGUAGE || v.language.startsWith(`${LANGUAGE}-`)),
  );
  const untranslated = wanted.filter((v) => !lineFor(v.language));
  if (untranslated.length > 0) {
    console.warn(
      `⚠️  No sample line for ${[...new Set(untranslated.map((v) => v.language))].join(", ")} — ` +
        `skipping ${untranslated.length} voice(s). Add the language to SAMPLE_LINES.`,
    );
  }
  const pending = wanted.filter((v) => {
    const line = lineFor(v.language);
    if (!line) return false;
    const have = samples.get(v.voice);
    return FORCE || !have || have.line !== line;
  });

  if (pending.length === 0) {
    writeManifest(catalogue, samples);
    console.log(
      `✅ Nothing to generate — ${samples.size}/${catalogue.voices.length} voices already have a sample. Manifest refreshed.`,
    );
    return;
  }

  console.log(`🎙️  ${pending.length} sample(s) to generate:`);
  console.log(`   ${pending.map((v) => v.voice).join(", ")}`);
  console.log(
    "💸 Each one is a real Ariziy synthesis call, and each upload adds an item to the gallery behind KLUX_PROBE_TOKEN.",
  );

  if (DRY_RUN) {
    console.log("🧪 --dry-run — stopping here, nothing was generated or uploaded.");
    return;
  }
  if (!CONFIRMED) {
    console.error(
      `\n❌ Refusing to spend ${pending.length} synthesis call(s) without --yes.\n` +
        "   Re-run with --yes when you mean it, or --dry-run to see the list.\n",
    );
    process.exitCode = 1;
    return;
  }
  if (!GALLERY_TOKEN) {
    throw new Error("KLUX_PROBE_TOKEN is not set — the samples need a gallery account to live in");
  }

  let made = 0;
  const failures = [];
  // ⚠️ ONE AT A TIME, DELIBERATELY. These are paid calls on a shared key; a
  // parallel run turns one bad credential into 161 failures before the first
  // error is printed. Auth failures stop the run outright for the same reason.
  for (const [index, v] of pending.entries()) {
    const line = lineFor(v.language);
    const tag = `[${String(index + 1).padStart(3)}/${pending.length}] ${v.voice.padEnd(22)}`;
    try {
      process.stdout.write(`⏳ ${tag} synthesising… `);
      const audio = await synthesise(v.voice, line);
      process.stdout.write(`${(audio.buffer.length / 1024).toFixed(0)} KB (${audio.shape}, ${audio.contentType}) · uploading… `);
      const hosted = await uploadToGallery(v.voice, audio);
      samples.set(v.voice, {
        url: hosted.url,
        galleryId: hosted.id,
        filename: hosted.filename,
        contentType: audio.contentType,
        bytes: audio.buffer.length,
        line,
        generatedAt: new Date().toISOString(),
      });
      // After EVERY voice, so an interrupted run resumes where it stopped.
      writeManifest(catalogue, samples);
      made += 1;
      console.log(`✅ ${hosted.url}`);
    } catch (err) {
      console.log(`❌ ${err?.message || err}`);
      failures.push([v.voice, err?.message || String(err)]);
      if (err instanceof HttpError && [401, 403].includes(err.status)) {
        console.error("🛑 Stopping — an auth failure will not fix itself on the next voice.");
        break;
      }
    }
  }

  writeManifest(catalogue, samples);
  console.log(
    `\n🎉 ${made}/${pending.length} generated · ${samples.size}/${catalogue.voices.length} voices now have a sample.`,
  );
  console.log(`💾 Manifest: ${path.relative(root, MANIFEST_PATH)}`);
  if (failures.length > 0) {
    console.log(`⚠️  Failed (${failures.length}): ${failures.map(([id]) => id).join(", ")}`);
    console.log("   Re-run the same command — voices that succeeded are skipped.");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(`❌ Wavenet sample generation failed: ${err?.message || err}`);
  process.exit(1);
});
