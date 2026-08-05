"use client";

/**
 * /copilot/all — All Copilots catalog.
 * Replicates the reference "All Agents" screen (renamed to Copilot): header
 * with New folder / Create actions, search + filter + sort toolbar, view
 * toggle, and the empty-state card. UI only — the controls are local
 * placeholders until the Copilot backend lands.
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
} from "lucide-react";

export default function AllCopilots() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState("grid");

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
            <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gray-300 bg-surface text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer">
              <FolderPlus className="h-4 w-4" />
              New folder
            </button>
            <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gray-900 text-sm font-medium text-surface hover:bg-gray-800 transition-colors cursor-pointer">
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
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-surface text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer">
              Created by me
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-surface text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer">
              <ArrowUpDown className="h-4 w-4 text-gray-400" />
              Sort
            </button>
            <div className="ml-auto md:ml-2 flex items-center gap-0.5 rounded-lg border border-gray-300 bg-surface p-0.5">
              <button
                onClick={() => setView("grid")}
                aria-label="Grid view"
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${view === "grid" ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                aria-label="List view"
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${view === "list" ? "bg-gray-200 text-gray-900" : "text-gray-500 hover:text-gray-900"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Empty state ─────────────────────────────────────── */}
        <div className="mt-4 bg-surface border border-gray-200 rounded-xl flex flex-col items-center justify-center text-center px-4 py-24">
          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <p className="mt-4 text-sm font-bold text-gray-900">
            No copilots found
          </p>
          <p className="mt-1 text-xs text-gray-500">
            No copilots found matching your criteria.
          </p>
        </div>
      </div>
    </div>
  );
}
