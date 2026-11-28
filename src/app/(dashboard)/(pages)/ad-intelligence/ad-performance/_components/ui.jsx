"use client";

/**
 * Ad Performance — shared building blocks and helpers.
 *
 * Built from the design file (ad-performance.html). Its accent colours are kept
 * exact (blue #1447e6, the green / red / amber / violet chip pairs); its
 * surfaces and greys map onto the app's theme tokens (bg-surface, gray-*) so the
 * page still works in dark mode.
 */

/* ─── formatting ──────────────────────────────────────────────── */

/** The API sends display strings ("₦1,200.00", "1.12%") or null. */
export const isBlank = (v) => v === null || v === undefined || v === "";
export const dash = (v) => (isBlank(v) ? "—" : v);

/** "https://site.com/page" → "site.com/page" */
export const shortUrl = (u) => String(u || "").replace(/^https?:\/\//, "").replace(/\/$/, "");

/** A number out of a display string: "₦1,200.50" → 1200.5, "3.1x" → 3.1. */
export const num = (v) => {
  if (typeof v === "number") return v;
  if (isBlank(v)) return null;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

/* ─── surfaces ────────────────────────────────────────────────── */

export function Card({ children, className = "", ...rest }) {
  return (
    <section
      className={`bg-surface border border-gray-200 rounded-[18px] p-5.5 ${className}`}
      {...rest}
    >
      {children}
    </section>
  );
}

/** Card header row: title (+ optional sub) on the left, slot on the right. */
export function CardHead({ title, sub, id, children }) {
  return (
    <div className="flex flex-wrap gap-2.5 items-center justify-between mb-4">
      <div className="min-w-0">
        <h2 id={id} className="m-0 text-[16.5px] font-bold text-gray-900">
          {title}
        </h2>
        {sub && <div className="text-[13.5px] text-gray-500 mt-0.5">{sub}</div>}
      </div>
      {children}
    </div>
  );
}

/** Small uppercase section label inside a card. */
export function SecTitle({ children, className = "" }) {
  return (
    <div
      className={`text-[11.5px] font-bold uppercase tracking-[0.05em] text-gray-500 ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── tags + chips ────────────────────────────────────────────── */

const TAG = {
  real: "bg-[#dcfce7] text-[#15803d]",
  ai: "bg-[#efe9ff] text-[#6d28d9]",
  est: "bg-[#fef3c7] text-[#92400e]",
};

/** Where a section's numbers come from: "Real", "AI", … */
export function Tag({ kind = "real", children }) {
  return (
    <span
      className={`inline-block text-[11px] font-semibold rounded-full px-2.25 py-0.75 whitespace-nowrap ${TAG[kind]}`}
    >
      {children}
    </span>
  );
}

/**
 * A section's provenance tag, straight from the API's `dataQuality` entry:
 * `real` → green "Real", `ai_assessment` → violet "AI", `unavailable` → amber
 * "Unavailable". The entry's own source / note is the hover text. No entry, no
 * tag — the page never labels a section the backend didn't label.
 */
export function SourceTag({ q }) {
  if (!q?.type) return null;
  const [kind, label] =
    q.type === "real"
      ? ["real", "Real"]
      : q.type === "ai_assessment"
        ? ["ai", "AI"]
        : q.type === "unavailable"
          ? ["est", "Unavailable"]
          : ["est", q.type];
  const hover = [q.source, q.note].filter(Boolean).join(" · ");
  return (
    <span title={hover || undefined}>
      <Tag kind={kind}>{label}</Tag>
    </span>
  );
}

const CHIP = {
  critical: "bg-[#fee2e2] text-[#b91c1c]",
  warning: "bg-[#fef3c7] text-[#92400e]",
  info: "bg-[#e0e7ff] text-[#3730a3]",
  scale: "bg-[#dcfce7] text-[#15803d]",
  keep: "bg-[#e0e7ff] text-[#3730a3]",
  fix: "bg-[#fef3c7] text-[#92400e]",
  pause: "bg-[#fee2e2] text-[#b91c1c]",
  active: "bg-[#dcfce7] text-[#15803d]",
  off: "bg-[#f1f5f9] text-[#475569]",
};

export function Chip({ kind = "off", small = false, className = "", children }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full font-bold ${
        small ? "text-[11px] px-2 py-0.75" : "text-[11.5px] px-2.5 py-1"
      } ${CHIP[kind] ?? CHIP.off} ${className}`}
    >
      {children}
    </span>
  );
}

/** Verdict → chip kind. */
export const verdictKind = (v) =>
  ({ Scale: "scale", Keep: "keep", Fix: "fix", Pause: "pause" })[v] ?? "off";

/** Severity → chip kind + label. */
export const severityKind = (s) =>
  s === "critical" ? "critical" : s === "warning" ? "warning" : "info";
export const severityLabel = (s) =>
  s === "critical" ? "Critical" : s === "warning" ? "Warning" : "Info";

/** Delivery status → chip kind + label ("Disapproved" reads as "Rejected"). */
export const deliveryKind = (s) =>
  s === "Active" ? "active" : s === "Disapproved" ? "critical" : "off";
export const deliveryLabel = (s) => (s === "Disapproved" ? "Rejected" : s);

/** A change badge: green when good, red when bad, grey when neutral. */
export function Delta({ change }) {
  const cls =
    change.good === null || change.good === undefined
      ? "bg-[#f1f5f9] text-[#475569]"
      : change.good
        ? "bg-[#dcfce7] text-[#15803d]"
        : "bg-[#fee2e2] text-[#b91c1c]";
  return (
    <span className={`font-bold rounded-md px-1.5 py-px ${cls}`}>{change.change}</span>
  );
}

/* ─── sparkline ───────────────────────────────────────────────── */

export function Spark({ values, color = "#1447e6" }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const w = 200;
  const h = 34;
  const pts = values
    .map(
      (v, i) =>
        `${(i / (values.length - 1)) * w},${h - 3 - ((v - min) / (max - min || 1)) * (h - 6)}`,
    )
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="block w-full h-8.5 mt-2"
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ─── empty state ─────────────────────────────────────────────── */

/** Shown in place of a section's body when the API has nothing for it. */
export function Empty({ children }) {
  return (
    <div className="rounded-xl bg-gray-50 px-4 py-6 text-center text-[13px] text-gray-500">
      {children}
    </div>
  );
}

/** Primary / ghost buttons from the design. */
export const btn =
  "inline-flex items-center justify-center gap-2 h-10.5 px-4 rounded-[11px] bg-[#1447e6] text-white text-[13.5px] font-semibold hover:bg-[#0f36b3] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 h-10.5 px-4 rounded-[11px] bg-surface text-[#1447e6] border border-[#dbe5ff] text-[13.5px] font-semibold hover:bg-[#eef3ff] transition-colors cursor-pointer";
export const btnSm = "h-9! px-3! text-[12.5px]! rounded-[9px]!";
