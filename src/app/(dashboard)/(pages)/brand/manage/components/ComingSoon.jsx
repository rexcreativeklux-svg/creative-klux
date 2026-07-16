/**
 * ComingSoon.jsx
 * Shared placeholder panel for tabs that aren't built yet
 * (Auth and Security, Skills, Configuration). Copy comes from TAB_CONFIG.
 */

"use client";

export default function ComingSoon({ title, description }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-surface p-4 sm:p-6">
      <div className="rounded-xl border border-gray-100 bg-gray-50/40 px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
            Coming Soon
          </span>
        </div>
        <p className="mt-1.5 text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}
