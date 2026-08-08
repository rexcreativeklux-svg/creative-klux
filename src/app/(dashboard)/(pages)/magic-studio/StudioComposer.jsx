"use client";

/**
 * StudioComposer — the working control at the foot of a Magic Studio tool.
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ THIS GENERATES. Enter runs the tool for real — it does not open a modal and
 * hand off. It drives the SAME machine the modal and the media picker drive:
 * per-tool configs (magicStudioConfigs), `useMagicGenerate` for the validate →
 * generate → poll-video-job → refresh-history flow, and the on-device engines
 * for the two tools that never touch the server. Nothing about generating is
 * reimplemented here; only the layout is new.
 *
 * ⚠️ IT CARRIES WHATEVER THE TOOL ACTUALLY NEEDS, and the tools do not agree:
 *
 *     input: "prompt"|"script"|"text"   a textarea, with that tool's own
 *                                       placeholder and length cap
 *     input: "image"                    a source picture, uploaded to get a
 *                                       hosted URL the backend can read
 *     input: "audio"                    a file or a live mic take, kept local
 *     input: "persona"                  four fields, folded into a chip
 *
 * plus that tool's own options (style, size, quality, voice, language…) as chips
 * along the toolbar, each opening the SHARED OptionPanelBody — the same rich
 * panel the modal shows, so a style card looks the same wherever you meet it —
 * and the app-wide model menu at the end of the row.
 *
 * ⚠️ EVERY PANEL IN THIS TOOLBAR IS PORTALLED (see ToolbarChip, and
 * ComposerDropdown for the model menu). The row is `overflow-x-auto`, which
 * clips on BOTH axes, so a panel rendered as a child of it is trimmed to the
 * height of the row — which reads as a menu that opens too low and can't be
 * clicked. Anything new added here needs the same treatment.
 *
 * ⚠️ THERE IS NO TOOL PICKER HERE. Which tool you are using is the page you are
 * on, and the secondary sidebar is what changes it. A second selector in the
 * composer would be a control that silently moves you somewhere else.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  ImagePlus,
  Loader2,
  Mic,
  Sparkles,
  Square,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { isHostedUrl, pickHostedUrl } from "@/(lib)/magic-studio-api";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import { saveUrlToGallery } from "@/app/(components)/product-studio/saveToGallery";
import ComposerDropdown from "@/app/(components)/studio/ComposerDropdown";
// The app-wide model choice — the same one the home composer shows, persisted
// across visits. See studio/composerModel.js.
import {
  MODEL_GROUPS,
  MODEL_OPTIONS,
  useComposerModel,
} from "@/app/(components)/studio/composerModel";
import useTextToSpeech from "@/(lib)/ai-engine/hooks/useTextToSpeech";
import useSpeechToText from "@/(lib)/ai-engine/hooks/useSpeechToText";
import {
  useMicRecorder,
  useVoicePreview,
} from "@/app/(components)/magic-studio/magicEngineHooks";
import {
  OptionPanelBody,
  summarize,
} from "@/app/(components)/magic-studio/magicPanelUI";
import useMagicGenerate from "@/app/(components)/magic-studio/useMagicGenerate";
import { getMagicConfig } from "./magicStudioConfigs";
import ToolbarChip from "./ToolbarChip";

/** The `input` kinds that are typed into. The rest need a file, a take, or a form. */
const TYPEABLE = new Set(["prompt", "script", "text"]);

/** Audio files above this are refused before anything is read. Matches the modal. */
const MAX_AUDIO_BYTES = 100 * 1024 * 1024;

/** Shared styling for the small selectable pills in the persona panel. */
const pillClass = (active) =>
  `cursor-pointer rounded-md border px-2.5 py-1 text-[10px] font-semibold transition-all ${
    active
      ? "border-blue-500 bg-blue-50 text-blue-700"
      : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"
  }`;

/**
 * @param {object} props
 * @param {import("./magicTools").MagicTool} props.tool
 * @param {{refresh: () => Promise<void>}} props.history History controller for
 *   this tool — useMagicGenerate refreshes it itself once a backend generation
 *   lands, which is how the new tile appears in the lattice above.
 * @param {(result: object|null) => void} props.onResult Session result from an
 *   ON-DEVICE tool. Those two persist nothing, so there is no history for the
 *   result to appear in and the page has to hold it instead.
 * @param {(status: {generating: boolean, progress: number|null}) => void} [props.onStatusChange]
 *   Lets the page draw the placeholder tile, and fill its bar. `progress` is a
 *   whole percent while an on-device engine reports one, and null otherwise —
 *   see the note where it is computed.
 */
export default function StudioComposer({
  tool,
  history,
  onResult,
  onStatusChange,
}) {
  const { activeBrand, uploadMedia, token } = useAuth();
  const config = getMagicConfig(tool.id);
  const inputConfig = config?.inputConfig || {};
  const kind = config?.input;
  const typeable = TYPEABLE.has(kind);

  // ── On-device engines. Idle until their tool runs; the same shared engines
  //    the modal and the media picker use, so a model already warmed by one
  //    surface is warm for this one too. ──
  const tts = useTextToSpeech();
  const stt = useSpeechToText();
  const voicePreview = useVoicePreview(tts);

  // A backend tool + a logged-in user means results land in server history;
  // anything else hands back a session result the page has to hold.
  const usesHistory = !!token && !config?.onDevice;

  // ── Option values, seeded from each option's own default ──
  const [values, setValues] = useState(() => {
    const seed = {};
    (config?.options || []).forEach((option) => {
      seed[option.key] = option.default;
    });
    if (config?.input === "persona") {
      seed.personaName = "";
      seed.personaAge = "";
      seed.personaOccupation = "";
      seed.personaTone = "";
    }
    return seed;
  });
  const setValue = (key, val) => setValues((prev) => ({ ...prev, [key]: val }));

  // ── The primary input, in whichever shape this tool takes ──
  const [text, setText] = useState("");
  // { url, preview } — `url` is the hosted one the backend is sent, `preview`
  // is whatever renders fastest in the strip. No object URLs: every image now
  // arrives from the picker already hosted, or is uploaded on the way in.
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [audio, setAudio] = useState(null); // File
  const [audioPreview, setAudioPreview] = useState(null); // object URL
  const [pickerOpen, setPickerOpen] = useState(false);

  // One key, so opening a chip's panel closes whichever was open. The model
  // menu shares it, which is why it can't be the odd one out with its own flag.
  const [openPanel, setOpenPanel] = useState(null);
  const togglePanel = (key) =>
    setOpenPanel((prev) => (prev === key ? null : key));
  const closePanel = () => setOpenPanel(null);

  // ⚠️ NOT sent to the backend yet. Each config's `generate` builds an explicit,
  // whitelisted payload (tool / prompt / visual_style / ratio …), so this rides
  // along in `values` and is simply not read — deliberately, because posting a
  // field the API doesn't declare is how you earn a 422. Wiring it up is one
  // line per config once the backend names the field.
  // Shared with the home composer rather than local: the model is a preference
  // about the user, not about the screen they happen to be on.
  const [model, setModel] = useComposerModel();

  const audioFileRef = useRef(null);

  // The audio preview is a manual allocation — without this every picked or
  // recorded take leaks its blob for the life of the tab. Audio is the only one
  // left that needs it: it is never uploaded, because Audio to Text reads the
  // File on this machine.
  useEffect(
    () => () => {
      if (audioPreview) URL.revokeObjectURL(audioPreview);
    },
    [audioPreview],
  );

  const primaryInput = useMemo(() => {
    switch (kind) {
      case "prompt":
      case "script":
      case "text":
        return text;
      case "image":
        return image?.url || null;
      case "audio":
        return audio;
      default:
        return null; // persona generates from values.* alone
    }
  }, [kind, text, image, audio]);

  const { generating, error, generate } = useMagicGenerate({
    config,
    usesHistory,
    history,
    tts,
    stt,
    onResult,
    beforeGenerate: () => voicePreview.stop(),
  });

  /**
   * How far along a run is, as a whole percent — or null when there is nothing
   * real to report.
   *
   * ⚠️ NULL IS A DELIBERATE ANSWER, not a missing one. Only the two on-device
   * engines know their own progress; a backend generation is a request we are
   * waiting on and the client cannot see inside it. A bar invented for those
   * would be a bar that lies — worse than the elapsed counter, which at least
   * only claims that time is passing.
   *
   * Rounded to whole percent so the page re-renders about a hundred times over
   * a run rather than on every chunk the engine reports.
   */
  const onDeviceEngine =
    config?.engine === "stt" ? stt : config?.engine === "tts" ? tts : null;
  const progress =
    generating && typeof onDeviceEngine?.progress === "number"
      ? Math.max(0, Math.min(100, Math.round(onDeviceEngine.progress)))
      : null;

  // Tell the page, so it can draw the placeholder tile and fill its bar.
  //
  // ⚠️ IN AN EFFECT, NOT DURING RENDER. Adjusting state during render is only
  // ever valid for a component's OWN state — this callback sets state in the
  // PARENT, and React refuses to update one component while another is
  // rendering ("Cannot update a component while rendering a different
  // component"). An effect runs after this render commits, which is the only
  // legal moment to tell somebody else something changed.
  useEffect(() => {
    onStatusChange?.({ generating, progress });
  }, [generating, progress, onStatusChange]);

  // ── Input handlers ─────────────────────────────────────────────────────────
  /**
   * An image was chosen in the picker — from the user's library, from a Pexels
   * search, or freshly uploaded there.
   *
   * ⚠️ THE BACKEND NEEDS A URL IT CAN READ, which is what splits these two
   * cases. Library and upload results are already on our CDN and are used as
   * they are. A Pexels result is a third party's URL, so it is pulled into the
   * gallery first and the hosted copy is what gets sent — otherwise generation
   * depends on a host we don't control still serving that file, and on it
   * allowing our backend to fetch it.
   */
  const handlePickedImage = async (src) => {
    if (!src) return;

    if (isHostedUrl(src)) {
      console.log("🖼️ [magic-studio] source image already hosted");
      setImage({ url: src, preview: src });
      return;
    }

    setUploading(true);
    const id = toast.loading("Saving image to your gallery…");
    try {
      const hosted = pickHostedUrl(await saveUrlToGallery(src, uploadMedia));
      if (!hosted) throw new Error("Saved, but no URL came back.");
      // Preview from the ORIGINAL url: it is already in the browser's cache
      // from the picker's own thumbnail, so the strip fills instantly instead
      // of waiting on a fresh fetch of the copy.
      setImage({ url: hosted, preview: src });
      toast.success("Image ready", { id });
    } catch (err) {
      console.error("❌ [magic-studio] couldn't save the source image:", err);
      toast.error(err?.message || "Couldn't use that image.", { id });
    } finally {
      setUploading(false);
    }
  };

  // Audio to Text runs entirely on-device — this file is never uploaded.
  const handleAudioFile = (file) => {
    if (!file) return;
    if (file.size > MAX_AUDIO_BYTES) {
      toast.error("File size must be under 100 MB.");
      return;
    }
    if (audioPreview) URL.revokeObjectURL(audioPreview);
    setAudio(file);
    setAudioPreview(URL.createObjectURL(file));
  };
  const recorder = useMicRecorder(handleAudioFile);

  const clearImage = () => setImage(null);

  /**
   * Fill the persona from one of the config's worked examples.
   *
   * The blank form is the hardest part of this tool — "who are you writing for"
   * is a real question, and a name, a job and a tone together show what a useful
   * answer looks like far faster than three placeholders can.
   *
   * ⚠️ Random is safe HERE and nowhere near render: this runs from a click, long
   * after hydration. The same call during render would resolve differently on
   * the server and the client and tear the panel down on hydration — which is
   * exactly why the home page's starter prompts walk their pool in order instead.
   */
  const handleInspire = () => {
    const examples = inputConfig.inspire;
    if (!Array.isArray(examples) || examples.length === 0) return;
    const pick = examples[Math.floor(Math.random() * examples.length)];
    console.log(`✨ [magic-studio] persona seeded from "${pick.name}"`);
    setValues((prev) => ({
      ...prev,
      personaName: pick.name || "",
      personaOccupation: pick.occupation || "",
      personaTone: pick.tone || "",
    }));
  };
  const clearAudio = () => {
    recorder.stop();
    if (audioPreview) URL.revokeObjectURL(audioPreview);
    setAudio(null);
    setAudioPreview(null);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  // What "ready" means is per-input: typed tools need text, image needs an
  // uploaded source, audio needs a take, persona needs at least a name. The
  // config's own validate runs inside generate() and reports anything finer.
  const ready = (() => {
    if (generating || uploading) return false;
    if (typeable) return text.trim().length > 0;
    if (kind === "image") return !!image?.url;
    if (kind === "audio") return !!audio;
    if (kind === "persona") return !!values.personaName?.trim();
    return true;
  })();

  const submit = () => {
    if (!ready) return;
    closePanel();
    console.log(`✨ [magic-studio] generating with "${tool.label}" (${model})`);
    generate({ primaryInput, values: { ...values, model }, activeBrand });
    // Typed input is cleared so the box is ready for the next idea; a picked
    // image or audio take is NOT — those are expensive to provide again, and
    // re-running the same source with different options is the normal loop.
    if (typeable) setText("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-surface shadow-[0_18px_50px_-20px_rgba(0,0,0,0.35)]">
      {/* The picked source, when this tool starts from one. A strip above the
          toolbar rather than a separate step, so what you are working from stays
          in view while you set the options that act on it. */}
      {kind === "image" && image && (
        <div className="flex items-center gap-3 border-b border-gray-100 px-3 pb-3 pt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.preview}
            alt="Source"
            className="h-12 w-12 shrink-0 rounded-lg object-cover"
          />
          <span className="min-w-0 flex-1 truncate text-xs text-gray-500">
            Source image ready
          </span>
          <button
            type="button"
            onClick={clearImage}
            aria-label="Remove source image"
            className="shrink-0 cursor-pointer rounded p-1 text-gray-400 transition-colors hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {kind === "audio" && audio && (
        <div className="flex items-center gap-3 border-b border-gray-100 px-3 pb-3 pt-3">
          <audio
            src={audioPreview || undefined}
            controls
            className="h-9 min-w-0 flex-1"
          />
          <button
            type="button"
            onClick={clearAudio}
            aria-label="Remove audio"
            className="shrink-0 cursor-pointer rounded p-1 text-gray-400 transition-colors hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {typeable ? (
        <textarea
          rows={2}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={inputConfig.maxLength}
          placeholder={inputConfig.placeholder || "Describe what you want…"}
          aria-label={inputConfig.label || `Input for ${tool.label}`}
          className="w-full resize-none bg-transparent px-4 pt-4 text-sm leading-relaxed text-gray-900 outline-none placeholder:text-gray-400"
        />
      ) : (
        <p className="px-4 pt-4 text-sm text-gray-400">
          {kind === "image" && !image && (inputConfig.helper || "Choose a source image to begin.")}
          {kind === "image" && image && "Set your options, then generate."}
          {kind === "audio" &&
            (audio
              ? "Set your options, then transcribe."
              : inputConfig.helper || "Upload a file or record from your mic.")}
          {kind === "persona" &&
            (values.personaName?.trim()
              ? `Generating as ${values.personaName.trim()}.`
              : "Describe who this is in the Persona panel.")}
        </p>
      )}

      {error && (
        <p className="mx-3 mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {/* Toolbar — TWO regions, and the split is the point.
          The options scroll sideways rather than wrapping, so a tool with five
          of them doesn't grow the composer into a second and third row and eat
          the canvas above it. SUBMIT DOES NOT SCROLL: it sits outside the
          scroller, pinned to the right edge, because it is the one control in
          this row that is always needed and it was riding off-screen on the
          tools with the most options (Audio to Text, Script to Voiceover) —
          the row scrolled, and the button went with it.
          A `flex-1` spacer used to push it right from INSIDE the scroller,
          which only works while the content fits; the scroll container itself
          is what claims the space now. */}
      <div className="flex items-center gap-1 px-3 pb-3 pt-1">
        <div className="hide-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {/* Source pickers, for the tools that need one. */}
        {kind === "image" && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            disabled={uploading}
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 enabled:cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
            ) : (
              <ImagePlus className="h-3.5 w-3.5 shrink-0" />
            )}
            {image ? "Replace" : "Source image"}
          </button>
        )}

        {kind === "audio" && (
          <>
            <input
              ref={audioFileRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(event) => {
                handleAudioFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => audioFileRef.current?.click()}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <Upload className="h-3.5 w-3.5 shrink-0" />
              Upload
            </button>
            <button
              type="button"
              onClick={() => (recorder.recording ? recorder.stop() : recorder.start())}
              className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                recorder.recording
                  ? "bg-red-50 text-red-600"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {recorder.recording ? (
                <>
                  <Square className="h-3.5 w-3.5 shrink-0 fill-current" />
                  Stop {recorder.elapsed}s
                </>
              ) : (
                <>
                  <Mic className="h-3.5 w-3.5 shrink-0" />
                  Record
                </>
              )}
            </button>
          </>
        )}

        {/* The persona's four fields, folded behind one chip — they are the
            input, but four boxes across a composer would make it a form. */}
        {kind === "persona" && (
          <ToolbarChip
            open={openPanel === "persona"}
            onToggle={() => togglePanel("persona")}
            onClose={closePanel}
            label="Persona"
            summary={values.personaName?.trim() || "Set up"}
            width={320}
          >
            {/* ⚠️ The suggestions, age bands and tones all come from the tool's
                own `inputConfig`, NOT from constants here. The modal builds its
                persona form from the same block, so a tone added there shows up
                on both surfaces at once — this panel used to hardcode its five
                age presets and diverged from the modal the moment either moved.
                Each list is rendered only when the config declares it, so a
                config without tones simply shows no tone row. */}
            <div className="flex flex-col gap-3 p-3">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-medium text-gray-500">Name</span>
                <div className="flex items-center gap-1.5">
                  <input
                    value={values.personaName}
                    onChange={(event) =>
                      setValue("personaName", event.target.value)
                    }
                    placeholder="e.g. Maya Chen"
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-blue-400"
                  />
                  {inputConfig.inspire?.length > 0 && (
                    <button
                      type="button"
                      onClick={handleInspire}
                      title="Fill in an example persona"
                      className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-2 py-1.5 text-[11px] font-semibold text-gray-500 transition-all hover:border-blue-400 hover:text-blue-600"
                    >
                      <Sparkles className="h-3 w-3 shrink-0" />
                      Inspire
                    </button>
                  )}
                </div>
              </div>

              {inputConfig.ageGroups?.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium text-gray-500">Age</span>
                  <div className="flex flex-wrap gap-1.5">
                    {inputConfig.ageGroups.map((group) => (
                      <button
                        key={group.value}
                        type="button"
                        onClick={() => setValue("personaAge", group.value)}
                        title={group.desc}
                        className={pillClass(values.personaAge === group.value)}
                      >
                        {group.label}
                      </button>
                    ))}
                  </div>
                  {/* A band is the quick answer; an exact age is the precise
                      one. Shown only when the value ISN'T one of the bands, so
                      picking "25–34" doesn't leave a stale number below it. */}
                  <input
                    value={/^\d+$/.test(values.personaAge) ? values.personaAge : ""}
                    onChange={(event) =>
                      setValue("personaAge", event.target.value)
                    }
                    placeholder="Or an exact age (e.g. 32)"
                    className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-blue-400"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-gray-500">
                  Occupation
                </span>
                <input
                  value={values.personaOccupation}
                  onChange={(event) =>
                    setValue("personaOccupation", event.target.value)
                  }
                  placeholder="e.g. Product designer"
                  className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-blue-400"
                />
                {inputConfig.occupations?.length > 0 && (
                  // Six of them. The list runs to ten, and a wall of pills in a
                  // 320px panel stops being a shortcut and becomes another
                  // decision — the field above takes anything not offered here.
                  <div className="flex flex-wrap gap-1.5">
                    {inputConfig.occupations.slice(0, 6).map((occupation) => (
                      <button
                        key={occupation}
                        type="button"
                        onClick={() => setValue("personaOccupation", occupation)}
                        className={pillClass(
                          values.personaOccupation === occupation,
                        )}
                      >
                        {occupation}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-gray-500">Tone</span>
                {inputConfig.tones?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {inputConfig.tones.map((tone) => {
                      const ToneIcon = tone.icon;
                      return (
                        <button
                          key={tone.value}
                          type="button"
                          onClick={() => setValue("personaTone", tone.value)}
                          className={`${pillClass(values.personaTone === tone.value)} flex items-center gap-1`}
                        >
                          {ToneIcon && <ToneIcon className="h-3 w-3 shrink-0" />}
                          {tone.value}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <input
                    value={values.personaTone}
                    onChange={(event) =>
                      setValue("personaTone", event.target.value)
                    }
                    placeholder="e.g. Warm and direct"
                    className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-blue-400"
                  />
                )}
              </div>
            </div>
          </ToolbarChip>
        )}

        {/* The tool's own options — style, size, quality, voice, language… */}
        {(config?.options || []).map((option) => (
          <ToolbarChip
            key={option.key}
            open={openPanel === option.key}
            onToggle={() => togglePanel(option.key)}
            onClose={closePanel}
            label={option.label}
            summary={summarize(option, values[option.key])}
            // The config declares how wide its panel needs to be — a grid of
            // style cards needs more room than a list of aspect ratios.
            width={option.width || 340}
          >
            <OptionPanelBody
              option={option}
              value={values[option.key]}
              voicePreview={voicePreview}
              onSelect={(val) => {
                setValue(option.key, val);
                closePanel();
              }}
            />
          </ToolbarChip>
        ))}

        {/* Which model does the work. Last in the row, after the settings that
            describe WHAT is being made — this one is about how it gets made.
            ComposerDropdown rather than a ToolbarChip: it already renders the
            grouped Claude / GPT sections, and this is the same menu, the same
            persisted choice, as the composer on the home page. */}
        {/* shrink-0 wrapper: flex items shrink by default, and this row scrolls
            sideways — without it the model trigger squashes as options are
            added instead of the row simply getting longer. */}
        <div className="shrink-0">
          <ComposerDropdown
            options={MODEL_OPTIONS}
            groups={MODEL_GROUPS}
            value={model}
            onChange={setModel}
            open={openPanel === "model"}
            onOpenChange={(next) => (next ? togglePanel("model") : closePanel())}
            ariaLabel="Choose a model"
            triggerLabel="Model"
          />
        </div>

        </div>

        {/* Submit — OUTSIDE the scroller above, so it stays put however long
            the options row gets. `ml-1` keeps it off the last chip when the
            row is short, and the scroller's own overflow is what slides under
            it when the row is long. */}
        <button
          type="button"
          onClick={submit}
          disabled={!ready}
          aria-label={config?.generateLabel || `Create with ${tool.label}`}
          title={config?.generateLabel || undefined}
          className={`ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all ${
            ready
              ? "cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
              : "cursor-not-allowed bg-gray-100 text-gray-400"
          }`}
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* The app's own media picker rather than a device file dialog — which is
          what the config's helper has always promised ("from your library, the
          web, or upload one"): Pexels search, the user's gallery, and an upload
          button inside the Library tab, all in one place.
          Its Magic Studio tab is left out. You are already in Magic Studio, and
          offering the tools again inside the picker only invites the question of
          which one you are actually using. */}
      {pickerOpen && (
        <MediaPickerModal
          isOpen
          initialTab="library"
          tabs={["search", "library"]}
          allowedTypes={["image"]}
          maxSelectable={1}
          activeBrand={activeBrand}
          onClose={() => setPickerOpen(false)}
          onCancel={() => setPickerOpen(false)}
          onApply={(images, media) => {
            setPickerOpen(false);
            // The picker returns two buckets and hands back objects, not URLs —
            // whichever produced the pick, all we want is the first `src`.
            const picked = [...(images || []), ...(media || [])][0];
            const src = typeof picked === "string" ? picked : picked?.src;
            if (!src) {
              console.warn("⚠️ [magic-studio] picker applied with no image");
              return;
            }
            handlePickedImage(src);
          }}
        />
      )}
    </div>
  );
}
