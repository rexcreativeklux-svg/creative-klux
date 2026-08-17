"use client";

/**
 * /copilot/[id]/* — a single copilot's workspace.
 *
 * Resolves the copilot from the mock catalog and hands it to the shell every
 * screen under it shares. `useParams` rather than the `params` prop: this is a
 * client layout (the catalog is a client store), and reading the segment from
 * the router avoids unwrapping a promise for one string.
 */

import { useParams } from "next/navigation";
import Link from "next/link";
import { Bot } from "lucide-react";
import { useCopilots } from "../_data/copilots";
import CopilotWorkspaceLayout from "./_components/CopilotWorkspaceLayout";

export default function CopilotLayout({ children }) {
  const { id } = useParams();
  const copilots = useCopilots();
  const copilot = copilots.find((c) => c.id === id);

  // A stale link, or a clone from a previous session — the store lives in
  // memory, so its ids do not survive a reload. Not `notFound()`: nothing is
  // broken, the copilot simply is not here, and the catalog is one click away.
  if (!copilot) {
    return (
      <div className="h-full pt-header flex flex-col items-center justify-center gap-3 px-gutter text-center">
        <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
          <Bot className="h-6 w-6 text-gray-500" />
        </div>
        <p className="text-sm font-bold text-gray-900">Copilot not found</p>
        <p className="max-w-sm text-xs text-gray-500">
          This copilot doesn&apos;t exist, or it was created before the last
          reload — the catalog is still in memory until the backend lands.
        </p>
        <Link
          href="/copilot/all"
          className="mt-1 px-3.5 py-2 rounded-lg bg-gray-900 text-sm font-medium text-surface hover:bg-gray-800 transition-colors"
        >
          Back to all copilots
        </Link>
      </div>
    );
  }

  return (
    <CopilotWorkspaceLayout copilot={copilot}>{children}</CopilotWorkspaceLayout>
  );
}
