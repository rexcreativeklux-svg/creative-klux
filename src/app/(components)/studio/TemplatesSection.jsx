"use client";

// app/(components)/studio/TemplatesSection.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The template rails below the composer: a tab row (Recent designs · Community
// templates · Klux templates) over a responsive card grid.
//
// Every tab is driven by templatesApi.fetchTemplates(), which is stubbed until
// an endpoint is pasted into TEMPLATE_ENDPOINTS. That gives four render states
// this component handles explicitly, so the section looks finished today and
// starts working the moment a URL is filled in:
//
//   loading       → skeleton cards
//   unconfigured  → a calm "coming soon" panel (no endpoint yet)
//   error         → the user-safe message plus a Retry button
//   ok            → real cards, or the tab's own empty hint when the list is bare
//
// Cards render a thumbnail when the row carries one and fall back to a tinted
// monogram tile otherwise, so a backend that returns no images still looks
// deliberate rather than broken.

import { useEffect, useState } from "react";
import { ArrowRight, ImageIcon, RefreshCw, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { TEMPLATE_TABS, fetchTemplates } from "./templatesApi";

/** Relative-ish date label for a card's meta line. */
function formatMeta(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function TemplatesSection({ onSelect }) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState(TEMPLATE_TABS[0].id);
  // The last settled fetch, tagged with the tab it belongs to. Nothing is set
  // synchronously in the effect below — the loading state is DERIVED from this
  // tag not matching the active tab, which keeps tab switches instant and
  // avoids a cascading render on every change.
  const [result, setResult] = useState(null);
  // Bumped by "Try again" to re-run the effect for the same tab.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      const next = await fetchTemplates(activeTab, { token, signal: controller.signal });
      if (controller.signal.aborted) return;
      setResult({ tabId: activeTab, ...next });
    })();

    // Abandon the in-flight request when the tab changes or the page unmounts.
    return () => controller.abort();
  }, [activeTab, token, reloadKey]);

  const state = result?.tabId === activeTab ? result : { status: "loading", items: [] };
  const activeTabMeta = TEMPLATE_TABS.find((tab) => tab.id === activeTab);

  return (
    <section className="w-full border-t border-gray-200 pt-6">
      {/* Tabs */}
      <div className="mb-5 flex flex-wrap items-center gap-x-1 gap-y-2">
        {TEMPLATE_TABS.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={active}
              className={`rounded-lg px-3 py-1.5 text-[13px] transition-colors cursor-pointer ${
                active
                  ? "bg-gray-100 font-semibold text-gray-900"
                  : "font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {state.status === "loading" && <SkeletonGrid />}

      {state.status === "unconfigured" && (
        <ComingSoonPanel label={activeTabMeta?.label} />
      )}

      {state.status === "error" && (
        <div className="rounded-xl border border-gray-200 bg-surface px-5 py-8 text-center">
          <p className="text-sm font-medium text-gray-700">{state.message}</p>
          <button
            type="button"
            onClick={() => {
              // Drop the stale error so the grid falls back to its derived
              // loading state immediately, then re-run the effect.
              setResult(null);
              setReloadKey((key) => key + 1);
            }}
            className="mx-auto mt-3 flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      )}

      {state.status === "ok" &&
        (state.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 px-5 py-10 text-center">
            <ImageIcon className="mx-auto mb-2.5 h-7 w-7 text-gray-300" />
            <p className="text-sm text-gray-500">{activeTabMeta?.emptyHint}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {state.items.map((item) => (
              <TemplateCard key={item.id} item={item} onSelect={onSelect} />
            ))}
          </div>
        ))}
    </section>
  );
}

/** One template/design card. */
function TemplateCard({ item, onSelect }) {
  const meta = formatMeta(item.meta);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(item)}
      className="group overflow-hidden rounded-xl border border-gray-200 bg-surface text-left transition-all hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-[0_8px_24px_rgba(0,61,218,0.10)] cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-blue-500/10 to-purple-500/10">
            <span className="text-2xl font-bold text-blue-600/40">
              {item.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-surface/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
          <ArrowRight className="h-3 w-3 text-blue-600" />
        </span>
      </div>

      <div className="px-3.5 py-3">
        <p className="truncate text-[13px] font-semibold text-gray-900">{item.title}</p>
        {item.description && (
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-gray-500">
            {item.description}
          </p>
        )}
        {(item.author || meta) && (
          <p className="mt-1.5 truncate text-[11px] text-gray-400">
            {[item.author, meta].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
    </button>
  );
}

/** Placeholder shown while a rail is loading. */
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-gray-200 bg-surface"
        >
          <div className="aspect-[4/3] animate-pulse bg-gray-100" />
          <div className="space-y-2 px-3.5 py-3">
            <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Shown for a rail whose endpoint hasn't been wired up yet. */
function ComingSoonPanel({ label }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 px-5 py-12 text-center">
      <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
        <Sparkles className="h-4.5 w-4.5 text-blue-600" />
      </span>
      <p className="text-sm font-semibold text-gray-700">{label} are on the way</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-gray-500">
        This rail is built and waiting on its endpoint — it will fill in
        automatically as soon as the API is connected.
      </p>
    </div>
  );
}
