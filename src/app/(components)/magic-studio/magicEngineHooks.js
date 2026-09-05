"use client";

/**
 * magicEngineHooks.js
 * ─────────────────────────────────────────────────────────────────────────────
 * On-device engine GLUE for the Magic Studio tools.
 *
 * Two hooks — voice auditioning (Text to Audio) and microphone capture (Audio to
 * Text). Originally ported out of MagicStudioModal, which has since been
 * deleted; these are now the only copies, shared by the Magic Studio composer
 * and the Magic Studio tab inside the media picker, so there is nothing left to
 * keep them in sync with.
 *
 * The engines they drive (Kokoro TTS / Whisper STT via
 * `@/(lib)/ai-engine/hooks/*`) were always the shared ones — nothing about the
 * models themselves was ever duplicated here.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  MAX_GENERATED_PREVIEWS,
  PREVIEW_BY_GENERATING,
} from "@/(lib)/magic-studio-audio";
import {
  checkGenerationStatus,
  generateMagicStudio,
  resolveMediaUrl,
} from "@/(lib)/magic-studio-api";

// Short line each voice "introduces itself" with when auditioned in the picker.
//
// ⚠️ THE SAME WORDS EVERYWHERE — the committed clips (generate-voice-samples.mjs
// and generate-aura-samples.mjs both speak this), and the generated previews
// below. Comparing two voices is only a fair comparison if they are saying the
// same thing, and a sample that reads differently depending on how it was made
// is one you cannot judge a voice by.
const voicePreviewLine = (name) =>
  `Hi, I'm ${name}. This is how I sound. Let's make something great together.`;

/** How long to follow a preview generation before giving up on it. */
const PREVIEW_POLL_CEILING_MS = 90 * 1000;
const PREVIEW_POLL_EVERY_MS = 2500;

/** A playable URL out of a generate/status response, whichever field holds it. */
function previewUrl(data) {
  const root = data?.generation && typeof data.generation === "object"
    ? data.generation
    : data;
  const candidate =
    root?.url ||
    root?.audio_url ||
    root?.s3_key ||
    root?.meta?.outputs?.[0]?.url ||
    root?.meta?.outputs?.[0]?.key ||
    (Array.isArray(data?.urls) ? data.urls[0] : null);
  return resolveMediaUrl(typeof candidate === "string" ? candidate : null);
}

/** Terminal states, as the backend spells them. */
const PREVIEW_DONE = ["completed", "complete", "done", "success", "succeeded", "ready", "finished"];
const PREVIEW_FAILED = ["failed", "error", "errored", "cancelled", "canceled"];

/**
 * Have the backend speak one line in a hosted voice, and return the audio URL.
 *
 * ⚠️ THIS IS A REAL, BILLED GENERATION — the identical endpoint a user's own
 * "Generate" press goes through, so it costs the same and files the same kind of
 * history record. It exists because there is no other way to hear an Aura-2
 * voice, and it is reached ONLY when PREVIEW_BY_GENERATING is on, the voice has
 * no committed clip, and the session's cap has not been spent. All three gates
 * are in `toggle` below.
 *
 * The response may carry the audio outright or name a job to wait on — the same
 * two shapes every other tool handles (see startGeneration in the configs).
 */
async function generatePreview(voice) {
  const started = await generateMagicStudio({
    tool: "text_to_audio",
    prompt: voicePreviewLine(voice.label),
    voice: voice.value,
    speaking_speed: 1,
  });

  const immediate = previewUrl(started);
  if (immediate) return immediate;

  const record = started?.generation || started;
  const id = record?.id ?? started?.generation_id ?? started?.job_id;
  if (id == null) throw new Error("No audio and no job id came back.");

  const deadline = Date.now() + PREVIEW_POLL_CEILING_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, PREVIEW_POLL_EVERY_MS));
    const data = await checkGenerationStatus(id);
    const status = String(
      (data?.generation || data)?.status || "",
    ).toLowerCase();
    if (PREVIEW_FAILED.includes(status)) {
      throw new Error((data?.generation || data)?.error || "Preview failed.");
    }
    const url = previewUrl(data);
    if (url && (PREVIEW_DONE.includes(status) || !status)) return url;
  }
  throw new Error("The preview took too long.");
}

/**
 * Voice auditioning for the Text-to-Audio voice picker.
 *
 * Prefers the pre-generated static clip the CARD names (`item.sample`) so a tap
 * on ▶ plays instantly with no download; falls back to synthesizing the intro
 * line on-device with the SAME Kokoro engine used for real generations, but only
 * for the voices that declare `synth: true`. Resolved clips are cached in memory
 * (per session) and play through one shared <audio> element. Because there is a
 * single speech worker, synthesis previews are serialized (one at a time) and
 * the caller stops previews before a real generation — the worker is never asked
 * to do two things at once.
 *
 * ⚠️ THE CLIP PATH COMES FROM THE ITEM, NOT FROM A TEMPLATE HERE. It used to be
 * `/voice-samples/${id}.mp3` hard-coded, which silently assumed every voice was
 * one of Kokoro's 28. Hosted voices live under a different folder and cannot be
 * synthesized at all, so the card is what says where its sample is and whether
 * there is any engine that could stand in for a missing one.
 *
 * ⚠️ AND, AS A LAST RESORT, IT ASKS THE BACKEND TO SPEAK ONE — WHICH COSTS. That
 * is the only way to hear a hosted voice that has no clip on disk yet, and it
 * bills a generation and files a history record for a throwaway sample. It is
 * therefore gated three ways: the voice must declare `generate`, the
 * PREVIEW_BY_GENERATING switch must be on, and the session must not have spent
 * its MAX_GENERATED_PREVIEWS. Order matters here — a committed clip is checked
 * first every time, so a voice whose file has landed never reaches the paid path
 * again, and dropping those files in is what makes this switch removable.
 *
 * @param {ReturnType<import("@/(lib)/ai-engine/hooks/useTextToSpeech").default>} tts
 * @returns {{ loadingId: string|null, playingId: string|null,
 *   probe: (items: Array) => void, canPlay: (item: object) => boolean,
 *   toggle: (voice: {value: string, label: string}) => void, stop: () => void }}
 */
export function useVoicePreview(tts) {
  const audioRef = useRef(null);
  const cacheRef = useRef(new Map()); // voiceId → object URL of its sample clip
  const [loadingId, setLoadingId] = useState(null);
  const [playingId, setPlayingId] = useState(null);

  // Which sample URLs answered a HEAD, as `{ [url]: boolean }`.
  //
  // ⚠️ MIRRORED IN A REF because two different questions are being asked of it.
  // The ref is the DEDUPE ledger — it holds an in-flight marker the moment a
  // probe starts, so re-running the effect (or a second picker mounting) can't
  // fire the same forty requests again. The state is the RENDER copy, written
  // once per batch, because a ref changing doesn't redraw the buttons it gates.
  const probedRef = useRef(new Map());
  const [samples, setSamples] = useState({});

  // How many previews this session has PAID for — the cap in
  // MAX_GENERATED_PREVIEWS. A ref rather than state: nothing on screen is drawn
  // from it (see the ⚠️ in canPlay), and it must not be one render behind when
  // the next tap tests it.
  const generatedRef = useRef(0);

  /**
   * Ask, once, which of these voices actually have a clip on disk.
   *
   * ⚠️ HEAD, AND IN ONE BATCH. Forty tiny requests to our own static origin cost
   * roughly nothing and mean the folder itself is the source of truth: adding
   * `asteria.mp3` lights up Asteria's ▶ with no list to update alongside it and
   * no manifest to drift. Unknown URLs only — a second call is free.
   *
   * ⚠️ STABLE IDENTITY (useCallback with no deps) because the picker calls this
   * from an effect. A fresh function each render would re-run that effect on
   * every keystroke elsewhere in the panel.
   */
  const probe = useCallback(async (items) => {
    const urls = [
      ...new Set((items || []).map((it) => it?.sample).filter(Boolean)),
    ].filter((url) => !probedRef.current.has(url));
    if (urls.length === 0) return;

    // Claim them before awaiting anything — see the ⚠️ above.
    urls.forEach((url) => probedRef.current.set(url, null));

    const results = await Promise.all(
      urls.map(async (url) => {
        try {
          const res = await fetch(url, { method: "HEAD" });
          return [url, res.ok];
        } catch {
          return [url, false]; // offline / blocked — treat as absent
        }
      }),
    );

    results.forEach(([url, ok]) => probedRef.current.set(url, ok));
    setSamples((prev) => {
      const next = { ...prev };
      results.forEach(([url, ok]) => {
        next[url] = ok;
      });
      return next;
    });
  }, []);

  /**
   * Is there anything to hear for this voice yet?
   *
   * Three ways to answer yes, in the order they cost anything:
   *   • a committed clip that answered the probe          free, instant
   *   • an engine on this machine that can speak it       free, a few seconds
   *   • the backend, when we are willing to pay for that  BILLED, a few seconds
   *
   * The last one is the switch (PREVIEW_BY_GENERATING) rather than the card's
   * own `generate` flag, so turning the cost off hides exactly the buttons that
   * would have spent money and leaves every free one in place.
   *
   * ⚠️ THE CAP IS NOT CHECKED HERE, DELIBERATELY. A ▶ that vanishes from ten
   * cards mid-browse looks like a bug; pressing one after the cap is spent says
   * so in words instead. See `toggle`.
   */
  const canPlay = useCallback(
    (item) => {
      if (!item) return false;
      if (item.sample && samples[item.sample] === true) return true;
      if (item.synth) return true;
      return !!item.generate && PREVIEW_BY_GENERATING;
    },
    [samples],
  );

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

      // 1) The clip the card names — instant, no engine download. Its presence
      //    is usually already known from the panel's probe; a card opened and
      //    clicked faster than that resolves is checked here instead.
      const staticUrl = voice.sample;
      let hasStatic = false;
      if (staticUrl) {
        const known = probedRef.current.get(staticUrl);
        if (typeof known === "boolean") {
          hasStatic = known;
        } else {
          try {
            const res = await fetch(staticUrl, { method: "HEAD" });
            hasStatic = res.ok;
          } catch {
            hasStatic = false; // offline / blocked
          }
          probedRef.current.set(staticUrl, hasStatic);
          setSamples((prev) => ({ ...prev, [staticUrl]: hasStatic }));
        }
      }
      if (hasStatic) {
        cacheRef.current.set(id, staticUrl);
        audio.src = staticUrl;
        await audio.play();
        setPlayingId(id);
        return;
      }

      // 2) No clip on disk. A hosted voice has one route left, and it costs
      //    money — so it is gated three ways before anything is spent.
      if (!voice.synth) {
        if (!voice.generate || !PREVIEW_BY_GENERATING) {
          // The ▶ is already hidden in this case; this is the race where a clip
          // 404s between the probe and the click, not a path anyone is shown.
          toast("No sample for this voice yet.");
          return;
        }
        if (generatedRef.current >= MAX_GENERATED_PREVIEWS) {
          // ⚠️ SAID OUT LOUD, and it names the reason. A ▶ that silently does
          // nothing reads as broken, and "previews are limited" without the why
          // reads as arbitrary — this is real money, and the person tapping is
          // the one paying it.
          toast(
            `That's ${MAX_GENERATED_PREVIEWS} voice previews this session — each one is a generation. Reload to hear more.`,
          );
          return;
        }

        generatedRef.current += 1;
        console.log(
          `💸 [magic-studio] generating a preview of "${voice.label}" (${generatedRef.current}/${MAX_GENERATED_PREVIEWS} this session)`,
        );
        const url = await generatePreview(voice);
        cacheRef.current.set(id, url);
        audio.src = url;
        await audio.play();
        setPlayingId(id);
        return;
      }

      // 3) Synthesize on-device (the first one downloads the engine; the tts
      //    hook shows its own toast for that).
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

  return { loadingId, playingId, probe, canPlay, toggle, stop };
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
