"use client";

import React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import PromptBox from "./PromptBox";
import GenerateControls from "./GenerateControls";
import ResultsGrid from "./ResultsGrid";

/**
 * GenerationTab — the shared prompt → controls → generate → results form used by
 * every Magic Studio tab. What each tab shows is driven by the hook: `useStyle`
 * / `useAspect` toggle the pickers, and `noun` sets the button label. Video and
 * 3D show no pickers at all, so the controls row is skipped entirely.
 *
 * Props: { mag (a useMagicGenerate instance), noun, onInsert }
 */
export default function GenerationTab({ mag, noun, onInsert }) {
  const hasControls = mag.useStyle || mag.useAspect;
  return (
    <>
      <PromptBox
        value={mag.prompt}
        onChange={mag.setPrompt}
        onInspire={mag.inspire}
        wordCount={mag.wordCount}
        minWords={mag.minWords}
      />

      {hasControls && (
        <GenerateControls
          style={mag.style}
          setStyle={mag.setStyle}
          aspect={mag.aspect}
          setAspect={mag.setAspect}
          showStyle={mag.useStyle}
          showAspect={mag.useAspect}
        />
      )}

      <button
        onClick={mag.generate}
        disabled={!mag.canGenerate}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
      >
        {mag.generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Generate {noun}
          </>
        )}
      </button>

      <ResultsGrid
        results={mag.results}
        onPick={onInsert}
        generating={mag.generating}
      />
    </>
  );
}
