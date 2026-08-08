"use client";

/**
 * magicPanelUI.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Presentational pieces for rendering a Magic Studio tool's `options` — the rich
 * choosers a config declares, in whatever layout the surface around them wants.
 *
 * Originally ported out of MagicStudioModal, which has since been deleted; this
 * is now THE implementation rather than a copy of one, and there is nothing left
 * to keep it in sync with. Two surfaces render these today: the Magic Studio tab
 * inside the media picker (inline, under an expandable row) and the Magic Studio
 * composer's toolbar chips (in a portalled drop-up panel).
 *
 *   • OptionPanelBody — the rich option chooser (cards / ratios / flags / voices
 *     / pills / list), rendered INLINE under an expandable option row instead of
 *     the modal's floating panel.
 *   • summarize       — human label for an option's current value.
 *   • ProcessingState — on-device real-progress panel (STT/TTS) shown while an
 *     on-device tool runs.
 *   • TRANSCRIPT_DOWNLOADS — the TXT / SRT / VTT export menu items.
 */

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Play,
  Pause,
  Loader2,
  AudioLines,
  Star,
  FileText,
  Captions,
} from "lucide-react";
import { languageDisplayLabel } from "@/app/(dashboard)/(pages)/magic-studio/magicStudioConfigs";

// ── Option chooser body (rich cards keyed by option.panel) ────────────────────
export function OptionPanelBody({ option, value, onSelect, voicePreview }) {
  const { panel, items } = option;

  // Image cards: thumbnail + label + description (Visual style).
  if (panel === "cards") {
    return (
      <div className="p-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {items.map((it) => {
          const active = value === it.value;
          const Icon = it.icon;
          return (
            <button
              key={it.value}
              onClick={() => onSelect(it.value)}
              className={`flex flex-col rounded-2xl border-2 overflow-hidden text-left transition-colors cursor-pointer ${active ? "border-blue-500 bg-blue-50/40" : "border-gray-200 hover:border-blue-300 bg-surface"}`}
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
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-colors cursor-pointer ${active ? "border-blue-500 bg-blue-50/40" : "border-gray-200 hover:border-blue-300"}`}
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
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-colors cursor-pointer ${active ? "border-blue-500 bg-blue-50/40" : "border-gray-200 hover:border-blue-300"}`}
            >
              <span className="text-lg leading-none">{it.flag}</span>
              <span
                className={`text-xs font-semibold flex-1 ${active ? "text-blue-700" : "text-gray-700"}`}
              >
                {it.label}
              </span>
              {active && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
            </button>
          );
        })}
      </div>
    );
  }

  // Voices: rows grouped by accent + gender (Text to Audio's on-device voices).
  if (panel === "voices") {
    const groups = [];
    for (const it of items) {
      const last = groups[groups.length - 1];
      if (last && last.name === it.group) last.items.push(it);
      else groups.push({ name: it.group, items: [it] });
    }
    return (
      <div className="p-2 pb-3">
        <p className="px-2 pt-1 pb-2 text-[11px] leading-snug text-gray-400">
          Tap <Play className="inline w-3 h-3 -mt-0.5" /> to hear a sample of each
          voice before you pick.
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
              className={`px-4 py-2 rounded-xl border-2 text-xs font-semibold transition-colors cursor-pointer ${active ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-700 hover:border-blue-300"}`}
            >
              {it.label}
            </button>
          );
        })}
      </div>
    );
  }

  // Default — icon + label + desc cards, three across (list: quality, duration…).
  return (
    <div className="p-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
      {items.map((it) => {
        const active = value === it.value;
        const Icon = it.icon;
        return (
          <button
            key={it.value}
            onClick={() => onSelect(it.value)}
            className={`flex flex-col gap-1.5 px-3 py-2.5 rounded-xl border-2 text-left transition-colors cursor-pointer ${active ? "border-blue-500 bg-blue-50/40" : "border-gray-200 hover:border-blue-300 bg-surface"}`}
          >
            <span className="flex items-center justify-between">
              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-blue-100" : "bg-gray-100"}`}
              >
                {Icon && (
                  <Icon
                    className={`w-4 h-4 ${active ? "text-blue-600" : "text-gray-500"}`}
                  />
                )}
              </span>
              {active && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
            </span>
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
          </button>
        );
      })}
    </div>
  );
}

// Human-readable summary of the current value for an option row.
export function summarize(option, value) {
  const found = option.items?.find((i) => i.value === value);
  return found?.label || value;
}

// Per-engine processing flows: each on-device engine reports these stages, shown
// as a growing checklist next to a REAL progress bar. Keyed by config `engine`.
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
    ids: ["prepare", "model", "detect", "transcribe", "format"],
    labels: (downloading, engine) => [
      "Reading the audio…",
      downloading
        ? "Downloading the transcription engine (one-time)…"
        : "Loading the transcription engine…",
      engine?.detectedLanguage
        ? `Detected: ${languageDisplayLabel(engine.detectedLanguage)}`
        : "Detecting the language…",
      "Transcribing speech…",
      "Formatting the transcript…",
    ],
    title: "Transcribing your audio…",
  },
};

// Transcript download formats — TXT mirrors the displayed text; SRT/VTT are
// subtitle files built from Whisper's timed segments (transcriptExports).
export const TRANSCRIPT_DOWNLOADS = [
  {
    kind: "txt",
    label: "Text (.txt)",
    desc: "The transcript as shown",
    Icon: FileText,
    needsSegments: false,
  },
  {
    kind: "srt",
    label: "Subtitles (.srt)",
    desc: "For video editors & players",
    Icon: Captions,
    needsSegments: true,
  },
  {
    kind: "vtt",
    label: "Web subtitles (.vtt)",
    desc: "For web video players",
    Icon: Captions,
    needsSegments: true,
  },
];

/**
 * On-device processing state — a REAL progress bar + stage checklist (and a live
 * transcript preview for STT). Rendered while an on-device tool is generating.
 *
 * @param {object} props
 * @param {object} props.config Active category config (title for the copy).
 * @param {string} [props.engineType] Which on-device flow ("tts" | "stt").
 * @param {object|null} [props.engine] On-device engine state (progress, stage,
 *   downloading — STT also streams detectedLanguage/partialText/autoDetecting).
 */
export function ProcessingState({ config, engine, engineType }) {
  // Pin the live transcript preview to its newest line as pieces stream in.
  const liveRef = useRef(null);
  useEffect(() => {
    const el = liveRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [engine?.partialText]);

  const flow = ENGINE_FLOWS[engineType] || ENGINE_FLOWS.tts;
  const labels = flow.labels(engine?.downloading, engine);
  // Zip ids+labels, then drop the detect row when the user forced a language.
  const rows = flow.ids
    .map((id, i) => ({ id, label: labels[i] }))
    .filter((row) => row.id !== "detect" || engine?.autoDetecting);
  const stageIndex = Math.max(
    0,
    rows.findIndex((row) => row.id === engine?.stage),
  );
  const pct = Math.max(0, Math.min(100, Math.round(engine?.progress || 0)));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center justify-center py-4"
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
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur">
            <AudioLines className="h-6 w-6 text-blue-600 animate-pulse" />
          </span>
        </div>

        <div className="flex items-end justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{flow.title}</span>
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
          {rows.slice(0, stageIndex + 1).map((row, i) => (
            <div key={row.id} className="flex items-center gap-2 text-xs">
              {i < stageIndex ? (
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin shrink-0" />
              )}
              <span
                className={
                  i < stageIndex ? "text-gray-400" : "text-gray-700 font-medium"
                }
              >
                {row.label}
              </span>
            </div>
          ))}
        </div>

        {engine?.partialText ? (
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500">
                Live transcript
              </span>
              <span className="text-[10px] text-gray-400">
                preview — refines when finished
              </span>
            </div>
            <div
              ref={liveRef}
              className="max-h-28 overflow-y-auto rounded-xl border border-gray-100 bg-white/70 p-3 text-xs leading-relaxed text-gray-600 whitespace-pre-wrap"
            >
              {engine.partialText}
            </div>
          </div>
        ) : null}

        <p className="mt-5 text-center text-[11px] text-gray-400">
          Runs on your device — private, free, and unlimited.
        </p>
      </div>
    </motion.div>
  );
}
