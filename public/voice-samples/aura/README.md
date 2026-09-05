# Aura-2 voice samples

Drop an MP3 in here named exactly after the voice and that voice gets a ▶ in the
Text to Audio voice picker. Nothing else needs editing — the picker HEAD-probes
`/voice-samples/aura/<name>.mp3` for every card when the panel opens and draws
the play button only where a file answers.

**Why files rather than generating a preview:** these voices are hosted
(Deepgram Aura-2, through `POST /magic-studio/generate`). The only way to hear
one at runtime is to bill a real generation and file a history record for a
sample nobody asked to keep — so auditioning is deliberately NOT wired to that
endpoint. See the ⚠️ on `AURA_VOICE_ITEMS` in `src/(lib)/magic-studio-audio.js`
and on `useVoicePreview` in
`src/app/(components)/magic-studio/magicEngineHooks.js`.

**Naming is the contract.** The path is derived from the voice name the API
uses, lowercase, so `asteria.mp3` — not `Asteria.mp3`, not `aura-asteria.mp3`.
A misnamed file is indistinguishable from a missing one: no ▶, no error.

**What to record.** The Kokoro clips in the parent folder speak one line —
"Hi, I'm {name}. This is how I sound. Let's make something great together." —
and matching that keeps auditioning one voice against another a fair comparison.
Keep them short (a few seconds); they are fetched on tap, not preloaded.

## The 40 filenames

Feminine:
`amalthea` `andromeda` `asteria` `athena` `aurora` `callista` `cora` `cordelia`
`delia` `electra` `harmonia` `helena` `hera` `iris` `janus` `juno` `luna`
`minerva` `ophelia` `pandora` `phoebe` `thalia` `theia` `vesta`

Masculine:
`apollo` `arcas` `aries` `atlas` `draco` `hermes` `hyperion` `jupiter` `mars`
`neptune` `odysseus` `orion` `orpheus` `pluto` `saturn` `zeus`

The eight flagship voices carry a ★ in the picker and are the ones worth doing
first: `asteria`, `luna`, `athena`, `hera`, `apollo`, `arcas`, `orion`, `zeus`.
