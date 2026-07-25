"use client";

// app/(components)/studio/TemplatesSection.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The template rails below the Studio composer.
//
// Deliberately FULL-BLEED: the page's hero is capped and centred, but this
// section runs edge to edge, so it renders outside the page's max-width wrapper
// and owns its own horizontal padding. The card grid itself is flush to the
// edges and each card carries its own inset padding, which is what lines the
// first card's artwork up with the tab row above it.
//
// Structure:
//   ── full-width rule ─────────────────────────────────────────────
//   Recent designs • Community templates • Klux templates   Browse all ↗
//   ── full-width rule ─────────────────────────────────────────────
//   │  card  │  card  │  card  │  card  │      ← columns divided by rules
//
// Every tab is driven by templatesApi.fetchTemplates(), which is stubbed until
// an endpoint is pasted into TEMPLATE_ENDPOINTS. That gives four render states
// this component handles explicitly, so the section looks finished today and
// starts working the moment a URL is filled in:
//
//   loading       → skeleton cards in the same grid
//   unconfigured  → a calm "coming soon" panel (no endpoint yet)
//   error         → the user-safe message plus a Retry button
//   ok            → real cards, or the tab's own empty hint when the list is bare

import { Fragment, useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Globe,
  ImageIcon,
  MoreHorizontal,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { TEMPLATE_TABS, fetchTemplates } from "./templatesApi";

/** Horizontal padding shared by the tab row and each card's inset. */
const GUTTER = "px-4 sm:px-6";

/** Relative-ish date label for a card's footer. */
function formatMeta(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

/**
 * @param {object} props
 * @param {(item: object) => void} [props.onSelect]     Open a template.
 * @param {(item: object) => void} [props.onItemMenu]   The card's "…" menu.
 * @param {() => void} [props.onBrowseAll]              The "Browse all" link.
 */
export default function TemplatesSection({ onSelect, onItemMenu, onBrowseAll }) {
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
    <section className="w-full border-t border-gray-200">
      {/* ── Tab row ─────────────────────────────────────────────────────── */}
      <div className={`flex items-center justify-between gap-4 py-3.5 ${GUTTER}`}>
        <div className="hide-scrollbar flex items-center gap-2.5 overflow-x-auto">
          {TEMPLATE_TABS.map((tab, index) => {
            const active = tab.id === activeTab;
            return (
              <Fragment key={tab.id}>
                {index > 0 && (
                  <span
                    aria-hidden="true"
                    className="h-1 w-1 shrink-0 rounded-full bg-blue-600"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-pressed={active}
                  className={`shrink-0 whitespace-nowrap text-[13px] transition-colors cursor-pointer ${
                    active
                      ? "font-semibold text-gray-900"
                      : "font-medium text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              </Fragment>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onBrowseAll}
          className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-gray-600 transition-colors hover:text-gray-900 cursor-pointer"
        >
          Browse all
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {state.status === "loading" && <SkeletonGrid />}

      {state.status === "unconfigured" && (
        <StatePanel
          icon={Sparkles}
          title={`${activeTabMeta?.label} are on the way`}
          body="This rail is built and waiting on its endpoint — it will fill in automatically as soon as the API is connected."
        />
      )}

      {state.status === "error" && (
        <StatePanel icon={RefreshCw} title={state.message}>
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
        </StatePanel>
      )}

      {state.status === "ok" &&
        (state.items.length === 0 ? (
          <StatePanel icon={ImageIcon} title={activeTabMeta?.emptyHint} />
        ) : (
          <CardGrid>
            {state.items.map((item) => (
              <TemplateCard
                key={item.id}
                item={item}
                onSelect={onSelect}
                onItemMenu={onItemMenu}
              />
            ))}
          </CardGrid>
        ))}
    </section>
  );
}

/**
 * The full-bleed grid. `-mr-px` swallows the right-most column's divider so the
 * rule doesn't hang off the edge of the viewport.
 */
function CardGrid({ children }) {
  return (
    <div className="-mr-px grid grid-cols-1 border-t border-gray-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  );
}

/** One template/design card — artwork, title, author, then date + open arrow. */
function TemplateCard({ item, onSelect, onItemMenu }) {
  const meta = formatMeta(item.meta);

  const open = () => onSelect?.(item);

  return (
    // A div rather than a button: the "…" menu is itself a button, and nesting
    // buttons is invalid HTML. Keyboard support is wired up by hand instead.
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
      aria-label={`Open ${item.title}`}
      className={`group flex cursor-pointer flex-col border-b border-r border-gray-200 py-5 transition-colors hover:bg-gray-100/60 focus:outline-none focus-visible:bg-gray-100/60 ${GUTTER}`}
    >
      {/* Artwork */}
      <div className="aspect-16/10 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
        {item.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-blue-500/10 to-purple-500/10">
            <span className="text-3xl font-bold text-blue-600/40">
              {item.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Title + author */}
      <div className="mt-3.5 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[15px] font-semibold text-gray-900">
            <span className="truncate">{item.title}</span>
            {item.isPublic && (
              <Globe className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-label="Public" />
            )}
          </p>
          {item.author && (
            <p className="mt-0.5 truncate text-[13px] text-gray-500">by {item.author}</p>
          )}
        </div>

        {onItemMenu && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation(); // don't also open the card
              onItemMenu(item);
            }}
            aria-label={`More options for ${item.title}`}
            className="-mr-1 shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 cursor-pointer"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Footer: date + open affordance */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <span className="truncate text-[13px] text-gray-500">{meta}</span>
        {/* gray-900 / surface invert together, so this reads as a dark chip in
            light mode and a light one in dark mode without a second rule. */}
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-surface transition-transform group-hover:scale-105"
        >
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

/** Skeleton cards, laid out in the same grid so nothing shifts on load. */
function SkeletonGrid() {
  return (
    <CardGrid>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={`border-b border-r border-gray-200 py-5 ${GUTTER}`}>
          <div className="aspect-16/10 animate-pulse rounded-lg bg-gray-100" />
          <div className="mt-3.5 space-y-2">
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
            <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-100" />
          </div>
        </div>
      ))}
    </CardGrid>
  );
}

/** Shared empty / coming-soon / error panel, centred across the full width. */
function StatePanel({ icon: Icon, title, body, children }) {
  return (
    <div className="border-t border-gray-200 px-5 py-14 text-center">
      <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
        <Icon className="h-4.5 w-4.5 text-blue-600" />
      </span>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {body && (
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-gray-500">{body}</p>
      )}
      {children}
    </div>
  );
}
