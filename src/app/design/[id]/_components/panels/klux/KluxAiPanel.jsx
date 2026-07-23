"use client";

import React from "react";
import KluxSuggestions from "./KluxSuggestions";
import KluxComposer from "./KluxComposer";
import KluxMessageList from "./KluxMessageList";
import useKluxAi from "./useKluxAi";
import { KLUX_ACTIONS } from "./kluxActions";

// The "Edit with Ai" entry point drops the user straight into a redesign, so we
// pre-fill the composer with the "Redesign this page" action's full prompt.
// Sourced from KLUX_ACTIONS so the text stays single-defined.
const REDESIGN_SEED =
  KLUX_ACTIONS.find((a) => a.id === "redesign")?.prompt ?? "";

/**
 * Klux AI panel — our take on Canva AI. Empty state shows the big prompt and the
 * quick-action chips; once a turn is sent it becomes a conversation with the
 * working ("Preparing everything…") indicator. The composer is pinned at the
 * bottom. The actual assistant call lives behind runKluxAi() — this panel is the
 * chat surface around it.
 *
 * Props: { insert, setBackground, background, editor, kluxSeedRedesign }
 */
export default function KluxAiPanel({ editor, kluxSeedRedesign }) {
  const klux = useKluxAi({
    editor,
    initialInput: kluxSeedRedesign ? REDESIGN_SEED : "",
  });
  const started = klux.messages.length > 0 || klux.working;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {started ? (
          <KluxMessageList messages={klux.messages} working={klux.working} />
        ) : (
          <div className="flex flex-col pt-2">
            <h2 className="text-3xl font-extrabold leading-tight text-[#155dfc]">
              What shall we do with this design?
            </h2>
            {/* Suggestions sit lower, giving the heading room to breathe. */}
            <div className="mt-16">
              <KluxSuggestions onPick={klux.send} />
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-gray-100 p-3">
        <KluxComposer
          value={klux.input}
          onChange={klux.setInput}
          onSend={klux.send}
          onStop={klux.stop}
          working={klux.working}
        />
      </div>
    </div>
  );
}
