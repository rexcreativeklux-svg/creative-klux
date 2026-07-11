"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { synthesizeSpeech, disposeTtsWorker } from "../tasks/synthesizeSpeech";
import { KOKORO_TTS } from "../models";

/**
 * On-device Text to Speech engine — Kokoro-82M running in a Web Worker via
 * kokoro-js. Audio is generated locally (nothing is uploaded); the first-ever
 * run downloads the voice engine once (~93 MB) with a real progress bar, and
 * every run after that starts instantly from cache.
 *
 * Unlike the image tools this returns audio, so it doesn't sit on
 * {@link useAiTool} — the page keeps its own results list and calls:
 *
 *   const tts = useTextToSpeech();
 *   const item = await tts.generate(text, voiceId); // null on failure
 *   // item: { url, blob, duration } — pass `url` to an <audio> element
 *   await tts.saveToGallery(item.blob);             // → user's media library
 *   tts.release(item.url);                          // when a row is deleted
 *
 * @returns {{
 *   generating: boolean, progress: number, downloading: boolean,
 *   voices: {id: string, label: string}[],
 *   generate: (text: string, voice: string, speed?: number) => Promise<{url: string, blob: Blob, duration: number}|null>,
 *   saveToGallery: (blob: Blob) => Promise<boolean>,
 *   release: (url: string) => void,
 * }}
 */
export default function useTextToSpeech() {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
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

  const generate = useCallback(async (text, voice, speed = 1) => {
    const token = (tokenRef.current += 1);
    const isCurrent = () => token === tokenRef.current;

    setGenerating(true);
    setProgress(0);
    setDownloading(false);

    try {
      const { blob, duration } = await synthesizeSpeech(text, {
        voice,
        speed,
        onProgress: ({ pct, downloading: isDownloading }) => {
          if (!isCurrent()) return;
          if (typeof pct === "number") setProgress(pct);
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
      console.log(`✅ scraive-tts: ${duration.toFixed(1)}s of speech generated on-device`);
      return { url, blob, duration };
    } catch (err) {
      if (!isCurrent()) return null;
      console.error("❌ scraive-tts: generation failed:", err);
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
    downloading,
    voices: KOKORO_TTS.voices,
    generate,
    saveToGallery,
    release,
  };
}
