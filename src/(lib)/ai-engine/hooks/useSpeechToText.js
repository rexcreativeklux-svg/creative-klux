"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { transcribeAudio, disposeSttWorker } from "../tasks/transcribeAudio";

/**
 * On-device Speech to Text engine — Whisper Base (multilingual) running in a Web
 * Worker via transformers.js. Audio is transcribed locally (nothing is
 * uploaded); the first-ever run downloads the engine once (~77 MB) with a real
 * progress bar, and every run after that starts instantly from cache. The audio
 * is decoded + resampled to 16 kHz mono on the main thread, then the worker runs
 * Whisper (WebGPU when available, WASM otherwise) and returns clean, formatted
 * text — Whisper punctuates and cases natively, so transcripts read cleanly.
 *
 * Like {@link useTextToSpeech} this returns data (a transcript), so it doesn't
 * sit on {@link useAiTool} — the caller uses:
 *
 *   const stt = useSpeechToText();
 *   const result = await stt.transcribe(file, { language, format, quality });
 *   // result: { text, words, durationSec, language } — or null on failure
 *
 * @returns {{
 *   transcribing: boolean, progress: number, stage: string, downloading: boolean,
 *   transcribe: (file: File|Blob, opts?: {language?: string, format?: string, quality?: string})
 *     => Promise<{text: string, words: number, durationSec: number, language: string}|null>,
 * }}
 */
export default function useSpeechToText() {
  const [transcribing, setTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("prepare");
  const [downloading, setDownloading] = useState(false);
  // Rising token so an unmount can't apply state from an in-flight run.
  const tokenRef = useRef(0);
  const toastedDownloadRef = useRef(false);

  useEffect(() => {
    return () => {
      tokenRef.current += 1;
      disposeSttWorker();
    };
  }, []);

  const transcribe = useCallback(async (fileOrBlob, opts = {}) => {
    const token = (tokenRef.current += 1);
    const isCurrent = () => token === tokenRef.current;

    setTranscribing(true);
    setProgress(0);
    setStage("prepare");
    setDownloading(false);

    try {
      const result = await transcribeAudio(fileOrBlob, {
        language: opts.language,
        format: opts.format,
        quality: opts.quality,
        onProgress: ({ pct, stage: currentStage, downloading: isDownloading }) => {
          if (!isCurrent()) return;
          if (typeof pct === "number") setProgress(pct);
          if (currentStage) setStage(currentStage);
          if (isDownloading) {
            setDownloading(true);
            if (!toastedDownloadRef.current) {
              toastedDownloadRef.current = true;
              toast.info(
                "Preparing the transcription engine — one-time ~77 MB download, instant after this.",
              );
            }
          }
        },
      });
      if (!isCurrent()) return null;

      console.log(
        `✅ klux-stt: ${result.words} words from ${result.durationSec.toFixed(1)}s of audio, on-device`,
      );
      return result;
    } catch (err) {
      if (!isCurrent()) return null;
      console.error("❌ klux-stt: transcription failed:", err);
      toast.error(err?.message || "Couldn't transcribe that audio — please try again.");
      return null;
    } finally {
      if (isCurrent()) setTranscribing(false);
    }
  }, []);

  return { transcribing, progress, stage, downloading, transcribe };
}
