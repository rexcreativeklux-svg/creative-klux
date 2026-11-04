"use client";

/**
 * BulkActionBar — the count, Select all, and what can be done to the ticked
 * tiles. Knows nothing about what they are: each surface passes its own actions.
 *
 * @param {object} props
 * @param {number} props.count How many are ticked.
 * @param {boolean} props.allSelected Turns "Select all" into "Clear all".
 * @param {() => void} props.onSelectAll
 * @param {() => void} props.onClear
 * @param {boolean} [props.busy] An action is running — locks the others.
 * @param {Array<{
 *   label: string,
 *   icon: object,
 *   onClick: () => void,
 *   primary?: boolean,
 *   danger?: boolean,
 *   disabled?: boolean,
 * }>} props.actions
 */
import { X } from "lucide-react";

export default function BulkActionBar({
  count,
  allSelected,
  onSelectAll,
  onClear,
  busy = false,
  actions,
}) {
  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-surface px-3 py-2.5 shadow-2xl"
    >
      {/* ⚠️ TWO ROWS ON A PHONE, labels off. Five labelled buttons in a 340px bar
          stacked one per line, which made it nearly 190px tall and hid half the
          grid you were selecting from. There: the count and ✕ share a row, with
          the actions as a row of icons under them. */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:mr-1 sm:flex-none sm:shrink-0 sm:border-r sm:border-gray-200 sm:pr-3">
        <span
          aria-live="polite"
          className="whitespace-nowrap text-sm font-semibold tabular-nums text-gray-900"
        >
          {count} selected
        </span>
        <button
          type="button"
          onClick={allSelected ? onClear : onSelectAll}
          className="cursor-pointer whitespace-nowrap rounded-md px-1 py-0.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50"
        >
          {allSelected ? "Clear all" : "Select all"}
        </button>
      </div>

      <div className="order-3 flex w-full min-w-0 flex-wrap items-center gap-1.5 sm:order-0 sm:w-auto sm:flex-1">
        {actions.map(({ label, icon: Icon, onClick, primary, danger, disabled }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            disabled={busy || disabled}
            aria-label={label}
            title={label}
            className={`flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:px-2.5 sm:py-1.5 ${
              primary
                ? "border-blue-600 bg-blue-600 text-white enabled:hover:bg-blue-700"
                : danger
                  ? "ml-auto border-transparent text-red-500 enabled:hover:bg-red-50"
                  : "border-gray-200 text-gray-900 enabled:hover:bg-gray-100"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onClear}
        disabled={busy}
        aria-label="Clear selection"
        className="shrink-0 cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
