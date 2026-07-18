"use client";

/**
 * magicEngineHooks.js
 * ─────────────────────────────────────────────────────────────────────────────
 * On-device engine GLUE for the Magic Studio tabs embedded in the media picker.
 *
 * These two hooks — voice auditioning (Text to Audio) and microphone capture
 * (Audio to Text) — are ported from the standalone `MagicStudioModal`, where
 * they live as file-private helpers. We chose to *reuse the config machine*
 * rather than extract a shared core from that modal, so the standalone stays
 * untouched and the picker carries its own copies of this small glue. The
 * underlying engines they drive (Kokoro TTS / Whisper STT via
 * `@/(lib)/ai-engine/hooks/*`) are the exact same shared engines — nothing is
 * duplicated there.
 *
 * If these ever need to change, keep them in sync with the originals in
 * src/app/(dashboard)/(pages)/magic-studio/MagicStudioModal.jsx.
 */

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// Short line each voice "introduces itself" with when auditioned in the picker.
const voicePreviewLine = (name) =>
  `Hi, I'm ${name}. This is how I sound. Let's make something great together.`;

/**
 * Voice auditioning for the Text-to-Audio voice picker.
 *
 * Prefers a pre-generated static clip at /voice-samples/{id}.mp3 so a tap on ▶
 * plays instantly with no download; falls back to synthesizing the intro line
 * on-device with the SAME Kokoro engine used for real generations. Resolved
 * clips are cached in memory (per session) and play through one shared <audio>
 * element. Because there is a single speech worker, synthesis previews are
 * serialized (one at a time) and the caller stops previews before a real
 * generation — the worker is never asked to do two things at once.
 *
 * @param {ReturnType<import("@/(lib)/ai-engine/hooks/useTextToSpeech").default>} tts
 * @returns {{ loadingId: string|null, playingId: string|null,
 *   toggle: (voice: {value: string, label: string}) => void, stop: () => void }}
 */
export function useVoicePreview(tts) {
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
          console.error("❌ [magic-studio] voice preview playback failed:", err),
        );
      return;
    }

    try {
      setLoadingId(id);

      // 1) Pre-generated static sample — instant, no engine download. Probe it
      //    first; if it isn't there, synthesize.
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

      // 2) Fallback: synthesize on-device (the first one downloads the engine;
      //    the tts hook shows its own toast for that).
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

  // Stop playback if the panel unmounts (the tts hook revokes the URLs itself).
  useEffect(() => () => audioRef.current?.pause(), []);

  return { loadingId, playingId, toggle, stop };
}

// Auto-stop cap for mic recordings — matches the STT engine's duration cap so a
// forgotten recording can't grow past what the transcriber will accept.
const MAX_RECORD_SECONDS = 30 * 60;

/**
 * Microphone capture for the Audio-to-Text tool. Records with MediaRecorder,
 * then hands the finished clip (wrapped as a File) to `onComplete`, which feeds
 * it into the EXACT same on-device transcription path as an uploaded file.
 * Tracks elapsed time, auto-stops at the cap, and always releases the mic.
 *
 * @param {(file: File) => void} onComplete Receives the recorded audio.
 * @returns {{ recording: boolean, elapsed: number, start: () => void, stop: () => void }}
 */
export function useMicRecorder(onComplete) {
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
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
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
          const ext =
            type.includes("mp4") || type.includes("mpeg") ? "m4a" : "webm";
          const file = new File([blob], `recording-${Date.now()}.${ext}`, {
            type,
          });
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
      toast.error(
        "Couldn't access the microphone — check your browser permissions.",
      );
    }
  };

  // Stop + release the mic on unmount (covers closing the picker mid-record).
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
