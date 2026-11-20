"use client";

/**
 * SocialPageActions — the Refresh and "Create new post" buttons every Social
 * Content page carries in its header (Publishing, Calendar, Analytics), and
 * the Create Post composer they open.
 *
 * Refresh asks the backend again, past the shared cache (see requestCache) —
 * the caller's `onRefresh` gets `{ fresh: true }`. A post published from the
 * composer refreshes the page the same way, so it shows up straight away.
 *
 * @param {object}   props
 * @param {(opts: { fresh: boolean }) => void} props.onRefresh
 * @param {boolean}  [props.refreshing]  The page is reloading.
 */

import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import CreatePostComposer from "@/app/(components)/composer/CreatePostComposer";
import { useSocialPlatform } from "./socialPlatformScope";

export default function SocialPageActions({ onRefresh, refreshing = false }) {
  const { platform, scoped } = useSocialPlatform();
  const [composerOpen, setComposerOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onRefresh({ fresh: true })}
        disabled={refreshing}
        className="inline-flex cursor-pointer items-center rounded-lg border border-gray-200 bg-surface px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60"
      >
        <RefreshCw
          className={`mr-2 h-3.5 w-3.5 text-gray-500 ${refreshing ? "animate-spin" : ""}`}
        />
        {refreshing ? "Refreshing…" : "Refresh"}
      </button>
      <button
        type="button"
        onClick={() => setComposerOpen(true)}
        className="inline-flex cursor-pointer items-center rounded-lg bg-[#003dda] px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Create new post
      </button>

      {/* Published posts land on the networks, so the page is refetched. */}
      <CreatePostComposer
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPublished={() => onRefresh({ fresh: true, silent: true })}
        // Opened from one network's page, it starts on that network.
        initialPlatforms={scoped ? [platform] : []}
      />
    </div>
  );
}
