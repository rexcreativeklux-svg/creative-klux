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
import {
  Search,
  FolderPlus,
  Plus,
  ChevronDown,
  ArrowUpDown,
  LayoutGrid,
  List,
  Star,
} from "lucide-react";
import CopilotCard from "../_components/CopilotCard";
import { useCopilots, notifyPending } from "../_data/copilots";

export default function AllCopilots() {
  const copilots = useCopilots();
  const [query, setQuery] = useState("");
  const [view, setView] = useState("grid");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

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
              onClick={() => notifyPending("Creating a copilot")}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gray-900 text-sm font-medium text-surface hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Create copilot
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

        {/* ── Copilots ────────────────────────────────────────── */}
        {visible.length > 0 ? (
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
