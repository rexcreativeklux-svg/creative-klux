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
  LIFETIME: "lifetime",
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

const count = (n, noun) => `${n.toLocaleString()} ${noun}${n === 1 ? "" : "s"}`;

/** The feature list for one package, straight from its quotas. */
const quotaFeatures = (q) => [
  `${q.tokens.toLocaleString()} AI tokens / month`,
  `${q.creatives.toLocaleString()} creatives / month`,
  count(q.brands, "brand"),
  count(q.teams, "team member"),
  count(q.integrations, "integration"),
  count(q.copilots, "copilot"),
  `${q.storage} GB storage`,
  // Resells are agency-only, so the line is dropped where there are none.
  ...(q.resells > 0 ? [count(q.resells, "resell")] : []),
];

/**
 * One tier → the shape PlanCard renders. `shared` quotas are the same on every
 * cycle; `cycles` carries what differs (price, tokens, creatives, resells).
 */
const tier = ({ shared, cycles, ...rest }) => ({
  ...rest,
  price: Object.fromEntries(
    Object.entries(cycles).map(([cycle, pkg]) => [cycle, pkg.price]),
  ),
  features: Object.fromEntries(
    Object.entries(cycles).map(([cycle, pkg]) => [
      cycle,
      quotaFeatures({ ...shared, ...pkg }),
    ]),
  ),
});

/** Unit after the price, and the small print under it, per cycle. */
export const CYCLE_COPY = {
  monthly: { unit: "/mo", note: "billed monthly" },
  annual: { unit: "/yr", note: "billed yearly — 12 months for the price of 10" },
  lifetime: { unit: "", note: "one-time payment, perpetual access" },
};

/**
 * The nine packages — three tiers × three cycles — mirroring the admin Packages
 * form (duration 30 / 365 / 36500 days).
 * - Tokens and creatives are PER MONTH on every package, lifetime included: a
 *   lifetime plan grants perpetual access, not a perpetual pile of credits.
 * - `highlight` marks the visually promoted tier ("Most popular").
 */
export const PLANS = [
  tier({
    id: "starter",
    name: "Starter",
    tagline: "For solo creators getting started",
    highlight: false,
    shared: { brands: 1, teams: 1, integrations: 3, copilots: 1, storage: 5 },
    cycles: {
      monthly: { price: 15, tokens: 45000, creatives: 50, resells: 0 },
      annual: { price: 150, tokens: 45000, creatives: 50, resells: 0 },
      lifetime: { price: 59, tokens: 15000, creatives: 20, resells: 0 },
    },
  }),
  tier({
    id: "growth",
    name: "Growth",
    tagline: "For growing brands and small teams",
    highlight: true,
    shared: { brands: 5, teams: 5, integrations: 10, copilots: 5, storage: 25 },
    cycles: {
      monthly: { price: 39, tokens: 110000, creatives: 150, resells: 0 },
      annual: { price: 390, tokens: 110000, creatives: 150, resells: 0 },
      lifetime: { price: 129, tokens: 36000, creatives: 50, resells: 0 },
    },
  }),
  tier({
    id: "agency",
    name: "Agency",
    tagline: "For agencies with their own clients",
    highlight: false,
    shared: { brands: 20, teams: 20, integrations: 25, copilots: 20, storage: 100 },
    cycles: {
      monthly: { price: 89, tokens: 250000, creatives: 400, resells: 25 },
      annual: { price: 890, tokens: 250000, creatives: 400, resells: 25 },
      lifetime: { price: 249, tokens: 60000, creatives: 100, resells: 10 },
    },
  }),
];
