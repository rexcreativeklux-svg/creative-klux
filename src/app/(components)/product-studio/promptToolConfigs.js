/**
 * Per-tool configs for the shared {@link PromptToolModal} — Reshaping, Product
 * Poster and AI POD.
 *
 * Same idea as {@link ./onDeviceToolConfigs}: the modal owns the entire flow
 * (image slots, preset shelf, Quality / Size / Brand style, Generate, history
 * grid, tool switcher, mobile split), and each entry here supplies only what
 * actually differs between the three tools — copy, preset catalog, sample art,
 * and whether the tool takes a second reference image.
 *
 * Adding a fourth tool of this shape should be a new entry here plus a route in
 * the product-studio page, with no changes to PromptToolModal.
 *
 * ── `reference` ────────────────────────────────────────────────────────────
 * The one structural difference between these tools. When present, the modal
 * renders a SECOND optional image slot and, if the user fills it, sends the
 * hosted URL under `payloadKey`. Product Poster has none — a poster is driven
 * by the prompt alone. `stockQuery` seeds that slot's media picker separately
 * from the product slot (see TOOL_REFERENCE_STOCK_QUERIES in constants.js).
 *
 * ── `tool` vs `toolSave` ───────────────────────────────────────────────────
 * All three generate through the same backend engine, so all three send
 * `tool: "edit"`. That alone would merge their histories into one list, so each
 * also sends `tool_save` — the value the generation is recorded under, and
 * therefore the value its history is read back with. Keep them distinct per
 * tool; two tools sharing a `toolSave` would see each other's results.
 *
 * @typedef {object} PromptToolConfig
 * @property {string} toolId Routing id (page router, TOOL_LIST, tool switcher).
 * @property {string} tool Backend `tool` enum value sent on generate ("edit").
 * @property {string} toolSave Value sent as `tool_save`, and the tool's history key.
 * @property {string} title Modal heading + mobile header title.
 * @property {string} subtitle One-line description under the mobile title.
 * @property {string} promptId DOM id of the prompt textarea ("Change something").
 * @property {string} promptPlaceholder Empty-state text for the prompt box.
 * @property {string} [promptSuffix] Fixed instruction appended at SEND time only.
 * @property {string} templateLabel Heading over the preset shelf.
 * @property {string} templateBrowserTitle Heading in the "See all" browser.
 * @property {string} noTemplateLabel Caption on the "no preset" tile.
 * @property {Array} templates Preset catalog.
 * @property {Record<string, object>} templatesById Same catalog keyed by id.
 * @property {string[]} categories Tabs in the "See all" browser.
 * @property {{label: string, payloadKey: string, stockQuery: string}|null} reference
 * @property {string} angleInstruction Appended for the "Other angles" action.
 * @property {string} defaultSize Initial aspect-ratio id.
 * @property {string} aspectClass Tile aspect ratio in the history grid.
 * @property {string} filePrefix Download / save-to-gallery file-name prefix.
 * @property {string} generatingLabel Copy under the in-flight spinner.
 * @property {{before: string, after: string, headline: string, subtext: string}} sample
 */

import {
  TOOL_ENUM,
  TOOL_SAVE_ENUM,
  REFERENCE_IMAGE_KEY,
} from "@/(lib)/product-studio-api";
import { px, pxsq, TOOL_REFERENCE_STOCK_QUERIES } from "./constants";
import {
  RESHAPING_TEMPLATES,
  RESHAPING_TEMPLATES_BY_ID,
  RESHAPING_CATEGORIES,
} from "./reshapingTemplates";
import {
  POSTER_TEMPLATES,
  POSTER_TEMPLATES_BY_ID,
  POSTER_CATEGORIES,
} from "./posterTemplates";
import {
  POD_TEMPLATES,
  POD_TEMPLATES_BY_ID,
  POD_CATEGORIES,
  POD_SURFACE_INSTRUCTION,
} from "./podTemplates";

/** @type {Record<string, PromptToolConfig>} */
export const PROMPT_TOOLS = {
  reshaping: {
    toolId: "reshaping",
    tool: TOOL_ENUM.reshaping,
    toolSave: TOOL_SAVE_ENUM.reshaping,
    title: "Reshaping",
    subtitle: "Your product, rebuilt into a real e-commerce scene.",
    promptId: "reshaping-prompt",
    promptPlaceholder:
      "Describe the product scene you want, e.g. place the product on a marble bathroom counter in warm natural light",
    templateLabel: "Scene",
    templateBrowserTitle: "Scene template",
    noTemplateLabel: "No scene",
    templates: RESHAPING_TEMPLATES,
    templatesById: RESHAPING_TEMPLATES_BY_ID,
    categories: RESHAPING_CATEGORIES,
    reference: {
      label: "Scene Reference",
      payloadKey: REFERENCE_IMAGE_KEY,
      stockQuery: TOOL_REFERENCE_STOCK_QUERIES.reshaping,
    },
    angleInstruction:
      "Show the product from a different camera angle and perspective, keeping the same product, scene, lighting and styling.",
    defaultSize: "square",
    aspectClass: "aspect-square",
    filePrefix: "klux-reshaped",
    generatingLabel: "Reshaping your product…",
    sample: {
      before: px(13779113),
      after: px(39281882),
      headline: "Rebuild your product shot into a real scene",
      subtext:
        "Drop a plain packshot into a styled setting — or upload a scene reference and we'll match its look.",
    },
  },

  poster: {
    toolId: "poster",
    tool: TOOL_ENUM.poster,
    toolSave: TOOL_SAVE_ENUM.poster,
    title: "Product Poster",
    subtitle: "Your product, as a finished ad poster.",
    promptId: "product-poster-prompt",
    promptPlaceholder:
      "Describe the scene, atmosphere and promotional copy you want on the poster",
    templateLabel: "Poster style",
    templateBrowserTitle: "Poster style",
    noTemplateLabel: "No style",
    templates: POSTER_TEMPLATES,
    templatesById: POSTER_TEMPLATES_BY_ID,
    categories: POSTER_CATEGORIES,
    // A poster is driven entirely by its prompt — there is no second image to
    // reference, so this tool renders a single image slot.
    reference: null,
    angleInstruction:
      "Rework this poster with a different composition and camera angle, keeping the same product, colour palette, atmosphere and space for the headline.",
    // Posters are read tall — a 4:5 default matches the social placements these
    // are actually used for, rather than forcing a square crop.
    defaultSize: "portrait_3_4",
    aspectClass: "aspect-[3/4]",
    filePrefix: "klux-poster",
    generatingLabel: "Designing your poster…",
    sample: {
      before: px(13779102),
      after: px(20003244),
      headline: "Turn a plain packshot into an ad poster",
      subtext:
        "Cinema-quality campaign posters with the scene, atmosphere and copy space already composed.",
    },
  },

  pod: {
    toolId: "pod",
    tool: TOOL_ENUM.pod,
    toolSave: TOOL_SAVE_ENUM.pod,
    title: "AI POD",
    subtitle: "Your artwork, printed onto the product.",
    promptId: "ai-pod-prompt",
    promptPlaceholder:
      "Describe the pattern you want printed, e.g. cyberpunk city nightscape in neon colours",
    // Always sent, never shown in the box — see podTemplates.js for why the
    // "print onto the real surface" instruction has to ride on every request.
    promptSuffix: POD_SURFACE_INSTRUCTION,
    templateLabel: "Pattern",
    templateBrowserTitle: "Pattern style",
    noTemplateLabel: "No pattern",
    templates: POD_TEMPLATES,
    templatesById: POD_TEMPLATES_BY_ID,
    categories: POD_CATEGORIES,
    reference: {
      label: "Reference Pattern",
      payloadKey: REFERENCE_IMAGE_KEY,
      stockQuery: TOOL_REFERENCE_STOCK_QUERIES.pod,
    },
    angleInstruction:
      "Show the same printed product from a different camera angle, keeping the identical pattern, colours, material and lighting.",
    defaultSize: "square",
    aspectClass: "aspect-square",
    filePrefix: "klux-pod",
    generatingLabel: "Printing your design…",
    sample: {
      before: px(13787561),
      after: pxsq(5438789),
      headline: "Print your design onto any product",
      subtext:
        "Upload a blank item and describe a pattern — we fuse it onto the material, following its folds and lighting.",
    },
  },
};

/** The tool ids handled by PromptToolModal (used by the page router). */
export const PROMPT_TOOL_IDS = Object.keys(PROMPT_TOOLS);
