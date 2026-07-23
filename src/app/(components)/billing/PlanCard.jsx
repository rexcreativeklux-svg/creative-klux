"use client";

import { Check, Sparkles } from "lucide-react";
import { BILLING_CYCLES } from "@/app/(components)/billing/billingData";

/**
 * PlanCard
 * --------
 * One pricing tier in the /billing plan grid. Purely presentational — it owns no
 * state; the parent decides which cycle is active, which plan the user is on,
 * and what happens when the CTA is pressed.
 *
 * The promoted tier (`plan.highlight`) gets a blue ring + "MOST POPULAR" ribbon;
 * the tier the user already owns is shown with a disabled "Current plan" button.
 *
 * @param {object}   plan          - A tier from `PLANS` (see src/data/billingData.js).
 * @param {string}   cycle         - Active billing cycle (BILLING_CYCLES value).
 * @param {boolean}  isCurrent     - Whether this is the user's active plan.
 * @param {Function} onSelect      - Called with `plan` when the CTA is pressed.
 */
export default function PlanCard({ plan, cycle, isCurrent, onSelect }) {
  const price = plan.price[cycle] ?? plan.price[BILLING_CYCLES.MONTHLY];
  const billedNote = plan.billedNote[cycle] ?? "";

  return (
    <div
      className={`relative flex flex-col rounded-2xl bg-surface p-6 transition-all duration-200 ${
        plan.highlight
          ? "border-2 border-[#155dfc] shadow-lg shadow-blue-500/5"
          : "border border-gray-200 hover:border-gray-300"
      }`}
    >
      {/* Promoted ribbon — sits on the top border of the highlighted tier */}
      {plan.highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#155dfc] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm">
          <Sparkles className="h-3 w-3" />
          Most popular
        </span>
      )}

      {/* Name + tagline */}
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
        <p className="mt-0.5 text-xs text-gray-500">{plan.tagline}</p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-end gap-1">
          <span className="text-4xl font-bold leading-none text-gray-900">
            ${price}
          </span>
          <span className="pb-1 text-sm text-gray-500">/mo</span>
        </div>
        <p className="mt-1.5 text-xs text-gray-400">{billedNote}</p>
      </div>

      {/* Features */}
      <ul className="mb-6 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#155dfc]" />
            <span className="text-sm text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        type="button"
        disabled={isCurrent}
        onClick={() => onSelect?.(plan)}
        className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors duration-200 ${
          isCurrent
            ? "cursor-not-allowed bg-gray-100 text-gray-500"
            : "cursor-pointer bg-[#155dfc] text-white shadow-sm hover:bg-[#0d44b3]"
        }`}
      >
        {isCurrent ? "Current plan" : `Upgrade to ${plan.name}`}
      </button>
    </div>
  );
}
