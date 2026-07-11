"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { synthesizeSpeech, disposeTtsWorker } from "../tasks/synthesizeSpeech";
import { KOKORO_TTS } from "../models";

/**
 * On-device Text to Speech engine — Kokoro-82M running in a Web Worker via
 * kokoro-js. Audio is generated locally (nothing is uploaded); the first-ever
 * run downloads the voice engine once (~93 MB) with a real progress bar, and
 * every run after that starts instantly from cache. The worker chunks long
 * text at sentence/clause boundaries, so 2000-char scripts never cut off, and
 * applies the chosen quality tier (normalization, de-click, fades) + format
 * (MP3 via lamejs, or lossless WAV).
 *
 * Unlike the image tools this returns audio, so it doesn't sit on
 * {@link useAiTool} — the caller keeps its own results list and calls:
 *
 *   const tts = useTextToSpeech();
 *   const item = await tts.generate(text, { voice, speed, format, quality });
 *   // item: { url, blob, duration, format } — pass `url` to an <audio> element
 *   tts.release(item.url);                   // when a result is discarded
 *
 * @returns {{
 *   generating: boolean, progress: number, stage: string, downloading: boolean,
 *   voices: {id: string, name: string, gender: string, accent: string, grade: string, label: string}[],
 *   generate: (text: string, opts?: {voice?: string, speed?: number, format?: string, quality?: string}) => Promise<{url: string, blob: Blob, duration: number, format: string}|null>,
 *   release: (url: string) => void,
 * }}
 */
export default function useTextToSpeech() {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("model");
  const [downloading, setDownloading] = useState(false);
  // Every object URL handed out, revoked on release/unmount (no leaks).
  const urlsRef = useRef(new Set());
  // Rising token so an unmount can't apply state from an in-flight run.
  const tokenRef = useRef(0);
  const toastedDownloadRef = useRef(false);

  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      tokenRef.current += 1;
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
      disposeTtsWorker();
    };
  }, []);

  const generate = useCallback(async (text, opts = {}) => {
    const token = (tokenRef.current += 1);
    const isCurrent = () => token === tokenRef.current;

    setGenerating(true);
    setProgress(0);
    setStage("model");
    setDownloading(false);

    try {
      const { blob, duration, format } = await synthesizeSpeech(text, {
        voice: opts.voice,
        speed: opts.speed,
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
                "Preparing the voice engine — one-time ~93 MB download, instant after this.",
              );
            }
          }
        },
      });
      if (!isCurrent()) return null;

      const url = URL.createObjectURL(blob);
      urlsRef.current.add(url);
      console.log(
        `✅ klux-tts: ${duration.toFixed(1)}s of ${format} speech generated on-device`,
      );
      return { url, blob, duration, format };
    } catch (err) {
      if (!isCurrent()) return null;
      console.error("❌ klux-tts: generation failed:", err);
      toast.error(err?.message || "Couldn't generate speech — please try again.");
      return null;
    } finally {
      if (isCurrent()) setGenerating(false);
    }
  }, []);

  const release = useCallback((url) => {
    if (!url || !urlsRef.current.has(url)) return;
    urlsRef.current.delete(url);
    URL.revokeObjectURL(url);
  }, []);

  return {
    generating,
    progress,
    stage,
    downloading,
    voices: KOKORO_TTS.voices,
    generate,
    release,
  };
}
