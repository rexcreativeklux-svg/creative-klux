"use client";

/**
 * /copilot/[id]/* — a single copilot's workspace.
 *
 * Resolves the copilot from the catalog (`GET /copilots`, via the store) and
 * hands it to the shell every screen under it shares. `useParams` rather than
 * the `params` prop: this is a client layout, and reading the segment from the
 * router avoids unwrapping a promise for one string.
 *
 * ⚠️ THREE STATES, NOT TWO. The catalog is fetched now, so "no copilot with this
 * id" has to wait for the request to finish — rendering "not found" while the
 * list is still in flight accuses the user of a broken link on every single
 * page load. And a failed request is its own case: the copilot may well exist,
 * we just could not ask.
 */

import { useParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Bot, Loader2 } from "lucide-react";
import { useCopilotsState } from "../_data/copilots";
import CopilotWorkspaceLayout from "./_components/CopilotWorkspaceLayout";

/** Shared frame for the three non-workspace states below. */
function Centred({ children }) {
  return (
    <div className="h-full pt-header flex flex-col items-center justify-center gap-3 px-gutter text-center">
      {children}
    </div>
  );
}

export default function CopilotLayout({ children }) {
  const { id } = useParams();
  const { items, loading, error } = useCopilotsState();
  const copilot = items.find((c) => c.id === id);

  if (!copilot && loading) {
    return (
      <Centred>
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        <p className="text-xs text-gray-500">Loading this copilot…</p>
      </Centred>
    );
  }

  // The catalog could not be read. Shows the server's own words, because right
  // now that sentence is what gets the backend fixed.
  if (!copilot && error) {
    return (
      <Centred>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <p className="text-sm font-bold text-gray-900">
          Couldn&apos;t load your copilots
        </p>
        <p className="max-w-lg font-mono text-[11px] leading-relaxed text-red-900 wrap-break-word">
          {error}
        </p>
        <Link
          href="/copilot/all"
          className="mt-1 px-3.5 py-2 rounded-lg bg-gray-900 text-sm font-medium text-surface hover:bg-gray-800 transition-colors"
        >
          Back to all copilots
        </Link>
      </Centred>
    );
  }

  // Loaded, and it genuinely is not there — a stale link or a deleted copilot.
  // Not `notFound()`: nothing is broken, and the catalog is one click away.
  if (!copilot) {
    return (
      <Centred>
        <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
          <Bot className="h-6 w-6 text-gray-500" />
        </div>
        <p className="text-sm font-bold text-gray-900">Copilot not found</p>
        <p className="max-w-sm text-xs text-gray-500">
          This copilot doesn&apos;t exist, or it has been deleted.
        </p>
        <Link
          href="/copilot/all"
          className="mt-1 px-3.5 py-2 rounded-lg bg-gray-900 text-sm font-medium text-surface hover:bg-gray-800 transition-colors"
        >
          Back to all copilots
        </Link>
      </Centred>
    );
  }

  return (
    <CopilotWorkspaceLayout copilot={copilot}>{children}</CopilotWorkspaceLayout>
  );
}
