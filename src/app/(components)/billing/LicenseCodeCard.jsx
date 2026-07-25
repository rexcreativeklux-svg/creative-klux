"use client";

import { useState } from "react";
import { Loader2, Ticket } from "lucide-react";
import { toast } from "sonner";

/**
 * LicenseCodeCard
 * ---------------
 * The "redeem a license key" path to upgrading — the alternative to paying by
 * card. The user pastes a key (e.g. CKLUX-PRO-XXXX-XXXX) and applies it; no card
 * details are required.
 *
 * ⚠️ Placeholder: there is no redeem endpoint yet, so `onRedeem` is simulated by
 * the parent. This component owns only the input, its formatting/validation, and
 * the in-flight button state — see TODO(endpoint) in ./billingData.js.
 *
 * @param {Function} onRedeem - Async handler called with the cleaned code.
 *                              Should throw on failure so we can toast it.
 */

// Keys are stored/compared uppercase with single dashes; users paste all sorts
// of things (spaces, lowercase, trailing dashes) so we normalise before use.
const normalizeCode = (raw) =>
  raw
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 29);

// A usable key is at least 3 dash-separated blocks — enough to reject obvious
// typos client-side without guessing the backend's exact key format.
const isPlausibleCode = (code) =>
  code.split("-").filter(Boolean).length >= 3 && code.length >= 10;

export default function LicenseCodeCard({ onRedeem }) {
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const handleApply = async () => {
    const cleaned = normalizeCode(code).replace(/-$/, "");

    if (!cleaned) {
      toast.error("Enter your license code first.");
      return;
    }
    if (!isPlausibleCode(cleaned)) {
      toast.error("That doesn't look like a valid license code.");
      return;
    }

    setRedeeming(true);
    console.log("🎟️ Redeeming license code…", cleaned);
    try {
      await onRedeem?.(cleaned);
      console.log("✅ License code redeemed:", cleaned);
      setCode("");
    } catch (err) {
      console.error("❌ License redeem failed:", err);
      toast.error(err?.message || "We couldn't redeem that code. Please try again.");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-surface p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Copy */}
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
            <Ticket className="h-4.5 w-4.5 text-[#155dfc]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Have a license code?
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Redeem a key to activate or upgrade your plan instantly — no card
              required.
            </p>
          </div>
        </div>

        {/* Input + action */}
        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <input
            value={code}
            onChange={(e) => setCode(normalizeCode(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
            disabled={redeeming}
            placeholder="e.g. CKLUX-PRO-XXXX-XXXX"
            aria-label="License code"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm tracking-wide text-gray-900 transition-colors placeholder:tracking-normal placeholder:text-gray-400 focus:border-[#155dfc] focus:outline-none disabled:opacity-60 sm:w-72"
          />
          <button
            type="button"
            onClick={handleApply}
            disabled={redeeming}
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 ${
              redeeming
                ? "cursor-not-allowed bg-[#155dfc]/70"
                : "cursor-pointer bg-[#155dfc] hover:bg-[#0d44b3]"
            }`}
          >
            {redeeming && <Loader2 className="h-4 w-4 animate-spin" />}
            {redeeming ? "Applying…" : "Apply code"}
          </button>
        </div>
      </div>
    </div>
  );
}
