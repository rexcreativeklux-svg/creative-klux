"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { radiusToCss, radiusToNumber } from "@/(lib)/design/radius";
import { borderDashArray, borderLineCap } from "@/(lib)/design/borderDash";
import { clipRange, emitVideo, onVideo } from "@/(lib)/design/video";
import { isCropped } from "@/(lib)/design/imageCrop";
import { coverScale } from "@/(lib)/design/videoCrop";
import { buildImageFilter } from "@/(lib)/design/imageAdjust";

const stop = (e) => e.stopPropagation();

/**
 * VideoInner — a video element on the stage.
 *
 * It rests PAUSED on the first frame of its trimmed window, the way Canva shows
 * a video on the page. Hovering it brings up Canva's controls: the ▶ in the
 * middle and a scrubber along the bottom whose knob can be dragged to any
 * point in the window. Playback respects trim, volume, mute and speed, and
 * stops (rewinding to the trim start) at the end of the window.
 *
 * The controls swallow the press before react-rnd sees it, so using them
 * doesn't start a drag. Everywhere else the video lets pointer events through,
 * so it selects and drags like an image.
 *
 * Sizes are divided by `zoom`: the stage is scaled, and the controls should be
 * the same size on screen whatever the zoom.
 */
export default function VideoInner({ el, zoom = 1 }) {
  const ref = useRef(null);
  const trackRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { start, end: trimEnd } = clipRange(el);
  const volume = Math.min(1, Math.max(0, el.volume ?? 1));
  const speed = Number(el.speed) || 1;
  const crop = isCropped(el.crop) ? el.crop : null;
  const borderWidth = Number(el.borderWidth) || 0;

  // A video saved before its length was known has no trim end; the element's
  // own length stands in once it has loaded.
  const windowEnd = () => {
    const v = ref.current;
    if (trimEnd > start) return trimEnd;
    return v && Number.isFinite(v.duration) ? v.duration : start;
  };

  // Media properties that have no React attribute (volume, playbackRate) or
  // whose attribute only applies on mount (muted).
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.volume = volume;
    v.muted = !!el.muted;
    v.playbackRate = speed;
  }, [volume, el.muted, speed]);

  // While paused, rest on the first frame of the window — so trimming the start
  // shows the new opening frame straight away.
  useEffect(() => {
    const v = ref.current;
    if (!v || !v.paused) return;
    if (v.readyState >= 1) v.currentTime = start;
  }, [start]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (!v.paused) {
      v.pause();
      return;
    }
    if (v.currentTime < start || v.currentTime >= windowEnd() - 0.05) {
      v.currentTime = start;
    }
    v.play().catch(() => setPlaying(false));
  };

  // The trim bar drives this video from outside (see emitVideo in video.js):
  // it seeks to the frame under a handle, and plays / pauses the window. The
  // toggle goes through a ref so the subscription doesn't churn every render
  // while still reaching the current trim window.
  const toggleRef = useRef(toggle);
  useEffect(() => {
    toggleRef.current = toggle;
  });
  useEffect(() => {
    const offSeek = onVideo("seek", el.id, ({ time }) => {
      const v = ref.current;
      if (!v) return;
      v.pause();
      v.currentTime = time;
    });
    const offToggle = onVideo("toggle", el.id, () => toggleRef.current());
    return () => {
      offSeek();
      offToggle();
    };
  }, [el.id]);

  const report = () => {
    const v = ref.current;
    if (v) emitVideo("time", { id: el.id, time: v.currentTime, playing: !v.paused });
  };

  const onTimeUpdate = () => {
    const v = ref.current;
    if (!v) return;
    report();
    const end = windowEnd();
    // Only playback is held to the window — a scrub may land on its last frame.
    if (!v.paused && end > start && v.currentTime >= end) {
      // Play on repeat goes round again; otherwise stop and rewind.
      if (!el.loop) v.pause();
      v.currentTime = start;
      setProgress(0);
      return;
    }
    const length = end - start;
    setProgress(length > 0 ? Math.min(1, Math.max(0, (v.currentTime - start) / length)) : 0);
  };

  // ── Scrubbing ─────────────────────────────────────────────────────────
  const seekTo = (clientX) => {
    const v = ref.current;
    const track = trackRef.current;
    if (!v || !track) return;
    const rect = track.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const end = windowEnd();
    v.currentTime = start + frac * Math.max(0, end - start - 0.05);
    setProgress(frac);
  };

  const onScrubDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setScrubbing(true);
    seekTo(e.clientX);
  };
  const onScrubMove = (e) => {
    if (scrubbing) seekTo(e.clientX);
  };
  const onScrubUp = (e) => {
    if (!scrubbing) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setScrubbing(false);
  };

  const btn = 56 / zoom;
  const knob = 22 / zoom;
  const bar = 6 / zoom;
  const inset = 14 / zoom;
  // Controls show on hover; held on screen while the knob is being dragged.
  const hoverOnly = scrubbing
    ? "opacity-100"
    : "opacity-0 group-hover/video:opacity-100";

  return (
    <div
      className="group/video"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: radiusToCss(el.borderRadius),
        background: "#000",
      }}
    >
      {/* Flip on a box-sized wrapper, not on the video: a cropped video is
          larger than the box and offset inside it, and flipping IT would mirror
          about its own centre and slide a different part of the frame into
          view. Adjust / Filter looks ride here too, the same CSS filter an
          image gets. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          transform: `scaleX(${el.flipH ? -1 : 1}) scaleY(${el.flipV ? -1 : 1})`,
          filter: buildImageFilter(el) || undefined,
        }}
      >
        {/* Straighten (crop mode's Rotate): the footage turns about the box
            centre, scaled just enough to keep the box covered (videoCrop.js). */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: el.cropRotate
              ? `rotate(${el.cropRotate}deg) scale(${coverScale(el.width, el.height, el.cropRotate)})`
              : undefined,
          }}
        >
        <video
          ref={ref}
          src={el.src}
          poster={el.poster || undefined}
          preload="auto"
          playsInline
          onLoadedMetadata={(e) => {
            if (start) e.currentTarget.currentTime = start;
          }}
          onPlay={() => {
            setPlaying(true);
            report();
          }}
          onPause={() => {
            setPlaying(false);
            report();
          }}
          onTimeUpdate={onTimeUpdate}
          // Reaching the very end of the source (no trim end to catch first).
          onEnded={(e) => {
            if (!el.loop) return;
            e.currentTarget.currentTime = start;
            e.currentTarget.play().catch(() => {});
          }}
          style={{
            pointerEvents: "none",
            display: "block",
            ...(crop
              ? {
                  // The crop rect, stretched onto the box (see videoCrop.js).
                  position: "absolute",
                  width: `${100 / crop.w}%`,
                  height: `${100 / crop.h}%`,
                  left: `${(-crop.x / crop.w) * 100}%`,
                  top: `${(-crop.y / crop.h) * 100}%`,
                  maxWidth: "none",
                  objectFit: "fill",
                }
              : {
                  width: "100%",
                  height: "100%",
                  objectFit: el.objectFit || "cover",
                }),
          }}
        />
        </div>
      </div>

      {/* Border — over the picture, inset into the box, exactly where the
          exporter strokes it on the poster: an SVG stroke down the middle of
          the border's width, so a dash pattern (borderDash.js) lands on the
          same pixels in both. */}
      {borderWidth > 0 && (
        <svg
          className="absolute inset-0 pointer-events-none"
          width="100%"
          height="100%"
          viewBox={`0 0 ${el.width} ${el.height}`}
          preserveAspectRatio="none"
        >
          <rect
            x={borderWidth / 2}
            y={borderWidth / 2}
            width={Math.max(0, el.width - borderWidth)}
            height={Math.max(0, el.height - borderWidth)}
            rx={Math.max(0, radiusToNumber(el.borderRadius) - borderWidth / 2)}
            fill="none"
            stroke={el.borderColor || "#000000"}
            strokeWidth={borderWidth}
            strokeDasharray={borderDashArray(el.borderDash, borderWidth).join(" ") || undefined}
            strokeLinecap={borderLineCap(el.borderDash)}
          />
        </svg>
      )}

      <button
        type="button"
        onPointerDown={stop}
        onMouseDown={stop}
        onTouchStart={stop}
        onDoubleClick={stop}
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        title={playing ? "Pause" : "Play"}
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm cursor-pointer transition-opacity hover:bg-black/70 ${
          playing ? hoverOnly : "opacity-100"
        }`}
        style={{ width: btn, height: btn, pointerEvents: "auto" }}
      >
        {playing ? (
          <Pause style={{ width: btn * 0.42, height: btn * 0.42 }} fill="currentColor" />
        ) : (
          <Play
            style={{ width: btn * 0.42, height: btn * 0.42, marginLeft: btn * 0.06 }}
            fill="currentColor"
          />
        )}
      </button>

      {/* Scrubber. The hit area is taller than the bar so the knob is easy to
          catch; the bar itself is thin, like Canva's. */}
      <div
        ref={trackRef}
        onPointerDown={onScrubDown}
        onPointerMove={onScrubMove}
        onPointerUp={onScrubUp}
        onPointerCancel={onScrubUp}
        onMouseDown={stop}
        onTouchStart={stop}
        onDoubleClick={stop}
        className={`absolute flex items-center cursor-pointer transition-opacity ${hoverOnly}`}
        style={{
          left: inset,
          right: inset,
          bottom: inset * 0.6,
          height: knob * 1.4,
          pointerEvents: "auto",
          touchAction: "none",
        }}
      >
        <div
          className="relative w-full rounded-full bg-white/45 shadow"
          style={{ height: bar }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white"
            style={{ width: `${progress * 100}%` }}
          />
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-md"
            style={{ left: `${progress * 100}%`, width: knob, height: knob }}
          />
        </div>
      </div>

      {/* Thin progress line while playing with the pointer elsewhere. */}
      {playing && !scrubbing && (
        <div
          className="absolute inset-x-0 bottom-0 bg-white/25 pointer-events-none transition-opacity group-hover/video:opacity-0"
          style={{ height: 4 / zoom }}
        >
          <div className="h-full bg-white" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
    </div>
  );
}
