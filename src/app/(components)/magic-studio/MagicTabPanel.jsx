"use client";

/**
 * MagicTabPanel.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * A single Magic Studio tool, rendered inside the "Add Media" picker's Magic
 * Studio tab. Config-driven: one component serves all seven tools — the media
 * picker mounts it keyed by the active sub-tab's config id (see subtabs.js).
 *
 * It REUSES the standalone Magic Studio "machine" — the same per-tool configs
 * (magicStudioConfigs), generate + video-poll APIs (magic-studio-api), backend
 * history (useMagicHistory / MagicHistoryGrid) and on-device engines
 * (useTextToSpeech / useSpeechToText) that power the /magic-studio page. Only the
 * presentation differs: a single, narrow column tuned for the picker.
 *
 * Layout (top → bottom):
 *   1. Collapsible History (backend tools only; collapsed by default, auto-opens
 *      while/after a generation so the new result is visible). Selecting a media
 *      result there Applies it back into the parent form via onSelectMedia.
 *   2. The input form + inline option rows + Generate button.
 *   3. On-device processing state / session result (Audio-to-Text transcript,
 *      Text-to-Audio audio) — these two tools persist no server history.
 *
 * Image / audio inputs use a DIRECT device file input (no second modal on top of
 * the already-open picker). Image-to-Variations needs a hosted `source_image`,
 * so a device image is uploaded to the gallery first to obtain a URL; Audio-to-
 * Text runs fully on-device on the File itself (nothing is uploaded).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Loader2,
  ChevronDown,
  History as HistoryIcon,
  Upload,
  FileAudio,
  Mic,
  Square,
  X,
  Download,
  Copy,
  Check,
  RotateCcw,
  Languages,
  Clock,
  Type,
  ImageOff,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { getMagicConfig } from "@/app/(dashboard)/(pages)/magic-studio/magicStudioConfigs";
import useMagicHistory from "@/app/(dashboard)/(pages)/magic-studio/useMagicHistory";
import MagicHistoryGrid from "@/app/(dashboard)/(pages)/magic-studio/MagicHistoryGrid";
import useTextToSpeech from "@/(lib)/ai-engine/hooks/useTextToSpeech";
import useSpeechToText from "@/(lib)/ai-engine/hooks/useSpeechToText";
import {
  buildSrt,
  buildVtt,
  transcriptFileName,
} from "@/(lib)/ai-engine/tasks/transcriptExports";
import { pickHostedUrl } from "@/(lib)/magic-studio-api";
import AudioCard, { formatClock } from "@/app/(components)/gallery/AudioCard";

import { useVoicePreview, useMicRecorder } from "./magicEngineHooks";
import {
  OptionPanelBody,
  summarize,
  ProcessingState,
  TRANSCRIPT_DOWNLOADS,
} from "./magicPanelUI";
import useMagicGenerate from "./useMagicGenerate";

// `pickHostedUrl` used to be duplicated here. It missed the gallery endpoint's
// `file` envelope — so an upload that had genuinely succeeded came back as
// "Upload succeeded but no URL came back". It now lives in magic-studio-api
// beside resolveMediaUrl, so this surface and the Magic Studio composer can't
// drift apart on it again.

/**
 * @param {object} props
 * @param {string} props.categoryId    Config id (e.g. "text_to_image").
 * @param {string[]} [props.selectedMedia] URLs currently selected in the picker
 *   (across both the image and media buckets) — drives the selected ring.
 * @param {(src: string, type: string) => void} props.onSelectMedia Toggle a result
 *   URL in the picker. The picker routes it by `type` into the correct bucket so
 *   images are Applied as images (cropped) and video/audio as media.
 * @param {string[]} [props.allowedTypes] Media types the requesting form accepts
 *   (["image"], ["image","video"], …). A generated result can only be SELECTED /
 *   Applied when its type is in this list — an image-only form can't select
 *   generated audio/video, though those still play/download here.
 * @param {object} [props.activeBrand] Active brand (forwarded to generate).
 */
export default function MagicTabPanel({
  categoryId,
  selectedMedia = [],
  onSelectMedia,
  allowedTypes = ["image"],
  activeBrand: activeBrandProp,
}) {
  const { activeBrand: activeBrandCtx, uploadMedia, token } = useAuth();
  const activeBrand = activeBrandProp || activeBrandCtx;
  const config = getMagicConfig(categoryId);

  // ── On-device engines (idle until their tool runs; same shared engines the
  //    standalone modal uses). ──
  const tts = useTextToSpeech();
  const voicePreview = useVoicePreview(tts);
  const stt = useSpeechToText();
  const onDeviceEngine =
    config?.engine === "stt" ? stt : config?.engine === "tts" ? tts : null;

  // ── History (backend tools + logged in). On-device tools persist nothing, so
  //    they never show a History section (decision: hidden for those two). ──
  const isLoggedIn = !!token;
  const usesHistory = isLoggedIn && !config?.onDevice;
  const history = useMagicHistory(usesHistory ? config?.historyTool : null, {
    enabled: usesHistory,
  });

  // ── Option values (seeded from each option's default + persona sub-fields) ──
  const [values, setValues] = useState(() => {
    const seed = {};
    (config?.options || []).forEach((o) => (seed[o.key] = o.default));
    if (config?.input === "persona") {
      seed.personaName = "";
      seed.personaAge = "";
      seed.personaOccupation = "";
      seed.personaTone = "";
    }
    return seed;
  });
  const setValue = (key, val) => setValues((p) => ({ ...p, [key]: val }));

  // ── Primary input state (shape depends on config.input) ──
  const [textInput, setTextInput] = useState("");
  const [imageInput, setImageInput] = useState(null); // { url, preview, objectUrl }
  const [uploadingImage, setUploadingImage] = useState(false);
  const [audioInput, setAudioInput] = useState(null); // File
  const [audioMeta, setAudioMeta] = useState(null); // { previewUrl, duration }
  const [audioMode, setAudioMode] = useState("upload"); // "upload" | "record"

  // Which option row is expanded — a single key so opening one closes the rest
  // (only one open at a time).
  const [openOption, setOpenOption] = useState(null);
  const toggleOption = (key) =>
    setOpenOption((prev) => (prev === key ? null : key));
  const closeOption = () => setOpenOption(null);
  const [historyOpen, setHistoryOpen] = useState(false); // collapsed by default
  const [result, setResult] = useState(null); // on-device session result
  const [copied, setCopied] = useState(false);
  // On-device audio result → hosted URL once saved for selection (id → url).
  const savedAudioRef = useRef(new Map());

  const imageFileRef = useRef(null);
  const audioFileRef = useRef(null);

  // Revoke object URLs on unmount (also fires on sub-tab switch — the panel is
  // remounted per category by the picker).
  useEffect(
    () => () => {
      if (imageInput?.objectUrl) URL.revokeObjectURL(imageInput.objectUrl);
      if (audioMeta?.previewUrl) URL.revokeObjectURL(audioMeta.previewUrl);
    },
    [imageInput, audioMeta],
  );

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

  // Free the previous on-device result's blob URLs before replacing it.
  const releaseResultUrls = (res) => {
    res?.assets?.forEach((a) => {
      if (typeof a.src === "string" && a.src.startsWith("blob:")) tts.release(a.src);
    });
  };
  const handleResult = (res) => {
    releaseResultUrls(result);
    setResult(res);
  };

  const { generating, error, generate } = useMagicGenerate({
    config,
    usesHistory,
    history,
    tts,
    stt,
    onResult: handleResult,
    beforeGenerate: () => voicePreview.stop(),
  });

  // ── Input handlers ──────────────────────────────────────────────────────────
  // Image (Image to Variations): device pick. The backend needs a hosted
  // `source_image`, so upload the file to the gallery to obtain a URL, then keep
  // a local object URL for instant preview.
  const handleImageFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUploadingImage(true);
    const t = toast.loading("Uploading image…");
    try {
      const data = await uploadMedia(file);
      const hosted = pickHostedUrl(data);
      if (!hosted) throw new Error("Upload succeeded but no URL came back.");
      setImageInput({ url: hosted, preview: objectUrl, objectUrl });
      toast.success("Image ready", { id: t });
    } catch (err) {
      URL.revokeObjectURL(objectUrl);
      console.error("❌ [magic-studio] image upload failed:", err);
      toast.error(err?.message || "Couldn't upload that image.", { id: t });
    } finally {
      setUploadingImage(false);
    }
  };
  const clearImage = () => {
    if (imageInput?.objectUrl) URL.revokeObjectURL(imageInput.objectUrl);
    setImageInput(null);
  };

  // Audio (Audio to Text): device pick or mic. Runs on-device — nothing uploaded.
  const handleAudioFile = (file) => {
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File size must be under 100 MB.");
      return;
    }
    if (audioMeta?.previewUrl) URL.revokeObjectURL(audioMeta.previewUrl);
    const previewUrl = URL.createObjectURL(file);
    setAudioInput(file);
    setAudioMeta({ previewUrl, duration: null });
    const probe = new Audio(previewUrl);
    probe.onloadedmetadata = () =>
      setAudioMeta((m) => ({ ...m, duration: probe.duration }));
  };
  const recorder = useMicRecorder(handleAudioFile);
  const clearAudio = () => {
    recorder.stop();
    if (audioMeta?.previewUrl) URL.revokeObjectURL(audioMeta.previewUrl);
    setAudioInput(null);
    setAudioMeta(null);
  };

  const handleInspire = () => {
    const list = config?.inputConfig?.inspire;
    if (config.input === "persona") {
      const personas = config?.inputConfig?.inspire;
      if (!personas?.length) return;
      const pick = personas[Math.floor(Math.random() * personas.length)];
      setValue("personaName", pick.name);
      setValue("personaOccupation", pick.occupation);
      setValue("personaTone", pick.tone);
      return;
    }
    if (!list?.length) return;
    setTextInput(list[Math.floor(Math.random() * list.length)]);
  };

  const handleGenerate = () => {
    if (usesHistory) setHistoryOpen(true); // reveal the result as it lands
    generate({ primaryInput, values, activeBrand });
  };

  const resetResult = () => {
    releaseResultUrls(result);
    setResult(null);
  };

  // ── Selection into the picker ────────────────────────────────────────────────
  // Pass the item TYPE so the picker routes it into the right bucket — image
  // results are Applied as images (cropped), video/audio as media.
  const toggleHistorySelect = (item) => {
    if (item?.url) onSelectMedia?.(item.url, item.type);
  };

  // On-device audio (Text to Audio) → save to gallery once to get a hosted URL,
  // then toggle it in the picker's selection (all media is applyable).
  const [savingAudioId, setSavingAudioId] = useState(null);
  const handleUseAudio = async (asset) => {
    const cached = savedAudioRef.current.get(asset.id);
    if (cached) {
      onSelectMedia?.(cached, "audio");
      return;
    }
    const blob =
      asset.blob ||
      (asset.src ? await fetch(asset.src).then((r) => r.blob()) : null);
    if (!blob) {
      toast.error("This audio can't be added.");
      return;
    }
    setSavingAudioId(asset.id);
    const t = toast.loading("Adding audio to your selection…");
    try {
      const ext = asset.format || (blob.type?.includes("wav") ? "wav" : "mp3");
      const mime =
        blob.type || (ext === "wav" ? "audio/wav" : "audio/mpeg");
      const file = new File([blob], `magic-audio-${asset.id}.${ext}`, {
        type: mime,
      });
      const data = await uploadMedia(file);
      const hosted = pickHostedUrl(data);
      if (!hosted) throw new Error("Saved but no URL came back.");
      savedAudioRef.current.set(asset.id, hosted);
      onSelectMedia?.(hosted, "audio");
      toast.success("Added to selection", { id: t });
    } catch (err) {
      console.error("❌ [magic-studio] add audio failed:", err);
      toast.error(err?.message || "Couldn't add that audio.", { id: t });
    } finally {
      setSavingAudioId(null);
    }
  };

  // ── Transcript actions (Audio to Text session result) ──
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
  const downloadTranscript = (kind) => {
    if (!result?.text) return;
    try {
      let content = result.text;
      let mime = "text/plain";
      if (kind === "srt") {
        content = buildSrt(result.meta?.segments || [], {
          durationSec: result.meta?.durationSec,
        });
        mime = "application/x-subrip";
      } else if (kind === "vtt") {
        content = buildVtt(result.meta?.segments || [], {
          durationSec: result.meta?.durationSec,
        });
        mime = "text/vtt";
      }
      if (!content) {
        toast.error("No timed segments came back — download the TXT instead.");
        return;
      }
      const blob = new Blob([content], { type: `${mime};charset=utf-8` });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = transcriptFileName(result.meta?.sourceName, kind);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error("❌ transcript download failed:", e);
      toast.error("Couldn't download the transcript.");
    }
  };
  const downloadAudioAsset = async (asset) => {
    try {
      const blob =
        asset.blob ||
        (asset.src ? await fetch(asset.src).then((r) => r.blob()) : null);
      if (!blob) return;
      const ext = asset.format || (blob.type?.includes("wav") ? "wav" : "mp3");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `magic-${asset.id}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error("❌ audio download failed:", e);
      toast.error("Couldn't download that audio.");
    }
  };

  if (!config) {
    return <p className="text-sm text-gray-400 p-4">Unknown tool.</p>;
  }

  const ic = config.inputConfig || {};
  const wordCount = textInput.trim() ? textInput.trim().split(/\s+/).length : 0;
  const readTime = Math.max(5, Math.round(wordCount / 2.5));
  const resultType = config.resultType === "auto" ? "image" : config.resultType;
  const generateDisabled =
    generating ||
    uploadingImage ||
    Boolean(voicePreview.loadingId) ||
    recorder.recording;

  return (
    <div className="flex flex-col gap-4 mx-auto">
      {/* ── 1. Collapsible History (backend tools) ── */}
      {usesHistory && (
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setHistoryOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <HistoryIcon className="w-4 h-4 text-gray-500" />
              History
              {history.items.length > 0 && (
                <span className="text-xs font-medium text-gray-400">
                  ({history.items.length})
                </span>
              )}
              {generating && (
                <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
              )}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${historyOpen ? "rotate-180" : ""}`}
            />
          </button>
          {historyOpen && (
            <div className="border-t border-gray-100 p-4 max-h-[46vh] overflow-y-auto">
              {!generating && !history.loading && history.items.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-6">
                  Nothing generated yet — your results will appear here.
                </p>
              ) : (
                <MagicHistoryGrid
                  items={history.items}
                  loading={history.loading}
                  generating={generating}
                  generatingLabel={`Generating your ${config.title.toLowerCase()}…`}
                  resultType={resultType}
                  onDelete={history.remove}
                  removingId={history.removingId}
                  uploadMedia={uploadMedia}
                  filePrefix={`magic-${categoryId}`}
                  selectableTypes={allowedTypes}
                  selectedUrls={selectedMedia}
                  onToggleSelect={toggleHistorySelect}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 2. Input form ── */}
      <div className="rounded-2xl border border-gray-200 p-4 space-y-4">
        {/* Primary input */}
        {["prompt", "script", "text"].includes(config.input) && (
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
              {ic.label}
            </label>
            <div className="relative">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={ic.placeholder}
                rows={5}
                maxLength={ic.maxLength}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-2xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder:text-xs placeholder:text-gray-400"
              />
              {ic.inspire?.length > 0 && (
                <button
                  onClick={handleInspire}
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
        )}

        {/* Image input — device pick only */}
        {config.input === "image" && (
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
              {ic.label}
            </label>
            <input
              ref={imageFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) handleImageFile(file);
              }}
            />
            {imageInput ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-blue-500">
                <img
                  src={imageInput.preview}
                  alt="source"
                  className="w-full h-44 object-cover"
                />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={() => imageFileRef.current?.click()}
                  className="absolute bottom-2 left-2 text-[11px] font-semibold bg-surface/90 border border-gray-200 text-gray-700 hover:text-blue-600 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Change image
                </button>
              </div>
            ) : (
              <button
                onClick={() => imageFileRef.current?.click()}
                disabled={uploadingImage}
                className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-8 flex flex-col items-center justify-center gap-2 text-sm text-gray-500 hover:border-blue-400 hover:bg-blue-50/40 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploadingImage ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
                <span className="text-blue-600 font-semibold">
                  {uploadingImage ? "Uploading…" : "Upload an image"}
                </span>
                <span className="text-[11px] text-gray-400 text-center px-4">
                  Choose an image from your device.
                </span>
              </button>
            )}
          </div>
        )}

        {/* Audio input — device pick or mic (on-device) */}
        {config.input === "audio" && (
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
              {ic.label}
            </label>
            <input
              ref={audioFileRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) handleAudioFile(file);
              }}
            />
            {audioInput ? (
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
                    className="shrink-0 p-1 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-gray-400 cursor-pointer"
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
                <div className="flex p-1 bg-gray-100 rounded-xl mb-3">
                  {[
                    { id: "upload", label: "Upload", Icon: Upload },
                    { id: "record", label: "Record", Icon: Mic },
                  ].map((tab) => {
                    const active = audioMode === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() =>
                          !recorder.recording && setAudioMode(tab.id)
                        }
                        disabled={recorder.recording}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer ${active ? "bg-surface text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                      >
                        <tab.Icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                {audioMode === "record" ? (
                  <div className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-8 flex flex-col items-center justify-center gap-3">
                    {recorder.recording ? (
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
                  <button
                    onClick={() => audioFileRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-8 flex flex-col items-center justify-center gap-2 text-sm text-gray-500 hover:border-blue-400 hover:bg-blue-50/40 transition-colors cursor-pointer"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="text-blue-600 font-semibold">
                      Upload audio
                    </span>
                    <span className="text-[11px] text-gray-400 text-center px-4">
                      MP3 · WAV · OGG · M4A · WEBM · up to 100 MB · transcribed
                      on your device
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Persona fields */}
        {config.input === "persona" && (
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
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleInspire}
                className="shrink-0 text-xs font-semibold bg-surface border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
              >
                ✨ Inspire
              </button>
            </div>
            {ic.ageGroups && (
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
                  Age
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {ic.ageGroups.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => setValue("personaAge", a.value)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${values.personaAge === a.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"}`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
                <input
                  value={
                    /^\d+$/.test(values.personaAge) ? values.personaAge : ""
                  }
                  onChange={(e) => setValue("personaAge", e.target.value)}
                  placeholder="Or exact age (e.g. 32)"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
                Occupation
              </label>
              <input
                value={values.personaOccupation}
                onChange={(e) => setValue("personaOccupation", e.target.value)}
                placeholder="e.g. Marketing Manager"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
              />
              {ic.occupations && (
                <div className="flex flex-wrap gap-1.5">
                  {ic.occupations.slice(0, 6).map((o) => (
                    <button
                      key={o}
                      onClick={() => setValue("personaOccupation", o)}
                      className={`px-2.5 py-1 rounded-md border text-[10px] font-semibold transition-all cursor-pointer ${values.personaOccupation === o ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"}`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {ic.tones && (
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
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-semibold transition-all cursor-pointer ${active ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"}`}
                      >
                        {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                        {t.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Inline option rows — two columns; each expands in place (no floating
            panel) and independently of the others (items-start keeps an open
            row from stretching its neighbour). */}
        {config.options?.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
            {config.options.map((option) => {
              const open = openOption === option.key;
              return (
                <div
                  key={option.key}
                  className="rounded-2xl bg-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() => toggleOption(option.key)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-200/70 transition-colors cursor-pointer"
                  >
                    <span className="text-gray-900 font-medium">
                      {option.label}
                    </span>
                    <span className="text-blue-600 font-semibold flex items-center gap-1.5">
                      {summarize(option, values[option.key])}
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
                      />
                    </span>
                  </button>
                  {open && (
                    <div className="bg-surface border-t border-gray-200 max-h-72 overflow-y-auto">
                      <OptionPanelBody
                        option={option}
                        value={values[option.key]}
                        voicePreview={voicePreview}
                        onSelect={(val) => {
                          setValue(option.key, val);
                          closeOption();
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        {/* Generate */}
        <button
          onClick={handleGenerate}
          disabled={generateDisabled}
          className="w-full py-3 rounded-2xl text-sm cursor-pointer font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
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
        {config.onDevice && (
          <p className="text-center text-[11px] text-gray-400">
            Runs on your device — private, free, and unlimited.
          </p>
        )}
      </div>

      {/* ── 3. On-device processing + session result ── */}
      {config.onDevice && generating && (
        <ProcessingState
          config={config}
          engineType={config.engine}
          engine={onDeviceEngine}
        />
      )}

      {/* Audio-to-Text transcript (session; copy-only, not selectable) */}
      {!usesHistory && !generating && resultType === "text" && result?.text && (
        <div className="rounded-2xl border border-gray-200 bg-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">
              Transcript
            </span>
            <div className="flex items-center gap-2">
              <TranscriptDownload
                hasSegments={(result?.meta?.segments?.length || 0) > 0}
                onDownload={downloadTranscript}
              />
              <button
                onClick={copyTranscript}
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
            </div>
          )}
        </div>
      )}

      {/* Text-to-Audio result (session; save-to-select) */}
      {!usesHistory &&
        !generating &&
        resultType === "audio" &&
        result?.assets?.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">
                Result
              </span>
              <button
                onClick={resetResult}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> New generation
              </button>
            </div>
            {result.assets.map((a, i) => {
              const savedUrl = savedAudioRef.current.get(a.id);
              const selected = savedUrl && selectedMedia.includes(savedUrl);
              return (
                <div key={a.id} className="space-y-2">
                  <AudioCard
                    asset={a}
                    index={i}
                    onDownload={downloadAudioAsset}
                    onOpenMenu={() => {}}
                  />
                  {/* Only offer selection when the requesting form accepts audio. */}
                  {allowedTypes.includes("audio") && (
                    <button
                      onClick={() => handleUseAudio(a)}
                      disabled={savingAudioId === a.id}
                      className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 ${selected ? "bg-blue-600 text-white" : "border border-blue-200 text-blue-600 hover:bg-blue-50"}`}
                    >
                      {savingAudioId === a.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : selected ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <PlusCircle className="w-3.5 h-3.5" />
                      )}
                      {selected ? "Added to selection" : "Add to selection"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

      {/* On-device empty hint (before first run) */}
      {config.onDevice && !generating && !result && (
        <div className="flex flex-col items-center justify-center py-6 text-gray-300 gap-2">
          <ImageOff className="w-6 h-6" />
          <p className="text-xs text-gray-400">
            Your result will appear here after you generate.
          </p>
        </div>
      )}
    </div>
  );
}

// Small TXT / SRT / VTT download popover for the transcript result.
function TranscriptDownload({ hasSegments, onDownload }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        Download
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-60 rounded-xl border border-gray-200 bg-surface p-1 shadow-2xl">
            {TRANSCRIPT_DOWNLOADS.map(
              ({ kind, label, desc, Icon, needsSegments }) => {
                const disabled = needsSegments && !hasSegments;
                return (
                  <button
                    key={kind}
                    disabled={disabled}
                    onClick={() => {
                      setOpen(false);
                      onDownload?.(kind);
                    }}
                    className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-blue-50/60 cursor-pointer"}`}
                  >
                    <Icon className="mt-0.5 w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>
                      <span className="block text-xs font-medium text-gray-700">
                        {label}
                      </span>
                      <span className="block text-[11px] text-gray-400">
                        {disabled ? "No timed segments for this clip" : desc}
                      </span>
                    </span>
                  </button>
                );
              },
            )}
          </div>
        </>
      )}
    </div>
  );
}
