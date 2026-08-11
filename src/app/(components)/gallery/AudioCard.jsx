"use client";

// components/gallery/AudioCard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Interactive audio result player, extracted from MagicStudioModal so it can be
// reused by the gallery (and anywhere else audio needs to play). The waveform is
// a real amplitude profile decoded from the audio (loud = tall), with a
// played/unplayed split and click-or-drag scrubbing. Extraction is best-effort:
// if the bytes can't be fetched/decoded (e.g. a cross-origin URL without CORS)
// we fall back to a neutral placeholder so the card still works.
//
// Props are unchanged from the original so Magic Studio's ResultCanvas keeps
// working as-is; `asset.title` is a new optional label used by the gallery.

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Download,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
  AudioLines,
  MoreHorizontal,
} from "lucide-react";

const BAR_COUNT = 56; // bars in the waveform

// Placeholder amplitudes (normalized 0–1) shown until/if real analysis lands.
const FALLBACK_WAVE = [
  8, 14, 20, 12, 24, 16, 10, 22, 18, 26, 14, 9, 20, 28, 16, 12, 22, 10, 18, 24,
  14, 8, 20, 16, 26, 12, 18, 10,
].map((h) => h / 28);

// Lazily-created, shared AudioContext used ONLY to decode bytes into samples
// (playback itself uses the <audio> element). Shared so many cards don't each
// spin up a context and hit the browser's per-page limit.
let sharedDecodeCtx = null;
function getDecodeContext() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!sharedDecodeCtx) sharedDecodeCtx = new AC();
  return sharedDecodeCtx;
}

// Promise wrapper around decodeAudioData (callback form → widest browser support).
function decodeAudioData(ctx, arrayBuffer) {
  return new Promise((resolve, reject) =>
    ctx.decodeAudioData(arrayBuffer, resolve, reject),
  );
}

// Read an asset's raw bytes: on-device results already hold a Blob; hosted
// results are fetched (may throw on CORS — the caller falls back gracefully).
async function readAudioBytes(asset) {
  if (asset.blob) return asset.blob.arrayBuffer();
  if (!asset.src) return null;
  const res = await fetch(asset.src);
  if (!res.ok) throw new Error(`Audio fetch failed (${res.status})`);
  return res.arrayBuffer();
}

// Downsample one channel into `count` peak buckets, normalized to 0–1 so the
// loudest moment reaches full height.
function computeWaveformPeaks(audioBuffer, count) {
  const data = audioBuffer.getChannelData(0);
  const block = Math.max(1, Math.floor(data.length / count));
  const peaks = new Array(count).fill(0);
  let max = 0;
  for (let i = 0; i < count; i++) {
    const start = i * block;
    let peak = 0;
    for (let j = 0; j < block && start + j < data.length; j++) {
      const v = Math.abs(data[start + j]);
      if (v > peak) peak = v;
    }
    peaks[i] = peak;
    if (peak > max) max = peak;
  }
  return max > 0 ? peaks.map((p) => p / max) : peaks;
}

// Seconds → "m:ss" (always renders, defaults to 0:00).
export const formatClock = (seconds) => {
  const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/**
 * Interactive audio result player.
 *
 * Play/pause, ±10s skip, a real decoded waveform you can click or drag to scrub,
 * elapsed/total time, and volume/mute. On-device results carry rich meta
 * (voiceLabel, duration, format, blob); every field is optional so plain backend
 * URLs render fine too.
 *
 * @param {object} props
 * @param {{src?: string, blob?: Blob, duration?: number, format?: string, title?: string, voiceLabel?: string, alt?: string}} props.asset
 * @param {number} props.index Position (for a fallback title).
 * @param {(asset: object) => void} props.onDownload
 * @param {(asset: object, e: React.MouseEvent) => void} props.onOpenMenu
 * @param {boolean} [props.fill=false] Fit a box with a size of its own — a grid
 *   cell — rather than taking the height the content wants. Two things change:
 *   the card grows to its container with the WAVEFORM absorbing the slack, and
 *   it becomes a `@container` whose controls drop out as it narrows.
 *
 *   ⚠️ THE SHEDDING IS NOT COSMETIC. A square cell in a four-column grid is
 *   ~400px on a desktop and ~190px on a phone, and the full transport needs
 *   ~310px — so at the small end the row does not merely look cramped, its
 *   buttons overflow the card. Volume goes first (a slider is the least of it
 *   when the system has one), then the skips; play, download and ⋯ always stay.
 *
 *   ⚠️ CONTAINER QUERIES, NOT BREAKPOINTS. The cell's width comes from the grid's
 *   column count as much as the viewport — three columns at `sm` is a NARROWER
 *   cell than two columns at `xs` — so a viewport breakpoint would hide controls
 *   on wide cells and keep them on narrow ones. Only the card's own width knows.
 *
 *   Default false keeps the natural height and every control, which is what a
 *   flowing list (the gallery) wants.
 */
export default function AudioCard({
  asset,
  index,
  onDownload,
  onOpenMenu,
  fill = false,
}) {
  const audioRef = useRef(null);
  const waveRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [metaDuration, setMetaDuration] = useState(null);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [bars, setBars] = useState(null); // real peaks, or null → placeholder
  const [dragFraction, setDragFraction] = useState(null); // set while scrubbing

  const duration = asset.duration || metaDuration || 0;
  const displayBars = bars || FALLBACK_WAVE;
  const fraction =
    dragFraction != null
      ? dragFraction
      : duration
        ? Math.min(1, currentTime / duration)
        : 0;

  // Decode the audio into a real waveform once per asset (best-effort).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const bytes = await readAudioBytes(asset);
        const ctx = getDecodeContext();
        if (!bytes || !ctx) return;
        const audioBuffer = await decodeAudioData(ctx, bytes);
        if (!cancelled) setBars(computeWaveformPeaks(audioBuffer, BAR_COUNT));
      } catch (err) {
        console.warn(
          "⚠️ [audio-card] waveform analysis failed — using placeholder:",
          err,
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [asset]);

  // Keep the element's volume/mute in sync with the controls.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  // Pause the element when the row unmounts.
  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.pause();
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      return;
    }
    // Replay from the top if we're sitting at the end.
    if (duration && audio.currentTime >= duration - 0.05) {
      audio.currentTime = 0;
      setCurrentTime(0);
    }
    audio.play().catch((err) => {
      console.error("❌ [audio-card] audio playback failed:", err);
      toast.error("Couldn't play this audio — try downloading it instead.");
    });
  };

  // Move the playhead by `delta` seconds (clamped to the clip).
  const seekBy = (delta) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const t = Math.min(duration, Math.max(0, audio.currentTime + delta));
    audio.currentTime = t;
    setCurrentTime(t);
  };

  // Jump to an absolute fraction (0–1) of the clip.
  const seekToFraction = (f) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const t = Math.min(1, Math.max(0, f)) * duration;
    audio.currentTime = t;
    setCurrentTime(t);
  };

  // ── Waveform scrubbing (click or drag) ──
  const fractionFromEvent = (e) => {
    const el = waveRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  };
  const onScrubStart = (e) => {
    if (!duration) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setDragFraction(fractionFromEvent(e));
  };
  const onScrubMove = (e) => {
    if (dragFraction == null) return;
    setDragFraction(fractionFromEvent(e));
  };
  const onScrubEnd = (e) => {
    if (dragFraction == null) return;
    seekToFraction(fractionFromEvent(e));
    setDragFraction(null);
  };
  const onWaveKeyDown = (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      seekBy(5);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      seekBy(-5);
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      togglePlay();
    }
  };

  const VolumeIcon =
    muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const format = asset.format?.toUpperCase();

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-sm ${
        fill ? "@container flex h-full flex-col p-3 @min-[20rem]:p-4" : "p-4"
      }`}
    >
      <audio
        ref={audioRef}
        src={asset.src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          if (dragFraction == null) setCurrentTime(e.currentTarget.currentTime);
        }}
        onLoadedMetadata={(e) => setMetaDuration(e.currentTarget.duration)}
      />

      {/* Title + format */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Decorative — it says "audio" on a card that is audibly audio. In a
              small cell that is 40px the title needs more than the icon does. */}
          <span
            className={`w-8 h-8 rounded-lg bg-blue-100 text-blue-600 items-center justify-center shrink-0 ${
              fill ? "hidden @min-[15rem]:flex" : "flex"
            }`}
          >
            <AudioLines className="w-4 h-4" />
          </span>
          <p
            className="text-sm font-semibold text-gray-900 truncate"
            title={asset.title || asset.alt}
          >
            {asset.title || asset.voiceLabel || `Audio track ${index + 1}`}
          </p>
        </div>
        {format && (
          <span className="shrink-0 text-[10px] font-bold text-gray-500 bg-gray-100 rounded-md px-1.5 py-0.5">
            {format}
          </span>
        )}
      </div>

      {/* Interactive waveform — click or drag to scrub */}
      <div
        ref={waveRef}
        role="slider"
        tabIndex={0}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(currentTime)}
        onPointerDown={onScrubStart}
        onPointerMove={onScrubMove}
        onPointerUp={onScrubEnd}
        onPointerCancel={onScrubEnd}
        onKeyDown={onWaveKeyDown}
        // ⚠️ min-h SURVIVES THE STRETCH. `flex-1` in a short container can
        // resolve to almost nothing, and a waveform two pixels tall is not a
        // scrub target — the floor is the height it would have had anyway.
        className={`relative mt-3 flex items-center gap-px rounded-md touch-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
          fill ? "min-h-14 flex-1" : "h-14"
        } ${duration ? "cursor-pointer" : "cursor-default"}`}
      >
        {displayBars.map((amp, i) => {
          const played = (i + 0.5) / displayBars.length <= fraction;
          return (
            <span
              key={i}
              className={`flex-1 rounded-full transition-colors ${played ? "bg-blue-500" : "bg-blue-500/25"}`}
              // Percentages when filling, so the bars grow with the container
              // instead of sitting as a 44px band in the middle of a tall card;
              // fixed pixels otherwise, against a fixed-height track.
              style={{
                height: fill
                  ? `${Math.max(3, amp * 100)}%`
                  : `${Math.max(2, amp * 44)}px`,
              }}
            />
          );
        })}
        {/* Playhead */}
        {duration > 0 && (
          <span
            className="pointer-events-none absolute top-1 bottom-1 w-0.5 rounded-full bg-blue-600"
            style={{ left: `${fraction * 100}%` }}
          />
        )}
      </div>

      {/* Elapsed / total */}
      <div className="mt-1.5 flex items-center justify-between text-[11px] tabular-nums text-gray-400">
        <span>{formatClock(currentTime)}</span>
        <span>{formatClock(duration)}</span>
      </div>

      {/* Transport + volume + actions.
          In fill mode the `@min-[…]` gates are container queries on the card
          itself — see the ⚠️ on the `fill` prop for what is dropped and why.
          Outside fill mode every one of them resolves to "always shown", so the
          gallery's card is exactly what it was. */}
      <div className="mt-3 flex items-center gap-1.5">
        <button
          onClick={() => seekBy(-10)}
          aria-label="Back 10 seconds"
          className={`shrink-0 p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors cursor-pointer ${
            fill ? "hidden @min-[15rem]:block" : ""
          }`}
        >
          <SkipBack className="w-4 h-4" />
        </button>
        <button
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
          className="w-11 h-11 rounded-full bg-linear-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow hover:opacity-90 transition-opacity cursor-pointer"
        >
          {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
        <button
          onClick={() => seekBy(10)}
          aria-label="Forward 10 seconds"
          className={`shrink-0 p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors cursor-pointer ${
            fill ? "hidden @min-[15rem]:block" : ""
          }`}
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Volume — the first thing to go. It is the control the operating
            system already offers, so losing it costs the least. */}
        <div
          className={`items-center gap-1.5 ml-1.5 ${
            fill ? "hidden @min-[20rem]:flex" : "flex"
          }`}
        >
          <button
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute" : "Mute"}
            className="shrink-0 p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <VolumeIcon className="w-4 h-4" />
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              setMuted(v === 0);
            }}
            aria-label="Volume"
            className={`accent-blue-600 cursor-pointer ${
              fill ? "w-14 @min-[26rem]:w-20" : "w-16 sm:w-20"
            }`}
          />
        </div>

        <div className="flex-1" />

        {onDownload && (
          <button
            onClick={() => onDownload(asset)}
            title="Download"
            aria-label="Download"
            className={`shrink-0 rounded-xl border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer ${
              fill ? "p-2 @min-[20rem]:p-2.5" : "p-2.5"
            }`}
          >
            <Download className="w-4 h-4" />
          </button>
        )}
        {onOpenMenu && (
          <button
            onClick={(e) => onOpenMenu(asset, e)}
            aria-label="Audio actions"
            className={`shrink-0 rounded-xl border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer ${
              fill ? "p-2 @min-[20rem]:p-2.5" : "p-2.5"
            }`}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
