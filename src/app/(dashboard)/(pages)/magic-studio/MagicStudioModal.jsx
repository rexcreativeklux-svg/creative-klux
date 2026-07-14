"use client";

/**
 * MagicStudioModal.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Two-side modal shell for Magic Studio, modeled on the Product Studio modals
 * (ProductToolModal / OnDeviceToolModal):
 *
 *   ┌ left sidebar ───────────────┬ right canvas ───────────────┐
 *   │ • title → category switcher │ • empty-state before/after  │
 *   │ • primary input (per type)  │   sample + copy             │
 *   │ • option rows → side panels │ • per-type result view      │
 *   │ • pinned Generate button    │   (image / video / audio /  │
 *   │                             │    transcript)              │
 *   └─────────────────────────────┴─────────────────────────────┘
 *
 * Everything category-specific lives in magicStudioConfigs.jsx — this shell is
 * generic. Option rows open RICH, side-anchored FloatingPanel dropdowns (image
 * cards, icon+desc lists, ratio frames, language flags, pills). Accent is blue.
 * Clicking the backdrop does NOT close — only the ✕ button or Escape.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { toast } from "sonner";
import {
  X,
  ChevronDown,
  Loader2,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Upload,
  FileAudio,
  Play,
  Pause,
  ImageOff,
  Star,
  AudioLines,
  MoreHorizontal,
  Mic,
  Square,
  Clock,
  Type,
  Languages,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import AudioCard, { formatClock } from "@/app/(components)/gallery/AudioCard";
import ResultActionsMenu, {
  buildResultActions,
} from "@/app/(components)/product-studio/ResultActionsMenu";
import { saveUrlToGallery } from "@/app/(components)/product-studio/saveToGallery";
import useTextToSpeech from "@/(lib)/ai-engine/hooks/useTextToSpeech";
import useSpeechToText from "@/(lib)/ai-engine/hooks/useSpeechToText";
import { getCreativeById } from "../studio/creatives";
import {
  MAGIC_STUDIO_CONFIGS,
  getMagicConfig,
  getVideoStatus,
  normalizeVideoResult,
} from "./magicStudioConfigs";
import { checkVideoGenerationStatus } from "@/(lib)/magic-studio-api";

const CREATIVE_ID = "magic_studio";

// Async video jobs: poll the status endpoint every 15s, giving up after ~5 min.
const VIDEO_POLL_INTERVAL_MS = 15000;
const VIDEO_POLL_MAX_ATTEMPTS = 20; // 20 × 15s ≈ 5 minutes

// ── Side-anchored floating panel (product-studio styling) ────────────────────
// Anchored to the RIGHT of its trigger, clamped into the viewport. Rendered
// inside <AnimatePresence> so the exit plays.
function FloatingPanel({ anchorRef, children, width = 340 }) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: -9999, left: -9999 });
  useEffect(() => {
    const a = anchorRef?.current;
    const p = panelRef.current;
    if (!a || !p) return;
    const r = a.getBoundingClientRect();
    const pw = p.offsetWidth || width;
    const ph = p.offsetHeight;
    const margin = 12;
    let left = r.right + 8;
    if (left + pw > window.innerWidth - margin) left = r.left - pw - 8;
    if (left < margin) left = window.innerWidth - pw - margin;
    left = Math.max(margin, left);
    let top = r.top;
    if (top + ph > window.innerHeight - margin)
      top = window.innerHeight - ph - margin;
    top = Math.max(margin, top);
    setPos({ top, left });
  }, [anchorRef, width]);
  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, x: -6, scale: 0.98 }}
      animate={{
        opacity: 1,
        x: 0,
        scale: 1,
        transition: { duration: 0.16, ease: "easeOut" },
      }}
      exit={{
        opacity: 0,
        x: -4,
        scale: 0.98,
        transition: { duration: 0.12, ease: "easeIn" },
      }}
      className="fixed z-220 bg-surface rounded-xl shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto hide-scrollbar"
      style={{
        top: pos.top,
        left: pos.left,
        width,
        transformOrigin: "left center",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </motion.div>
  );
}

// Dropdown anchored BELOW the trigger (category switcher).
function DropdownBelow({ anchorRef, children, width = 320 }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (anchorRef?.current) {
      const r = anchorRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left });
    }
  }, [anchorRef]);
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.16, ease: "easeOut" },
      }}
      exit={{
        opacity: 0,
        y: -6,
        scale: 0.98,
        transition: { duration: 0.12, ease: "easeIn" },
      }}
      className="fixed z-220 bg-surface rounded-2xl shadow-2xl border border-gray-200 p-2 max-h-[80vh] overflow-y-auto hide-scrollbar"
      style={{
        top: pos.top,
        left: pos.left,
        width,
        transformOrigin: "top left",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </motion.div>
  );
}

// ── Panel body variants (rich option cards) ──────────────────────────────────
function PanelBody({ option, value, onSelect, voicePreview }) {
  const { panel, items } = option;

  // Image cards: thumbnail + label + description (Visual style).
  if (panel === "cards") {
    return (
      <div className="p-2 grid grid-cols-2 gap-2">
        {items.map((it) => {
          const active = value === it.value;
          const Icon = it.icon;
          return (
            <button
              key={it.value}
              onClick={() => onSelect(it.value)}
              className={`flex flex-col rounded-2xl border-2 overflow-hidden text-left transition-colors ${active ? "border-blue-500 bg-blue-50/40" : "border-gray-200 hover:border-blue-300 bg-surface"}`}
            >
              <div className="relative w-full h-20 bg-gray-100">
                {it.img && (
                  <img
                    src={it.img}
                    alt={it.label}
                    className="w-full h-full object-cover"
                  />
                )}
                {active && (
                  <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shadow">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                )}
              </div>
              <div className="px-2.5 py-2">
                <div className="flex items-center gap-1.5">
                  {Icon && (
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${active ? "text-blue-600" : "text-gray-400"}`}
                    />
                  )}
                  <span
                    className={`text-xs font-bold ${active ? "text-blue-700" : "text-gray-900"}`}
                  >
                    {it.label}
                  </span>
                </div>
                {it.desc && (
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                    {it.desc}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Ratio frames: a scaled rectangle preview per aspect ratio.
  if (panel === "ratios") {
    return (
      <div className="p-3 grid grid-cols-3 gap-2.5">
        {items.map((it) => {
          const active = value === it.value;
          const maxDim = 60;
          const bw = it.w >= it.h ? maxDim : Math.round((maxDim * it.w) / it.h);
          const bh = it.h >= it.w ? maxDim : Math.round((maxDim * it.h) / it.w);
          return (
            <button
              key={it.value}
              onClick={() => onSelect(it.value)}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-colors ${active ? "border-blue-500 bg-blue-50/40" : "border-gray-200 hover:border-blue-300"}`}
            >
              <div className="flex items-center justify-center h-16 relative w-full">
                <div
                  className={`rounded-md ${active ? "bg-blue-300" : "bg-gray-200"}`}
                  style={{ width: bw, height: bh }}
                />
                {active && (
                  <span className="absolute top-0 right-2 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] font-semibold ${active ? "text-blue-700" : "text-gray-700"}`}
              >
                {it.label}
              </span>
              <span className="text-[9px] text-gray-400">{it.ratio}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Language flags: flag + label grid.
  if (panel === "flags") {
    return (
      <div className="p-2 grid grid-cols-2 gap-1.5">
        {items.map((it) => {
          const active = value === it.value;
          return (
            <button
              key={it.value}
              onClick={() => onSelect(it.value)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-colors ${active ? "border-blue-500 bg-blue-50/40" : "border-gray-200 hover:border-blue-300"}`}
            >
              <span className="text-lg leading-none">{it.flag}</span>
              <span
                className={`text-xs font-semibold flex-1 ${active ? "text-blue-700" : "text-gray-700"}`}
              >
                {it.label}
              </span>
              {active && (
                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Voices: rows grouped by accent + gender (Text to Audio's on-device voices).
  // Items carry `group` (section header), `gender` (icon tint) and `top`
  // (★ badge for the best-graded voices). Each row has a ▶ button that auditions
  // the voice on-device (see useVoicePreview); clicking the row body still selects.
  if (panel === "voices") {
    const groups = [];
    for (const it of items) {
      const last = groups[groups.length - 1];
      if (last && last.name === it.group) last.items.push(it);
      else groups.push({ name: it.group, items: [it] });
    }
    return (
      <div className="p-2 pb-3 max-h-150">
        <p className="px-2 pt-1 pb-2 text-[11px] leading-snug text-gray-400">
          Tap <Play className="inline w-3 h-3 -mt-0.5" /> to hear a sample of
          each voice before you pick.
        </p>
        {groups.map((group) => (
          <div key={group.name}>
            <p className="px-2 pt-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {group.name}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {group.items.map((it) => {
                const active = value === it.value;
                const Icon = it.icon;
                const female = it.gender === "female";
                const isLoading = voicePreview?.loadingId === it.value;
                const isPlaying = voicePreview?.playingId === it.value;
                return (
                  <div
                    key={it.value}
                    className={`flex items-center rounded-xl border-2 transition-colors ${active ? "border-blue-500 bg-blue-50/40" : "border-gray-200 hover:border-blue-300 bg-surface"}`}
                  >
                    <button
                      onClick={() => onSelect(it.value)}
                      className="flex items-center gap-2 pl-2.5 pr-1 py-2 flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${female ? "bg-pink-100 text-pink-600" : "bg-sky-100 text-sky-600"}`}
                      >
                        {Icon && <Icon className="w-3.5 h-3.5" />}
                      </span>
                      <span className="flex-1 min-w-0 flex items-center gap-1">
                        <span
                          className={`text-xs font-semibold truncate ${active ? "text-blue-700" : "text-gray-900"}`}
                        >
                          {it.label}
                        </span>
                        {it.top && (
                          <Star className="w-3 h-3 shrink-0 text-amber-400 fill-amber-400" />
                        )}
                      </span>
                    </button>
                    {voicePreview && (
                      <button
                        onClick={() => voicePreview.toggle(it)}
                        aria-label={
                          isPlaying
                            ? `Stop ${it.label} sample`
                            : `Play ${it.label} sample`
                        }
                        className={`shrink-0 w-7 h-7 mr-1 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${isPlaying ? "bg-blue-600 text-white" : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"}`}
                      >
                        {isLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="w-3 h-3" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Pills: compact chips (export format).
  if (panel === "pills") {
    return (
      <div className="p-3 flex flex-wrap gap-2">
        {items.map((it) => {
          const active = value === it.value;
          return (
            <button
              key={it.value}
              onClick={() => onSelect(it.value)}
              className={`px-4 py-2 rounded-xl border-2 text-xs font-semibold transition-colors ${active ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-700 hover:border-blue-300"}`}
            >
              {it.label}
            </button>
          );
        })}
      </div>
    );
  }

  // Default — icon + label + desc rows (list).
  return (
    <div className="p-2 space-y-1.5">
      {items.map((it) => {
        const active = value === it.value;
        const Icon = it.icon;
        return (
          <button
            key={it.value}
            onClick={() => onSelect(it.value)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-colors ${active ? "border-blue-500 bg-blue-50/40" : "border-gray-200 hover:border-blue-300 bg-surface"}`}
          >
            <span
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-blue-100" : "bg-gray-100"}`}
            >
              {Icon && (
                <Icon
                  className={`w-4 h-4 ${active ? "text-blue-600" : "text-gray-500"}`}
                />
              )}
            </span>
            <span className="flex-1 min-w-0">
              <span
                className={`block text-sm font-semibold ${active ? "text-blue-700" : "text-gray-900"}`}
              >
                {it.label}
              </span>
              {it.desc && (
                <span className="block text-[11px] text-gray-500 leading-snug">
                  {it.desc}
                </span>
              )}
            </span>
            {active && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

// Human-readable summary of the current value for an option row.
function summarize(option, value) {
  const found = option.items?.find((i) => i.value === value);
  return found?.label || value;
}

// Short line each voice "introduces itself" with when auditioned in the picker.
const voicePreviewLine = (name) =>
  `Hi, I'm ${name}. This is how I sound. Let's make something great together.`;

/**
 * Voice auditioning for the Text-to-Audio voice picker.
 *
 * Prefers a pre-generated static clip at /voice-samples/{id}.mp3 (produced by
 * `npm run voice-samples`) so a tap on ▶ plays instantly with no download. If a
 * sample is missing it falls back to synthesizing the intro line on-device with
 * the SAME Kokoro engine used for real generations. Resolved clips are cached in
 * memory (per session) and play through one shared <audio> element. Because
 * there is a single speech worker, synthesis previews are serialized (one at a
 * time) and the caller stops previews before a real generation — the worker is
 * never asked to do two things at once.
 *
 * @param {ReturnType<typeof useTextToSpeech>} tts The shared speech engine.
 * @returns {{ loadingId: string|null, playingId: string|null,
 *   toggle: (voice: {value: string, label: string}) => void, stop: () => void }}
 */
function useVoicePreview(tts) {
  const audioRef = useRef(null);
  const cacheRef = useRef(new Map()); // voiceId → object URL of its sample clip
  const [loadingId, setLoadingId] = useState(null);
  const [playingId, setPlayingId] = useState(null);

  // One shared element, created on first use (inside a user gesture).
  const getAudio = () => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.addEventListener("ended", () => setPlayingId(null));
      audioRef.current = audio;
    }
    return audioRef.current;
  };

  const stop = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlayingId(null);
  };

  // Audition a voice: toggles off if it's already playing; otherwise plays its
  // cached clip, the static sample, or a freshly synthesized one — in that order.
  // No-ops while a clip is resolving so the single worker only runs one job.
  const toggle = async (voice) => {
    const id = voice.value;
    if (playingId === id) {
      stop();
      return;
    }
    if (loadingId) return; // a synth is already in flight — one at a time

    const audio = getAudio();
    audio.pause();
    audio.currentTime = 0;
    setPlayingId(null);

    const cached = cacheRef.current.get(id);
    if (cached) {
      audio.src = cached;
      audio
        .play()
        .then(() => setPlayingId(id))
        .catch((err) =>
          console.error(
            "❌ [magic-studio] voice preview playback failed:",
            err,
          ),
        );
      return;
    }

    try {
      setLoadingId(id);

      // 1) Pre-generated static sample (npm run voice-samples) — instant, no
      //    engine download. Probe it first; if it isn't there, synthesize.
      const staticUrl = `/voice-samples/${id}.mp3`;
      let hasStatic = false;
      try {
        const res = await fetch(staticUrl, { method: "HEAD" });
        hasStatic = res.ok;
      } catch {
        hasStatic = false; // offline / blocked — fall through to synthesis
      }
      if (hasStatic) {
        cacheRef.current.set(id, staticUrl);
        audio.src = staticUrl;
        await audio.play();
        setPlayingId(id);
        return;
      }

      // 2) Fallback: synthesize on-device (the first one downloads the ~93 MB
      //    engine; the tts hook shows its own toast for that).
      const item = await tts.generate(voicePreviewLine(voice.label), {
        voice: id,
        speed: 1,
        format: "wav", // fastest — skip MP3 encoding for a throwaway sample
        quality: "standard",
      });
      if (!item) return; // failed/superseded — the engine already toasted
      cacheRef.current.set(id, item.url);
      audio.src = item.url;
      await audio.play();
      setPlayingId(id);
    } catch (err) {
      console.error("❌ [magic-studio] voice preview failed:", err);
      toast.error("Couldn't play that voice sample — please try again.");
    } finally {
      setLoadingId(null);
    }
  };

  // Stop playback if the modal unmounts (the tts hook revokes the URLs itself).
  useEffect(() => () => audioRef.current?.pause(), []);

  return { loadingId, playingId, toggle, stop };
}

// Auto-stop cap for mic recordings — matches the STT engine's duration cap so a
// forgotten recording can't grow past what the transcriber will accept.
const MAX_RECORD_SECONDS = 30 * 60;

/**
 * Microphone capture for the Audio-to-Text tool. Records with MediaRecorder,
 * then hands the finished clip (wrapped as a File) to `onComplete`, which feeds
 * it into the EXACT same on-device transcription path as an uploaded file
 * (record → stop → transcribe — consistent with the "progress → final text" UX).
 * Tracks elapsed time, auto-stops at the cap, and always releases the mic. The
 * callback is read through a ref so the latest closure runs without re-subscribing.
 *
 * @param {(file: File) => void} onComplete Receives the recorded audio.
 * @returns {{ recording: boolean, elapsed: number, start: () => void, stop: () => void }}
 */
function useMicRecorder(onComplete) {
  // Keep the latest callback in a ref so `onstop` always runs the current
  // closure — updated in an effect, never during render.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    clearTimer();
  };

  const stop = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop(); // fires onstop → file
    setRecording(false);
    clearTimer();
  };

  const start = async () => {
    if (recording) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Recording isn't supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data?.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        releaseStream();
        if (blob.size > 0) {
          // Wrap as a File so the upload UI (name/size) and the decoder treat a
          // recording exactly like an uploaded clip.
          const ext = type.includes("mp4") || type.includes("mpeg") ? "m4a" : "webm";
          const file = new File([blob], `recording-${Date.now()}.${ext}`, { type });
          onCompleteRef.current?.(file);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setElapsed(0);
      setRecording(true);
      timerRef.current = setInterval(() => {
        setElapsed((s) => {
          const next = s + 1;
          if (next >= MAX_RECORD_SECONDS) stop();
          return next;
        });
      }, 1000);
      console.log("🎙️ [magic-studio] mic recording started");
    } catch (err) {
      console.error("❌ [magic-studio] mic access failed:", err);
      releaseStream();
      toast.error("Couldn't access the microphone — check your browser permissions.");
    }
  };

  // Stop + release the mic on unmount (covers closing the modal mid-record).
  // Inlined (touches only stable refs) so it needs no effect dependencies.
  useEffect(
    () => () => {
      try {
        const recorder = recorderRef.current;
        if (recorder && recorder.state !== "inactive") recorder.stop();
      } catch {
        /* already stopped */
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  return { recording, elapsed, start, stop };
}

/**
 * @param {object}   props
 * @param {string}   props.categoryId  Category id from studio/creatives.js.
 * @param {(id: string) => void} props.onSwitch  Switch to another category.
 * @param {() => void} props.onClose
 */
export default function MagicStudioModal({ categoryId, onSwitch, onClose }) {
  const { activeBrand, uploadMedia } = useAuth();
  const router = useRouter();
  const creative = getCreativeById(CREATIVE_ID);
  const config = getMagicConfig(categoryId);

  // On-device speech engine (Kokoro-82M in a Web Worker) — only the
  // text_to_audio category calls it; it stays idle otherwise (the worker
  // spawns on first generate) and cleans up its worker + URLs on unmount.
  const tts = useTextToSpeech();

  // On-device voice auditioning for the Text-to-Audio voice picker — shares the
  // same Kokoro engine as generation (see useVoicePreview).
  const voicePreview = useVoicePreview(tts);

  // On-device speech-to-text engine (Whisper Base in a Web Worker) — only the
  // audio_to_text category calls it; it stays idle otherwise (the worker spawns
  // on first transcribe) and disposes its worker on unmount.
  const stt = useSpeechToText();

  // The active on-device engine that drives the processing state's REAL progress
  // bar + stage checklist, chosen by the config's `engine` tag ("tts" | "stt").
  const onDeviceEngine =
    config?.engine === "stt" ? stt : config?.engine === "tts" ? tts : null;

  const headerRef = useRef(null);
  const optionRefs = useRef({});

  // ── Option values (seeded from each option's default) ──────────────────────
  const [values, setValues] = useState(() => {
    const seed = {};
    (config?.options || []).forEach((o) => (seed[o.key] = o.default));
    // Persona sub-fields live alongside option values for a single source of truth.
    if (config?.input === "persona") {
      seed.personaName = "";
      seed.personaAge = "";
      seed.personaOccupation = "";
      seed.personaTone = "";
    }
    return seed;
  });

  // ── Primary input state (shape depends on config.input) ────────────────────
  const [textInput, setTextInput] = useState(""); // prompt / script / text
  const [imageInput, setImageInput] = useState(null); // { file?, url, preview }
  const [audioInput, setAudioInput] = useState(null); // File
  const [audioMeta, setAudioMeta] = useState(null); // { previewUrl, duration }
  const [audioMode, setAudioMode] = useState("upload"); // "upload" | "record" (Audio to Text)

  const [openPanel, setOpenPanel] = useState(null); // option key
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState("");

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null); // { assets?, text?, resultType? }
  const [copied, setCopied] = useState(false);
  const [assetMenu, setAssetMenu] = useState(null); // { asset, x, y } — result ⋯ menu

  const fileInputRef = useRef(null);
  // Holds the in-flight video status poll so it can be cancelled on unmount.
  const pollRef = useRef({ cancelled: false, timer: null });

  // Cancel any in-flight video status polling when the modal unmounts. A
  // category switch re-keys (remounts) the modal, so this also covers switching
  // tools mid-poll — no setState fires after unmount.
  useEffect(
    () => () => {
      pollRef.current.cancelled = true;
      if (pollRef.current.timer) clearTimeout(pollRef.current.timer);
    },
    [],
  );

  // Body scroll lock + Escape-to-close.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Revoke object URLs on unmount.
  useEffect(
    () => () => {
      if (imageInput?.objectUrl) URL.revokeObjectURL(imageInput.objectUrl);
      if (audioMeta?.previewUrl) URL.revokeObjectURL(audioMeta.previewUrl);
    },
    [imageInput, audioMeta],
  );

  const setValue = (key, val) => setValues((p) => ({ ...p, [key]: val }));

  const closeMenus = () => {
    setOpenPanel(null);
    setSwitcherOpen(false);
  };

  // The single "primary input" passed to generate/validate.
  const primaryInput = useMemo(() => {
    switch (config?.input) {
      case "prompt":
      case "script":
      case "text":
        return textInput;
      case "image":
        return imageInput?.url || null;
      case "audio":
        return audioInput;
      default:
        return null; // persona uses values.*
    }
  }, [config, textInput, imageInput, audioInput]);

  // ── Image picker (My Library / Search / Upload) ────────────────────────────
  const handlePickImages = async (images = []) => {
    setPickerOpen(false);
    const item = images[0];
    if (!item) return;
    if (item.file instanceof File) {
      const objectUrl = URL.createObjectURL(item.file);
      setImageInput({
        file: item.file,
        url: item.src || objectUrl,
        preview: objectUrl,
        objectUrl,
      });
    } else {
      const url = item.large || item.src;
      if (!url) return;
      setImageInput({ url, preview: url });
    }
  };

  // ── Audio upload ───────────────────────────────────────────────────────────
  const handleAudioFile = (file) => {
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      setError("File size must be under 100 MB.");
      return;
    }
    setError("");
    const previewUrl = URL.createObjectURL(file);
    setAudioInput(file);
    setAudioMeta({ previewUrl, duration: null });
    const probe = new Audio(previewUrl);
    probe.onloadedmetadata = () =>
      setAudioMeta((m) => ({ ...m, duration: probe.duration }));
  };

  // Mic capture for Audio-to-Text — a finished recording flows through the same
  // handler as an uploaded file, so preview, duration probe and transcription
  // are all identical to the upload path.
  const recorder = useMicRecorder(handleAudioFile);

  // ── Inspire (fills the text input, or persona fields) ──────────────────────
  const handleInspire = () => {
    const list = config?.inputConfig?.inspire;
    if (!list?.length) return;
    const pick = list[Math.floor(Math.random() * list.length)];
    if (config.input === "persona") {
      setValue("personaName", pick.name);
      setValue("personaOccupation", pick.occupation);
      setValue("personaTone", pick.tone);
    } else {
      setTextInput(pick);
    }
    setError("");
  };

  // Poll a pending video job until it completes. Resolves with the final status
  // payload; rejects on backend failure or after ~5 minutes. Cancels silently if
  // the modal unmounts mid-poll (see the cleanup effect above).
  const pollVideoJob = (jobId) =>
    new Promise((resolve, reject) => {
      pollRef.current = { cancelled: false, timer: null };
      let attempts = 0;
      const tick = async () => {
        if (pollRef.current.cancelled) return;
        attempts += 1;
        try {
          const data = await checkVideoGenerationStatus(jobId);
          if (pollRef.current.cancelled) return;
          const status = getVideoStatus(data);
          if (status === "completed") return resolve(data);
          if (status === "failed") {
            return reject(
              new Error("Video generation failed. Please try again."),
            );
          }
          if (attempts >= VIDEO_POLL_MAX_ATTEMPTS) {
            return reject(
              new Error(
                "Your video is taking longer than expected. Check your gallery shortly.",
              ),
            );
          }
          pollRef.current.timer = setTimeout(tick, VIDEO_POLL_INTERVAL_MS);
        } catch (err) {
          if (pollRef.current.cancelled) return;
          reject(err);
        }
      };
      pollRef.current.timer = setTimeout(tick, VIDEO_POLL_INTERVAL_MS);
    });

  // ── Generate ───────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    const err = config.validate?.({ input: primaryInput, values });
    if (err) {
      setError(err);
      toast.error(err);
      return;
    }
    setError("");
    setOpenPanel(null);
    setAssetMenu(null);
    voicePreview.stop(); // free the shared speech worker for the real run
    setGenerating(true);
    try {
      const res = await config.generate({
        input: primaryInput,
        values,
        activeBrand,
        tts,
        stt,
      });

      // Async video jobs come back as { pending, jobId } — keep the processing
      // state up and poll the status endpoint until the backend reports it's
      // completed, then render the finished video.
      if (res?.pending) {
        if (!res.jobId) {
          throw new Error("Video started but no job id was returned.");
        }
        toast("Your video is generating — this can take a minute…");
        const finalData = await pollVideoJob(res.jobId);
        const finalResult = normalizeVideoResult(finalData);
        releaseResultUrls(result);
        setResult(finalResult);
        if (finalResult.assets?.length) {
          toast.success("Your video is ready!");
        } else {
          toast("Video finished but no file came back.");
        }
      } else {
        releaseResultUrls(result); // free the previous on-device audio, if any
        setResult(res);
        if (res?.assets?.length || res?.text) {
          toast.success("Generated successfully!");
        } else {
          toast("Nothing came back — try adjusting your inputs.");
        }
      }
    } catch (e) {
      // generateMagicStudio already surfaces a friendly toast; keep an in-modal
      // banner for context and log for debugging. Clearing `generating` in the
      // finally block dismisses the processing state so the user can retry.
      console.error(`❌ [magic-studio:${categoryId}] generate failed:`, e);
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Generation failed. Please try again.";
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  // Free object URLs held by on-device results (no-op for backend http URLs —
  // the engine only releases blob: URLs it handed out itself).
  const releaseResultUrls = (res) => {
    res?.assets?.forEach((a) => {
      if (typeof a.src === "string" && a.src.startsWith("blob:"))
        tts.release(a.src);
    });
  };

  const resetResult = () => {
    releaseResultUrls(result);
    setResult(null);
    setAssetMenu(null);
    setError("");
  };

  const handleSwitch = (id) => {
    setSwitcherOpen(false);
    if (id === categoryId) return;
    voicePreview.stop();
    recorder.stop(); // don't leave the mic recording when leaving the tool
    onSwitch?.(id);
  };

  const copyTranscript = async () => {
    if (!result?.text) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy to clipboard.");
    }
  };

  const downloadAsset = async (asset) => {
    try {
      const url = asset.videoSrc || asset.src || asset.preview;
      // On-device results already hold their Blob — skip the re-fetch.
      let blob = asset.blob;
      if (!blob) {
        if (!url) return;
        const res = await fetch(url);
        blob = await res.blob();
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const ext =
        asset.format ||
        (asset.type === "video" ||
        asset.videoSrc ||
        (url || "").toLowerCase().endsWith(".mp4")
          ? "mp4"
          : asset.type === "audio"
            ? "mp3"
            : "png");
      a.download = `magic-${asset.id}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error("❌ download failed:", e);
      toast.error("Couldn't download that asset.");
    }
  };

  // ── Result ⋯ menu (shared with the Product Studio modals) ──────────────────
  // Open the menu at the clicked ⋯ (toggles closed if the same asset is reopened).
  const openAssetMenu = (asset, e) => {
    e.stopPropagation();
    setAssetMenu((p) =>
      p?.asset?.id === asset.id ? null : { asset, x: e.clientX, y: e.clientY },
    );
  };

  const copyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied!");
    } catch {
      toast.error("Couldn't copy to clipboard.");
    }
  };

  // Save an asset to the user's gallery. On-device results (e.g. Text-to-Audio)
  // carry their Blob directly, so we upload it with a type-correct name/MIME
  // (audio → .mp3/.wav, image → .png); hosted results are fetched then uploaded
  // (see saveUrlToGallery). All saves go through the shared /gallery endpoint
  // (uploadMedia). A loading toast gives immediate feedback, then resolves.
  const saveAssetToGallery = async (asset, type) => {
    const t = toast.loading("Saving to gallery…");
    try {
      if (asset.blob) {
        const ext =
          type === "audio"
            ? asset.format || (asset.blob.type?.includes("wav") ? "wav" : "mp3")
            : "png";
        const mime =
          asset.blob.type ||
          (type === "audio"
            ? ext === "wav"
              ? "audio/wav"
              : "audio/mpeg"
            : "image/png");
        await uploadMedia(
          new File([asset.blob], `magic-${type}-${asset.id}.${ext}`, {
            type: mime,
          }),
        );
      } else {
        const url = asset.src;
        if (!url) throw new Error("Nothing to save.");
        await saveUrlToGallery(url, uploadMedia, {
          filePrefix: `magic-${type}`,
        });
      }
      toast.success("Saved to gallery", { id: t });
    } catch (err) {
      console.error("❌ [magic-studio] save to gallery failed:", err);
      toast.error(err?.message || "Couldn't save to gallery", { id: t });
    }
  };

  // Hand an image result to the Product Studio Video Generator, preselected —
  // Magic Studio has no image-to-video category of its own.
  const generateVideoFromAsset = (asset) => {
    const url = asset.src;
    if (!url) {
      toast.error("This result can't be turned into a video.");
      return;
    }
    onClose?.();
    router.push(`/product-studio?tool=video&image=${encodeURIComponent(url)}`);
  };

  // Remove one asset from the current result (frees its on-device blob URL).
  const deleteAsset = (asset) => {
    if (typeof asset.src === "string" && asset.src.startsWith("blob:")) {
      tts.release(asset.src);
    }
    setResult((r) =>
      r
        ? { ...r, assets: (r.assets || []).filter((a) => a.id !== asset.id) }
        : r,
    );
  };

  // Per-type action set — each result type shows only the actions that apply.
  const buildAssetActions = (asset, type) => {
    const url = asset.videoSrc || asset.src || null;
    const isHttp = typeof url === "string" && /^https?:/i.test(url);
    if (type === "image") {
      return buildResultActions({
        onGenerateVideo: () => generateVideoFromAsset(asset),
        onDownload: () => downloadAsset(asset),
        onCopyLink: isHttp ? () => copyLink(url) : undefined,
        onSaveToGallery: () => saveAssetToGallery(asset, "image"),
        onDelete: () => deleteAsset(asset),
      });
    }
    if (type === "audio") {
      return buildResultActions({
        onDownload: () => downloadAsset(asset),
        onCopyLink: isHttp ? () => copyLink(url) : undefined,
        onSaveToGallery: () => saveAssetToGallery(asset, "audio"),
        onDelete: () => deleteAsset(asset),
      });
    }
    if (type === "video") {
      return buildResultActions({
        onDownload: () => downloadAsset(asset),
        onCopyLink: isHttp ? () => copyLink(url) : undefined,
        onDelete: () => deleteAsset(asset),
      });
    }
    // text (persona cards)
    return buildResultActions({
      onCopy: asset.content ? () => copyText(asset.content) : undefined,
      onDelete: () => deleteAsset(asset),
    });
  };

  if (!config) return null;

  const wordCount = textInput.trim() ? textInput.trim().split(/\s+/).length : 0;
  const readTime = Math.max(5, Math.round(wordCount / 2.5));
  const hasResult = !!(result?.assets?.length || result?.text);
  const resultType =
    result?.resultType ||
    (config.resultType === "auto" ? "image" : config.resultType);

  // Category list for the switcher.
  const categories = creative?.categories || [];

  return (
    <MotionConfig reducedMotion="user">
      {/* Backdrop does NOT close (no onClick) — only ✕ / Escape. Menus close on
          backdrop click so open panels dismiss without closing the modal. */}
      <div
        className="fixed inset-0 z-120 flex items-center justify-center bg-black/60 p-2 sm:p-4"
        onClick={closeMenus}
      >
        <div
          className="bg-surface rounded-2xl shadow-2xl flex flex-col lg:flex-row overflow-hidden w-full h-full"
          style={{ maxWidth: "1400px", maxHeight: "940px" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Left sidebar ── */}
          <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col shrink-0 max-h-[45vh] lg:max-h-none">
            <div className="flex-1 overflow-y-auto hide-scrollbar min-h-0">
              {/* Title → category switcher */}
              <div className="px-5 pt-5 pb-1">
                <button
                  ref={headerRef}
                  onClick={() => setSwitcherOpen((o) => !o)}
                  className="flex items-center gap-2 font-bold text-xl sm:text-2xl text-gray-900 hover:opacity-70 transition-opacity cursor-pointer"
                >
                  {config.title}
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${switcherOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <p className="text-xs text-gray-400 mt-1">
                  {config.subtitle || creative?.inner}
                </p>
              </div>

              {/* Error */}
              {/* {error && (
                <div className="mx-4 mt-3 flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <X className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
                </div>
              )} */}

              {/* ── Primary input ── */}
              <div className="px-4 pt-4">
                <PrimaryInput
                  config={config}
                  values={values}
                  setValue={setValue}
                  textInput={textInput}
                  setTextInput={(v) => {
                    setTextInput(v);
                    setError("");
                  }}
                  imageInput={imageInput}
                  clearImage={() => setImageInput(null)}
                  openPicker={() => setPickerOpen(true)}
                  audioInput={audioInput}
                  audioMeta={audioMeta}
                  onAudioFile={handleAudioFile}
                  clearAudio={() => {
                    recorder.stop();
                    setAudioInput(null);
                    setAudioMeta(null);
                  }}
                  audioMode={audioMode}
                  setAudioMode={setAudioMode}
                  recorder={recorder}
                  fileInputRef={fileInputRef}
                  onInspire={handleInspire}
                  wordCount={wordCount}
                  readTime={readTime}
                />
              </div>

              {/* ── Option rows ── */}
              <div className="px-4 pt-4 pb-3 space-y-2.5">
                {config.options?.map((option) => (
                  <button
                    key={option.key}
                    ref={(el) => (optionRefs.current[option.key] = el)}
                    onClick={() =>
                      setOpenPanel((p) =>
                        p === option.key ? null : option.key,
                      )
                    }
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200/70 text-sm transition-colors cursor-pointer"
                  >
                    <span className="text-gray-900 font-medium">
                      {option.label}
                    </span>
                    <span className="text-blue-600 font-semibold flex items-center gap-1.5">
                      {summarize(option, values[option.key])}
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pinned Generate */}
            <div className="px-4 pb-5 pt-3 border-t border-gray-200 bg-surface">
              <button
                onClick={handleGenerate}
                disabled={
                  generating || Boolean(voicePreview.loadingId) || recorder.recording
                }
                className="w-full py-3.5 rounded-2xl text-sm cursor-pointer font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60 bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> {config.generateLabel}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Right canvas ── */}
          <div className="flex-1 flex flex-col relative bg-[#f8f8f8] dark:bg-canvas min-w-0">
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-20 w-10 h-10 bg-surface rounded-full border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-300 hover:text-red-500 shadow-md cursor-pointer transition-all"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {generating ? (
                  <ProcessingState
                    key="processing"
                    config={config}
                    engineType={config.engine}
                    engine={config.onDevice ? onDeviceEngine : null}
                  />
                ) : hasResult ? (
                  <ResultCanvas
                    key="result"
                    resultType={resultType}
                    result={result}
                    onReset={resetResult}
                    onDownload={downloadAsset}
                    onCopy={copyTranscript}
                    copied={copied}
                    onOpenMenu={openAssetMenu}
                  />
                ) : (
                  <EmptyState key="empty" config={config} />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Click-away catcher — a click anywhere outside an open panel/dropdown
            dismisses it without closing the modal. Rendered only while something
            is open; sits above the modal content but below the panels (z-220),
            mirroring the Product Studio modals. The modal body's own
            stopPropagation otherwise swallows these clicks. */}
        {(openPanel || switcherOpen) && (
          <div className="fixed inset-0 z-210" onClick={closeMenus} />
        )}

        {/* ── Category switcher ── */}
        <AnimatePresence>
          {switcherOpen && (
            <DropdownBelow key="switcher" anchorRef={headerRef} width={300}>
              <p className="text-[11px] font-semibold text-gray-500 px-2 pt-1 pb-2">
                Switch tool
              </p>
              <div className="space-y-1">
                {categories.map((cat) => {
                  const cfg = MAGIC_STUDIO_CONFIGS[cat.id];
                  const Icon = cfg?.Icon;
                  const active = cat.id === categoryId;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleSwitch(cat.id)}
                      className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-colors ${active ? "bg-blue-50 ring-2 ring-blue-500" : "hover:bg-gray-100"}`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg?.color || "bg-gray-100 text-gray-500"}`}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                      </span>
                      <span
                        className={`text-sm font-semibold ${active ? "text-blue-700" : "text-gray-900"}`}
                      >
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </DropdownBelow>
          )}
        </AnimatePresence>

        {/* ── Option floating panels ── */}
        <AnimatePresence>
          {openPanel &&
            (() => {
              const option = config.options.find((o) => o.key === openPanel);
              if (!option) return null;
              return (
                <FloatingPanel
                  key={openPanel}
                  anchorRef={{ current: optionRefs.current[openPanel] }}
                  width={option.width || 340}
                >
                  <PanelBody
                    option={option}
                    value={values[option.key]}
                    voicePreview={voicePreview}
                    onSelect={(val) => {
                      setValue(option.key, val);
                      setOpenPanel(null);
                    }}
                  />
                </FloatingPanel>
              );
            })()}
        </AnimatePresence>

        {/* ── Image media picker (Image to Variations / Persona) ── */}
        <MediaPickerModal
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onCancel={() => setPickerOpen(false)}
          onApply={handlePickImages}
          activeBrand={activeBrand}
          maxSelectable={1}
        />

        {/* ── Result actions menu (shared with the Product Studio modals) ── */}
        {assetMenu && (
          <ResultActionsMenu
            x={assetMenu.x}
            y={assetMenu.y}
            onClose={() => setAssetMenu(null)}
            actions={buildAssetActions(assetMenu.asset, resultType)}
          />
        )}
      </div>
    </MotionConfig>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Left-sidebar primary input (varies by config.input)
// ─────────────────────────────────────────────────────────────────────────────
function PrimaryInput({
  config,
  values,
  setValue,
  textInput,
  setTextInput,
  imageInput,
  clearImage,
  openPicker,
  audioInput,
  audioMeta,
  onAudioFile,
  clearAudio,
  audioMode,
  setAudioMode,
  recorder,
  fileInputRef,
  onInspire,
  wordCount,
  readTime,
}) {
  const ic = config.inputConfig || {};

  // Text-like inputs (prompt / script / text).
  if (["prompt", "script", "text"].includes(config.input)) {
    return (
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
          {ic.label}
        </label>
        <div className="relative">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={ic.placeholder}
            rows={7}
            maxLength={ic.maxLength}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-2xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder:text-xs placeholder:text-gray-400"
          />
          {ic.inspire?.length > 0 && (
            <button
              onClick={onInspire}
              className="absolute bottom-3 left-3 text-xs font-semibold bg-surface border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 px-3 py-1 rounded-lg cursor-pointer transition-all"
            >
              ✨ Inspire me
            </button>
          )}
          {ic.maxLength && (
            <span className="absolute bottom-3 right-3 text-[10px] text-gray-400">
              {textInput.length}/{ic.maxLength}
            </span>
          )}
        </div>
        {ic.showReadTime && textInput.trim() && (
          <p className="text-[10px] font-medium text-blue-500 mt-1.5">
            {wordCount} words · ~{readTime}s read time
          </p>
        )}
      </div>
    );
  }

  // Image picker (Image to Variations).
  if (config.input === "image") {
    return (
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
          {ic.label}
        </label>
        {imageInput ? (
          <div className="relative rounded-2xl overflow-hidden border-2 border-blue-500">
            <img
              src={imageInput.preview}
              alt="source"
              className="w-full h-40 object-cover"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={openPicker}
              className="absolute bottom-2 left-2 text-[11px] font-semibold bg-surface/90 border border-gray-200 text-gray-700 hover:text-blue-600 px-2.5 py-1 rounded-lg transition-colors"
            >
              Change image
            </button>
          </div>
        ) : (
          <button
            onClick={openPicker}
            className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-8 flex flex-col items-center justify-center gap-2 text-sm text-gray-500 hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span className="text-blue-600 font-semibold">Select an image</span>
            {ic.helper && (
              <span className="text-[11px] text-gray-400">{ic.helper}</span>
            )}
          </button>
        )}
      </div>
    );
  }

  // Audio: upload a file OR record from the mic (Audio to Text).
  if (config.input === "audio") {
    const isRecording = recorder?.recording;
    return (
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
          {ic.label}
        </label>
        {audioInput ? (
          // ── Chosen clip (uploaded file or finished recording) ──
          <div className="border border-blue-200 bg-blue-50/40 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2.5 rounded-lg shrink-0">
                <FileAudio className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {audioInput.name}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {(audioInput.size / 1024 / 1024).toFixed(2)} MB
                  {audioMeta?.duration
                    ? ` · ${formatClock(audioMeta.duration)}`
                    : ""}
                </p>
              </div>
              <button
                onClick={clearAudio}
                className="shrink-0 p-1 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {audioMeta?.previewUrl && (
              <audio
                src={audioMeta.previewUrl}
                controls
                className="w-full mt-3 h-8"
              />
            )}
          </div>
        ) : (
          <>
            {/* Upload | Record toggle */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-3">
              {[
                { id: "upload", label: "Upload", Icon: Upload },
                { id: "record", label: "Record", Icon: Mic },
              ].map((tab) => {
                const active = audioMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => !isRecording && setAudioMode(tab.id)}
                    disabled={isRecording}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${active ? "bg-surface text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    <tab.Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {audioMode === "record" ? (
              // ── Record from the mic ──
              <div className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-8 flex flex-col items-center justify-center gap-3">
                {isRecording ? (
                  <>
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                      </span>
                      <span className="tabular-nums">
                        {formatClock(recorder.elapsed)}
                      </span>
                    </div>
                    <button
                      onClick={recorder.stop}
                      className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" />
                      Stop &amp; use
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={recorder.start}
                      aria-label="Start recording"
                      className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors cursor-pointer"
                    >
                      <Mic className="w-6 h-6" />
                    </button>
                    <span className="text-blue-600 font-semibold text-sm">
                      Tap to record
                    </span>
                    <span className="text-[11px] text-gray-400 text-center px-4">
                      Record straight from your microphone
                    </span>
                  </>
                )}
              </div>
            ) : (
              // ── Upload a file ──
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-8 flex flex-col items-center justify-center gap-2 text-sm text-gray-500 hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span className="text-blue-600 font-semibold">Upload audio</span>
                {ic.helper && (
                  <span className="text-[11px] text-gray-400 text-center px-4">
                    {ic.helper}
                  </span>
                )}
              </button>
            )}
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={ic.accept}
          className="hidden"
          onChange={(e) => onAudioFile(e.target.files?.[0])}
        />
      </div>
    );
  }

  // Persona fields (Persona Generator).
  if (config.input === "persona") {
    const inputCls =
      "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
    return (
      <div className="space-y-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
              Persona name
            </label>
            <input
              value={values.personaName}
              onChange={(e) => setValue("personaName", e.target.value)}
              placeholder="e.g. Jane Doe"
              className={inputCls}
            />
          </div>
          <button
            onClick={onInspire}
            className="shrink-0 text-xs font-semibold bg-surface border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
          >
            ✨ Inspire
          </button>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
            Age
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {ic.ageGroups.map((a) => (
              <button
                key={a.value}
                onClick={() => setValue("personaAge", a.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${values.personaAge === a.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"}`}
              >
                {a.label}
              </button>
            ))}
          </div>
          <input
            value={/^\d+$/.test(values.personaAge) ? values.personaAge : ""}
            onChange={(e) => setValue("personaAge", e.target.value)}
            placeholder="Or exact age (e.g. 32)"
            className={inputCls}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
            Occupation
          </label>
          <input
            value={values.personaOccupation}
            onChange={(e) => setValue("personaOccupation", e.target.value)}
            placeholder="e.g. Marketing Manager"
            className={`${inputCls} mb-2`}
          />
          <div className="flex flex-wrap gap-1.5">
            {ic.occupations.slice(0, 6).map((o) => (
              <button
                key={o}
                onClick={() => setValue("personaOccupation", o)}
                className={`px-2.5 py-1 rounded-md border text-[10px] font-semibold transition-all ${values.personaOccupation === o ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"}`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
            Communication tone
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ic.tones.map((t) => {
              const Icon = t.icon;
              const active = values.personaTone === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setValue("personaTone", t.value)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-semibold transition-all ${active ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"}`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                  {t.value}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Right-canvas states
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ config }) {
  const { sample } = config;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full flex flex-col items-center justify-center px-6"
    >
      <div className="flex items-center gap-3 mb-9">
        <div className="w-40 h-52 sm:w-44 sm:h-56 bg-gray-100 rounded-2xl overflow-hidden shadow-lg -rotate-3">
          <img
            src={sample.before}
            alt="before"
            className="w-full h-full object-cover"
          />
        </div>
        <svg
          width="72"
          height="60"
          viewBox="0 0 72 60"
          fill="none"
          className="text-blue-500 shrink-0 -mt-6"
        >
          <path
            d="M6 44 C 24 8, 50 8, 62 32"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M62 32 L51 28 M62 32 L55 42"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="w-40 h-52 sm:w-44 sm:h-56 bg-surface rounded-2xl shadow-lg overflow-hidden border border-gray-200 rotate-3">
          <img
            src={sample.after}
            alt="after"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      <h3 className="text-gray-900 text-center text-lg font-semibold max-w-sm leading-snug">
        {sample.headline}
      </h3>
      <p className="text-gray-500 text-center text-sm mt-2 max-w-xs leading-relaxed">
        {sample.subtext}
      </p>
    </motion.div>
  );
}

// Per-engine processing flows: each on-device engine reports these stages,
// shown as a growing checklist next to a REAL progress bar (vs the backend
// tools' indeterminate shimmer). Keyed by the config's `engine` tag.
const ENGINE_FLOWS = {
  tts: {
    ids: ["model", "voice", "speak", "finalize"],
    labels: (downloading) => [
      downloading
        ? "Downloading the voice engine (one-time)…"
        : "Loading the voice engine…",
      "Preparing the voice…",
      "Synthesizing speech…",
      "Polishing the audio…",
    ],
    title: "Generating your audio…",
  },
  stt: {
    ids: ["prepare", "model", "transcribe", "format"],
    labels: (downloading) => [
      "Reading the audio…",
      downloading
        ? "Downloading the transcription engine (one-time)…"
        : "Loading the transcription engine…",
      "Transcribing speech…",
      "Formatting the transcript…",
    ],
    title: "Transcribing your audio…",
  },
};

/**
 * @param {object} props
 * @param {object} props.config Active category config (title for the copy).
 * @param {string} [props.engineType] Which on-device flow to show ("tts" | "stt").
 * @param {object|null} [props.engine] On-device engine state (progress, stage,
 *   downloading) — when present, renders a REAL progress bar + stage checklist
 *   instead of the indeterminate shimmer.
 */
function ProcessingState({ config, engine, engineType }) {
  // ── On-device: real progress + stage checklist ──
  if (engine) {
    const flow = ENGINE_FLOWS[engineType] || ENGINE_FLOWS.tts;
    const stageIndex = Math.max(0, flow.ids.indexOf(engine.stage));
    const labels = flow.labels(engine.downloading);
    const pct = Math.max(0, Math.min(100, Math.round(engine.progress)));
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="h-full flex items-center justify-center"
      >
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-linear-to-br from-blue-50 to-indigo-50 dark:from-canvas dark:to-canvas shadow-inner p-8">
          <motion.div
            className="pointer-events-none absolute inset-y-0 w-1/3 bg-linear-to-r from-transparent via-white/40 to-transparent"
            animate={{ x: ["-120%", "320%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative flex items-center justify-center mb-6">
            <motion.span
              className="absolute h-20 w-20 rounded-full border-2 border-blue-400/40"
              animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur">
              <AudioLines className="h-6 w-6 text-blue-600 animate-pulse" />
            </span>
          </div>

          <div className="flex items-end justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {flow.title}
            </span>
            <span className="text-2xl font-bold text-blue-600 leading-none">
              {pct}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-blue-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-linear-to-r from-blue-600 to-indigo-500 transition-all duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="mt-5 space-y-2">
            {labels.slice(0, stageIndex + 1).map((label, i) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                {i < stageIndex ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />
                )}
                <span
                  className={
                    i < stageIndex
                      ? "text-gray-400"
                      : "text-gray-700 font-medium"
                  }
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-5 text-center text-[11px] text-gray-400">
            Runs on your device — private, free, and unlimited.
          </p>
        </div>
      </motion.div>
    );
  }

  // ── Backend categories: indeterminate shimmer ──
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="h-full flex items-center justify-center"
    >
      <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-3xl bg-linear-to-br from-blue-50 to-indigo-50 dark:from-canvas dark:to-canvas shadow-inner">
        <motion.div
          className="absolute inset-y-0 w-1/3 bg-linear-to-r from-transparent via-white/50 to-transparent"
          animate={{ x: ["-120%", "320%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="relative flex items-center justify-center">
            <motion.span
              className="absolute h-20 w-20 rounded-full border-2 border-blue-400/40"
              animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur">
              <Sparkles className="h-6 w-6 text-blue-600 animate-pulse" />
            </span>
          </div>
          <span className="text-sm font-medium text-gray-700">
            Working on your {config.title.toLowerCase()}…
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function ResultCanvas({
  resultType,
  result,
  onReset,
  onDownload,
  onCopy,
  copied,
  onOpenMenu,
}) {
  const assets = result?.assets || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">Results</h3>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> New generation
        </button>
      </div>

      {/* Transcript */}
      {resultType === "text" && result?.text && (
        <div className="rounded-2xl border border-gray-200 bg-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">
              Transcript
            </span>
            <button
              onClick={onCopy}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {result.text}
          </p>
          {result.meta && (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-gray-100 pt-3 text-[11px] text-gray-400">
              <span className="flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5" />
                {result.meta.languageLabel}
              </span>
              {result.meta.durationSec > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {formatClock(result.meta.durationSec)}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" />
                {result.meta.words} {result.meta.words === 1 ? "word" : "words"}
              </span>
              {result.meta.formatLabel && (
                <span className="ml-auto font-medium text-gray-300">
                  {result.meta.formatLabel}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Persona text assets */}
      {resultType === "text" && !result?.text && assets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {assets.map((a) => (
            <div
              key={a.id}
              className="relative group rounded-2xl border border-gray-200 bg-surface p-4"
            >
              <button
                onClick={(e) => onOpenMenu(a, e)}
                aria-label="Result actions"
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-surface/90 text-gray-700 hover:text-blue-600 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              <p className="text-sm text-gray-700 leading-relaxed pr-8">
                {a.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Images */}
      {resultType === "image" && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {assets.map((a) => (
            <div
              key={a.id}
              className="relative group rounded-2xl overflow-hidden bg-gray-100 aspect-square"
            >
              <img
                src={a.src}
                alt={a.alt}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <button
                onClick={(e) => onOpenMenu(a, e)}
                aria-label="Result actions"
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-surface/90 text-gray-700 hover:text-blue-600 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Videos */}
      {resultType === "video" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {assets.map((a) => (
            <div
              key={a.id}
              className="relative group rounded-2xl overflow-hidden bg-black"
            >
              <video
                src={a.videoSrc || a.src}
                poster={a.thumbnail}
                controls
                playsInline
                preload="metadata"
                className="w-full h-auto max-h-72 object-contain bg-black"
              />
              <button
                onClick={(e) => onOpenMenu(a, e)}
                aria-label="Result actions"
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-surface/90 text-gray-700 hover:text-blue-600 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Audio */}
      {resultType === "audio" && (
        <div className="space-y-3 max-w-xl">
          {assets.map((a, i) => (
            <AudioCard
              key={a.id}
              asset={a}
              index={i}
              onDownload={onDownload}
              onOpenMenu={onOpenMenu}
            />
          ))}
        </div>
      )}

      {/* Nothing rendered fallback */}
      {assets.length === 0 && !result?.text && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
          <ImageOff className="w-8 h-8" />
          <p className="text-sm">
            No results came back. Try adjusting your inputs.
          </p>
        </div>
      )}
    </motion.div>
  );
}
