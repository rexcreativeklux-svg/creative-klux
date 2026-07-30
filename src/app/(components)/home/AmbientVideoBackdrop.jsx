"use client";

// app/(components)/home/AmbientVideoBackdrop.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The moving backdrop behind the home page hero.
//
// It is ATMOSPHERE, never content: the clip sits far back at low opacity under
// a heavy scrim, drifting slowly enough that you notice depth rather than
// motion. Everything above it — greeting, composer — stays fully crisp.
//
// Layer order, back to front:
//   1. wash     a soft brand-tinted radial. Painted immediately and never
//               removed, so it is also the fallback: if the clip is slow, fails,
//               or is skipped entirely, the hero still looks finished.
//   2. clip     the video, faded in only once the browser says it can play.
//   3. scrim    a vertical ramp to the page colour — dense at the top behind the
//               greeting, lightest through the middle where the composer floats,
//               solid at the bottom so the field melts into the template rail
//               instead of stopping at a hard edge.
//   4. vignette a radial pull to the page colour at the corners — gallery
//               lighting; it keeps the eye centred on the composer.
//
// Both scrim layers are built from the `--color-page` token, so light and dark
// are handled by the theme itself rather than by a second set of rules here.
//
// The whole stack is aria-hidden and pointer-events-none: it can never take a
// click meant for the composer, and it says nothing to a screen reader.

import { useRef, useState, useSyncExternalStore } from "react";
import useDailyVideo from "./useDailyVideo";
import { BACKGROUND_VIDEOS } from "./backgroundVideos";

/* ── "Does this user want motion?" as an external store ────────────────────
   matchMedia is a subscribable browser store, so useSyncExternalStore reads it
   directly instead of mirroring it into state via an effect. That keeps the
   value correct if the OS setting is toggled while the page is open, and gives
   SSR a defined answer. */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** @param {() => void} onChange @returns {() => void} unsubscribe */
function subscribeToReducedMotion(onChange) {
  if (typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const getReducedMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia(REDUCED_MOTION_QUERY).matches;

/** The server assumes reduced motion, so no <video> is ever in the sent HTML —
    the client decides once, after hydration, and fades it in from there. */
const getReducedMotionOnServer = () => true;

/**
 * @param {object} props
 * @param {string[]} [props.videos] Clip list. Defaults to BACKGROUND_VIDEOS.
 * @param {string}   [props.className] Extra positioning classes for the wrapper.
 */
export default function AmbientVideoBackdrop({
  videos = BACKGROUND_VIDEOS,
  className = "",
}) {
  const pick = useDailyVideo(videos);
  const videoRef = useRef(null);

  const reduceMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotion,
    getReducedMotionOnServer,
  );

  // Both flags are stored as the URL they refer to rather than as booleans, so
  // swapping clips resets them for free — no effect needed to clear stale state.
  const [readySrc, setReadySrc] = useState(null);
  const [failedSrc, setFailedSrc] = useState(null);

  const ready = pick != null && readySrc === pick.src;
  const failed = pick != null && failedSrc === pick.src;

  // Autoplay can still be REFUSED (aggressive power-saving, some enterprise
  // policies) even though the element is muted. There's nothing to recover from
  // that — we just stay on the gradient rather than showing a frozen first frame.
  //
  // An INTERRUPTION is a different thing and must not be treated as refusal:
  // the element carries `autoPlay` as well as this explicit play() (belt and
  // braces, since a few browsers ignore one or the other), so the two can race
  // and reject with AbortError. Unmounting mid-play rejects the same way. Both
  // are benign, and blacklisting the clip over them would drop the backdrop for
  // the rest of the session for no reason.
  const handleCanPlay = () => {
    const video = videoRef.current;
    if (!video || !pick) return;
    const started = video.play();
    if (started?.catch) {
      started.catch((error) => {
        if (error?.name === "AbortError") return;
        console.warn("⚠️ [home-video] autoplay was refused:", error?.name || error);
        setFailedSrc(pick.src);
      });
    }
    setReadySrc(pick.src);
  };

  const handleError = () => {
    if (!pick) return;
    console.error(`❌ [home-video] couldn't load clip ${pick.index + 1}:`, pick.src);
    setFailedSrc(pick.src);
  };

  const showVideo = !reduceMotion && pick != null && !failed;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* 1 · wash — the permanent base, and the fallback */}
      <div className="absolute inset-0 bg-[radial-gradient(58%_68%_at_50%_38%,rgba(0,61,218,0.09),transparent_72%)]" />

      {/* 2 · clip */}
      {showVideo && (
        <video
          ref={videoRef}
          key={pick.src}
          src={pick.src}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          tabIndex={-1}
          disablePictureInPicture
          onCanPlay={handleCanPlay}
          onError={handleError}
          className={`ck-video-drift absolute inset-0 h-full w-full object-cover transition-opacity duration-1800 ease-out ${
            ready ? "opacity-45 dark:opacity-55" : "opacity-0"
          }`}
        />
      )}

      {/* 3 · scrim */}
      <div className="absolute inset-0 bg-linear-to-b from-page/92 via-page/45 to-page" />

      {/* 4 · vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(72%_62%_at_50%_44%,transparent_35%,var(--color-page)_100%)] opacity-80" />
    </div>
  );
}
