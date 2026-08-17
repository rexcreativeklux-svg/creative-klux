"use client";

/**
 * CopilotComposer — the box you type a task into.
 *
 * The Copilot home hero and a copilot's own conversation are the same control at
 * different widths, so they are the same component: attach, dictate, send, and
 * Enter-to-submit behave identically, and a fix to one is a fix to both. The
 * differences the two surfaces actually have — width, row count, and the extra
 * controls the chat screen puts beside the mic — are props.
 *
 * Enter submits, Shift+Enter opens a line. That is the convention every chat box
 * the user has ever met, and a task like "Every Friday, check…" is one line far
 * more often than it is two.
 *
 * @param {Object} props
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 * @param {() => void} props.onSubmit          Fired by Enter or the send button.
 *   Only ever called with a non-empty value — the guard lives here so no caller
 *   has to repeat it.
 * @param {string} [props.placeholder]
 * @param {number} [props.rows=2]
 * @param {string} [props.className]           Width/margin from the caller.
 * @param {string} [props.sendLabel="Send task"]  Accessible name for send.
 */

import { Plus, Mic, ArrowUp } from "lucide-react";
import { notifyPending } from "../_data/copilots";

export default function CopilotComposer({
  value,
  onChange,
  onSubmit,
  placeholder = "Give your Copilot a task to do...",
  rows = 2,
  className = "",

  sendLabel = "Send task",
}) {
  const submit = () => {
    if (!value.trim()) return;
    onSubmit?.();
  };

  return (
    <div
      className={`bg-surface rounded-2xl border border-gray-200 shadow-sm p-4 ${className}`}
    >
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
      />
      <div className="flex items-center justify-between mt-2">
        <button
          onClick={() => notifyPending("Attachments")}
          aria-label="Add attachment"
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1.5">

          <button
            onClick={() => notifyPending("Dictation")}
            aria-label="Dictate task"
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <Mic className="h-4 w-4" />
          </button>
          {/* Dimmed rather than `disabled` while empty: the button keeps its
              place in the row and its label, and pressing it simply does
              nothing — a control that disappears mid-typing is worse than one
              that waits. */}
          <button
            onClick={submit}
            aria-label={sendLabel}
            className={`p-2 rounded-lg bg-blue-50 text-blue-600 transition-colors cursor-pointer ${
              value.trim() ? "hover:bg-blue-100" : "opacity-50"
            }`}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
