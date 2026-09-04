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
 *     input: "video"                    a source clip, picked from the gallery
 *                                       (already hosted — nothing is read here)
 *     input: "audio"                    a file or a live mic take, kept local
 *     input: "persona"                  four fields, folded into a chip
 *
 * A tool that starts from a picture or a clip may ALSO take words, and the two
 * flavours differ only in whether they gate the submit button: `describable` is
 * an optional note, `requiresPrompt` is the real input. See both below.
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
  AudioLines,
  Clock,
  Cpu,
  Drama,
  FileText,
  FileVideo,
  Gauge,
  Gem,
  ImagePlus,
  Languages,
  LayoutGrid,
  Loader2,
  Mic,
  MonitorPlay,
  Move3d,
  PaintBucket,
  Palette,
  SwatchBook,
  Ratio,
  Sparkles,
  Square,
  Target,
  Upload,
  User,
  Volume2,
  WandSparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
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
import useMagicGenerate, {
  MAX_VARIATIONS,
} from "@/app/(components)/magic-studio/useMagicGenerate";
import { getMagicConfig } from "./magicStudioConfigs";
import ToolbarChip from "./ToolbarChip";

/** The `input` kinds that are typed into. The rest need a file, a take, or a form. */
const TYPEABLE = new Set(["prompt", "script", "text"]);

/**
 * The glyph for each setting the configs declare, keyed by the option's own
 * `key`. A config may override with its own `icon`.
 *
 * ⚠️ KEYED HERE RATHER THAN ON EVERY OPTION. The seven tools declare the same
 * dozen settings between them — four of them have a `style`, three have a
 * `ratio`, two have a `format` — and putting the icon on each declaration means
 * the same setting can end up wearing three different glyphs across three
 * tools, which is exactly the thing that makes an icon-only row unlearnable.
 * One entry per setting, and every tool that has that setting gets the same
 * picture for it.
 *
 * Anything missing falls back to a text chip, so a setting added to a config
 * without a line here still works and still reads — it just doesn't shrink.
 */
const OPTION_ICONS = {
  purpose: Target,
  style: Palette,
  // Not Palette — that is `style`, and the two sit side by side on Text to
  // Image. A swatch book reads as "pick a colour" where a second palette would
  // just look like the style chip had been drawn twice.
  color: SwatchBook,
  ratio: Ratio,
  duration: Clock,
  voice: AudioLines,
  tone: Drama,
  pace: Gauge,
  format: FileText,
  language: Languages,
  quality: Gem,
  contentType: LayoutGrid,
  // The video tools' settings.
  // `template` is Video Effects' catalog of ready-made looks — the wand, because
  // it is the one control that writes the prompt and picks the picture for you.
  template: WandSparkles,
  engine: Cpu,
  motion: Move3d,
  resolution: MonitorPlay,
  sound: Volume2,
  // A paint bucket rather than the colour chip's swatch book: this row REPLACES
  // what is behind the subject, where `color` only tints what gets painted.
  background: PaintBucket,
  effect: WandSparkles,
};

/**
 * How many to make at once — the "3x" of the composer, 1 to MAX_VARIATIONS.
 *
 * ⚠️ NOT OFFERED ON EVERY TOOL — a config opts in with `variations: true`, and
 * the five backend tools do. The two on-device ones cannot: they never reach
 * the endpoint that fans out, and they are deterministic besides, so three runs
 * of the same audio return the same transcript three times.
 */

/** Audio files above this are refused before anything is read. Matches the modal. */
const MAX_AUDIO_BYTES = 100 * 1024 * 1024;

/**
 * What the browser can tell us about a picked video, or null.
 *
 * ⚠️ IT REPORTS, IT DOES NOT REFUSE. The obvious next step is to reject a source
 * that is too long before the run rather than after it — and it is deliberately
 * not done here, because there is no duration limit to test against: the only
 * cap anything in this app actually knows is the gallery's 50 MB on the FILE
 * (FILE_LIMITS in utils/helpers.js), which the picker has already enforced by
 * the time a URL reaches us. Inventing a threshold would refuse clips that
 * process fine. When a real limit exists, this is where the check goes — the
 * numbers it needs are already here.
 *
 * ⚠️ IT NEVER REJECTS, EITHER. A CDN that doesn't send CORS headers, a codec the
 * browser can't demux, a slow connection — all of them end with no metadata, and
 * none of them is a reason to stop someone generating. The strip simply shows
 * the clip without a duration.
 *
 * @param {string} url A hosted video URL.
 * @returns {Promise<{duration: number, width: number, height: number}|null>}
 */
function probeVideo(url) {
  return new Promise((resolve) => {
    const el = document.createElement("video");
    el.preload = "metadata";
    // Belt and braces: a source that never fires either event would leave this
    // promise pending forever, and the strip waiting on it.
    const timer = setTimeout(() => {
      console.warn("⚠️ [magic-studio] video metadata timed out");
      resolve(null);
    }, 8000);
    const done = (value) => {
      clearTimeout(timer);
      el.removeAttribute("src");
      resolve(value);
    };
    el.onloadedmetadata = () =>
      done({
        duration: el.duration,
        width: el.videoWidth,
        height: el.videoHeight,
      });
    el.onerror = () => {
      console.warn("⚠️ [magic-studio] couldn't read video metadata");
      done(null);
    };
    el.src = url;
  });
}

/** Seconds → "1:04". Blank for anything unreadable, so the strip just omits it. */
const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};

/**
 * What a run will produce — "image" | "video" | "audio" | "text".
 *
 * Every config states this outright EXCEPT the persona generator, which declares
 * `resultType: "auto"` because it makes whichever of the three the Content type
 * dropdown is set to. That is resolved here, from the same `values.contentType`
 * its own `generate` reads, so the in-flight cells can't disagree with what
 * actually comes back.
 *
 * Used only to pick the placeholder's backdrop, so an unknown type is harmless —
 * GeneratingArt falls back to the neutral one.
 *
 * @param {object} config  The tool's entry in magicStudioConfigs.
 * @param {object} values  The composer's current option values.
 * @returns {string}
 */
const resolveResultType = (config, values) => {
  if (config?.resultType !== "auto") return config?.resultType || "image";
  if (values?.contentType === "text") return "text";
  if (values?.contentType === "video") return "video";
  return "image";
};

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
 * @param {(status: {generating: boolean, progress: number|null, prompt: string}) => void} [props.onStatusChange]
 *   Lets the page draw the placeholder tile, put the words on it, and fill its
 *   bar. `progress` is a whole percent while an on-device engine reports one,
 *   and null otherwise — see the note where it is computed.
 * @param {{text: string, nonce: number}|null} [props.refill] A prompt pushed
 *   back INTO the composer from outside — the in-flight tile's edit affordance.
 *   Keyed by `nonce` rather than by the text so asking for the same words twice
 *   still lands; see the effect that applies it.
 */
export default function StudioComposer({
  tool,
  history,
  onResult,
  onStatusChange,
  refill = null,
}) {
  // No `uploadMedia` here any more — a picked image is sent by its own URL and
  // nothing is copied into the gallery on the way. The picker still uploads
  // what the user drops on its own Upload tab; that is its business, not ours.
  const { activeBrand, token } = useAuth();
  const config = getMagicConfig(tool.id);
  const inputConfig = config?.inputConfig || {};
  const kind = config?.input;
  const typeable = TYPEABLE.has(kind);
  /**
   * Tools that start from something other than words, but will still take some.
   *
   * ⚠️ NOT THE SAME BOX AS `typeable`'s, even though it is the same textarea and
   * the same `text` state. On a prompt tool the words ARE the input and nothing
   * runs without them; here they are an optional note riding alongside a picture
   * or a form, they never gate `ready`, and they reach the payload as
   * `description` rather than `prompt` — see descriptionField in the configs.
   *
   * ⚠️ OPT-IN PER TOOL rather than "every tool that isn't typeable". Audio to
   * Text is the reason: it runs Whisper on this machine and never posts a
   * payload at all, so a description box there would be somewhere to type that
   * quietly discards what you wrote.
   */
  const describable = !typeable && config?.describable === true;

  /**
   * Tools whose secondary box is the REAL input, not a note.
   *
   * ⚠️ THE DIFFERENCE FROM `describable` IS THE SUBMIT BUTTON. A described run
   * works perfectly with the box left alone, so `describable` never touches
   * `ready`. Digital Human's script and Video Effects' motion prompt are the
   * opposite: without words there is nothing to generate. Left as a
   * describable-style optional box, the button would invite a run that
   * `validate()` then rejects — a failure the user could see coming and the UI
   * chose not to show them.
   *
   * ⚠️ A SEPARATE FLAG RATHER THAN A WIDENED `describable`, because the payload
   * keys off that one: at submit, `describable` is what sends the words as
   * `description`. Two shipped tools depend on that meaning, so requiring text
   * had to be a new question rather than a new value for the old one.
   */
  const requiresPrompt = !typeable && config?.requiresPrompt === true;

  /**
   * Whether this tool has a secondary text box at all, of either kind. What
   * decides the textarea renders; `requiresPrompt` decides whether it gates.
   */
  const promptable = describable || requiresPrompt;

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
  // What the LAST run was asked for and how many of it — frozen at submit so
  // the in-flight tiles keep showing THAT run. The box no longer empties on
  // send, but it is still live: keep typing while a generation is in flight and
  // reading `text` for the tiles would rewrite the words under a run that was
  // asked for something else. The count is frozen for the same reason —
  // changing the chip from 3x to 1x mid-run must not make two placeholders
  // disappear.
  const [lastRun, setLastRun] = useState({
    prompt: "",
    count: 1,
    resultType: "image",
  });

  // How many to make in one go — the "3x" chip. Held here and merged into
  // `values` at submit, like `model`, so the config's `generate` can put it in
  // the payload; the backend is what fans out.
  const [variations, setVariations] = useState(1);
  const variationsEnabled = config?.variations === true;
  // { url, preview } — `url` is the hosted one the backend is sent, `preview`
  // is whatever renders fastest in the strip. No object URLs: every image now
  // arrives from the picker already hosted, or is uploaded on the way in.
  const [image, setImage] = useState(null);
  const [audio, setAudio] = useState(null); // File
  const [audioPreview, setAudioPreview] = useState(null); // object URL
  /**
   * A SECOND media input, for the one tool that takes two: Digital Human's
   * voice track — { url, name }.
   *
   * ⚠️ NOT THE `audio` STATE ABOVE. That one holds a local File for Audio to
   * Text, which posts the bytes and never hosts them. This is a hosted gallery
   * URL that rides into the payload as `audio_url`, so the two cannot share a
   * slot even though both are "the audio on this composer".
   */
  const [voiceTrack, setVoiceTrack] = useState(null);
  const extraAudio = config?.extraInput?.kind === "audio";
  /**
   * The picked source video — { url, meta } where `meta` is what the browser
   * could read off it ({ duration, width, height }) or null.
   *
   * ⚠️ ALWAYS A HOSTED URL, NEVER A `File`. The video tools send `video_url` for
   * the backend to fetch server-side, and every video reaching this composer
   * comes out of the gallery already hosted — the picker's own Library tab is
   * what uploads one. That is why there is no size check, no object URL and no
   * MIME fixer here the way there is for audio: nothing is read on this machine.
   */
  const [video, setVideo] = useState(null);
  /**
   * Which source the media picker is open for — null | "image" | "video".
   *
   * ⚠️ A TARGET, NOT A BOOLEAN. It used to be `pickerOpen` and `onApply` always
   * called the image setter, which was fine while one kind of tool could open
   * it. Two things now depend on which one asked: the `allowedTypes` the picker
   * is given, and which setter the result goes to. A boolean here would open a
   * video tool's picker onto the image library.
   */
  const [pickerTarget, setPickerTarget] = useState(null);

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
      case "video":
        return video?.url || null;
      case "audio":
        return audio;
      default:
        return null; // persona generates from values.* alone
    }
  }, [kind, text, image, video, audio]);

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
    onStatusChange?.({
      generating,
      progress,
      prompt: lastRun.prompt,
      count: lastRun.count,
      resultType: lastRun.resultType,
    });
  }, [generating, progress, lastRun, onStatusChange]);

  // A prompt pushed back in from the in-flight tile's pencil.
  //
  // ⚠️ KEYED ON THE NONCE ALONE. Depending on the text would make this a no-op
  // the second time you ask for the same words back — you would edit the box,
  // click the pencil to restore what you started from, and nothing would
  // happen. The nonce changes on every request, so every request lands.
  //
  // ⚠️ DURING RENDER, NOT IN AN EFFECT. This is React's own pattern for
  // adjusting state when a prop changes: it re-renders immediately, before
  // anything paints. In an effect the composer would paint once with the stale
  // text and then again with the refilled text — a visible flash of the wrong
  // words — which is what `react-hooks/set-state-in-effect` is warning about.
  const [appliedRefill, setAppliedRefill] = useState(null);
  if (refill?.nonce != null && refill.nonce !== appliedRefill) {
    setAppliedRefill(refill.nonce);
    setText(refill.text || "");
  }

  // ── Input handlers ─────────────────────────────────────────────────────────
  /**
   * An image was chosen in the picker — from the user's library, from a Pexels
   * search, or freshly uploaded there.
   *
   * ⚠️ THE URL IS SENT AS THE PICKER HANDED IT OVER. A search result used to be
   * copied into the user's gallery first and the hosted copy sent instead, so
   * that generation never depended on a third party still serving the file.
   * That cost a full download-and-upload before anything could start, and — the
   * reason it's gone — it silted up the library with stock images nobody chose
   * to keep: every browse-and-discard left a permanent copy behind.
   *
   * ⚠️ SO THE BACKEND HAS TO FETCH IT. It already does — `image_url` is a URL it
   * downloads server-side, where CORS doesn't apply — but it is now fetching
   * pexels.com rather than our own CDN. If variations start failing on searched
   * images while library ones still work, this is the change that did it, and
   * the fix is to re-host on the SERVER rather than to put the client-side
   * upload back.
   */
  const handlePickedImage = (src) => {
    if (!src) return;
    console.log("🖼️ [magic-studio] source image:", src);
    setImage({ url: src, preview: src });
  };

  /**
   * A video was chosen in the picker — always from the user's gallery, so it is
   * already hosted and is used exactly as handed over (same rule as the image
   * above, and the same reason: nothing is copied on the way in).
   *
   * The clip is usable the instant it is set; the metadata probe only fills in
   * the duration and size shown in the strip, so it runs after rather than being
   * awaited. A probe that fails or is still running leaves `meta` null and costs
   * nothing but that one line of detail.
   */
  const handlePickedVideo = (src) => {
    if (!src) return;
    console.log("🎬 [magic-studio] source video:", src);
    setVideo({ url: src, meta: null });
    probeVideo(src).then((meta) => {
      if (!meta) return;
      console.log(
        `🎬 [magic-studio] ${formatDuration(meta.duration)} · ${meta.width}×${meta.height}`,
      );
      // Keyed on the URL so a probe that resolves after the user has already
      // picked a different clip can't write its numbers onto the new one.
      setVideo((prev) => (prev?.url === src ? { ...prev, meta } : prev));
    });
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
  const clearVideo = () => setVideo(null);

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
    if (generating) return false;
    if (typeable) return text.trim().length > 0;
    // A tool that REQUIRES its secondary box needs both halves — the source and
    // the words. Checked once here rather than per kind, so a future
    // `requiresPrompt` tool on any input kind is gated the same way.
    if (requiresPrompt && !text.trim()) return false;
    // A tool with a REQUIRED second input needs that too, whatever its primary
    // input is — Digital Human's portrait is only half a run without the voice
    // track it lip-syncs to.
    if (extraAudio && config.extraInput.required && !voiceTrack?.url) {
      return false;
    }
    if (kind === "image") return !!image?.url;
    if (kind === "video") return !!video?.url;
    if (kind === "audio") return !!audio;
    if (kind === "persona") return !!values.personaName?.trim();
    return true;
  })();

  const submit = () => {
    if (!ready) return;
    closePanel();
    console.log(`✨ [magic-studio] generating with "${tool.label}" (${model})`);
    // Frozen at submit, so the in-flight tiles keep showing THIS run while the
    // box stays live. A tool with no words at all — an audio take — still
    // reports nothing, and the tile falls back to the tool's working label.
    const count = variationsEnabled ? variations : 1;
    const typed = text.trim();
    setLastRun({
      // A described run has words of its own now, and they are the truest label
      // for the tile — "warm studio grey background" says more about what is
      // coming than the persona's name or an empty string does. The old
      // fallbacks stay behind it for the runs where the box was left alone.
      prompt: typeable
        ? typed
        : typed ||
          (kind === "persona" ? values.personaName?.trim() || "" : ""),
      count,
      // What this run will produce, which is what the in-flight cells are drawn
      // as. Frozen here with the prompt and the count, for the same reason: the
      // persona generator's type follows a dropdown the user can keep changing
      // while a run is in flight, and the tiles must go on showing what THIS
      // run is making.
      resultType: resolveResultType(config, values),
    });
    generate({
      primaryInput,
      values: {
        ...values,
        model,
        variations: count,
        // The second media input, where a tool declares one. Named for what it
        // is rather than for the tool, so a future two-input tool reads it the
        // same way; the config's `generate` decides what it is called on the
        // wire (`audio_url` on Digital Human).
        ...(extraAudio ? { audioUrl: voiceTrack?.url || null } : {}),
        // ⚠️ `description` IS THE COMPOSER'S NAME FOR THIS BOX, NOT THE WIRE
        // NAME. It is simply "whatever was typed in the secondary textarea";
        // each config's `generate` decides what to call it on the way out —
        // `description` for Image to Variations and the persona generator,
        // `prompt` for Image to Video and Video Effects, `script` for Digital
        // Human. Renaming it here would mean touching every one of them.
        //
        // On a typed tool these same words ARE the primary input and go up as
        // `prompt` already — sending them twice under two names would be the
        // same brief, doubled.
        ...(promptable ? { description: typed } : {}),
      },
      activeBrand,
    });
    // ⚠️ NOTHING IS CLEARED ON SUBMIT — not the typed prompt, not the picked
    // image or audio take. Re-running the same input with a different style,
    // ratio or model is the normal loop here, and a prompt you spent a minute
    // wording is expensive to type again; emptying the box on send made the
    // second attempt start from a blank line. The words stay put and are
    // selected-over or edited for the next run.
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
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 pb-3 pt-3">
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

      {/* The picked voice track, on the one tool that takes a second input.
          A real <audio controls> rather than a filename: what matters before
          spending minutes on a render is that this is the RIGHT take, and the
          only way to know that is to hear it. */}
      {extraAudio && voiceTrack && (
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 pb-3 pt-3">
          <audio
            src={voiceTrack.url}
            controls
            preload="metadata"
            className="h-8 min-w-0 flex-1"
          />
          <button
            type="button"
            onClick={() => setVoiceTrack(null)}
            aria-label="Remove voice track"
            className="shrink-0 cursor-pointer rounded p-1 text-gray-400 transition-colors hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* The picked clip. A real <video> rather than a thumbnail: the picker
          hands back no poster for video, so an <img> here would be a broken
          frame, and being able to scrub the source before spending minutes
          rendering it is worth the element. `preload="metadata"` keeps that to
          a header read rather than the whole file. */}
      {kind === "video" && video && (
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 pb-3 pt-3">
          <video
            src={video.url}
            controls
            preload="metadata"
            className="h-16 w-28 shrink-0 rounded-lg bg-black object-cover"
          />
          <span className="min-w-0 flex-1 truncate text-xs text-gray-500">
            {/* Whatever the probe could read, and nothing invented when it
                couldn't — see probeVideo. */}
            {video.meta
              ? `Source video · ${formatDuration(video.meta.duration)} · ${video.meta.width}×${video.meta.height}`
              : "Source video ready"}
          </span>
          <button
            type="button"
            onClick={clearVideo}
            aria-label="Remove source video"
            className="shrink-0 cursor-pointer rounded p-1 text-gray-400 transition-colors hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {kind === "audio" && audio && (
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 pb-3 pt-3">
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

      {/* ⚠️ `rows` IS A FLOOR, NOT THE HEIGHT — `min-h` is what actually sets
          it, because a 2000-character script (Text to Audio's cap) in a
          three-row box is a peephole onto what you are about to generate. Four
          rows of room to read back what you wrote before committing to it.
          Still `resize-none`: the box floats over the canvas on the bottom
          edge, and a drag handle here would grow it up over the results. */}
      {typeable || promptable ? (
        <textarea
          // A required box gets a typed tool's room, because that is what it is
          // — the difference between a script and a footnote about a picture.
          rows={typeable || requiresPrompt ? 4 : 3}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={inputConfig.maxLength}
          placeholder={
            typeable || requiresPrompt
              ? inputConfig.placeholder || "Describe what you want…"
              : inputConfig.placeholder || "Add a description (optional)…"
          }
          aria-label={
            typeable || requiresPrompt
              ? inputConfig.label || `Input for ${tool.label}`
              : `Optional description for ${tool.label}`
          }
          className={`w-full resize-none bg-transparent px-5 pt-5 text-sm leading-relaxed text-gray-900 outline-none placeholder:text-gray-400 ${
            typeable || requiresPrompt ? "min-h-24" : "min-h-16"
          }`}
        />
      ) : null}

      {/* What this tool is still waiting for. ⚠️ IT SURVIVES THE DESCRIPTION
          BOX rather than being replaced by it: the box is optional and says
          nothing about whether a source image has been picked, so dropping this
          line would leave the describable tools with a disabled submit button
          and no explanation. It just shrinks to a footnote under the box
          instead of being the whole empty area. */}
      {!typeable && (
        <p
          className={
            promptable
              ? "px-5 pb-1 pt-1 text-xs text-gray-400"
              : "min-h-24 px-5 pt-5 text-sm text-gray-400"
          }
        >
          {kind === "image" && !image && (inputConfig.helper || "Choose a source image to begin.")}
          {/* ⚠️ ON A REQUIRED-PROMPT TOOL THE SOURCE IS ONLY HALF THE ANSWER, so
              "set your options, then generate" would be wrong the moment the
              picture lands and the box is still empty — the button stays
              disabled and this line would be the only thing claiming otherwise.
              It names the half that is missing instead. */}
          {/* A required SECOND input is the same problem again: the portrait is
              in and the button is still disabled, so this has to name the voice
              track rather than say everything is ready. */}
          {kind === "image" &&
            image &&
            (extraAudio && config.extraInput.required && !voiceTrack
              ? config.extraInput.helper || "Now add the voice track."
              : requiresPrompt && !text.trim()
                ? "Now write what you want above."
                : "Set your options, then generate.")}
          {kind === "video" &&
            !video &&
            (inputConfig.helper || "Choose a source video to begin.")}
          {kind === "video" && video && "Set your options, then generate."}
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
        <p className="mx-4 mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
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
      <div className="flex items-center gap-1 px-4 pb-4 pt-1">
        <div className="hide-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        {/* Source pickers, for the tools that need one. Icon-only like the
            setting chips beside them — the strip above the toolbar already
            shows what has been picked, so the button doesn't also have to say
            so in words.
            No busy state on this one: picking is instant now. The image the
            picker hands back is used as-is rather than copied to the gallery
            first, so there is nothing to wait on between Apply and the strip
            filling. */}
        {kind === "image" && (
          <button
            type="button"
            onClick={() => setPickerTarget("image")}
            aria-label={image ? "Replace source image" : "Choose a source image"}
            title={image ? "Replace source image" : "Choose a source image"}
            className="flex h-8 min-w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg px-1.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <ImagePlus className="h-4 w-4 shrink-0" />
          </button>
        )}

        {/* The second input, where a tool declares one — Digital Human's voice
            track. Same affordance as the pickers beside it, pointed at the audio
            library, and for the same reason as video: the picker's Library tab
            is also where a file gets uploaded, so one control covers "pick one
            I have" and "add a new one". Its Text to Audio card is how someone
            with no recording at all gets one (see MediaPickerModal). */}
        {extraAudio && (
          <button
            type="button"
            onClick={() => setPickerTarget("audio")}
            aria-label={
              voiceTrack
                ? "Replace the voice track"
                : config.extraInput.label || "Choose a voice track"
            }
            title={
              voiceTrack
                ? "Replace the voice track"
                : config.extraInput.helper || "Choose a voice track"
            }
            className={`flex h-8 min-w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg px-1.5 transition-colors hover:bg-gray-100 hover:text-gray-900 ${
              voiceTrack ? "text-blue-600" : "text-gray-600"
            }`}
          >
            <AudioLines className="h-4 w-4 shrink-0" />
          </button>
        )}

        {/* Same affordance as the image picker beside it, pointed at the video
            library. No device-upload button here on purpose: the picker's own
            Library tab uploads into the gallery, which is where these clips have
            to end up anyway to have a URL the backend can fetch. A second
            upload path in the composer would be the same job done twice. */}
        {kind === "video" && (
          <button
            type="button"
            onClick={() => setPickerTarget("video")}
            aria-label={video ? "Replace source video" : "Choose a source video"}
            title={video ? "Replace source video" : "Choose a source video"}
            className="flex h-8 min-w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg px-1.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <FileVideo className="h-4 w-4 shrink-0" />
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
              aria-label="Upload an audio file"
              title="Upload an audio file"
              className="flex h-8 min-w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg px-1.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <Upload className="h-4 w-4 shrink-0" />
            </button>
            {/* ⚠️ THE ONE CONTROL THAT KEEPS ITS WORDS, and only while running.
                An icon alone cannot say how long you have been recording, and
                that number is the whole feedback a mic take gives you — going
                icon-only here would leave a red square and no idea whether it
                has been going for four seconds or four minutes. */}
            <button
              type="button"
              onClick={() => (recorder.recording ? recorder.stop() : recorder.start())}
              aria-label={recorder.recording ? "Stop recording" : "Record from your mic"}
              title={recorder.recording ? "Stop recording" : "Record from your mic"}
              className={`flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-colors ${
                recorder.recording
                  ? "bg-red-50 px-2.5 text-red-600"
                  : "min-w-8 px-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {recorder.recording ? (
                <>
                  <Square className="h-3.5 w-3.5 shrink-0 fill-current" />
                  <span className="tabular-nums">{recorder.elapsed}s</span>
                </>
              ) : (
                <Mic className="h-4 w-4 shrink-0" />
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
            icon={User}
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
            // The config's own glyph first, then the shared one for that
            // setting. Neither → a text chip, which still works.
            icon={option.icon || OPTION_ICONS[option.key]}
            // ⚠️ SLIDERS WEAR THEIR VALUE; EVERYTHING ELSE WEARS ITS GLYPH. The
            // chip deliberately doesn't show the current choice (see its ⚠️) —
            // the open panel marks it with a tick. A continuous range has no
            // tick to read: the only way to know a clip is set to 7s and not 5s
            // would be to open the panel, on the one setting where the number
            // is the whole point before you hit send. Same call the variations
            // control makes with its "3x".
            badge={
              option.panel === "slider"
                ? summarize(option, values[option.key])
                : undefined
            }
            // The config declares how wide its panel needs to be — a grid of
            // style cards needs more room than a list of aspect ratios.
            width={option.width || 340}
          >
            <OptionPanelBody
              option={option}
              value={values[option.key]}
              voicePreview={voicePreview}
              onSelect={(val, opts) => {
                setValue(option.key, val);
                // ⚠️ ONE OPTION MAY WRITE INTO THE PROMPT BOX. A config declares
                // it with `promptFrom`, and Video Effects is why: an effect IS a
                // written prompt, so picking one fills the box with its words
                // and the user edits from there. That is what keeps the effect
                // editable instead of a black box, and it means what runs is
                // always exactly what is on screen.
                //
                // Only when there are words to seed — the "write your own" card
                // resolves to "" and must LEAVE the box alone rather than wipe
                // whatever was being typed in it.
                if (config?.promptFrom?.option === option.key) {
                  const seeded = config.promptFrom.resolve(val);
                  if (seeded) setText(seeded);
                }
                // ⚠️ AND ONE MAY SELECT THE SOURCE IMAGE. Video Effects is why:
                // a template is a prompt AND the frame it was written for, so
                // applying one has to set both or Generate runs those words
                // against whatever unrelated picture was already there. Same
                // rule as the prompt above — an empty resolve leaves the
                // current image alone rather than clearing it.
                if (config?.imageFrom?.option === option.key) {
                  const seededImage = config.imageFrom.resolve(val);
                  if (seededImage) handlePickedImage(seededImage);
                }
                // `keepOpen` comes from controls that fire continuously — a
                // colour drag, a hex being typed — where closing on the first
                // change would shut the panel before anything was chosen.
                if (!opts?.keepOpen) closePanel();
              }}
            />
          </ToolbarChip>
        ))}

        {/* How many to make at once. Its value IS its label — an icon here
            would hide the one number you need to see before hitting send, and
            "3x" is no wider than the glyph it replaces. */}
        {variationsEnabled && (
          <ToolbarChip
            open={openPanel === "variations"}
            onToggle={() => togglePanel("variations")}
            onClose={closePanel}
            label="Variations"
            badge={`${variations}x`}
            width={260}
          >
            {/* ⚠️ A SLIDER, NOT A LIST, AND THE RANGE IS WHY. Thirty options is
                a menu you scroll to answer "how many" — a question you already
                know the answer to before you open it. Dragging gets anywhere in
                the range in one gesture.
                ⚠️ IT DOES NOT CLOSE ON CHANGE. The old list closed the panel on
                pick, which is right for a discrete choice and fatal for a drag:
                `onChange` fires on every step, so the panel would vanish
                mid-gesture on whatever number you happened to pass through
                first. It closes on outside-click or Escape like everything
                else, once you have settled on a number. */}
            <div className="flex flex-col gap-2.5 px-3 pb-3 pt-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold tabular-nums text-gray-900">
                  {variations}x
                </span>
                <span className="min-w-0 truncate text-[11px] text-gray-400">
                  {variations === 1
                    ? "One at a time"
                    : `${variations} from the same prompt`}
                </span>
              </div>

              <input
                type="range"
                min={1}
                // Straight from the clamp that guards the payload, so widening
                // one can never leave the other behind.
                max={MAX_VARIATIONS}
                step={1}
                value={variations}
                onChange={(event) => setVariations(Number(event.target.value))}
                aria-label="How many to generate at once"
                className="w-full cursor-pointer accent-blue-600"
              />

              <div className="flex justify-between text-[10px] tabular-nums text-gray-400">
                <span>1</span>
                <span>{MAX_VARIATIONS}</span>
              </div>
            </div>
          </ToolbarChip>
        )}

        {/* Which model does the work. Last in the row, after the settings that
            describe WHAT is being made — this one is about how it gets made.
            ComposerDropdown rather than a ToolbarChip: it already renders the
            grouped Claude / GPT sections, and this is the same menu, the same
            persisted choice, as the composer on the home page.

            ⚠️ NOT SHOWN ON THE ON-DEVICE TOOLS. Audio to Text and Text to Audio
            never reach a hosted model — they run Whisper and Kokoro in a Web
            Worker on this machine, and the choice made here could not change
            what does the work if it tried. Offering it there is a control that
            claims to steer something it has no wire to, and picking "Opus 5"
            before transcribing would reasonably read as a promise that Opus is
            doing the transcribing.
            The preference itself is untouched — it is app-wide and shared with
            the home composer; this only stops drawing it where it is a lie. */}
        {/* shrink-0 wrapper: flex items shrink by default, and this row scrolls
            sideways — without it the model trigger squashes as options are
            added instead of the row simply getting longer. */}
        {!config?.onDevice && (
          <div className="shrink-0">
            <ComposerDropdown
              options={MODEL_OPTIONS}
              groups={MODEL_GROUPS}
              value={model}
              onChange={setModel}
              open={openPanel === "model"}
              onOpenChange={(next) =>
                next ? togglePanel("model") : closePanel()
              }
              ariaLabel="Choose a model"
              triggerLabel="Model"
            />
          </div>
        )}

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
      {pickerTarget && (
        <MediaPickerModal
          isOpen
          initialTab="library"
          // ⚠️ NO SEARCH TAB FOR VIDEO OR AUDIO. That tab is a Pexels IMAGE
          // search, so on those it would offer results that can never be picked.
          // The Library tab is also where a clip or a voice track gets uploaded,
          // which is the only route either has into these tools.
          tabs={
            pickerTarget === "image" ? ["search", "library"] : ["library"]
          }
          allowedTypes={[pickerTarget]}
          maxSelectable={1}
          activeBrand={activeBrand}
          onClose={() => setPickerTarget(null)}
          onCancel={() => setPickerTarget(null)}
          onApply={(images, media) => {
            const target = pickerTarget;
            setPickerTarget(null);
            // The picker returns two buckets and hands back objects, not URLs —
            // images land in the first, video and audio in the second. Which
            // one it came from doesn't matter; all we want is the first `src`.
            const picked = [...(images || []), ...(media || [])][0];
            const src = typeof picked === "string" ? picked : picked?.src;
            if (!src) {
              console.warn(`⚠️ [magic-studio] picker applied with no ${target}`);
              return;
            }
            if (target === "video") handlePickedVideo(src);
            else if (target === "audio") {
              setVoiceTrack({
                url: src,
                name: typeof picked === "string" ? "" : picked?.name || "",
              });
            } else handlePickedImage(src);
          }}
        />
      )}
    </div>
  );
}
