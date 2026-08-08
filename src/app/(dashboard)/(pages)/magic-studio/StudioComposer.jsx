"use client";

/**
 * StudioComposer — the input at the foot of a Magic Studio tool's canvas.
 * ─────────────────────────────────────────────────────────────────────────────
 * It talks to THE TOOL YOU ARE ON, and it is not the same control on every one
 * of them — which it can't be. Four of the seven start from text, but Image to
 * Variations starts from a picture, Audio to Text from a recording, and the
 * Persona generator from a structured form. A single prompt box across all seven
 * would be lying on three of them.
 *
 * ⚠️ THE SHAPE IS READ FROM THE TOOL'S OWN CONFIG (`input`, `inputConfig`) in
 * magicStudioConfigs.jsx — the same block the modal builds its form from. That
 * is deliberate and worth keeping: a second table here saying "Text to Image
 * takes a prompt" would be one more thing to update when a tool changes, and the
 * two would disagree the first time someone forgot. If a tool ever grows a
 * different input, it changes there and this follows.
 *
 * ⚠️ SUBMIT IS PROVISIONAL. Generating in place, on this canvas, is where this
 * is going; until each tool's design lands, submitting opens that tool's
 * existing MagicStudioModal — the surface that can actually generate today. The
 * caller owns that, via `onSubmit`, because the caller owns the modal.
 *
 * The tool picker in the toolbar is navigation, not a setting: the history above
 * belongs to the tool too, so changing it moves the page.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";
import ComposerDropdown from "@/app/(components)/studio/ComposerDropdown";
import { getMagicConfig } from "./magicStudioConfigs";
import { MAGIC_TOOLS, hrefForTool, toolById } from "./magicTools";

/**
 * The `input` kinds you can actually type into. Everything else — "image",
 * "audio", "persona" — needs a file, a recording, or a form, none of which
 * belong in a one-line composer, so those tools get an opener instead of a box.
 */
const TYPEABLE = new Set(["prompt", "script", "text"]);

export default function StudioComposer({ tool, onSubmit }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const config = getMagicConfig(tool.id);
  const inputConfig = config?.inputConfig || {};
  const typeable = TYPEABLE.has(config?.input);

  // A typing tool needs something typed; an opening tool is always ready, since
  // its input is collected in the modal it opens.
  const canSubmit = typeable ? value.trim().length > 0 : true;

  const submit = () => {
    if (!canSubmit) return;
    const text = value.trim();
    console.log(
      `✨ [magic-studio] "${tool.label}" ← ${
        typeable ? `${text.length} chars` : "opening for input"
      }`,
    );
    onSubmit?.(text);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-surface shadow-[0_18px_50px_-20px_rgba(0,0,0,0.35)]">
      {typeable ? (
        <textarea
          rows={2}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={inputConfig.maxLength}
          // The tool's own placeholder, so Text to Image asks for a description
          // and Script to Voiceover asks for a script.
          placeholder={inputConfig.placeholder || "Describe what you want…"}
          aria-label={inputConfig.label || `Input for ${tool.label}`}
          className="w-full resize-none bg-transparent px-4 pt-4 text-sm leading-relaxed text-gray-900 outline-none placeholder:text-gray-400"
        />
      ) : (
        // Not a disabled text box — a button. There is nothing to type here, and
        // a greyed-out prompt field would read as broken rather than as "this
        // tool starts somewhere else".
        <button
          type="button"
          onClick={submit}
          className="flex w-full cursor-pointer flex-col gap-1 px-4 pb-1 pt-4 text-left"
        >
          <span className="text-sm font-medium text-gray-900">
            {inputConfig.label || tool.label}
          </span>
          <span className="text-xs leading-relaxed text-gray-400">
            {inputConfig.helper || `Set up your ${tool.short.toLowerCase()}.`}
          </span>
        </button>
      )}

      <div className="flex items-center gap-2 px-3 pb-3 pt-1">
        <ComposerDropdown
          options={MAGIC_TOOLS}
          value={tool.id}
          onChange={(id) => {
            const next = toolById(id);
            if (next && next.id !== tool.id) router.push(hrefForTool(next));
          }}
          open={menuOpen}
          onOpenChange={setMenuOpen}
          ariaLabel="Switch tool"
          icon={tool.icon}
        />

        <div className="flex-1" />

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          aria-label={config?.generateLabel || `Create with ${tool.label}`}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all ${
            canSubmit
              ? "cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
              : "cursor-not-allowed bg-gray-100 text-gray-400"
          }`}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
