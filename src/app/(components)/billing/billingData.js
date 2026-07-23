/**
 * Billing static data (placeholder)
 * ──────────────────────────────────────────────────────────────────────────────
 * Single source of truth for everything the /billing page renders. There is NO
 * subscription/billing endpoint on the userend API yet, so all of this is
 * hardcoded on purpose.
 *
 * TODO(endpoint): when the real endpoints land, replace these constants with the
 * fetched payloads — the page and its components already read them through the
 * same shapes, so only this file (and the fetch that fills it) should change:
 *   • GET  /subscription            → CURRENT_SUBSCRIPTION
 *   • GET  /plans                   → PLANS
 *   • GET  /payment-methods         → PAYMENT_METHODS
 *   • GET  /invoices                → INVOICES
 *   • POST /license/redeem          → license-code apply
 *   • POST /subscription/checkout   → card checkout
 */

/** Billing cycles the plan grid can toggle between. */
export const BILLING_CYCLES = {
  MONTHLY: "monthly",
  ANNUAL: "annual",
};

/**
 * The signed-in user's current subscription.
 * `renews` is free text so it can read "Lifetime" as well as a real date.
 */
export const CURRENT_SUBSCRIPTION = {
  planId: "free",
  planName: "Free plan",
  tagline: "3 projects per month included",
  registeredOn: "28th December 2024",
  renews: "Lifetime",
  status: "Active",
};

/**
 * Plan tiers shown in the pricing grid.
 * - `price` holds the per-month figure for each cycle (annual is the discounted
 *   monthly equivalent, billed once a year).
 * - `billedNote` is the small print under the price, per cycle.
 * - `highlight` marks the visually promoted tier ("Most popular").
 */
export const PLANS = [
  {
    id: "free",
    name: "Free",
    tagline: "For getting started",
    price: { monthly: 0, annual: 0 },
    billedNote: { monthly: "Free forever", annual: "Free forever" },
    highlight: false,
    features: [
      "3 projects per month",
      "Basic templates",
      "Standard export quality",
      "On-device AI tools",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For solo creators shipping regularly",
    price: { monthly: 19, annual: 15 },
    billedNote: { monthly: "billed monthly", annual: "billed $180 yearly" },
    highlight: true,
    features: [
      "Unlimited projects",
      "Premium templates & Magic Studio",
      "Remove watermark",
      "4K exports & background removal",
      "Priority support",
    ],
  },
  {
    id: "business",
    name: "Business",
    tagline: "For teams and brands",
    price: { monthly: 49, annual: 39 },
    billedNote: { monthly: "billed monthly", annual: "billed $468 yearly" },
    highlight: false,
    features: [
      "Everything in Pro",
      "Multi-seat workspaces",
      "Shared brand kits & assets",
      "Team roles and permissions",
      "Dedicated support",
    ],
  },
];

/** Saved cards. `primary` drives the highlighted border + PRIMARY badge. */
export const PAYMENT_METHODS = [
  {
    id: "pm_1",
    brand: "Visa",
    holder: "Kingsley Obi",
    last4: "4242",
    expiry: "08/27",
    primary: true,
  },
  {
    id: "pm_2",
    brand: "Mastercard",
    holder: "Kingsley Obi",
    last4: "8319",
    expiry: "02/26",
    primary: false,
  },
];

/** Past invoices. `status` is one of: Paid | Pending | Failed. */
export const INVOICES = [
  {
    id: "inv_1",
    name: "Pro plan — monthly",
    number: "CK-1042",
    invoiceDate: "01 Jul 2026",
    dueDate: "01 Jul 2026",
    amount: 19,
    status: "Paid",
  },
  {
    id: "inv_2",
    name: "Pro plan — monthly",
    number: "CK-1028",
    invoiceDate: "01 Jun 2026",
    dueDate: "01 Jun 2026",
    amount: 19,
    status: "Paid",
  },
  {
    id: "inv_3",
    name: "Extra render credits",
    number: "CK-1017",
    invoiceDate: "18 May 2026",
    dueDate: "25 May 2026",
    amount: 12,
    status: "Pending",
  },
  {
    id: "inv_4",
    name: "Pro plan — monthly",
    number: "CK-1009",
    invoiceDate: "01 May 2026",
    dueDate: "01 May 2026",
    amount: 19,
    status: "Failed",
  },
  {
    id: "inv_5",
    name: "Pro plan — monthly",
    number: "CK-0994",
    invoiceDate: "01 Apr 2026",
    dueDate: "01 Apr 2026",
    amount: 19,
    status: "Paid",
  },
];

/** How many invoice rows fit on one page of the invoices table. */
export const INVOICES_PER_PAGE = 4;
