/**
 * Element animations (Canva-style) for the design editor.
 *
 * An animation is stored on an element as `el.animation = { type, speed }`.
 * Playback is a *preview* inside the editor only — the PNG export is a single
 * static frame, so animations are not baked into downloads. `animationStyle`
 * returns the inline style that runs one element's animation once (or a few
 * loops for emphasis effects); `KEYFRAMES_CSS` defines the keyframes and is
 * injected once by the editor.
 */

// General animations — shown in both the Page and Text tabs.
export const ANIMATIONS = [
  { id: "fade", label: "Fade" },
  { id: "rise", label: "Rise" },
  { id: "pan", label: "Pan" },
  { id: "drift", label: "Drift" },
  { id: "pop", label: "Pop" },
  { id: "wipe", label: "Wipe" },
  { id: "tumble", label: "Tumble" },
  { id: "stomp", label: "Stomp" },
  { id: "block", label: "Block" },
  { id: "neon", label: "Neon" },
  { id: "breathe", label: "Breathe", loop: true },
  { id: "pulse", label: "Pulse", loop: true },
];

// "Featured" page styles — each applies one animation across every element on
// the page (Canva's Simple / Sleek / Fun / … row).
export const PAGE_PRESETS = [
  { id: "simple", label: "Simple", anim: "fade" },
  { id: "sleek", label: "Sleek", anim: "rise" },
  { id: "fun", label: "Fun", anim: "pop" },
  { id: "party", label: "Party", anim: "pulse" },
  { id: "corporate", label: "Corporate", anim: "pan" },
  { id: "chill", label: "Chill", anim: "drift" },
];

export const ANIM_SPEEDS = [
  { id: "slow", label: "Slow", mult: 1.6 },
  { id: "medium", label: "Medium", mult: 1 },
  { id: "fast", label: "Fast", mult: 0.6 },
];

const BASE_DURATION = 0.7; // seconds at "medium"

/** Inline style running one element's animation as a preview, or null. */
export function animationStyle(anim) {
  if (!anim || !anim.type || anim.type === "none") return null;
  const def = ANIMATIONS.find((a) => a.id === anim.type);
  if (!def) return null;
  const speed = ANIM_SPEEDS.find((s) => s.id === anim.speed) || ANIM_SPEEDS[1];
  const dur = (BASE_DURATION * speed.mult).toFixed(2);
  const iterations = def.loop ? "3" : "1";
  const easing = def.loop ? "ease-in-out" : "cubic-bezier(0.22, 1, 0.36, 1)";
  return { animation: `ck-${def.id} ${dur}s ${easing} ${iterations} both` };
}

export const KEYFRAMES_CSS = `
@keyframes ck-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes ck-rise { from { opacity: 0; transform: translateY(26px) } to { opacity: 1; transform: translateY(0) } }
@keyframes ck-pan { from { opacity: 0; transform: translateX(-36px) } to { opacity: 1; transform: translateX(0) } }
@keyframes ck-drift { from { opacity: 0; transform: translateY(-26px) } to { opacity: 1; transform: translateY(0) } }
@keyframes ck-pop { 0% { opacity: 0; transform: scale(0.6) } 60% { opacity: 1; transform: scale(1.08) } 100% { opacity: 1; transform: scale(1) } }
@keyframes ck-wipe { from { clip-path: inset(0 100% 0 0) } to { clip-path: inset(0 0 0 0) } }
@keyframes ck-tumble { from { opacity: 0; transform: translateY(24px) rotate(-12deg) } to { opacity: 1; transform: translateY(0) rotate(0) } }
@keyframes ck-stomp { 0% { opacity: 0; transform: scale(1.6) } 60% { opacity: 1; transform: scale(0.94) } 100% { opacity: 1; transform: scale(1) } }
@keyframes ck-block { from { clip-path: inset(0 0 100% 0) } to { clip-path: inset(0 0 0 0) } }
@keyframes ck-neon { 0% { opacity: 0 } 10% { opacity: 1 } 15% { opacity: 0.3 } 25% { opacity: 1 } 32% { opacity: 0.5 } 42% { opacity: 1 } 100% { opacity: 1 } }
@keyframes ck-breathe { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.06) } }
@keyframes ck-pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.45 } }
`;
