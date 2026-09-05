"use client";

/**
 * timerSound — the noise the countdown makes when it reaches zero.
 *
 * There is no audio file. Each tone is synthesised with the Web Audio API — an
 * oscillator per note, shaped by a gain envelope. Nothing to ship, no licence to
 * clear, no network request, and it still works offline. An mp3 in /public is
 * the obvious alternative and it costs ~50KB plus a fetch that can fail at
 * exactly the moment the sound is needed.
 *
 * Autoplay policy: a browser will not let an AudioContext make a sound until the
 * user has interacted with the page. The context is therefore created lazily,
 * from a real gesture — pressing Start, or previewing a tone — rather than on
 * mount, where it would be created suspended and never recover.
 */

let audioCtx = null;

/** Create or resume the shared AudioContext. Must be called from a gesture. */
export function primeAudio() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null; // no Web Audio at all — stay silent rather than throw
    audioCtx = new Ctor();
  }
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
}

/**
 * Each tone is a small arpeggio: frequencies in Hz, played `gap` seconds apart,
 * each decaying over `decay`. `peak` stays well under 1 so the alarm is a nudge
 * rather than a jump-scare — this fires while someone is concentrating.
 */
export const TONES = {
  chime: { label: "Chime", type: "sine", notes: [880, 1108.73, 1318.51], gap: 0.18, decay: 0.9, peak: 0.22 },
  bell: { label: "Bell", type: "triangle", notes: [1568, 1568], gap: 0.4, decay: 1.4, peak: 0.18 },
  beep: { label: "Beep", type: "square", notes: [988, 988, 988], gap: 0.22, decay: 0.11, peak: 0.09 },
};

export const TONE_KEYS = Object.keys(TONES);

/**
 * "Make no sound", offered as a tone rather than a separate mute switch — one
 * list to read instead of a list plus a toggle that can disagree with it.
 */
export const NONE_TONE = "none";

/** Play a tone at `volume` (0–1). Silent and harmless if audio is unavailable. */
export function playTone(name, volume = 0.7) {
  if (name === NONE_TONE) return;
  const spec = TONES[name];
  if (!spec) return;

  const ctx = primeAudio();
  if (!ctx) return;

  spec.notes.forEach((freq, i) => {
    const start = ctx.currentTime + i * spec.gap;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = spec.type;
    osc.frequency.value = freq;

    // Ramped, never switched: setting gain straight to a value and back makes
    // an audible click at both ends, which is most of what a cheap alarm
    // sounds like.
    const peak = Math.max(0, Math.min(1, volume)) * spec.peak;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + spec.decay);

    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + spec.decay + 0.05);
  });
}
