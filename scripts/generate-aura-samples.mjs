// Pre-generate a short spoken sample for every HOSTED (Aura-2) Text-to-Audio
// voice, saved as MP3s in public/voice-samples/aura/ (run: `npm run aura-samples`).
//
// The sibling of generate-voice-samples.mjs, and the difference between them is
// the whole reason this file exists:
//
//   generate-voice-samples.mjs  Kokoro-82M, run LOCALLY in Node. Free, offline,
//                               repeatable — regenerate whenever you like.
//   this one                    Aura-2, which only exists behind our own API.
//                               Every sample is a REAL BILLED GENERATION and
//                               files a history record on the account whose
//                               token you use.
//
// ⚠️ SO IT IS A ONE-TIME COST, AND THAT IS THE POINT. 40 generations once,
// committed to git, and the picker's ▶ is free for every user forever after.
// The alternative — auditioning by calling /generate from the browser — bills a
// generation every time anyone taps play on any voice, which is why the app
// refuses to do it (see the ⚠️ on useVoicePreview).
//
// ⚠️ IT WILL NOT RUN WITHOUT `--yes`. A script that spends money on import is a
// script somebody runs by accident while looking for `npm run models`.
//
// Usage:
//   CK_TOKEN=<bearer token>  npm run aura-samples -- --yes
//   ... --only=asteria,luna,athena   just these voices (the ★ eight, say)
//   ... --force                      regenerate ones already on disk
//   ... --dry-run                    list what WOULD be generated, spend nothing
//
// Getting a token: log into the app, DevTools → Application → Local Storage →
// whatever the auth entry holds, or copy the Authorization header off any
// /magic-studio request in the Network tab. It is the same account that gets
// billed and that the 40 history records land on.
//
// Node 18+ (needs global fetch). No new dependencies.

import { mkdirSync, existsSync, writeFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(root, "public", "voice-samples", "aura");

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api.creativeklux.com/api/creativeklux-userend";
const CDN_BASE = (
  process.env.NEXT_PUBLIC_CDN_URL || "https://d3r8chxzp8ea06.cloudfront.net"
).replace(/\/+$/, "");
const TOKEN = process.env.CK_TOKEN || process.env.NEXT_PUBLIC_CK_TOKEN || "";

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
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// The 40 Aura-2 voices, lowercase, exactly as the API spells them.
//
// ⚠️ KEPT IN SYNC BY HAND with AURA_VOICES in src/(lib)/magic-studio-audio.js —
// that file is ESM/JSX inside the Next app and a plain Node script cannot import
// it, the same reason generate-voice-samples.mjs re-lists Kokoro's 28. If the
// API ever reports an unknown voice, its own 422 answers with the whole enum.
const VOICES = [
  // Feminine
  "amalthea", "andromeda", "asteria", "athena", "aurora", "callista",
  "cora", "cordelia", "delia", "electra", "harmonia", "helena",
  "hera", "iris", "janus", "juno", "luna", "minerva",
  "ophelia", "pandora", "phoebe", "thalia", "theia", "vesta",
  // Masculine
  "apollo", "arcas", "aries", "atlas", "draco", "hermes",
  "hyperion", "jupiter", "mars", "neptune", "odysseus", "orion",
  "orpheus", "pluto", "saturn", "zeus",
];

/** Deepgram's flagship voices — do these first if you only do some. */
const TOP = ["asteria", "luna", "athena", "hera", "apollo", "arcas", "orion", "zeus"];

const displayName = (id) => id.charAt(0).toUpperCase() + id.slice(1);

// ⚠️ THE SAME LINE THE KOKORO SAMPLES SPEAK. Comparing two voices is only fair
// if they are saying the same words — see sampleLine in generate-voice-samples.mjs.
const sampleLine = (name) =>
  `Hi, I'm ${name}. This is how I sound. Let's make something great together.`;

/** How long to wait on one generation before giving up on it and moving on. */
const POLL_CEILING_MS = 3 * 60 * 1000;
const POLL_EVERY_MS = 3000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function apiFetch(url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${TOKEN}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const detail =
      (data && (data.message || data.error || data.detail)) ||
      (typeof data === "string" ? data.slice(0, 200) : "") ||
      res.statusText;
    throw new Error(`HTTP ${res.status} — ${detail}`);
  }
  return data;
}

/** Unwrap `{ generation: {...} }`, which is how a record arrives. */
const unwrap = (data) =>
  data && typeof data === "object" && data.generation ? data.generation : data;

/** A playable URL out of a record, from whichever field carries it. */
function resultUrl(data) {
  const root = unwrap(data) || {};
  const candidate =
    root.url ||
    root.audio_url ||
    root.s3_key ||
    root.meta?.outputs?.[0]?.url ||
    root.meta?.outputs?.[0]?.key ||
    (Array.isArray(data?.urls) ? data.urls[0] : null);
  if (!candidate || typeof candidate !== "string") return null;
  return /^https?:\/\//i.test(candidate)
    ? candidate
    : `${CDN_BASE}/${candidate.replace(/^\/+/, "")}`;
}

const DONE = ["completed", "complete", "done", "success", "succeeded", "ready", "finished"];
const FAILED = ["failed", "error", "errored", "cancelled", "canceled"];

/** Generate one voice's sample and return its hosted URL. */
async function generateSample(voice) {
  const started = await apiFetch(`${API_BASE}/magic-studio/generate`, {
    method: "POST",
    body: JSON.stringify({
      tool: "text_to_audio",
      prompt: sampleLine(displayName(voice)),
      voice,
      speaking_speed: 1,
    }),
  });

  const immediate = resultUrl(started);
  if (immediate) return immediate;

  const id = unwrap(started)?.id ?? started?.generation_id ?? started?.job_id;
  if (id == null) {
    throw new Error("no result and no job id in the generate response");
  }

  // Same shape of wait as the app's: the record is written when the request
  // arrives and filled in when the provider answers.
  const deadline = Date.now() + POLL_CEILING_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_EVERY_MS);
    const data = await apiFetch(
      `${API_BASE}/magic-studio/generations/${id}/status`,
    );
    const status = String(unwrap(data)?.status || "").toLowerCase();
    if (FAILED.includes(status)) {
      throw new Error(unwrap(data)?.error || `generation ${id} failed`);
    }
    const url = resultUrl(data);
    if (url && (DONE.includes(status) || !status)) return url;
  }
  throw new Error(`timed out after ${POLL_CEILING_MS / 1000}s`);
}

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed — HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const wanted = ONLY.length > 0 ? VOICES.filter((v) => ONLY.includes(v)) : VOICES;
  const unknown = ONLY.filter((v) => !VOICES.includes(v));
  if (unknown.length > 0) {
    console.warn(`⚠️  Not Aura voices, ignoring: ${unknown.join(", ")}`);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const pending = wanted.filter(
    (v) => FORCE || !existsSync(path.join(OUT_DIR, `${v}.mp3`)),
  );

  if (pending.length === 0) {
    console.log(
      `✅ Nothing to do — all ${wanted.length} requested sample(s) already exist (use --force to rebuild).`,
    );
    return;
  }

  console.log(
    `🎙️  ${pending.length} sample(s) to generate: ${pending.join(", ")}`,
  );
  console.log(
    `💸 EACH ONE IS A REAL BILLED GENERATION on the account behind CK_TOKEN, and files a history record.`,
  );

  if (DRY_RUN) {
    console.log("🧪 --dry-run — stopping here, nothing was generated.");
    return;
  }
  if (!CONFIRMED) {
    console.error(
      `\n❌ Refusing to spend ${pending.length} generation(s) without --yes.\n` +
        `   Re-run with --yes when you mean it, or --dry-run to see the list.\n` +
        `   Tip: start with the eight flagship voices —\n` +
        `   npm run aura-samples -- --yes --only=${TOP.join(",")}\n`,
    );
    process.exitCode = 1;
    return;
  }
  if (!TOKEN) {
    console.error(
      "\n❌ No token. Set CK_TOKEN to a Bearer token for an account that can generate.\n",
    );
    process.exitCode = 1;
    return;
  }

  let made = 0;
  const failures = [];
  // ⚠️ ONE AT A TIME, DELIBERATELY. These cost money and hit a rate-limited
  // endpoint; a parallel run turns one bad token into 40 failed charges before
  // the first error is even printed.
  for (const voice of pending) {
    const dest = path.join(OUT_DIR, `${voice}.mp3`);
    try {
      process.stdout.write(`⏳ ${voice.padEnd(11)} generating… `);
      const url = await generateSample(voice);
      writeFileSync(dest, await download(url));
      made += 1;
      console.log(`✅ ${(statSync(dest).size / 1024).toFixed(0)} KB`);
    } catch (err) {
      failures.push([voice, err?.message || String(err)]);
      console.log(`❌ ${err?.message || err}`);
    }
  }

  console.log(
    `\n🎉 ${made}/${pending.length} written to public/voice-samples/aura/.`,
  );
  if (failures.length > 0) {
    console.log(`⚠️  Failed: ${failures.map(([v]) => v).join(", ")}`);
    console.log("   Re-run the same command — the ones that succeeded are skipped.");
  }
  if (made > 0) {
    console.log(
      "   Commit them: the picker draws a ▶ only for voices whose file is on disk,\n" +
        "   so they have to ship with the app to be previewable for anyone else.",
    );
  }
}

main().catch((err) => {
  console.error(`❌ Aura sample generation failed: ${err?.message || err}`);
  process.exit(1);
});
