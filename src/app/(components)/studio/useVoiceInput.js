"use client";

// app/(components)/studio/useVoiceInput.js
// ─────────────────────────────────────────────────────────────────────────────
// Voice → text for the prompt composer, with a two-engine strategy so dictation
// works in every browser we support:
//
//   1. LIVE  — the Web Speech API (SpeechRecognition / webkitSpeechRecognition).
//              Words stream into the input as they're spoken. Available in
//              Chrome, Edge and Safari.
//   2. LOCAL — record with MediaRecorder, then transcribe with the app's
//              existing on-device Whisper engine (useSpeechToText). Used on
//              Firefox, and whenever the live engine fails for a reason that
//              isn't the user refusing the mic. Nothing leaves the device.
//
// The fallback is automatic and mid-session: if the live engine dies on a
// network/service error we release it, tell the user once, and restart the same
// take on the local engine — the user just keeps talking.
//
// A denied microphone is NOT retried on the local engine: both paths need the
// same permission, so retrying would only produce a second identical denial.
//
// The MediaRecorder half deliberately mirrors magic-studio's `useMicRecorder`
// (see (components)/magic-studio/magicEngineHooks.js) — same lifecycle, same
// stream-release discipline — with a shorter cap and composer-specific copy.
//
// Transcribed text is composed against a baseline captured at start(), so
// dictation appends to whatever the user had already typed instead of wiping it.

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import useSpeechToText from "@/(lib)/ai-engine/hooks/useSpeechToText";

/** Safety cap for a single take. A prompt is short; this only catches a mic left open. */
const MAX_TAKE_SECONDS = 3 * 60;

/** mm:ss for a recording timer. */
export const formatElapsed = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * One-line description of where a dictation take currently is, so every Studio
 * composer reports the same thing in the same words.
 *
 * @param {{listening: boolean, transcribing: boolean, engine: string|null,
 *          elapsed: number, downloading: boolean, progress: number}} voice
 * @returns {{text: string, tone: "recording"|"working"} | null} null when idle.
 */
export function describeVoiceState(voice) {
  if (voice.listening) {
    return {
      tone: "recording",
      text:
        voice.engine === "live"
          ? `Listening · ${formatElapsed(voice.elapsed)}`
          : `Recording · ${formatElapsed(voice.elapsed)} — tap to finish`,
    };
  }
  if (voice.transcribing) {
    return {
      tone: "working",
      text: voice.downloading
        ? `Preparing the transcription engine… ${voice.progress}%`
        : "Transcribing your recording…",
    };
  }
  return null;
}

/** Resolve the Web Speech API constructor, or null when the browser lacks it. */
function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/** Join a baseline with dictated text without doubling or dropping the space. */
function composeText(baseline, spoken) {
  const base = baseline.trimEnd();
  const next = spoken.trimStart();
  if (!base) return next;
  if (!next) return base;
  return `${base} ${next}`;
}

/**
 * Dictation for a single text input.
 *
 * @param {object} opts
 * @param {(text: string) => void} opts.onText Called with the FULL value the
 *   input should now show (baseline + dictation), on every interim update.
 * @returns {{
 *   engine: "live"|"local"|null, listening: boolean, transcribing: boolean,
 *   elapsed: number, progress: number, downloading: boolean, interim: string,
 *   start: (baseline?: string) => void, stop: () => void,
 *   toggle: (baseline?: string) => void,
 * }}
 */
export default function useVoiceInput({ onText }) {
  const stt = useSpeechToText();
  // `transcribe` is useCallback([])-stable inside the engine hook, unlike the
  // object wrapping it — depend on the function so our callbacks stay stable.
  const { transcribe } = stt;

  const [engine, setEngine] = useState(null); // "live" | "local" | null
  const [listening, setListening] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [interim, setInterim] = useState("");

  // Latest onText without re-subscribing the recogniser on every render.
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  // What the input held when this take began — dictation is appended to it.
  const baselineRef = useRef("");
  // Everything the live engine has already finalised this take.
  const finalRef = useRef("");

  const recognitionRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  // Set when we intentionally abandon the live engine, so its own `onend`
  // doesn't clear the UI state that the local engine is about to take over.
  const handingOffRef = useRef(false);
  // Guards the one-time "switched engines" notice per take.
  const noticedFallbackRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  // ── Local engine: record, then transcribe on-device ───────────────────────
  const startLocal = useCallback(async () => {
    // Drop any timer the live engine left running when it handed off, so the
    // elapsed counter doesn't get double-incremented by two intervals.
    clearTimer();

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Voice input isn't supported in this browser.");
      setEngine(null);
      setListening(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        releaseStream();
        clearTimer();
        setListening(false);

        if (!blob.size) {
          console.warn("⚠️ [voice] recording produced no audio — nothing to transcribe");
          toast.error("We didn't catch any audio — please try again.");
          setEngine(null);
          return;
        }

        // Wrap as a File so the engine treats a recording exactly like an upload.
        const ext = mimeType.includes("mp4") || mimeType.includes("mpeg") ? "m4a" : "webm";
        const file = new File([blob], `prompt-${Date.now()}.${ext}`, { type: mimeType });

        console.log(`🎙️ [voice] transcribing ${(blob.size / 1024).toFixed(0)}KB on-device`);
        const result = await transcribe(file);
        setEngine(null);

        // useSpeechToText already toasts its own failure; just don't overwrite.
        if (!result?.text) return;
        onTextRef.current?.(composeText(baselineRef.current, result.text));
        setInterim("");
      };

      recorder.start();
      recorderRef.current = recorder;
      setElapsed(0);
      setListening(true);
      setEngine("local");

      timerRef.current = setInterval(() => {
        setElapsed((seconds) => {
          const next = seconds + 1;
          if (next >= MAX_TAKE_SECONDS) {
            // Defer so we never call stop() during the state updater.
            queueMicrotask(() => recorderRef.current?.stop());
          }
          return next;
        });
      }, 1000);

      console.log("🎙️ [voice] recording (on-device engine)");
    } catch (err) {
      console.error("❌ [voice] microphone access failed:", err);
      releaseStream();
      clearTimer();
      setListening(false);
      setEngine(null);
      toast.error(
        err?.name === "NotAllowedError"
          ? "Microphone access is blocked — allow it in your browser's address-bar icon, then try again."
          : "Couldn't access the microphone — check that one is connected and not in use.",
      );
    }
  }, [clearTimer, releaseStream, transcribe]);

  // ── Live engine: Web Speech API ───────────────────────────────────────────
  const startLive = useCallback(
    (SpeechRecognition) => {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang =
        (typeof navigator !== "undefined" && navigator.language) || "en-US";

      recognition.onresult = (event) => {
        let pending = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const transcript = result[0]?.transcript ?? "";
          if (result.isFinal) finalRef.current += transcript;
          else pending += transcript;
        }
        setInterim(pending);
        onTextRef.current?.(
          composeText(baselineRef.current, `${finalRef.current}${pending}`),
        );
      };

      recognition.onerror = (event) => {
        const code = event?.error;

        // The user (or browser policy) refused the mic. The local engine needs
        // the same permission, so falling back would just deny again.
        if (code === "not-allowed") {
          console.error("❌ [voice] live engine denied microphone access");
          toast.error(
            "Microphone access is blocked — allow it in your browser's address-bar icon, then try again.",
          );
          handingOffRef.current = false;
          return;
        }

        // Nothing was said — harmless, let it end quietly.
        if (code === "no-speech" || code === "aborted") {
          console.log(`🎙️ [voice] live engine ended (${code})`);
          return;
        }

        // Anything else (network, service-not-allowed, audio-capture) is an
        // engine problem, not a permission problem → hand off to on-device.
        console.warn(`↩️ [voice] live engine failed (${code}) — falling back on-device`);
        handingOffRef.current = true;
        try {
          recognition.stop();
        } catch {
          /* already stopped */
        }
        // The recorder only captures audio from this moment on, so anything the
        // live engine already finalised has to be folded into the baseline —
        // otherwise the on-device result would overwrite those words.
        baselineRef.current = composeText(baselineRef.current, finalRef.current);
        finalRef.current = "";
        setInterim("");
        if (!noticedFallbackRef.current) {
          noticedFallbackRef.current = true;
          toast.info("Switching to on-device transcription — keep talking, then tap the mic to finish.");
        }
        startLocal();
      };

      recognition.onend = () => {
        // A hand-off already moved ownership to the local engine.
        if (handingOffRef.current) {
          handingOffRef.current = false;
          return;
        }
        clearTimer();
        setListening(false);
        setEngine(null);
        setInterim("");
        recognitionRef.current = null;
        console.log("✅ [voice] live dictation finished");
      };

      recognition.start();
      recognitionRef.current = recognition;
      setElapsed(0);
      setListening(true);
      setEngine("live");

      timerRef.current = setInterval(() => {
        setElapsed((seconds) => {
          const next = seconds + 1;
          if (next >= MAX_TAKE_SECONDS) {
            queueMicrotask(() => recognitionRef.current?.stop());
          }
          return next;
        });
      }, 1000);

      console.log("🎙️ [voice] listening (live engine)");
    },
    [clearTimer, startLocal],
  );

  // ── Public controls ───────────────────────────────────────────────────────
  const start = useCallback(
    (baseline = "") => {
      if (listening || stt.transcribing) return;

      baselineRef.current = baseline;
      finalRef.current = "";
      noticedFallbackRef.current = false;
      handingOffRef.current = false;
      setInterim("");

      const SpeechRecognition = getSpeechRecognition();
      if (SpeechRecognition) {
        try {
          startLive(SpeechRecognition);
          return;
        } catch (err) {
          console.warn("↩️ [voice] couldn't start the live engine, using on-device:", err);
        }
      } else {
        console.log("🎙️ [voice] no Web Speech API in this browser — using on-device engine");
      }
      startLocal();
    },
    [listening, stt.transcribing, startLive, startLocal],
  );

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.stop(); // → onend
      } catch {
        /* already stopped */
      }
      return;
    }

    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop(); // → onstop → transcribe
      return;
    }

    clearTimer();
    setListening(false);
    setEngine(null);
  }, [clearTimer]);

  const toggle = useCallback(
    (baseline = "") => {
      if (listening) stop();
      else start(baseline);
    },
    [listening, start, stop],
  );

  // Release the mic and kill timers if the composer unmounts mid-take.
  useEffect(
    () => () => {
      try {
        recognitionRef.current?.abort?.();
      } catch {
        /* already gone */
      }
      try {
        const recorder = recorderRef.current;
        if (recorder && recorder.state !== "inactive") recorder.stop();
      } catch {
        /* already stopped */
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  return {
    engine,
    listening,
    transcribing: stt.transcribing,
    elapsed,
    progress: stt.progress,
    downloading: stt.downloading,
    interim,
    start,
    stop,
    toggle,
  };
}
