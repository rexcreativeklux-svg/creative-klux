"use client";

import { CreditCard, Star, Trash2 } from "lucide-react";

/**
 * PaymentMethodCard
 * -----------------
 * A single saved card in the /billing "Payment methods" grid. Presentational —
 * the parent owns the list and handles the actions.
 *
 * The primary card is ringed in blue and can't be removed or re-primaried; an
 * expired card is called out in red so the user knows to replace it.
 *
 * @param {object}   method       - { id, brand, holder, last4, expiry, primary }.
 * @param {Function} onMakePrimary- Called with `method.id`.
 * @param {Function} onRemove     - Called with `method.id`.
 */

// Expiry is stored as MM/YY; a card is expired once its month has fully passed.
const isExpired = (expiry) => {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry || "");
  if (!match) return false;
  const endOfMonth = new Date(2000 + Number(match[2]), Number(match[1]), 0, 23, 59, 59);
  return endOfMonth < new Date();
};

export default function PaymentMethodCard({ method, onMakePrimary, onRemove }) {
  const expired = isExpired(method.expiry);

  return (
    <div
      className={`flex flex-col justify-between rounded-xl bg-surface p-4 transition-colors ${
        method.primary
          ? "border-2 border-[#155dfc]"
          : "border border-gray-200 hover:border-gray-300"
      }`}
    >
      {/* Brand + masked number */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 shrink-0 text-gray-500" />
            <p className="truncate text-sm font-semibold text-gray-900">
              {method.brand}
            </p>
          </div>
          <p className="mt-1 truncate text-xs text-gray-500">{method.holder}</p>
          <p className="mt-0.5 font-mono text-sm text-gray-700">
            •••• {method.last4}
          </p>
        </div>

        {method.primary && (
          <span className="shrink-0 rounded-full bg-[#155dfc] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
            Primary
          </span>
        )}
      </div>

      {/* Expiry + actions */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3">
        <p className={`text-xs ${expired ? "text-red-500" : "text-gray-500"}`}>
          {expired ? `Expired ${method.expiry}` : `Expires ${method.expiry}`}
        </p>

        <div className="flex items-center gap-1">
          {!method.primary && (
            <button
              type="button"
              onClick={() => onMakePrimary?.(method.id)}
              title="Make primary"
              aria-label={`Make ${method.brand} ending ${method.last4} primary`}
              className="cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[#155dfc]"
            >
              <Star className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onRemove?.(method.id)}
            disabled={method.primary}
            title={method.primary ? "Make another card primary first" : "Remove card"}
            aria-label={`Remove ${method.brand} ending ${method.last4}`}
            className={`rounded-md p-1.5 transition-colors ${
              method.primary
                ? "cursor-not-allowed text-gray-300"
                : "cursor-pointer text-gray-400 hover:bg-red-50 hover:text-red-500"
            }`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
