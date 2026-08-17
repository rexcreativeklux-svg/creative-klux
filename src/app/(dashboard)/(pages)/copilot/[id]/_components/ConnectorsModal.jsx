"use client";

/**
 * ConnectorsModal — the browse-everything dialog behind BOTH "Add Connector"
 * and "Browse all" on the Plugins screen.
 *
 * One dialog for both, because they are the same request: the header button is
 * "I know I want to add something", the link is "show me the rest", and they
 * land on the same catalog. Two dialogs would be two things to keep in step for
 * no difference the user can name.
 *
 * Apps / MCP tabs, search, a category filter, a sort menu, the grid, and the
 * "Request a connector" line under it.
 *
 * ⚠️ UI ONLY — the backend decides how a copilot's integrations work, so
 * Connect, Add MCP server and Request a connector all report the click and stop.
 * Search, the filter and the sort are real, because they only touch the catalog
 * that is already here.
 */

import { useState } from "react";
import { Search, ArrowUpDown, Plug } from "lucide-react";
import ResponsiveModal from "@/app/(components)/ui/ResponsiveModal";
import { notifyPending } from "../../_data/copilots";
import {
  CONNECTORS,
  CONNECTOR_CATEGORIES,
  CONNECTOR_SORTS,
} from "../../_data/connectors";
import ConnectorCard from "./ConnectorCard";
import DropdownMenu from "./DropdownMenu";

const TABS = ["Apps", "MCP"];

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {() => void} props.onRequest  "Request a connector" — the page swaps
 *   this dialog for the request form rather than stacking one on the other.
 */
export default function ConnectorsModal({ isOpen, onClose, onRequest }) {
  const [tab, setTab] = useState("Apps");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState(CONNECTOR_SORTS[0].label);

  const term = query.trim().toLowerCase();
  const active = CONNECTOR_SORTS.find((s) => s.label === sort);

  let visible = CONNECTORS.filter(
    (connector) =>
      (category === "All" || connector.category === category) &&
      (!term ||
        connector.name.toLowerCase().includes(term) ||
        connector.description.toLowerCase().includes(term)),
  );
  // The catalog's own order IS "Most popular", so a sort either replaces it, or
  // reverses it for "Newest" — see the ⚠️ in _data/connectors.js.
  if (active?.compare) visible = [...visible].sort(active.compare);
  else if (active?.reverse) visible = [...visible].reverse();

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Connectors"
      size="3xl"
      fullHeightSheet
    >
      <p className="-mt-1 text-sm text-gray-500">
        Connect your copilot to the apps and services you already use.
      </p>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div className="mt-5 flex items-center gap-6 border-b border-gray-200">
        {TABS.map((name) => {
          const on = tab === name;
          return (
            <button
              key={name}
              onClick={() => setTab(name)}
              aria-pressed={on}
              className={`-mb-px border-b-2 pb-2.5 text-sm transition-colors cursor-pointer ${
                on
                  ? "border-blue-600 text-gray-900 font-semibold"
                  : "border-transparent text-gray-500 font-medium hover:text-gray-900"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      {tab === "Apps" ? (
        <>
          {/* ── Toolbar ─────────────────────────────────────────── */}
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-300 bg-surface px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search connectors..."
                className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu
                trigger={category}
                items={CONNECTOR_CATEGORIES.map((name) => ({
                  label: name,
                  selected: name === category,
                  onClick: () => setCategory(name),
                }))}
              />
              <DropdownMenu
                heading="Sort by"
                trigger={
                  <>
                    <ArrowUpDown className="h-4 w-4 text-gray-400" />
                    {sort}
                  </>
                }
                items={CONNECTOR_SORTS.map((option) => ({
                  label: option.label,
                  selected: option.label === sort,
                  onClick: () => setSort(option.label),
                }))}
              />
            </div>
          </div>

          {/* ── Grid ────────────────────────────────────────────── */}
          {visible.length ? (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {visible.map((connector) => (
                <ConnectorCard
                  key={connector.id}
                  platform={connector}
                  stacked
                  onConnect={() => notifyPending(`Connecting ${connector.name}`)}
                />
              ))}
            </div>
          ) : (
            <p className="mt-8 text-center text-sm text-gray-500">
              No connectors match “{query}”.
            </p>
          )}

          {/* ── Footer line ─────────────────────────────────────── */}
          {/* Inside the scroll area rather than the modal's sticky footer: it is
              the end of the list, not an action on the dialog. */}
          <p className="mt-6 border-t border-gray-200 pt-5 text-center text-sm text-gray-500">
            Can&apos;t find what you need?{" "}
            <button
              onClick={onRequest}
              className="font-medium text-gray-900 underline underline-offset-2 hover:text-blue-600 transition-colors cursor-pointer"
            >
              Request a connector
            </button>
          </p>
        </>
      ) : (
        /* ── MCP ───────────────────────────────────────────────── */
        /* Empty by construction: an MCP server is something the USER runs and
           points the copilot at, so there is no catalog to seed — the list is
           whatever they add, and adding is the backend's call. */
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
            <Plug className="h-4 w-4 text-gray-500" />
          </div>
          <p className="mt-4 text-sm font-bold text-gray-900">
            No MCP servers yet
          </p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-gray-500">
            Point your copilot at an MCP server to give it tools this catalog
            doesn&apos;t cover.
          </p>
          <button
            onClick={() => notifyPending("MCP servers")}
            className="mt-4 rounded-lg bg-gray-900 px-3.5 py-2 text-sm font-medium text-surface hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Add MCP server
          </button>
        </div>
      )}
    </ResponsiveModal>
  );
}
