"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import {
  captureFilmstrip,
  clipRange,
  emitVideo,
  onVideo,
  videoMeta,
} from "@/(lib)/design/video";

/**
 * VideoTrimBar — Canva's trim mode. It takes the context bar's place across
 * the top of the stage:
 *
 *   [length] [▶] [ ▒▒▒▒[ filmstrip window ]▒▒▒▒ ] [Done]
 *
 * The purple window is the part of the clip that plays. Drag either end to
 * trim it, or the middle to slide it along. While dragging, the video on the
 * canvas shows the frame under the handle and a bubble above it gives the time
 * there; ▶ plays the window on the canvas, with a playhead running along the
 * strip. The length box can be typed into — it moves the end.
 *
 * Writes `trimStart` / `trimEnd` live (no history) while dragging, with ONE
 * history entry pushed when the press begins — a whole drag is one undo step.
 *
 * Props: { el, onChange: (patch, opts) => void, onGestureBegin, onDone }
 */
const MIN_LENGTH = 0.5;
const FRAMES = 16;

export default function VideoTrimBar({ el, onChange, onGestureBegin, onDone }) {
  const stripRef = useRef(null);
  const dragRef = useRef(null);
  const [frames, setFrames] = useState(null);
  const [probed, setProbed] = useState(0);
  const [drag, setDrag] = useState(null); // { mode, time } while a handle is held
  const [play, setPlay] = useState({ time: 0, playing: false });

  const duration = Number(el.duration) || probed;
  const { start, end } = clipRange({ ...el, duration });
  const length = Math.max(0, end - start);

  // The filmstrip — and, for a video that never learnt it, the length.
  useEffect(() => {
    let alive = true;
    captureFilmstrip(el.src, FRAMES).then((f) => alive && setFrames(f || []));
    if (!Number(el.duration)) {
      videoMeta(el.src).then((m) => alive && m?.duration && setProbed(m.duration));
    }
    return () => {
      alive = false;
    };
  }, [el.src, el.duration]);

  // Follow the canvas video's playhead.
  useEffect(
    () => onVideo("time", el.id, ({ time, playing }) => setPlay({ time, playing })),
    [el.id],
  );

  // Leaving trim mode stops playback and rests the video on the opening frame
  // of the window as it now stands — read through a ref, since the cleanup
  // otherwise sees the window as it was when trim mode opened.
  const startRef = useRef(start);
  useEffect(() => {
    startRef.current = start;
  }, [start]);
  useEffect(
    () => () => emitVideo("seek", { id: el.id, time: startRef.current }),
    [el.id],
  );

  const pct = (t) => (duration ? (t / duration) * 100 : 0);

  // ── Dragging ──────────────────────────────────────────────────────────
  const timeAt = (clientX) => {
    const r = stripRef.current.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * duration;
  };

  const down = (mode, e) => {
    if (!duration) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    onGestureBegin?.();
    dragRef.current = { mode, grab: timeAt(e.clientX), start, end };
    const time = mode === "end" ? end : start;
    setDrag({ mode, time });
    emitVideo("seek", { id: el.id, time });
  };

  const move = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const t = timeAt(e.clientX);
    let s = d.start;
    let en = d.end;
    if (d.mode === "start") s = Math.max(0, Math.min(t, en - MIN_LENGTH));
    else if (d.mode === "end") en = Math.min(duration, Math.max(t, s + MIN_LENGTH));
    else {
      // Slide the whole window, its length unchanged, kept inside the clip.
      const span = d.end - d.start;
      s = Math.min(duration - span, Math.max(0, d.start + (t - d.grab)));
      en = s + span;
    }
    s = round(s);
    en = round(en);
    onChange({ trimStart: s, trimEnd: en, ...(Number(el.duration) ? {} : { duration }) }, { record: false });
    const time = d.mode === "end" ? en : s;
    setDrag({ mode: d.mode, time });
    emitVideo("seek", { id: el.id, time });
  };

  const up = (e) => {
    if (!dragRef.current) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    dragRef.current = null;
    setDrag(null);
  };

  // ── Typing a length ───────────────────────────────────────────────────
  const [draft, setDraft] = useState(null); // null = not editing
  const commitLength = () => {
    const n = Number(draft);
    setDraft(null);
    if (!Number.isFinite(n) || !duration) return;
    const len = Math.max(MIN_LENGTH, Math.min(duration - start, n));
    onChange({ trimEnd: round(start + len) }, { record: true });
  };

  const handle = (side) => (
    <div
      onPointerDown={(e) => down(side, e)}
      className="absolute top-0 bottom-0 w-3.5 flex items-center justify-center cursor-ew-resize touch-none"
      style={{ [side === "start" ? "left" : "right"]: -2 }}
    >
      <span className="w-1 h-5 rounded-full bg-white/90" />
    </div>
  );

  return (
    <div className="absolute top-3 inset-x-2 z-9999 lg:inset-x-auto lg:left-1/2 lg:-translate-x-1/2 lg:w-[min(880px,calc(100vw-420px))]">
      <div className="flex items-center gap-2 bg-surface border border-gray-200 shadow-lg rounded-xl px-2 py-1.5">
        {/* Length — type to set it; it moves the end. */}
        <input
          value={draft ?? length.toFixed(1)}
          onFocus={(e) => {
            setDraft(length.toFixed(1));
            e.target.select();
          }}
          onChange={(e) => setDraft(e.target.value.replace(/[^\d.]/g, ""))}
          onBlur={commitLength}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          aria-label="Clip length in seconds"
          className="w-16 h-9 shrink-0 rounded-lg border border-gray-200 text-center text-sm text-gray-700 tabular-nums focus:outline-none focus:border-blue-400"
        />
        <span className="-ml-1.5 text-sm text-gray-500 select-none">s</span>

        <button
          onClick={() => emitVideo("toggle", { id: el.id })}
          title={play.playing ? "Pause" : "Play"}
          className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg text-gray-800 hover:bg-gray-100 cursor-pointer transition"
        >
          {play.playing ? (
            <Pause className="w-5 h-5" fill="currentColor" />
          ) : (
            <Play className="w-5 h-5" fill="currentColor" />
          )}
        </button>

        {/* Filmstrip. */}
        <div
          ref={stripRef}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          className="relative flex-1 min-w-0 h-11 rounded-lg overflow-visible select-none"
        >
          <div className="absolute inset-0 flex rounded-lg overflow-hidden bg-gray-200">
            {frames === null
              ? Array.from({ length: FRAMES }, (_, i) => (
                  <span key={i} className="flex-1 animate-pulse bg-gray-200 border-r border-white/40" />
                ))
              : frames.length
                ? frames.map((f, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={f} alt="" draggable={false} className="flex-1 min-w-0 h-full object-cover" />
                  ))
                : el.poster && (
                    // Frames unreadable — the still, repeated, beats a blank bar.
                    <div
                      className="flex-1"
                      style={{
                        backgroundImage: `url(${el.poster})`,
                        backgroundSize: "auto 100%",
                        backgroundRepeat: "repeat-x",
                      }}
                    />
                  )}
          </div>

          {/* Dim what's trimmed away. */}
          <div className="absolute inset-y-0 left-0 rounded-l-lg bg-white/70 pointer-events-none" style={{ width: `${pct(start)}%` }} />
          <div className="absolute inset-y-0 right-0 rounded-r-lg bg-white/70 pointer-events-none" style={{ width: `${100 - pct(end)}%` }} />

          {/* The kept window: drag its body to slide, its ends to trim. */}
          {duration > 0 && (
            <div
              onPointerDown={(e) => down("move", e)}
              className="absolute -inset-y-0.5 rounded-lg border-[3px] border-blue-600 cursor-grab active:cursor-grabbing touch-none"
              style={{ left: `${pct(start)}%`, width: `${pct(length)}%` }}
            >
              <span className="absolute inset-y-0 left-0 w-3 bg-blue-600 rounded-l-md pointer-events-none" />
              <span className="absolute inset-y-0 right-0 w-3 bg-blue-600 rounded-r-md pointer-events-none" />
              {handle("start")}
              {handle("end")}
            </div>
          )}

          {/* Playhead, while the canvas video plays. */}
          {play.playing && duration > 0 && (
            <span
              className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-gray-900 pointer-events-none"
              style={{ left: `${pct(play.time)}%` }}
            />
          )}

          {/* Time under the handle being dragged. */}
          {drag && (
            <span
              className="absolute bottom-full mb-2 -translate-x-1/2 px-2 py-1 rounded-md bg-gray-900 text-white text-xs font-semibold tabular-nums whitespace-nowrap pointer-events-none"
              style={{ left: `${pct(drag.time)}%` }}
            >
              {drag.mode === "move" ? `${length.toFixed(1)}s` : `${drag.time.toFixed(1)}s`}
            </span>
          )}
        </div>

        <button
          onClick={onDone}
          className="h-9 px-3 shrink-0 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-100 cursor-pointer transition"
        >
          Done
        </button>
      </div>
    </div>
  );
}

const round = (n) => Math.round(n * 100) / 100;
