"use client";

/**
 * /copilot/all — the Copilot catalog, and where the sidebar's "View all" lands.
 *
 * Header with New folder / Create actions, a search + filter + sort toolbar, a
 * favorites filter, a grid/list toggle, and the copilots themselves.
 *
 * ⚠️ THERE IS NO API YET. The list comes from ../_data/copilots, a module-level
 * mock store shared with the sidebar — so starring a copilot here lights it up
 * in the sidebar's Favorites, and deleting one drops it from Recents. Search,
 * the favorites filter and the view toggle are real; New folder, Create, the
 * owner filter and Sort are the placeholders that are left, and each says so
 * when clicked rather than doing nothing.
 *
 * Every card is a {@link CopilotCard} — the same component the list view uses,
 * so the two views cannot drift apart on hover, favouriting or the ⋯ menu.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FolderPlus,
  Plus,
  ChevronDown,
  ArrowUpDown,
  LayoutGrid,
  List,
  Star,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import CopilotCard from "../_components/CopilotCard";
import {
  useCopilotsState,
  refreshCopilots,
  notifyPending,
  addCopilot,
  reportFailure,
} from "../_data/copilots";

export default function AllCopilots() {
  const router = useRouter();
  const { items: copilots, loading, error } = useCopilotsState();
  const [query, setQuery] = useState("");
  const [view, setView] = useState("grid");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [creating, setCreating] = useState(false);

  /**
   * Make one on the server, then open it.
   *
   * ⚠️ NO FORM FIRST. The server names it; the user renames it from the settings
   * sheet once it exists and they know what it is for. Asking for a name up
   * front is a form standing between someone and an empty copilot.
   *
   * Guarded against a second click, because two clicks on a slow create make two
   * copilots and only one of them gets opened.
   */
  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const copilot = await addCopilot();
      router.push(`/copilot/${copilot.id}`);
    } catch (err) {
      reportFailure(err, "Couldn't create a copilot");
      setCreating(false); // give the button back; on success we navigate away
    }
  };

  const term = query.trim().toLowerCase();
  const visible = copilots.filter(
    (copilot) =>
      (!favoritesOnly || copilot.favorite) &&
      (!term ||
        copilot.name.toLowerCase().includes(term) ||
        copilot.description.toLowerCase().includes(term)),
  );
  // An empty catalog and an over-filtered one are different problems, and the
  // fix for each is different — so they do not share a message.
  const filtered = copilots.length > 0 && visible.length === 0;

  return (
    // No pb-nav: `main` in (dashboard)/layout.js reserves the mobile bottom
    // bar for every route. The inner `pb-24` that stacked on top of it is gone
    // for the same reason — the page's own rhythm is all that belongs here.
    <div className="min-h-full pt-header bg-[#eef1f7] dark:bg-page">
      <div className="px-4 md:px-10 py-8 pb-10">
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              All Copilots
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create, organize, and manage all copilots in your workspace.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => notifyPending("Folders")}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gray-300 bg-surface text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <FolderPlus className="h-4 w-4" />
              New folder
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gray-900 text-sm font-medium text-surface hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {creating ? "Creating…" : "Create copilot"}
            </button>
          </div>
        </div>

        {/* ── Toolbar ─────────────────────────────────────────── */}
        <div className="mt-6 flex flex-col md:flex-row md:items-center gap-2">
          <div className="flex items-center gap-2 flex-1 md:max-w-md px-3 py-2 rounded-lg border border-gray-300 bg-surface">
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search copilots"
              className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => notifyPending("Filtering by owner")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-surface text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Created by me
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            <button
              onClick={() => notifyPending("Sorting")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-surface text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ArrowUpDown className="h-4 w-4 text-gray-400" />
              Sort
            </button>
            {/* Favorites filter — a toggle, not a link, so it reads against the
                stars on the cards themselves. */}
            <button
              onClick={() => setFavoritesOnly((p) => !p)}
              aria-pressed={favoritesOnly}
              aria-label="Show favorites only"
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                favoritesOnly
                  ? "border-amber-300 bg-amber-50 text-amber-500"
                  : "border-gray-300 bg-surface text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Star className={`h-4 w-4 ${favoritesOnly ? "fill-current" : ""}`} />
            </button>
            <div className="ml-auto md:ml-2 flex items-center gap-0.5 rounded-lg border border-gray-300 bg-surface p-0.5">
              <button
                onClick={() => setView("grid")}
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${view === "grid" ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                aria-label="List view"
                aria-pressed={view === "list"}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${view === "list" ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Copilots ──────────────────────────────────────────
            ⚠️ FOUR STATES, and they are not interchangeable: still loading,
            the request failed, nothing matches the filter, and genuinely no
            copilots. The last two used to be the only ones — with a fetched
            catalog, showing "No copilots yet" during the round trip invites the
            user to create a duplicate of something they already have, and
            showing it after a failure hides a broken backend behind an
            empty-state illustration. */}
        {loading ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-surface px-4 py-24 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <p className="mt-3 text-xs text-gray-500">Loading your copilots…</p>
          </div>
        ) : error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-10 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <p className="mt-4 text-sm font-bold text-gray-900">
              Couldn&apos;t load your copilots
            </p>
            {/* The server's exact words, in mono. While the backend is being
                brought up this sentence is the thing worth screenshotting. */}
            <p className="mx-auto mt-2 max-w-2xl font-mono text-[11px] leading-relaxed text-red-900 wrap-break-word">
              {error}
            </p>
            <button
              onClick={() => refreshCopilots()}
              className="mt-4 rounded-lg bg-gray-900 px-3.5 py-2 text-sm font-medium text-surface transition-colors hover:bg-gray-800 cursor-pointer"
            >
              Try again
            </button>
          </div>
        ) : visible.length > 0 ? (
          view === "grid" ? (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {visible.map((copilot) => (
                <CopilotCard key={copilot.id} copilot={copilot} variant="grid" />
              ))}
            </div>
          ) : (
            // divide-y rather than a border on each row: one hairline between
            // neighbours, and none above the first or below the last.
            <div className="mt-6 rounded-xl border border-gray-200 bg-surface divide-y divide-gray-200 overflow-hidden">
              {visible.map((copilot) => (
                <CopilotCard key={copilot.id} copilot={copilot} variant="list" />
              ))}
            </div>
          )
        ) : (
          <div className="mt-4 bg-surface border border-gray-200 rounded-xl flex flex-col items-center justify-center text-center px-4 py-24">
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Search className="h-4 w-4 text-gray-500" />
            </div>
            <p className="mt-4 text-sm font-bold text-gray-900">
              {filtered ? "No copilots found" : "No copilots yet"}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {filtered
                ? "No copilots found matching your criteria."
                : "Create your first copilot to see it here."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
