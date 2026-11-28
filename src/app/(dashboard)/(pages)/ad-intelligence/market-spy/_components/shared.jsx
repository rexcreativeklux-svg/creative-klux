"use client";

import React from "react";

/**
 * Shared bits for Market Spy.
 *
 * Rule for this whole page: every value shown comes from the backend response.
 * Nothing is inferred, defaulted or invented here. A field the backend sends
 * as null / empty is left out (or shown as "—"), and every "real / estimate /
 * unavailable" label is read from the backend's own `dataQuality` object.
 */

export const isEmpty = (v) =>
  v === null ||
  v === undefined ||
  v === "" ||
  (Array.isArray(v) && v.length === 0);

export const has = (v) => !isEmpty(v);

export const shortUrl = (u) =>
  String(u || "").replace(/^https?:\/\/(www\.)?/, "");

// ── data quality tag ─────────────────────────────────────────────────────────
// `dq` is one entry of the backend's `dataQuality` object, for example
// { type: "estimate", confidence: "low", note: "AI estimate" }.
// The text is the backend's own words; only the colour is ours.
const TAG_TONE = {
  real: "bg-green-100 text-green-700",
  estimate: "bg-amber-100 text-amber-800",
  ai_assessment: "bg-violet-100 text-violet-700",
  unavailable: "bg-gray-100 text-gray-500",
};

export function qualityText(dq) {
  if (!dq) return null;
  const parts = [String(dq.type || "").replace(/_/g, " ")];
  if (dq.confidence) parts.push(`${dq.confidence} confidence`);
  return parts.filter(Boolean).join(" · ");
}

export function QualityTag({ dq }) {
  if (!dq?.type) return null;
  const detail = [dq.note, dq.source].filter(Boolean).join(" — ");
  return (
    <span
      title={detail || undefined}
      className={`inline-block text-[11px] font-semibold rounded-full px-2.5 py-0.5 whitespace-nowrap ${
        TAG_TONE[dq.type] || TAG_TONE.unavailable
      }`}
    >
      {qualityText(dq)}
    </span>
  );
}

// ── layout atoms ─────────────────────────────────────────────────────────────
export function Card({ children, className = "", ...rest }) {
  return (
    <section
      className={`bg-surface border border-gray-200 rounded-2xl p-5 sm:p-6 ${className}`}
      {...rest}
    >
      {children}
    </section>
  );
}

export function CardHead({ title, sub, right }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function SecTitle({ children, className = "" }) {
  return (
    <p
      className={`text-[11px] font-bold uppercase tracking-wider text-gray-400 ${className}`}
    >
      {children}
    </p>
  );
}

export function Bullets({ items, marker = "•", markerClass = "text-gray-400" }) {
  if (isEmpty(items)) return null;
  return (
    <ul className="space-y-2">
      {items.map((t, i) => (
        <li
          key={i}
          className="text-[13px] text-gray-600 flex gap-2.5 leading-[1.65]"
        >
          <span className={`shrink-0 ${markerClass}`}>{marker}</span>
          <span className="min-w-0">{t}</span>
        </li>
      ))}
    </ul>
  );
}

// Signal badge colours. The signal TEXT is the backend's; unknown signals fall
// back to a neutral chip rather than being dropped.
const SIGNAL_TONE = {
  Scaling: "bg-blue-600 text-white",
  Proven: "bg-green-600 text-white",
  Performing: "bg-teal-700 text-white",
  Testing: "bg-amber-500 text-amber-950",
  New: "bg-white text-gray-900 border border-gray-200",
};
export const signalTone = (signal) =>
  SIGNAL_TONE[String(signal || "").split(" ")[0]] ||
  "bg-gray-100 text-gray-700";
