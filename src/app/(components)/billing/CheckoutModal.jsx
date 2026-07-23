"use client";

import { useEffect, useState } from "react";
import { CreditCard, Loader2, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { BILLING_CYCLES } from "@/app/(components)/billing/billingData";

/**
 * CheckoutModal
 * -------------
 * The card path to upgrading — the alternative to redeeming a license code.
 * Runs in two modes so the same form serves both entry points on /billing:
 *
 *   • mode="checkout"  → pay for `plan` on `cycle` (Upgrade / Upgrade to Pro…)
 *   • mode="add-card"  → just save a new card (Payment methods → New method)
 *
 * ⚠️ Placeholder: no payment endpoint exists yet. `onSubmit` is simulated by the
 * parent and NO card data is ever transmitted or stored. When the real processor
 * is wired up, the raw PAN must go straight to the provider's SDK/iframe (e.g.
 * Stripe Elements) — never through our own API. See TODO(endpoint) in
 * src/data/billingData.js.
 *
 * @param {boolean}  open         - Whether the dialog is visible.
 * @param {Function} onClose      - Dismisses the dialog (blocked while paying).
 * @param {string}   mode         - "checkout" | "add-card".
 * @param {object}   [plan]       - Tier being purchased (checkout mode only).
 * @param {string}   [cycle]      - Billing cycle (checkout mode only).
 * @param {Function} onSubmit     - Async handler given the sanitised card data.
 *                                  Should throw on failure so we can toast it.
 */

// ── Field formatters ────────────────────────────────────────────────────────
// Card number → digits only, grouped in 4s, capped at 19 digits (Maestro-length).
const formatCardNumber = (raw) =>
  raw
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();

// Expiry → MM/YY. The month is clamped as the user types so "9" becomes "09/".
const formatExpiry = (raw) => {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length < 2) return digits;
  const month = Math.min(Math.max(parseInt(digits.slice(0, 2), 10), 1), 12)
    .toString()
    .padStart(2, "0");
  return digits.length === 2 ? `${month}/` : `${month}/${digits.slice(2)}`;
};

const formatCvc = (raw) => raw.replace(/\D/g, "").slice(0, 4);

// ── Validation ──────────────────────────────────────────────────────────────
// Luhn check — catches mistyped digits before a request is ever made.
const passesLuhn = (digits) => {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let value = Number(digits[i]);
    if (double) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    double = !double;
  }
  return sum % 10 === 0;
};

// Expiry must parse to a real month that hasn't passed yet.
const isExpiryValid = (expiry) => {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  return endOfMonth >= now;
};

const EMPTY_FORM = { name: "", number: "", expiry: "", cvc: "", country: "NG" };

// Kept short on purpose — a real integration would source this from the
// processor's supported-country list.
const COUNTRIES = [
  { code: "NG", label: "Nigeria" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "GH", label: "Ghana" },
  { code: "KE", label: "Kenya" },
  { code: "ZA", label: "South Africa" },
];

export default function CheckoutModal({
  open,
  onClose,
  mode = "checkout",
  plan,
  cycle = BILLING_CYCLES.MONTHLY,
  onSubmit,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const isCheckout = mode === "checkout";

  // Always reopen clean — never show a previous attempt's values or errors.
  // Done during render (React's recommended pattern) rather than in an effect,
  // so reopening doesn't cost a second render pass with stale values on screen.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(EMPTY_FORM);
      setErrors({});
      setSubmitting(false);
    }
  }

  // Close on Escape, but not while a payment is in flight.
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !submitting) onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, submitting, onClose]);

  if (!open) return null;

  const price = isCheckout ? (plan?.price?.[cycle] ?? 0) : 0;
  const isAnnual = cycle === BILLING_CYCLES.ANNUAL;
  // Annual tiers are priced per month but charged once for the year.
  const chargeToday = isAnnual ? price * 12 : price;

  const setField = (key) => (value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    const digits = form.number.replace(/\D/g, "");

    if (!form.name.trim()) next.name = "Enter the name on the card.";
    if (digits.length < 13 || !passesLuhn(digits))
      next.number = "Enter a valid card number.";
    if (!isExpiryValid(form.expiry)) next.expiry = "Enter a valid expiry date.";
    if (form.cvc.length < 3) next.cvc = "Enter the 3–4 digit CVC.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // guard against double-submits

    if (!validate()) {
      toast.error("Please fix the highlighted card details.");
      return;
    }

    const digits = form.number.replace(/\D/g, "");
    // Only non-sensitive fragments leave this component — never the full PAN.
    const payload = {
      holder: form.name.trim(),
      last4: digits.slice(-4),
      expiry: form.expiry,
      country: form.country,
      planId: plan?.id ?? null,
      cycle,
      amount: chargeToday,
    };

    setSubmitting(true);
    console.log(
      isCheckout ? "💳 Submitting plan checkout…" : "💳 Saving new card…",
      { ...payload, last4: `••••${payload.last4}` },
    );

    try {
      await onSubmit?.(payload);
      console.log("✅ Card flow completed");
      onClose?.();
    } catch (err) {
      console.error("❌ Card flow failed:", err);
      toast.error(
        err?.message || "Your card couldn't be processed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Shared input styling; flips to a red border when the field has an error.
  const inputClass = (key) =>
    `w-full rounded-lg border bg-gray-50 px-3 py-2.5 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none disabled:opacity-60 ${
      errors[key]
        ? "border-red-400 focus:border-red-500"
        : "border-gray-200 focus:border-[#155dfc]"
    }`;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-full w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-surface shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {isCheckout
                ? `Upgrade to ${plan?.name ?? "plan"}`
                : "Add payment method"}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              {isCheckout
                ? "Pay by card — your plan activates immediately."
                : "Save a card to use for future charges."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className={`-mr-2 p-2 text-gray-400 transition ${
              submitting
                ? "cursor-not-allowed opacity-40"
                : "cursor-pointer hover:rounded-full hover:bg-gray-100 hover:text-gray-600"
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Order summary (checkout only) */}
        {isCheckout && (
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {plan?.name} · {isAnnual ? "Annual" : "Monthly"}
              </span>
              <span className="font-semibold text-gray-900">
                ${chargeToday}
                <span className="ml-1 text-xs font-normal text-gray-500">
                  {isAnnual ? "/yr" : "/mo"}
                </span>
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {isAnnual
                ? "Billed once a year. Cancel anytime."
                : "Billed monthly. Cancel anytime."}
            </p>
          </div>
        )}

        {/* Card form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="space-y-1">
            <label htmlFor="ck-card-name" className="text-xs text-gray-500">
              Name on card
            </label>
            <input
              id="ck-card-name"
              value={form.name}
              onChange={(e) => setField("name")(e.target.value)}
              disabled={submitting}
              autoComplete="cc-name"
              placeholder="Jane Doe"
              className={inputClass("name")}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="ck-card-number" className="text-xs text-gray-500">
              Card number
            </label>
            <div className="relative">
              <input
                id="ck-card-number"
                value={form.number}
                onChange={(e) =>
                  setField("number")(formatCardNumber(e.target.value))
                }
                disabled={submitting}
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="4242 4242 4242 4242"
                className={`${inputClass("number")} pr-10`}
              />
              <CreditCard className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            {errors.number && (
              <p className="text-xs text-red-500">{errors.number}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="ck-card-expiry" className="text-xs text-gray-500">
                Expiry
              </label>
              <input
                id="ck-card-expiry"
                value={form.expiry}
                onChange={(e) =>
                  setField("expiry")(formatExpiry(e.target.value))
                }
                disabled={submitting}
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                className={inputClass("expiry")}
              />
              {errors.expiry && (
                <p className="text-xs text-red-500">{errors.expiry}</p>
              )}
            </div>
            <div className="space-y-1">
              <label htmlFor="ck-card-cvc" className="text-xs text-gray-500">
                CVC
              </label>
              <input
                id="ck-card-cvc"
                value={form.cvc}
                onChange={(e) => setField("cvc")(formatCvc(e.target.value))}
                disabled={submitting}
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                className={inputClass("cvc")}
              />
              {errors.cvc && (
                <p className="text-xs text-red-500">{errors.cvc}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="ck-card-country" className="text-xs text-gray-500">
              Billing country
            </label>
            <select
              id="ck-card-country"
              value={form.country}
              onChange={(e) => setField("country")(e.target.value)}
              disabled={submitting}
              className={`${inputClass("country")} cursor-pointer`}
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors duration-200 ${
              submitting
                ? "cursor-not-allowed bg-[#155dfc]/70"
                : "cursor-pointer bg-[#155dfc] hover:bg-[#0d44b3]"
            }`}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting
              ? "Processing…"
              : isCheckout
                ? `Pay $${chargeToday}`
                : "Save card"}
          </button>

          <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <Lock className="h-3 w-3" />
            Payments are encrypted and processed securely.
          </p>
        </form>
      </div>
    </div>
  );
}
