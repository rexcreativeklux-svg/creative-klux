"use client";

import { Check, X } from "lucide-react";

/**
 * PlatformPageModal — the account/page picker shown after an OAuth handshake
 * returns more than one target (Facebook Pages, ad accounts, advertisers…).
 * Shared by the Integrations page and the brand-create wizard so the picker
 * looks and behaves identically in both.
 *
 * Props: { pages, onSelect, onClose, loading, selectedPageId }
 */
export default function PlatformPageModal({
  pages,
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
                Select a Page
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Choose which page to connect to this brand.
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

        {/* Page list */}
        <div className="p-3 flex flex-col gap-2 max-h-72 overflow-y-auto">
          {pages.map((page) => {
            const isSelected = selectedPageId === page.id;
            const isLoading = loading === page.id;
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
                {/* Page avatar */}
                {page.picture?.data?.url ? (
                  <img
                    src={page.picture.data.url}
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
                    {page.name?.charAt(0)?.toUpperCase() || "F"}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {page.name}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    ID: {page.id}
                  </p>
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
