"use client";

/**
 * Plans & Billing (/billing)
 * ──────────────────────────────────────────────────────────────────────────────
 * The single billing surface for the app — linked from the sidebar's account
 * menu ("Plans And Billing"). It replaces the old billing-one / billing-two
 * prototypes.
 *
 * Two ways to upgrade, side by side:
 *   1. License code — paste a key and activate instantly (LicenseCodeCard)
 *   2. Card payment — pay for a tier straight from the plan grid (CheckoutModal)
 *
 * ⚠️ ALL DATA HERE IS STATIC PLACEHOLDER. The userend API has no subscription,
 * plan, payment-method or invoice endpoints yet, so every action is simulated
 * locally (optimistic state + a toast) and nothing leaves the browser. The
 * shapes live in src/data/billingData.js with a TODO(endpoint) list — wire the
 * fetches there and this page keeps working unchanged.
 */

import { useRef, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  CreditCard,
  Plus,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import CheckoutModal from "@/app/(components)/billing/CheckoutModal";
import InvoicesTable from "@/app/(components)/billing/InvoicesTable";
import LicenseCodeCard from "@/app/(components)/billing/LicenseCodeCard";
import PaymentMethodCard from "@/app/(components)/billing/PaymentMethodCard";
import PlanCard from "@/app/(components)/billing/PlanCard";
import {
  BILLING_CYCLES,
  CURRENT_SUBSCRIPTION,
  INVOICES,
  PAYMENT_METHODS,
  PLANS,
} from "@/app/(components)/billing/billingData";

/** Stands in for a network round-trip so the loading states are visible. */
const simulateRequest = (ms = 900) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export default function PlansAndBilling() {
  const { user } = useAuth();

  const [cycle, setCycle] = useState(BILLING_CYCLES.MONTHLY);
  const [subscription, setSubscription] = useState(CURRENT_SUBSCRIPTION);
  const [methods, setMethods] = useState(PAYMENT_METHODS);

  // Checkout dialog: `mode` decides whether we're buying a plan or just adding
  // a card, and `plan` is the tier being bought (null in add-card mode).
  const [checkout, setCheckout] = useState({
    open: false,
    mode: "checkout",
    plan: null,
  });

  // "Upgrade plan" in the summary card jumps down to the pricing grid.
  const plansRef = useRef(null);
  const scrollToPlans = () =>
    plansRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  // ── PLAN CHECKOUT (card) ──────────────────────────────
  const openCheckout = (plan) =>
    setCheckout({ open: true, mode: "checkout", plan });

  const closeCheckout = () => setCheckout((prev) => ({ ...prev, open: false }));

  // TODO(endpoint): POST the payment to the real processor and refetch the
  // subscription instead of patching local state.
  const handlePayment = async ({ holder, last4, expiry, planId }) => {
    await simulateRequest();

    const paidPlan = PLANS.find((p) => p.id === planId);
    if (!paidPlan) throw new Error("That plan is no longer available.");

    setSubscription((prev) => ({
      ...prev,
      planId: paidPlan.id,
      planName: `${paidPlan.name} plan`,
      tagline: paidPlan.tagline,
      renews:
        cycle === BILLING_CYCLES.ANNUAL
          ? "Yearly · auto-renews"
          : "Monthly · auto-renews",
    }));

    // Newly used card becomes the primary one, mirroring how processors behave.
    setMethods((prev) => [
      {
        id: `pm_${Date.now()}`,
        brand: "Card",
        holder,
        last4,
        expiry,
        primary: true,
      },
      ...prev.map((m) => ({ ...m, primary: false })),
    ]);

    console.log("✅ Plan upgraded via card:", paidPlan.name);
    toast.success(`You're on the ${paidPlan.name} plan.`);
  };

  // ── LICENSE CODE ──────────────────────────────────────
  // TODO(endpoint): POST the code and adopt the plan the API returns. Until
  // then we infer the tier from the key's middle block (CKLUX-PRO-…).
  const handleRedeemCode = async (code) => {
    await simulateRequest();

    const tierKey = code.split("-")[1]?.toLowerCase();
    const matched = PLANS.find((p) => p.id === tierKey);
    if (!matched) {
      throw new Error("That code isn't recognised. Check it and try again.");
    }
    if (matched.id === subscription.planId) {
      throw new Error(`You're already on the ${matched.name} plan.`);
    }

    setSubscription((prev) => ({
      ...prev,
      planId: matched.id,
      planName: `${matched.name} plan`,
      tagline: matched.tagline,
      renews: "Lifetime",
    }));

    console.log("✅ Plan activated via license code:", matched.name);
    toast.success(`${matched.name} plan activated with your license code.`);
  };

  // ── PAYMENT METHODS ───────────────────────────────────
  // TODO(endpoint): persist these three actions against the real API.
  const handleAddCard = async ({ holder, last4, expiry }) => {
    await simulateRequest(700);
    setMethods((prev) => [
      ...prev,
      {
        id: `pm_${Date.now()}`,
        brand: "Card",
        holder,
        last4,
        expiry,
        primary: prev.length === 0,
      },
    ]);
    console.log("✅ Card saved ending", last4);
    toast.success("Card saved.");
  };

  const handleMakePrimary = (id) => {
    setMethods((prev) => prev.map((m) => ({ ...m, primary: m.id === id })));
    console.log("💾 Primary card set:", id);
    toast.success("Primary card updated.");
  };

  const handleRemoveCard = (id) => {
    setMethods((prev) => prev.filter((m) => m.id !== id));
    console.log("🗑️ Card removed:", id);
    toast.success("Card removed.");
  };

  // ── INVOICES ──────────────────────────────────────────
  // TODO(endpoint): swap for the real receipt/export downloads.
  const handleDownloadInvoice = (invoice) => {
    console.log("📄 Invoice download requested:", invoice.number);
    toast.info(`Receipt ${invoice.number} isn't available yet.`);
  };

  const handleExportInvoices = () => {
    console.log("📄 Invoice export requested");
    toast.info("Invoice export is coming soon.");
  };

  const isAnnual = cycle === BILLING_CYCLES.ANNUAL;

  return (
    <div className="space-y-6 py-3 pb-16">
      {/* ── HEADER ───────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-medium text-gray-900">Plans & Billing</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Manage your subscription, payment methods and invoices
        </p>
      </div>

      {/* ── CURRENT SUBSCRIPTION ─────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-surface">
        {/* Gradient band */}
        <div className="bg-linear-to-r from-[#155dfc] to-blue-400 px-6 py-5">
          <h2 className="text-lg font-semibold text-white">
            Current Subscription
          </h2>
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

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                setCheckout({ open: true, mode: "add-card", plan: null })
              }
              className="cursor-pointer rounded-lg border border-gray-200 bg-surface px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              Manage billing details
            </button>
            <button
              type="button"
              onClick={scrollToPlans}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#155dfc] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0d44b3]"
            >
              Upgrade plan
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── LICENSE CODE ─────────────────────────────── */}
      <LicenseCodeCard onRedeem={handleRedeemCode} />

      {/* ── PLANS ────────────────────────────────────── */}
      <section ref={plansRef} className="scroll-mt-6 space-y-4">
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
              onSelect={openCheckout}
            />
          ))}
        </div>
      </section>

      {/* ── PAYMENT METHODS ──────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-surface p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Payment methods
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Cards used for subscription charges
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setCheckout({ open: true, mode: "add-card", plan: null })
            }
            className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            <Plus className="h-3.5 w-3.5" />
            New method
          </button>
        </div>

        {methods.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 py-10 text-center">
            <CreditCard className="h-5 w-5 text-gray-400" />
            <p className="text-sm text-gray-500">No payment methods yet.</p>
            <button
              type="button"
              onClick={() =>
                setCheckout({ open: true, mode: "add-card", plan: null })
              }
              className="cursor-pointer text-xs font-semibold text-[#155dfc] hover:underline"
            >
              Add your first card
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {methods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                onMakePrimary={handleMakePrimary}
                onRemove={handleRemoveCard}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── INVOICES ─────────────────────────────────── */}
      <InvoicesTable
        invoices={INVOICES}
        onDownload={handleDownloadInvoice}
        onExport={handleExportInvoices}
      />

      {/* ── CARD DIALOG (checkout / add-card) ────────── */}
      <CheckoutModal
        open={checkout.open}
        onClose={closeCheckout}
        mode={checkout.mode}
        plan={checkout.plan}
        cycle={cycle}
        onSubmit={checkout.mode === "checkout" ? handlePayment : handleAddCard}
      />
    </div>
  );
}
