"use client";

import React from "react";
import { Lightbulb } from "lucide-react";

/**
 * PromptBox — the "Describe what you'd like to create" textarea plus the
 * "Inspire me" seed button and a live word-count hint toward the minimum.
 */
export default function PromptBox({
  value,
  onChange,
  onInspire,
  wordCount,
  minWords,
}) {
  const short = wordCount > 0 && wordCount < minWords;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-gray-800">
        Describe what you&apos;d like to create
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder={`Enter ${minWords}+ words to describe…`}
        className="w-full resize-none rounded-xl border border-gray-200 p-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
      <div className="flex items-center justify-between">
        <button
          onClick={onInspire}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition cursor-pointer"
        >
          <Lightbulb className="w-3.5 h-3.5" />
          Inspire me
        </button>
        {short && (
          <span className="text-[11px] text-gray-400">
            {minWords - wordCount} more word{minWords - wordCount === 1 ? "" : "s"}
          </span>
        )}
      </div>
    </div>
  );
}
