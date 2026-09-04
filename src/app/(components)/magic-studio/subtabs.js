/**
 * subtabs.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for the Magic Studio sub-tab bar rendered inside the
 * "Add Media" picker (MediaPickerModal). Each entry maps the picker's visible
 * sub-tab LABEL to the config id consumed by the shared Magic Studio "machine"
 * (getMagicConfig in magicStudioConfigs.jsx). Keeping the labels here — rather
 * than the hard-coded MAGIC_SUBTABS string array the picker used to carry —
 * means the tab order, labels, and their backing tool live in one place.
 *
 * The labels intentionally match the wording the picker showed before this
 * migration (e.g. "Script to Voiceover to Video", "Persona-based Generator") so
 * nothing visibly changes for users; only the tool behind each tab does.
 */

/** @typedef {{ label: string, id: string }} MagicSubTab */

/** @type {MagicSubTab[]} */
export const MAGIC_SUBTABS = [
  { label: "Text to Image", id: "text_to_image" },
  { label: "Text to Audio", id: "text_to_audio" },
  { label: "Text to Video", id: "text_to_video" },
  { label: "Image to Variations", id: "image_to_variations" },
  { label: "Script to Voiceover to Video", id: "script_to_voiceover" },
  { label: "Audio to Text", id: "audio_to_text" },
  { label: "Persona-based Generator", id: "persona_generator" },
  // ── The video tools ────────────────────────────────────────────────────────
  // ⚠️ ONLY THE THREE THAT START FROM AN IMAGE. Video Background Remover and
  // Video Enhancer both take a VIDEO as their source, and this panel has no
  // video input — it renders one attach control per `config.input` and would
  // show those two as a tool with options and nothing to run them on. They stay
  // on their own routes, where the composer does have that input. Adding them
  // here needs the video branch mirrored into MagicTabPanel first.
  { label: "Image to Video", id: "image_to_video" },
  { label: "Digital Human Video", id: "digital_human" },
  { label: "Video Effects", id: "video_effects" },
];

/** Resolve the config id for a sub-tab label (null when unknown). */
export const configIdForLabel = (label) =>
  MAGIC_SUBTABS.find((t) => t.label === label)?.id || null;
