"use client";

// app/(components)/studio/PromptComposer.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The prompt box on the AI Select page — the page's primary control.
//
// Layout (single card):
//   ┌──────────────────────────────────────────────┐
//   │ [attachment chips, only when files attached] │
//   │ Describe what you want to create…            │
//   │ ────────────────────────────────────────────  │
//   │ Model ▾ │ +            Build ▾  🎙  ↑        │
//   └──────────────────────────────────────────────┘
//
// Each control is wired to a real capability:
//   Model  → placeholder tiers, folded into Claude / GPT sections. The choice is
//            APP-WIDE and remembered between visits (composerModel.js), not this
//            component's own state, so every composer shows the same one. It
//            rides along on the URL as ?model=.
//   +      → uploads IMAGES to the user's gallery (useGalleryUpload) and keeps
//            the returned hosted URLs as attachments on the prompt. Images only,
//            max 10 — the chat API takes an `images` array and nothing else.
//   Build  → Build (generate now) vs Plan (plan first); rides along as ?mode=.
//   🎙     → dictation (useVoiceInput): live where the browser supports it,
//            on-device Whisper everywhere else.
//   ↑      → submits.
//
// Submitting hands everything to the parent via
// onSubmit({ prompt, model, mode, images }); this component owns no routing so
// it can be dropped onto another surface unchanged. Text is required — images
// alone can't be sent, because the API's `message` is `required|string`.

import { useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  ArrowUp,
  FileText,
  Film,
  Loader2,
  Music,
  Paperclip,
  Plus,
  X,
} from "lucide-react";
import ComposerDropdown from "./ComposerDropdown";
import VoiceMicButton from "./VoiceMicButton";
// The model list AND the choice itself — the choice is app-wide and persisted,
// so it is deliberately NOT this component's own state. See composerModel.js.
import {
  MODEL_GROUPS,
  MODEL_OPTIONS,
  useComposerModel,
} from "./composerModel";
import useGalleryUpload from "./useGalleryUpload";
import useVoiceInput, { describeVoiceState } from "./useVoiceInput";
import {
  CHAT_ATTACHMENT_ACCEPT,
  CHAT_ATTACHMENT_CATEGORIES,
  MAX_CHAT_IMAGES,
  MAX_CHAT_MESSAGE,
  toImagePayload,
} from "./attachmentUrls";

/** What the assistant does with the prompt — mirrors the reference's Build/Plan. */
export const MODE_OPTIONS = [
  { id: "build", label: "Build", description: "Start creating immediately" },
  { id: "plan", label: "Plan", description: "Draft a plan before creating" },
];

/** Icon per non-image attachment category (images render their own thumbnail). */
const CATEGORY_ICON = { video: Film, audio: Music, document: FileText };

/**
 * How tall the prompt box may grow before it starts scrolling, in px. Applied
 * as an inline max-height AND used as the auto-grow clamp, so the two can't
 * drift apart the way a utility class + a JS literal would.
 */
const DEFAULT_MAX_HEIGHT = 200;

/**
 * Viewports the composer must NOT auto-focus on (see the effect below). A media
 * query list — either clause matching is enough:
 *
 *   pointer: coarse   a touch primary pointer: phones and tablets, the devices
 *                     with a soft keyboard to raise. This is the real signal.
 *   max-width         the app's `lg` sidebar breakpoint minus a pixel, so
 *                     "mobile" here means the same thing it means in the
 *                     layout. Belt and braces: it also covers a touch device
 *                     whose browser reports its pointer as fine.
 *
 * A desktop window dragged narrower than 1024px therefore doesn't autofocus
 * either — it is showing the mobile layout, so that reads as consistent rather
 * than as a miss.
 */
const NO_AUTOFOCUS_QUERY = "(pointer: coarse), (max-width: 1023px)";

/**
 * The panel's skins. Each variant replaces the border/background/shadow set
 * wholesale rather than appending to it — two background utilities at equal
 * specificity would otherwise be decided by Tailwind's emit order, which the
 * call site can't control. `field` is the prompt's type scale, kept in the same
 * table so the placeholder overlay can't drift from the textarea it stands in
 * for.
 *
 *   solid  the original card. Opaque, at rest on a plain page.
 *   glass  floats over artwork: translucent and blurred, so the backdrop shows
 *          through while the text on top stays fully legible.
 *   inset  lives INSIDE a ComposerShell tray. No border and NO shadow in either
 *          state, because the tray around it already draws both — a second edge
 *          6px inside the first is what makes an assembly look like two things
 *          stacked instead of one object. OPAQUE, and deliberately the only
 *          opaque surface in that assembly: the tray's translucent rim reads as
 *          a rim precisely because the thing it surrounds is solid white.
 */
const PANEL_VARIANTS = {
  solid: {
    base: "rounded-2xl border bg-surface transition-shadow duration-200",
    focused: "border-blue-500/60 shadow-[0_8px_30px_rgba(0,61,218,0.10)]",
    resting: "border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.05)]",
    field: "text-sm",
    pad: "px-4 pt-4",
  },
  glass: {
    base: "rounded-[20px] border bg-surface/72 backdrop-blur-2xl transition-all duration-300",
    focused: "border-blue-500/45 shadow-[0_28px_70px_-24px_rgba(0,61,218,0.42)]",
    // NO shadow at rest, on purpose: the panel should sit flat in the hero and
    // only lift once the user is actually typing in it. `base` transitions
    // `all`, so the shadow grows in rather than snapping on at focus.
    resting: "border-gray-200/70",
    field: "text-sm",
    pad: "px-4 pt-4",
  },
  inset: {
    // Radius = the tray's 21px minus its 6px padding, so the two curves are
    // concentric. Change one and change the other — TRAY_SHAPE and TRAY_PAD in
    // ComposerShell.jsx. All four corners: the tray's squared top-left is an
    // OUTER-edge fix (a tab overhangs it), and this sits 6px inside that edge
    // with rim on every side, so it has nothing to square off against.
    base: "rounded-[15px] bg-surface",
    focused: "",
    resting: "",
    field: "text-[15px]",
    pad: "px-5 pt-5",
  },
};

/**
 * @param {object} props
 * @param {(payload: {prompt: string, model: string, mode: string, attachments: string[]}) => void} props.onSubmit
 * @param {string} [props.placeholder]
 * @param {boolean} [props.autoFocus] Focus the prompt on mount. Desktop only —
 *   always ignored on a touch/mobile viewport (see NO_AUTOFOCUS_QUERY).
 * @param {number} [props.rows]       Resting height of the prompt box, in rows.
 * @param {number} [props.maxHeight]  Growth ceiling in px before it scrolls.
 * @param {"solid"|"glass"|"inset"} [props.variant] Panel skin — see PANEL_VARIANTS.
 * @param {(focused: boolean) => void} [props.onFocusedChange] Told whenever the
 *   prompt gains or loses focus. `inset` draws no focus state of its own, so the
 *   shell around it is what reacts — this is the wire between the two.
 * @param {boolean} [props.showModelPicker] Show the model menu. Hiding it does
 *   NOT drop the field from the payload — `model` still travels, at its default.
 * @param {boolean} [props.showModePicker]  Same for the Build/Plan menu.
 * @param {boolean} [props.submitting] The PARENT is still handling the last
 *   submit — send turns into a spinner and neither the button nor Enter can fire
 *   again until it clears. For work the parent does before the user goes
 *   anywhere: the home page's Import Site tab scrapes the pasted link and only
 *   then navigates, which is a wait with nothing else on screen to show it.
 * @param {boolean} [props.showHint] Show the "Enter to send" line underneath.
 *   ⚠️ Turning it off removes the whole status row, dictation's "Recording…"
 *   included. The mic itself still turns into a red stop button and the
 *   placeholder still reads "Listening — start speaking…", so a take is never
 *   unannounced, but if a surface needs the transcribing state spelled out in
 *   words it must keep this on.
 * @param {React.Ref<{setPrompt: (text: string) => void, appendPrompt: (text: string) => void, clear: () => void, focus: () => void}>} [props.ref]
 *   Optional handle for a parent that needs to WRITE into the box — the home
 *   page's "Active Brand" tab seeds it with the brand's details and clears it
 *   again on the way out, and its starter-prompt chips replace it outright.
 *   Deliberately imperative rather than a `value`/`onChange` pair: the prompt is
 *   this component's own state on every other surface, and lifting it would make
 *   every call site responsible for it.
 */
export default function PromptComposer({
  onSubmit,
  placeholder = "Describe the creative you want to make…",
  autoFocus = true,
  rows = 4,
  maxHeight = DEFAULT_MAX_HEIGHT,
  variant = "solid",
  onFocusedChange,
  showModelPicker = true,
  showModePicker = true,
  submitting = false,
  showHint = true,
  ref,
}) {
  const [value, setValue] = useState("");
  // Shared across every composer in the app and remembered between visits —
  // hence a store rather than useState. Shaped like useState all the same, so
  // everything below reads exactly as it did.
  const [model, setModel] = useComposerModel();
  const [mode, setMode] = useState(MODE_OPTIONS[0].id);
  const [openMenu, setOpenMenu] = useState(null); // "model" | "mode" | null
  const [focused, setFocused] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  // Set by a WRITER (setPrompt) to mean "when the box has finished re-measuring,
  // show the FIRST line of what was just written". See scrollToTop below.
  const revealTopRef = useRef(false);

  const { attachments, uploading, addFiles, removeAttachment, clearAttachments } =
    useGalleryUpload({
      allowedCategories: CHAT_ATTACHMENT_CATEGORIES,
      maxFiles: MAX_CHAT_IMAGES,
    });
  const voice = useVoiceInput({ onText: setValue });
  const voiceStatus = describeVoiceState(voice);

  // What the box is prompting with right now — dictation takes over the line
  // while the mic is live, whatever the call site passed. The home page's tabs
  // change it on every switch; the fade that carries that change is a `key` on
  // the placeholder span, so it costs no state and no timer (see the render).
  const wantedPlaceholder = voice.listening
    ? "Listening — start speaking…"
    : placeholder;

  /**
   * Focus the prompt and park the caret at the end of whatever is in it.
   *
   * Deferred by a frame on purpose: React has not committed the new value at
   * the point the writers below call this, so setSelectionRange run now would
   * measure the PREVIOUS text and leave the caret short of the end.
   *
   * @param {{revealTop?: boolean}} [options] `revealTop` scrolls the box back to
   *   its first line once the caret is placed — see scrollToTop.
   */
  const caretToEnd = ({ revealTop = false } = {}) => {
    if (revealTop) revealTopRef.current = true;
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      // Focusing scrolls the caret into view, and the caret is at the BOTTOM of
      // what was just written, so this has to run after it rather than instead
      // of it.
      if (revealTop) scrollToTop();
    });
  };

  /**
   * Scroll the box back to its first line, and forget any pending request to.
   *
   * Text written in by a parent can easily be taller than the box — the home
   * page's Brand Kit tab seeds eight-odd lines into a four-row composer — and
   * what shows then decides whether the user can tell the seed landed at all.
   * The first line is the one that says so ("Brand: <their brand>"), so that is
   * the line the box opens on. The caret still sits at the END of the block, so
   * typing scrolls down to it and the user's own instructions carry on under the
   * details, exactly as before.
   */
  const scrollToTop = () => {
    revealTopRef.current = false;
    if (textareaRef.current) textareaRef.current.scrollTop = 0;
  };

  // Let a parent write into the box. Only mounted when the call site passes a
  // ref; every other surface keeps the prompt as private state.
  useImperativeHandle(
    ref,
    () => ({
      /**
       * Replace the prompt, focus it, and drop the caret at the end — but leave
       * the box showing its FIRST line, not the caret's. What gets written here
       * is a block the user did not type (a seeded brand, a starter prompt), so
       * it has to be recognisable at a glance before it is editable.
       */
      setPrompt(text) {
        setValue(String(text ?? "").slice(0, MAX_CHAT_MESSAGE));
        caretToEnd({ revealTop: true });
      },
      /**
       * Add to the prompt instead of replacing it — on its own line when there
       * is already something there.
       *
       * The home page's starter chips use this on the Import Site and Brand Kit
       * tabs, where the box already holds something the chip refers to (a pasted
       * URL, the seeded brand block) and setPrompt would destroy it. Ai Chat
       * still uses setPrompt, because there the chip is the entire prompt.
       */
      appendPrompt(text) {
        const addition = String(text ?? "").trim();
        if (!addition) return;
        setValue((current) => {
          const next = current.trim() ? `${current.trimEnd()}\n${addition}` : addition;
          return next.slice(0, MAX_CHAT_MESSAGE);
        });
        caretToEnd();
      },
      /** Empty the prompt. Attachments are left alone — they are the user's. */
      clear() {
        setValue("");
      },
      focus() {
        textareaRef.current?.focus();
      },
    }),
    [],
  );

  // Auto-grow the textarea with its content, up to a readable ceiling.
  // `rows`/`maxHeight` are in the deps so a page that changes either still
  // re-measures instead of waiting for the next keystroke.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;

    // The other half of setPrompt's "open on the first line". React does not
    // promise whether this effect or caretToEnd's animation frame runs first,
    // and re-measuring the height is itself something that can move scrollTop —
    // so the reset is claimed from BOTH sides and whichever lands last wins.
    // They set the same value, so there is no order to get wrong.
    if (revealTopRef.current) scrollToTop();
  }, [value, rows, maxHeight]);

  // Focus the prompt on mount — DESKTOP ONLY, never on a phone or tablet.
  //
  // On a touch device an unasked-for focus is a net loss: it can raise the soft
  // keyboard over the page, and the browser may scroll the textarea to the
  // viewport edge to make room, taking the greeting above it off screen before
  // the user has done anything. `autoFocus` still gates the behaviour; this is
  // a second gate the call site doesn't have to know about, so every surface
  // that mounts a composer gets the same rule.
  useEffect(() => {
    if (!autoFocus) return;
    if (window.matchMedia(NO_AUTOFOCUS_QUERY).matches) {
      console.log("⌨️ [composer] autofocus skipped — touch/mobile viewport");
      return;
    }
    textareaRef.current?.focus();
  }, [autoFocus]);

  const busy = uploading || voice.transcribing || submitting;
  // Text is REQUIRED — the API's `message` is `required|string`, so images alone
  // is not a sendable request. Attaching without typing leaves send disabled.
  const canSubmit = value.trim().length > 0 && !busy;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      prompt: value.trim(),
      model,
      mode,
      // Images travel as their own list, never folded into the prompt text.
      images: toImagePayload(attachments),
    });
    setValue("");
    clearAttachments();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const panel = PANEL_VARIANTS[variant] ?? PANEL_VARIANTS.solid;

  return (
    <div className="w-full">
      <div
        className={`${panel.base} ${focused ? panel.focused : panel.resting}`}
      >
        {/* Attachment chips — one row that scrolls sideways, never wraps, so the
            composer keeps its height no matter how many files are attached. */}
        {attachments.length > 0 && (
          <div className="hide-scrollbar flex gap-2 overflow-x-auto border-b border-gray-100 px-3 pb-3 pt-3">
            {attachments.map((item) => {
              const Icon = CATEGORY_ICON[item.category] || Paperclip;
              return (
                <div
                  key={item.id}
                  className="group relative flex w-44 shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-1.5 pr-7"
                >
                  {item.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="h-7 w-7 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-gray-200">
                      <Icon className="h-3.5 w-3.5 text-gray-500" />
                    </span>
                  )}
                  <span className="truncate text-[11px] font-medium text-gray-700">
                    {item.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 transition-colors hover:text-red-600 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Prompt.
            The placeholder is a SIBLING SPAN, not the textarea's own attribute:
            a native ::placeholder can change colour but it cannot cross-fade
            between two different strings, and the home page's tabs swap the line
            on every switch. The textarea therefore carries an aria-label instead
            — which is the better label for a screen reader either way — and the
            span is aria-hidden so the line is never announced twice.
            Positioned to the textarea's own text origin (px-4 / pt-4) and given
            the same size and leading, so it sits exactly where typing starts. */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={rows}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setFocused(true);
              onFocusedChange?.(true);
            }}
            onBlur={() => {
              setFocused(false);
              onFocusedChange?.(false);
            }}
            aria-label={wantedPlaceholder}
            maxLength={MAX_CHAT_MESSAGE}
            style={{ maxHeight }}
            className={`w-full resize-none bg-transparent leading-relaxed text-gray-900 outline-none ${panel.field} ${panel.pad}`}
          />

          {!value && (
            // `key` is the whole animation: change the line and React swaps the
            // element, so the new one plays ck-fade-in from scratch. No state,
            // no timer, and nothing to clean up when the user switches tabs
            // faster than the fade can finish.
            // It takes the textarea's OWN padding rather than matching offsets,
            // so the two can never drift apart when a variant changes the pad.
            <span
              key={wantedPlaceholder}
              aria-hidden="true"
              className={`animate-ck-fade-in pointer-events-none absolute inset-0 line-clamp-2 leading-relaxed text-gray-400 ${panel.field} ${panel.pad}`}
            >
              {wantedPlaceholder}
            </span>
          )}
        </div>

        {/* Toolbar.
            Attach, mic and send are ROUND — outlined circles for the two that
            only offer something, a filled one for send, which is the only
            control here that commits anything. The model and mode menus stay
            plain text triggers so the three circles read as the toolbar's
            actions and the two menus as its settings.
            Either menu can be hidden; `model` and `mode` still travel in the
            submit payload at their defaults, so a surface that turns them off
            doesn't change the request it makes. */}
        <div className="flex items-center gap-2 px-3 pb-3 pt-1.5">
          {/* Model — FIRST, ahead of attach. It is the only control here that
              changes what the request does rather than what it carries, so it
              leads the row and the three round buttons follow it. */}
          {showModelPicker && (
            <>
              <ComposerDropdown
                options={MODEL_OPTIONS}
                groups={MODEL_GROUPS}
                value={model}
                onChange={setModel}
                open={openMenu === "model"}
                onOpenChange={(next) => setOpenMenu(next ? "model" : null)}
                ariaLabel="Choose a model"
                // The trigger keeps saying "Model", before and after a choice —
                // it names the setting rather than reporting the value, which is
                // what keeps the toolbar the same width whichever model is on.
                // The tick inside the menu is where the current one is shown.
                triggerLabel="Model"
              />

              {/* Divider — it separates the model menu from attach, so it goes
                  with the menu rather than living on its own. */}
              <span className="h-5 w-px shrink-0 bg-gray-200" />
            </>
          )}

          {/* Attach */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Attach images from your device"
            title={`Attach images (up to ${MAX_CHAT_IMAGES})`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4.5 w-4.5" />
            )}
          </button>

          <div className="flex-1" />

          {/* Build / Plan */}
          {showModePicker && (
            <ComposerDropdown
              options={MODE_OPTIONS}
              value={mode}
              onChange={setMode}
              open={openMenu === "mode"}
              onOpenChange={(next) => setOpenMenu(next ? "mode" : null)}
              ariaLabel="Choose what happens on submit"
            />
          )}

          {/* Voice */}
          <VoiceMicButton
            voice={voice}
            onToggle={() => voice.toggle(value)}
            size="lg"
            shape="round"
          />

          {/* Send */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-label="Start creating"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all ${
              canSubmit
                ? "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Hidden picker — images only, because the chat API carries an `images`
            array and nothing else. useGalleryUpload enforces the same rule for
            anything that gets past the dialog (drag-drop, "All files"). */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={CHAT_ATTACHMENT_ACCEPT}
          className="hidden"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = ""; // let the same file be picked again
          }}
        />
      </div>

      {/* Status line — one row, so the layout never jumps between states.
          Dropped entirely when the call site turns the hint off; see the
          showHint note in the props above for what goes with it. */}
      <div
        className={`mt-2.5 flex min-h-4.5 items-center justify-center gap-2 text-[11px] ${
          showHint ? "" : "hidden"
        }`}
      >
        {voiceStatus ? (
          <span
            className={`flex items-center gap-2 font-medium ${
              voiceStatus.tone === "recording" ? "text-red-500" : "text-gray-500"
            }`}
          >
            {voiceStatus.tone === "recording" && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
            )}
            {voiceStatus.text}
          </span>
        ) : (
          <span className="text-gray-400">
            Enter to send · Shift + Enter for a new line
          </span>
        )}
      </div>
    </div>
  );
}
