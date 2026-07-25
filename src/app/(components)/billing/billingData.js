/**
 * Billing data & mappers
 * ──────────────────────────────────────────────────────────────────────────────
 * Source of truth for the /billing page.
 *
 * Two halves live here:
 *   • The signed-in user's ACTIVE package — fetched live from the userend API
 *     (GET /package, and again from POST /apply-promotion-code after a license
 *     code is redeemed). `packageToSubscription` maps that raw payload into the
 *     shape the Current Subscription card renders.
 *   • The PLANS grid — still HANDCODED on purpose; there is no public plans
 *     endpoint yet, so the pricing tiers are maintained here.
 *
 * Payment itself is NOT handled here — an external processor (Stripe) owns cards,
 * checkout and the billing portal, so this page carries no card or invoice UI.
 */

/** Billing cycles the plan grid can toggle between. */
export const BILLING_CYCLES = {
  MONTHLY: "monthly",
  ANNUAL: "annual",
};

/**
 * Neutral placeholder shown for the split-second before GET /package resolves.
 * Once the real package arrives it is replaced via `packageToSubscription`.
 */
export const SUBSCRIPTION_FALLBACK = {
  planId: null,
  planName: "Free plan",
  tagline: "3 projects per month included",
  registeredOn: "—",
  renews: "Lifetime",
  status: "Active",
};

// ── PACKAGE → SUBSCRIPTION MAPPER ──────────────────────────────────────────────
// The userend package payload (GET /package, POST /apply-promotion-code) exposes
// raw quotas (num_creatives, num_brands, num_tokens…) rather than the display
// copy the card needs, so we derive that copy here.

/** English ordinal suffix for a day-of-month (1 → "1st", 22 → "22nd"). */
const ordinal = (n) => {
  const suffixes = ["th", "st", "nd", "rd"];
  const remainder = n % 100;
  return `${n}${suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0]}`;
};

/**
 * Format an ISO timestamp as "28th December 2024". UTC-based so the day never
 * shifts across timezones. Returns "—" for missing/invalid dates.
 */
const formatRegistered = (iso) => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const day = ordinal(date.getUTCDate());
  const month = date.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  return `${day} ${month} ${date.getUTCFullYear()}`;
};

/**
 * A generic one-line write-up of what the package includes, built from its
 * headline quotas — e.g. "100 creatives, 10 brands & 30,000 AI tokens included".
 * Only non-empty quotas are listed, so a sparse package still reads cleanly.
 */
const buildPlanTagline = (pkg) => {
  const parts = [];
  const add = (value, label) => {
    const num = Number(value);
    if (Number.isFinite(num) && num > 0) parts.push(`${num.toLocaleString()} ${label}`);
  };

  add(pkg?.num_creatives, "creatives");
  add(pkg?.num_brands, "brands");
  add(pkg?.num_tokens, "AI tokens");

  if (parts.length === 0) return "Plan details";
  if (parts.length === 1) return `${parts[0]} included`;
  const last = parts.pop();
  return `${parts.join(", ")} & ${last} included`;
};

/**
 * Keep the plan name reading naturally after "You're on the …" — append "plan"
 * only when the name doesn't already carry a plan/package/tier word.
 */
const displayPlanName = (name) => {
  if (!name) return "Current plan";
  return /plan|package|tier|subscription/i.test(name) ? name : `${name} plan`;
};

/**
 * Map a raw userend package payload (the `data` object of /package or
 * /apply-promotion-code) into the subscription shape the Current Subscription
 * card renders. Falls back to the placeholder for a missing payload.
 *
 * @param {object} pkg - The API `data` object (name, num_*, created_at, status…).
 * @returns {object} Subscription: { planId, planName, tagline, registeredOn, renews, status }.
 */
export const packageToSubscription = (pkg) => {
  if (!pkg) return SUBSCRIPTION_FALLBACK;
  return {
    planId: pkg.id ?? null,
    planName: displayPlanName(pkg.name),
    tagline: buildPlanTagline(pkg),
    registeredOn: formatRegistered(pkg.created_at),
    // No per-user renewal date is returned yet, so the plan reads as Lifetime.
    renews: "Lifetime",
    status: pkg.status === 1 ? "Active" : "Inactive",
  };
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
