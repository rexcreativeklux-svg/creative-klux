"use client";

/**
 * Plans & Billing (/billing)
 * ──────────────────────────────────────────────────────────────────────────────
 * The single billing surface for the app — linked from the sidebar's account
 * menu ("Plans And Billing"). It replaces the old billing-one / billing-two
 * prototypes.
 *
 * The Current Subscription card is LIVE: it reads the signed-in user's active
 * package from GET /package, and re-reads it from POST /apply-promotion-code
 * after a license code is redeemed. Both payloads are mapped into the card's
 * shape by `packageToSubscription` (see ./(components)/billing/billingData.js).
 *
 * Two ways to upgrade:
 *   1. Card payment — the plan CTA hands off to an external processor (Stripe)
 *      for card capture, checkout and the billing portal, so there is NO card
 *      form, saved-cards or invoice UI on this page.
 *   2. License code — paste a key and activate instantly (LicenseCodeCard),
 *      which POSTs to /apply-promotion-code. The code entry stays hidden until
 *      the user asks to upgrade, keeping the default view clean.
 *
 * ⚠️ The PLANS grid is still HANDCODED — there is no public plans endpoint yet.
 * Stripe checkout is likewise a placeholder (see handleUpgrade) until the
 * checkout-session endpoint exists.
 */

import { useEffect, useRef, useState } from "react";
import { BadgeCheck, CalendarDays, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import LicenseCodeCard from "@/app/(components)/billing/LicenseCodeCard";
import PlanCard from "@/app/(components)/billing/PlanCard";
import {
  BILLING_CYCLES,
  SUBSCRIPTION_FALLBACK,
  packageToSubscription,
  PLANS,
} from "@/app/(components)/billing/billingData";

const API_BASE = "https://api.creativeklux.com/api/creativeklux-userend";

export default function PlansAndBilling() {
  const { user, token } = useAuth();

  const [cycle, setCycle] = useState(BILLING_CYCLES.MONTHLY);
  const [subscription, setSubscription] = useState(SUBSCRIPTION_FALLBACK);

  // ── ACTIVE PACKAGE ────────────────────────────────────
  // Load the user's current package and map it into the subscription card.
  useEffect(() => {
    const fetchPackage = async () => {
      try {
        console.log("📡 Fetching active package…");
        const res = await fetch(`${API_BASE}/package`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await res.json();
        if (!res.ok || !payload?.success) {
          throw new Error(payload?.message || "Failed to fetch package");
        }
        setSubscription(packageToSubscription(payload.data));
        console.log("✅ Active package loaded:", payload.data?.name);
      } catch (err) {
        console.error("❌ Package not fetched:", err);
      }
    };
    if (token) fetchPackage();
  }, [token]);

  // The license-code entry is hidden until the user presses "Upgrade plan" — the
  // default view is just the subscription summary and the plans grid.
  const [showLicense, setShowLicense] = useState(false);

  // "Upgrade plan" reveals the license option and scrolls to the upgrade area.
  const upgradeRef = useRef(null);
  const startUpgrade = () => {
    setShowLicense(true);
    // Wait a tick so the newly revealed section exists before we scroll to it.
    requestAnimationFrame(() =>
      upgradeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  // ── PLAN CHECKOUT (Stripe) ────────────────────────────
  // Stripe owns the card flow: normally we'd POST to create a Checkout session
  // and redirect the browser to Stripe's hosted page. Until that endpoint
  // exists, this just acknowledges the intent.
  // TODO(endpoint): POST /billing/checkout-session { planId, cycle } → redirect
  // to the returned Stripe URL.
  const handleUpgrade = (plan) => {
    console.log("💳 Starting Stripe checkout for plan:", plan.id, "cycle:", cycle);
    toast.info("Secure checkout with Stripe is coming soon.");
  };

  // ── LICENSE CODE ──────────────────────────────────────
  // Redeem the code against /apply-promotion-code. On success the API returns
  // the newly-activated package, which we map straight into the subscription
  // card — no local guessing. Throws so LicenseCodeCard can surface the error.
  const handleRedeemCode = async (code) => {
    console.log("🎟️ Applying promotion code…", code);
    const res = await fetch(`${API_BASE}/apply-promotion-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code }),
    });
    const payload = await res.json();

    if (!res.ok || !payload?.success) {
      throw new Error(
        payload?.message || "That code isn't recognised. Check it and try again.",
      );
    }

    const next = packageToSubscription(payload.data);
    setSubscription(next);
    console.log("✅ Plan activated via license code:", next.planName);
    toast.success(`${next.planName} activated with your license code.`);
  };

  const isAnnual = cycle === BILLING_CYCLES.ANNUAL;

  return (
    <div className="space-y-6 py-3 pb-16">
      {/* ── HEADER ───────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-medium text-gray-900">Plans & Billing</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Manage your subscription and upgrades
        </p>
      </div>

      {/* ── CURRENT SUBSCRIPTION ─────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-surface">
        {/* Gradient band */}
        <div className="bg-linear-to-r from-[#155dfc] to-blue-400 px-6 py-5">
          <h2 className="text-lg font-semibold text-white">Current Subscription</h2>
          <p className="mt-0.5 text-xs text-blue-50">
            Your active plan and renewal details
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 divide-y divide-gray-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-6 py-5 text-center">
            <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
              <BadgeCheck className="h-3.5 w-3.5" />
              Plan
            </p>
            <p className="mt-1.5 text-base font-semibold capitalize text-gray-900">
              {subscription.planName}
            </p>
          </div>
          <div className="px-6 py-5 text-center">
            <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
              <CalendarDays className="h-3.5 w-3.5" />
              Registered
            </p>
            <p className="mt-1.5 text-base font-semibold text-gray-900">
              {subscription.registeredOn}
            </p>
          </div>
          <div className="px-6 py-5 text-center">
            <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
              <Sparkles className="h-3.5 w-3.5" />
              Renews
            </p>
            <p className="mt-1.5 text-base font-semibold text-gray-900">
              {subscription.renews}
            </p>
          </div>
        </div>

        {/* Status strip */}
        <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
              <BadgeCheck className="h-4.5 w-4.5 text-[#155dfc]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                You&apos;re on the {subscription.planName}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {subscription.tagline}
                {user?.email ? ` · billed to ${user.email}` : ""}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={startUpgrade}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#155dfc] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0d44b3]"
          >
            Upgrade plan
            <Sparkles className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── UPGRADE AREA (license code + plans) ──────── */}
      <div className="scroll-mt-6 space-y-6">
        {/* License code — revealed only after "Upgrade plan" is pressed */}
        {showLicense && <LicenseCodeCard ref={upgradeRef} onRedeem={handleRedeemCode} />}

        {/* Plans */}
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Plans</h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Pick the plan that matches how much you create. Change or cancel
                whenever you like.
              </p>
            </div>

            {/* Cycle toggle */}
            <div className="inline-flex shrink-0 items-center gap-1 self-start rounded-full border border-gray-200 bg-surface p-1 sm:self-auto">
              <button
                type="button"
                onClick={() => setCycle(BILLING_CYCLES.MONTHLY)}
                className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  !isAnnual
                    ? "bg-[#155dfc] text-white"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setCycle(BILLING_CYCLES.ANNUAL)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  isAnnual
                    ? "bg-[#155dfc] text-white"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Annual
                <span
                  className={`text-[10px] font-bold ${
                    isAnnual ? "text-blue-100" : "text-green-600"
                  }`}
                >
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                cycle={cycle}
                isCurrent={plan.id === subscription.planId}
                onSelect={handleUpgrade}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
