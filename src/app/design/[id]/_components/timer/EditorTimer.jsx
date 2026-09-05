"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Minus,
  Music,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Volume2,
  X,
} from "lucide-react";
import { NONE_TONE, TONES, TONE_KEYS, playTone, primeAudio } from "./timerSound";

/**
 * EditorTimer — a countdown that floats over the stage.
 *
 * Set a length, start it, watch the ring drain, hear a chime at zero. For
 * timeboxing a design, or for running a workshop off the same screen everyone is
 * looking at.
 *
 * ── The countdown runs off a DEADLINE, not a counter ──────────────────────
 *
 * The obvious implementation subtracts one second per interval tick, and it is
 * wrong: `setInterval` is throttled hard in a background tab and fires late on a
 * busy main thread, so every late tick is time the counter never sees. A five
 * minute timer quietly finishes several seconds long, and the longer it runs the
 * worse it gets. Storing the moment it should END and rendering the difference
 * makes the interval a repaint schedule rather than the clock — late ticks then
 * cost accuracy of the DISPLAY for one frame, which nobody can see, instead of
 * accumulating into the result.
 *
 * State is local: nothing else in the editor needs to know the time remaining,
 * so closing the widget ends the countdown with it.
 *
 * Props: { onClose }
 */

const MIN_MINUTES = 1;
const MAX_MINUTES = 180;
const DEFAULT_MINUTES = 5;
const RING = 2 * Math.PI * 42; // circumference of the r=42 dial

const mmss = (seconds) => {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export default function EditorTimer({ onClose }) {
  const [total, setTotal] = useState(DEFAULT_MINUTES * 60);
  const [remaining, setRemaining] = useState(DEFAULT_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const [tone, setTone] = useState("chime");
  const [volume, setVolume] = useState(0.7);
  const [menu, setMenu] = useState(null); // 'sound' | null

  const deadlineRef = useRef(null);
  // Read from inside the ticker, which is armed once per run — plain state
  // would be the value from when the run started by the time it fires.
  const alarmRef = useRef({ tone, volume });
  useEffect(() => {
    alarmRef.current = { tone, volume };
  });

  const rootRef = useRef(null);
  useEffect(() => {
    if (!menu) return undefined;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setMenu(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menu]);

  // The countdown. `remaining` is deliberately NOT a dependency: it changes four
  // times a second, and re-running this on each change would reset the deadline
  // from the value just rendered — which is the accumulating drift this design
  // exists to avoid.
  useEffect(() => {
    if (!running) return undefined;
    deadlineRef.current = Date.now() + remaining * 1000;

    const tick = () => {
      const left = (deadlineRef.current - Date.now()) / 1000;
      if (left <= 0) {
        setRemaining(0);
        setRunning(false);
        playTone(alarmRef.current.tone, alarmRef.current.volume);
        return;
      }
      setRemaining(left);
    };

    // Four times a second: the display only shows whole seconds, and polling at
    // exactly 1s would show each one a fraction late.
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const start = useCallback(() => {
    // From a gesture, which is the only moment the browser will let an
    // AudioContext be created — do it now so the alarm can sound later.
    primeAudio();
    if (remaining <= 0) setRemaining(total);
    setRunning(true);
  }, [remaining, total]);

  const setMinutes = (mins) => {
    const clamped = Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, mins));
    setTotal(clamped * 60);
    setRemaining(clamped * 60);
    setRunning(false);
  };

  const reset = () => {
    setRunning(false);
    setRemaining(total);
  };

  const finished = remaining <= 0;
  const progress = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const minutes = Math.round(total / 60);

  return (
    <div
      ref={rootRef}
      className="absolute bottom-4 right-4 z-[9998] flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-surface/95 p-3 shadow-2xl backdrop-blur"
    >
      {/* Dial. The ring is the countdown; the number is for reading it exactly. */}
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="7" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={finished ? "#ef4444" : "#2563eb"}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={RING}
            strokeDashoffset={RING * (1 - progress)}
            // Only while stopped: a transition during the tick would lag the
            // ring a quarter-second behind the number beside it.
            style={{ transition: running ? "none" : "stroke-dashoffset 200ms" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-xl font-bold tabular-nums ${
              finished ? "text-red-600" : "text-gray-800"
            }`}
          >
            {mmss(remaining)}
          </span>
        </div>
      </div>

      {/* Length. Only while stopped — changing the length of a running timer
          has no sensible answer, and disabling says so more clearly than
          silently ignoring the click. */}
      <div className="flex items-center gap-1">
        <IconBtn
          title="Less time"
          disabled={running}
          onClick={() => setMinutes(minutes - 1)}
        >
          <Minus className="h-3.5 w-3.5" />
        </IconBtn>
        <span className="min-w-14 text-center text-[11px] font-semibold text-gray-500 tabular-nums">
          {minutes} min
        </span>
        <IconBtn
          title="More time"
          disabled={running}
          onClick={() => setMinutes(minutes + 1)}
        >
          <Plus className="h-3.5 w-3.5" />
        </IconBtn>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={running ? () => setRunning(false) : start}
          title={running ? "Pause" : "Start"}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-700 cursor-pointer"
        >
          {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {running ? "Pause" : "Start"}
        </button>
        <IconBtn title="Reset" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn
          title="Alarm sound"
          active={menu === "sound"}
          onClick={() => setMenu((m) => (m === "sound" ? null : "sound"))}
        >
          <Music className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn title="Close timer" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </IconBtn>
      </div>

      {menu === "sound" && (
        <div className="absolute bottom-full right-0 mb-2 w-48 rounded-xl border border-gray-100 bg-surface p-2 shadow-2xl">
          {[...TONE_KEYS, NONE_TONE].map((key) => (
            <button
              key={key}
              onClick={() => {
                setTone(key);
                // Previewed on pick: choosing an alarm you cannot hear until it
                // matters is choosing blind.
                playTone(key, volume);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition cursor-pointer hover:bg-gray-100 ${
                tone === key ? "font-semibold text-blue-600" : "text-gray-700"
              }`}
            >
              {key === NONE_TONE ? "None" : TONES[key].label}
            </button>
          ))}
          <label className="mt-1 flex items-center gap-2 border-t border-gray-100 px-2.5 pt-2">
            <Volume2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              className="w-full cursor-pointer"
            />
          </label>
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, onClick, title, active, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition cursor-pointer
        disabled:cursor-not-allowed disabled:opacity-40 ${
          active
            ? "border-blue-400 bg-blue-50 text-blue-600"
            : "border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
    >
      {children}
    </button>
  );
}
