"use client";

import React from "react";
import { AlertCircle, Loader2 } from "lucide-react";

/**
 * toolControls — the progress/error strip and primary button every
 * model-backed image tool needs (Enhance, Magic Grab, Auto-select, Grab Text,
 * Bg Scene). Colocated with them so none of the five can report itself
 * differently.
 *
 * These tools all download a model on first use and then run for a few
 * seconds, so "nothing appears to be happening" is the default experience
 * unless progress is shown.
 */

/**
 * ToolStatus — the progress/error strip.
 *
 * Props: { status: 'idle'|'loading'|'running'|'done'|'error', progress?,
 *          error?, runningLabel?, loadingLabel? }
 */
export function ToolStatus({
  status,
  progress = 0,
  error,
  runningLabel = "Working…",
  loadingLabel = "Loading model…",
}) {
  if (status === "error") {
    return (
      <p className="flex items-start gap-1.5 text-[11px] text-red-500 leading-relaxed">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
        {error || "Something went wrong."}
      </p>
    );
  }

  if (status !== "running" && status !== "loading") return null;

  const label = status === "loading" ? loadingLabel : runningLabel;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
        {label}
        {progress > 0 && <span className="tabular-nums text-gray-400">{progress}%</span>}
      </p>
      <div className="h-1 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] duration-200"
          // An indeterminate stage still shows a sliver, so the bar never reads
          // as "stuck at zero" while a model downloads without reporting.
          style={{ width: `${Math.max(4, Math.min(100, progress))}%` }}
        />
      </div>
    </div>
  );
}

/** Primary action button for a tool panel. */
export function ToolButton({ icon: Icon, label, onClick, disabled, busy }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className="w-full h-9 flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
    >
      {busy ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        Icon && <Icon className="w-3.5 h-3.5" />
      )}
      {label}
    </button>
  );
}
