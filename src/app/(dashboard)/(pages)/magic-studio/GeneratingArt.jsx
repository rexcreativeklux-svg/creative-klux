"use client";

/**
 * GeneratingArt — what an in-flight Magic Studio cell looks like while it works.
 * ─────────────────────────────────────────────────────────────────────────────
 * One backdrop per KIND of result, because the four kinds are not comparable
 * waits and should not look like each other:
 *
 *   image  a colour wash resolving out of blur — the thing being made is a
 *          picture, so the wait is a picture arriving
 *   video  film frames with a playhead sweeping across them; the only wait here
 *          that routinely runs into minutes, and it has to look like it is
 *          worth minutes
 *   audio  a live waveform — the one result with no picture of itself, so the
 *          wait borrows the shape its player will have
 *   text   lines writing themselves in
 *
 * ⚠️ EVERY VARIANT IS DECORATION AND SAYS NOTHING ABOUT PROGRESS. Not one of
 * these fills up, counts down, or resolves as the run gets closer to finishing —
 * they loop identically at second 2 and second 200. That is deliberate: a
 * backend generation gives the client no progress signal, so anything that
 * LOOKED like it was tracking one would be inventing it. What the cell actually
 * knows — elapsed time, and a true percentage on the two on-device engines — is
 * drawn by GeneratingCell over the top of this. See the ⚠️ on that component.
 *
 * Their only job is to say "alive, and this is the kind of thing being made".
 *
 * ⚠️ ALL FOUR ARE PURE CSS on a handful of divs. They can be on screen a dozen
 * at a time (a 4x run on a lattice that already has cells) for minutes at a
 * stretch, so nothing here may cost a canvas, an SVG filter chain, or a JS
 * animation frame. Staggering is done with inline `animationDelay` — the one
 * thing Tailwind can't express as a class per index.
 *
 * Honour prefers-reduced-motion: every animation carries `motion-reduce:animate-none`
 * so the whole set falls back to a still, legible shape rather than a jitter.
 */

/** Deterministic pseudo-random in [0,1) from an integer — see the ⚠️ below. */
// ⚠️ NOT Math.random(). These heights/delays are generated during render, and a
// real random would hand back different values every re-render — the cell
// re-renders once a second off its own clock, so every bar would jump to a new
// height each tick and the "waveform" would be static noise instead of a wave.
// A hash of the index is stable for the life of the component.
const jitter = (index) => {
  const x = Math.sin(index * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/** Bars for the audio variant. Fixed count — enough to read as a waveform. */
const WAVE_BARS = 14;
/** Frames for the video variant. Four reads as a filmstrip without crowding. */
const FILM_FRAMES = 4;
/** Lines for the text variant. */
const TEXT_LINES = 3;

function ImageArt() {
  // Three blurred colour fields drifting at different speeds. `blur-2xl` on
  // solid shapes gives the falloff for free — no gradients to keep in step, and
  // it reads as pigment spreading rather than as a loading widget.
  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-[18%] top-[22%] h-3/5 w-3/5 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-blue-400/70 blur-2xl [animation-duration:2.8s] motion-reduce:animate-none"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[16%] top-[30%] h-1/2 w-1/2 animate-pulse rounded-full bg-violet-400/65 blur-2xl [animation-delay:0.7s] [animation-duration:3.4s] motion-reduce:animate-none"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[10%] left-[38%] h-1/2 w-1/2 animate-pulse rounded-full bg-amber-300/65 blur-2xl [animation-delay:1.4s] [animation-duration:4s] motion-reduce:animate-none"
      />
    </>
  );
}

function VideoArt() {
  // `shimmer-sweep` (globals.css) puts a real left-to-right highlight across the
  // strip via ::after — the app's existing skeleton sweep, reused rather than
  // rebuilt, so this reads like every other loading surface in the product and
  // gets its reduced-motion handling for free. A playhead crossing frames is
  // exactly what it already does.
  return (
    <span
      aria-hidden="true"
      className="shimmer-sweep pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 gap-1 px-3"
    >
      {/* Sprocket-less on purpose — four frames in a row read as film at this
          size, and perforations turn to mud below ~40px. */}
      {Array.from({ length: FILM_FRAMES }, (_, index) => (
        <span
          key={index}
          className="h-12 flex-1 animate-pulse rounded-sm bg-slate-500/60 motion-reduce:animate-none"
          style={{
            animationDelay: `${index * 0.22}s`,
            animationDuration: "2.4s",
          }}
        />
      ))}
    </span>
  );
}

function AudioArt() {
  // A bar per slot, heights hashed off the index so the shape is a wave rather
  // than a flat comb, each pulsing on its own offset.
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-1/2 flex h-14 -translate-y-1/2 items-center justify-center gap-1 px-4"
    >
      {Array.from({ length: WAVE_BARS }, (_, index) => (
        <span
          key={index}
          className="w-1.5 animate-pulse rounded-full bg-indigo-500/70 motion-reduce:animate-none"
          style={{
            height: `${25 + jitter(index) * 70}%`,
            animationDelay: `${index * 0.09}s`,
            animationDuration: "1.3s",
          }}
        />
      ))}
    </span>
  );
}

function TextArt() {
  // Skeleton lines of uneven width, the last one short — the shape a paragraph
  // actually has, which is what makes it read as writing rather than as bars.
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col gap-2.5 px-6"
    >
      {Array.from({ length: TEXT_LINES }, (_, index) => (
        <span
          key={index}
          className="h-2.5 animate-pulse rounded-full bg-indigo-400/60 motion-reduce:animate-none"
          style={{
            width: index === TEXT_LINES - 1 ? "55%" : `${80 + jitter(index) * 18}%`,
            animationDelay: `${index * 0.25}s`,
            animationDuration: "1.9s",
          }}
        />
      ))}
    </span>
  );
}

const ART = {
  image: ImageArt,
  video: VideoArt,
  audio: AudioArt,
  text: TextArt,
};

/**
 * @param {object} props
 * @param {"image"|"video"|"audio"|"text"} [props.type] What the run will
 *   produce. Anything unrecognised falls back to the image wash — it is the
 *   most neutral of the four, and a tool with a new result type should look
 *   unremarkable rather than wrong while somebody adds its variant here.
 */
export default function GeneratingArt({ type }) {
  const Art = ART[type] || ImageArt;
  return <Art />;
}
