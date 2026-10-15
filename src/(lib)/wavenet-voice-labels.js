/**
 * wavenet-voice-labels.js
 * ─────────────────────────────────────────────────────────────────────────────
 * The HAND-MAINTAINED half of the hosted voice picker: a display name for every
 * Google Wavenet voice.
 *
 * The other half — which voices exist and where each one's sample lives — is
 * GENERATED into wavenet-voice-samples.json by `npm run wavenet-samples`. The two
 * are kept apart on purpose: regenerating the samples must never wipe the names.
 *
 * ⚠️ THE NAMES ARE OURS, NOT THE VENDOR'S. Wavenet voices are only lettered
 * (`en-US-Wavenet-C`), so each one is given a first name common in its language,
 * matched to its gender. They are labels, not people — see the ⚠️ on VOICE_FACES
 * in magic-studio-audio.js: no bios, no "recorded by".
 *
 * ⚠️ A VOICE MISSING HERE STILL WORKS. When the vendor adds a voice and the
 * samples are regenerated, its card falls back to "Voice <letter>" until a name
 * is added below. Keep the names UNIQUE across the whole list — the composer
 * chip shows the name alone, so two "Ana"s would be indistinguishable there.
 *
 * Plain data, no "use client": magic-studio-audio.js imports this and is itself
 * imported by a server component (see the ⚠️ at the top of that file).
 */

/** Voice id → display name. Grouped by locale, in the catalogue's letter order. */
export const WAVENET_VOICE_NAMES = {
  // English (Australia)
  "en-AU-Wavenet-A": "Matilda",
  "en-AU-Wavenet-B": "Jack",
  "en-AU-Wavenet-C": "Chloe",
  "en-AU-Wavenet-D": "Lachlan",
  // English (UK)
  "en-GB-Wavenet-A": "Amelia",
  "en-GB-Wavenet-B": "Oliver",
  "en-GB-Wavenet-C": "Isla",
  "en-GB-Wavenet-D": "Harry",
  "en-GB-Wavenet-F": "Poppy",
  "en-GB-Wavenet-N": "Imogen",
  "en-GB-Wavenet-O": "Alfie",
  // English (India)
  "en-IN-Wavenet-A": "Priya",
  "en-IN-Wavenet-B": "Arjun",
  "en-IN-Wavenet-C": "Rohan",
  "en-IN-Wavenet-D": "Kavya",
  "en-IN-Wavenet-E": "Isha",
  "en-IN-Wavenet-F": "Vikram",
  // English (US)
  "en-US-Wavenet-A": "Ethan",
  "en-US-Wavenet-B": "Noah",
  "en-US-Wavenet-C": "Ava",
  "en-US-Wavenet-D": "Mason",
  "en-US-Wavenet-E": "Harper",
  "en-US-Wavenet-F": "Emma",
  "en-US-Wavenet-G": "Olivia",
  "en-US-Wavenet-H": "Sophia",
  "en-US-Wavenet-I": "Liam",
  "en-US-Wavenet-J": "James",
};
