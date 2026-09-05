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
 * plus, where the tool declares them, a Logo chip (type the brand mark, or pick
 * one out of the media picker) and the app-wide model menu at the end of the
 * row. Both are opt-in per tool: `logo: true` puts the first there, and
 * `model: false` takes the second away where the payload has no field for it.
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
  Drama,
  FileText,
  Gauge,
  Gem,
  ImagePlus,
  Languages,
  LayoutGrid,
  Loader2,
  Mic,
  Palette,
  SwatchBook,
  Ratio,
  Sparkles,
  Square,
  Stamp,
  Target,
  Type,
  Upload,
  User,
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
import { OptionPanelBody } from "@/app/(components)/magic-studio/magicPanelUI";
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
   * WHAT the media picker is being opened for — "source" | "logo" | null.
   *
   * ⚠️ ONE PICKER, NOT TWO. Both answers are "an image, from the library or
   * Pexels or an upload", and the modal is heavy enough that mounting a second
   * copy of it to answer the same question twice is waste; what differs is only
   * where the URL lands when Apply is pressed. A bare `pickerOpen` boolean
   * cannot say that, which is how the logo would end up replacing the source
   * image on a tool that has both.
   */
  const [pickerFor, setPickerFor] = useState(null);

  // ── The logo, for the tools that offer one (config.logo) ───────────────────
  // Either words to set as the mark, or a picture of one — never both, because
  // the payload carries a single `logo` field and two answers to one question
  // is a choice the backend would have to make on the user's behalf.
  const logoEnabled = config?.logo === true;
  const [logoMode, setLogoMode] = useState(null); // null | "text" | "image"
  const [logoText, setLogoText] = useState("");
  const [logoImage, setLogoImage] = useState(null); // hosted URL
  /** What actually goes up as `logo` — "" while the chip is untouched. */
  const logoValue =
    logoMode === "text"
      ? logoText.trim()
      : logoMode === "image"
        ? logoImage || ""
        : "";

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
  /**
   * Whether this tool draws the model menu at all.
   *
   * ⚠️ TWO WAYS TO LOSE IT, AND THEY ARE DIFFERENT REASONS. The on-device tools
   * can't be steered by it (Whisper and Kokoro run here, in a Web Worker), and a
   * tool can also opt out with `model: false` when the backend picks the model
   * itself and the payload has no field to carry a choice — which is Text to
   * Image. Either way the preference itself is untouched: it is app-wide and
   * shared with the home composer, and this only stops DRAWING a control that
   * has nothing on the other end of it.
   */
  const modelEnabled = !config?.onDevice && config?.model !== false;

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
   * A logo image came back from the picker.
   *
   * Sent by the URL the picker handed over, exactly like the source image above
   * — see the ⚠️ on handlePickedImage for why nothing is copied into the gallery
   * on the way, and what to check if a searched logo fails where a library one
   * works.
   */
  const handlePickedLogo = (src) => {
    if (!src) return;
    console.log("🔖 [magic-studio] logo image:", src);
    setLogoImage(src);
    setLogoMode("image");
  };

  /** Back to "no logo at all" — not back to the chooser, which is `setLogoMode(null)`
   *  with the text and image already cleared. */
  const clearLogo = () => {
    setLogoMode(null);
    setLogoText("");
    setLogoImage(null);
  };

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
    if (kind === "image") return !!image?.url;
    if (kind === "audio") return !!audio;
    if (kind === "persona") return !!values.personaName?.trim();
    return true;
  })();

  const submit = () => {
    if (!ready) return;
    closePanel();
    // The model is only named on the tools that actually offer the menu — see
    // the `model: false` note in the configs. Naming it on a tool that doesn't
    // send one makes the log claim a choice that was never made.
    console.log(
      `✨ [magic-studio] generating with "${tool.label}"${
        modelEnabled ? ` (${model})` : ""
      }${logoValue ? ` · logo: ${logoValue}` : ""}`,
    );
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
        // Only the describable tools carry one. On a typed tool these same
        // words are the primary input and go up as `prompt` — sending them
        // twice under two names would be the same brief, doubled.
        ...(describable ? { description: typed } : {}),
        // Words or a picked image URL, whichever the Logo chip was answered
        // with; "" while it is untouched, and the config's `logoField` drops it
        // from the payload entirely in that case.
        ...(logoEnabled ? { logo: logoValue } : {}),
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

      {/* The chosen logo, in the same strip as a source image and for the same
          reason: it rides on every run from here until it is cleared, and a
          brand mark silently applied to a generation you thought was plain is
          the kind of thing you only notice in the result. A picked mark shows
          as itself; typed words show as the words. */}
      {logoEnabled && logoValue && (
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 pb-3 pt-3">
          {logoMode === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoImage}
              alt="Logo"
              // `contain` on a light tile, not `cover` — a logo cropped to fill
              // a square is a logo with its edges cut off.
              className="h-12 w-12 shrink-0 rounded-lg border border-gray-100 bg-gray-50 object-contain p-1"
            />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-gray-400">
              <Type className="h-5 w-5" />
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-xs text-gray-500">
            {logoMode === "image" ? "Logo image ready" : `Logo: ${logoText.trim()}`}
          </span>
          <button
            type="button"
            onClick={clearLogo}
            aria-label="Remove logo"
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
      {typeable || describable ? (
        <textarea
          rows={typeable ? 4 : 3}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={inputConfig.maxLength}
          placeholder={
            typeable
              ? inputConfig.placeholder || "Describe what you want…"
              : inputConfig.placeholder || "Add a description (optional)…"
          }
          aria-label={
            typeable
              ? inputConfig.label || `Input for ${tool.label}`
              : `Optional description for ${tool.label}`
          }
          className={`w-full resize-none bg-transparent px-5 pt-5 text-sm leading-relaxed text-gray-900 outline-none placeholder:text-gray-400 ${
            typeable ? "min-h-24" : "min-h-16"
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
            describable
              ? "px-5 pb-1 pt-1 text-xs text-gray-400"
              : "min-h-24 px-5 pt-5 text-sm text-gray-400"
          }
        >
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
            onClick={() => setPickerFor("source")}
            aria-label={image ? "Replace source image" : "Choose a source image"}
            title={image ? "Replace source image" : "Choose a source image"}
            className="flex h-8 min-w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg px-1.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <ImagePlus className="h-4 w-4 shrink-0" />
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
                // `keepOpen` comes from controls that fire continuously — a
                // colour drag, a hex being typed — where closing on the first
                // change would shut the panel before anything was chosen.
                if (!opts?.keepOpen) closePanel();
              }}
            />
          </ToolbarChip>
        ))}

        {/* The brand mark to work into the result. ⚠️ TWO KINDS OF ANSWER
            BEHIND ONE CHIP: type the name, or pick a picture of the logo. They
            are asked for one at a time rather than as two fields — the payload
            carries a single `logo`, so two filled boxes would be a question the
            backend has to answer on the user's behalf. Picking one REPLACES the
            other, and the chooser is what you come back to via Clear. */}
        {logoEnabled && (
          <ToolbarChip
            open={openPanel === "logo"}
            onToggle={() => togglePanel("logo")}
            onClose={closePanel}
            label="Logo"
            icon={Stamp}
            width={300}
          >
            <div className="flex flex-col gap-2 p-3">
              {logoMode === null && (
                <>
                  <p className="text-[11px] leading-relaxed text-gray-500">
                    Add your brand mark — type it, or pick the image.
                  </p>
                  <button
                    type="button"
                    onClick={() => setLogoMode("text")}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 px-3 py-2.5 text-left transition-all hover:border-blue-400 hover:bg-blue-50/40"
                  >
                    <Type className="h-4 w-4 shrink-0 text-gray-500" />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-gray-900">
                        Enter text
                      </span>
                      <span className="block text-[11px] text-gray-500">
                        Set the brand name as the mark
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // The picker is a modal and this panel is a portal that
                      // closes on outside click — leaving it open would put a
                      // floating panel over the modal until the first click
                      // dismissed it.
                      closePanel();
                      setPickerFor("logo");
                    }}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 px-3 py-2.5 text-left transition-all hover:border-blue-400 hover:bg-blue-50/40"
                  >
                    <ImagePlus className="h-4 w-4 shrink-0 text-gray-500" />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-gray-900">
                        Choose a logo
                      </span>
                      <span className="block text-[11px] text-gray-500">
                        From your library, the web, or upload one
                      </span>
                    </span>
                  </button>
                </>
              )}

              {logoMode === "text" && (
                <>
                  <span className="text-[11px] font-medium text-gray-500">
                    Logo text
                  </span>
                  <input
                    // The panel opened for exactly one reason — to type this.
                    autoFocus
                    value={logoText}
                    onChange={(event) => setLogoText(event.target.value)}
                    // ⚠️ ENTER CLOSES THE PANEL, IT DOES NOT GENERATE. The
                    // composer's Enter-to-send lives on the textarea alone, and
                    // finishing a logo is not the same gesture as committing to
                    // a paid run.
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        closePanel();
                      }
                    }}
                    maxLength={60}
                    placeholder="e.g. Creative Klux"
                    className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-blue-400"
                  />
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        closePanel();
                        setPickerFor("logo");
                      }}
                      className="cursor-pointer text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      Use an image instead
                    </button>
                    <button
                      type="button"
                      onClick={clearLogo}
                      className="cursor-pointer text-[11px] font-semibold text-gray-400 hover:text-red-600"
                    >
                      Clear
                    </button>
                  </div>
                </>
              )}

              {logoMode === "image" && (
                <>
                  <div className="flex items-center gap-2.5 rounded-lg border border-gray-200 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoImage}
                      alt="Chosen logo"
                      className="h-10 w-10 shrink-0 rounded-md bg-gray-50 object-contain p-0.5"
                    />
                    <span className="min-w-0 flex-1 text-[11px] text-gray-500">
                      This mark rides on every run until you clear it.
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        closePanel();
                        setPickerFor("logo");
                      }}
                      className="cursor-pointer text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLogoImage(null);
                        setLogoMode("text");
                      }}
                      className="cursor-pointer text-[11px] font-semibold text-gray-500 hover:text-gray-900"
                    >
                      Type text instead
                    </button>
                    <button
                      type="button"
                      onClick={clearLogo}
                      className="cursor-pointer text-[11px] font-semibold text-gray-400 hover:text-red-600"
                    >
                      Clear
                    </button>
                  </div>
                </>
              )}
            </div>
          </ToolbarChip>
        )}

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
            A tool can also opt out with `model: false` — Text to Image does,
            because the backend picks the model there and its payload has no
            field to carry a choice. Both cases are `modelEnabled`.
            The preference itself is untouched — it is app-wide and shared with
            the home composer; this only stops drawing it where it is a lie. */}
        {/* shrink-0 wrapper: flex items shrink by default, and this row scrolls
            sideways — without it the model trigger squashes as options are
            added instead of the row simply getting longer. */}
        {modelEnabled && (
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
      {pickerFor && (
        <MediaPickerModal
          isOpen
          initialTab="library"
          tabs={["search", "library"]}
          allowedTypes={["image"]}
          maxSelectable={1}
          activeBrand={activeBrand}
          onClose={() => setPickerFor(null)}
          onCancel={() => setPickerFor(null)}
          onApply={(images, media) => {
            // Read before it's cleared — the state update below is what closes
            // the modal, and the handler still has to know which question was
            // being answered.
            const target = pickerFor;
            setPickerFor(null);
            // The picker returns two buckets and hands back objects, not URLs —
            // whichever produced the pick, all we want is the first `src`.
            const picked = [...(images || []), ...(media || [])][0];
            const src = typeof picked === "string" ? picked : picked?.src;
            if (!src) {
              console.warn("⚠️ [magic-studio] picker applied with no image");
              return;
            }
            if (target === "logo") handlePickedLogo(src);
            else handlePickedImage(src);
          }}
        />
      )}
    </div>
  );
}
