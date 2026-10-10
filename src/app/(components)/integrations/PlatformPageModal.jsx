"use client";

import { Check, X, AlertTriangle } from "lucide-react";

/**
 * PlatformPageModal — the account chooser shown when a connection needs a
 * specific target picked (a Facebook Page, an Instagram business account, an
 * ad account). The list comes from GET integrations/{platform}/accounts.
 * Shared by the Integrations page and the copilot's Plugins screen so the
 * chooser looks and behaves identically in both.
 *
 * An account can carry a `warning` (e.g. a Page the user can view but not
 * publish to). It is shown, muted, and the account stays selectable — a
 * read-only ad account is still useful for reporting, and refusing the choice
 * without explaining it would be worse.
 *
 * Props: { pages, message, onSelect, onClose, loading, selectedPageId }
 *   pages    [{ id, name, avatar?, warning? }]
 *   message  why the list is empty, in the server's words (shown instead of it)
 *   loading  id of the account being saved, if any
 */
export default function PlatformPageModal({
  pages = [],
  message,
  onSelect,
  onClose,
  loading,
  selectedPageId,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div className="bg-surface rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Choose an account
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Pick which one to connect to this brand.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0 mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Account list */}
        <div className="p-3 flex flex-col gap-2 max-h-72 overflow-y-auto">
          {pages.length === 0 && (
            <p className="px-2 py-6 text-center text-sm text-gray-500">
              {message || "No accounts are available to connect."}
            </p>
          )}

          {pages.map((page) => {
            const isSelected = selectedPageId === page.id;
            const isLoading = loading === page.id;
            const avatar = page.avatar || page.picture?.data?.url;
            return (
              <button
                key={page.id}
                onClick={() => onSelect(page)}
                disabled={!!loading}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-surface hover:border-blue-300 hover:bg-blue-50/50"
                }`}
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt={page.name}
                    className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-100"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
                    style={{
                      background: "linear-gradient(135deg, #1877F2, #0C5FCA)",
                    }}
                  >
                    {page.name?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {page.name || page.id}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    ID: {page.id}
                  </p>
                  {page.warning && (
                    <p className="mt-1 flex items-start gap-1 text-[11px] leading-snug text-amber-700">
                      <AlertTriangle className="w-3 h-3 shrink-0 mt-px" />
                      {page.warning}
                    </p>
                  )}
                </div>

                {isLoading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0" />
                ) : isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-200 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-2">
          <button
            onClick={onClose}
            disabled={!!loading}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
