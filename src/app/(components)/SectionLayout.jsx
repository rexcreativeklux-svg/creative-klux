"use client";

/**
 * SectionLayout — shared shell for sections that group several pages behind a
 * secondary sidebar (Ad Intelligence, Social Content, Ads Content).
 *
 * Desktop: a slim vertical nav panel sits flush against the main sidebar
 * (matching the main sidebar's look), with the section's pages scrolling
 * independently on the right. The panel collapses to icon-only (with the same
 * hover tooltips as the primary sidebar) via its own collapse button in the
 * panel footer — state comes in via SecondarySidebarContext, owned by
 * (dashboard)/layout.js. While a section is open the PRIMARY sidebar stays
 * collapsed in the flow and hover/pin expands it as an overlay ABOVE this
 * panel (see Sidebar's overlayMode).
 * Mobile:  the same nav collapses into a horizontal, scrollable pill bar
 * pinned above the page content.
 *
 * The dashboard layout skips its default page padding for these routes (see
 * SECONDARY_SIDEBAR_ROUTES in (dashboard)/layout.js), so this shell owns the
 * full content area below the fixed header and applies the equivalent padding
 * around `children` itself.
 *
 * Usage (from a section's layout.jsx):
 *   <SectionLayout title="Ad Intelligence" items={NAV_ITEMS}>{children}</SectionLayout>
 *
 * @param {Object}   props
 * @param {string}   props.title    Section heading shown at the top of the panel
 * @param {Array<{label: string, href: string, icon: import("react").ElementType}>} props.items
 *                                  Navs rendered in the secondary sidebar
 * @param {import("react").ReactNode} props.children  The active section page
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useSecondarySidebar } from "@/context/SecondarySidebarContext";

const SectionLayout = ({ title, items, children }) => {
  const pathname = usePathname();
  const { isOpen, toggle } = useSecondarySidebar();

  const isActive = (href) =>
    pathname === href || pathname?.startsWith(href + "/");

  // ── Collapsed-panel label tooltip ──────────────────────────────
  // Same pattern as the primary sidebar: the panel clips overflow while
  // collapsed, so ONE fixed-positioned tooltip is rendered from a snapshot of
  // the hovered item's rect instead of absolute positioning inside the panel.
  const [hoverTip, setHoverTip] = useState(null);

  const showTip = (e, label, active = false) => {
    if (isOpen) return; // labels are already visible when expanded
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverTip({
      label,
      active,
      top: rect.top + rect.height / 2, // vertically centred on the icon
      left: rect.right + 14, // just outside the panel's right border
    });
  };

  const hideTip = () => setHoverTip(null);

  // Drop a stale tooltip when the panel expands (its coords no longer apply).
  // Adjusted during render (not in an effect) to avoid a cascading re-render.
  const [lastOpen, setLastOpen] = useState(isOpen);
  if (isOpen !== lastOpen) {
    setLastOpen(isOpen);
    if (isOpen) setHoverTip(null);
  }

  return (
    <div className="h-full pt-16 flex flex-col md:flex-row overflow-hidden">
      {/* ── Desktop: vertical secondary sidebar ─────────────────── */}
      <aside
        className={`hidden md:flex md:flex-col shrink-0 h-full bg-surface border-r border-gray-200
          transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? "w-52" : "w-15"}`}
      >
        {isOpen ? (
          <p className="px-5 pt-5 pb-3 text-[15px] font-semibold tracking-tight text-gray-900 truncate">
            {title}
          </p>
        ) : (
          <div className="pt-4" />
        )}
        <nav
          className={`flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar pb-4 flex flex-col gap-1 ${isOpen ? "px-3" : "px-2"}`}
          onScroll={hideTip}
        >
          {items.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150
                  ${active ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}
                  ${!isOpen ? "justify-center px-0" : ""}`}
                onMouseEnter={(e) => showTip(e, label, active)}
                onMouseLeave={hideTip}
                onFocus={(e) => showTip(e, label, active)}
                onBlur={hideTip}
              >
                {/* h-4.5 as well as w-4.5 — see the matching note in Sidebar.jsx:
                    lucide sets height="24", so width alone letterboxes the glyph. */}
                <Icon
                  className={`h-4.5 w-4.5 shrink-0 transition-transform duration-150 ${active ? "text-blue-600" : "text-gray-500 group-hover:text-gray-900"} ${!isOpen ? "group-hover:scale-110" : ""}`}
                />
                {isOpen && <span className="flex-1 truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Panel footer — this panel's own collapse/expand toggle */}
        <div
          className={`shrink-0 border-t border-gray-200 p-2 flex ${isOpen ? "justify-end" : "justify-center"}`}
        >
          <button
            onClick={toggle}
            onMouseEnter={(e) => showTip(e, "Expand")}
            onMouseLeave={hideTip}
            onFocus={(e) => showTip(e, "Expand")}
            onBlur={hideTip}
            className="p-2 rounded-lg cursor-pointer text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            aria-label={isOpen ? "Collapse panel" : "Expand panel"}
          >
            {isOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </button>
        </div>
      </aside>

      {/* Collapsed panel hover label — fixed so the panel's overflow-hidden
          can't clip it; pointer-events off so it never steals the hover. */}
      {!isOpen && hoverTip && (
        <div
          className="hidden md:block fixed z-60 pointer-events-none"
          style={{
            top: hoverTip.top,
            left: hoverTip.left,
            transform: "translateY(-50%)",
          }}
          role="tooltip"
        >
          <div className="animate-tip-in relative">
            {/* Pointer/caret aimed back at the icon */}
            <span
              className={`absolute -left-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 rounded-[3px] ${
                hoverTip.active ? "bg-blue-600" : "bg-gray-900"
              }`}
            />
            <span
              className={`relative block whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-medium shadow-lg ${
                hoverTip.active
                  ? "bg-blue-600 text-white"
                  : "bg-gray-900 text-surface"
              }`}
            >
              {hoverTip.label}
            </span>
          </div>
        </div>
      )}

      {/* ── Mobile: horizontal scrollable tab bar ───────────────── */}
      <div className="md:hidden shrink-0 bg-surface border-b border-gray-200">
        <p className="px-4 pt-3 pb-1 text-sm font-bold text-gray-900 truncate">
          {title}
        </p>
        <nav className="flex gap-2 overflow-x-auto hide-scrollbar px-4 py-2">
          {items.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors
                  ${active ? "bg-blue-50 text-blue-600 border-blue-200" : "text-gray-500 border-gray-200 hover:text-gray-900 hover:bg-gray-100"}`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Section page content ────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-y-auto bg-page">
        <div className="px-4 md:px-9 pt-6 md:pt-8 pb-20 md:pb-10">{children}</div>
      </div>
    </div>
  );
};

export default SectionLayout;
